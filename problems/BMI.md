---
title: "Warm Up: BMI Calculator"
description: "Health data analysis often requires converting raw measurements into standardized indices. In this problem, you will build a basic Body Mass Index (BMI) calculator. This exercise focuses on variable assignment, performing mathematical operations using exponents, and using f-strings for formatted output."
difficulty: "Easy"
tags:
  - python
  - arithmetic
  - variables
  - formatting
author: "Lucas"
created_at: "2026-01-08"
update_log:
  - date: "2026-01-08"
    author: "Lucas"
    description: "Initial creation of the BMI calculator challenge."
---

# Problem Statement
## Description
The **Body Mass Index (BMI)** is a simple index of weight-for-height that is commonly used to classify underweight, overweight, and obesity in adults. It is defined as the weight in kilograms divided by the square of the height in metres ($kg/m^2$).

In this exercise, you will calculate the BMI for a specific individual to ensure your logic is mathematically sound before moving on to larger datasets.

## Task

**Milestone 1**
Initialize the starting data for our subject.
1. Create a variable named `weight` and assign it the value `75`.
2. Create a variable named `height` and assign it the value `1.75`.

**Milestone 2**
Calculate the BMI.
1. Use the formula: $$BMI = \frac{weight}{height^2}$$
2. Store the result in a variable named `bmi`.
   *Hint: In Python, you can use `** 2` to square a number.*

**Milestone 3**
Display the results.
1. Print the calculated BMI. 

## Example output: 

```

24.489795918367346

```

## Evaluation
```python
# Test cases for the BMI calculator
# Since this problem has no user input, we use an empty list for the test case
# The evaluation system will compare the output of the user's code with the expected output

test_cases = [
    []  # No inputs needed - just compare the printed output
]
```

## Lesson Goals

* Understand variable assignment and data types (int vs float).
* Practice basic arithmetic operators (`/`) and power operators (`**`).
* Learn the order of operations (PEMDAS) in code.
* Output variable values combined with strings.

## Common Mistakes

* **Order of Operations:** Writing `weight / height * height` instead of `weight / (height ** 2)`.
* **Incorrect Operator:** Using `^` for exponents instead of `**`.
* **Hardcoding the Answer:** Printing the number `24.48...` directly instead of calculating it from the variables.
* **Variable Naming:** Forgetting that Python is case-sensitive.

## Suggested Answer

```python
# Milestone 1: Data Initialization
weight = 75
height = 1.75

# Milestone 2: Calculation
bmi = weight / (height ** 2)

# Milestone 3: Output
print(bmi)

```

---

# Interface

## User Input

```python
# Start your code here :D


```

## Agent Input

```python
# Initial variables provided
weight = 1.75
height = 75

```

