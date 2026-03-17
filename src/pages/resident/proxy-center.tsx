import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileProtectOutlined,
  IdcardOutlined,
  InboxOutlined,
  UserOutlined,
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
  Radio,
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
import { API_URL } from "../../constants";

type Identity = {
  name?: string | null;
  unit?: string | null;
};

type ResidentOption = {
  coefficient: number;
  id: number;
  name: string;
  unit: string | null;
};

type ProxySummary = {
  assembly: {
    date: string | null;
    id: number;
    status: "scheduled" | "in_progress" | "finished" | null;
    title: string | null;
  } | null;
  canManageDeclarations: boolean;
  delegatedBy?: {
    id: number;
    name: string;
    unit: string | null;
  } | null;
  hasDeclarations: boolean;
  principal: {
    id: number;
    name: string;
    unit: string | null;
  };
  representedResidents: Array<{
    declarationId: number;
    coefficient: number;
    id: number;
    name: string;
    unit: string | null;
  }>;
  totalHomesRepresented: number;
  totalWeightRepresented: number;
};

type ProxyFormValues = {
  declarations: Array<{
    residentId?: number;
    support?: UploadFile[];
  }>;
};

export const ProxyCenterPage = () => {
  const [form] = Form.useForm<ProxyFormValues>();
  const { message } = AntdApp.useApp();
  const { data: identity } = useGetIdentity<Identity>();
  const [decision, setDecision] = useState<"unknown" | "yes" | "no">("unknown");

  const summaryQuery = useCustom<ProxySummary>({
    url: `${API_URL}/api/proxy-authorizations/mine`,
    method: "get",
  });

  const residentsQuery = useCustom<ResidentOption[]>({
    url: `${API_URL}/api/proxy-authorizations/available-residents`,
    method: "get",
    queryOptions: {
      enabled:
        decision === "yes" && !summaryQuery.query.data?.data?.hasDeclarations,
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitDeclarations = useCustomMutation<ProxySummary>({
    mutationOptions: {
      onError: () => undefined,
    },
  });
  const removeDeclaration = useCustomMutation<ProxySummary>({
    mutationOptions: {
      onError: () => undefined,
    },
  });

  const summary = summaryQuery.query.data?.data;
  const residentOptions = residentsQuery.query.data?.data ?? [];

  const residentSelectOptions = useMemo(
    () =>
      residentOptions.map((resident) => ({
        label: `${resident.unit ?? "Sin unidad"} · ${resident.name}`,
        searchText: `${resident.unit ?? ""} ${resident.name}`.toLowerCase(),
        value: resident.id,
      })),
    [residentOptions],
  );

  const selectedResidents = Form.useWatch("declarations", form) ?? [];
  const selectedIds = selectedResidents
    .map((item) => item?.residentId)
    .filter((value): value is number => typeof value === "number");

  const handleSubmit = async (values: ProxyFormValues) => {
    setSubmitError(null);

    const normalizedDeclarations = values.declarations
      .filter((item) => item?.residentId && item.support?.[0]?.originFileObj)
      .map((item) => ({
        residentId: Number(item.residentId),
        file: item.support?.[0]?.originFileObj as File,
      }));

    if (normalizedDeclarations.length === 0) {
      message.error("Selecciona al menos un residente con su soporte.");
      return;
    }

    const formData = new FormData();
    formData.append(
      "payload",
      JSON.stringify(
        normalizedDeclarations.map((item) => ({
          representedUserId: item.residentId,
        })),
      ),
    );

    normalizedDeclarations.forEach((item) => {
      formData.append("proofs", item.file);
    });

    try {
      await submitDeclarations.mutateAsync({
        url: `${API_URL}/api/proxy-authorizations/submit`,
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

      message.success("Poderes registrados correctamente.");
      setDecision("unknown");
      await summaryQuery.query.refetch();
    } catch (error) {
      const nextMessage =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "No fue posible registrar los poderes. Intenta nuevamente.";

      setSubmitError(nextMessage);
      message.error(nextMessage);
    }
  };

  const handleRemoveDeclaration = async (declarationId: number) => {
    try {
      await removeDeclaration.mutateAsync({
        url: `${API_URL}/api/proxy-authorizations/${declarationId}`,
        method: "delete",
        errorNotification: false,
        successNotification: false,
        values: {},
      });

      message.success(
        "El poder fue removido y la unidad quedó libre para votar.",
      );
      setDecision("unknown");
      await summaryQuery.query.refetch();
    } catch (error) {
      const nextMessage =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "No fue posible remover el poder en este momento.";

      message.error(nextMessage);
    }
  };

  const uploadProps = {
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    beforeUpload: () => false,
    maxCount: 1,
  };

  const handleBackToDecision = () => {
    form.resetFields();
    setSubmitError(null);
    setDecision("unknown");
  };

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div className="vr-page-intro" style={{ marginBottom: 0 }}>
        <div className="vr-page-kicker">Representacion</div>
        <h1 className="vr-page-title">Poderes para la asamblea</h1>
        <p className="vr-page-description">
          Antes de votar, confirma si representarás a otro residente con un
          poder firmado. Puedes cargar hasta dos soportes y quedar autorizado
          para votar por hasta tres viviendas en total.
        </p>
      </div>

      {summary?.delegatedBy ? (
        <Alert
          type="warning"
          showIcon
          message="Tu unidad ya fue registrada como representada"
          description={`No podrás votar directamente porque ${
            summary.delegatedBy.name
          } (${
            summary.delegatedBy.unit ?? "sin unidad"
          }) declaró un poder para representarte.`}
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
            title={`Hola, ${summary.principal.name} (${
              summary.principal.unit ?? "sin unidad"
            })`}
            subTitle="Estos son los residentes que representarás oficialmente en la asamblea."
            extra={[
              <div
                key="summary"
                style={{ textAlign: "left", maxWidth: 720, margin: "0 auto" }}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {summary.representedResidents.map((resident) => (
                    <Card
                      key={resident.id}
                      size="small"
                      style={{ borderRadius: 18 }}
                    >
                      <Space
                        style={{
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                        wrap
                      >
                        <div>
                          <Typography.Text strong>
                            {resident.unit ?? "Sin unidad"}
                          </Typography.Text>
                          <br />
                          <Typography.Text>{resident.name}</Typography.Text>
                        </div>
                        <Space wrap>
                          <Tag color="gold">
                            Coeficiente {resident.coefficient.toFixed(2)}
                          </Tag>
                          {summary.canManageDeclarations ? (
                            <Popconfirm
                              cancelText="Cancelar"
                              description={`La unidad ${
                                resident.unit ?? resident.name
                              } volverá a quedar habilitada para votar por sí misma.`}
                              okText="Sí, remover"
                              title="¿Remover este poder?"
                              onConfirm={() =>
                                handleRemoveDeclaration(resident.declarationId)
                              }
                            >
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                loading={removeDeclaration.mutation.isPending}
                                type="text"
                              >
                                Remover
                              </Button>
                            </Popconfirm>
                          ) : null}
                        </Space>
                      </Space>
                    </Card>
                  ))}

                  {!summary.canManageDeclarations ? (
                    <Alert
                      type="info"
                      showIcon
                      message="Los poderes quedaron bloqueados"
                      description="La asamblea ya está en curso, así que no es posible remover permisos de representación."
                    />
                  ) : null}

                  <Card
                    size="small"
                    style={{
                      borderRadius: 20,
                      background:
                        "linear-gradient(135deg, rgba(255, 247, 232, 0.96), rgba(247, 198, 106, 0.12))",
                    }}
                  >
                    <Typography.Title level={4} style={{ marginBottom: 8 }}>
                      Tu voto representará {summary.totalHomesRepresented} casas
                    </Typography.Title>
                    <Typography.Paragraph style={{ marginBottom: 0 }}>
                      Incluye tu vivienda y las unidades autorizadas mediante
                      poder, con un coeficiente acumulado de{" "}
                      <strong>
                        {summary.totalWeightRepresented.toFixed(2)}
                      </strong>
                      .
                    </Typography.Paragraph>
                  </Card>

                  <Button type="primary" size="large" href="/encuestas">
                    Continuar a encuestas
                  </Button>
                </Space>
              </div>,
            ]}
          />
        </Card>
      ) : (
        <>
          {decision === "unknown" && !summary?.delegatedBy ? (
            <Card className="vr-section-card">
              <Space direction="vertical" size={18} style={{ width: "100%" }}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  ¿Tienes poderes firmados para representar a otro residente?
                </Typography.Title>
                <Typography.Paragraph
                  type="secondary"
                  style={{ marginBottom: 0 }}
                >
                  Esta confirmación es obligatoria antes de continuar a la
                  votación. Si respondes que sí, deberás seleccionar los
                  residentes y adjuntar el soporte correspondiente.
                </Typography.Paragraph>
                <Radio.Group
                  value={decision}
                  onChange={(event) => setDecision(event.target.value)}
                >
                  <Space wrap>
                    <Radio.Button
                      value="no"
                      style={{ border: "1px solid orange" }}
                    >
                      <UserOutlined />
                      No, solo mi unidad.
                    </Radio.Button>
                    <Radio.Button
                      skipGroup
                      value="yes"
                      style={{ border: "1px solid brown" }}
                    >
                      <FileProtectOutlined />
                      Sí, tengo poderes.
                    </Radio.Button>
                  </Space>
                </Radio.Group>
              </Space>
            </Card>
          ) : null}

          {summary?.delegatedBy ? (
            <Card className="vr-section-card">
              <Result
                status="warning"
                title="Tu unidad ya está siendo representada"
                subTitle={`No puedes declarar nuevos poderes porque ${
                  summary.delegatedBy.name
                } (${
                  summary.delegatedBy.unit ?? "sin unidad"
                }) registró la representación de tu vivienda para esta asamblea.`}
              />
            </Card>
          ) : null}

          {decision === "no" ? (
            <Card className="vr-section-card">
              <Result
                status="info"
                title={`Hola, ${identity?.name ?? "residente"}`}
                subTitle="Continuarás en la asamblea representando únicamente tu propia unidad."
                extra={
                  <Button type="primary" size="large" href="/encuestas">
                    Ir a encuestas
                  </Button>
                }
              />
            </Card>
          ) : null}

          {decision === "yes" ? (
            <Form<ProxyFormValues>
              form={form}
              layout="vertical"
              initialValues={{
                declarations: [{}, {}],
              }}
              onFinish={handleSubmit}
              requiredMark={false}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Card className="vr-section-card">
                    <Space
                      direction="vertical"
                      size={20}
                      style={{ width: "100%" }}
                    >
                      <div
                        style={{
                          alignItems: "center",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 12,
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <Typography.Title
                            level={3}
                            style={{ marginBottom: 6 }}
                          >
                            Carga de poderes
                          </Typography.Title>
                          <Typography.Paragraph
                            type="secondary"
                            style={{ marginBottom: 0 }}
                          >
                            Puedes registrar hasta dos poderes. Cada residente
                            debe tener un soporte en PDF o imagen.
                          </Typography.Paragraph>
                        </div>
                        <Button
                          icon={<ArrowLeftOutlined />}
                          onClick={handleBackToDecision}
                        >
                          Atrás
                        </Button>
                      </div>

                      {[0, 1].map((index) => (
                        <Card
                          key={index}
                          size="small"
                          style={{ borderRadius: 20 }}
                        >
                          <Row gutter={[16, 0]}>
                            <Col xs={24} md={12}>
                              <Form.Item
                                label={`Residente ${index + 1}`}
                                name={["declarations", index, "residentId"]}
                                rules={[
                                  {
                                    validator: async (_, value) => {
                                      const hasAnySelection =
                                        selectedIds.length > 0;

                                      if (!hasAnySelection && index === 0) {
                                        throw new Error(
                                          "Selecciona al menos un residente.",
                                        );
                                      }

                                      if (
                                        hasAnySelection &&
                                        !value &&
                                        selectedResidents[index]?.support
                                          ?.length
                                      ) {
                                        throw new Error(
                                          "Selecciona el residente correspondiente.",
                                        );
                                      }

                                      return Promise.resolve();
                                    },
                                  },
                                ]}
                              >
                                <Select
                                  allowClear
                                  placeholder="Selecciona un residente"
                                  showSearch
                                  filterOption={(input, option) =>
                                    String(option?.searchText ?? "").includes(
                                      input.trim().toLowerCase(),
                                    )
                                  }
                                  filterSort={(optionA, optionB) =>
                                    String(optionA?.label ?? "").localeCompare(
                                      String(optionB?.label ?? ""),
                                    )
                                  }
                                  notFoundContent="No encontramos residentes con esa busqueda."
                                  optionFilterProp="searchText"
                                  options={residentSelectOptions.filter(
                                    (option) =>
                                      option.value ===
                                        selectedResidents[index]?.residentId ||
                                      !selectedIds.includes(option.value),
                                  )}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                label="Soporte del poder"
                                name={["declarations", index, "support"]}
                                valuePropName="fileList"
                                getValueFromEvent={(event) => {
                                  const fileList = event?.fileList ?? [];
                                  return fileList.slice(-1);
                                }}
                                rules={[
                                  {
                                    validator: async (
                                      _,
                                      value: UploadFile[] | undefined,
                                    ) => {
                                      const residentSelected =
                                        selectedResidents[index]?.residentId;

                                      if (
                                        residentSelected &&
                                        (!value || value.length === 0)
                                      ) {
                                        throw new Error(
                                          "Adjunta el soporte del poder.",
                                        );
                                      }

                                      return Promise.resolve();
                                    },
                                  },
                                ]}
                              >
                                <Upload.Dragger {...uploadProps}>
                                  <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                  </p>
                                  <p className="ant-upload-text">
                                    Subir PDF o imagen firmada
                                  </p>
                                  <p className="ant-upload-hint">
                                    Un archivo por residente. Máximo dos
                                    poderes.
                                  </p>
                                </Upload.Dragger>
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
                  <Space
                    direction="vertical"
                    size={16}
                    style={{ width: "100%" }}
                  >
                    <Card className="vr-section-card">
                      <Space direction="vertical" size={10}>
                        <Tag color="gold" icon={<IdcardOutlined />}>
                          Reglas de representación
                        </Tag>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>
                          Solo puedes representar hasta{" "}
                          <strong>dos residentes</strong>.
                        </Typography.Paragraph>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>
                          El soporte debe ser{" "}
                          <strong>PDF o imagen legible</strong>.
                        </Typography.Paragraph>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>
                          Tu voto sumará tu vivienda y las unidades autorizadas.
                        </Typography.Paragraph>
                      </Space>
                    </Card>

                    <Card className="vr-section-card">
                      <Space direction="vertical" size={10}>
                        <Tag color="volcano" icon={<FilePdfOutlined />}>
                          Consejo
                        </Tag>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>
                          Toma una foto nítida del poder firmado o carga el PDF
                          completo para evitar rechazos posteriores.
                        </Typography.Paragraph>
                      </Space>
                    </Card>
                  </Space>
                </Col>
              </Row>
            </Form>
          ) : null}
        </>
      )}
    </Space>
  );
};
