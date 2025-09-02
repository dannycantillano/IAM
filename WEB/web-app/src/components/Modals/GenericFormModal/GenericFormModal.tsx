import { useGenericForm } from "@/hooks/useGenericForm";
import { FieldConfig } from "./types";
import { DynamicButtonConfig, ModalHeaderButtons } from "@/components";
import { DTO_Param } from "@/models";
import { useScrollLockSmart } from "@/hooks/useScrollLockSmart";
import { useEffect, useRef } from "react";

//#region INTERFACES
interface GenericFormModalProps<T> {
  title: string;
  show: boolean;
  onHide: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  onSubmit: () => void;
  fields: Array<FieldConfig<T>>;
  headerButtons?: DynamicButtonConfig[];
  erroresValidacion?: Array<DTO_Param>;
  onEliminarError: (key: string) => void;
}
//#endregion

//#region COMPONENT
export const GenericFormModal = <T,>({
  title,
  show,
  onHide,
  data,
  setData,
  onSubmit,
  fields,
  headerButtons,
  erroresValidacion = [],
  onEliminarError,
}: GenericFormModalProps<T>) => {
  //#region HOOKS
  const { localDisplay, handleChange, handleBlur } = useGenericForm(
    data,
    setData,
    fields,
    show,
    onSubmit
  );

  //#region Scroll del body
  //Ajustes para el croll del body, para bloquearlo en cuando se abren los modales
  const modalRef = useRef<HTMLDivElement>(null);

  useScrollLockSmart(show, {
    rootRef: modalRef,
    fallbackSelector: ".app-scroll",
  });

  useEffect(() => {
    if (show) modalRef.current?.focus();
  }, [show]);
  //#endregion

  //#endregion

  if (!show) return null;

  //#region RENDER FIELD
  const renderField = (field: FieldConfig<T>, idx: number) => {
    const { key, label, type = "text", options, renderer, readOnly } = field;
    const rawVal = (data as any)[key];
    const localVal = localDisplay[key];

    const inputClass =
      type === "custom"
        ? erroresValidacion.some((error) => error.nombre === String(key))
          ? " is-invalid-custom-select"
          : ""
        : erroresValidacion.some((error) => error.nombre === String(key))
        ? `form-control ` + " is-invalid"
        : `form-control `;
    const wrapperClass =
      type === "custom"
        ? idx < 2
          ? " fv-row"
          : "d-flex flex-column mb-5 fv-row"
        : type === "date"
        ? "d-flex flex-column mb-5 fv-row"
        : idx < 2
        ? " fv-row"
        : "d-flex flex-column mb-5 fv-row";

    const labelClass =
      (field.required ? "required " : "") +
      (idx < 2 ? "fs-5 fw-bold mb-2" : "fs-5 fw-bold mb-2 mt-6");

    //#region READ-ONLY LABEL
    if (readOnly) {
      //#region RENDER TO ESTADOS
      if (typeof rawVal === "object" && rawVal !== null && "nombre" in rawVal) {
        const nombre = String((rawVal as any).nombre).toLowerCase();
        const badgeMap: Record<string, string> = {
          activo: "badge-light-success",
          nuevo: "badge badge-secondary",
          "en proceso": "badge-light-primary",
          "en espera": "badge-light-warning",
          completado: "badge-light-success",
          eliminado: "badge-light-danger",
          inactivo: "badge-light-light",
          default: "badge badge-dark",
        };
        const badgeClass = badgeMap[nombre] ?? badgeMap.default;

        return (
          <div className={wrapperClass} key={String(key)}>
            <label className={labelClass}>
              {label}:{" "}
              <span className={badgeClass}>{(rawVal as any).nombre}</span>
            </label>
          </div>
        );
      }
      //#endregion
      return (
        <div className={wrapperClass + " mb-3 "} key={String(key)}>
          <label className={labelClass}>
            {label}:{" "}
            <span className="text-muted fw-semibold">
              {String(rawVal ?? "–")}
            </span>
          </label>
        </div>
      );
    }
    //#endregion

    //#region TYPE CUSTOM
    if (type === "custom" && renderer) {
      return (
        <div className={wrapperClass} key={String(key)}>
          <label htmlFor={String(key)} className={labelClass}>
            {label}
          </label>
          <div className={inputClass}>
            {renderer({
              value: rawVal,
              onChange: (val) => {
                onEliminarError(key.toString());
                setData((prev) => ({ ...prev, [key]: val }));
              },
              //onBlur: () => handleBlur(key),
            })}
          </div>

          {/* sección de errores personalizados */}
          {erroresValidacion
            .filter((error) => error.nombre === String(key))
            .map((error, idx) => (
              <div key={idx} className="invalid-feedback d-block">
                {error.valor}
              </div>
            ))}
        </div>
      );
    }
    //#endregion

    //#region TYPE TEXTAREA
    if (type === "textarea") {
      return (
        <div className={wrapperClass} key={String(key)}>
          <label htmlFor={String(key)} className={labelClass}>
            {label}
          </label>
          <textarea
            id={String(key)}
            className={inputClass}
            value={String(rawVal ?? "")}
            rows={1}
            onChange={(e) => {
              onEliminarError(key.toString());
              handleChange(key, e.target.value, "text");
            }}
            onBlur={() => handleBlur(key)}
          />
          {/* sección de errores personalizados */}
          {erroresValidacion
            .filter((error) => error.nombre === String(key))
            .map((error, idx) => (
              <div key={idx} className="invalid-feedback d-block">
                {error.valor}
              </div>
            ))}
        </div>
      );
    }
    //#endregion

    //#region TYPE SELECT
    if (type === "select") {
      return (
        <div className={wrapperClass} key={String(key)}>
          <label htmlFor={String(key)} className={labelClass}>
            {label}
          </label>
          <select
            id={String(key)}
            className={inputClass}
            value={String(rawVal ?? "")}
            onChange={(e) => {
              onEliminarError(key.toString());
              handleChange(key, e.target.value, "select");
            }}
            onBlur={() => handleBlur(key)}
          >
            <option value="">– Seleccione –</option>
            {options?.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* sección de errores personalizados */}
          {erroresValidacion
            .filter((error) => error.nombre === String(key))
            .map((error, idx) => (
              <div key={idx} className="invalid-feedback d-block">
                {error.valor}
              </div>
            ))}
        </div>
      );
    }
    //#endregion

    //#region TYPE DATE
    if (type === "date") {
      const parsed = rawVal ? new Date(String(rawVal)) : null;
      const valid =
        parsed instanceof Date &&
        !isNaN(parsed.getTime()) &&
        parsed.getFullYear() >= 1753;
      const dateVal =
        localVal ?? (valid ? parsed.toISOString().slice(0, 10) : "");

      return (
        <div className={wrapperClass} key={String(key)}>
          <label htmlFor={String(key)} className={labelClass}>
            {label}
          </label>
          <input
            id={String(key)}
            type="date"
            placeholder="dd/mm/aaaa"
            className={inputClass}
            value={dateVal}
            onChange={(e) => {
              onEliminarError(key.toString());
              handleChange(key, e.target.value, "date");
            }}
            onBlur={() => handleBlur(key)}
          />
          {/* sección de errores personalizados */}
          {erroresValidacion
            .filter((error) => error.nombre === String(key))
            .map((error, idx) => (
              <div key={idx} className="invalid-feedback d-block">
                {error.valor}
              </div>
            ))}
        </div>
      );
    }
    //#endregion

    //#region DEFAULT TEXT/NUMBER
    return (
      <div className={wrapperClass} key={String(key)}>
        <label htmlFor={String(key)} className={labelClass}>
          {label}
        </label>
        <input
          id={String(key)}
          type={type}
          className={inputClass}
          value={
            type === "number"
              ? String(localVal ?? rawVal ?? "")
              : String(rawVal ?? "")
          }
          onChange={(e) => {
            onEliminarError(key.toString());
            handleChange(key, e.target.value, type);
          }}
          onBlur={() => handleBlur(key)}
        />
        {/* sección de errores personalizados */}
        {erroresValidacion
          .filter((error) => error.nombre === String(key))
          .map((error, idx) => (
            <div key={idx} className="invalid-feedback d-block">
              {error.valor}
            </div>
          ))}
      </div>
    );
    //#endregion
  };
  //#endregion

  //#region RENDER MODAL
  return (
    <div
      className="modal fade show d-block shadowDarkBackground p2"
      onClick={onHide}
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content card card-custom example example-compact">
          <div className="card-header px-5 py-lg-5">
            <div className="col-11">
              <h3 className="card-title">{title}</h3>
            </div>
            <div className="col-1">
              <div className="card-toolbar justify-content-end">
                <button type="button" className="btn-close" onClick={onHide} />
              </div>
            </div>

            {headerButtons && headerButtons.length > 0 && (
              <ModalHeaderButtons buttons={headerButtons} />
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="form"
          >
            <div className="card-body p-4 row">
              {[...fields]
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
                .map((field, idx) => (
                  <div key={String(field.key)} className="col-md-6 mb-2">
                    {renderField(field, idx)}
                  </div>
                ))}
            </div>

            <div className="card-footer d-flex justify-content-end gap-2 px-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onHide}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  //#endregion
};
//#endregion
