import { Edit } from "@refinedev/antd";
import {
  useCreate,
  useDeleteMany,
  useNavigation,
  useOne,
  useUpdate,
} from "@refinedev/core";
import { App as AntdApp, Form, Skeleton } from "antd";
import { useEffect } from "react";
import { useParams } from "react-router";
import { PageIntro } from "../../components";
import {
  buildVotingSurveySchema,
  createVotingSurveyTemplate,
  parseSurveySchemaJson,
  requireValidVotingSurvey,
  serializeSurveySchema,
} from "../../survey";
import { SurveyForm, type SurveyFormValues } from "./form";

export const AgendaItemEdit = () => {
  const [form] = Form.useForm<SurveyFormValues>();
  const { id } = useParams();
  const { message } = AntdApp.useApp();
  const { list } = useNavigation();
  const { mutateAsync: updateSurvey, mutation } = useUpdate();
  const { mutateAsync: createOption } = useCreate();
  const { mutateAsync: updateOption } = useUpdate();
  const { mutateAsync: deleteOptions } = useDeleteMany();
  const { query } = useOne<{
    assembly?: { id?: number };
    description?: string;
    id: number;
    requiresSpecialMajority?: boolean;
    status: "pending" | "open" | "closed";
    survey_locale?: string | null;
    survey_schema?: Record<string, unknown> | null;
    title: string;
    vote_options?: Array<{ id: number; text: string }>;
  }>({
    resource: "agenda-items",
    id: id ?? "",
    meta: {
      populate: ["assembly", "vote_options"],
    },
  });

  const record = query.data?.data;

  useEffect(() => {
    if (!record) {
      return;
    }

    form.setFieldsValue({
      assemblyId: Number(record.assembly?.id),
      requiresSpecialMajority: Boolean(record.requiresSpecialMajority),
      status: record.status,
      surveySchemaJson: record.survey_schema
        ? serializeSurveySchema(record.survey_schema)
        : serializeSurveySchema(
            createVotingSurveyTemplate({
              description: record.description,
              locale: record.survey_locale ?? "es",
              title: record.title,
            }),
          ),
    });
  }, [form, record]);

  const handleSubmit = async (values: SurveyFormValues) => {
    const parsedSchemaState = parseSurveySchemaJson(values.surveySchemaJson);

    if (parsedSchemaState.error) {
      throw new Error(parsedSchemaState.error);
    }

    const inspectedSurvey = requireValidVotingSurvey(
      parsedSchemaState.value ?? createVotingSurveyTemplate(),
    );

    await updateSurvey({
      resource: "agenda-items",
      id: id ?? "",
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

    const existingOptions = record?.vote_options ?? [];
    const usedExistingIds = new Set<number>();
    const normalizeOptionText = (value: string) => value.trim().toLocaleLowerCase("es");
    const existingById = new Map(existingOptions.map((option) => [option.id, option]));
    const existingByText = new Map(
      existingOptions.map((option) => [normalizeOptionText(option.text), option]),
    );

    const syncedOptions = await Promise.all(
      inspectedSurvey.choices.map(async (choice) => {
        const matchedById =
          typeof choice.sourceValue === "number"
            ? existingById.get(choice.sourceValue)
            : undefined;
        const matchedByText = existingByText.get(normalizeOptionText(choice.text));
        const matchedOption =
          matchedById && !usedExistingIds.has(matchedById.id)
            ? matchedById
            : matchedByText && !usedExistingIds.has(matchedByText.id)
              ? matchedByText
              : undefined;

        if (matchedOption) {
          usedExistingIds.add(matchedOption.id);

          if (matchedOption.text.trim() !== choice.text) {
            await updateOption({
              resource: "vote-options",
              id: matchedOption.id,
              values: {
                text: choice.text,
                agenda_item: Number(id),
              },
            });
          }

          return {
            id: matchedOption.id,
            text: choice.text,
          };
        }

          const createdOption = await createOption({
            resource: "vote-options",
            values: {
              text: choice.text,
              agenda_item: Number(id),
            },
          });

          const createdOptionId =
            createdOption.data?.data?.id ?? createdOption.data?.id;

          if (!createdOptionId) {
            throw new Error("No fue posible identificar una opcion creada.");
          }

          return {
            id: Number(createdOptionId),
            text: choice.text,
          };
        }),
    );

    const removedIds = existingOptions
      .map((option) => option.id)
      .filter((optionId) => !usedExistingIds.has(optionId));

    if (removedIds.length > 0) {
      await deleteOptions({
        resource: "vote-options",
        ids: removedIds,
      });
    }

    await updateSurvey({
      resource: "agenda-items",
      id: id ?? "",
      values: {
        title: inspectedSurvey.title,
        description: inspectedSurvey.description,
        survey_locale: inspectedSurvey.locale,
        survey_schema: buildVotingSurveySchema({
          title: inspectedSurvey.title,
          description: inspectedSurvey.description,
          choices: syncedOptions.map((option) => ({
            text: option.text,
            value: option.id,
          })),
          locale: inspectedSurvey.locale,
          schema: inspectedSurvey.schema,
        }),
      },
    });

    message.success("Encuesta actualizada correctamente.");
    list("agenda-items");
  };

  return (
    <>
      <PageIntro
        kicker="Administracion"
        title="Editar encuesta"
        description="Actualiza la estructura de la encuesta desde Survey Creator y conserva sincronizada la pregunta oficial de voto."
      />
      <Edit
        title="Editar encuesta"
        isLoading={query.isLoading}
        saveButtonProps={{
          loading: mutation.isPending,
          onClick: () => form.submit(),
        }}
      >
        {query.isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <SurveyForm form={form} onFinish={handleSubmit} />
        )}
      </Edit>
    </>
  );
};
