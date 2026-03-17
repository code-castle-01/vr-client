import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Space, Table, Tag, Typography } from "antd";
import { PageIntro } from "../../components";

export const AssemblyList = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

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

  return (
    <>
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
