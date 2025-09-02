import React, { useEffect, useState } from "react";
import { ConfirmModal } from "../Modals/LoadingModal/ConfirmModal";
import { DTO_DetalleCuentaJSON, DTO_Param } from "@/models";
import { DTO_Fila_Detalle } from "@/models/DTO_Fila_Detalle";
import { formatColones } from "@/utils";

interface Props {
  value?: DTO_DetalleCuentaJSON;
  onChange: (val?: DTO_DetalleCuentaJSON) => void;
  onBlur?: () => void;
  monto: number;
  setMonto: (val: number) => void;
  onEnabledChange?: (enabled: boolean) => void;
}

export const DetalleCuentaInput = ({
  value,
  onChange,
  monto,
  setMonto,
  onEnabledChange,
  onBlur,
}: Props) => {
  const [enabled, setEnabled] = useState(false);
  const [filas, setFilas] = useState<DTO_Fila_Detalle[]>([]);
  const [nombreFila, setNombreFila] = useState("");
  const [valorFila, setValorFila] = useState("");
  const [cantidadFila, setCantidadFila] = useState("");

  const [descuento, setDescuento] = useState<DTO_Param>({
    nombre: "Monto",
    valor: "",
  });
  const [impuesto, setImpuesto] = useState<DTO_Param>({
    nombre: "Porcentaje",
    valor: "",
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);
  const [autoInicializado, setAutoInicializado] = useState(false);

  // ✅ Inicialización única si hay datos
  useEffect(() => {
    if (autoInicializado) return;

    const tieneFilas = value?.filas?.length;
    const tieneDescuento = !!value?.descuento?.valor;
    const tieneImpuesto = !!value?.impuesto?.valor;

    if (tieneFilas || tieneDescuento || tieneImpuesto) {
      setFilas(value?.filas || []);
      setDescuento(value?.descuento || { nombre: "Monto", valor: "" });
      setImpuesto(value?.impuesto || { nombre: "Porcentaje", valor: "" });
      setEnabled(true);
      onEnabledChange?.(true);
    } else {
      setEnabled(false);
      onEnabledChange?.(false);
    }

    setAutoInicializado(true);
  }, [value, autoInicializado]);


  // ✅ Calcula monto si está habilitado
  useEffect(() => {
    if (!enabled) return;

    const suma = filas.reduce(
      (acc, item) => acc + (parseFloat(item.valor || "0") * parseFloat(item.cantidad || "1")),
      0
    );

    const desc =
      descuento.nombre === "Porcentaje"
        ? suma * (parseFloat(descuento.valor || "0") / 100)
        : parseFloat(descuento.valor || "0");

    const imp =
      suma > 0 ? (suma - desc) * (parseFloat(impuesto.valor || "0") / 100) : 0;

    const total = suma - desc + imp;

    setMonto(parseFloat(total.toFixed(2)));

    onChange({
      filas,
      descuento,
      impuesto,
    });
  }, [filas, descuento, impuesto, enabled]);

  useEffect(() => {
    const hayTexto = nombreFila.trim() !== "" || valorFila.trim() !== "";

    const tienePendientes = enabled && hayTexto;

    if (tienePendientes) {
      // Forzar un valor que haga fallar validación, pero sea único para que se dispare el render
      onChange(("error_force_" + Date.now()) as any);
      onBlur?.();
    } else {
      onChange({
        filas,
        descuento,
        impuesto,
      });
    }

  }, [nombreFila, valorFila, filas, descuento, impuesto, enabled]);


  const agregarFila = () => {
    if (nombreFila && valorFila && !isNaN(parseFloat(valorFila))) {
      setFilas([...filas, { nombre: nombreFila, valor: valorFila, cantidad: cantidadFila || "1" }]);
      setNombreFila("");
      setValorFila("");
      setCantidadFila("");
    }
  };
  const limpiarCampos = () => {
    setNombreFila("");
    setValorFila("");
    setCantidadFila("");
  };



  const eliminarFila = (index: number) => {
    const nuevas = [...filas];
    nuevas.splice(index, 1);
    setFilas(nuevas);
  };

  const toggleDetalle = () => {
    if (enabled) {

      if (filas.length === 0 && (descuento.valor == "0" || descuento.valor === '') && (impuesto.valor == "0" || impuesto.valor === '')) {
        setPendingToggle(false);
        setEnabled(false);
        confirmModalAction(true);
      } else {
        setIsConfirmOpen(true);
        setPendingToggle(false);
        setConfirmModalMessage(
          "¿Desea desactivar el detalle? Se eliminarán las filas y los valores ingresados."
        );
      }
    } else {
      if (monto > 0) {
        setIsConfirmOpen(true);
        setPendingToggle(true);
        setConfirmModalMessage(
          "Al activar el detalle se eliminará el monto actual y será calculado con los valores de cada fila agregada. ¿Desea continuar?"
        );
      } else {
        setEnabled(true);
        setPendingToggle(false);
        onEnabledChange?.(true);
        return;
      }
    }
    //setIsConfirmOpen(true);
  };

  const confirmModalAction = (confirm: boolean | null) => {
    if (confirm && pendingToggle !== null) {
      if (pendingToggle) {
        setEnabled(true);
        setMonto(0);
        onEnabledChange?.(true);
      } else {
        setEnabled(false);
        setMonto(0);
        onEnabledChange?.(false);
        onChange(undefined);
        setFilas([]);
        setDescuento({ nombre: "Monto", valor: "" });
        setImpuesto({ nombre: "Porcentaje", valor: "" });
      }
    }
    setIsConfirmOpen(false);
    setPendingToggle(null);
  };
  return (
    <div className="mt-3">
      <div className="d-flex align-items-center mb-3">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            checked={enabled}
            onChange={toggleDetalle}
            id="detalleSwitch"
          />
          <label
            className="form-check-label fs-5"
            htmlFor="detalleSwitch"
          >
            Detalle
          </label>
        </div>
      </div>

      <ConfirmModal
        show={isConfirmOpen}
        confirmMessage={confirmModalMessage}
        onAction={confirmModalAction}
      />
      {enabled && (
        <div className="bg-white">
          <div className="mb-4">
            {filas.length === 0 && (

              <div className="dt-empty-state d-flex flex-column align-items-center justify-content-center py-10">
                <i className="bi bi-inbox fs-1 text-muted" aria-hidden="true"></i>
                <span className="text-muted mt-2">No hay detalles agregados.</span>
              </div>
            )}
            {/* {filas.map((item, idx) => (
              <div
                key={idx}
                className="d-flex justify-content-between align-items-center py-2 px-3 mb-2 rounded bg-light"
              >
                <div>
                  <span className="">{item.nombre}</span>
                  <span className="mx-2 text-secondary">|</span>
                  <span className="text-success">
                    ₡
                    {parseFloat(item.valor).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => eliminarFila(idx)}
                  title="Eliminar"
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            ))} */}


            {filas.length > 0 && (
              <div>
                <table className="table table-sm align-middle dtr-inline" id="DataTables_Table_28" aria-describedby="DataTables_Table_28_info" data-zebra-custom="398bc2">
                  <thead className="text-muted fs-8 fw-bold">
                    <tr>
                      <th className="text-center w-60"></th>
                      <th className="text-center w-60"></th>
                      <th className="text-center w-60"></th>
                      <th className="text-center w-60"></th>
                      <th className="text-center w-60"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filas.length === 0 && (


                      <tr className="no-hover-row">
                        <td colSpan={5} className="dt-empty">
                          <div className="dt-empty-state d-flex flex-column align-items-center justify-content-center py-10">
                            <i className="bi bi-inbox fs-1 text-muted" aria-hidden="true"></i>
                            <span className="text-muted mt-2">Sin datos</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {filas.map((it, idx) => (
                      <React.Fragment key={'CardItemProforma' + idx}>


                        {/* ======= Vista MÓVIL (< sm): grid 8/2/1/1 ======= */}

                        <tr className="d-table-row">
                          <td colSpan={5} className="pb-4">
                            <div className="p-2 py-4 pb-2 pt-1 border border-secoundary rounded-3 hoverElement">
                              <div className="row py-2 pb-5">
                                <div className="col-10"><span className="fs-7 text-gray-600 mt-2">{'#' + (idx + 1)}</span></div>
                                <div className="text-end col-2">


                                  <button
                                    type="button"
                                    className="btn btn-sm p-0"
                                    title="Eliminar"
                                    onClick={() => eliminarFila(idx)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>



                                </div>



                              </div>

                              <div className="row g-1">

                                <div className="col-6">
                                  <label htmlFor={'txtNombre' + idx.toString()} className="fs-7 text-gray-600">Nombre</label>
                                  <p>{it.nombre}</p>
                                </div>

                                <div className="col-3">
                                  <label htmlFor={'txtPrecio' + idx.toString()} className="fs-7 text-gray-600">Monto</label>
                                  <p>{formatColones(it.valor)}</p>
                                </div>


                                <div className="col-3">
                                  <label htmlFor={'txtCantidad' + idx.toString()} className="fs-7 text-gray-600">Cantidad</label>
                                  <p>{it.cantidad || 1}</p>

                                </div>


                                <div className="mb-2"></div>
                                <div className="row p-0">
                                  <div className="text-start col-6"></div>
                                  <div className="text-end col-6"><span className="fs-7 text-gray-600 mt-2">Importe</span> <span className="fs-7 text-gray-600 mt-2 ">{formatColones((+it.cantidad || 1) * (+it.valor || 0))}</span></div>



                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}


                  </tbody>

                </table>
              </div>
            )}

          </div>

          <div className="w-100">
            {/* Fila 1: Nombre (100%) */}
            <div className="row g-2">
              <div className="col-12">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre del detalle"
                  value={nombreFila}
                  onChange={(e) => setNombreFila(e.target.value)}
                />
              </div>
            </div>

            {/* Fila 2: Monto + Cantidad + Botones (misma línea, sin scroll) */}
            <div className="row g-2 align-items-end mt-1">
              {/* XS: 5/12 — SM: 4/12 — MD: 3/12 */}
              <div className="col-5 col-sm-4 col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Monto"
                  value={valorFila}
                  onChange={(e) => {
                    const v = e.target.value
                      .replace(/[^\d.,]/g, "")     // deja dígitos y . ,
                      .replace(",", ".")           // normaliza coma a punto
                      .replace(/(\..*)\./g, "$1"); // solo un punto decimal
                    setValorFila(v);
                  }}
                  inputMode="numeric"
                  pattern="^\d+$"
                  
                />
              </div>

              {/* XS: 3/12 — SM: 2/12 — MD: 2/12 */}
              <div className="col-3 col-sm-2 col-md-4">
                {/* Solo visual; no toca tu lógica */}
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cantidad"
                  value={cantidadFila}
                  onChange={(e) => {
                    const v = e.target.value
                      .replace(/[^\d.,]/g, "")     // deja dígitos y . ,
                      .replace(",", ".")           // normaliza coma a punto
                      .replace(/(\..*)\./g, "$1"); // solo un punto decimal
                    setCantidadFila(v);
                  }}
                  inputMode="numeric"
                  pattern="^\d+$"
                  
                />
              </div>

              {/* XS: 4/12 — SM: 6/12 — MD: 7/12 (botones a la derecha, juntos) */}
              <div className="col-4 col-sm-6 col-md-4 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm btn-icon"
                  onClick={limpiarCampos}
                  title="Limpiar"
                >
                  <i className="bi bi-arrow-counterclockwise" />
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-icon"
                  title="Agregar fila"
                  onClick={agregarFila}
                  disabled={!nombreFila || !valorFila || isNaN(parseFloat(valorFila))}
                >
                  <i className="bi bi-plus-lg" />
                </button>
              </div>
            </div>

            <div className="row g-3 mt-3">
              <div className="col-12 col-md-6">
                <label className="fs-5">Descuento ({descuento.nombre === "Porcentaje" ? "%" : "₡"})</label>
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="0.00"
                    className="form-control"
                    value={descuento.valor}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (descuento.nombre === "Porcentaje") {
                        if (parseFloat(val) > 100) val = "100";
                        if (parseFloat(val) < 0) val = "0";
                      } else {
                        if (parseFloat(val) < 0) val = "0";
                      }
                      setDescuento({ ...descuento, valor: val });
                    }}
                    min="0"
                    {...(descuento.nombre === "Porcentaje" ? { max: 100 } : {})}
                  />
                  <button
                    type="button"
                    className={`btn ${descuento.nombre === "Porcentaje" ? "btn-primary" : "btn-secondary"} btn-icon pulse`}
                    onClick={() =>
                      setDescuento((prev) => ({
                        nombre: prev.nombre === "Porcentaje" ? "Monto" : "Porcentaje",
                        valor: "0",
                      }))
                    }
                    title="Cambiar tipo"
                  >
                    {descuento.nombre === "Porcentaje" ? "%" : "₡"}
                    <span className="pulse-ring" />
                  </button>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="fs-5">Impuesto (%)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="form-control"
                  value={impuesto.valor}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (parseFloat(val) > 100) val = "100";
                    if (parseFloat(val) < 0) val = "0";
                    setImpuesto({ nombre: "Porcentaje", valor: val });
                  }}
                  min="0"
                  max="100"
                />
              </div>
            </div>

          </div>




        </div>
      )}
    </div>
  );
};
