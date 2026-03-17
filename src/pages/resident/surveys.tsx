import {
  CheckCircleOutlined,
  HourglassOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useCustom, useCustomMutation } from "@refinedev/core";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Col,
  Empty,
  Result,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import type { SurveyModel } from "survey-core";
import { BrandedSurvey } from "../../components";
import { API_URL } from "../../constants";
import {
  buildVotingSurveySchema,
  getOfficialVoteValues,
} from "../../survey";

type BallotResponse = {
  delegatedBy?: {
    id: number;
    name: string;
    unit: string | null;
  } | null;
  resident: {
    id: number;
    name: string;
    unit: string | null;
  };
  representedResidents: Array<{
    id: number;
    name: string;
    unit: string | null;
  }>;
  surveys: Array<{
    assembly?: {
      date: string | null;
      id: number;
      title: string | null;
    } | null;
    description?: string | null;
    existingVote?: {
      ids: number[];
      selectedOptionIds: number[];
      weight: number;
    } | null;
    id: number;
    options: Array<{
      id: number;
      text: string;
    }>;
    requiresSpecialMajority: boolean;
    surveyLocale?: string | null;
    surveySchema?: Record<string, unknown> | null;
    status: "pending" | "open" | "closed";
    title: string;
  }>;
  totalHomesRepresented: number;
  totalWeightRepresented: number;
};

export const ResidentSurveysPage = () => {
  const { message } = AntdApp.useApp();
  const [submittingAgendaItemId, setSubmittingAgendaItemId] = useState<number | null>(null);
  const ballotQuery = useCustom<BallotResponse>({
    url: `${API_URL}/api/votes/ballot`,
    method: "get",
  });
  const castVote = useCustomMutation();

  const ballot = ballotQuery.query.data?.data;
  const surveysToAnswer =
    ballot?.surveys.filter((survey) => !survey.existingVote) ?? [];
  const answeredSurveys =
    ballot?.surveys.filter((survey) => Boolean(survey.existingVote)) ?? [];
  const isVoteSubmitting = submittingAgendaItemId !== null;

  const handleVote = async (agendaItemId: number, voteOptionIds: number[]) => {
    if (isVoteSubmitting) {
      throw new Error("Ya estamos registrando un voto. Espera un momento.");
    }

    setSubmittingAgendaItemId(agendaItemId);

    try {
      await castVote.mutateAsync({
        url: `${API_URL}/api/votes/cast`,
        method: "post",
        values: {
          agendaItemId,
          voteOptionIds,
        },
      });

      message.success("Tu voto fue registrado correctamente.");
      void ballotQuery.query.refetch();
    } finally {
      setSubmittingAgendaItemId(null);
    }
  };

  if (ballot?.delegatedBy) {
    return (
      <Card className="vr-section-card">
        <Result
          status="warning"
          title="Tu voto directo no está disponible"
          subTitle={`La unidad ${ballot.resident.unit ?? ""} fue registrada como representada por ${ballot.delegatedBy.name} (${ballot.delegatedBy.unit ?? "sin unidad"}).`}
        />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div className="vr-page-intro" style={{ marginBottom: 0 }}>
        <div className="vr-page-kicker">Votacion</div>
        <h1 className="vr-page-title">Encuestas activas</h1>
        <p className="vr-page-description">
          Emite tu voto sobre los puntos abiertos de la asamblea. Si declaraste
          poderes, el sistema aplicará automáticamente el peso acumulado de las
          viviendas representadas.
        </p>
      </div>

      {ballot ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card className="vr-section-card">
              <Tag color="gold" icon={<SafetyCertificateOutlined />}>
                Capacidad de voto
              </Tag>
              <Typography.Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
                {ballot.totalHomesRepresented} casas
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Coeficiente acumulado:{" "}
                <strong>{ballot.totalWeightRepresented.toFixed(2)}</strong>
              </Typography.Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="vr-section-card">
              <Tag color="blue" icon={<CheckCircleOutlined />}>
                Residencias representadas
              </Tag>
              <Typography.Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
                {ballot.representedResidents.length}
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Además de tu propia unidad.
              </Typography.Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="vr-section-card">
              <Tag color="purple" icon={<HourglassOutlined />}>
                Pendientes por votar
              </Tag>
              <Typography.Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
                {surveysToAnswer.length}
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Aún requieren tu participación.
              </Typography.Paragraph>
            </Card>
          </Col>
        </Row>
      ) : null}

      {surveysToAnswer.length ? (
        <Row gutter={[16, 16]}>
          {surveysToAnswer.map((survey) => (
            <Col xs={24} key={survey.id}>
              <Card className="vr-section-card">
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Space wrap>
                    <Tag color={survey.status === "open" ? "gold" : survey.status === "closed" ? "default" : "blue"}>
                      {survey.status === "open"
                        ? "Abierta"
                        : survey.status === "closed"
                          ? "Cerrada"
                          : "Pendiente"}
                    </Tag>
                    <Tag color={survey.requiresSpecialMajority ? "volcano" : "green"}>
                      {survey.requiresSpecialMajority ? "Mayoría especial" : "Mayoría simple"}
                    </Tag>
                    {survey.assembly?.title ? (
                      <Tag>{survey.assembly.title}</Tag>
                    ) : null}
                  </Space>

                  {survey.status !== "open" ? (
                    <Alert
                      type="info"
                      showIcon
                      message="Encuesta no disponible"
                      description="Solo puedes votar cuando el administrador abra este punto."
                    />
                  ) : (
                    <BrandedSurvey
                      busyMessage={
                        submittingAgendaItemId === survey.id
                          ? "Registrando voto..."
                          : "Espera a que termine el envio actual."
                      }
                      isSubmitting={isVoteSubmitting}
                      schema={buildVotingSurveySchema({
                        title: survey.title,
                        description:
                          survey.description ??
                          "Selecciona una opción para registrar tu voto.",
                        choices: survey.options.map((option) => ({
                          text: option.text,
                          value: option.id,
                        })),
                        locale: survey.surveyLocale,
                        schema: survey.surveySchema ?? undefined,
                      })}
                      onComplete={async (model: SurveyModel) => {
                        const voteOptionIds = getOfficialVoteValues(
                          model.data as Record<string, unknown>,
                        );

                        if (!voteOptionIds.length) {
                          throw new Error(
                            "Selecciona una opción para registrar tu voto.",
                          );
                        }

                        await handleVote(survey.id, voteOptionIds);
                      }}
                    />
                  )}

                  {submittingAgendaItemId === survey.id ? (
                    <Typography.Text type="secondary">
                      Registrando voto...
                    </Typography.Text>
                  ) : null}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="vr-section-card">
          <Empty description="No tienes encuestas pendientes por responder." />
        </Card>
      )}

      {answeredSurveys.length ? (
        <Row gutter={[16, 16]}>
          {answeredSurveys.map((survey) => {
            const selectedOptionIds = survey.existingVote?.selectedOptionIds ?? [];
            const selectedOptions = survey.options.filter((option) =>
              selectedOptionIds.includes(option.id),
            );
            const selectedOptionsLabel = selectedOptions.length
              ? selectedOptions.map((option) => option.text).join(", ")
              : "Opción registrada";

            return (
              <Col xs={24} key={`answered-${survey.id}`}>
                <Card className="vr-section-card">
                  <Space direction="vertical" size={14} style={{ width: "100%" }}>
                    <Space wrap>
                      <Tag color="success">Respuesta registrada</Tag>
                      <Tag color={survey.status === "closed" ? "default" : "gold"}>
                        {survey.status === "closed" ? "Cerrada" : "En seguimiento"}
                      </Tag>
                    </Space>

                    <div>
                      <Typography.Title level={4} style={{ marginBottom: 6 }}>
                        {survey.title}
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        Esta encuesta ya fue respondida con un peso de{" "}
                        {survey.existingVote?.weight.toFixed(2)}.
                      </Typography.Text>
                    </div>

                    <Alert
                      type="success"
                      showIcon
                      message={`Tu respuesta: ${selectedOptionsLabel}`}
                      description="Tu voto ya quedó guardado y no necesitas volver a responder este punto."
                    />

                    <Button href="/mis-resultados" type="default">
                      Ver resultados
                    </Button>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : null}
    </Space>
  );
};
