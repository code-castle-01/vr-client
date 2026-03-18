import { useState } from "react";
import { useLogin } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Radio,
  Row,
  Space,
  Tabs,
  Typography,
} from "antd";
import {
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useDeviceLayout } from "../../utils/device-mode";

type ResidentLoginFormValues = {
  loginType: "resident";
  residentAccessMode: "owner" | "proxy";
  unit: string;
};

type AdminLoginFormValues = {
  identifier: string;
  loginType: "admin";
  password: string;
};

type LoginFormValues = ResidentLoginFormValues | AdminLoginFormValues;

const normalizeUnit = (value?: string) => value?.trim().toUpperCase() ?? "";

export const LoginPage = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutateAsync: login, isPending } = useLogin<LoginFormValues>();
  const { isMobileLayout } = useDeviceLayout();

  const handleResidentSubmit = async (values: ResidentLoginFormValues) => {
    setErrorMessage(null);

    const result = await login({
      ...values,
      loginType: "resident",
      unit: normalizeUnit(values.unit),
    });

    if (result?.success === false) {
      setErrorMessage(
        result.error?.name ??
          result.error?.message ??
          "No fue posible iniciar sesion.",
      );
    }
  };

  const handleAdminSubmit = async (values: AdminLoginFormValues) => {
    setErrorMessage(null);

    const result = await login({
      ...values,
      loginType: "admin",
    });

    if (result?.success === false) {
      setErrorMessage(
        result.error?.name ??
          result.error?.message ??
          "No fue posible iniciar sesion.",
      );
    }
  };

  return (
    <Row align="middle" justify="center" className="vr-auth-shell">
      <Col xs={24} lg={22} xl={20}>
        <Card
          variant="borderless"
          styles={{ body: { padding: 0 } }}
          className="vr-auth-card"
        >
          <Row gutter={0}>
            <Col xs={24} lg={isMobileLayout ? 24 : 12}>
              <div className="vr-auth-brand">
                <div className="vr-auth-brand-media">
                  <video
                    className="vr-auth-brand-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/logo-ui.png"
                    preload="metadata"
                  >
                    <source src="/VR-VIDEO.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={isMobileLayout ? 24 : 12}>
              <div className="vr-auth-form-wrap">
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                  <div className="vr-auth-badge">
                    <SafetyCertificateOutlined />
                    Acceso seguro
                  </div>

                  <div>
                    <Typography.Title level={2} className="vr-auth-panel-title">
                      Ingreso a la asamblea
                    </Typography.Title>
                    <Typography.Paragraph className="vr-auth-panel-copy">
                      Si es residentes entrar como <b>PROPIETARIO</b> y su
                      unidad.
                    </Typography.Paragraph>
                    <Typography.Paragraph className="vr-auth-panel-copy">
                      Si es viene a representar entrar como <b>APODERADO</b> y
                      la unidad. y el modo de representacion.
                    </Typography.Paragraph>
                    <Typography.Paragraph className="vr-auth-panel-copy">
                      El <i>ADMINISTRADOR</i> gestiona usuarios, asambleas y
                      encuestas.
                    </Typography.Paragraph>
                  </div>

                  {errorMessage ? (
                    <Alert message={errorMessage} type="error" showIcon />
                  ) : null}

                  <Tabs
                    defaultActiveKey="resident"
                    items={[
                      {
                        key: "resident",
                        label: "Residente",
                        children: (
                          <Form<ResidentLoginFormValues>
                            className="vr-auth-form"
                            layout="vertical"
                            onFinish={handleResidentSubmit}
                            requiredMark={false}
                            initialValues={{
                              loginType: "resident",
                              residentAccessMode: "owner",
                            }}
                          >
                            <Form.Item
                              label="Ingresas como"
                              name="residentAccessMode"
                              rules={[
                                {
                                  required: true,
                                  message:
                                    "Selecciona si ingresas como propietario o apoderado.",
                                },
                              ]}
                            >
                              <Radio.Group
                                optionType="button"
                                buttonStyle="solid"
                                size="large"
                              >
                                <Radio.Button value="owner">
                                  PROPIETARIO
                                </Radio.Button>
                                <Radio.Button value="proxy">
                                  APODERADO
                                </Radio.Button>
                              </Radio.Group>
                            </Form.Item>
                            <Form.Item
                              label="Unidad"
                              name="unit"
                              normalize={normalizeUnit}
                              rules={[
                                {
                                  required: true,
                                  message: "Ingresa tu unidad privada.",
                                },
                              ]}
                            >
                              <Input
                                autoComplete="username"
                                placeholder="Ejemplo: M1-01"
                                size="large"
                              />
                            </Form.Item>

                            <Button
                              block
                              className="vr-auth-submit"
                              htmlType="submit"
                              loading={isPending}
                              size="large"
                              type="primary"
                            >
                              Ingresar al portal
                            </Button>
                          </Form>
                        ),
                      },
                      {
                        key: "admin",
                        label: "Administrador",
                        children: (
                          <Form<AdminLoginFormValues>
                            className="vr-auth-form"
                            layout="vertical"
                            onFinish={handleAdminSubmit}
                            requiredMark={false}
                            initialValues={{
                              loginType: "admin",
                            }}
                          >
                            <Form.Item
                              label="Usuario o correo"
                              name="identifier"
                              rules={[
                                {
                                  required: true,
                                  message:
                                    "Ingresa tu usuario o correo administrativo.",
                                },
                              ]}
                            >
                              <Input
                                autoComplete="username"
                                placeholder="usuario@dominio.com"
                                size="large"
                              />
                            </Form.Item>

                            <Form.Item
                              label="Contraseña"
                              name="password"
                              rules={[
                                {
                                  required: true,
                                  message: "Ingresa tu contraseña.",
                                },
                              ]}
                            >
                              <Input.Password
                                autoComplete="current-password"
                                placeholder="Ingresa tu contraseña"
                                size="large"
                              />
                            </Form.Item>

                            <Button
                              block
                              className="vr-auth-submit"
                              htmlType="submit"
                              loading={isPending}
                              size="large"
                              type="primary"
                            >
                              Ingresar al panel
                            </Button>
                          </Form>
                        ),
                      },
                    ]}
                  />

                  <Divider style={{ margin: 0 }} />

                  <Space align="start" size={12}>
                    <TeamOutlined
                      style={{ color: "#8b4c16", fontSize: 18, marginTop: 3 }}
                    />
                    <Typography.Paragraph className="vr-auth-note">
                      Como propietario puedes sumar hasta 2 poderes extra. Como
                      apoderado debes adjuntar primero el soporte de la unidad
                      con la que ingresaste y solo podras representar una unidad
                      adicional.
                    </Typography.Paragraph>
                  </Space>

                  <Space align="start" size={12}>
                    <UserOutlined
                      style={{ color: "#8b4c16", fontSize: 18, marginTop: 3 }}
                    />
                    <Typography.Paragraph className="vr-auth-note">
                      La unidad se normaliza siempre en mayusculas para evitar
                      errores al ingresar.
                    </Typography.Paragraph>
                  </Space>
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};
