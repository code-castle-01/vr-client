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

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  alignItems: "center",
  background: isActive
    ? "linear-gradient(135deg, rgba(191, 122, 45, 0.16), rgba(247, 198, 106, 0.22))"
    : "rgba(255, 250, 242, 0.72)",
  border: "1px solid rgba(139, 76, 22, 0.12)",
  borderRadius: 18,
  color: "#17232f",
  display: "inline-flex",
  fontSize: 14,
  fontWeight: 700,
  gap: 8,
  justifyContent: "center",
  minHeight: 48,
  minWidth: 126,
  padding: "10px 20px",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
});

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
            <NavLink to="/representacion" style={navStyle}>
              Poderes
            </NavLink>
            <NavLink to="/encuestas" style={navStyle}>
              Encuestas
            </NavLink>
            <NavLink to="/documentos" style={navStyle}>
              Documentos
            </NavLink>
            <NavLink to="/mis-resultados" style={navStyle}>
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
