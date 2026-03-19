export const DEFAULT_RESIDENT_LOGIN_DISABLED_MESSAGE =
  "El administrador esta preparando el informe.";

export type ResidentAccessConfigResponse = {
  residentLoginDisabledMessage: string;
  residentLoginEnabled: boolean;
};

export type ResidentAccessAdminConfigResponse = ResidentAccessConfigResponse & {
  residentSessionRevokedAt?: string | null;
  updatedAt?: string | null;
  updatedByUserId?: number | null;
};
