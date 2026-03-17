import type { PropsWithChildren } from "react";
import { Layout } from "antd";
import { useDeviceLayout } from "../../utils/device-mode";
import { AppSider } from "../app-sider";
import { BrandTitle } from "../brand-title";
import { Header } from "../header";

export const AdminLayout = ({ children }: PropsWithChildren) => {
  const { isMobileLayout } = useDeviceLayout();

  return (
    <div className="vr-app-shell">
      <Layout className="vr-admin-layout" hasSider={!isMobileLayout}>
        <AppSider fixed Title={BrandTitle} />

        <Layout className="vr-admin-layout__main">
          <Header sticky />

          <Layout.Content className="vr-admin-layout__content">
            <div className="vr-admin-layout__content-inner">{children}</div>
          </Layout.Content>
        </Layout>
      </Layout>
    </div>
  );
};
