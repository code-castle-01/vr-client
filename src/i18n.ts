import type { I18nProvider } from "@refinedev/core";

const translations: Record<string, string> = {
  "buttons.save": "Guardar",
  "buttons.cancel": "Cancelar",
  "buttons.delete": "Eliminar",
  "buttons.edit": "Editar",
  "buttons.list": "Lista",
  "buttons.show": "Ver",
  "buttons.create": "Crear",
  "buttons.refresh": "Actualizar",
  "buttons.filter": "Filtrar",
  "buttons.clear": "Limpiar",
  "buttons.logout": "Cerrar sesion",
  "buttons.confirm": "Confirmar",
  "notifications.success": "Operacion exitosa",
  "notifications.createSuccess": "Se creo correctamente {{resource}}",
  "notifications.createError": "No fue posible crear {{resource}}",
  "notifications.editSuccess": "Se actualizo correctamente {{resource}}",
  "notifications.editError": "No fue posible actualizar {{resource}}",
  "notifications.deleteSuccess": "Se elimino correctamente {{resource}}",
  "notifications.deleteError": "No fue posible eliminar {{resource}}",
  "pages.error.backHome": "Volver al inicio",
  "pages.login.title": "Iniciar sesion",
  "pages.login.divider": "o",
  "pages.login.fields.email": "Correo electronico",
  "pages.login.fields.password": "Contrasena",
  "pages.login.buttons.rememberMe": "Recordarme",
  "pages.login.buttons.noAccount": "No tienes cuenta?",
  "pages.login.buttons.haveAccount": "Ya tengo cuenta",
  "pages.login.signin": "Ingresar",
  "pages.login.signup": "Crear cuenta",
  "pages.login.register": "Registrarse",
  "pages.register.title": "Crear cuenta",
  "pages.register.email": "Correo electronico",
  "pages.register.fields.email": "Correo electronico",
  "pages.register.fields.password": "Contrasena",
  "pages.register.buttons.submit": "Registrarme",
  "pages.forgotPassword.title": "Recuperar acceso",
  "pages.forgotPassword.fields.email": "Correo electronico",
  "pages.updatePassword.title": "Actualizar contrasena",
  "pages.updatePassword.fields.password": "Nueva contrasena",
  "pages.updatePassword.buttons.submit": "Actualizar contrasena",
  "warnWhenUnsavedChanges":
    "Tienes cambios sin guardar. Estas seguro de que quieres salir?",
  "agenda-items.name": "Encuestas",
  "agenda-items.titles.list": "Encuestas",
  "agenda-items.titles.create": "Crear encuesta",
  "agenda-items.titles.edit": "Editar encuesta",
  "agenda-items.titles.show": "Detalle de encuesta",
  "assemblies.name": "Asambleas",
  "assemblies.titles.list": "Asambleas",
  "assemblies.titles.create": "Crear asamblea",
  "assemblies.titles.edit": "Editar asamblea",
  "assemblies.titles.show": "Detalle de asamblea",
  "users.name": "Usuarios",
  "users.titles.list": "Usuarios",
  "users.titles.create": "Crear usuario",
  "users.titles.edit": "Editar usuario",
  "users.titles.show": "Detalle de usuario",
  "meeting-documents.name": "Archivos",
  "meeting-documents.titles.list": "Archivos",
  "results-dashboard.name": "Resultados",
  "results-dashboard.titles.list": "Resultados",
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const interpolate = (
  template: string,
  params?: Record<string, unknown>,
): string => {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, token: string) => {
    const value = params?.[token.trim()];

    return value == null ? "" : String(value);
  });
};

export const i18nProvider: I18nProvider = {
  translate: (
    key: string,
    params?: Record<string, unknown>,
    defaultMessage?: string,
  ) => {
    const safeParams = isRecord(params) ? params : undefined;
    const message =
      translations[key] ??
      (typeof defaultMessage === "string" ? defaultMessage : key);

    return interpolate(message, safeParams);
  },
  changeLocale: async () => "es",
  getLocale: () => "es",
};
