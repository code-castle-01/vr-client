declare global {
  interface Window {
    __APP_CONFIG__?: {
      VITE_API_URL?: string;
    };
  }
}

const DEFAULT_LOCAL_API_URL = "http://localhost:1337";

const runtimeApiUrl =
  typeof window !== "undefined" ? window.__APP_CONFIG__?.VITE_API_URL : undefined;
const buildTimeApiUrl = import.meta.env.VITE_API_URL;
const fallbackApiUrl =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? DEFAULT_LOCAL_API_URL
    : "";

export const API_URL = (runtimeApiUrl || buildTimeApiUrl || fallbackApiUrl).replace(/\/$/, "");
export const TOKEN_KEY = "strapi-jwt-token";
export const APP_NAME = "CCVR";
