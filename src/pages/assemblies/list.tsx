import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import {
  type BaseRecord,
  useCustom,
} from "@refinedev/core";
import { axiosInstance } from "../../authProvider";
import { API_URL } from "../../constants";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { PageIntro } from "../../components";
import {
  DEFAULT_RESIDENT_LOGIN_DISABLED_MESSAGE,
  type ResidentAccessAdminConfigResponse,
} from "../../resident-access";

export const AssemblyList = () => {
  const [configForm] = Form.useForm<ResidentAccessAdminConfigResponse>();
  const [messageApi, contextHolder] = message.useMessage();
  const { tableProps } = useTable({
    syncWithLocation: true,
  });
  const residentAccessConfigQuery =
    useCustom<ResidentAccessAdminConfigResponse>({
      method: "get",
      url: `${API_URL}/api/account/admin/resident-access-config`,
    });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const assemblies = tableProps.dataSource ?? [];
  const scheduled = assemblies.filter(
    (item) => item?.status === "scheduled",
  ).length;
  const inProgress = assemblies.filter(
    (item) => item?.status === "in_progress",
  ).length;
  const finished = assemblies.filter(
    (item) => item?.status === "finished",
  ).length;
  const residentAccessConfig = residentAccessConfigQuery.query.data?.data;
  const residentLoginEnabled =
    Form.useWatch("residentLoginEnabled", configForm) ??
    residentAccessConfig?.residentLoginEnabled ??
    true;

  useEffect(() => {
    if (!residentAccessConfig) {
      return;
    }

    configForm.setFieldsValue({
      residentLoginDisabledMessage:
        residentAccessConfig.residentLoginDisabledMessage ||
        DEFAULT_RESIDENT_LOGIN_DISABLED_MESSAGE,
      residentLoginEnabled:
        residentAccessConfig.residentLoginEnabled !== false,
    });
  }, [configForm, residentAccessConfig]);

  const handleResidentAccessSave = async (
    values: ResidentAccessAdminConfigResponse,
  ) => {
    try {
      setIsSavingConfig(true);

      await axiosInstance.put(
        `${API_URL}/api/account/admin/resident-access-config`,
        {
          residentLoginDisabledMessage:
            values.residentLoginDisabledMessage?.trim() ||
            DEFAULT_RESIDENT_LOGIN_DISABLED_MESSAGE,
          residentLoginEnabled: values.residentLoginEnabled !== false,
        },
      );

      await residentAccessConfigQuery.query.refetch();
      messageApi.success(
        values.residentLoginEnabled !== false
          ? "El portal residente volvió a quedar habilitado."
          : "El portal residente quedó cerrado y las sesiones activas se invalidaron.",
      );
    } catch (error) {
      messageApi.error(
        error instanceof Error
          ? error.message
          : "No fue posible guardar la configuración del portal residente.",
      );
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <>
      {contextHolder}
      <PageIntro
        kicker="Operacion"
        title="Asambleas"
        description="Administra el calendario de reuniones, su estado operativo y el momento en que cada asamblea pasa a votacion o cierre."
        extra={
          <div className="vr-summary-grid">
            <div className="vr-summary-card">
              <div className="vr-summary-label">Programadas</div>
              <div className="vr-summary-value">{scheduled}</div>
            </div>
            <div className="vr-summary-card">
              <div className="vr-summary-label">En curso</div>
              <div className="vr-summary-value">{inProgress}</div>
            </div>
            <div className="vr-summary-card">
              <div className="vr-summary-label">Finalizadas</div>
              <div className="vr-summary-value">{finished}</div>
            </div>
          </div>
        }
      />
      <Card
        title="Cierre del portal residente"
        style={{ marginBottom: 24, borderRadius: 20 }}
      >
        <Form<ResidentAccessAdminConfigResponse>
          form={configForm}
          layout="vertical"
          onFinish={handleResidentAccessSave}
          initialValues={{
            residentLoginDisabledMessage:
              DEFAULT_RESIDENT_LOGIN_DISABLED_MESSAGE,
            residentLoginEnabled: true,
          }}
        >
          <Form.Item
            label="Acceso residente habilitado"
            name="residentLoginEnabled"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Habilitado"
              unCheckedChildren="Cerrado"
            />
          </Form.Item>

          <Alert
            showIcon
            type={residentLoginEnabled ? "success" : "warning"}
            style={{ marginBottom: 16 }}
            message={
              residentLoginEnabled
                ? "Los residentes pueden seguir entrando al portal."
                : "Solo el administrador puede iniciar sesión."
            }
            description={
              residentLoginEnabled
                ? "Al cerrar este acceso, el login residente desaparece y cualquier sesión residente ya abierta quedará invalidada."
                : "El mensaje configurado se mostrará en la pantalla de login mientras el portal permanezca cerrado."
            }
          />

          <Form.Item
            label="Mensaje cuando el portal esté cerrado"
            name="residentLoginDisabledMessage"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "Escribe el mensaje que verán los residentes cuando el portal esté cerrado.",
              },
            ]}
          >
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={280}
              placeholder={DEFAULT_RESIDENT_LOGIN_DISABLED_MESSAGE}
            />
          </Form.Item>

          {residentAccessConfig?.residentSessionRevokedAt ? (
            <Typography.Paragraph type="secondary">
              Último corte de sesiones residentes:{" "}
              {new Date(
                residentAccessConfig.residentSessionRevokedAt,
              ).toLocaleString("es-CO")}
            </Typography.Paragraph>
          ) : null}

          <Button htmlType="submit" loading={isSavingConfig} type="primary">
            Guardar configuración
          </Button>
        </Form>
      </Card>
      <List title="Gestion de asambleas">
        <Table {...tableProps} rowKey="id" size="large">
          <Table.Column
            dataIndex="title"
            title="Asamblea"
            render={(value: string, record: BaseRecord) => (
              <div>
                <Typography.Text strong>{value}</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Registro #{record.id}
                </Typography.Text>
              </div>
            )}
          />
          <Table.Column
            dataIndex="date"
            title="Fecha programada"
            render={(value: string | number | Date) => (
              <DateField value={value} />
            )}
          />
          <Table.Column
            dataIndex="status"
            title="Estado"
            render={(value: string) => {
              const colors: Record<string, string> = {
                scheduled: "gold",
                in_progress: "green",
                finished: "default",
              };
              const labels: Record<string, string> = {
                scheduled: "Programada",
                in_progress: "En curso",
                finished: "Finalizada",
              };
              return <Tag color={colors[value]}>{labels[value] ?? value}</Tag>;
            }}
          />
          <Table.Column
            title="Acciones"
            dataIndex="actions"
            render={(_, record: BaseRecord) => (
              <Space>
                <EditButton hideText size="small" recordItemId={record.id} />
                <ShowButton hideText size="small" recordItemId={record.id} />
                <DeleteButton hideText size="small" recordItemId={record.id} />
              </Space>
            )}
          />
        </Table>
      </List>
    </>
  );
};
