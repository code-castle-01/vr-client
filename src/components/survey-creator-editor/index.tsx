import { useEffect, useEffectEvent, useMemo } from "react";
import type {
  PreviewSurveyCreatedEvent,
  SurveyCreatorModel,
} from "survey-creator-core";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import type { SurveyRecord } from "../../survey";
import {
  SURVEY_DEFAULT_LOCALE,
  SURVEY_LOGO_URL,
  vegasDelRioSurveyTheme,
} from "../../survey";

type SurveyCreatorEditorProps = {
  onChange: (schema: SurveyRecord) => void;
  schema: SurveyRecord;
};

const allowedToolboxItems = new Set([
  "radiogroup",
  "dropdown",
  "checkbox",
  "boolean",
  "comment",
  "text",
  "html",
  "panel",
]);

const configureCreator = (schema: SurveyRecord) => {
  const creator = new SurveyCreator({
    autoSaveEnabled: false,
    generateValidJSON: true,
    logicAllowTextEditExpressions: true,
    previewAllowSelectLanguage: false,
    previewAllowSimulateDevices: true,
    showCreatorThemeSettings: false,
    showJSONEditorTab: true,
    showLogicTab: true,
    showPreviewTab: true,
    showSurveyHeader: true,
    showThemeTab: false,
    showTranslationTab: false,
  });

  creator.locale = SURVEY_DEFAULT_LOCALE;
  creator.previewDevice = "iPhone15";
  creator.JSON = schema;
  creator.toolbox.items.slice().forEach((item) => {
    if (!allowedToolboxItems.has(item.name)) {
      creator.toolbox.removeItem(item.name);
    }
  });

  return creator;
};

export const SurveyCreatorEditor = ({
  schema,
  onChange,
}: SurveyCreatorEditorProps) => {
  const schemaSignature = useMemo(() => JSON.stringify(schema), [schema]);
  const creator = useMemo(
    () => configureCreator(schema),
    [schemaSignature, schema],
  );
  const onChangeEvent = useEffectEvent(onChange);

  useEffect(() => {
    const handleModified = () => {
      onChangeEvent(creator.JSON as SurveyRecord);
    };
    const handlePreviewCreated = (
      _: SurveyCreatorModel,
      event: PreviewSurveyCreatedEvent,
    ) => {
      event.survey.locale = SURVEY_DEFAULT_LOCALE;
      event.survey.logo = SURVEY_LOGO_URL;
      event.survey.logoFit = "contain";
      event.survey.logoHeight = "56px";
      event.survey.logoPosition = "right";
      event.survey.showBrandInfo = false;
      event.survey.applyTheme(vegasDelRioSurveyTheme);
    };

    creator.onModified.add(handleModified);
    creator.onPreviewSurveyCreated.add(handlePreviewCreated);
    onChangeEvent(creator.JSON as SurveyRecord);

    return () => {
      creator.onModified.remove(handleModified);
      creator.onPreviewSurveyCreated.remove(handlePreviewCreated);
    };
  }, [creator, onChangeEvent]);

  return (
    <section className="vr-creator-shell">
      <SurveyCreatorComponent creator={creator} />
    </section>
  );
};
