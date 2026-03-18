import {
  FileImageOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { DateField, Show, TextField } from "@refinedev/antd";
import { useCustom, useCustomMutation, useShow } from "@refinedev/core";
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { PageIntro } from "../../components";
import { API_URL } from "../../constants";

const { Paragraph, Text, Title } = Typography;

type AdminProxyResponse = {
  assembly?: {
    date?: string | null;
    id: number;
    status?: string | null;
    title?: string | null;
  } | null;
  items: Array<{
    document?: {
      id: number;
      mime?: string | null;
      name?: string | null;
      size?: number | null;
      url?: string | null;
    } | null;
    id: number;
    registeredAt?: string | null;
    representedResident?: {
      coefficient?: number | null;
      id: number;
      name: string;
      unit?: string | null;
    } | null;
    revokedAt?: string | null;
    revokedBy?: {
      coefficient?: number | null;
      id: number;
      name: string;
      unit?: string | null;
    } | null;
    revokedReason?: string | null;
    status?: string | null;
    submittedBy?: {
      coefficient?: number | null;
      id: number;
      name: string;
      unit?: string | null;
    } | null;
  }>;
  summary?: {
    enabledHomesCount: number;
    loggedUsersCount: number;
    quorumMinHomes: number;
    quorumReached: boolean;
    representedHomesCount: number;
    representativesCount: number;
    revokedHomesCount?: number;
    supportsCount: number;
    totalHomesBase: number;
  } | null;
};

type ProxyItem = AdminProxyResponse["items"][number];

type PreviewDocument = {
  mime?: string | null;
  name?: string | null;
  url: string;
};

type PreviewState = {
  document: PreviewDocument;
  item: ProxyItem;
};

type RepresentativeGroup = {
  id: number | string;
  items: ProxyItem[];
  representedHomesCount: number;
  representative: NonNullable<ProxyItem["submittedBy"]>;
  supportsCount: number;
  totalCoefficient: number;
};

const buildDocumentUrl = (url?: string | null) => {
  if (!url) {
    return null;
  }

  return url.startsWith("http") ? url : `${API_URL}${url}`;
};

const isPdfDocument = (document?: PreviewDocument | null) => {
  if (!document) {
    return false;
  }

  return (
    document.mime?.toLowerCase().includes("pdf") ||
    document.url.toLowerCase().endsWith(".pdf")
  );
};

export const AssemblyShow = () => {
  const { message } = AntdApp.useApp();
  const [revokeForm] = Form.useForm<{ reason: string }>();
  const { query } = useShow({});
  const { data, isLoading } = query;
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ProxyItem | null>(null);

  const record = data?.data;
  const proxyQuery = useCustom<AdminProxyResponse>({
    url: `${API_URL}/api/proxy-authorizations/admin/assemblies/${record?.id}`,
    method: "get",
    queryOptions: {
      enabled: Boolean(record?.id),
    },
  });
  const revokeMutation = useCustomMutation({
    mutationOptions: {
      onError: () => undefined,
    },
  });

  const proxySummary = proxyQuery.query.data?.data?.summary;
  const proxyItems = proxyQuery.query.data?.data?.items ?? [];
  const activeProxyItems = proxyItems.filter((item) => item.status !== "revoked");
  const revokedProxyItems = proxyItems.filter((item) => item.status === "revoked");
  const quorumProgressLabel = `${proxySummary?.enabledHomesCount ?? 0} / ${
    proxySummary?.totalHomesBase ?? 0
  }`;
  const representativeGroups = useMemo<RepresentativeGroup[]>(() => {
    const groups = new Map<number | string, RepresentativeGroup>();

    activeProxyItems.forEach((item) => {
      if (!item.submittedBy) {
        return;
      }

      const nextKey = item.submittedBy.id ?? `representante-${item.id}`;
      const existingGroup = groups.get(nextKey);

      if (existingGroup) {
        existingGroup.items.push(item);
        existingGroup.representedHomesCount += 1;
        existingGroup.supportsCount += item.document?.id ? 1 : 0;
        existingGroup.totalCoefficient += Number(
          item.representedResident?.coefficient ?? 0,
        );
        return;
      }

      groups.set(nextKey, {
        id: nextKey,
        items: [item],
        representedHomesCount: 1,
        representative: item.submittedBy,
        supportsCount: item.document?.id ? 1 : 0,
        totalCoefficient: Number(item.representedResident?.coefficient ?? 0),
      });
    });

    return Array.from(groups.values()).sort((left, right) =>
      `${left.representative.unit ?? ""}${left.representative.name}`.localeCompare(
        `${right.representative.unit ?? ""}${right.representative.name}`,
      ),
    );
  }, [activeProxyItems]);

  const openRevokeModal = (item: ProxyItem) => {
    setRevokeTarget(item);
    revokeForm.setFieldsValue({
      reason: item.revokedReason ?? "",
    });
  };

  const closeRevokeModal = () => {
    setRevokeTarget(null);
    revokeForm.resetFields();
  };

  const handleRevoke = async () => {
    if (!revokeTarget) {
      return;
    }

    try {
      const values = await revokeForm.validateFields();
      await revokeMutation.mutateAsync({
        url: `${API_URL}/api/proxy-authorizations/admin/${revokeTarget.id}/revoke`,
        method: "post",
        values,
        errorNotification: false,
        successNotification: false,
      });
      closeRevokeModal();
      setPreviewState(null);
      await proxyQuery.query.refetch();
      message.success("El poder fue revocado y la representación quedó actualizada.");
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "errorFields" in error &&
        Array.isArray((error as { errorFields?: unknown[] }).errorFields)
      ) {
        return;
      }

      message.error(
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "No fue posible revocar el poder.",
      );
    }
  };

  return (
    <>
      <PageIntro
        kicker="Asamblea"
        title={record?.title ?? "Detalle de asamblea"}
        description="Consulta la fecha de ejecucion, el estado operativo, los poderes activos y las revocaciones registradas para esta asamblea."
      />
      <Show isLoading={isLoading} title="Detalle de asamblea">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card className="vr-section-card">
              <Title level={5}>Identificador</Title>
              <TextField value={record?.id} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card className="vr-section-card">
              <Title level={5}>Fecha programada</Title>
              <DateField value={record?.date} format="DD MMM YYYY - hh:mm A" />
            </Card>
          </Col>
          <Col xs={24}>
            <Card className="vr-section-card">
              <Title level={5}>Estado</Title>
              <Tag color={record?.status === "in_progress" ? "green" : record?.status === "finished" ? "default" : "gold"}>
                {record?.status === "in_progress"
                  ? "En curso"
                  : record?.status === "finished"
                    ? "Finalizada"
                    : "Programada"}
              </Tag>
            </Card>
          </Col>
          <Col xs={24}>
            <Card
              className="vr-section-card"
              loading={proxyQuery.query.isLoading}
              title="Poderes registrados"
              extra={
                <Space wrap>
                  <Tag color="blue" icon={<TeamOutlined />}>
                    {proxySummary?.representedHomesCount ?? 0} representados
                  </Tag>
                  <Tag color="red">
                    {proxySummary?.revokedHomesCount ?? 0} revocados
                  </Tag>
                  <Tag color={proxySummary?.quorumReached ? "green" : "gold"}>
                    Quorum {quorumProgressLabel}
                  </Tag>
                </Space>
              }
            >
              <Alert
                type={proxySummary?.quorumReached ? "success" : "info"}
                showIcon
                style={{ marginBottom: 16 }}
                message={
                  proxySummary?.quorumReached
                    ? "El quorum minimo ya fue alcanzado."
                    : "El quorum aun esta en construccion."
                }
                description={`Casas habilitadas ${quorumProgressLabel}. Minimo requerido: ${
                  proxySummary?.quorumMinHomes ?? 150
                }.`}
              />
              <div className="vr-summary-grid">
                <div className="vr-summary-card">
                  <div className="vr-summary-label">Representantes</div>
                  <div className="vr-summary-value">
                    {proxySummary?.representativesCount ?? 0}
                  </div>
                </div>
                <div className="vr-summary-card">
                  <div className="vr-summary-label">Poderes activos</div>
                  <div className="vr-summary-value">
                    {proxySummary?.representedHomesCount ?? 0}
                  </div>
                </div>
                <div className="vr-summary-card">
                  <div className="vr-summary-label">Soportes cargados</div>
                  <div className="vr-summary-value">
                    {proxySummary?.supportsCount ?? 0}
                  </div>
                </div>
                <div className="vr-summary-card">
                  <div className="vr-summary-label">Poderes revocados</div>
                  <div className="vr-summary-value">
                    {proxySummary?.revokedHomesCount ?? 0}
                  </div>
                </div>
                <div className="vr-summary-card">
                  <div className="vr-summary-label">Usuarios con ingreso</div>
                  <div className="vr-summary-value">
                    {proxySummary?.loggedUsersCount ?? 0}
                  </div>
                </div>
                <div className="vr-summary-card">
                  <div className="vr-summary-label">Casas habilitadas</div>
                  <div className="vr-summary-value">
                    {proxySummary?.enabledHomesCount ?? 0}
                  </div>
                </div>
                <div className="vr-summary-card">
                  <div className="vr-summary-label">Quorum objetivo</div>
                  <div className="vr-summary-value">
                    {proxySummary?.quorumMinHomes ?? 150} /{" "}
                    {proxySummary?.totalHomesBase ?? 0}
                  </div>
                </div>
              </div>

              {representativeGroups.length > 0 ? (
                <Collapse
                  accordion
                  className="vr-proxy-collapse"
                  items={representativeGroups.map((group) => ({
                    key: String(group.id),
                    label: (
                      <div className="vr-proxy-collapse-header">
                        <div className="vr-proxy-collapse-title">
                          <Text strong>{group.representative.unit ?? "Sin unidad"}</Text>
                          <Title level={5} style={{ margin: 0 }}>
                            {group.representative.name}
                          </Title>
                        </div>
                        <div className="vr-proxy-collapse-metrics">
                          <div className="vr-proxy-metric-chip">
                            <strong>{group.representedHomesCount}</strong>
                            <span>Residentes representados</span>
                          </div>
                          <div className="vr-proxy-metric-chip">
                            <strong>{group.totalCoefficient.toFixed(6)}</strong>
                            <span>Coeficiente acumulado</span>
                          </div>
                          <div className="vr-proxy-metric-chip">
                            <strong>{group.supportsCount}</strong>
                            <span>Soportes cargados</span>
                          </div>
                        </div>
                      </div>
                    ),
                    children: (
                      <List
                        className="vr-proxy-resident-list"
                        dataSource={group.items}
                        renderItem={(item) => {
                          const documentUrl = buildDocumentUrl(item.document?.url);
                          const nextPreview =
                            documentUrl
                              ? {
                                  mime: item.document?.mime ?? null,
                                  name: item.document?.name ?? "Soporte",
                                  url: documentUrl,
                                }
                              : null;

                          return (
                            <List.Item
                              className="vr-proxy-resident-item"
                              actions={[
                                documentUrl ? (
                                  <Button
                                    key={`preview-${item.id}`}
                                    type="link"
                                    icon={
                                      isPdfDocument(nextPreview) ? (
                                        <FilePdfOutlined />
                                      ) : (
                                        <FileImageOutlined />
                                      )
                                    }
                                    onClick={() =>
                                      nextPreview
                                        ? setPreviewState({
                                            document: nextPreview,
                                            item,
                                          })
                                        : undefined
                                    }
                                  >
                                    Ver poder
                                  </Button>
                                ) : (
                                  <Tag key={`missing-${item.id}`}>Sin soporte</Tag>
                                ),
                                documentUrl ? (
                                  <Button
                                    key={`download-${item.id}`}
                                    type="link"
                                    icon={<DownloadOutlined />}
                                    href={documentUrl}
                                    download={
                                      item.document?.name ??
                                      `poder-${item.document?.id ?? item.id}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Descargar
                                  </Button>
                                ) : null,
                              ].filter(Boolean)}
                            >
                              <div className="vr-proxy-resident-card">
                                <div className="vr-proxy-resident-main">
                                  <Text strong>
                                    {item.representedResident?.unit ?? "Sin unidad"}
                                  </Text>
                                  <Title level={5} style={{ margin: 0 }}>
                                    {item.representedResident?.name ?? "Sin registro"}
                                  </Title>
                                  <Space wrap>
                                    <Tag color="green">Activo</Tag>
                                    <Tag color="gold">
                                      Coeficiente{" "}
                                      {Number(
                                        item.representedResident?.coefficient ?? 0,
                                      ).toFixed(6)}
                                    </Tag>
                                    {item.document?.name ? (
                                      <Tag color="processing">
                                        {item.document.name}
                                      </Tag>
                                    ) : null}
                                  </Space>
                                </div>
                                <div className="vr-proxy-resident-meta">
                                  <span>Registro</span>
                                  {item.registeredAt ? (
                                    <DateField
                                      value={item.registeredAt}
                                      format="DD MMM YYYY - hh:mm A"
                                    />
                                  ) : (
                                    <Text type="secondary">Sin fecha</Text>
                                  )}
                                </div>
                              </div>
                            </List.Item>
                          );
                        }}
                      />
                    ),
                  }))}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Esta asamblea aun no tiene poderes activos registrados."
                />
              )}

              {revokedProxyItems.length > 0 ? (
                <div style={{ marginTop: 24 }}>
                  <Title level={4}>Poderes revocados</Title>
                  <List
                    className="vr-proxy-resident-list"
                    dataSource={revokedProxyItems}
                    renderItem={(item) => {
                      const documentUrl = buildDocumentUrl(item.document?.url);
                      const nextPreview =
                        documentUrl
                          ? {
                              mime: item.document?.mime ?? null,
                              name: item.document?.name ?? "Soporte",
                              url: documentUrl,
                            }
                          : null;

                      return (
                        <List.Item
                          className="vr-proxy-resident-item"
                          actions={[
                            documentUrl ? (
                              <Button
                                key={`preview-revoked-${item.id}`}
                                type="link"
                                icon={
                                  isPdfDocument(nextPreview) ? (
                                    <FilePdfOutlined />
                                  ) : (
                                    <FileImageOutlined />
                                  )
                                }
                                onClick={() =>
                                  nextPreview
                                    ? setPreviewState({
                                        document: nextPreview,
                                        item,
                                      })
                                    : undefined
                                }
                              >
                                Ver poder
                              </Button>
                            ) : (
                              <Tag key={`missing-revoked-${item.id}`}>Sin soporte</Tag>
                            ),
                          ].filter(Boolean)}
                        >
                          <div className="vr-proxy-resident-card">
                            <div className="vr-proxy-resident-main">
                              <Text strong>
                                {item.representedResident?.unit ?? "Sin unidad"}
                              </Text>
                              <Title level={5} style={{ margin: 0 }}>
                                {item.representedResident?.name ?? "Sin registro"}
                              </Title>
                              <Space wrap>
                                <Tag color="red">Revocado</Tag>
                                {item.submittedBy?.unit ? (
                                  <Tag color="processing">
                                    Intentó representar: {item.submittedBy.unit}
                                  </Tag>
                                ) : null}
                              </Space>
                              <Paragraph style={{ marginBottom: 0, marginTop: 12 }}>
                                <Text strong>Motivo:</Text>{" "}
                                {item.revokedReason ?? "Sin observación registrada."}
                              </Paragraph>
                            </div>
                            <div className="vr-proxy-resident-meta">
                              <span>Revocación</span>
                              {item.revokedAt ? (
                                <DateField
                                  value={item.revokedAt}
                                  format="DD MMM YYYY - hh:mm A"
                                />
                              ) : (
                                <Text type="secondary">Sin fecha</Text>
                              )}
                              {item.revokedBy?.name ? (
                                <Text type="secondary">
                                  Por {item.revokedBy.name}
                                </Text>
                              ) : null}
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                </div>
              ) : null}
            </Card>
          </Col>
        </Row>
      </Show>

      <Modal
        open={Boolean(previewState)}
        title={previewState?.document.name ?? "Vista del poder"}
        width={960}
        onCancel={() => setPreviewState(null)}
        footer={
          previewState
            ? [
                previewState.item.status !== "revoked" ? (
                  <Button
                    key="revoke"
                    danger
                    onClick={() => openRevokeModal(previewState.item)}
                  >
                    Revocar poder
                  </Button>
                ) : null,
                <Button key="close" onClick={() => setPreviewState(null)}>
                  Cerrar
                </Button>,
                <Button
                  key="download"
                  type="primary"
                  icon={<DownloadOutlined />}
                  href={previewState.document.url}
                  download={previewState.document.name ?? "poder"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Descargar archivo
                </Button>,
              ]
            : null
        }
      >
        {previewState ? (
          <>
            <Space direction="vertical" size={12} style={{ width: "100%", marginBottom: 16 }}>
              <Space wrap>
                <Tag color={previewState.item.status === "revoked" ? "red" : "green"}>
                  {previewState.item.status === "revoked" ? "Revocado" : "Activo"}
                </Tag>
                {previewState.item.submittedBy?.unit ? (
                  <Tag color="blue">
                    Representante: {previewState.item.submittedBy.unit}
                  </Tag>
                ) : null}
                {previewState.item.representedResident?.unit ? (
                  <Tag color="gold">
                    Unidad: {previewState.item.representedResident.unit}
                  </Tag>
                ) : null}
              </Space>
              {previewState.item.revokedReason ? (
                <Alert
                  type="warning"
                  showIcon
                  message="Este poder fue revocado"
                  description={previewState.item.revokedReason}
                />
              ) : null}
            </Space>
            {isPdfDocument(previewState.document) ? (
              <iframe
                title={previewState.document.name ?? "Vista previa del poder"}
                src={previewState.document.url}
                className="vr-proxy-preview-frame"
              />
            ) : (
              <div className="vr-proxy-preview-image-shell">
                <img
                  src={previewState.document.url}
                  alt={previewState.document.name ?? "Vista previa del poder"}
                  className="vr-proxy-preview-image"
                />
              </div>
            )}
          </>
        ) : (
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Selecciona un poder para visualizarlo.
          </Paragraph>
        )}
      </Modal>

      <Modal
        open={Boolean(revokeTarget)}
        title="Revocar poder"
        okText="Confirmar revocación"
        cancelText="Cancelar"
        confirmLoading={revokeMutation.mutation.isPending}
        onOk={handleRevoke}
        onCancel={closeRevokeModal}
      >
        <Form form={revokeForm} layout="vertical" requiredMark={false}>
          <Paragraph>
            Explica por qué se revoca este poder. La observación quedará visible
            para el administrador, la unidad representada y quien intentó
            representarla.
          </Paragraph>
          <Form.Item
            label="Motivo de revocación"
            name="reason"
            rules={[
              {
                required: true,
                message: "Debes explicar por qué se revoca este poder.",
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              maxLength={800}
              placeholder="Ejemplo: el documento no está firmado o los datos de la unidad no coinciden."
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
