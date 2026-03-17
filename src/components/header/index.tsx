import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import { Layout as AntdLayout, Card, theme, Typography } from "antd";
import React from "react";

const { Text, Title } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  role?: {
    name?: string | null;
  } | null;
  unit?: string | null;
};

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();

  const headerStyles: React.CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255, 251, 243, 0.88), rgba(255, 248, 238, 0.94))",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "2rem",
    minHeight: "76px",
    border: "1px solid rgba(139, 76, 22, 0.08)",
    borderRadius: 0,
    margin: "0px",
    boxShadow: "0 12px 30px rgba(23, 35, 47, 0.08)",
    backdropFilter: "blur(10px)",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 10;
  }

  return (
    <AntdLayout.Header style={headerStyles}>
      <section>
        <Text
          style={{
            color: token.colorPrimary,
            display: "block",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Portal de gestion
        </Text>
        <Title
          level={4}
          style={{
            margin: "4px 0 0",
            fontFamily: '"Cormorant Garamond", serif',
          }}
        >
          Asamblea residencial Vegas del Rio
        </Title>
      </section>

      <Card
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
