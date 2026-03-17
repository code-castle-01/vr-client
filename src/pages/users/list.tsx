import { EditButton, List, useTable } from "@refinedev/antd";
import { useUpdate } from "@refinedev/core";
import {
  App as AntdApp,
  Button,
  Input,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
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

const normalizeText = (value?: string | null) =>
  value?.trim().toLowerCase() ?? "";

const getTowerKey = (unit?: string | null) => {
  const normalizedUnit = unit?.trim().toUpperCase() ?? "";
  const matchedTower = normalizedUnit.match(/^(M\d+)/);

  return matchedTower?.[1] ?? "OTROS";
};

const compareText = (left?: string | null, right?: string | null) =>
  normalizeText(left).localeCompare(normalizeText(right), "es");

const compareTowerKey = (left: string, right: string) => {
  if (left === "OTROS") {
    return 1;
  }

  if (right === "OTROS") {
    return -1;
  }

  const leftNumber = Number(left.replace("M", ""));
  const rightNumber = Number(right.replace("M", ""));

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return left.localeCompare(right, "es");
};

export const UserList = () => {
  const { tableProps } = useTable<UserRecord>({
    pagination: {
      mode: "off",
    },
    resource: "users",
    syncWithLocation: true,
  });
  const { message } = AntdApp.useApp();
  const { mutate, mutation } = useUpdate();
  const [activeTower, setActiveTower] = useState<string>("all");
  const [ownerSearch, setOwnerSearch] = useState("");

  const users = (tableProps.dataSource ?? []).slice().sort((left, right) => {
    const towerComparison = compareTowerKey(
      getTowerKey(left.UnidadPrivada),
      getTowerKey(right.UnidadPrivada),
    );

    if (towerComparison !== 0) {
      return towerComparison;
    }

    const unitComparison = compareText(left.UnidadPrivada, right.UnidadPrivada);

    if (unitComparison !== 0) {
      return unitComparison;
    }

    return compareText(left.NombreCompleto, right.NombreCompleto);
  });
  const activeUsers = users.filter((item) => !item.blocked).length;
  const blockedUsers = users.filter((item) => item.blocked).length;
  const restrictedUsers = users.filter((item) => item.EstadoCartera).length;
  const towerOptions = useMemo(() => {
    const counts = new Map<string, number>();

    users.forEach((user) => {
      const towerKey = getTowerKey(user.UnidadPrivada);
      counts.set(towerKey, (counts.get(towerKey) ?? 0) + 1);
    });

    const sortedTowers = [...counts.entries()]
      .sort(([leftKey], [rightKey]) => compareTowerKey(leftKey, rightKey))
      .map(([towerKey, total]) => ({
        label: `${towerKey} (${total})`,
        value: towerKey,
      }));

    return [
      { label: `Todos (${users.length})`, value: "all" },
      ...sortedTowers,
    ];
  }, [users]);
  const visibleUsers = useMemo(
    () =>
      activeTower === "all"
        ? users
        : users.filter(
            (user) => getTowerKey(user.UnidadPrivada) === activeTower,
          ),
    [activeTower, users],
  );
  useEffect(() => {
    if (activeTower === "all") {
      return;
    }

    const towerStillExists = towerOptions.some(
      (option) => option.value === activeTower,
    );

    if (!towerStillExists) {
      setActiveTower("all");
    }
  }, [activeTower, towerOptions]);

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
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>Secciones por torre</Typography.Text>
            <br />
            <Typography.Text type="secondary">
              Filtra rápido por M1, M2, M3 y el resto de bloques para ubicar
              copropietarios con más facilidad.
            </Typography.Text>
          </div>
          <Segmented
            block
            options={towerOptions}
            value={activeTower}
            onChange={(value) => setActiveTower(String(value))}
          />
          <Table<UserRecord>
            {...tableProps}
            dataSource={visibleUsers}
            rowKey="id"
            scroll={{ x: 980 }}
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
            }}
          >
            <Table.Column<UserRecord>
              dataIndex="NombreCompleto"
              filterDropdown={({
                clearFilters,
                confirm,
                selectedKeys,
                setSelectedKeys,
              }) => (
                <div style={{ padding: 8, width: 280 }}>
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ width: "100%" }}
                  >
                    <Input
                      allowClear
                      autoFocus
                      placeholder="Buscar por nombre o unidad"
                      value={selectedKeys[0]}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setSelectedKeys(nextValue ? [nextValue] : []);
                      }}
                      onPressEnter={() => {
                        confirm();
                        setOwnerSearch(String(selectedKeys[0] ?? ""));
                      }}
                    />
                    <Space
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => {
                          clearFilters?.();
                          setOwnerSearch("");
                          confirm();
                        }}
                      >
                        Limpiar
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                          confirm();
                          setOwnerSearch(String(selectedKeys[0] ?? ""));
                        }}
                      >
                        Buscar
                      </Button>
                    </Space>
                  </Space>
                </div>
              )}
              filterIcon={(filtered) => (
                <SearchOutlined
                  style={{ color: filtered ? "#bf7a2d" : undefined }}
                />
              )}
              filteredValue={ownerSearch ? [ownerSearch] : null}
              onFilter={(value, record) => {
                const searchValue = String(value).trim().toLowerCase();
                const searchableText = [
                  record.NombreCompleto,
                  record.UnidadPrivada,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();

                return searchableText.includes(searchValue);
              }}
              sorter={(left, right) => {
                const unitComparison = compareText(
                  left.UnidadPrivada,
                  right.UnidadPrivada,
                );

                if (unitComparison !== 0) {
                  return unitComparison;
                }

                return compareText(left.NombreCompleto, right.NombreCompleto);
              }}
              title="Copropietario"
              render={(_, record) => (
                <div>
                  <Space size={[8, 8]} wrap style={{ marginBottom: 4 }}>
                    {record.UnidadPrivada ? (
                      <Tag color="blue">{record.UnidadPrivada}</Tag>
                    ) : (
                      <Tag>Sin unidad</Tag>
                    )}
                  </Space>
                  <br />
                  <Typography.Text strong>
                    {record.NombreCompleto ?? "Sin nombre"}
                  </Typography.Text>
                </div>
              )}
            />
            <Table.Column<UserRecord>
              dataIndex="email"
              title="Correo"
              sorter={(left, right) => compareText(left.email, right.email)}
            />
            <Table.Column<UserRecord>
              dataIndex="Coeficiente"
              title="Coeficiente"
              sorter={(left, right) =>
                Number(left.Coeficiente ?? 0) - Number(right.Coeficiente ?? 0)
              }
              render={(value) => Number(value ?? 0).toFixed(2)}
            />
            <Table.Column<UserRecord>
              dataIndex="EstadoCartera"
              filters={[
                { text: "Habilitado", value: "enabled" },
                { text: "Restringido", value: "restricted" },
              ]}
              onFilter={(value, record) =>
                value === "restricted"
                  ? Boolean(record.EstadoCartera)
                  : !record.EstadoCartera
              }
              sorter={(left, right) =>
                Number(Boolean(left.EstadoCartera)) -
                Number(Boolean(right.EstadoCartera))
              }
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
              filters={[
                { text: "Activo", value: "active" },
                { text: "Desactivado", value: "blocked" },
              ]}
              onFilter={(value, record) =>
                value === "blocked" ? Boolean(record.blocked) : !record.blocked
              }
              sorter={(left, right) =>
                Number(Boolean(left.blocked)) - Number(Boolean(right.blocked))
              }
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
                    icon={
                      record.blocked ? (
                        <CheckCircleOutlined />
                      ) : (
                        <StopOutlined />
                      )
                    }
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
                                : "Usuario desactivado correctamente.",
                            );
                          },
                        },
                      );
                    }}
                  >
                    {record.blocked ? "Activar" : "Desactivar"}
                  </Button>
                </Space>
              )}
            />
          </Table>
        </Space>
      </List>
    </>
  );
};
