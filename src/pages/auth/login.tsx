import {
  FileTextOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useCustom, useLogin } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  Radio,
  Row,
  Space,
  Tabs,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router";
import { API_URL } from "../../constants";
import { useDeviceLayout } from "../../utils/device-mode";

type ResidentLegalDocumentResponse = {
  checkboxLabel: string;
  contentHash: string;
  documentKey: string;
  summary: string;
  title: string;
  updatedAt: string;
  version: string;
};

type ResidentLegalStatusResponse = {
  acceptedAt?: string | null;
  acceptedVersion?: string | null;
  currentVersion?: string | null;
  requiresAcceptance: boolean;
};

type ResidentLoginFormValues = {
  legalAccepted?: boolean;
  legalVersion?: string;
  loginType: "resident";
  residentAccessMode: "owner" | "proxy";
  unit: string;
};

type AdminLoginFormValues = {
  identifier: string;
  loginType: "admin";
  password: string;
};

type LoginFormValues = ResidentLoginFormValues | AdminLoginFormValues;

const normalizeUnit = (value?: string) => value?.trim().toUpperCase() ?? "";

export const LoginPage = () => {
  const [residentForm] = Form.useForm<ResidentLoginFormValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutateAsync: login, isPending } = useLogin<LoginFormValues>();
  const { isMobileLayout } = useDeviceLayout();
  const residentUnitValue = Form.useWatch("unit", residentForm) ?? "";
  const residentAccessMode =
    Form.useWatch("residentAccessMode", residentForm) ?? "owner";
  const residentLegalAccepted =
    Form.useWatch("legalAccepted", residentForm) === true;
  const normalizedResidentUnit = useMemo(
    () => normalizeUnit(residentUnitValue),
    [residentUnitValue],
  );
  const deferredResidentUnit = useDeferredValue(normalizedResidentUnit);
  const legalQuery = useCustom<ResidentLegalDocumentResponse>({
    method: "get",
    url: `${API_URL}/api/account/resident-legal`,
  });
  const legalStatusQuery = useCustom<ResidentLegalStatusResponse>({
    method: "get",
    url: `${API_URL}/api/account/resident-legal-status?unit=${encodeURIComponent(
      deferredResidentUnit,
    )}`,
    queryOptions: {
      enabled: Boolean(deferredResidentUnit),
    },
  });

  const currentLegalDocument = legalQuery.query.data?.data;
  const currentLegalStatus = legalStatusQuery.query.data?.data;
  const residentAlreadyAcceptedCurrentVersion = Boolean(
    normalizedResidentUnit &&
      currentLegalStatus &&
      currentLegalStatus.requiresAcceptance === false,
  );
  const residentRequiresAcceptance = normalizedResidentUnit
    ? currentLegalStatus?.requiresAcceptance ?? true
    : true;
  const residentSubmitDisabled =
    isPending ||
    !normalizedResidentUnit ||
    !residentAccessMode ||
    legalQuery.query.isLoading ||
    legalQuery.query.isError ||
    (Boolean(normalizedResidentUnit) && legalStatusQuery.query.isFetching) ||
    (residentRequiresAcceptance && !residentLegalAccepted);

  const handleResidentSubmit = async (values: ResidentLoginFormValues) => {
    setErrorMessage(null);

    const result = await login({
      ...values,
      legalAccepted: values.legalAccepted === true,
      legalVersion: currentLegalDocument?.version,
      loginType: "resident",
      unit: normalizeUnit(values.unit),
    });

    if (result?.success === false) {
      setErrorMessage(
        result.error?.name ??
          result.error?.message ??
          "No fue posible iniciar sesion.",
      );
    }
  };

  const handleAdminSubmit = async (values: AdminLoginFormValues) => {
    setErrorMessage(null);

    const result = await login({
      ...values,
      loginType: "admin",
    });

    if (result?.success === false) {
      setErrorMessage(
        result.error?.name ??
          result.error?.message ??
          "No fue posible iniciar sesion.",
      );
    }
  };

  return (
    <Row align="middle" justify="center" className="vr-auth-shell">
      <Col xs={24} lg={22} xl={20}>
        <Card
          variant="borderless"
          styles={{ body: { padding: 0 } }}
          className="vr-auth-card"
        >
          <Row gutter={0}>
            <Col xs={24} lg={isMobileLayout ? 24 : 12}>
              <div className="vr-auth-brand">
                <div className="vr-auth-brand-media">
                  <video
                    className="vr-auth-brand-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/logo-ui.png"
                    preload="metadata"
                  >
                    <source src="/VR-VIDEO.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={isMobileLayout ? 24 : 12}>
              <div className="vr-auth-form-wrap">
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                  <div className="vr-auth-badge">
                    <SafetyCertificateOutlined />
                    Acceso seguro
                  </div>

                  <div>
                    <Typography.Title level={2} className="vr-auth-panel-title">
                      Ingreso a la asamblea
                    </Typography.Title>
                    <Typography.Paragraph className="vr-auth-panel-copy">
                      Si es <i>residente</i> entrar como <b>PROPIETARIO</b> y su
                      unidad.
                    </Typography.Paragraph>
                    <Typography.Paragraph className="vr-auth-panel-copy">
                      Si viene a <i>representar</i> como <b>APODERADO</b> entrar
                      con la unidad a representar.
                    </Typography.Paragraph>
                    <Typography.Paragraph className="vr-auth-panel-copy">
                      El <i>ADMINISTRADOR</i> gestiona usuarios, asambleas y
                      encuestas.
                    </Typography.Paragraph>
                  </div>

                  {errorMessage ? (
                    <Alert message={errorMessage} type="error" showIcon />
                  ) : null}

                  {legalQuery.query.isError ? (
                    <Alert
                      type="warning"
                      showIcon
                      message="No pudimos cargar el documento legal vigente."
                      description="Recarga la pagina para consultar la politica y volver a intentar el ingreso."
                    />
                  ) : null}

                  <Tabs
                    defaultActiveKey="resident"
                    items={[
                      {
                        key: "resident",
                        label: "Residente",
                        children: (
                          <Form<ResidentLoginFormValues>
                            className="vr-auth-form"
                            form={residentForm}
                            layout="vertical"
                            onFinish={handleResidentSubmit}
                            requiredMark={false}
                            initialValues={{
                              legalAccepted: false,
                              loginType: "resident",
                              residentAccessMode: "owner",
                            }}
                          >
                            <Flex
                              align="center"
                              justify="space-between"
                              gap={4}
                            >
                              <Form.Item
                                label="Ingresas como"
                                name="residentAccessMode"
                                rules={[
                                  {
                                    required: true,
                                    message:
                                      "Selecciona si ingresas como propietario o apoderado.",
                                  },
                                ]}
                              >
                                <Radio.Group
                                  optionType="default"
                                  buttonStyle="solid"
                                  size="large"
                                >
                                  <Radio.Button value="owner">
                                    PROPIETARIO
                                  </Radio.Button>
                                  <Radio.Button value="proxy">
                                    APODERADO
                                  </Radio.Button>
                                </Radio.Group>
                              </Form.Item>
                              <Form.Item
                                label="Unidad"
                                name="unit"
                                extra="Ejemplo: M1-01"
                                normalize={normalizeUnit}
                                rules={[
                                  {
                                    required: true,
                                    message: "Ingresa tu unidad privada.",
                                  },
                                ]}
                              >
                                <Input
                                  autoComplete="username"
                                  placeholder="M0-00"
                                  size="large"
                                  allowClear
                                />
                              </Form.Item>
                            </Flex>
                            <div className="vr-auth-legal-block">
                              {residentAlreadyAcceptedCurrentVersion ? (
                                <Alert
                                  type="success"
                                  showIcon
                                  message={`Ya aceptaste la version vigente (${
                                    currentLegalStatus?.currentVersion ??
                                    currentLegalDocument?.version ??
                                    "actual"
                                  }).`}
                                  description={
                                    currentLegalStatus?.acceptedAt
                                      ? `Aceptada el ${dayjs(
                                          currentLegalStatus.acceptedAt,
                                        ).format("DD MMM YYYY - hh:mm A")}.`
                                      : "Puedes ingresar sin volver a marcar el checkbox."
                                  }
                                />
                              ) : normalizedResidentUnit ? (
                                <Form.Item
                                  className="vr-auth-legal-checkbox"
                                  name="legalAccepted"
                                  rules={[
                                    {
                                      validator: async (_, value) => {
                                        if (
                                          !residentRequiresAcceptance ||
                                          value === true
                                        ) {
                                          return;
                                        }

                                        throw new Error(
                                          "Debes aceptar la politica y los terminos antes de ingresar.",
                                        );
                                      },
                                    },
                                  ]}
                                  valuePropName="checked"
                                >
                                  <Checkbox>
                                    {currentLegalDocument?.checkboxLabel ??
                                      "He leido y acepto la Politica de Tratamiento de Datos Personales y los Terminos y Condiciones del portal de la asamblea."}
                                  </Checkbox>
                                </Form.Item>
                              ) : (
                                <Typography.Paragraph className="vr-auth-note">
                                  Escriba su unidad y acepte terminos y
                                  condiciones antes de ingresar.
                                </Typography.Paragraph>
                              )}
                            </div>

                            <Button
                              block
                              className="vr-auth-submit"
                              disabled={residentSubmitDisabled}
                              htmlType="submit"
                              loading={isPending}
                              size="large"
                              type="primary"
                            >
                              Ingresar al portal
                            </Button>
                          </Form>
                        ),
                      },
                      {
                        key: "admin",
                        label: "Administrador",
                        children: (
                          <Form<AdminLoginFormValues>
                            className="vr-auth-form"
                            layout="vertical"
                            onFinish={handleAdminSubmit}
                            requiredMark={false}
                            initialValues={{
                              loginType: "admin",
                            }}
                          >
                            <Form.Item
                              label="Usuario o correo"
                              name="identifier"
                              rules={[
                                {
                                  required: true,
                                  message:
                                    "Ingresa tu usuario o correo administrativo.",
                                },
                              ]}
                            >
                              <Input
                                autoComplete="username"
                                placeholder="usuario@dominio.com"
                                size="large"
                              />
                            </Form.Item>

                            <Form.Item
                              label="Contraseña"
                              name="password"
                              rules={[
                                {
                                  required: true,
                                  message: "Ingresa tu contraseña.",
                                },
                              ]}
                            >
                              <Input.Password
                                autoComplete="current-password"
                                placeholder="Ingresa tu contraseña"
                                size="large"
                              />
                            </Form.Item>

                            <Button
                              block
                              className="vr-auth-submit"
                              htmlType="submit"
                              loading={isPending}
                              size="large"
                              type="primary"
                            >
                              Ingresar al panel
                            </Button>
                          </Form>
                        ),
                      },
                    ]}
                  />

                  <Divider style={{ margin: 0 }} />

                  <Space align="start" size={12}>
                    <TeamOutlined
                      style={{ color: "#8b4c16", fontSize: 18, marginTop: 3 }}
                    />
                    <Typography.Paragraph className="vr-auth-note">
                      Como propietario puedes sumar hasta 2 poderes extra. Como
                      apoderado debes adjuntar primero el soporte de la unidad
                      con la que ingresaste y solo podras representar una unidad
                      adicional.
                    </Typography.Paragraph>
                  </Space>

                  <Typography.Paragraph className="vr-auth-note">
                    <FileTextOutlined
                      style={{ marginRight: 8, color: "#8b4c16" }}
                    />
                    {currentLegalDocument?.title ??
                      "Politica de tratamiento y terminos del portal"}
                  </Typography.Paragraph>
                  <Typography.Paragraph className="vr-auth-note">
                    Consulta el documento vigente en{" "}
                    <Link
                      className="vr-auth-legal-link"
                      to="/politica-de-privacidad"
                    >
                      /politica-de-privacidad
                    </Link>
                    {currentLegalDocument?.version
                      ? `, version ${currentLegalDocument.version}.`
                      : "."}
                  </Typography.Paragraph>
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};
