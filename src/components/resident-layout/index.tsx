import { EditOutlined, HomeFilled, LogoutOutlined } from "@ant-design/icons";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { Button, Flex, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { updateCurrentAccountName } from "../../authProvider";

type Identity = {
  name?: string | null;
  unit?: string | null;
};

const getNavClassName = ({ isActive }: { isActive: boolean }) =>
  `vr-resident-nav__link${isActive ? " vr-resident-nav__link--active" : ""}`;

export const ResidentLayout = () => {
  const { data: identity, refetch } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();
  const [messageApi, contextHolder] = message.useMessage();
  const [displayName, setDisplayName] = useState("Residente");
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    setDisplayName(identity?.name?.trim() || "Residente");
  }, [identity?.name]);

  const handleNameUpdate = async (nextValue: string) => {
    const normalizedName = nextValue.trim().replace(/\s+/g, " ");

    if (!normalizedName) {
      messageApi.warning(
        "Escribe el nombre que deseas mostrar en la asamblea.",
      );
      setDisplayName(identity?.name?.trim() || "Residente");
      return;
    }

    if (normalizedName === (identity?.name?.trim() || "Residente")) {
      setDisplayName(normalizedName);
      return;
    }

    setIsSavingName(true);

    try {
      const updatedAccount = await updateCurrentAccountName(normalizedName);

      setDisplayName(
        updatedAccount.NombreCompleto?.trim() ||
          updatedAccount.UnidadPrivada?.trim() ||
          updatedAccount.username ||
          "Residente",
      );

      await refetch?.();
      messageApi.success("Tu nombre quedo actualizado correctamente.");
    } catch (error) {
      setDisplayName(identity?.name?.trim() || "Residente");
      messageApi.error(
        error instanceof Error
          ? error.message
          : "No pudimos actualizar tu nombre en este momento.",
      );
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <main className="vr-resident-shell">
      {contextHolder}
      <div className="vr-resident-frame">
        <Flex
          className="vr-resident-header"
          justify="space-between"
          align="center"
          gap={24}
        >
          <div className="vr-resident-brand">
            <img src="/logo.png" alt="Logo Vegas del Rio" width={60} />

            <div className="vr-resident-greeting">
              <Typography.Text className="vr-resident-kicker">
                <small>Bienvenido, </small>
              </Typography.Text>
              <Typography.Text
                className="vr-resident-name"
                editable={{
                  icon: <EditOutlined />,
                  tooltip: "Haz clic para editar tu nombre",
                  onChange: handleNameUpdate,
                  triggerType: ["icon"],
                  maxLength: 140,
                  autoSize: { minRows: 1, maxRows: 2 },
                  enterIcon: null,
                }}
              >
                {displayName}
              </Typography.Text>
            </div>
          </div>

          <div className="vr-resident-header-action">
            <Button
              size="small"
              onClick={() => logout()}
              type="link"
              icon={<LogoutOutlined />}
              disabled={isSavingName}
            >
              Salir
            </Button>
          </div>
        </Flex>

        <div className="vr-resident-banner">
          <div className="vr-resident-banner__title">Asamblea 2026</div>
          <div className="vr-resident-banner__unit">
            <span>{identity?.unit ?? "Unidad registrada"}</span>
            <HomeFilled className="vr-resident-banner__unit-icon" />
          </div>
        </div>

        <section className="vr-resident-main">
          <div className="vr-resident-nav">
            <NavLink to="/representacion" className={getNavClassName}>
              Poderes
            </NavLink>
            <NavLink to="/encuestas" className={getNavClassName}>
              Encuestas
            </NavLink>
            <NavLink to="/documentos" className={getNavClassName}>
              Documentos
            </NavLink>
            <NavLink to="/mis-resultados" className={getNavClassName}>
              Resultados
            </NavLink>
          </div>

          <div className="vr-resident-content">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
};
