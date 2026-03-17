import { useGetIdentity } from "@refinedev/core";
import { Layout as AntdLayout, Card, Typography } from "antd";
import React from "react";

const { Text, Title } = Typography;

type IUser = {
  id: number;
  name: string;
  role?: {
    name?: string | null;
  } | null;
  unit?: string | null;
};

type HeaderProps = {
  sticky?: boolean;
};

export const Header: React.FC<HeaderProps> = ({
  sticky = true,
}) => {
  const { data: user } = useGetIdentity<IUser>();
  const headerClassName = sticky
    ? "vr-admin-header vr-admin-header--sticky"
    : "vr-admin-header";

  return (
    <AntdLayout.Header className={headerClassName}>
      <section className="vr-admin-header__copy">
        <Text className="vr-admin-header__eyebrow">
          Portal de gestion
        </Text>
        <Title
          level={4}
          className="vr-admin-header__title"
        >
          Asamblea residencial Vegas del Rio
        </Title>
      </section>

      <Card
        className="vr-admin-header__status"
        size="small"
        variant="borderless"
        styles={{
          body: {
            padding: 16,
            background:
              "linear-gradient(135deg, rgba(191, 122, 45, 0.92), rgba(247, 198, 106, 0.86))",
          },
        }}
      >
        <Card.Meta
          title={user?.role?.name ?? user?.unit ?? "Sesion activa"}
          description={user?.name ?? "Usuario"}
        />
      </Card>
    </AntdLayout.Header>
  );
};
