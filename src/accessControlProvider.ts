import type { AccessControlProvider } from "@refinedev/core";
import { getCurrentAccount } from "./authProvider";
import { isAdminRole } from "./auth-utils";

const ADMIN_RESOURCES = new Set([
  "users",
  "agenda-items",
  "assemblies",
  "compliance-dashboard",
  "results-dashboard",
  "meeting-documents",
]);

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource }) => {
    if (!resource || !ADMIN_RESOURCES.has(resource)) {
      return { can: true };
    }

    try {
      const account = await getCurrentAccount();

      if (!account?.role) {
        return {
          can: false,
          reason: "No se pudo validar el rol administrativo de la sesion.",
        };
      }

      return {
        can: isAdminRole(account.role),
        reason: "Solo el rol administrador puede acceder a esta seccion.",
      };
    } catch {
      return { can: true };
    }
  },
  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true,
    },
  },
};
