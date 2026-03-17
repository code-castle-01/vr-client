import { editorLocalization } from "survey-creator-core";
import { Model, surveyLocalization, type ITheme } from "survey-core";
import { LayeredLightPanelless } from "survey-core/themes";
import "survey-core/i18n/spanish";
import "survey-creator-core/i18n/spanish";

export const SURVEY_DEFAULT_LOCALE = "es";
export const SURVEY_LOGO_URL = "/logo-ui.png";
export const OFFICIAL_VOTE_QUESTION = "official_vote";

surveyLocalization.defaultLocale = SURVEY_DEFAULT_LOCALE;
surveyLocalization.currentLocale = SURVEY_DEFAULT_LOCALE;
editorLocalization.defaultLocale = SURVEY_DEFAULT_LOCALE;
editorLocalization.currentLocale = SURVEY_DEFAULT_LOCALE;

type VotingChoice = {
  text: string;
  value: number | string;
};

export type SurveyRecord = Record<string, unknown>;

export type ExtractedVoteChoice = {
  sourceValue: number | string | null;
  text: string;
};

type VotingSurveySchemaInput = {
  description?: string | null;
  locale?: string | null;
  schema?: unknown;
  title: string;
  choices: VotingChoice[];
};

type InspectedVotingSurvey =
  | {
      choices: ExtractedVoteChoice[];
      description?: string | null;
      error: null;
      locale: string;
      schema: SurveyRecord;
      title: string;
    }
  | {
      error: string;
      schema: null;
    };

export type ValidVotingSurvey = Extract<InspectedVotingSurvey, { error: null }>;

const DEFAULT_OFFICIAL_QUESTION_TITLE = "Selecciona tu voto";
const DEFAULT_SURVEY_TITLE = "Nueva encuesta";

const isObjectRecord = (value: unknown): value is SurveyRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const cloneSchema = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toTrimmedString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const createSurveyCompletedHtml = ({
  title,
  description,
  note = "Puedes continuar con el siguiente punto del orden del dia.",
}: {
  description: string;
  note?: string;
  title: string;
}) => `
  <div class="vr-survey-complete">
    <div class="vr-survey-complete__badge">Voto confirmado</div>
    <div class="vr-survey-complete__hero">
      <div class="vr-survey-complete__icon" aria-hidden="true">✓</div>
      <div class="vr-survey-complete__copy">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(description)}</span>
      </div>
    </div>
    <div class="vr-survey-complete__note">${escapeHtml(note)}</div>
  </div>
`;

const createOfficialVoteQuestion = (
  choices: VotingChoice[],
  seed?: SurveyRecord | null,
): SurveyRecord => ({
  ...(seed ?? {}),
  type:
    typeof seed?.type === "string" && seed.type.trim()
      ? seed.type
      : "radiogroup",
  name: OFFICIAL_VOTE_QUESTION,
  title:
    toTrimmedString(seed?.title) || DEFAULT_OFFICIAL_QUESTION_TITLE,
  isRequired: true,
  requiredErrorText: "Selecciona una respuesta para registrar tu voto.",
  colCount:
    typeof seed?.colCount === "number" && Number.isFinite(seed.colCount)
      ? seed.colCount
      : 1,
  choices: choices.map((choice) => ({
    value: choice.value,
    text: choice.text,
  })),
});

const createManagedSurveyBase = ({
  title,
  description,
  choices,
  locale,
}: Omit<VotingSurveySchemaInput, "schema">): SurveyRecord => ({
  title,
  description: description?.trim() || undefined,
  locale: locale ?? SURVEY_DEFAULT_LOCALE,
  logo: SURVEY_LOGO_URL,
  logoPosition: "right",
  logoFit: "contain",
  logoHeight: "56px",
  completedHtml: createSurveyCompletedHtml({
    title: "Respuesta registrada",
    description:
      "Tu voto fue enviado correctamente y quedo asociado a esta encuesta.",
  }),
  completeText: "Registrar voto",
  showQuestionNumbers: "off",
  questionTitleLocation: "top",
  widthMode: "static",
  pages: [
    {
      name: "votacion",
      title: "Votacion principal",
      elements: [createOfficialVoteQuestion(choices)],
    },
  ],
});

const getSchemaPages = (schema: SurveyRecord) =>
  Array.isArray(schema.pages) ? cloneSchema(schema.pages) : [];

const findOfficialVoteQuestion = (value: unknown): SurveyRecord | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findOfficialVoteQuestion(item);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (!isObjectRecord(value)) {
    return null;
  }

  if (value.name === OFFICIAL_VOTE_QUESTION) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    const found = findOfficialVoteQuestion(nestedValue);
    if (found) {
      return found;
    }
  }

  return null;
};

const replaceOfficialVoteQuestion = (
  value: unknown,
  replacement: SurveyRecord,
): { replaced: boolean; value: unknown } => {
  if (Array.isArray(value)) {
    let replaced = false;
    const nextArray = value.map((item) => {
      const result = replaceOfficialVoteQuestion(item, replacement);
      replaced ||= result.replaced;
      return result.value;
    });

    return {
      replaced,
      value: nextArray,
    };
  }

  if (!isObjectRecord(value)) {
    return {
      replaced: false,
      value,
    };
  }

  if (value.name === OFFICIAL_VOTE_QUESTION) {
    return {
      replaced: true,
      value: replacement,
    };
  }

  let replaced = false;
  const nextRecord: SurveyRecord = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    const result = replaceOfficialVoteQuestion(nestedValue, replacement);
    replaced ||= result.replaced;
    nextRecord[key] = result.value;
  }

  return {
    replaced,
    value: nextRecord,
  };
};

const getChoiceText = (choice: unknown): string => {
  if (typeof choice === "string") {
    return choice.trim();
  }

  if (typeof choice === "number" && Number.isFinite(choice)) {
    return String(choice);
  }

  if (!isObjectRecord(choice)) {
    return "";
  }

  const text = toTrimmedString(choice.text);

  if (text) {
    return text;
  }

  if (typeof choice.value === "number" && Number.isFinite(choice.value)) {
    return String(choice.value);
  }

  return toTrimmedString(choice.value);
};

const getChoiceSourceValue = (choice: unknown): number | string | null => {
  if (typeof choice === "number" && Number.isFinite(choice)) {
    return choice;
  }

  if (typeof choice === "string" && choice.trim()) {
    const parsedNumber = Number(choice);

    return Number.isFinite(parsedNumber) ? parsedNumber : choice.trim();
  }

  if (!isObjectRecord(choice)) {
    return null;
  }

  if (typeof choice.value === "number" && Number.isFinite(choice.value)) {
    return choice.value;
  }

  if (typeof choice.value === "string" && choice.value.trim()) {
    const parsedNumber = Number(choice.value);

    return Number.isFinite(parsedNumber) ? parsedNumber : choice.value.trim();
  }

  return null;
};

export const createVotingSurveyTemplate = (
  overrides?: Partial<Pick<VotingSurveySchemaInput, "description" | "locale" | "title">>,
): SurveyRecord =>
  createManagedSurveyBase({
    title: overrides?.title?.trim() || DEFAULT_SURVEY_TITLE,
    description: overrides?.description,
    locale: overrides?.locale ?? SURVEY_DEFAULT_LOCALE,
    choices: [
      { text: "Si", value: "si" },
      { text: "No", value: "no" },
    ],
  });

export const parseSurveySchemaJson = (jsonText: string | undefined) => {
  const trimmedValue = jsonText?.trim();

  if (!trimmedValue) {
    return {
      error: null,
      value: null as SurveyRecord | null,
    };
  }

  try {
    const parsedValue = JSON.parse(trimmedValue) as unknown;

    if (!isObjectRecord(parsedValue)) {
      return {
        error: "El JSON de SurveyJS debe ser un objeto valido.",
        value: null as SurveyRecord | null,
      };
    }

    return {
      error: null,
      value: parsedValue,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No fue posible interpretar el JSON de SurveyJS.",
      value: null as SurveyRecord | null,
    };
  }
};

export const inspectVotingSurveySchema = (
  schema: unknown,
): InspectedVotingSurvey => {
  if (!isObjectRecord(schema)) {
    return {
      error: "La definicion de SurveyJS no es valida.",
      schema: null,
    };
  }

  const officialQuestion = findOfficialVoteQuestion(schema);

  if (!officialQuestion) {
    return {
      error:
        "La encuesta debe conservar la pregunta principal de voto. Usa la pregunta 'Selecciona tu voto' para registrar la decision oficial.",
      schema: null,
    };
  }

  const rawChoices = Array.isArray(officialQuestion.choices)
    ? officialQuestion.choices
    : [];
  const choices = rawChoices
    .map((choice) => ({
      sourceValue: getChoiceSourceValue(choice),
      text: getChoiceText(choice),
    }))
    .filter((choice) => choice.text.length > 0);

  if (choices.length < 2) {
    return {
      error:
        "La pregunta oficial de voto debe tener al menos dos opciones para que la encuesta pueda guardarse.",
      schema: null,
    };
  }

  return {
    choices,
    description: toTrimmedString(schema.description) || undefined,
    error: null,
    locale: toTrimmedString(schema.locale) || SURVEY_DEFAULT_LOCALE,
    schema,
    title: toTrimmedString(schema.title) || DEFAULT_SURVEY_TITLE,
  };
};

export const requireValidVotingSurvey = (schema: unknown): ValidVotingSurvey => {
  const inspectedSurvey = inspectVotingSurveySchema(schema);

  if (inspectedSurvey.error) {
    throw new Error(inspectedSurvey.error);
  }

  return inspectedSurvey as ValidVotingSurvey;
};

export const buildVotingSurveySchema = ({
  title,
  description,
  choices,
  locale,
  schema,
}: VotingSurveySchemaInput): SurveyRecord => {
  const baseSchema = isObjectRecord(schema)
    ? cloneSchema(schema)
    : createManagedSurveyBase({ title, description, choices, locale });
  const seededQuestion = findOfficialVoteQuestion(baseSchema);
  const replacementQuestion = createOfficialVoteQuestion(choices, seededQuestion);
  const replaceResult = replaceOfficialVoteQuestion(baseSchema, replacementQuestion);
  const schemaWithOfficialQuestion = isObjectRecord(replaceResult.value)
    ? replaceResult.value
    : createManagedSurveyBase({ title, description, choices, locale });

  if (!replaceResult.replaced) {
    const pages = getSchemaPages(schemaWithOfficialQuestion);
    const [firstPage, ...restPages] = pages;
    const pageRecord = isObjectRecord(firstPage) ? firstPage : { name: "votacion" };
    const currentElements = Array.isArray(pageRecord.elements)
      ? pageRecord.elements
      : [];

    schemaWithOfficialQuestion.pages = [
      {
        ...pageRecord,
        elements: [...currentElements, replacementQuestion],
      },
      ...restPages,
    ];
  }

  return {
    ...schemaWithOfficialQuestion,
    title,
    description: description?.trim() || undefined,
    locale: locale ?? SURVEY_DEFAULT_LOCALE,
    logo: SURVEY_LOGO_URL,
    logoPosition: "right",
    logoFit: "contain",
    logoHeight: "56px",
    completeText: "Registrar voto",
    completedHtml: createSurveyCompletedHtml({
      title: "Respuesta registrada",
      description:
        "Tu voto fue enviado correctamente y quedo asociado a esta encuesta.",
    }),
    showQuestionNumbers: "off",
    questionTitleLocation: "top",
    widthMode: "static",
  };
};

export const serializeSurveySchema = (schema: SurveyRecord) =>
  JSON.stringify(schema, null, 2);

export const getOfficialVoteValues = (data: Record<string, unknown>) => {
  const rawValue = data[OFFICIAL_VOTE_QUESTION];

  if (typeof rawValue === "number") {
    return [rawValue];
  }

  if (typeof rawValue === "string" && rawValue.trim()) {
    const parsedNumber = Number(rawValue);

    return Number.isFinite(parsedNumber) ? [parsedNumber] : [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((value) => {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }

        if (typeof value === "string" && value.trim()) {
          const parsedNumber = Number(value);

          return Number.isFinite(parsedNumber) ? parsedNumber : null;
        }

        return null;
      })
      .filter((value): value is number => Number.isInteger(value));
  }

  return [];
};

export const vegasDelRioSurveyTheme: ITheme = {
  ...LayeredLightPanelless,
  cssVariables: {
    ...LayeredLightPanelless.cssVariables,
    "--sjs-primary-backcolor": "#bf7a2d",
    "--sjs-primary-backcolor-dark": "#8b4c16",
    "--sjs-primary-backcolor-light": "rgba(191, 122, 45, 0.14)",
    "--sjs-primary-forecolor": "#fff8ef",
    "--sjs-general-backcolor": "#fffaf2",
    "--sjs-general-backcolor-dark": "#fff1da",
    "--sjs-general-backcolor-dim": "#fffdf8",
    "--sjs-general-backcolor-dim-light": "#ffffff",
    "--sjs-general-forecolor": "#17232f",
    "--sjs-general-dim-forecolor": "#314455",
    "--sjs-border-default": "rgba(139, 76, 22, 0.18)",
    "--sjs-border-light": "rgba(139, 76, 22, 0.1)",
    "--sjs-border-inside": "rgba(139, 76, 22, 0.08)",
    "--sjs-shadow-small": "0 12px 24px rgba(24, 34, 45, 0.08)",
    "--sjs-shadow-medium": "0 24px 44px rgba(24, 34, 45, 0.12)",
    "--sjs-shadow-large": "0 34px 58px rgba(24, 34, 45, 0.16)",
    "--sjs-corner-radius": "24px",
    "--sjs-base-unit": "8px",
  },
};

type SurveyModelOptions = {
  locale?: string | null;
  readOnly?: boolean;
  schema: SurveyRecord;
  showCompletedPage?: boolean;
  showCompleteButton?: boolean;
};

export const createVotingSurveyModel = ({
  schema,
  locale,
  readOnly = false,
  showCompletedPage = false,
  showCompleteButton = true,
}: SurveyModelOptions) => {
  const model = new Model(schema);

  model.locale = locale ?? SURVEY_DEFAULT_LOCALE;
  model.showBrandInfo = false;
  model.showCompleteButton = showCompleteButton && !readOnly;
  model.showCompletedPage = showCompletedPage;
  model.headerView = "basic";
  model.showHeaderOnCompletePage = false;
  model.checkErrorsMode = "onComplete";
  model.logo = SURVEY_LOGO_URL;
  model.logoHeight = "56px";
  model.logoFit = "contain";
  model.logoPosition = "right";
  model.mode = readOnly ? "display" : "edit";
  model.applyTheme(vegasDelRioSurveyTheme);

  return model;
};

export const createSurveySuccessHtml = (message: string) => `
  ${createSurveyCompletedHtml({
    title: message,
    description:
      "El sistema guardo la respuesta y ya puedes continuar con la asamblea.",
  })}
`;
