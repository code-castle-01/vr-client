import { Show, TextField, MarkdownField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Card, Col, List, Row, Tag, Typography } from "antd";
import { BrandedSurvey, PageIntro } from "../../components";
import { buildVotingSurveySchema } from "../../survey";

const { Title } = Typography;

export const AgendaItemShow = () => {
  const { query } = useShow({
    meta: {
      populate: ["assembly", "vote_options"],
    },
  });
  const { data, isLoading } = query;

  const record = data?.data;
  const previewSchema = record
    ? buildVotingSurveySchema({
        title: record.title ?? "Encuesta",
        description: record.description,
        choices:
          record.vote_options?.map((option: { id: number; text: string }) => ({
            text: option.text,
            value: option.id,
          })) ?? [],
        locale: record.survey_locale ?? "es",
        schema: record.survey_schema ?? undefined,
      })
    : null;

  return (
    <>
      <PageIntro
        kicker="Encuesta"
        title={record?.title ?? "Detalle de encuesta"}
        description="Consulta el contexto, el estado de la votacion y las opciones disponibles para este asunto de asamblea."
      />
      <Show isLoading={isLoading} title="Detalle de encuesta">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card className="vr-section-card">
              <Title level={5}>Descripcion</Title>
              <MarkdownField value={record?.description || "Sin descripcion registrada."} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card className="vr-section-card">
              <Title level={5}>Estado de la encuesta</Title>
              <Tag
                color={
                  record?.status === "open"
                    ? "gold"
                    : record?.status === "closed"
                      ? "red"
                      : "default"
                }
              >
                {record?.status === "open"
                  ? "Abierta"
                  : record?.status === "closed"
                    ? "Cerrada"
                    : "Pendiente"}
              </Tag>

              <Title level={5} style={{ marginTop: 20 }}>
                Asamblea
              </Title>
              <TextField value={record?.assembly?.title || "-"} />

              <Title level={5} style={{ marginTop: 20 }}>
                Tipo de mayoría
              </Title>
              <Tag color={record?.requiresSpecialMajority ? "volcano" : "green"}>
                {record?.requiresSpecialMajority ? "Especial 70%" : "Simple"}
              </Tag>
            </Card>
          </Col>
          <Col xs={24}>
            <Card className="vr-section-card">
              <Title level={5}>Opciones de voto</Title>
              <List
                dataSource={record?.vote_options ?? []}
                renderItem={(item: { id: number; text: string }) => (
                  <List.Item key={item.id}>{item.text}</List.Item>
                )}
                locale={{ emptyText: "No hay opciones de voto registradas." }}
              />
            </Card>
          </Col>
          {previewSchema ? (
            <Col xs={24}>
              <Card className="vr-section-card">
                <Title level={5}>Vista SurveyJS</Title>
                <BrandedSurvey
                  readOnly
                  schema={previewSchema}
                  showCompleteButton={false}
                />
              </Card>
            </Col>
          ) : null}
        </Row>
      </Show>
    </>
  );
};
