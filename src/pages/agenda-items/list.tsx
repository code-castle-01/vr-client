import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord } from "@refinedev/core";
import { Space, Table, Tag, Typography } from "antd";
import { PageIntro } from "../../components";

export const AgendaItemList = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
    meta: {
      populate: ["assembly", "vote_options"],
    },
  });

  const surveys = tableProps.dataSource ?? [];
  const openSurveys = surveys.filter((item) => item?.status === "open").length;
  const pendingSurveys = surveys.filter((item) => item?.status === "pending").length;
  const closedSurveys = surveys.filter((item) => item?.status === "closed").length;

  return (
    <>
      <PageIntro
        kicker="Administracion"
        title="Encuestas de la asamblea"
        description="Organiza las votaciones que estaran disponibles en cada asamblea, define sus estados y supervisa las opciones configuradas."
        extra={
          <div className="vr-summary-grid">
            <div className="vr-summary-card">
              <div className="vr-summary-label">Abiertas</div>
              <div className="vr-summary-value">{openSurveys}</div>
            </div>
            <div className="vr-summary-card">
              <div className="vr-summary-label">Pendientes</div>
              <div className="vr-summary-value">{pendingSurveys}</div>
            </div>
            <div className="vr-summary-card">
              <div className="vr-summary-label">Cerradas</div>
              <div className="vr-summary-value">{closedSurveys}</div>
            </div>
          </div>
        }
      />
      <List title="Gestion de encuestas">
        <Table {...tableProps} rowKey="id" scroll={{ x: 960 }}>
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column
          dataIndex="title"
          title="Encuesta"
          render={(value: string, record: BaseRecord) => (
            <div>
              <Typography.Text strong>{value}</Typography.Text>
              <br />
              <Typography.Text type="secondary">
                {record.vote_options?.length ?? 0} opciones configuradas
              </Typography.Text>
            </div>
          )}
        />
        <Table.Column
          dataIndex="assembly"
          title="Asamblea"
          render={(value) => value?.title ?? "Sin asamblea"}
        />
        <Table.Column
          dataIndex="status"
          title="Estado"
          render={(value: string) => {
            const colors: Record<string, string> = {
              pending: "default",
              open: "gold",
              closed: "red",
            };
            const labels: Record<string, string> = {
              pending: "Pendiente",
              open: "Abierta",
              closed: "Cerrada",
            };
            return <Tag color={colors[value]}>{labels[value] ?? value}</Tag>;
          }}
        />
        <Table.Column
          dataIndex="requiresSpecialMajority"
          title="Mayoría"
          render={(value: boolean) =>
            value ? (
              <Tag color="volcano">Especial 70%</Tag>
            ) : (
              <Tag color="green">Simple</Tag>
            )
          }
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
