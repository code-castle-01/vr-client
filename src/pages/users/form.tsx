import type { FormInstance } from "antd";
import { Card, Col, Form, Input, InputNumber, Row, Switch, Typography } from "antd";

export type UserFormValues = {
  Coeficiente: number;
  EstadoCartera: boolean;
  NombreCompleto: string;
  UnidadPrivada: string;
  blocked: boolean;
  email: string;
  role?: number;
};

type UserFormProps = {
  form: FormInstance<UserFormValues>;
  isEdit?: boolean;
  onFinish: (values: UserFormValues) => Promise<void>;
};

export const UserForm = ({ form, isEdit, onFinish }: UserFormProps) => {
  return (
    <Form<UserFormValues>
      form={form}
      layout="vertical"
      onFinish={onFinish}
      requiredMark={false}
      autoComplete="off"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card className="vr-section-card" title="Datos principales">
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Nombre completo"
                  name="NombreCompleto"
                  rules={[
                    { required: true, message: "Ingresa el nombre completo." },
                  ]}
                >
                  <Input placeholder="Ej. Maria Fernanda Ruiz" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Unidad privada"
                  name="UnidadPrivada"
                  normalize={(value) =>
                    typeof value === "string" ? value.toUpperCase() : value
                  }
                  rules={[
                    { required: true, message: "Ingresa la unidad privada." },
                  ]}
                >
                  <Input placeholder="Ej. M1-01" />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="Correo electronico"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Ingresa el correo electronico.",
                    },
                    { type: "email", message: "Ingresa un correo valido." },
                  ]}
                >
                  <Input placeholder="usuario" />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Card size="small" style={{ borderRadius: 18 }}>
                  <Typography.Text strong>Acceso del residente</Typography.Text>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8 }}>
                    {isEdit
                      ? "Al guardar cambios, el sistema mantendrá la unidad privada como credencial interna del residente."
                      : "El login del residente ya no usa contraseña visible. El sistema guardará internamente la misma unidad privada como credencial, por ejemplo "}
                    {!isEdit ? <strong>M1-01</strong> : null}
                    {!isEdit ? "." : null}
                  </Typography.Paragraph>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            className="vr-section-card"
            title="Condiciones de participacion"
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Coeficiente"
                  name="Coeficiente"
                  initialValue={0.003367}
                  rules={[
                    { required: true, message: "Ingresa el coeficiente." },
                  ]}
                >
                  <InputNumber
                    min={0}
                    precision={6}
                    step={0.000001}
                    style={{ width: "100%" }}
                    placeholder="0.003367"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label="Restriccion por cartera"
                  name="EstadoCartera"
                  valuePropName="checked"
                  initialValue={false}
                  extra="Si esta activa, el usuario no podra votar."
                >
                  <Switch
                    checkedChildren="Restringido"
                    unCheckedChildren="Habilitado"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label="Estado del acceso"
                  name="blocked"
                  valuePropName="checked"
                  initialValue={false}
                  extra="Desactiva este acceso sin eliminar el registro."
                >
                  <Switch
                    checkedChildren="Desactivado"
                    unCheckedChildren="Activo"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Form>
  );
};
