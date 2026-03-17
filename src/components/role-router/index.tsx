import { useGetIdentity } from "@refinedev/core";
import { Result, Spin } from "antd";
import { Navigate, Outlet } from "react-router";
import { isAdminRole, type UserRole } from "../../auth-utils";

type Identity = {
  role?: UserRole;
};

const LoadingScreen = () => (
  <div
    style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
    }}
  >
    <Spin size="large" />
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
