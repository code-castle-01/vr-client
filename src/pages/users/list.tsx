import {
  EditButton,
  List,
  useTable,
} from "@refinedev/antd";
import { useUpdate } from "@refinedev/core";
import {
  App as AntdApp,
  Button,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { PageIntro } from "../../components";

type UserRecord = {
  Coeficiente?: number | string | null;
  EstadoCartera?: boolean | null;
  NombreCompleto?: string | null;
  UnidadPrivada?: string | null;
  blocked?: boolean | null;
  email?: string | null;
  id: number;
};

export const UserList = () => {
  const { tableProps } = useTable<UserRecord>({
    resource: "users",
    syncWithLocation: true,
  });
  const { message } = AntdApp.useApp();
  const { mutate, mutation } = useUpdate();

  const users = tableProps.dataSource ?? [];
  const activeUsers = users.filter((item) => !item.blocked).length;
  const blockedUsers = users.filter((item) => item.blocked).length;
  const restrictedUsers = users.filter((item) => item.EstadoCartera).length;

  return (
    <>
      <PageIntro
        kicker="Administracion"
        title="Usuarios del sistema"
        description="Desde aqui el administrador puede registrar copropietarios, ajustar su capacidad de voto y desactivar accesos sin eliminar informacion historica."
        extra={
          <div className="vr-summary-grid">
            <div className="vr-summary-card">
              <div className="vr-summary-label">Usuarios activos</div>
              <div className="vr-summary-value">{activeUsers}</div>
            </div>
            <div className="vr-summary-card">
              <div className="vr-summary-label">Accesos desactivados</div>
              <div className="vr-summary-value">{blockedUsers}</div>
            </div>
            <div className="vr-summary-card">
              <div className="vr-summary-label">Con restriccion de cartera</div>
              <div className="vr-summary-value">{restrictedUsers}</div>
            </div>
          </div>
        }
      />
      <List title="Gestion de usuarios">
        <Table<UserRecord>
          {...tableProps}
          rowKey="id"
          scroll={{ x: 980 }}
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
          }}
        >
          <Table.Column<UserRecord>
            dataIndex="NombreCompleto"
            title="Copropietario"
            render={(_, record) => (
              <div>
                <Typography.Text strong>
                  {record.NombreCompleto ?? "Sin nombre"}
                </Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  {record.UnidadPrivada ?? "Sin unidad registrada"}
                </Typography.Text>
              </div>
            )}
          />
          <Table.Column<UserRecord> dataIndex="email" title="Correo" />
          <Table.Column<UserRecord>
            dataIndex="Coeficiente"
            title="Coeficiente"
            render={(value) => Number(value ?? 0).toFixed(2)}
          />
          <Table.Column<UserRecord>
            dataIndex="EstadoCartera"
            title="Cartera"
            render={(value) =>
              value ? (
                <Tag color="red">Restringido</Tag>
              ) : (
                <Tag color="green">Habilitado</Tag>
              )
            }
          />
          <Table.Column<UserRecord>
            dataIndex="blocked"
            title="Acceso"
            render={(value) =>
              value ? (
                <Tag color="default">Desactivado</Tag>
              ) : (
                <Tag color="gold">Activo</Tag>
              )
            }
          />
          <Table.Column<UserRecord>
            title="Acciones"
            dataIndex="actions"
            fixed="right"
            render={(_, record) => (
              <Space wrap>
                <EditButton hideText size="small" recordItemId={record.id} />
                <Button
                  icon={record.blocked ? <CheckCircleOutlined /> : <StopOutlined />}
                  loading={mutation.isPending}
                  size="small"
                  onClick={() => {
                    mutate(
                      {
                        resource: "users",
                        id: record.id,
                        values: {
                          blocked: !record.blocked,
                        },
                      },
                      {
                        onSuccess: () => {
                          message.success(
                            record.blocked
                              ? "Usuario reactivado correctamente."
                              : "Usuario desactivado correctamente."
                          );
                        },
                      }
                    );
                  }}
                >
                  {record.blocked ? "Activar" : "Desactivar"}
                </Button>
              </Space>
            )}
          />
        </Table>
      </List>
    </>
  );
};
