import { Create } from "@refinedev/antd";
import { useCreate, useNavigation, useUpdate } from "@refinedev/core";
import { App as AntdApp, Form } from "antd";
import { PageIntro } from "../../components";
import {
  buildVotingSurveySchema,
  createVotingSurveyTemplate,
  parseSurveySchemaJson,
  requireValidVotingSurvey,
} from "../../survey";
import { SurveyForm, type SurveyFormValues } from "./form";

export const AgendaItemCreate = () => {
  const [form] = Form.useForm<SurveyFormValues>();
  const { message } = AntdApp.useApp();
  const { list } = useNavigation();
  const { mutateAsync: createSurvey, mutation } = useCreate();
  const { mutateAsync: createOption } = useCreate();
  const { mutateAsync: updateSurvey } = useUpdate();

  const handleSubmit = async (values: SurveyFormValues) => {
    const parsedSchemaState = parseSurveySchemaJson(values.surveySchemaJson);

    if (parsedSchemaState.error) {
      throw new Error(parsedSchemaState.error);
    }

    const inspectedSurvey = requireValidVotingSurvey(
      parsedSchemaState.value ?? createVotingSurveyTemplate(),
    );

    const result = await createSurvey({
      resource: "agenda-items",
      values: {
        title: inspectedSurvey.title,
        description: inspectedSurvey.description,
        requiresSpecialMajority: values.requiresSpecialMajority,
        status: values.status,
        survey_locale: inspectedSurvey.locale,
        assembly: {
          id: values.assemblyId,
        },
      },
    });

    const surveyId = result.data?.data?.id ?? result.data?.id;

    if (!surveyId) {
      throw new Error("No fue posible identificar la encuesta creada.");
    }

    const createdOptions = await Promise.all(
      inspectedSurvey.choices.map(async (choice) => {
          const optionResult = await createOption({
            resource: "vote-options",
            values: {
              text: choice.text,
              agenda_item: surveyId,
            },
          });

          const createdOptionId =
            optionResult.data?.data?.id ?? optionResult.data?.id;

          if (!createdOptionId) {
            throw new Error("No fue posible identificar una opcion creada.");
          }

          return {
            id: Number(createdOptionId),
            text: choice.text,
          };
        }),
    );

    await updateSurvey({
      resource: "agenda-items",
      id: surveyId,
      values: {
        title: inspectedSurvey.title,
        description: inspectedSurvey.description,
        survey_locale: inspectedSurvey.locale,
        survey_schema: buildVotingSurveySchema({
          title: inspectedSurvey.title,
          description: inspectedSurvey.description,
          choices: createdOptions.map((option) => ({
            text: option.text,
            value: option.id,
          })),
          locale: inspectedSurvey.locale,
          schema: inspectedSurvey.schema,
        }),
      },
    });

    message.success("Encuesta creada correctamente.");
    list("agenda-items");
  };

  return (
    <>
      <PageIntro
        kicker="Administracion"
        title="Nueva encuesta"
        description="Crea la encuesta desde Survey Creator, define su estructura visual y deja lista la pregunta oficial que usara la votacion."
      />
      <Create
        title="Crear encuesta"
        saveButtonProps={{
          loading: mutation.isPending,
          onClick: () => form.submit(),
        }}
      >
        <SurveyForm form={form} onFinish={handleSubmit} />
      </Create>
    </>
  );
};
