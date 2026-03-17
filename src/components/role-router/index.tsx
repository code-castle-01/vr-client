import { useGetIdentity } from "@refinedev/core";
import { Result, Typography } from "antd";
import { Navigate, Outlet } from "react-router";
import { isAdminRole, type UserRole } from "../../auth-utils";

type Identity = {
  role?: UserRole;
};

const LoadingScreen = () => (
  <div className="vr-loading-screen">
    <div className="vr-loading-screen__inner">
      <div className="vr-loading-screen__logo-shell">
        <img
          className="vr-loading-screen__logo"
          src="/logo.png"
          alt="Logo de Vegas del Rio"
        />
      </div>
      <Typography.Text className="vr-loading-screen__label">
        Ingresando al portal
      </Typography.Text>
      <Typography.Text className="vr-loading-screen__hint">
        Estamos preparando tu experiencia.
      </Typography.Text>
    </div>
  </div>
);

export const RoleLanding = () => {
  const { data, isLoading } = useGetIdentity<Identity>();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Navigate
      to={isAdminRole(data?.role) ? "/assemblies" : "/representacion"}
      replace
    />
  );
};

export const AdminOnly = () => {
  const { data, isLoading } = useGetIdentity<Identity>();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAdminRole(data?.role)) {
    return <Navigate to="/representacion" replace />;
  }

  return <Outlet />;
};

export const ResidentOnly = () => {
  const { data, isLoading } = useGetIdentity<Identity>();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAdminRole(data?.role)) {
    return <Navigate to="/assemblies" replace />;
  }

  return <Outlet />;
};

export const ResidentBlockedVote = () => {
  return (
    <Result
      status="warning"
      title="Tu unidad ya se encuentra representada"
      subTitle="No puedes emitir un voto directo porque otro residente registró un poder para representarte en esta asamblea."
    />
  );
};
