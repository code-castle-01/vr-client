import {
  FileImageOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { DateField, Show, TextField } from "@refinedev/antd";
import { useCustom, useShow } from "@refinedev/core";
import {
  Button,
  Card,
  Col,
  Collapse,
  Empty,
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
    status?: string | null;
    submittedBy?: {
      coefficient?: number | null;
      id: number;
      name: string;
      unit?: string | null;
    } | null;
  }>;
  summary?: {
    representedHomesCount: number;
    representativesCount: number;
    supportsCount: number;
  } | null;
};

type ProxyItem = AdminProxyResponse["items"][number];

type PreviewDocument = {
  mime?: string | null;
  name?: string | null;
  url: string;
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
  const { query } = useShow({});
  const { data, isLoading } = query;
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null);

  const record = data?.data;
  const proxyQuery = useCustom<AdminProxyResponse>({
    url: `${API_URL}/api/proxy-authorizations/admin/assemblies/${record?.id}`,
    method: "get",
    queryOptions: {
      enabled: Boolean(record?.id),
    },
  });

  const proxySummary = proxyQuery.query.data?.data?.summary;
  const proxyItems = proxyQuery.query.data?.data?.items ?? [];
  const representativeGroups = useMemo<RepresentativeGroup[]>(() => {
    const groups = new Map<number | string, RepresentativeGroup>();

    proxyItems.forEach((item) => {
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
  }, [proxyItems]);

  return (
    <>
      <PageIntro
        kicker="Asamblea"
        title={record?.title ?? "Detalle de asamblea"}
        description="Consulta la fecha de ejecucion, el estado operativo y los poderes activos registrados para esta asamblea."
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
              title="Poderes activos"
              extra={
                <Tag color="blue" icon={<TeamOutlined />}>
                  {proxySummary?.representedHomesCount ?? 0} representados
                </Tag>
              }
            >
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
                            <strong>{group.totalCoefficient.toFixed(2)}</strong>
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
                                    onClick={() => setPreviewDocument(nextPreview)}
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
                                    <Tag color="gold">
                                      Coeficiente{" "}
                                      {Number(
                                        item.representedResident?.coefficient ?? 0,
                                      ).toFixed(2)}
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
            </Card>
          </Col>
        </Row>
      </Show>

      <Modal
        open={Boolean(previewDocument)}
        title={previewDocument?.name ?? "Vista del poder"}
        width={960}
        onCancel={() => setPreviewDocument(null)}
        footer={
          previewDocument
            ? [
                <Button key="close" onClick={() => setPreviewDocument(null)}>
                  Cerrar
                </Button>,
                <Button
                  key="download"
                  type="primary"
                  icon={<DownloadOutlined />}
                  href={previewDocument.url}
                  download={previewDocument.name ?? "poder"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Descargar archivo
                </Button>,
              ]
            : null
        }
      >
        {previewDocument ? (
          isPdfDocument(previewDocument) ? (
            <iframe
              title={previewDocument.name ?? "Vista previa del poder"}
              src={previewDocument.url}
              className="vr-proxy-preview-frame"
            />
          ) : (
            <div className="vr-proxy-preview-image-shell">
              <img
                src={previewDocument.url}
                alt={previewDocument.name ?? "Vista previa del poder"}
                className="vr-proxy-preview-image"
              />
            </div>
          )
        ) : (
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Selecciona un poder para visualizarlo.
          </Paragraph>
        )}
      </Modal>
    </>
  );
};
