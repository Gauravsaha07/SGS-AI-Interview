export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5511"
).replace(/\/$/, "");

export const API_URL = `${API_BASE_URL}/api`;
