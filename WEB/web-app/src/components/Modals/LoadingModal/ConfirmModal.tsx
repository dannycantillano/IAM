import { useScrollLockSmart } from "@/hooks";
import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  show: boolean;
  confirmMessage?: string;
  onAction: (action: boolean | null) => void;
}

export const ConfirmModal = ({
  show,
  confirmMessage,
  onAction,
}: ConfirmModalProps) => {


//#region Scroll del body
    //Ajustes para el croll del body, para bloquearlo en cuando se abren los modales
const modalRef = useRef<HTMLDivElement>(null);

 useScrollLockSmart(show, { rootRef: modalRef, fallbackSelector: ".app-scroll" });


  useEffect(() => {
    if (show) modalRef.current?.focus();
  }, [show]);
//#endregion Scroll del body


  if (!show) return null;

  
  return (
    <div
      className="modal fade show d-block shadowDarkBackground p-2"
      onClick={() => onAction(null)} // clic afuera cierra
      tabIndex={-1}  
      ref={modalRef}   
      role="dialog"          
      aria-modal="true" 
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header p-4">
            <h5 className="fs-5 fw-bold">Confirmación</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => onAction(null)}
            />
          </div>
          <div className="modal-body p-4">
            <p>{confirmMessage}</p>
          </div>
          <div className="modal-footer">
            <button
              onClick={() => onAction(false)}
              type="button"
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={() => onAction(true)}
              type="button"
              className="btn btn-primary"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

