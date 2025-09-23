import { DTO_Param } from "@/models";
import { notificationHelpers } from "@/utils";
import { useState } from "react";

type Step = {
  title: string;
  validator?: () => DTO_Param[];
  description?: string;
  renderer?: React.ReactNode;
  children?: React.ReactNode;
};

interface StepperProps {
  steps: Step[];
  loading?: boolean;
  onSubmit?: () => void;
  setErroresValidacion?: (errs: DTO_Param[]) => void;
  focusByErrKey?: (key: string) => void;
}

export const Stepper = (props: StepperProps) => {
  const {
    steps,
    onSubmit,
    setErroresValidacion,
    focusByErrKey,
    loading = false,
  } = props;

  const [currentStep, setCurrentStep] = useState(0);

  const goNext = () => {
    const currentValidator = steps[currentStep]?.validator;

    if (currentValidator) {
      const errors = currentValidator();
      if (errors.length > 0) {

        if (setErroresValidacion) {
          setErroresValidacion(errors);
        }
        notificationHelpers.warningAlert(
          errors[0]?.valor ||
            "Por favor corrige los errores antes de continuar."
        );

        if (errors[0] && focusByErrKey) {
          focusByErrKey(errors[0].nombre);
        }

        return;
      }
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onSubmit?.();
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="custom-stepper">
      {/* Stepper Nav */}
      <div className="stepper-nav">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`stepper-item ${
              index === currentStep ? "current" : ""
            } ${index < currentStep ? "completed" : ""}`}
          >
            <div className="stepper-icon">
              {index < currentStep ? (
                <i className="stepper-check fas fa-check"></i>
              ) : (
                <span className="stepper-number">{index + 1}</span>
              )}
            </div>
            <div
              className={`stepper-label ${
                index < currentStep ? "stepper-label-completed" : ""
              }`}
            >
              <h3
                className="stepper-title"
                style={{
                  color: index < currentStep ? "#99A1B7" : "#78829D",
                }}
              >
                {step.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="stepper-content">{steps[currentStep].renderer}</div>

      {/* Buttons */}
      <div className="stepper-actions">
        <button
          type="button"
          className="btn btn-light btn-active-light-primary"
          disabled={loading || currentStep === 0}
          onClick={goBack}
        >
          {loading ? (
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            <span className=""></span>
          )}
          Atrás
        </button>
        {steps[currentStep].children}
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading}
          onClick={goNext}
        >
          {loading ? (
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            <span className=""></span>
          )}
          {currentStep === steps.length - 1 ? "Guardar" : "Siguiente"}
        </button>
      </div>
    </div>
  );
};
