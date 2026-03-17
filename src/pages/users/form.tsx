import type { FormInstance } from "antd";
import { Card, Col, Form, Input, InputNumber, Row, Switch } from "antd";

export type UserFormValues = {
  Coeficiente: number;
  EstadoCartera: boolean;
  NombreCompleto: string;
  UnidadPrivada: string;
  blocked: boolean;
  email: string;
  password?: string;
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
                <Form.Item
                  label={isEdit ? "Nueva contraseña" : "contraseña inicial"}
                  name="password"
                  rules={
                    isEdit
                      ? [
                          {
                            min: 6,
                            message:
                              "La contraseña debe tener al menos 6 caracteres.",
                          },
                        ]
                      : [
                          {
                            required: true,
                            message: "Ingresa una contraseña temporal.",
                          },
                          {
                            min: 6,
                            message:
                              "La contraseña debe tener al menos 6 caracteres.",
                          },
                        ]
                  }
                  extra={
                    isEdit
                      ? "Deja este campo vacio si no quieres cambiar la contraseña."
                      : "El administrador puede compartir esta contraseña con el copropietario."
                  }
                >
                  <Input.Password placeholder="Minimo 6 caracteres" />
                </Form.Item>
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
                  initialValue={100}
                  rules={[
                    { required: true, message: "Ingresa el coeficiente." },
                  ]}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: "100%" }}
                    placeholder="100"
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
