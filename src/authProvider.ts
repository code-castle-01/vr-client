import type { AuthProvider } from "@refinedev/core";
import axios from "axios";
import { API_URL, TOKEN_KEY } from "./constants";
import type { ResidentAccessMode } from "./auth-utils";

export const axiosInstance = axios.create();
const LOGIN_ROUTE = "/login";
const normalizeUnit = (value?: string | null) => value?.trim().toUpperCase() ?? "";

type CurrentAccount = {
  Coeficiente?: number | string | null;
  EstadoCartera?: boolean | null;
  NombreCompleto?: string | null;
  UnidadPrivada?: string | null;
  email: string;
  id: number;
  residentAccessMode?: ResidentAccessMode;
  residentLegalAcceptance?: {
    acceptedAt?: string | null;
    acceptedVersion?: string | null;
    currentVersion?: string | null;
    requiresAcceptance?: boolean;
  } | null;
  role?: {
    id?: number;
    name?: string | null;
    type?: string | null;
  } | null;
  username: string;
};

type UpdateCurrentAccountNameResponse = CurrentAccount;

type LoginParams = {
  email?: string;
  identifier?: string;
  legalAccepted?: boolean;
  legalVersion?: string;
  loginType?: "admin" | "resident";
  password?: string;
  residentAccessMode?: ResidentAccessMode;
  unit?: string;
  username?: string;
};

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
    const { data, status } = await axiosInstance.get(
      `${API_URL}/api/account/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

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
  login: async (params) => {
    const {
      email,
      identifier,
      legalAccepted,
      legalVersion,
      loginType,
      password,
      residentAccessMode,
      unit,
      username,
    } = params as LoginParams;

    try {
      if (loginType === "resident" || unit) {
        const normalizedUnit = normalizeUnit(unit ?? identifier ?? username ?? email);

        if (!normalizedUnit || !residentAccessMode) {
          return {
            success: false,
            error: {
              message: "Error de inicio de sesion",
              name: "Debes ingresar la unidad y seleccionar propietario o apoderado.",
            },
          };
        }

        const { data, status } = await axios.post(
          `${API_URL}/api/account/resident-login`,
          {
            legalAccepted: legalAccepted === true,
            legalVersion: legalVersion ?? null,
            residentAccessMode,
            unit: normalizedUnit,
          },
        );

        if (status === 200) {
          localStorage.setItem(TOKEN_KEY, data.jwt);
          axiosInstance.defaults.headers.common.Authorization = `Bearer ${data.jwt}`;

          return {
            success: true,
            redirectTo: "/",
          };
        }
      } else {
        const loginIdentifier = identifier ?? username ?? email;

        if (!loginIdentifier || !password) {
          return {
            success: false,
            error: {
              message: "Error de inicio de sesion",
              name: "Debes ingresar el identificador y la contraseña.",
            },
          };
        }

        const { data, status } = await axios.post(`${API_URL}/api/auth/local`, {
          identifier: loginIdentifier,
          password,
        });

        if (status === 200) {
          localStorage.setItem(TOKEN_KEY, data.jwt);
          axiosInstance.defaults.headers.common.Authorization = `Bearer ${data.jwt}`;

          return {
            success: true,
            redirectTo: "/",
          };
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error)
          ? error.response?.data?.error?.message ||
            error.response?.data?.message ||
            error.message
          : error instanceof Error
            ? error.message
            : "No fue posible iniciar sesion.";

      return {
        success: false,
        error: {
          message: "Error de inicio de sesion",
          name: errorMessage,
        },
      };
    }

    return {
      success: false,
      error: {
        message: "Error de inicio de sesion",
        name: "No fue posible iniciar sesion con los datos proporcionados.",
      },
    };
  },
  register: async ({ email, password }) => {
    try {
      const { data, status } = await axiosInstance.post(
        API_URL + "/api/auth/local/register",
        {
          username: email,
          email,
          password,
        },
      );

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
          name:
            error.response?.data?.error?.message ||
            "Los datos de registro no son validos.",
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

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== LOGIN_ROUTE
    ) {
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

    const { id, username, email, NombreCompleto, UnidadPrivada, role } =
      account;

    return {
      accessMode: account.residentAccessMode ?? null,
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
