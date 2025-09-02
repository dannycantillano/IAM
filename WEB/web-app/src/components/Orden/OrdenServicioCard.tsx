import { DTO_ItemOrdenServicio, DTO_OrdenServicio } from "@/models";
import { STATUS_TBL } from "@/constants";
import { FechaEntregaBadge } from "./FechaEntregaBadge";
import { useEffect } from "react";

interface Props {
  orden: DTO_OrdenServicio;
  items: DTO_ItemOrdenServicio[];
  onClickCreateCount?: ( countSelected: DTO_OrdenServicio ) => void;
  onAvanceChange: (item: DTO_ItemOrdenServicio, checked: boolean) => void;
  onEstadoChange: (orden: DTO_OrdenServicio, nuevoEstado: number) => void;
}
/* 
───────────────────────────────────────────────
🧭 Comportamiento de botones por estado actual
───────────────────────────────────────────────
Estado         ID    ⏸ / ▶ (handleToggle)           ➡ (handleAvanzar)
───────────── ────  ─────────────────────────────  ─────────────────────
NUEVO          6    ⏸ → 8 (EN ESPERA)               ➡ → 7 (EN PROCESO)
                     ▶ desde 8 → 7

EN PROCESO     7    ⏸ → 8 (EN ESPERA)               ➡ → 9 (COMPLETADO)
                     ▶ desde 8 → 7

EN ESPERA      8    ▶ → 7 (EN PROCESO)              🚫 sin botón ➡

COMPLETADO     9    ⏸ → 8 (EN ESPERA)               🚫 sin botón ➡
                     ▶ desde 8 → 7

Notas:
- `handleToggle` controla el cambio entre EN PROCESO y EN ESPERA.
- `handleAvanzar` avanza solo si está en NUEVO (a 7) o EN PROCESO (a 9).
- El botón ⏸/▶ solo aparece si el estado no es NUEVO o es uno de los controlables.

*/

export const OrdenServicioCard = ({
  orden,
  items,
  onAvanceChange,
  onEstadoChange,
  onClickCreateCount,
}: Props) => {
  useEffect(() => {
      if (items.length === 0) return;
      try {
        const popovers = Array.from(
          document.querySelectorAll<HTMLElement>('[data-bs-toggle="popover"]')
          //@ts-expect-error se ignora ya que actua directamente sobre los scripts del template
        ).map(el => new bootstrap.Popover(el));
  
        return () => popovers.forEach(p => p.dispose());
      } catch (error) {
        console.log(error);
    
      }
  
    }, [items]);
  const estadoActual = orden.estado.iD_Estado;

  const handleToggle = () => {
    if (estadoActual === STATUS_TBL.ORDER_SERVICE.PENDING) {
      onEstadoChange(orden, STATUS_TBL.ORDER_SERVICE.IN_PROCESS);
    } else {
      onEstadoChange(orden, STATUS_TBL.ORDER_SERVICE.PENDING);
    }
  };

  const handleAvanzar = () => {
    if (estadoActual === STATUS_TBL.ORDER_SERVICE.NEW) {
      onEstadoChange(orden, STATUS_TBL.ORDER_SERVICE.IN_PROCESS);
    } else if (estadoActual === STATUS_TBL.ORDER_SERVICE.IN_PROCESS) {
      onEstadoChange(orden, STATUS_TBL.ORDER_SERVICE.COMPLETED);
    }
  };




  const showAvanzar =
    estadoActual === STATUS_TBL.ORDER_SERVICE.NEW ||
    estadoActual === STATUS_TBL.ORDER_SERVICE.IN_PROCESS;

  const getToggleIcon = () => {
    if (estadoActual === STATUS_TBL.ORDER_SERVICE.PENDING)
      return "bi-play-btn-fill";
    return "bi-pause-btn-fill";
  };

  return (
    <div className="card mb-6 mb-xl-9 flash-blue">
      <div className="card-body">
        <div className="d-flex flex-stack mb-3">
          <div className="text-active-inverse-white bg-active-white active">
            <span className="fs-4 mb-1 text-gray-700">
             #{orden.iD_OrdenServicio}
          </span>
          </div>
          <FechaEntregaBadge
            fechaEntrega={orden.fechaEstimadaEntrega}
            fechaCreacion={orden.fechaOrdenServicio}
          />
        </div>

        <div className="mb-2">
          
        </div>

        <div className="fs-6 fw-bold text-gray-700 mb-3">
          {orden.referenciaJSON.map((r) => r.valor).join(", ")}
        </div>

        {items.map((item) => (
          <div className="mb-2" key={item.iD_ItemOrdenServicio}>
            <div className="form-check form-check-custom form-check-solid">
              <input
                className="form-check-input"
                type="checkbox"
                checked={item.avance === 100}
                onChange={(e) => onAvanceChange(item, e.target.checked)}
                id={`flexCheckDefault-${item.iD_ItemOrdenServicio}`}
              />
              <span
                className="form-check-label text-gray-700 lbl"
                tabIndex={0}
                role="button"
                data-bs-toggle="popover"
                data-bs-trigger="focus"
                data-bs-content={item.descripcion || "Sin descripción"}
              >
                {item.nombreItemOrdenServicio}
              </span>
            </div>
          </div>
        ))}

        <div className="separator my-3"></div>
        <p className="text-gray-700 py-2 fw-bold">{(orden?.notaOrdenServicio ?? "").replace(/\s*\|\s*$/, "") || "—"}</p>

        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="d-flex align-items-center gap-3">
            {(estadoActual !== STATUS_TBL.ORDER_SERVICE.NEW ||
              estadoActual === STATUS_TBL.ORDER_SERVICE.PENDING ||
              estadoActual === STATUS_TBL.ORDER_SERVICE.IN_PROCESS ||
              estadoActual === STATUS_TBL.ORDER_SERVICE.COMPLETED) && (
              <div
                style={{ cursor: "pointer" }}
                className="border border-dashed border-gray-300 rounded py-3 px-3 text-gray-600"
                onClick={handleToggle}
                title={
                  getToggleIcon() === "bi-pause-btn-fill"
                    ? "Colocar En espera"
                    : "Colocar En proceso"
                }
              >
                <i className={`bi ${getToggleIcon()}`} />
              </div>
            )}

            {/* Botón que aparece solo cuando el estado es COMPLETED */}
            {estadoActual === STATUS_TBL.ORDER_SERVICE.COMPLETED && (
              <button
                className="btn btn-sm btn-light border border-dashed border-gray-300 px-2 py-2 bg-transparent"
                onClick={() => {
                  if (onClickCreateCount) {
                    onClickCreateCount(orden);
                  }
                }}
              >
                Crear cuenta
              </button>
            )}
          </div>

          {showAvanzar && (
            <div
              style={{ cursor: "pointer" }}
              title={
                estadoActual === STATUS_TBL.ORDER_SERVICE.NEW
                  ? "Avanzar a En Proceso"
                  : "Avanzar a Completado"
              }
              className="d-flex my-1"
              onClick={handleAvanzar}
            >
              <div className="border border-dashed border-gray-300 rounded py-3 px-3 text-gray-600">
                <i className="bi bi-arrow-right-square-fill" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
