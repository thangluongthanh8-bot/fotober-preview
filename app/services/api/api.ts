import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

// Environment variables in Next.js client-side MUST have NEXT_PUBLIC_ prefix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_KEY_API_CHAINZ;

console.log("API Base URL:", API_BASE_URL);
console.log("API Key exists:", !!API_KEY);

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Authorization": `Bearer ${API_KEY}`,
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    console.error("API Error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

