import { useEffect, useEffectEvent, useMemo } from "react";
import { Survey } from "survey-react-ui";
import type { SurveyModel } from "survey-core";
import {
  createSurveySuccessHtml,
  createVotingSurveyModel,
} from "../../survey";

type BrandedSurveyProps = {
  className?: string;
  locale?: string | null;
  onComplete?: (model: SurveyModel) => Promise<void>;
  readOnly?: boolean;
  schema: Record<string, unknown>;
  showCompleteButton?: boolean;
};

export const BrandedSurvey = ({
  className,
  locale,
  onComplete,
  readOnly = false,
  schema,
  showCompleteButton = true,
}: BrandedSurveyProps) => {
  const serializedSchema = useMemo(() => JSON.stringify(schema), [schema]);
  const model = useMemo(
    () =>
      createVotingSurveyModel({
        locale,
        readOnly,
        schema: JSON.parse(serializedSchema) as Record<string, unknown>,
        showCompleteButton,
      }),
    [locale, readOnly, serializedSchema, showCompleteButton],
  );

  const handleComplete = useEffectEvent(async (survey: SurveyModel) => {
    if (!onComplete) {
      return;
    }

    await onComplete(survey);
    survey.completedHtml = createSurveySuccessHtml("Tu voto fue registrado correctamente.");
  });

  useEffect(() => {
    if (!onComplete) {
      return;
    }

    const completingHandler = async (sender: SurveyModel, options: { allow: boolean; message?: string }) => {
      try {
        await handleComplete(sender);
      } catch (error) {
        options.allow = false;
        options.message =
          error instanceof Error
            ? error.message
            : "No fue posible registrar la respuesta.";
      }
    };

    model.onCompleting.add(completingHandler);

    return () => {
      model.onCompleting.remove(completingHandler);
    };
  }, [handleComplete, model, onComplete]);

  return (
    <div className={["vr-survey-host", className].filter(Boolean).join(" ")}>
      <Survey model={model} />
    </div>
  );
};
