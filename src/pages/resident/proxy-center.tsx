import {
  ArrowLeftOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useCustom, useCustomMutation, useGetIdentity } from "@refinedev/core";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Col,
  Form,
  Popconfirm,
  Result,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useMemo, useState } from "react";
import type { ResidentAccessMode } from "../../auth-utils";
import { API_URL } from "../../constants";

type Identity = {
  accessMode?: ResidentAccessMode;
  name?: string | null;
  unit?: string | null;
};

type ResidentOption = {
  coefficient: number;
  id: number;
  name: string;
  unit: string | null;
};

type DeclarationSummary = {
  coefficient: number;
  declarationId: number;
  id: number;
  name: string;
  unit: string | null;
};

type ProxySummary = {
  accessMode: "owner" | "proxy";
  canManageDeclarations: boolean;
  canProceedToSurveys: boolean;
  hasCastVotes: boolean;
  delegatedBy?: {
    id: number;
    name: string;
    unit: string | null;
  } | null;
  hasDeclarations: boolean;
  principal: {
    coefficient: number;
    id: number;
    name: string;
    unit: string | null;
  };
  proxySelfAuthorization: {
    declaration?: DeclarationSummary | null;
    required: boolean;
    uploaded: boolean;
  };
  representationLocked: boolean;
  representedResidents: DeclarationSummary[];
  totalHomesRepresented: number;
  totalWeightRepresented: number;
};

type ProxyFormValues = {
  declarations: Array<{
    residentId?: number;
    support?: UploadFile[];
  }>;
  selfSupport?: UploadFile[];
};

type ProxySupportUploaderProps = {
  disabled?: boolean;
  value?: UploadFile[];
  onChange?: (nextValue: UploadFile[]) => void;
};

const formatHomesLabel = (totalHomesRepresented: number) =>
  `${totalHomesRepresented} ${totalHomesRepresented === 1 ? "casa" : "casas"}`;

const normalizeUploadList = (fileList: UploadFile[]) =>
  fileList.slice(-1).map((file) => ({ ...file, status: "done" as const }));

const ProxySupportUploader = ({
  disabled,
  onChange,
  value,
}: ProxySupportUploaderProps) => {
  const selectedFile = value?.[0];

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Space wrap>
        <Upload
          accept="image/*"
          beforeUpload={() => false}
          capture="environment"
          disabled={disabled}
          fileList={selectedFile ? [selectedFile] : []}
          maxCount={1}
          onChange={({ fileList }) => onChange?.(normalizeUploadList(fileList))}
          showUploadList={false}
        >
          <Button icon={<CameraOutlined />} disabled={disabled}>
            Tomar foto
          </Button>
        </Upload>
        <Upload
          accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
          beforeUpload={() => false}
          disabled={disabled}
          fileList={selectedFile ? [selectedFile] : []}
          maxCount={1}
          onChange={({ fileList }) => onChange?.(normalizeUploadList(fileList))}
          showUploadList={false}
        >
          <Button icon={<FileAddOutlined />} disabled={disabled}>
            Elegir archivo
          </Button>
        </Upload>
        {selectedFile ? (
          <Button type="text" danger onClick={() => onChange?.([])} disabled={disabled}>
            Quitar
          </Button>
        ) : null}
      </Space>
      <Typography.Text type="secondary">
        {selectedFile ? selectedFile.name : "Ningún soporte seleccionado todavía."}
      </Typography.Text>
    </Space>
  );
};

const DeclarationCard = ({
  canManage,
  declaration,
  loading,
  subtitle,
  onRemove,
}: {
  canManage: boolean;
  declaration: DeclarationSummary;
  loading: boolean;
  subtitle: string;
  onRemove: (declarationId: number) => void;
}) => (
  <Card size="small" style={{ borderRadius: 18 }}>
    <Space style={{ justifyContent: "space-between", width: "100%" }} wrap>
      <div>
        <Typography.Text strong>{declaration.unit ?? "Sin unidad"}</Typography.Text>
        <br />
        <Typography.Text>{declaration.name}</Typography.Text>
        <br />
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      </div>
      <Space wrap>
        <Tag color="gold">Coeficiente {declaration.coefficient.toFixed(6)}</Tag>
        {canManage ? (
          <Popconfirm
            cancelText="Cancelar"
            okText="Sí, remover"
            title="¿Remover este poder?"
            onConfirm={() => onRemove(declaration.declarationId)}
          >
            <Button danger icon={<DeleteOutlined />} loading={loading} type="text">
              Remover
            </Button>
          </Popconfirm>
        ) : null}
      </Space>
    </Space>
  </Card>
);

export const ProxyCenterPage = () => {
  const [form] = Form.useForm<ProxyFormValues>();
  const { message } = AntdApp.useApp();
  const { data: identity } = useGetIdentity<Identity>();
  const [editingOwner, setEditingOwner] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const summaryQuery = useCustom<ProxySummary>({
    url: `${API_URL}/api/proxy-authorizations/mine`,
    method: "get",
  });
  const summary = summaryQuery.query.data?.data;
  const accessMode = summary?.accessMode ?? identity?.accessMode ?? "owner";
  const ownerIntro =
    accessMode === "owner" &&
    !summary?.hasDeclarations &&
    !summary?.representationLocked &&
    !summary?.hasCastVotes &&
    !editingOwner;

  const residentsQuery = useCustom<ResidentOption[]>({
    url: `${API_URL}/api/proxy-authorizations/available-residents`,
    method: "get",
    queryOptions: {
      enabled:
        !summary?.delegatedBy &&
        (accessMode === "proxy"
          ? !summary?.proxySelfAuthorization.uploaded
          : editingOwner),
    },
  });

  const submitDeclarations = useCustomMutation<ProxySummary>({
    mutationOptions: { onError: () => undefined },
  });
  const lockRepresentation = useCustomMutation<ProxySummary>({
    mutationOptions: { onError: () => undefined },
  });
  const removeDeclaration = useCustomMutation<ProxySummary>({
    mutationOptions: { onError: () => undefined },
  });

  const residentSelectOptions = useMemo(
    () =>
      (residentsQuery.query.data?.data ?? []).map((resident) => ({
        label: `${resident.unit ?? "Sin unidad"} · ${resident.name}`,
        searchText: `${resident.unit ?? ""} ${resident.name}`.toLowerCase(),
        value: resident.id,
      })),
    [residentsQuery.query.data?.data],
  );

  const selectedResidents = Form.useWatch("declarations", form) ?? [];
  const selectedIds = selectedResidents
    .map((item) => item?.residentId)
    .filter((value): value is number => typeof value === "number");

  const handleRemoveDeclaration = async (declarationId: number) => {
    try {
      await removeDeclaration.mutateAsync({
        url: `${API_URL}/api/proxy-authorizations/${declarationId}`,
        method: "delete",
        values: {},
        errorNotification: false,
        successNotification: false,
      });
      form.resetFields();
      setEditingOwner(false);
      await summaryQuery.query.refetch();
      message.success("El poder fue removido correctamente.");
    } catch (error) {
      message.error(
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "No fue posible remover el poder.",
      );
    }
  };

  const handleSubmit = async (values: ProxyFormValues) => {
    if (!summary) {
      return;
    }

    setSubmitError(null);
    const declarations: Array<{ representedUserId: number; file: File }> = [];

    if (summary.accessMode === "proxy") {
      const selfFile = values.selfSupport?.[0]?.originFileObj as File | undefined;

      if (!selfFile) {
        message.error("Adjunta el poder base de la unidad con la que ingresaste.");
        return;
      }

      declarations.push({
        representedUserId: summary.principal.id,
        file: selfFile,
      });

      const extra = values.declarations?.[0];
      const extraFile = extra?.support?.[0]?.originFileObj as File | undefined;

      if (extra?.residentId) {
        if (!extraFile) {
          message.error("Adjunta el soporte de la unidad adicional.");
          return;
        }

        declarations.push({
          representedUserId: Number(extra.residentId),
          file: extraFile,
        });
      }
    } else {
      values.declarations.forEach((item) => {
        const file = item.support?.[0]?.originFileObj as File | undefined;

        if (item.residentId && file) {
          declarations.push({
            representedUserId: Number(item.residentId),
            file,
          });
        }
      });

      if (!declarations.length) {
        message.error("Selecciona al menos un residente con su soporte.");
        return;
      }
    }

    const formData = new FormData();
    formData.append(
      "payload",
      JSON.stringify(
        declarations.map((item) => ({
          representedUserId: item.representedUserId,
        })),
      ),
    );
    declarations.forEach((item) => formData.append("proofs", item.file));

    try {
      await submitDeclarations.mutateAsync({
        url: `${API_URL}/api/proxy-authorizations/submit`,
        method: "post",
        values: formData,
        errorNotification: false,
        successNotification: false,
        config: { headers: { "Content-Type": "multipart/form-data" } },
      });
      form.resetFields();
      setEditingOwner(false);
      await summaryQuery.query.refetch();
      message.success("Poderes registrados correctamente.");
    } catch (error) {
      const nextMessage =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "No fue posible registrar los poderes.";
      setSubmitError(nextMessage);
      message.error(nextMessage);
    }
  };

  const handleContinueWithoutPowers = async () => {
    try {
      await lockRepresentation.mutateAsync({
        url: `${API_URL}/api/proxy-authorizations/lock`,
        method: "post",
        values: {},
        errorNotification: false,
        successNotification: false,
      });
      await summaryQuery.query.refetch();
      window.location.assign("/encuestas");
    } catch (error) {
      const nextMessage =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "No fue posible confirmar tu participación sin poderes.";
      setSubmitError(nextMessage);
      message.error(nextMessage);
    }
  };

  const showForm =
    !summary?.delegatedBy &&
    summary &&
    summary.canManageDeclarations &&
    (summary.accessMode === "proxy"
      ? !summary.proxySelfAuthorization.uploaded
      : editingOwner);

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div className="vr-page-intro" style={{ marginBottom: 0 }}>
        <div className="vr-page-kicker">Representacion</div>
        <h1 className="vr-page-title">
          {accessMode === "proxy" ? "Poderes del apoderado" : "Poderes del propietario"}
        </h1>
        <p className="vr-page-description">
          {accessMode === "proxy"
            ? "Debes adjuntar primero el soporte de la unidad con la que ingresaste. Después podrás representar una unidad adicional."
            : "Representas tu unidad propia y puedes sumar hasta dos poderes adicionales antes de entrar a votar."}
        </p>
      </div>

      {summary?.delegatedBy ? (
        <Alert
          type="warning"
          showIcon
          message="Tu unidad ya fue registrada como representada"
          description={`No podrás votar directamente porque ${summary.delegatedBy.name} (${summary.delegatedBy.unit ?? "sin unidad"}) declaró un poder para representarte.`}
        />
      ) : null}

      {submitError ? (
        <Alert
          type="error"
          showIcon
          message="No pudimos guardar los poderes"
          description={submitError}
        />
      ) : null}

      {summary?.hasDeclarations ? (
        <Card className="vr-section-card">
          <Result
            status="success"
            icon={<CheckCircleOutlined />}
            title={`Hola, ${summary.principal.name} (${summary.principal.unit ?? "sin unidad"})`}
            subTitle="Estos son los poderes activos con los que participarás en la asamblea."
            extra={[
              <div key="summary" style={{ margin: "0 auto", maxWidth: 720, textAlign: "left" }}>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {summary.proxySelfAuthorization.declaration ? (
                    <DeclarationCard
                      canManage={summary.canManageDeclarations}
                      declaration={summary.proxySelfAuthorization.declaration}
                      loading={removeDeclaration.mutation.isPending}
                      subtitle="Poder base de tu ingreso"
                      onRemove={handleRemoveDeclaration}
                    />
                  ) : null}
                  {summary.representedResidents.map((resident) => (
                    <DeclarationCard
                      key={resident.declarationId}
                      canManage={summary.canManageDeclarations}
                      declaration={resident}
                      loading={removeDeclaration.mutation.isPending}
                      subtitle="Unidad representada"
                      onRemove={handleRemoveDeclaration}
                    />
                  ))}
                  {!summary.canProceedToSurveys ? (
                    <Alert
                      type="warning"
                      showIcon
                      message="Aún no puedes pasar a encuestas"
                      description="Como apoderado, necesitas dejar activo el poder base de la unidad con la que ingresaste."
                    />
                  ) : null}
                  <Card size="small" style={{ borderRadius: 20 }}>
                    <Typography.Title level={4} style={{ marginBottom: 8 }}>
                      Tu voto representará {formatHomesLabel(summary.totalHomesRepresented)}
                    </Typography.Title>
                    <Typography.Paragraph style={{ marginBottom: 0 }}>
                      Coeficiente acumulado: <strong>{summary.totalWeightRepresented.toFixed(6)}</strong>
                    </Typography.Paragraph>
                  </Card>
                  <Button
                    type="primary"
                    size="large"
                    href={summary.canProceedToSurveys ? "/encuestas" : undefined}
                    disabled={!summary.canProceedToSurveys}
                  >
                    Continuar a encuestas
                  </Button>
                </Space>
              </div>,
            ]}
          />
        </Card>
      ) : null}

      {ownerIntro ? (
        <Card className="vr-section-card">
          <Result
            status="info"
            title={`Hola, ${summary?.principal.name ?? identity?.name ?? "residente"}`}
            subTitle="Ya representas tu propia unidad. Si tienes poderes adicionales, regístralos ahora antes de pasar a votar."
            extra={[
              <Button
                key="continue"
                type="primary"
                size="large"
                loading={lockRepresentation.mutation.isPending}
                onClick={handleContinueWithoutPowers}
              >
                Continuar sin poderes
              </Button>,
              <Button key="edit" size="large" onClick={() => setEditingOwner(true)}>
                Agregar poderes
              </Button>,
            ]}
          />
        </Card>
      ) : null}

      {summary && accessMode === "owner" && summary.representationLocked && !summary.hasDeclarations ? (
        <Card className="vr-section-card">
          <Result
            status="success"
            title="Tu participación quedó confirmada sin poderes adicionales"
            subTitle={
              summary.hasCastVotes
                ? "Ya emitiste tu voto o dejaste cerrada tu representación directa. No puedes agregar poderes después de esta confirmación."
                : "Elegiste representarte directamente. La carga posterior de poderes quedó deshabilitada para evitar cambios inconsistentes."
            }
            extra={
              <Button type="primary" size="large" href="/encuestas">
                Ir a encuestas
              </Button>
            }
          />
        </Card>
      ) : null}

      {showForm ? (
        <Form<ProxyFormValues>
          key={summary.accessMode}
          form={form}
          layout="vertical"
          initialValues={{
            declarations: Array.from({ length: summary.accessMode === "owner" ? 2 : 1 }).map(
              () => ({}),
            ),
          }}
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card className="vr-section-card">
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                  <Space style={{ justifyContent: "space-between", width: "100%" }} wrap>
                    <div>
                      <Typography.Title level={3} style={{ marginBottom: 6 }}>
                        {summary.accessMode === "proxy" ? "Carga de poderes" : "Poderes adicionales"}
                      </Typography.Title>
                      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        {summary.accessMode === "proxy"
                          ? "Adjunta tu poder base y, si aplica, una unidad adicional."
                          : "Registra hasta dos poderes con su soporte."}
                      </Typography.Paragraph>
                    </div>
                    {summary.accessMode === "owner" ? (
                      <Button icon={<ArrowLeftOutlined />} onClick={() => setEditingOwner(false)}>
                        Atrás
                      </Button>
                    ) : null}
                  </Space>

                  {summary.accessMode === "proxy" ? (
                    <Card size="small" style={{ borderRadius: 20 }}>
                      <Typography.Text strong>{summary.principal.unit ?? "Sin unidad"}</Typography.Text>
                      <br />
                      <Typography.Text>{summary.principal.name}</Typography.Text>
                      <Form.Item
                        label="Soporte del poder base"
                        name="selfSupport"
                        valuePropName="value"
                        style={{ marginTop: 16, marginBottom: 0 }}
                        rules={[{ required: true, message: "Adjunta el poder base." }]}
                      >
                        <ProxySupportUploader disabled={submitDeclarations.mutation.isPending} />
                      </Form.Item>
                    </Card>
                  ) : null}

                  {Array.from({ length: summary.accessMode === "owner" ? 2 : 1 }).map((_, index) => (
                    <Card key={index} size="small" style={{ borderRadius: 20 }}>
                      <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label={summary.accessMode === "proxy" ? "Unidad adicional" : `Residente ${index + 1}`}
                            name={["declarations", index, "residentId"]}
                          >
                            <Select
                              allowClear
                              placeholder="Selecciona un residente"
                              showSearch
                              filterOption={(input, option) =>
                                String(option?.searchText ?? "").includes(input.trim().toLowerCase())
                              }
                              options={residentSelectOptions.filter(
                                (option) =>
                                  option.value === selectedResidents[index]?.residentId ||
                                  !selectedIds.includes(option.value),
                              )}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Soporte del poder"
                            name={["declarations", index, "support"]}
                            valuePropName="value"
                          >
                            <ProxySupportUploader disabled={submitDeclarations.mutation.isPending} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}

                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={submitDeclarations.mutation.isPending}
                  >
                    Validar y guardar poderes
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Card className="vr-section-card">
                  <Space direction="vertical" size={10}>
                    <Tag color="gold" icon={<IdcardOutlined />}>
                      Reglas de representación
                    </Tag>
                    <Typography.Paragraph style={{ marginBottom: 0 }}>
                      {summary.accessMode === "proxy"
                        ? "Como apoderado, tu poder base es obligatorio y solo puedes sumar una unidad adicional."
                        : "Como propietario, puedes sumar hasta dos poderes adicionales."}
                    </Typography.Paragraph>
                    <Typography.Paragraph style={{ marginBottom: 0 }}>
                      El soporte debe ser <strong>PDF o imagen legible</strong>.
                    </Typography.Paragraph>
                  </Space>
                </Card>
                <Card className="vr-section-card">
                  <Space direction="vertical" size={10}>
                    <Tag color="volcano" icon={<FilePdfOutlined />}>
                      Consejo
                    </Tag>
                    <Typography.Paragraph style={{ marginBottom: 0 }}>
                      Toma una foto nítida del poder firmado o carga el PDF completo para evitar rechazos.
                    </Typography.Paragraph>
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>
        </Form>
      ) : null}
    </Space>
  );
};
