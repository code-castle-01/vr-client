import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { DateField } from "@refinedev/antd";
import { useCustom, useCustomMutation } from "@refinedev/core";
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
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

type DocumentFormValues = {
  file?: UploadFile[];
  title: string;
};

type EditorState =
  | { mode: "create"; document: null }
  | { mode: "edit"; document: MeetingDocumentRecord };

const formatFileSize = (size?: number | null) => {
  const normalizedSize = Number(size ?? 0);

  if (normalizedSize <= 0) {
    return "Sin peso";
  }

  if (normalizedSize < 1024 * 1024) {
    return `${(normalizedSize / 1024).toFixed(1)} KB`;
  }

  return `${(normalizedSize / (1024 * 1024)).toFixed(1)} MB`;
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

export const AdminDocumentsPage = () => {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<DocumentFormValues>();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [previewDocument, setPreviewDocument] =
    useState<MeetingDocumentRecord | null>(null);

  const documentsQuery = useCustom<DocumentsResponse>({
    url: `${API_URL}/api/meeting-documents/admin`,
    method: "get",
  });

  const createDocument = useCustomMutation<MeetingDocumentRecord>();
  const updateDocument = useCustomMutation<MeetingDocumentRecord>();
  const deleteDocument = useCustomMutation<{ removed: boolean }>();

  const documents = documentsQuery.query.data?.data?.items ?? [];

  const openCreateModal = () => {
    form.resetFields();
    setEditorState({ mode: "create", document: null });
  };

  const openEditModal = (document: MeetingDocumentRecord) => {
    form.setFieldsValue({
      file: [],
      title: document.title,
    });
    setEditorState({ mode: "edit", document });
  };

  const closeEditor = () => {
    form.resetFields();
    setEditorState(null);
  };

  const handleSubmit = async (values: DocumentFormValues) => {
    const formData = new FormData();
    formData.append("title", values.title);

    const rawFile = values.file?.[0]?.originFileObj;

    if (rawFile) {
      formData.append("file", rawFile);
    }

    if (!editorState) {
      return;
    }

    if (editorState.mode === "create" && !rawFile) {
      message.error("Debes seleccionar un archivo para continuar.");
      return;
    }

    try {
      if (editorState.mode === "create") {
        await createDocument.mutateAsync({
          url: `${API_URL}/api/meeting-documents/admin`,
          method: "post",
          values: formData,
          errorNotification: false,
          successNotification: false,
          config: {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        });
        message.success("Documento cargado correctamente.");
      } else {
        await updateDocument.mutateAsync({
          url: `${API_URL}/api/meeting-documents/admin/${editorState.document.id}`,
          method: "put",
          values: formData,
          errorNotification: false,
          successNotification: false,
          config: {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        });
        message.success("Documento actualizado correctamente.");
      }

      closeEditor();
      await documentsQuery.query.refetch();
    } catch (error) {
      const nextMessage =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "No fue posible guardar el documento.";

      message.error(nextMessage);
    }
  };

  const handleDelete = async (documentId: number) => {
    try {
      await deleteDocument.mutateAsync({
        url: `${API_URL}/api/meeting-documents/admin/${documentId}`,
        method: "delete",
        values: {},
        errorNotification: false,
        successNotification: false,
      });

      message.success("Documento eliminado correctamente.");
      await documentsQuery.query.refetch();
    } catch (error) {
      const nextMessage =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "No fue posible eliminar el documento.";

      message.error(nextMessage);
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <PageIntro
        kicker="Administracion"
        title="Archivos"
        description="Carga presupuestos, actas y documentos clave de la asamblea. Los residentes podran consultarlos y descargarlos desde su portal."
        extra={
          <Button
            icon={<FileAddOutlined />}
            size="large"
            type="primary"
            onClick={openCreateModal}
          >
            Subir archivo
          </Button>
        }
      />

      <Card className="vr-section-card">
        <Table
          dataSource={documents}
          loading={documentsQuery.query.isLoading}
          pagination={false}
          rowKey="id"
          scroll={{ x: 960 }}
        >
          <Table.Column
            title="Documento"
            dataIndex="title"
            render={(_: string, record: MeetingDocumentRecord) => (
              <div>
                <Typography.Text strong>{record.title}</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  {record.file?.name ?? "Sin archivo adjunto"}
                </Typography.Text>
              </div>
            )}
          />
          <Table.Column
            title="Tipo"
            dataIndex="file"
            render={(_: unknown, record: MeetingDocumentRecord) => (
              <Tag color="gold">{getKindLabel(record)}</Tag>
            )}
          />
          <Table.Column
            title="Peso"
            dataIndex="file"
            render={(_: unknown, record: MeetingDocumentRecord) =>
              formatFileSize(record.file?.size)
            }
          />
          <Table.Column
            title="Actualizado"
            dataIndex="updatedAt"
            render={(value: string | null | undefined) =>
              value ? <DateField value={value} format="DD MMM YYYY - hh:mm A" /> : "-"
            }
          />
          <Table.Column
            title="Acciones"
            dataIndex="actions"
            render={(_: unknown, record: MeetingDocumentRecord) => {
              const fileUrl = buildMeetingDocumentUrl(API_URL, record.file?.url);

              return (
                <Space wrap>
                  <Button icon={<EyeOutlined />} onClick={() => setPreviewDocument(record)}>
                    Ver
                  </Button>
                  {fileUrl ? (
                    <Button
                      icon={<DownloadOutlined />}
                      href={fileUrl}
                      download={record.file?.name ?? record.title}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Descargar
                    </Button>
                  ) : null}
                  <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                    Editar
                  </Button>
                  <Popconfirm
                    cancelText="Cancelar"
                    okText="Eliminar"
                    title="¿Eliminar este documento?"
                    description="Dejara de estar disponible para todos los residentes."
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      Borrar
                    </Button>
                  </Popconfirm>
                </Space>
              );
            }}
          />
        </Table>
      </Card>

      <Modal
        destroyOnClose
        open={Boolean(editorState)}
        title={editorState?.mode === "create" ? "Subir archivo" : "Editar documento"}
        okText={editorState?.mode === "create" ? "Guardar archivo" : "Guardar cambios"}
        cancelText="Cancelar"
        confirmLoading={createDocument.mutation.isPending || updateDocument.mutation.isPending}
        onCancel={closeEditor}
        onOk={() => form.submit()}
      >
        <Form<DocumentFormValues>
          form={form}
          layout="vertical"
          preserve={false}
          requiredMark={false}
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Titulo del archivo"
            name="title"
            rules={[{ required: true, message: "Ingresa un titulo para el documento." }]}
          >
            <Input placeholder="Ej. Presupuesto general 2026" />
          </Form.Item>
          <Form.Item
            label="Archivo"
            name="file"
            valuePropName="fileList"
            getValueFromEvent={(event) => (event?.fileList ?? []).slice(-1)}
            rules={
              editorState?.mode === "create"
                ? [{ required: true, message: "Selecciona un archivo para cargar." }]
                : undefined
            }
            extra={
              editorState?.mode === "edit" && editorState.document?.file?.name
                ? `Archivo actual: ${editorState.document.file.name}. Si cargas uno nuevo, reemplazaremos el anterior.`
                : "Puedes subir PDF, Word, Excel, CSV, PowerPoint o imagen."
            }
          >
            <Upload.Dragger
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
              beforeUpload={() => false}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <FileTextOutlined />
              </p>
              <p className="ant-upload-text">Selecciona o arrastra el archivo</p>
              <p className="ant-upload-hint">
                El documento quedará visible para los residentes desde su portal.
              </p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>

      <DocumentPreviewModal
        baseUrl={API_URL}
        document={previewDocument}
        open={Boolean(previewDocument)}
        onClose={() => setPreviewDocument(null)}
      />
    </Space>
  );
};
