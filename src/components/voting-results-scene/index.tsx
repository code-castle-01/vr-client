import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Empty,
  Progress,
  Row,
  Segmented,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { API_URL } from "../../constants";
import { PageIntro } from "../page-intro";

type VotingResultsSceneProps = {
  audience: "admin" | "resident";
};

type ResultStatus =
  | "closed"
  | "closed_without_threshold"
  | "leading"
  | "leading_without_threshold"
  | "no_votes"
  | "tie";

type SurveyResult = {
  id: number;
  options: Array<{
    id: number;
    isWinner: boolean;
    shareByVotes: number;
    shareByWeight: number;
    text: string;
    totalVotes: number;
    totalWeight: number;
  }>;
  questionDescription?: string | null;
  questionTitle: string;
  requiresSpecialMajority: boolean;
  resultStatus: ResultStatus;
  sectionTitle?: string | null;
  status: "pending" | "open" | "closed";
  summary: {
    totalOptions: number;
    totalVotes: number;
    totalWeight: number;
    winningOptionId: number | null;
  };
  surveyTitle: string;
  winningOption: {
    id: number;
    isWinner: boolean;
    shareByVotes: number;
    shareByWeight: number;
    text: string;
    totalVotes: number;
    totalWeight: number;
  } | null;
};

type AssemblyResult = {
  date: string | null;
  id: number;
  status: "scheduled" | "in_progress" | "finished";
  summary: {
    totalSurveys: number;
    totalVotes: number;
    totalWeight: number;
  };
  surveys: SurveyResult[];
  title: string;
};

type ResultsOverviewResponse = {
  assemblies: AssemblyResult[];
  generatedAt: string;
  summary: {
    closedSurveys: number;
    distinctVoters: number;
    openSurveys: number;
    pendingSurveys: number;
    totalAssemblies: number;
    totalSurveys: number;
    totalVotes: number;
    totalWeight: number;
  };
};

type ResidentBallotResponse = {
  surveys: Array<{
    assembly?: {
      date: string | null;
      id: number;
      title: string | null;
    } | null;
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
  }>;
};

type ResidentAnsweredSurvey = {
  assemblyDate: string | null;
  assemblyTitle: string;
  responseLabel: string;
  responseWeight: number;
  selectedOptionIds: number[];
};

const optionPalette = ["#c9822f", "#f0b64d", "#56708a", "#7b8da4", "#9da9b6"];

const formatWeight = (value: number) => value.toFixed(2);

const formatDate = (value: string | null) =>
  value ? dayjs(value).format("DD MMM YYYY, h:mm A") : "Fecha por definir";

const formatExportDate = (value: string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "Sin fecha";

const sanitizePdfText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const buildResultsExportRows = (assemblies: AssemblyResult[]) =>
  assemblies.flatMap((assembly) =>
    assembly.surveys.flatMap((survey) =>
      survey.options.map((option) => ({
        asamblea: assembly.title,
        fechaAsamblea: formatExportDate(assembly.date),
        estadoAsamblea: assemblyStatusMap[assembly.status].label,
        encuesta: survey.surveyTitle,
        pregunta: survey.questionTitle,
        seccion: survey.sectionTitle ?? "",
        estadoEncuesta: surveyStatusMap[survey.status].label,
        mayoria: survey.requiresSpecialMajority ? "Mayoría 70%" : "Mayoría simple",
        opcion: option.text,
        opcionGanadora: option.isWinner ? "Si" : "No",
        participantes: survey.summary.totalVotes,
        pesoParticipante: formatWeight(survey.summary.totalWeight),
        votosOpcion: option.totalVotes,
        pesoOpcion: formatWeight(option.totalWeight),
        participacionPorVotos: `${option.shareByVotes.toFixed(1)}%`,
        participacionPorPeso: `${option.shareByWeight.toFixed(1)}%`,
      })),
    ),
  );

const resultStateMap: Record<
  ResultStatus,
  { color: string; description: string; title: string }
> = {
  closed: {
    color: "success",
    description: "La encuesta cerró y ya tiene una opción ganadora.",
    title: "Resultado definido",
  },
  closed_without_threshold: {
    color: "warning",
    description: "La encuesta cerró sin alcanzar la mayoría especial requerida.",
    title: "Sin mayoría requerida",
  },
  leading: {
    color: "processing",
    description: "La opción mostrada va liderando con el peso actual.",
    title: "Liderazgo actual",
  },
  leading_without_threshold: {
    color: "purple",
    description: "Va liderando, pero todavía no alcanza el umbral especial.",
    title: "Lidera sin umbral",
  },
  no_votes: {
    color: "default",
    description: "Todavía no se han emitido votos para esta encuesta.",
    title: "Sin votos",
  },
  tie: {
    color: "warning",
    description: "Las primeras opciones están empatadas por peso de voto.",
    title: "Empate técnico",
  },
};

const surveyStatusMap: Record<
  SurveyResult["status"],
  { color: string; label: string }
> = {
  closed: { color: "default", label: "Cerrada" },
  open: { color: "gold", label: "Abierta" },
  pending: { color: "blue", label: "Pendiente" },
};

const assemblyStatusMap: Record<
  AssemblyResult["status"],
  { color: string; label: string }
> = {
  finished: { color: "default", label: "Finalizada" },
  in_progress: { color: "processing", label: "En curso" },
  scheduled: { color: "blue", label: "Programada" },
};

const SummaryCard = ({
  hint,
  label,
  value,
}: {
  hint: string;
  label: string;
  value: number | string;
}) => (
  <div className="vr-results-stat-card">
    <div className="vr-results-stat-label">{label}</div>
    <div className="vr-results-stat-value">{value}</div>
    <div className="vr-results-stat-hint">{hint}</div>
  </div>
);

const SurveyResultCard = ({ survey }: { survey: SurveyResult }) => {
  const state = resultStateMap[survey.resultStatus];
  const winningShare = survey.winningOption?.shareByWeight ?? 0;
  const hasDifferentSurveyTitle =
    survey.surveyTitle.trim() &&
    survey.surveyTitle.trim() !== survey.questionTitle.trim();

  return (
    <Card className="vr-results-survey-card" size="small">
      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <div className="vr-results-survey-head">
          <div className="vr-results-question-shell">
            <div className="vr-results-question-kicker">Punto de votación</div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {survey.questionTitle}
            </Typography.Title>

            <div className="vr-results-question-tags">
              {survey.sectionTitle ? (
                <Tag bordered={false} className="vr-results-context-tag">
                  Sección: {survey.sectionTitle}
                </Tag>
              ) : null}
              {hasDifferentSurveyTitle ? (
                <Tag bordered={false} className="vr-results-context-tag">
                  Encuesta: {survey.surveyTitle}
                </Tag>
              ) : null}
            </div>

            {survey.questionDescription ? (
              <div className="vr-results-question-brief">
                <Typography.Text>{survey.questionDescription}</Typography.Text>
              </div>
            ) : null}

            <div className="vr-results-question-meta">
              <span>{survey.summary.totalVotes} votos emitidos</span>
              <span>Peso acumulado {formatWeight(survey.summary.totalWeight)}</span>
              <span>{survey.summary.totalOptions} opciones evaluadas</span>
            </div>
          </div>

          <Space wrap>
            <Tag color={surveyStatusMap[survey.status].color}>
              {surveyStatusMap[survey.status].label}
            </Tag>
            <Tag color={survey.requiresSpecialMajority ? "volcano" : "green"}>
              {survey.requiresSpecialMajority ? "Mayoría 70%" : "Mayoría simple"}
            </Tag>
          </Space>
        </div>

        <Alert
          className="vr-results-state-alert"
          showIcon
          type={
            state.color === "success"
              ? "success"
              : state.color === "processing"
                ? "info"
                : state.color === "warning"
                  ? "warning"
                  : "info"
          }
          message={state.title}
          description={state.description}
        />

        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <div className="vr-results-leader">
              <Progress
                percent={Number(winningShare.toFixed(1))}
                strokeColor="#c9822f"
                type="dashboard"
                size={112}
                format={(percent) => `${percent ?? 0}%`}
              />
              <div className="vr-results-leader-copy">
                <div className="vr-results-leader-label">
                  {survey.winningOption ? "Opción puntera" : "Sin definición"}
                </div>
                <div className="vr-results-leader-title">
                  {survey.winningOption?.text ?? "Aún no hay votos"}
                </div>
                <div className="vr-results-leader-meta">
                  {survey.winningOption
                    ? `${survey.winningOption.totalVotes} votos · peso ${formatWeight(
                        survey.winningOption.totalWeight,
                      )}`
                    : "Esperando participación"}
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={16}>
            <div className="vr-results-options">
              {survey.options.length ? (
                survey.options.map((option, index) => (
                  <div
                    className={`vr-results-option${
                      option.isWinner ? " is-winner" : ""
                    }`}
                    key={option.id}
                  >
                    <div className="vr-results-option-top">
                      <div className="vr-results-option-name">
                        {option.isWinner ? <TrophyOutlined /> : <BarChartOutlined />}
                        <span>{option.text}</span>
                      </div>
                      <div className="vr-results-option-metrics">
                        {option.totalVotes} votos · {formatWeight(option.totalWeight)}
                      </div>
                    </div>

                    <Progress
                      percent={Number(option.shareByWeight.toFixed(1))}
                      showInfo={false}
                      strokeColor={optionPalette[index % optionPalette.length]}
                      trailColor="rgba(23, 35, 47, 0.08)"
                    />

                    <div className="vr-results-option-bottom">
                      <span>Peso {option.shareByWeight.toFixed(1)}%</span>
                      <span>Participación {option.shareByVotes.toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <Empty
                  description="No hay opciones configuradas."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

export const VotingResultsScene = ({
  audience,
}: VotingResultsSceneProps) => {
  const { message } = AntdApp.useApp();
  const [filter, setFilter] = useState<"all" | "closed" | "open">(
    audience === "admin" ? "all" : "open",
  );
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const overviewQuery = useCustom<ResultsOverviewResponse>({
    method: "get",
    url: `${API_URL}/api/votes/results-overview`,
    errorNotification: false,
    queryOptions: {
      refetchOnWindowFocus: false,
      retry: 0,
      staleTime: 30_000,
    },
  });
  const ballotQuery = useCustom<ResidentBallotResponse>({
    method: "get",
    url: `${API_URL}/api/votes/ballot`,
    errorNotification: false,
    queryOptions: {
      enabled: audience === "resident",
      refetchOnWindowFocus: false,
      retry: 0,
      staleTime: 30_000,
    },
  });

  const overview = overviewQuery.query.data?.data;
  const ballot = ballotQuery.query.data?.data;

  const answeredSurveysById = useMemo(() => {
    if (audience !== "resident" || !ballot) {
      return new Map<number, ResidentAnsweredSurvey>();
    }

    return new Map(
      ballot.surveys
        .filter((survey) => Boolean(survey.existingVote))
        .map((survey) => {
          const selectedOptionIds = survey.existingVote?.selectedOptionIds ?? [];
          const selectedOptions = survey.options.filter((option) =>
            selectedOptionIds.includes(option.id),
          );

          return [
            survey.id,
            {
              assemblyDate: survey.assembly?.date ?? null,
              assemblyTitle: survey.assembly?.title ?? "Asamblea actual",
              responseLabel: selectedOptions.length
                ? selectedOptions.map((option) => option.text).join(", ")
                : "Respuesta registrada",
              responseWeight: survey.existingVote?.weight ?? 0,
              selectedOptionIds,
            },
          ] satisfies [number, ResidentAnsweredSurvey];
        }),
    );
  }, [audience, ballot]);

  const filteredAssemblies = useMemo(() => {
    if (!overview) {
      return [];
    }

    return overview.assemblies
      .map((assembly) => ({
        ...assembly,
        surveys: assembly.surveys.filter((survey) => {
          if (filter === "all") {
            return true;
          }

          return survey.status === filter;
        }),
      }))
      .filter((assembly) => assembly.surveys.length > 0);
  }, [filter, overview]);

  const residentExportAssemblies = useMemo(() => {
    if (audience !== "resident") {
      return [];
    }

    return filteredAssemblies
      .map((assembly) => ({
        ...assembly,
        surveys: assembly.surveys.filter((survey) => answeredSurveysById.has(survey.id)),
      }))
      .filter((assembly) => assembly.surveys.length > 0);
  }, [audience, answeredSurveysById, filteredAssemblies]);
  const exportRows = useMemo(
    () => buildResultsExportRows(filteredAssemblies),
    [filteredAssemblies],
  );

  const title =
    audience === "admin" ? "Centro de resultados de votación" : "Panorama de resultados";
  const description =
    audience === "admin"
      ? "Monitorea cada encuesta con una sola lectura agregada del backend. Aquí ves participación, peso acumulado y la opción que va ganando sin saturar el servidor."
      : "Consulta cómo va cada votación desde una vista ligera y preparada para móvil. Los resultados se entregan resumidos para evitar cargas innecesarias durante la asamblea.";

  const fileStamp = dayjs(overview?.generatedAt ?? new Date().toISOString()).format(
    "YYYYMMDD-HHmm",
  );
  const filterLabel =
    filter === "all" ? "todas" : filter === "open" ? "abiertas" : "cerradas";

  const handleExportExcel = async () => {
    if (!overview || !exportRows.length) {
      message.warning("No hay resultados visibles para exportar.");
      return;
    }

    setExporting("excel");

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportRows);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");
      XLSX.writeFile(
        workbook,
        `resultados-votacion-${filterLabel}-${fileStamp}.xlsx`,
      );
      message.success("El archivo Excel fue generado correctamente.");
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "No fue posible generar el archivo Excel.",
      );
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!overview || !exportRows.length) {
      message.warning("No hay resultados visibles para exportar.");
      return;
    }

    setExporting("pdf");

    try {
      const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const document = new JsPdf({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      document.setFontSize(18);
      document.text("Resultados de votacion", 40, 42);
      document.setFontSize(10);
      document.text(
        `Filtro: ${filterLabel} | Generado: ${formatExportDate(
          overview.generatedAt,
        )}`,
        40,
        62,
      );

      autoTable(document, {
        startY: 80,
        head: [[
          "Asamblea",
          "Pregunta",
          "Seccion",
          "Opcion",
          "Ganadora",
          "Participantes",
          "Peso",
          "Votos opcion",
          "Peso opcion",
        ]],
        body: exportRows.map((row) => [
          String(row.asamblea),
          String(row.pregunta),
          String(row.seccion),
          String(row.opcion),
          String(row.opcionGanadora),
          String(row.participantes),
          String(row.pesoParticipante),
          String(row.votosOpcion),
          String(row.pesoOpcion),
        ]),
        headStyles: {
          fillColor: [191, 122, 45],
        },
        margin: { left: 32, right: 32 },
        styles: {
          cellPadding: 6,
          fontSize: 8,
          overflow: "linebreak",
        },
      });

      document.save(`resultados-votacion-${filterLabel}-${fileStamp}.pdf`);
      message.success("El PDF fue generado correctamente.");
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "No fue posible generar el PDF.",
      );
    } finally {
      setExporting(null);
    }
  };

  const handleExportResidentPdf = async () => {
    if (!overview || !ballot) {
      message.warning("Aun estamos cargando tus resultados. Intenta nuevamente.");
      return;
    }

    if (ballotQuery.query.isError) {
      message.error("No pudimos validar tus respuestas para armar el PDF.");
      return;
    }

    if (!residentExportAssemblies.length) {
      message.warning("No tienes encuestas respondidas dentro del filtro actual.");
      return;
    }

    setExporting("pdf");

    try {
      const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const document = new JsPdf({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      let cursorY = 40;

      document.setFillColor(252, 248, 239);
      document.roundedRect(24, 24, 547, 794, 24, 24, "F");
      document.setFontSize(20);
      document.setTextColor(24, 48, 66);
      document.text(sanitizePdfText("Mis encuestas respondidas"), 40, cursorY);
      cursorY += 20;

      document.setFontSize(10);
      document.setTextColor(91, 102, 114);
      document.text(
        sanitizePdfText(
          `Filtro: ${filterLabel} | Generado: ${formatExportDate(overview.generatedAt)}`,
        ),
        40,
        cursorY,
      );
      cursorY += 18;
      document.text(
        sanitizePdfText(
          "Este archivo resume solo las preguntas que ya respondiste y el estado actual de cada votacion.",
        ),
        40,
        cursorY,
      );
      cursorY += 24;

      residentExportAssemblies.forEach((assembly, assemblyIndex) => {
        if (cursorY > 700) {
          document.addPage();
          cursorY = 40;
        }

        document.setFillColor(239, 196, 106);
        document.roundedRect(32, cursorY - 16, 531, 40, 18, 18, "F");
        document.setFontSize(14);
        document.setTextColor(24, 48, 66);
        document.text(sanitizePdfText(assembly.title), 48, cursorY + 2);
        document.setFontSize(9);
        document.setTextColor(91, 102, 114);
        document.text(
          sanitizePdfText(
            `${formatExportDate(assembly.date)} · ${assembly.surveys.length} preguntas respondidas`,
          ),
          48,
          cursorY + 18,
        );
        cursorY += 42;

        assembly.surveys.forEach((survey, surveyIndex) => {
          const response = answeredSurveysById.get(survey.id);

          if (!response) {
            return;
          }

          if (cursorY > 620) {
            document.addPage();
            cursorY = 40;
          }

          document.setFillColor(255, 255, 255);
          document.roundedRect(32, cursorY - 8, 531, 124, 18, 18, "F");
          document.setDrawColor(230, 214, 188);
          document.roundedRect(32, cursorY - 8, 531, 124, 18, 18, "S");

          document.setFontSize(9);
          document.setTextColor(191, 122, 45);
          document.text(sanitizePdfText(`Pregunta ${surveyIndex + 1}`), 48, cursorY + 8);

          document.setFontSize(14);
          document.setTextColor(24, 48, 66);
          document.text(sanitizePdfText(survey.questionTitle), 48, cursorY + 28, {
            maxWidth: 355,
          });

          document.setFontSize(9);
          document.setTextColor(91, 102, 114);
          const contextLine = [
            survey.sectionTitle ? `Seccion: ${survey.sectionTitle}` : "",
            survey.surveyTitle ? `Encuesta: ${survey.surveyTitle}` : "",
          ]
            .filter(Boolean)
            .join(" · ");

          if (contextLine) {
            document.text(sanitizePdfText(contextLine), 48, cursorY + 46, {
              maxWidth: 355,
            });
          }

          if (survey.questionDescription) {
            document.text(
              sanitizePdfText(survey.questionDescription),
              48,
              cursorY + 64,
              { maxWidth: 355 },
            );
          }

          autoTable(document, {
            body: [
              [
                "Tu respuesta",
                sanitizePdfText(response.responseLabel),
              ],
              [
                "Estado actual",
                sanitizePdfText(
                  survey.winningOption
                    ? `Ganando: ${survey.winningOption.text}`
                    : resultStateMap[survey.resultStatus].title,
                ),
              ],
              [
                "Participacion",
                sanitizePdfText(
                  `${survey.summary.totalVotes} votos · peso ${formatWeight(
                    survey.summary.totalWeight,
                  )}`,
                ),
              ],
              [
                "Tipo de mayoria",
                sanitizePdfText(
                  survey.requiresSpecialMajority ? "Mayoría 70%" : "Mayoría simple",
                ),
              ],
            ],
            columnStyles: {
              0: { cellWidth: 92, fontStyle: "bold" },
              1: { cellWidth: 148 },
            },
            margin: { left: 385, right: 40 },
            startY: cursorY,
            styles: {
              cellPadding: 6,
              fillColor: [255, 252, 246],
              fontSize: 8.5,
              lineColor: [230, 214, 188],
              lineWidth: 0.5,
              overflow: "linebreak",
              textColor: [24, 48, 66],
            },
            theme: "grid",
          });

          cursorY += 138;
        });

        if (assemblyIndex < residentExportAssemblies.length - 1) {
          cursorY += 8;
        }
      });

      document.save(`mis-resultados-respondidos-${filterLabel}-${fileStamp}.pdf`);
      message.success("Tu PDF personal fue generado correctamente.");
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "No fue posible generar tu PDF personal.",
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <PageIntro
        kicker={audience === "admin" ? "Resultados" : "Votación"}
        title={title}
        description={description}
        extra={
          <div className="vr-results-toolbar">
            <Segmented
              options={[
                { label: "Todas", value: "all" },
                { label: "Abiertas", value: "open" },
                { label: "Cerradas", value: "closed" },
              ]}
              value={filter}
              onChange={(value) =>
                setFilter(value as "all" | "closed" | "open")
              }
            />

            <div className="vr-results-toolbar-actions">
              {audience === "admin" ? (
                <>
                  <Button
                    icon={<FileExcelOutlined />}
                    loading={exporting === "excel"}
                    onClick={handleExportExcel}
                  >
                    Excel
                  </Button>
                  <Button
                    icon={<FilePdfOutlined />}
                    loading={exporting === "pdf"}
                    onClick={handleExportPdf}
                  >
                    PDF
                  </Button>
                </>
              ) : (
                <Button
                  icon={<FilePdfOutlined />}
                  loading={exporting === "pdf"}
                  onClick={handleExportResidentPdf}
                >
                  Descargar PDF
                </Button>
              )}

              <Button
                icon={<ReloadOutlined />}
                loading={overviewQuery.query.isFetching}
                onClick={() => overviewQuery.query.refetch()}
              >
                Actualizar
              </Button>
            </div>
          </div>
        }
      />

      {overviewQuery.query.isLoading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Col xs={24} sm={12} xl={6} key={index}>
              <Card className="vr-section-card">
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : null}

      {overviewQuery.query.isError ? (
        <Card className="vr-section-card">
          <Empty description="No pudimos cargar los resultados en este momento. Intenta actualizar nuevamente." />
        </Card>
      ) : null}

      {overview ? (
        <div className="vr-results-summary-grid">
          <SummaryCard
            label="Encuestas abiertas"
            value={overview.summary.openSurveys}
            hint="Puntos en votación en este momento"
          />
          <SummaryCard
            label="Encuestas cerradas"
            value={overview.summary.closedSurveys}
            hint="Resultados ya consolidados"
          />
          <SummaryCard
            label="Votos emitidos"
            value={overview.summary.totalVotes}
            hint="Total de registros de voto"
          />
          <SummaryCard
            label="Participantes únicos"
            value={overview.summary.distinctVoters}
            hint="Usuarios que ya votaron"
          />
        </div>
      ) : null}

      {overview ? (
        <Card className="vr-section-card">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <div className="vr-results-mini-metric">
                <ClockCircleOutlined />
                <div>
                  <strong>{overview.summary.totalAssemblies}</strong>
                  <span>Asambleas</span>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="vr-results-mini-metric">
                <CheckCircleOutlined />
                <div>
                  <strong>{overview.summary.totalSurveys}</strong>
                  <span>Encuestas</span>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="vr-results-mini-metric">
                <BarChartOutlined />
                <div>
                  <strong>{formatWeight(overview.summary.totalWeight)}</strong>
                  <span>Peso acumulado</span>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="vr-results-mini-metric">
                <TrophyOutlined />
                <div>
                  <strong>{overview.summary.pendingSurveys}</strong>
                  <span>Pendientes</span>
                </div>
              </div>
            </Col>
          </Row>

          <Typography.Text
            type="secondary"
            style={{ display: "block", marginTop: 14 }}
          >
            Corte generado: {formatDate(overview.generatedAt)}
          </Typography.Text>
        </Card>
      ) : null}

      {filteredAssemblies.length ? (
        <Collapse
          className="vr-results-collapse"
          defaultActiveKey={[String(filteredAssemblies[0]?.id ?? "0")]}
          items={filteredAssemblies.map((assembly) => ({
            children: (
              <div className="vr-results-survey-list">
                {assembly.surveys.map((survey) => (
                  <SurveyResultCard key={survey.id} survey={survey} />
                ))}
              </div>
            ),
            key: String(assembly.id),
            label: (
              <div className="vr-results-assembly-header">
                <div>
                  <div className="vr-results-assembly-title">{assembly.title}</div>
                  <div className="vr-results-assembly-meta">
                    {formatDate(assembly.date)} · {assembly.summary.totalVotes} votos
                  </div>
                </div>

                <Space wrap>
                  <Tag color={assemblyStatusMap[assembly.status].color}>
                    {assemblyStatusMap[assembly.status].label}
                  </Tag>
                  <Tag>{assembly.summary.totalSurveys} encuestas</Tag>
                </Space>
              </div>
            ),
          }))}
        />
      ) : overview && !overviewQuery.query.isLoading ? (
        <Card className="vr-section-card">
          <Empty description="No hay encuestas para el filtro seleccionado." />
        </Card>
      ) : null}
    </Space>
  );
};
