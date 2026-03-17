import {
  DownloadOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Alert, Button, Empty, Modal, Space, Spin, Typography } from "antd";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useState } from "react";
import { useDeviceLayout } from "../../utils/device-mode";

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
const PDF_RENDER_SCALE_DESKTOP = 1.65;
const PDF_RENDER_SCALE_MOBILE = 2;

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type PdfPreviewPage = {
  pageNumber: number;
  src: string;
};

export const buildMeetingDocumentUrl = (
  baseUrl: string,
  url?: string | null,
) => {
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
  document: selectedDocument,
  onClose,
  open,
}: DocumentPreviewModalProps) => {
  const fileUrl = selectedDocument
    ? buildMeetingDocumentUrl(baseUrl, selectedDocument.file?.url)
    : null;
  const kind = selectedDocument
    ? getMeetingDocumentKind(selectedDocument)
    : "file";
  const { isMobileLayout } = useDeviceLayout();
  const [pdfPreviewPages, setPdfPreviewPages] = useState<PdfPreviewPage[]>([]);
  const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  useEffect(() => {
    if (!open || !selectedDocument || kind !== "pdf" || !fileUrl) {
      setPdfPreviewPages([]);
      setPdfPreviewError(null);
      setIsLoadingPdf(false);
      return;
    }

    const controller = new AbortController();
    const nextObjectUrls: string[] = [];

    const loadPdfPreview = async () => {
      setIsLoadingPdf(true);
      setPdfPreviewPages([]);
      setPdfPreviewError(null);

      try {
        const response = await fetch(fileUrl, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("No pudimos obtener el PDF para visualizarlo.");
        }

        const pdfData = await response.arrayBuffer();
        const pdf = await getDocument({ data: pdfData }).promise;
        const renderedPages: PdfPreviewPage[] = [];

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (controller.signal.aborted) {
            return;
          }

          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({
            scale: isMobileLayout
              ? PDF_RENDER_SCALE_MOBILE
              : PDF_RENDER_SCALE_DESKTOP,
          });
          const canvas = globalThis.document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("No pudimos preparar el visor del documento.");
          }

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          await page.render({
            canvas,
            canvasContext: context,
            viewport,
          }).promise;

          const imageBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/png");
          });

          if (!imageBlob) {
            throw new Error("No pudimos renderizar una pagina del PDF.");
          }

          const pageUrl = URL.createObjectURL(imageBlob);
          nextObjectUrls.push(pageUrl);
          renderedPages.push({
            pageNumber,
            src: pageUrl,
          });
        }

        setPdfPreviewPages(renderedPages);
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

      nextObjectUrls.forEach((pageUrl) => URL.revokeObjectURL(pageUrl));
    };
  }, [selectedDocument, fileUrl, isMobileLayout, kind, open]);

  return (
    <Modal
      className={
        isMobileLayout
          ? "vr-document-modal vr-document-modal--mobile"
          : "vr-document-modal"
      }
      destroyOnClose
      open={open}
      title={selectedDocument?.title ?? "Documento"}
      width={isMobileLayout ? "100%" : 960}
      onCancel={onClose}
      styles={{
        body: {
          padding: isMobileLayout ? 12 : 24,
        },
      }}
      footer={
        selectedDocument && fileUrl
          ? [
              <Button key="close" onClick={onClose}>
                Cerrar
              </Button>,
              <Button
                key="download"
                type="primary"
                icon={<DownloadOutlined />}
                href={fileUrl}
                download={selectedDocument.file?.name ?? selectedDocument.title}
                target="_blank"
                rel="noreferrer"
              >
                Descargar
              </Button>,
            ]
          : null
      }
    >
      {!selectedDocument || !fileUrl ? (
        <Empty description="No encontramos un archivo para visualizar." />
      ) : kind === "pdf" ? (
        isLoadingPdf ? (
          <div className="vr-document-preview-loading">
            <Spin size="large" />
            <Text type="secondary">Preparando vista previa del PDF...</Text>
          </div>
        ) : pdfPreviewPages.length > 0 ? (
          <div className="vr-document-preview-frame-shell">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div className="vr-document-pdf-pages">
                {pdfPreviewPages.map((page) => (
                  <figure
                    key={page.pageNumber}
                    className="vr-document-pdf-page"
                  >
                    <img
                      src={page.src}
                      alt={`${selectedDocument.title} - pagina ${page.pageNumber}`}
                    />
                  </figure>
                ))}
              </div>
            </Space>
          </div>
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
                  download={
                    selectedDocument.file?.name ?? selectedDocument.title
                  }
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
          <img
            src={fileUrl}
            alt={selectedDocument.title}
            className="vr-proxy-preview-image"
          />
        </div>
      ) : (
        <div className="vr-document-preview-fallback">
          <div className="vr-document-preview-fallback__icon">
            {getFallbackIcon(kind)}
          </div>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Text strong>
              {selectedDocument.file?.name ?? selectedDocument.title}
            </Text>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Este tipo de archivo no se puede previsualizar dentro del
              navegador, pero ya está disponible para abrir o descargar.
            </Paragraph>
            <Space wrap>
              <Button
                icon={<EyeOutlined />}
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir archivo
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                href={fileUrl}
                download={selectedDocument.file?.name ?? selectedDocument.title}
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
