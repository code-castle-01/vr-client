import { Create } from "@refinedev/antd";
import { useCreate, useNavigation } from "@refinedev/core";
import { App as AntdApp, Form } from "antd";
import { PageIntro } from "../../components";
import { UserForm, type UserFormValues } from "./form";

export const UserCreate = () => {
  const [form] = Form.useForm<UserFormValues>();
  const { message } = AntdApp.useApp();
  const { list } = useNavigation();
  const { mutateAsync, mutation } = useCreate();

  const handleSubmit = async (values: UserFormValues) => {
    const normalizedUnit = values.UnidadPrivada.trim().toUpperCase();

    await mutateAsync({
      resource: "users",
      values: {
        ...values,
        UnidadPrivada: normalizedUnit,
        username: normalizedUnit,
      },
    });

    message.success("Usuario creado correctamente.");
    list("users");
  };

  return (
    <>
      <PageIntro
        kicker="Administracion"
        title="Nuevo usuario"
        description="Crea copropietarios o perfiles operativos con sus datos de acceso, coeficiente de votacion y estado administrativo."
      />
      <Create
        title="Crear usuario"
        saveButtonProps={{
          loading: mutation.isPending,
          onClick: () => form.submit(),
        }}
      >
        <UserForm form={form} onFinish={handleSubmit} />
      </Create>
    </>
  );
};
