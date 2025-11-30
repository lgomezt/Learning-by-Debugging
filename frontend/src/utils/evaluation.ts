// evaluation.ts
// Utilities for evaluating user and agent code against test cases

export interface TestResult {
  testNumber: number;
  totalTests: number;
  passed: boolean;
  input: any;
  expectedOutput: string;
  actualOutput: string;
  error?: string;
}

export interface EvaluationResults {
  userResults: TestResult[];
  agentResults: TestResult[];
  userPassRate: number;
  agentPassRate: number;
}

/**
 * Transforms code that uses input() to accept inputs from a list instead.
 * Replaces input() calls with a mock function that returns values from the input sequence.
 */
export function transformInputCode(code: string, inputs: any[]): string {
  // Create a mock input function that returns values from the sequence
  // If we run out of inputs, return the last input value (or "1" if no inputs)
  let inputIndex = 0;
  const defaultInput = inputs.length > 0 ? inputs[inputs.length - 1] : "1";
  const inputFunction = `
def _mock_input(prompt=""):
    global _input_index
    if _input_index < len(_input_sequence):
        value = _input_sequence[_input_index]
        _input_index += 1
        return str(value)
    # If we run out of inputs, return the last input value (or default)
    return str(${JSON.stringify(defaultInput)})
_input_index = 0
_input_sequence = ${JSON.stringify(inputs)}
`;

  // Replace input() calls with _mock_input()
  // This regex matches input() and input("prompt") patterns
  const transformedCode = code.replace(/input\s*\([^)]*\)/g, '_mock_input()');

  // Wrap in a function that can be called with inputs
  return `${inputFunction}\n${transformedCode}`;
}

/**
 * Normalizes output strings for comparison (removes extra whitespace, normalizes newlines)
 */
function normalizeOutput(output: string): string {
  return output
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');
}

/**
 * Executes code in Pyodide and captures the output
 */
export async function runCodeWithInputs(
  pyodide: any,
  code: string,
  inputs: any[]
): Promise<{ output: string; error?: string }> {
  try {
    // Transform the code to use mock inputs
    const transformedCode = transformInputCode(code, inputs);

    // Capture stdout
    let output = '';
    const originalStdout = pyodide.setStdout({
      batched: (text: string) => {
        output += text;
      },
    });

    // Capture stderr
    let errorOutput = '';
    const originalStderr = pyodide.setStderr({
      batched: (text: string) => {
        errorOutput += text;
      },
    });

    try {
      // Execute the code
      await pyodide.runPythonAsync(transformedCode);
    } finally {
      // Restore original stdout/stderr (or set to undefined if there was none)
      if (originalStdout !== undefined) {
        pyodide.setStdout(originalStdout);
      } else {
        pyodide.setStdout({ batched: () => {} });
      }
      if (originalStderr !== undefined) {
        pyodide.setStderr(originalStderr);
      } else {
        pyodide.setStderr({ batched: () => {} });
      }
    }

    return {
      output: normalizeOutput(output),
      error: errorOutput ? normalizeOutput(errorOutput) : undefined,
    };
  } catch (error: any) {
    return {
      output: '',
      error: error?.message || String(error),
    };
  }
}

/**
 * Executes the evaluation code to extract test cases
 * The evaluation code should define a variable or function that returns test cases
 * Expected format: test_cases = [[input1, input2, ...], [input3, input4, ...], ...]
 */
export async function extractTestCases(
  pyodide: any,
  evaluationCode: string
): Promise<any[][]> {
  try {
    // Execute the evaluation code
    await pyodide.runPythonAsync(evaluationCode);

    // Try to get test_cases variable
    let testCases: any[][];
    try {
      const testCasesPy = pyodide.globals.get('test_cases');
      if (testCasesPy) {
        testCases = testCasesPy.toJs();
        // Ensure it's an array
        if (!Array.isArray(testCases)) {
          throw new Error('test_cases must be a list');
        }
      } else {
        throw new Error('test_cases variable not found');
      }
    } catch (err: any) {
      // If test_cases doesn't exist, try to call a function
      try {
        const getTestCases = pyodide.globals.get('get_test_cases');
        if (getTestCases) {
          const result = getTestCases();
          testCases = result.toJs();
          if (!Array.isArray(testCases)) {
            throw new Error('get_test_cases() must return a list');
          }
        } else {
          throw new Error('No test_cases variable or get_test_cases function found');
        }
      } catch (funcErr: any) {
        throw new Error(`Failed to get test cases: ${err?.message || funcErr?.message || String(funcErr)}`);
      }
    }

    // Ensure testCases is an array of arrays
    if (!Array.isArray(testCases)) {
      throw new Error('test_cases must be a list of lists');
    }

    return testCases.map((tc: any) => (Array.isArray(tc) ? tc : [tc]));
  } catch (error: any) {
    throw new Error(`Failed to extract test cases: ${error?.message || String(error)}`);
  }
}

/**
 * Main evaluation function that runs all tests
 */
export async function evaluateCode(
  pyodide: any,
  userCode: string,
  agentCode: string,
  suggestedAnswer: string,
  evaluationCode: string
): Promise<EvaluationResults> {
  // Extract test cases from evaluation code
  const testCases = await extractTestCases(pyodide, evaluationCode);

  const userResults: TestResult[] = [];
  const agentResults: TestResult[] = [];

  // Run each test case
  for (let i = 0; i < testCases.length; i++) {
    const testInputs = testCases[i];

    // Run suggested answer to get expected output
    const expectedResult = await runCodeWithInputs(pyodide, suggestedAnswer, testInputs);
    const expectedOutput = expectedResult.output;

    // Run user code
    const userResult = await runCodeWithInputs(pyodide, userCode, testInputs);
    const userPassed = normalizeOutput(userResult.output) === expectedOutput && !userResult.error;

    userResults.push({
      testNumber: i + 1,
      totalTests: testCases.length,
      passed: userPassed,
      input: testInputs,
      expectedOutput: expectedOutput,
      actualOutput: userResult.output,
      error: userResult.error,
    });

    // Run agent code
    const agentResult = await runCodeWithInputs(pyodide, agentCode, testInputs);
    const agentPassed = normalizeOutput(agentResult.output) === expectedOutput && !agentResult.error;

    agentResults.push({
      testNumber: i + 1,
      totalTests: testCases.length,
      passed: agentPassed,
      input: testInputs,
      expectedOutput: expectedOutput,
      actualOutput: agentResult.output,
      error: agentResult.error,
    });
  }

  // Calculate pass rates
  const userPassRate = (userResults.filter((r) => r.passed).length / userResults.length) * 100;
  const agentPassRate = (agentResults.filter((r) => r.passed).length / agentResults.length) * 100;

  return {
    userResults,
    agentResults,
    userPassRate,
    agentPassRate,
  };
}

