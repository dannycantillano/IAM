// -------------------------------------------------------------------------------------------------
// InfoModal.tsx - Modal genérico basado en FieldConfig<T>
// Muestra valores formateados, con soporte para custom renderers.
// -------------------------------------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { dateHelpers } from "@/utils";
import { FieldConfig } from "../GenericFormModal/types";
import { DynamicButtonConfig, ModalHeaderButtons } from "@/components";
import { useScrollLockSmart } from "@/hooks";


interface InfoModalProps<T> {
  show: boolean;
  onHide: () => void;
  data: T;
  fields: FieldConfig<T>[];
  title?: string;
  headerButtons?: DynamicButtonConfig[];
}






/**
 * Formatea fechas válidas si están después del año 1753.
 */
const tryFormatDate = (val: unknown): string | null => {
  const date =
    val instanceof Date
      ? val
      : typeof val === "string" || typeof val === "number"
      ? new Date(val)
      : new Date(NaN);
  if (isNaN(date.getTime()) || date.getFullYear() < 1753) return null;
  return dateHelpers.formatFechaDDMMYYYY(date);
};

/**
 * Render automático de valores según tipo
 */
function renderValue<T>(
  field: FieldConfig<T>,
  value: unknown
): React.ReactNode {
  const type = field.type ?? "text";

  if (type === "custom" && field.renderer) {
    return field.renderer({ value, onChange: () => {}, readOnly: true });
  }

  if (type === "date") {
    const formatted = tryFormatDate(value);
    if (formatted) return <span>{formatted}</span>;
    if (value === "0001-01-01T00:00:00") {
      return (
        <>
            <span className="px-3 py-2 fs-7 d-inline-flex align-items-center">
              <i className="bi bi-exclamation-circle me-2"></i>
              Fecha pendiente de definición
            </span>
        </>
      );
    }
    return <span className="text-muted">[Fecha inválida]</span>;
  }

  if (type === "boolean") {
    return (
      <span
        className={`badge ${value ? "bg-success" : "bg-secondary"} text-white`}
      >
        {value ? "Sí" : "No"}
      </span>
    );
  }

  // Renderiza estado con badge si viene como objeto con .nombre
  if (
    typeof value === "object" &&
    value !== null &&
    "nombre" in value &&
    typeof (value as any).nombre === "string"
  ) {
    const nombre = String((value as any).nombre).toLowerCase();
    const badgeMap: Record<string, string> = {
      activo: "badge-light-success",
      nuevo: "badge-secondary",
      "en proceso": "badge-light-primary",
      "en espera": "badge-light-warning",
      completado: "badge-light-success",
      eliminado: "badge-light-danger",
      inactivo: "badge-light-light",
      default: "badge-dark",
    };
    const badgeClass = badgeMap[nombre] ?? badgeMap.default;
    const capitalizedNombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    return <span className={`badge ${badgeClass}`}>{capitalizedNombre}</span>;
  }

  if (value === null || value === undefined || value === "") {
   return (
     <span className="px-3 py-2 fs-7">
       ---
     </span>
   );
  }

  return <span>{String(value)}</span>;
}

/**
 * Modal Info reutilizable basado en FieldConfig
 */
export const InfoModal = <T,>({
  show,
  onHide,
  data,
  fields,
  title = "Detalles",
  headerButtons,
}: InfoModalProps<T>) => {

//#region Scroll del body
    //Ajustes para el croll del body, para bloquearlo en cuando se abren los modales
const modalRef = useRef<HTMLDivElement>(null);

 useScrollLockSmart(show, { rootRef: modalRef, fallbackSelector: ".app-scroll" });


  useEffect(() => {
    if (show) modalRef.current?.focus();
  }, [show]);
//#endregion Scroll del body




  if (!show) return null;

  const sortedFields = [...fields].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  if (!data) return null;

  return (
    <div
      className="modal fade show d-block shadowClearBackground"
      onClick={onHide}
      ref={modalRef}           
      tabIndex={-1}  
      role="dialog"          
      aria-modal="true" 
    >
      <div
        className="modal-dialog modal-dialog-centered mw-750px"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content card card-custom example example-compact">
          {/* Título */}
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

          {/* Cuerpo */}
          <div className="modal-body">
            <div className="row g-6">
              {sortedFields.map((field) => {
                const value = data?.[field.key] ?? null;
                return (
                  <div key={String(field.key)} className="col-12 col-md-6">
                    <div className="h-100">
                      <div className="text-muted fs-5 mb-1">
                        {field.label}: <span className="text-dark">{renderValue(field, value)}</span>
                      </div>
                
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer flex-center py-5">
            <button type="button" className="btn btn-light" onClick={onHide}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
