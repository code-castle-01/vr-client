import {
  DownloadOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Alert, Button, Empty, Modal, Space, Spin, Typography } from "antd";
import { useEffect, useState } from "react";

export type MeetingDocumentRecord = {
  createdAt?: string | null;
  file?: {
    ext?: string | null;
    id: number;
    mime?: string | null;
    name?: string | null;
    size?: number | null;
    url?: string | null;
  } | null;
  id: number;
  title: string;
  updatedAt?: string | null;
  uploadedBy?: {
    id: number;
    name: string;
    unit?: string | null;
  } | null;
};

const { Paragraph, Text } = Typography;

export const buildMeetingDocumentUrl = (baseUrl: string, url?: string | null) => {
  if (!url) {
    return null;
  }

  return url.startsWith("http") ? url : `${baseUrl}${url}`;
};

export const getMeetingDocumentKind = (document: MeetingDocumentRecord) => {
  const mime = document.file?.mime?.toLowerCase() ?? "";
  const extension = document.file?.ext?.toLowerCase() ?? "";

  if (mime.includes("pdf") || extension === ".pdf") {
    return "pdf";
  }

  if (mime.startsWith("image/")) {
    return "image";
  }

  if (
    mime.includes("sheet") ||
    mime.includes("excel") ||
    extension === ".xls" ||
    extension === ".xlsx" ||
    extension === ".csv"
  ) {
    return "spreadsheet";
  }

  if (mime.includes("word") || extension === ".doc" || extension === ".docx") {
    return "document";
  }

  return "file";
};

const getFallbackIcon = (kind: ReturnType<typeof getMeetingDocumentKind>) => {
  if (kind === "pdf") {
    return <FilePdfOutlined />;
  }

  if (kind === "image") {
    return <FileImageOutlined />;
  }

  if (kind === "spreadsheet") {
    return <FileExcelOutlined />;
  }

  return <FileTextOutlined />;
};

type DocumentPreviewModalProps = {
  baseUrl: string;
  document: MeetingDocumentRecord | null;
  onClose: () => void;
  open: boolean;
};

export const DocumentPreviewModal = ({
  baseUrl,
  document,
  onClose,
  open,
}: DocumentPreviewModalProps) => {
  const fileUrl = document ? buildMeetingDocumentUrl(baseUrl, document.file?.url) : null;
  const kind = document ? getMeetingDocumentKind(document) : "file";
  const isMobileViewport =
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 768px)").matches
      : false;
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  useEffect(() => {
    if (!open || !document || kind !== "pdf" || !fileUrl || isMobileViewport) {
      setPdfPreviewUrl(null);
      setPdfPreviewError(null);
      setIsLoadingPdf(false);
      return;
    }

    const controller = new AbortController();
    let nextObjectUrl: string | null = null;

    const loadPdfPreview = async () => {
      setIsLoadingPdf(true);
      setPdfPreviewError(null);

      try {
        const response = await fetch(fileUrl, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("No pudimos obtener el PDF para visualizarlo.");
        }

        const blob = await response.blob();
        nextObjectUrl = URL.createObjectURL(
          blob.type === "application/pdf"
            ? blob
            : new Blob([await blob.arrayBuffer()], { type: "application/pdf" }),
        );

        setPdfPreviewUrl(nextObjectUrl);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setPdfPreviewError(
          error instanceof Error
            ? error.message
            : "No pudimos mostrar el PDF en este visor.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPdf(false);
        }
      }
    };

    loadPdfPreview();

    return () => {
      controller.abort();

      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [document, fileUrl, isMobileViewport, kind, open]);

  return (
    <Modal
      destroyOnClose
      open={open}
      title={document?.title ?? "Documento"}
      width={960}
      onCancel={onClose}
      footer={
        document && fileUrl
          ? [
              <Button key="close" onClick={onClose}>
                Cerrar
              </Button>,
              <Button
                key="download"
                type="primary"
                icon={<DownloadOutlined />}
                href={fileUrl}
                download={document.file?.name ?? document.title}
                target="_blank"
                rel="noreferrer"
              >
                Descargar
              </Button>,
            ]
          : null
      }
    >
      {!document || !fileUrl ? (
        <Empty description="No encontramos un archivo para visualizar." />
      ) : kind === "pdf" ? (
        isMobileViewport ? (
          <div className="vr-document-preview-fallback">
            <div className="vr-document-preview-fallback__icon">
              <FilePdfOutlined />
            </div>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Text strong>{document.file?.name ?? document.title}</Text>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                En dispositivos moviles es mas estable abrir el PDF en otra
                pestaña para conservar la calidad de lectura sin sacarte del
                sistema.
              </Paragraph>
              <Space wrap>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir en otra pestaña
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  href={fileUrl}
                  download={document.file?.name ?? document.title}
                  target="_blank"
                  rel="noreferrer"
                >
                  Descargar PDF
                </Button>
              </Space>
            </Space>
          </div>
        ) : isLoadingPdf ? (
          <div className="vr-document-preview-loading">
            <Spin size="large" />
            <Text type="secondary">Preparando vista previa del PDF...</Text>
          </div>
        ) : pdfPreviewUrl ? (
          <iframe
            title={document.title}
            src={pdfPreviewUrl}
            className="vr-proxy-preview-frame"
          />
        ) : (
          <div className="vr-document-preview-fallback">
            <div className="vr-document-preview-fallback__icon">
              <FilePdfOutlined />
            </div>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Alert
                showIcon
                type="warning"
                message="No pudimos incrustar el PDF en este navegador"
                description={
                  pdfPreviewError ??
                  "Puedes abrirlo en otra pestaña o descargarlo para revisarlo."
                }
              />
              <Space wrap>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir en otra pestaña
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  href={fileUrl}
                  download={document.file?.name ?? document.title}
                  target="_blank"
                  rel="noreferrer"
                >
                  Descargar PDF
                </Button>
              </Space>
            </Space>
          </div>
        )
      ) : kind === "image" ? (
        <div className="vr-proxy-preview-image-shell">
          <img src={fileUrl} alt={document.title} className="vr-proxy-preview-image" />
        </div>
      ) : (
        <div className="vr-document-preview-fallback">
          <div className="vr-document-preview-fallback__icon">{getFallbackIcon(kind)}</div>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Text strong>{document.file?.name ?? document.title}</Text>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Este tipo de archivo no se puede previsualizar dentro del navegador,
              pero ya está disponible para abrir o descargar.
            </Paragraph>
            <Space wrap>
              <Button icon={<EyeOutlined />} href={fileUrl} target="_blank" rel="noreferrer">
                Abrir archivo
              </Button>
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
            </Space>
          </Space>
        </div>
      )}
    </Modal>
  );
};
