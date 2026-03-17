const DEFAULT_API_URL = "http://localhost:1337";

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
export const TOKEN_KEY = "strapi-jwt-token";
export const APP_NAME = "Vegas del Rio";
