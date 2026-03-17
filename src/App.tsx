import { Refine, Authenticated, CanAccess } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
  AuditOutlined,
  BankOutlined,
  FileTextOutlined,
  LineChartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  AuthPage,
  ErrorComponent,
  ThemedLayout,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { DataProvider } from "@refinedev/strapi-v4";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { accessControlProvider } from "./accessControlProvider";
import { authProvider, axiosInstance } from "./authProvider";
import {
  AdminOnly,
  AppSider,
  AppErrorBoundary,
  BrandTitle,
  ResidentLayout,
  ResidentOnly,
  RoleLanding,
} from "./components";
import { AppIcon } from "./components/app-icon";
import { Header } from "./components/header";
import { API_URL, APP_NAME } from "./constants";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { i18nProvider } from "./i18n";
import { LoginPage } from "./pages/auth";
import {
  AgendaItemCreate,
  AgendaItemEdit,
  AgendaItemList,
  AgendaItemShow,
} from "./pages/agenda-items";
import {
  AssemblyCreate,
  AssemblyEdit,
  AssemblyList,
  AssemblyShow,
} from "./pages/assemblies";
import { AdminDocumentsPage, ResidentDocumentsPage } from "./pages/documents";
import { AdminResultsPage } from "./pages/results";
import {
  ProxyCenterPage,
  ResidentResultsPage,
  ResidentSurveysPage,
} from "./pages/resident";
import { UserCreate, UserEdit, UserList } from "./pages/users";

const formatDocumentTitle = ({
  pathname,
  resource,
}: {
  pathname?: string;
  resource?: {
    meta?: {
      label?: string;
    };
  };
}) => {
  if (pathname === "/login") {
    return `Login | ${APP_NAME}`;
  }

  const resourceLabel = resource?.meta?.label?.trim();

  if (resourceLabel) {
    return `${resourceLabel} | ${APP_NAME}`;
  }

  return APP_NAME;
};

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <AppErrorBoundary>
                <Refine
                  accessControlProvider={accessControlProvider}
                  authProvider={authProvider}
                  dataProvider={DataProvider(`${API_URL}/api`, axiosInstance)}
                  i18nProvider={i18nProvider}
                  notificationProvider={useNotificationProvider}
                  routerProvider={routerProvider}
                  resources={[
                    {
                      name: "assemblies",
                      list: "/assemblies",
                      create: "/assemblies/create",
                      edit: "/assemblies/edit/:id",
                      show: "/assemblies/show/:id",
                      meta: {
                        canDelete: true,
                        label: "Asambleas",
                        icon: <BankOutlined />,
                      },
                    },
                    {
                      name: "agenda-items",
                      list: "/agenda-items",
                      create: "/agenda-items/create",
                      edit: "/agenda-items/edit/:id",
                      show: "/agenda-items/show/:id",
                      meta: {
                        canDelete: true,
                        label: "Encuestas",
                        icon: <AuditOutlined />,
                      },
                    },
                    {
                      name: "users",
                      list: "/users",
                      create: "/users/create",
                      edit: "/users/edit/:id",
                      meta: {
                        label: "Usuarios",
                        icon: <TeamOutlined />,
                      },
                    },
                    {
                      name: "meeting-documents",
                      list: "/archivos",
                      meta: {
                        label: "Archivos",
                        icon: <FileTextOutlined />,
                      },
                    },
                    {
                      name: "results-dashboard",
                      list: "/resultados",
                      meta: {
                        label: "Resultados",
                        icon: <LineChartOutlined />,
                      },
                    },
                    {
                      name: "vote-options",
                      meta: {
                        hide: true,
                      },
                    },
                  ]}
                  options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: true,
                    projectId: "1JRKeq-TPQlb4-x696Pl",
                    title: {
                      text: APP_NAME,
                      icon: <AppIcon />,
                    },
                  }}
                >
                  <Routes>
                    <Route
                      element={
                        <Authenticated
                          key="authenticated-inner"
                          fallback={<CatchAllNavigate to="/login" />}
                        >
                          <Outlet />
                        </Authenticated>
                      }
                    >
                      <Route index element={<RoleLanding />} />
                      <Route element={<AdminOnly />}>
                        <Route
                          element={
                            <div className="vr-app-shell">
                              <ThemedLayout
                                Header={Header}
                                Title={BrandTitle}
                                Sider={(props) => (
                                  <AppSider {...props} fixed Title={BrandTitle} />
                                )}
                              >
                                <Outlet />
                              </ThemedLayout>
                            </div>
                          }
                        >
                        <Route
                          path="/administracion"
                          element={<NavigateToResource resource="assemblies" />}
                        />
                          <Route path="/assemblies">
                            <Route index element={<AssemblyList />} />
                            <Route path="create" element={<AssemblyCreate />} />
                            <Route path="edit/:id" element={<AssemblyEdit />} />
                            <Route path="show/:id" element={<AssemblyShow />} />
                          </Route>
                          <Route
                            path="/agenda-items"
                            element={
                              <CanAccess
                                resource="agenda-items"
                                action="list"
                                fallback={<ErrorComponent />}
                              >
                                <Outlet />
                              </CanAccess>
                            }
                          >
                            <Route index element={<AgendaItemList />} />
                            <Route
                              path="create"
                              element={<AgendaItemCreate />}
                            />
                            <Route
                              path="edit/:id"
                              element={<AgendaItemEdit />}
                            />
                            <Route
                              path="show/:id"
                              element={<AgendaItemShow />}
                            />
                          </Route>
                          <Route
                            path="/users"
                            element={
                              <CanAccess
                                resource="users"
                                action="list"
                                fallback={<ErrorComponent />}
                              >
                                <Outlet />
                              </CanAccess>
                            }
                          >
                            <Route index element={<UserList />} />
                            <Route path="create" element={<UserCreate />} />
                            <Route path="edit/:id" element={<UserEdit />} />
                          </Route>
                          <Route
                            path="/archivos"
                            element={
                              <CanAccess
                                resource="meeting-documents"
                                action="list"
                                fallback={<ErrorComponent />}
                              >
                                <AdminDocumentsPage />
                              </CanAccess>
                            }
                          />
                          <Route path="/resultados" element={<AdminResultsPage />} />
                        </Route>
                      </Route>
                      <Route element={<ResidentOnly />}>
                        <Route element={<ResidentLayout />}>
                          <Route
                            path="/representacion"
                            element={<ProxyCenterPage />}
                          />
                          <Route
                            path="/encuestas"
                            element={<ResidentSurveysPage />}
                          />
                          <Route
                            path="/documentos"
                            element={<ResidentDocumentsPage />}
                          />
                          <Route
                            path="/mis-resultados"
                            element={<ResidentResultsPage />}
                          />
                        </Route>
                      </Route>
                      <Route path="*" element={<ErrorComponent />} />
                    </Route>
                    <Route
                      element={
                        <Authenticated
                          key="authenticated-outer"
                          fallback={<Outlet />}
                        >
                          <NavigateToResource />
                        </Authenticated>
                      }
                    >
                      <Route path="/login" element={<LoginPage />} />
                      <Route
                        path="/register"
                        element={<AuthPage type="register" />}
                      />
                      <Route
                        path="/forgot-password"
                        element={<AuthPage type="forgotPassword" />}
                      />
                    </Route>
                  </Routes>

                  <RefineKbar />
                  <UnsavedChangesNotifier />
                  <DocumentTitleHandler handler={formatDocumentTitle} />
                </Refine>
              </AppErrorBoundary>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
