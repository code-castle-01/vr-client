import { Edit, useForm } from "@refinedev/antd";
import { Card, Col, DatePicker, Form, Input, Row, Select } from "antd";
import dayjs from "dayjs";
import { PageIntro } from "../../components";

export const AssemblyEdit = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <>
      <PageIntro
        kicker="Operacion"
        title="Editar asamblea"
        description="Actualiza la planeacion de la sesion, cambia su estado y manten alineado el calendario de la copropiedad."
      />
      <Edit title="Editar asamblea" saveButtonProps={saveButtonProps}>
        <Form {...formProps} layout="vertical" requiredMark={false}>
          <Card className="vr-section-card">
            <Row gutter={[16, 0]}>
              <Col xs={24}>
                <Form.Item
                  label="Titulo de la asamblea"
                  name={["title"]}
                  rules={[{ required: true, message: "Ingresa el titulo de la asamblea." }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Fecha y hora"
                  name={["date"]}
                  rules={[{ required: true, message: "Selecciona la fecha." }]}
                  getValueProps={(value) => ({
                    value: value ? dayjs(value) : undefined,
                  })}
                >
                  <DatePicker showTime style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Estado"
                  name={["status"]}
                  rules={[{ required: true, message: "Selecciona el estado." }]}
                >
                  <Select
                    options={[
                      { value: "scheduled", label: "Programada" },
                      { value: "in_progress", label: "En curso" },
                      { value: "finished", label: "Finalizada" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </Edit>
    </>
  );
};
