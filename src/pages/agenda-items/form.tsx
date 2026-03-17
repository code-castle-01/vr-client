import { ReloadOutlined } from "@ant-design/icons";
import { useSelect } from "@refinedev/antd";
import type { FormInstance } from "antd";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { useMemo } from "react";
import { SurveyCreatorEditor } from "../../components/survey-creator-editor";
import {
  createVotingSurveyTemplate,
  inspectVotingSurveySchema,
  parseSurveySchemaJson,
  requireValidVotingSurvey,
  serializeSurveySchema,
} from "../../survey";

export type SurveyFormValues = {
  assemblyId: number;
  requiresSpecialMajority: boolean;
  status: "pending" | "open" | "closed";
  surveySchemaJson: string;
};

type SurveyFormProps = {
  form: FormInstance<SurveyFormValues>;
  onFinish: (values: SurveyFormValues) => Promise<void>;
};

export const SurveyForm = ({ form, onFinish }: SurveyFormProps) => {
  const { selectProps: assemblySelectProps } = useSelect({
    resource: "assemblies",
    optionLabel: "title",
    optionValue: "id",
  });
  const watchedStatus = Form.useWatch("status", form);
  const watchedSchemaJson = Form.useWatch("surveySchemaJson", form);
  const parsedSchemaState = useMemo(
    () => parseSurveySchemaJson(watchedSchemaJson),
    [watchedSchemaJson],
  );
  const creatorSchema = parsedSchemaState.value ?? createVotingSurveyTemplate();
  const inspection = useMemo(
    () => inspectVotingSurveySchema(creatorSchema),
    [creatorSchema],
  );

  const handleResetTemplate = () => {
    form.setFieldValue(
      "surveySchemaJson",
      serializeSurveySchema(createVotingSurveyTemplate()),
    );
  };

  const statusHelp =
    watchedStatus === "closed"
      ? {
          message: "Encuesta cerrada",
          description:
            "Este punto ya no aceptará votos de residentes y solo quedará visible como referencia o resultado.",
          type: "warning" as const,
        }
      : watchedStatus === "open"
        ? {
            message: "Encuesta abierta para votar",
            description:
              "Los residentes verán esta encuesta como disponible y podrán responderla de inmediato.",
            type: "success" as const,
          }
        : {
            message: "Encuesta preparada",
            description:
              "Queda lista dentro de la asamblea. Si la asamblea ya está en curso, el residente podrá verla y votarla.",
            type: "info" as const,
          };

  return (
    <Form<SurveyFormValues>
      form={form}
      layout="vertical"
      onFinish={onFinish}
      requiredMark={false}
      autoComplete="off"
      initialValues={{
        requiresSpecialMajority: false,
        status: "pending",
        surveySchemaJson: serializeSurveySchema(createVotingSurveyTemplate()),
      }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            className="vr-section-card"
            title="Configuracion de la votacion"
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Asamblea"
                  name="assemblyId"
                  rules={[
                    { required: true, message: "Selecciona una asamblea." },
                  ]}
                >
                  <Select
                    {...assemblySelectProps}
                    placeholder="Selecciona una asamblea"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Estado"
                  name="status"
                  rules={[{ required: true, message: "Selecciona el estado." }]}
                >
                  <Select
                    options={[
                      { value: "pending", label: "Preparada para la asamblea" },
                      { value: "open", label: "Abierta para votacion" },
                      { value: "closed", label: "Cerrada" },
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Alert
                  showIcon
                  type={statusHelp.type}
                  message={statusHelp.message}
                  description={statusHelp.description}
                />
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="Mayoria especial requerida"
                  name="requiresSpecialMajority"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="70% requerido"
                    unCheckedChildren="Mayoria simple"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            className="vr-section-card"
            title="Crear encuestas"
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetTemplate}
                type="default"
              >
                Restaurar plantilla base
              </Button>
            }
          >
            <Space direction="vertical" size={18} style={{ width: "100%" }}>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                Aquí diseñas la encuesta completa con Survey Creator. El
                guardado tomará la pregunta oficial de voto y la conectará con
                las opciones reales de la asamblea.
              </Typography.Paragraph>

              {parsedSchemaState.error ? (
                <Alert
                  showIcon
                  type="error"
                  message="El esquema de SurveyJS tiene un error"
                  description={parsedSchemaState.error}
                />
              ) : null}

              {!parsedSchemaState.error && inspection.error ? (
                <Alert
                  showIcon
                  type="warning"
                  message="Falta la pregunta oficial de voto"
                  description={inspection.error}
                />
              ) : null}

              <SurveyCreatorEditor
                schema={creatorSchema}
                onChange={(nextSchema) => {
                  form.setFieldValue(
                    "surveySchemaJson",
                    serializeSurveySchema(nextSchema),
                  );
                }}
              />

              <Form.Item
                name="surveySchemaJson"
                rules={[
                  {
                    validator: async (_, value?: string) => {
                      const parsedSchema = parseSurveySchemaJson(value);

                      if (parsedSchema.error) {
                        throw new Error(parsedSchema.error);
                      }

                      requireValidVotingSurvey(
                        parsedSchema.value ?? createVotingSurveyTemplate(),
                      );
                    },
                  },
                ]}
                hidden
              >
                <Input />
              </Form.Item>
            </Space>
          </Card>
        </Col>
      </Row>
    </Form>
  );
};
