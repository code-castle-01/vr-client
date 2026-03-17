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
import { APP_NAME } from "../../constants";

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
                <div className="vr-auth-badge">Conjunto residencial</div>
                <Typography.Title level={1} className="vr-auth-title">
                  {APP_NAME}
                </Typography.Title>
                <Typography.Paragraph className="vr-auth-description">
                  Gestion profesional para asambleas, control de votaciones y
                  administracion de copropietarios desde una sola plataforma.
                </Typography.Paragraph>

                <img
                  src="/logo.png"
                  alt="Logo del conjunto Vegas del Rio"
                  className="vr-auth-brand-logo"
                />

                <div className="vr-auth-points">
                  <div className="vr-auth-point">
                    <strong>Experiencia preparada para celular</strong>
                    Navega, valida y vota con una interfaz clara, elegante y
                    optimizada para pantallas pequeñas.
                  </div>
                  <div className="vr-auth-point">
                    <strong>Seguridad para la asamblea</strong>
                    Cada ingreso usa credenciales personales y conserva el
                    rastro de la sesion de trabajo.
                  </div>
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
                      Usa tu unidad privada o el correo registrado para entrar
                      al portal. Si eres administrador, desde aqui podras
                      gestionar usuarios, asambleas y encuestas.
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
                      label="Unidad o correo"
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
                        placeholder="Ej. M1-01 o m1-01"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Contrasena"
                      name="password"
                      rules={[
                        {
                          required: true,
                          message: "Ingresa tu contrasena.",
                        },
                      ]}
                    >
                      <Input.Password
                        autoComplete="current-password"
                        placeholder="Ingresa tu contrasena"
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
