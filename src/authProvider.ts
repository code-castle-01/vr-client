import type { AuthProvider } from "@refinedev/core";
import axios from "axios";
import { API_URL, TOKEN_KEY } from "./constants";

export const axiosInstance = axios.create();
const LOGIN_ROUTE = "/login";

type CurrentAccount = {
  Coeficiente?: number | string | null;
  EstadoCartera?: boolean | null;
  NombreCompleto?: string | null;
  UnidadPrivada?: string | null;
  email: string;
  id: number;
  role?: {
    id?: number;
    name?: string | null;
    type?: string | null;
  } | null;
  username: string;
};

type UpdateCurrentAccountNameResponse = CurrentAccount;

const clearBrowserSession = () => {
  delete axiosInstance.defaults.headers.common.Authorization;

  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.clear();
  window.sessionStorage.clear();
};

export const getCurrentAccount = async () => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return null;
  }

  try {
    const { data, status } = await axiosInstance.get(`${API_URL}/api/account/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (status !== 200) {
      return null;
    }

    return data as CurrentAccount;
  } catch {
    clearBrowserSession();
    return null;
  }
};

export const updateCurrentAccountName = async (
  NombreCompleto: string,
): Promise<UpdateCurrentAccountNameResponse> => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("No encontramos una sesion activa.");
  }

  const normalizedName = NombreCompleto.trim().replace(/\s+/g, " ");

  if (!normalizedName) {
    throw new Error("Debes escribir el nombre que deseas guardar.");
  }

  const { data, status } = await axiosInstance.patch(
    `${API_URL}/api/account/me`,
    { NombreCompleto: normalizedName },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (status !== 200) {
    throw new Error("No pudimos actualizar tu nombre en este momento.");
  }

  return data as UpdateCurrentAccountNameResponse;
};

export const authProvider: AuthProvider = {
  login: async ({ email, password, identifier, username }) => {
    const loginIdentifier = identifier ?? username ?? email;

    if (!loginIdentifier || !password) {
      return {
        success: false,
        error: {
          message: "Error de inicio de sesion",
          name: "Debes ingresar el identificador y la contrasena.",
        },
      };
    }

    const { data, status } = await axios.post(`${API_URL}/api/auth/local`, {
      identifier: loginIdentifier,
      password,
    });
    if (status === 200) {
      localStorage.setItem(TOKEN_KEY, data.jwt);

      // set header axios instance
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${data.jwt}`;

      return {
        success: true,
        redirectTo: "/",
      };
    }
    return {
      success: false,
      error: {
        message: "Error de inicio de sesion",
        name: "El identificador o la contrasena no son validos.",
      },
    };
  },
  register: async ({ email, password }) => {
    try {
      const { data, status } = await axiosInstance.post(API_URL + "/api/auth/local/register", {
        username: email,
        email,
        password,
      });

      if (status === 200) {
        localStorage.setItem(TOKEN_KEY, data.jwt);
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.jwt}`;

        return {
          success: true,
          redirectTo: "/",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: "Error de registro",
          name: error.response?.data?.error?.message || "Los datos de registro no son validos.",
        },
      };
    }
    return {
      success: false,
      error: {
        message: "Error de registro",
        name: "Ocurrio un error inesperado.",
      },
    };
  },
  logout: async () => {
    clearBrowserSession();

    if (typeof window !== "undefined" && window.location.pathname !== LOGIN_ROUTE) {
      window.location.replace(LOGIN_ROUTE);
    }

    return {
      success: true,
      redirectTo: LOGIN_ROUTE,
    };
  },
  onError: async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearBrowserSession();

      return {
        logout: true,
        redirectTo: LOGIN_ROUTE,
        error,
      };
    }

    console.error(error);
    return { error };
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
      return {
        authenticated: true,
      };
    }

    clearBrowserSession();

    return {
      authenticated: false,
      error: {
        message: "Sesion no valida",
        name: "No se encontro el token de acceso.",
      },
      logout: true,
      redirectTo: LOGIN_ROUTE,
    };
  },
  getIdentity: async () => {
    const account = await getCurrentAccount();

    if (!account) {
      return null;
    }

    const { id, username, email, NombreCompleto, UnidadPrivada, role } = account;

    return {
      id,
      name: NombreCompleto ?? UnidadPrivada ?? username,
      email,
      role,
      unit: UnidadPrivada ?? null,
    };
  },
  getPermissions: async () => {
    const account = await getCurrentAccount();
    return account?.role ?? null;
  },
};
