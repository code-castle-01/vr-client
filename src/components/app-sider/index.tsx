import {
  BarsOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import {
  type TreeMenuItem,
  useIsExistAuthentication,
  useLogout,
  useMenu,
  useTranslate,
  useWarnAboutChange,
} from "@refinedev/core";
import {
  Button,
  Drawer,
  Layout,
  Menu,
  theme,
  type MenuProps,
} from "antd";
import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { useDeviceLayout } from "../../utils/device-mode";

type AppSiderProps = {
  Title?: React.ComponentType<{
    collapsed?: boolean;
  }>;
  fixed?: boolean;
  meta?: Record<string, unknown>;
};

const DRAWER_BUTTON_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 16,
  left: 16,
  zIndex: 1001,
  borderRadius: 999,
  width: 44,
  height: 44,
  boxShadow: "0 12px 28px rgba(23, 35, 47, 0.18)",
};

const SIDER_WIDTH = 220;

const buildMenuItems = (tree: TreeMenuItem[]): MenuProps["items"] =>
  tree.map((item) => {
    const label = item.label ?? item.meta?.label ?? item.name;
    const route = item.list ?? item.route ?? "";

    return {
      children: item.children.length ? buildMenuItems(item.children) : undefined,
      icon: item.meta?.icon,
      key: item.key,
      label: route ? <Link to={route}>{label}</Link> : label,
    };
  });

export const AppSider = ({ Title, fixed = false, meta }: AppSiderProps) => {
  const { token } = theme.useToken();
  const { menuItems, selectedKey, defaultOpenKeys } = useMenu({ meta });
  const { mutate: logout } = useLogout();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const translate = useTranslate();
  const isAuthenticated = useIsExistAuthentication();
  const { isMobileLayout } = useDeviceLayout();
  const [mobileSiderOpen, setMobileSiderOpen] = useState(false);

  const titleNode = Title ? <Title collapsed={false} /> : null;
  const items = buildMenuItems(menuItems);

  useEffect(() => {
    if (!isMobileLayout) {
      setMobileSiderOpen(false);
    }
  }, [isMobileLayout]);

  const handleLogout = () => {
    if (warnWhen) {
      const shouldLeave = window.confirm(
        translate(
          "warnWhenUnsavedChanges",
          "Are you sure you want to leave? You have unsaved changes.",
        ),
      );

      if (!shouldLeave) {
        return;
      }

      setWarnWhen(false);
    }

    logout();
  };

  const menuItemsWithLogout: MenuProps["items"] = [
    ...(items ?? []),
    isAuthenticated
      ? {
          icon: <LogoutOutlined />,
          key: "logout",
          label: translate("buttons.logout", "Cerrar sesion"),
        }
      : null,
  ];

  const menuNode = (
    <Menu
      className="vr-app-sider-menu"
      mode="inline"
      items={menuItemsWithLogout}
      selectedKeys={selectedKey ? [selectedKey] : []}
      defaultOpenKeys={defaultOpenKeys}
      onClick={({ key }) => {
        if (key === "logout") {
          handleLogout();
        }

        if (isMobileLayout) {
          setMobileSiderOpen(false);
        }
      }}
      style={{
        border: "none",
        height: "calc(100% - 72px)",
        overflow: "auto",
        paddingTop: 8,
      }}
    />
  );

  if (isMobileLayout) {
    return (
      <>
        <Drawer
          open={mobileSiderOpen}
          onClose={() => setMobileSiderOpen(false)}
          closable={false}
          placement="left"
          width={SIDER_WIDTH}
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <Layout.Sider
            width={SIDER_WIDTH}
            style={{
              background:
                "linear-gradient(180deg, rgba(23, 35, 47, 0.98) 0%, rgba(29, 41, 54, 0.98) 100%)",
              borderInlineEnd: "1px solid rgba(244, 213, 154, 0.12)",
              minHeight: "100dvh",
            }}
          >
            <div className="vr-brand-title">{titleNode}</div>
            {menuNode}
          </Layout.Sider>
        </Drawer>

        <Button
          icon={<BarsOutlined />}
          onClick={() => setMobileSiderOpen(true)}
          style={{
            ...DRAWER_BUTTON_STYLE,
            background: token.colorBgContainer,
          }}
          type="default"
        />
      </>
    );
  }

  return (
    <>
      {fixed ? <div style={{ width: SIDER_WIDTH }} /> : null}
      <Layout.Sider
        width={SIDER_WIDTH}
        style={{
          background:
            "linear-gradient(180deg, rgba(23, 35, 47, 0.98) 0%, rgba(29, 41, 54, 0.98) 100%)",
          borderInlineEnd: "1px solid rgba(244, 213, 154, 0.12)",
          ...(fixed
            ? {
                height: "100dvh",
                left: 0,
                position: "fixed",
                top: 0,
                zIndex: 999,
              }
            : null),
        }}
      >
        <div className="vr-brand-title">{titleNode}</div>
        {menuNode}
      </Layout.Sider>
    </>
  );
};
