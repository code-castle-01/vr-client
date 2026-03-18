import { Edit } from "@refinedev/antd";
import { useNavigation, useOne, useUpdate } from "@refinedev/core";
import { App as AntdApp, Form, Skeleton } from "antd";
import { useEffect } from "react";
import { useParams } from "react-router";
import { PageIntro } from "../../components";
import { UserForm, type UserFormValues } from "./form";

type UserRecord = UserFormValues & {
  id: number;
  username: string;
};

export const UserEdit = () => {
  const [form] = Form.useForm<UserFormValues>();
  const { id } = useParams();
  const { message } = AntdApp.useApp();
  const { list } = useNavigation();
  const { mutateAsync, mutation } = useUpdate();
  const { query } = useOne<UserRecord>({
    resource: "users",
    id: id ?? "",
  });

  const record = query.data?.data;

  useEffect(() => {
    if (!record) {
      return;
    }

    form.setFieldsValue({
      Coeficiente: Number(record.Coeficiente ?? 0),
      EstadoCartera: Boolean(record.EstadoCartera),
      NombreCompleto: record.NombreCompleto,
      UnidadPrivada: record.UnidadPrivada,
      blocked: Boolean(record.blocked),
      email: record.email,
    });
  }, [form, record]);

  const handleSubmit = async (values: UserFormValues) => {
    const normalizedUnit = values.UnidadPrivada.trim().toUpperCase();
    const payload = {
      ...values,
      UnidadPrivada: normalizedUnit,
      username: normalizedUnit,
    };

    await mutateAsync({
      resource: "users",
      id: id ?? "",
      values: payload,
    });

    message.success("Usuario actualizado correctamente.");
    list("users");
  };

  return (
    <>
      <PageIntro
        kicker="Administracion"
        title="Editar usuario"
        description="Ajusta el estado de acceso, el coeficiente y la informacion principal del copropietario sin perder su historial."
      />
      <Edit
        title="Editar usuario"
        isLoading={query.isLoading}
        saveButtonProps={{
          loading: mutation.isPending,
          onClick: () => form.submit(),
        }}
      >
        {query.isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <UserForm form={form} isEdit onFinish={handleSubmit} />
        )}
      </Edit>
    </>
  );
};
