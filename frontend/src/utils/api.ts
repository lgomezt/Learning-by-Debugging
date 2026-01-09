// /frontend/src/utils/api.ts

// Get the API base URL from the environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function fetchProblem(file: File | string) {
  // If file is a string (problem ID or filename), fetch from the backend
  if (typeof file === 'string') {
    const isDev = import.meta.env.DEV;
    // In dev mode, use the dev endpoint with the filename (without .md)
    // In prod mode, use the UUID endpoint
    const url = isDev 
      ? `${API_BASE_URL}/problems/dev/${file}`
      : `${API_BASE_URL}/problems/${file}`;
    
    console.log(`Fetching problem from (${isDev ? 'DEV' : 'PROD'}):`, url);
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Failed to load problem: ${res.statusText}`);
    }

    return res.json();
  }

  // Otherwise, upload the file
  const formData = new FormData();
  formData.append("file", file); // key MUST match 'file' in FastAPI

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Failed to load problem: ${res.statusText}`);
  }

  return res.json();
}