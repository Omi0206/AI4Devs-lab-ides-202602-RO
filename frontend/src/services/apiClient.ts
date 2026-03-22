import axios, { type AxiosInstance } from 'axios';

export function getApiBaseUrl(): string {
  return process.env.REACT_APP_API_URL ?? 'http://localhost:3000';
}

let client: AxiosInstance | undefined;

export function getApiClient(): AxiosInstance {
  if (!client) {
    client = axios.create({
      baseURL: getApiBaseUrl(),
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });
  }
  return client;
}
