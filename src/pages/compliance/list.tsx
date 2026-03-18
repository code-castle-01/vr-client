import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useCustom } from "@refinedev/core";
import { List } from "@refinedev/antd";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { PageIntro } from "../../components";
import { API_URL } from "../../constants";

type ComplianceAcceptanceItem = {
  acceptedAt?: string | null;
  documentHash?: string | null;
  documentVersion?: string | null;
  id: number;
  ipAddress?: string | null;
  name: string;
  unit?: string | null;
  userAgent?: string | null;
};

type ComplianceSummary = {
  currentAcceptedCount: number;
  currentUpdatedAt?: string | null;
  currentVersion: string;
  totalRecords: number;
  totalResidents: number;
  versions: string[];
};

type ComplianceResponse = {
  items: ComplianceAcceptanceItem[];
  summary: ComplianceSummary;
};

type ComplianceFilterFormValues = {
  dateRange?: [Dayjs | null, Dayjs | null];
  unit?: string;
  version?: string;
};

type ComplianceFilterState = {
  dateFrom?: string;
  dateTo?: string;
  unit?: string;
  version?: string;
};

const buildComplianceUrl = (filters: ComplianceFilterState) => {
  const searchParams = new URLSearchParams();

  if (filters.unit) {
    searchParams.set("unit", filters.unit);
  }

  if (filters.version) {
    searchParams.set("version", filters.version);
  }

  if (filters.dateFrom) {
    searchParams.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    searchParams.set("dateTo", filters.dateTo);
  }

  const serializedParams = searchParams.toString();

  return `${API_URL}/api/legal-acceptances/admin${
    serializedParams ? `?${serializedParams}` : ""
  }`;
};

export const ComplianceListPage = () => {
  const [form] = Form.useForm<ComplianceFilterFormValues>();
  const [filters, setFilters] = useState<ComplianceFilterState>({});
  const complianceUrl = useMemo(() => buildComplianceUrl(filters), [filters]);
  const complianceQuery = useCustom<ComplianceResponse>({
    method: "get",
    url: complianceUrl,
  });

  const response = complianceQuery.query.data?.data;
  const summary = response?.summary;
  const items = response?.items ?? [];

  const handleSearch = (values: ComplianceFilterFormValues) => {
    const [dateFrom, dateTo] = values.dateRange ?? [];

    setFilters({
      dateFrom: dateFrom?.startOf("day").toISOString(),
      dateTo: dateTo?.endOf("day").toISOString(),
      unit: values.unit?.trim().toUpperCase() || undefined,
      version: values.version || undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
  };

  return (
    <>
      <PageIntro
        kicker="Cumplimiento"
        title="Aceptaciones legales"
        description="Consulta la constancia de aceptacion de la politica de tratamiento y los terminos del portal por parte de los residentes."
        extra={
          <div className="vr-summary-grid">
            <div className="vr-summary-card">
              <div className="vr-summary-label">Version vigente</div>
              <div className="vr-summary-value">
                {summary?.currentVersion ?? "--"}
              </div>
            </div>
            <div className="vr-summary-card">
              <div className="vr-summary-label">Aceptaciones vigentes</div>
              <div className="vr-summary-value">
                {summary?.currentAcceptedCount ?? 0} / {summary?.totalResidents ?? 0}
              </div>
            </div>
            <div className="vr-summary-card">
              <div className="vr-summary-label">Registros visibles</div>
              <div className="vr-summary-value">{summary?.totalRecords ?? 0}</div>
            </div>
          </div>
        }
      />

      <List title="Trazabilidad legal">
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Alert
            type="warning"
            showIcon
            message="Postura actual de seguridad"
            description="La aceptacion legal ya queda trazada, pero la fase de endurecimiento con OTP por correo sigue pendiente para reforzar el acceso residente."
          />

          {complianceQuery.query.isError ? (
            <Alert
              type="error"
              showIcon
              message="No fue posible cargar la trazabilidad legal."
              description="Verifica la sesion administrativa o intenta nuevamente en unos segundos."
            />
          ) : null}

          <Card className="vr-section-card">
            <Form<ComplianceFilterFormValues>
              form={form}
              layout="vertical"
              onFinish={handleSearch}
            >
              <div className="vr-compliance-filters">
                <Form.Item
                  label="Unidad"
                  name="unit"
                  normalize={(value?: string) => value?.trim().toUpperCase() ?? ""}
                >
                  <Input allowClear placeholder="Ejemplo: M1-01" />
                </Form.Item>

                <Form.Item label="Version" name="version">
                  <Select
                    allowClear
                    options={(summary?.versions ?? []).map((version) => ({
                      label: version,
                      value: version,
                    }))}
                    placeholder="Todas las versiones"
                  />
                </Form.Item>

                <Form.Item label="Fecha de aceptacion" name="dateRange">
                  <DatePicker.RangePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item className="vr-compliance-actions">
                  <Space wrap>
                    <Button htmlType="submit" type="primary">
                      Aplicar filtros
                    </Button>
                    <Button onClick={handleReset}>Limpiar</Button>
                  </Space>
                </Form.Item>
              </div>
            </Form>

            <Typography.Paragraph className="vr-auth-note">
              Ultima actualizacion de la version vigente:{" "}
              {summary?.currentUpdatedAt
                ? dayjs(summary.currentUpdatedAt).format("DD MMM YYYY - hh:mm A")
                : "--"}
            </Typography.Paragraph>
          </Card>

          <Table<ComplianceAcceptanceItem>
            className="vr-section-card"
            dataSource={items}
            loading={complianceQuery.query.isLoading}
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
            }}
            rowKey="id"
            scroll={{ x: 1080 }}
          >
            <Table.Column<ComplianceAcceptanceItem>
              dataIndex="unit"
              title="Residente"
              render={(_, record) => (
                <div>
                  <Space size={[8, 8]} wrap style={{ marginBottom: 4 }}>
                    {record.unit ? <Tag color="blue">{record.unit}</Tag> : <Tag>Sin unidad</Tag>}
                    {record.documentVersion ? (
                      <Tag color="gold">{record.documentVersion}</Tag>
                    ) : null}
                  </Space>
                  <br />
                  <Typography.Text strong>{record.name}</Typography.Text>
                </div>
              )}
            />

            <Table.Column<ComplianceAcceptanceItem>
              dataIndex="acceptedAt"
              title="Aceptado el"
              render={(value) =>
                value ? dayjs(value).format("DD MMM YYYY - hh:mm A") : "--"
              }
              sorter={(left, right) =>
                dayjs(left.acceptedAt ?? 0).valueOf() -
                dayjs(right.acceptedAt ?? 0).valueOf()
              }
            />

            <Table.Column<ComplianceAcceptanceItem>
              dataIndex="ipAddress"
              title="IP"
              render={(value) => value ?? "--"}
            />

            <Table.Column<ComplianceAcceptanceItem>
              dataIndex="userAgent"
              title="Navegador / dispositivo"
              render={(value) => (
                <Typography.Text ellipsis={{ tooltip: value ?? "--" }}>
                  {value ?? "--"}
                </Typography.Text>
              )}
            />

            <Table.Column<ComplianceAcceptanceItem>
              dataIndex="documentHash"
              title="Hash"
              render={(value) => (
                <Typography.Text ellipsis={{ tooltip: value ?? "--" }}>
                  {value ?? "--"}
                </Typography.Text>
              )}
            />
          </Table>
        </Space>
      </List>
    </>
  );
};
