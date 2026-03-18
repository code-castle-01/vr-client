export type UserRole = {
  id?: number;
  name?: string | null;
  type?: string | null;
} | null;

export type ResidentAccessMode = "owner" | "proxy" | null;

const ADMIN_ROLES = new Set([
  "admin",
  "administrador",
  "super-admin",
  "super admin",
  "super_admin",
]);

export const isAdminRole = (role?: UserRole) => {
  const normalizedName = role?.name?.trim().toLowerCase();
  const normalizedType = role?.type?.trim().toLowerCase();

  if (normalizedName && ADMIN_ROLES.has(normalizedName)) {
    return true;
  }

  if (!normalizedType) {
    return false;
  }

  return normalizedType !== "authenticated" && normalizedType !== "public";
};
