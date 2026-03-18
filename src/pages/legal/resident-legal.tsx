import { Link } from "react-router";
import { useCustom } from "@refinedev/core";
import dayjs from "dayjs";
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Col, Divider, Row, Space, Typography } from "antd";
import { API_URL } from "../../constants";
import { useDeviceLayout } from "../../utils/device-mode";

type ResidentLegalSection = {
  bullets?: string[];
  id: string;
  paragraphs: string[];
  title: string;
};

type ResidentLegalDocumentResponse = {
  checkboxLabel: string;
  contentHash: string;
  documentKey: string;
  sections: ResidentLegalSection[];
  summary: string;
  title: string;
  updatedAt: string;
  version: string;
};

export const ResidentLegalPage = () => {
  const { isMobileLayout } = useDeviceLayout();
  const legalQuery = useCustom<ResidentLegalDocumentResponse>({
    method: "get",
    url: `${API_URL}/api/account/resident-legal`,
  });

  const document = legalQuery.query.data?.data;

  return (
    <Row align="middle" justify="center" className="vr-auth-shell">
      <Col xs={24} lg={22} xl={20}>
        <Card
          variant="borderless"
          styles={{ body: { padding: 0 } }}
          className="vr-auth-card"
        >
          <Row gutter={0}>
            <Col xs={24} lg={isMobileLayout ? 24 : 10}>
              <div className="vr-auth-brand">
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                  <div>
                    <div className="vr-auth-badge">
                      <SafetyCertificateOutlined />
                      Documento legal
                    </div>
                    <Typography.Title level={1} className="vr-auth-title">
                      Politica y terminos del portal
                    </Typography.Title>
                    <Typography.Paragraph className="vr-auth-description">
                      Este documento explica como se tratan los datos personales y
                      cuales son las reglas operativas para participar en la
                      asamblea del conjunto a traves del portal residente.
                    </Typography.Paragraph>
                  </div>

                  <div className="vr-auth-points">
                    <div className="vr-auth-point">
                      <strong>Version vigente</strong>
                      {document?.version ?? "Cargando..."}
                    </div>
                    <div className="vr-auth-point">
                      <strong>Ultima actualizacion</strong>
                      {document?.updatedAt
                        ? dayjs(document.updatedAt).format("DD MMM YYYY - hh:mm A")
                        : "Cargando..."}
                    </div>
                    <div className="vr-auth-point">
                      <strong>Aceptacion requerida</strong>
                      El residente debe aceptar la version vigente antes de entrar
                      cuando el sistema lo solicite.
                    </div>
                  </div>
                </Space>
              </div>
            </Col>

            <Col xs={24} lg={isMobileLayout ? 24 : 14}>
              <div className="vr-auth-form-wrap">
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                  <div className="vr-auth-badge">
                    <FileTextOutlined />
                    Consulta publica
                  </div>

                  {legalQuery.query.isLoading ? (
                    <Alert
                      type="info"
                      showIcon
                      message="Estamos cargando el documento legal vigente."
                    />
                  ) : null}

                  {legalQuery.query.isError ? (
                    <Alert
                      type="error"
                      showIcon
                      message="No fue posible cargar el documento legal."
                      description="Recarga la pagina o vuelve al login e intenta nuevamente."
                    />
                  ) : null}

                  {document ? (
                    <>
                      <div>
                        <Typography.Title
                          level={2}
                          className="vr-auth-panel-title"
                        >
                          {document.title}
                        </Typography.Title>
                        <Typography.Paragraph className="vr-auth-panel-copy">
                          {document.summary}
                        </Typography.Paragraph>
                      </div>

                      <div className="vr-legal-stack">
                        {document.sections.map((section) => (
                          <section className="vr-legal-section" key={section.id}>
                            <Typography.Title level={4}>
                              {section.title}
                            </Typography.Title>
                            {section.paragraphs.map((paragraph) => (
                              <Typography.Paragraph
                                className="vr-auth-panel-copy"
                                key={`${section.id}-${paragraph.slice(0, 32)}`}
                              >
                                {paragraph}
                              </Typography.Paragraph>
                            ))}
                            {section.bullets?.length ? (
                              <ul className="vr-legal-bullets">
                                {section.bullets.map((bullet) => (
                                  <li key={`${section.id}-${bullet}`}>
                                    <Typography.Text>{bullet}</Typography.Text>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </section>
                        ))}
                      </div>
                    </>
                  ) : null}

                  <Divider style={{ margin: 0 }} />

                  <Space wrap>
                    <Link to="/login">
                      <Button icon={<ArrowLeftOutlined />} size="large">
                        Volver al login
                      </Button>
                    </Link>
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
