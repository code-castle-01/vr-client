import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { DateField } from "@refinedev/antd";
import { useCustom } from "@refinedev/core";
import { Button, Card, Empty, List, Space, Tag, Typography } from "antd";
import { useState } from "react";
import { DocumentPreviewModal, PageIntro } from "../../components";
import {
  type MeetingDocumentRecord,
  buildMeetingDocumentUrl,
  getMeetingDocumentKind,
} from "../../components/document-preview-modal";
import { API_URL } from "../../constants";

type DocumentsResponse = {
  items: MeetingDocumentRecord[];
  total: number;
};

const getKindLabel = (document: MeetingDocumentRecord) => {
  const kind = getMeetingDocumentKind(document);

  if (kind === "pdf") {
    return "PDF";
  }

  if (kind === "image") {
    return "Imagen";
  }

  if (kind === "spreadsheet") {
    return "Excel / CSV";
  }

  if (kind === "document") {
    return "Word";
  }

  return "Archivo";
};

export const ResidentDocumentsPage = () => {
  const [previewDocument, setPreviewDocument] =
    useState<MeetingDocumentRecord | null>(null);

  const documentsQuery = useCustom<DocumentsResponse>({
    url: `${API_URL}/api/meeting-documents/library`,
    method: "get",
  });

  const documents = documentsQuery.query.data?.data?.items ?? [];

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <PageIntro
        kicker="Consulta"
        title="Documentos de la asamblea"
        description="Aqui puedes consultar presupuestos, soportes y archivos oficiales compartidos por la administracion de la asamblea."
      />

      <Card className="vr-section-card">
        {documents.length > 0 ? (
          <List
            dataSource={documents}
            itemLayout="vertical"
            loading={documentsQuery.query.isLoading}
            renderItem={(document) => {
              const fileUrl = buildMeetingDocumentUrl(API_URL, document.file?.url);

              return (
                <List.Item className="vr-document-card">
                  <div className="vr-document-card__body">
                    <div className="vr-document-card__copy">
                      <Space wrap>
                        <Tag color="gold">{getKindLabel(document)}</Tag>
                        {document.updatedAt ? (
                          <Tag>
                            <DateField value={document.updatedAt} format="DD MMM YYYY - hh:mm A" />
                          </Tag>
                        ) : null}
                      </Space>
                      <Typography.Title level={4} style={{ marginBottom: 6 }}>
                        {document.title}
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        {document.file?.name ?? "Archivo oficial"}
                      </Typography.Text>
                    </div>
                    <Space wrap>
                      <Button icon={<EyeOutlined />} onClick={() => setPreviewDocument(document)}>
                        Ver
                      </Button>
                      {fileUrl ? (
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          href={fileUrl}
                          download={document.file?.name ?? document.title}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Descargar
                        </Button>
                      ) : null}
                    </Space>
                  </div>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="Aun no hay documentos compartidos para esta asamblea." />
        )}
      </Card>

      <DocumentPreviewModal
        baseUrl={API_URL}
        document={previewDocument}
        open={Boolean(previewDocument)}
        onClose={() => setPreviewDocument(null)}
      />
    </Space>
  );
};
