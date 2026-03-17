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
  Row,
  Space,
  Typography,
} from "antd";
import { SafetyCertificateOutlined, TeamOutlined } from "@ant-design/icons";

type LoginFormValues = {
  identifier: string;
  password: string;
};

export const LoginPage = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutateAsync: login, isPending } = useLogin<LoginFormValues>();

  const handleSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);

    const result = await login(values);

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
            <Col xs={24} lg={12}>
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

            <Col xs={24} lg={12}>
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
                      Usa tu unidad privada para entrar al portal. El
                      administrador, gestionará usuarios, asambleas y encuestas.
                    </Typography.Paragraph>
                  </div>

                  {errorMessage ? (
                    <Alert message={errorMessage} type="error" showIcon />
                  ) : null}

                  <Form<LoginFormValues>
                    className="vr-auth-form"
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark={false}
                  >
                    <Form.Item
                      label="Unidad"
                      name="identifier"
                      rules={[
                        {
                          required: true,
                          message: "Ingresa tu unidad privada o correo.",
                        },
                      ]}
                    >
                      <Input
                        autoComplete="username"
                        placeholder="Ejemplo: M1-01 / m2-02"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="contraseña"
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
                      Ingresar al portal
                    </Button>
                  </Form>

                  <Divider style={{ margin: 0 }} />

                  <Space align="start" size={12}>
                    <TeamOutlined
                      style={{ color: "#8b4c16", fontSize: 18, marginTop: 3 }}
                    />
                    <Typography.Paragraph className="vr-auth-note">
                      En la asamblea, solo podras portar 2 poderes adicionales a
                      tu voto
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
