import { Spin } from "antd";
import { useEffect, useEffectEvent, useMemo } from "react";
import { Survey } from "survey-react-ui";
import type { SurveyModel } from "survey-core";
import {
  createSurveySuccessHtml,
  createVotingSurveyModel,
} from "../../survey";

type BrandedSurveyProps = {
  busyMessage?: string;
  className?: string;
  isSubmitting?: boolean;
  locale?: string | null;
  onComplete?: (model: SurveyModel) => Promise<void>;
  readOnly?: boolean;
  schema: Record<string, unknown>;
  showCompleteButton?: boolean;
};

export const BrandedSurvey = ({
  busyMessage = "Registrando voto...",
  className,
  isSubmitting = false,
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
    model.mode = readOnly || isSubmitting ? "display" : "edit";
    model.showCompleteButton = showCompleteButton && !readOnly && !isSubmitting;
  }, [isSubmitting, model, readOnly, showCompleteButton]);

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
    <div
      aria-busy={isSubmitting}
      className={[
        "vr-survey-host",
        isSubmitting ? "vr-survey-host--busy" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isSubmitting ? (
        <div className="vr-survey-host__busy" role="status">
          <Spin size="large" />
          <span>{busyMessage}</span>
        </div>
      ) : null}
      <Survey model={model} />
    </div>
  );
};
