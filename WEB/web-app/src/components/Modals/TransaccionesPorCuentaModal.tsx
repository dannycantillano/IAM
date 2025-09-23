import { useEffect, useRef, useState } from "react";
import {
  DTO_Transacciones,
  DTO_Respuesta,
  DTO_Cuenta,
  DTO_Param,
} from "@/models";
import {
  ConfirmModal,
  GenericFormModal,
  InfoModal,
  GenericDataTable,
  LoadingPanel,
  AutoAccountTransactionInfoInput,
} from "@/components";
import {
  formatColones,
  errorHelpers,
  notificationHelpers,
  labelMapTransacciones,
  transaccionesFormEditFields,
  keysInfoModalTransacciones,
  columnKeysTransaccionesPorCuenta,
} from "@/utils";
import { transaccionesService } from "@/services/transacciones.service";
import { STATUS_TBL } from "@/constants";
import { valida_DTO_Transacciones } from "@/validators/valida_DTO_Transacciones";
import { useScrollLockSmart } from "@/hooks";
import { FieldConfig } from "@/types/types";

interface TransaccionesPorCuentaModalProps {
  open: boolean;
  onHide: () => void;
  onChange: (cuenta: DTO_Cuenta) => void;
  cuenta: DTO_Cuenta;
  negocioId: number;
  nombreCuenta?: string;
}

export const TransaccionesPorCuentaModal = ({
  open,
  onHide,
  onChange,
  cuenta,
  negocioId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  nombreCuenta = "Cuenta",
}: TransaccionesPorCuentaModalProps) => {


  //#region Scroll del body
  //Ajustes para el croll del body, para bloquearlo en cuando se abren los modales
  const modalRef = useRef<HTMLDivElement>(null);

 useScrollLockSmart(open, { rootRef: modalRef, fallbackSelector: ".app-scroll" });

  useEffect(() => {
    if (open) modalRef.current?.focus();
  }, [open]);
  //#endregion Scroll del body





  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  let validacion: Array<DTO_Param>;
  const eliminarError = (campo: string) => {
    setErroresValidacion(prev => prev.filter(e => e.nombre !== campo));
  };
  // #endregion

  //#region 🔄 Estados generales
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [transacciones, setTransacciones] = useState<DTO_Transacciones[]>([]);
  //#endregion

  //#region ➕ Registro
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [formData, setFormData] = useState<DTO_Transacciones>(
    new DTO_Transacciones()
  );
  //#endregion

  //#region ✏️ Edición
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState<DTO_Transacciones | null>(null);
  const [rowEditSelected, setRowEditSelected] =
    useState<DTO_Transacciones | null>(null);
  //#endregion

  //#region 🗑 Eliminación
  const [transToDelete, setTransToDelete] = useState<DTO_Transacciones | null>(
    null
  );
  //#endregion

  //#region ✅ Confirmación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmContext, setConfirmContext] = useState<
    "cancelAdd" | "delete" | null
  >(null);
  //#endregion

  //#region ℹ️ Info Modal
  const [rowSelected, setRowSelected] = useState<DTO_Transacciones>();
  //#endregion

  //#region 📦 Cargar transacciones al abrir
  useEffect(() => {
    if (!open) return;
    setLoading(true);

    transaccionesService.obtenerTransaccionPorCuenta(cuenta).subscribe({
      next: (result: DTO_Respuesta) => {
        const listaRaw = Array.isArray(result.resultado)
          ? (result.resultado[0] as DTO_Transacciones[])
          : [];

        const activas = listaRaw.filter(
          (t) => t.estado?.iD_Estado !== STATUS_TBL.TRANSACTION.DELETED
        );
        setTransacciones(activas);
      },
      error: errorHelpers.serverError,
      complete: () => setLoading(false),
    });
  }, [open, cuenta]);
  //#endregion


  //#region 🛠 Funciones
  const handleAddNew = () => {
    setFormData(new DTO_Transacciones());
    setIsModalFormOpen(true);
  };

  const handleSave = () => {
    setLoadingForm(true);
    const payload: DTO_Transacciones = {
      ...formData,
      iD_Negocio: negocioId,
      tipoNumReferencia: "Cuenta",
      numReferencia: String(cuenta.iD_Cuenta),
    };

    if (cuenta.tipoCuenta == "Cuenta Por Cobrar") {
      payload.tipo = "Ingreso"

    } else if (cuenta.tipoCuenta == "Cuenta Por Pagar") {
      payload.tipo = "Gasto"
    }

    validacion = valida_DTO_Transacciones.validar(payload, "C");
    setErroresValidacion(validacion)
    if (validacion.length === 0) {
      transaccionesService.registrarTransaccion(payload).subscribe({
        next: (result: DTO_Respuesta) => {
          const nueva = (result.resultado as DTO_Transacciones[])[0];
          if (nueva) setTransacciones((prev) => [...prev, nueva]);

          //Lógica para sumar a los campos calculados
          actualizarCamposCalculadosCuenta(transacciones.reduce((suma, t) => suma + (Number(t?.monto) || 0), 0) + (Number(nueva.monto) || 0));

          notificationHelpers.successAlert(result.mensaje);
          setIsModalFormOpen(false);
        },
        error: errorHelpers.serverError,
        complete: () => setLoadingForm(false),
      });
    } else {
      setLoadingForm(false);
      notificationHelpers.warningAlert("Por favor valida los datos ingresados nuevamente");
    }
  };

  const actualizarCamposCalculadosCuenta = (nuevoMondoAbonado: number) => {

    cuenta.montoAbonado = nuevoMondoAbonado

    if (cuenta.montoAbonado >= cuenta.monto)
      cuenta.estadoPago = "Pagada"
    else
      cuenta.estadoPago = "Pendiente"

    cuenta.saldoPendiente = cuenta.monto - cuenta.montoAbonado
    onChange(cuenta)

  }
  const handleEdit = (row: DTO_Transacciones) => {
    setRowEditSelected(row);
    setEditData({ ...row });
    setShowEditForm(true);
  };

  const handleSaveEdit = (updated: DTO_Transacciones) => {
    if (!rowEditSelected) return;

    setLoadingForm(true);
    updated.iD_Transaccion = rowEditSelected.iD_Transaccion;
    updated.iD_Negocio = negocioId;

    if (!updated.estado?.iD_Estado && rowEditSelected.estado?.iD_Estado) {
      updated.estado = { ...rowEditSelected.estado };
    }

    if (cuenta.tipoCuenta == "Cuenta Por Cobrar") {
      updated.tipo = "Ingreso"

    } else if (cuenta.tipoCuenta == "Cuenta Por Pagar") {
      updated.tipo = "Gasto"
    }

    validacion = valida_DTO_Transacciones.validar(updated, "U");
    setErroresValidacion(validacion)
    if (validacion.length === 0) {
      transaccionesService.actualizarTransaccion(updated).subscribe({
        next: () => {
          setTransacciones((prev) =>
            updated.estado?.iD_Estado !== STATUS_TBL.TRANSACTION.DELETED
              ? prev.map((t) =>
                  t.iD_Transaccion === updated.iD_Transaccion ? updated : t
                )
              : prev.filter((t) => t.iD_Transaccion !== updated.iD_Transaccion)
          );

          actualizarCamposCalculadosCuenta(
            transacciones.reduce(
              (acc, t) =>
                t.iD_Transaccion === updated.iD_Transaccion
                  ? acc
                  : acc + (Number(t?.monto) || 0),
              Number(updated?.monto) || 0
            )
          );

          notificationHelpers.successAlert(
            "Transacción actualizada correctamente"
          );
          setShowEditForm(false);
        },
        error: errorHelpers.serverError,
        complete: () => setLoadingForm(false),
      });
    } else {
      setLoadingForm(false);
      notificationHelpers.warningAlert("Por favor valida los datos ingresados nuevamente");
    }

  };

  const handleDelete = (item: DTO_Transacciones) => {
    setConfirmModalMessage(
      `¿Estás seguro de eliminar la transacción ${item.concepto}?`
    );
    setTransToDelete(item);
    setConfirmContext("delete");
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = (action: boolean | null) => {
    if (action && transToDelete) {
      setLoadingForm(true);
      const updated = {
        ...transToDelete,
        estado: {
          ...transToDelete.estado!,
          iD_Estado: STATUS_TBL.TRANSACTION.DELETED,
        },
      };
      setTransacciones((prev) =>
        prev.filter((t) => t.iD_Transaccion !== updated.iD_Transaccion)
      );
      transaccionesService.actualizarTransaccion(updated).subscribe({
        next: () => {
          notificationHelpers.infoAlert("Transacción eliminada");
          actualizarCamposCalculadosCuenta(transacciones.reduce((suma, t) => suma + (Number(t?.monto) || 0), 0) - (Number(updated.monto) || 0));
        },
        error: errorHelpers.serverError,
        complete: () => setLoadingForm(false),
      });
      setTransToDelete(null);
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
  };

  const handleCancelAdd = () => {
    setConfirmModalMessage("¿Deseas cancelar el registro?");
    setConfirmContext("cancelAdd");
    setIsConfirmOpen(true);
  };

  const confirmModalAction = (action: boolean | null) => {
    if (action) {
      if (confirmContext === "cancelAdd") {
        setIsModalFormOpen(false);
        notificationHelpers.infoAlert("Registro cancelado");
      } else if (confirmContext === "delete") {
        handleConfirmDelete(true);
      }
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
  };
  //#endregion

  //#region 🔎 InfoModal

  const infoModalFields: FieldConfig<DTO_Transacciones>[] = [
    ...keysInfoModalTransacciones,
    {
      key: "monto",
      label: "Monto",
      type: "custom",
      order: 9,
      renderer: ({ value }) => (
        <div className="border border-gray-200 rounded px-4 py-3 d-flex align-items-center justify-content-between shadow-sm">
          <i className="bi bi-cash-coin fs-4 text-gray-600 me-3"></i>
          <span className="fw-semibold fs-5 text-gray-800"></span>
          {formatColones(Number(value) || 0)}
        </div>
      ),
    },
  ];
  //#endregion

  //#region 🧾 Formularios
  const registerFields: FieldConfig<DTO_Transacciones>[] = [
    { key: "concepto", label: "Concepto", type: "text", required: true },
    { key: "monto", label: "Monto", type: "number", required: true }
  ];

  const editFormFields: FieldConfig<DTO_Transacciones>[] =
    transaccionesFormEditFields.filter(f => f.key !== "tipo").map((field) => {
      const esCuenta =
        editData?.tipoNumReferencia?.trim().toLowerCase() === "cuenta";
      if (
        esCuenta &&
        (field.key === "tipoNumReferencia" || field.key === "numReferencia")
      ) {
        return {
          ...field,
          type: "custom",
          renderer: () => (
            <AutoAccountTransactionInfoInput field={field} editData={editData} />
          ),
        };
      }
      return field;
    });
  //#endregion
  //#region 🔎 Custom renderers
  const customRenderers = {
    monto: (val: unknown) => formatColones(Number(val) || 0),
    fechaTransaccion: (val: unknown) =>
      val ? new Date(String(val)).toLocaleDateString() : "",
  };
  //#endregion

  if (!open) return null;

  //#region 🎨 Render modal
  return (
    <div
      className="modal fade show d-block shadowClearBackground"
      onClick={onHide}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: "1200px" }}
        onClick={(e) => e.stopPropagation()}

        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-content resizable-metronic-modal">
          <div className="modal-header cursor-move pt-4 pb-0 border-0 p-5 py-10 px-lg-17 pt-5">
            <h2 className="fw-light text-gray-400 fs-5">{cuenta.tipoCuenta.charAt(0).toUpperCase() + cuenta.tipoCuenta.slice(1).toLowerCase() + " #" + cuenta.iD_Cuenta}</h2>
            <button
              type="button"
              className="btn-close"
              onClick={onHide}>
            </button>
          </div>
          <div className="modal-body p-0">
            {loading ? (
              <LoadingPanel msj="Cargando transacciones..." />
            ) : (
              <GenericDataTable<DTO_Transacciones>
                title={"Transacciones"}
                nowrapColumns={['Monto']}
                columnKeys={columnKeysTransaccionesPorCuenta}
                labelMap={labelMapTransacciones}
                data={transacciones}
                onAdd={handleAddNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRowClick={(row) => setRowSelected(row as DTO_Transacciones)}
                customRenderers={customRenderers}
                includeEstadoColumn={false}

              />
            )}

            <InfoModal
              show={!!rowSelected}
              onHide={() => setRowSelected(undefined)}
              data={rowSelected!}
              fields={infoModalFields}
            />

            <GenericFormModal
              title={
                "Registrar Transacción (Abono/Pago) para la " + cuenta.tipoCuenta + " #" + cuenta.iD_Cuenta
              }
              show={isModalFormOpen}
              onHide={handleCancelAdd}
              loading={loadingForm}
              data={formData}
              setData={setFormData}
              onSubmit={handleSave}
              fields={registerFields}
              erroresValidacion={erroresValidacion}
              onEliminarError={eliminarError}
            />

            <GenericFormModal
              title="Editar Transacción"
              show={showEditForm}
              onHide={() => setShowEditForm(false)}
              loading={loadingForm}
              data={editData!}
              setData={(x) => setEditData(x as DTO_Transacciones)}
              onSubmit={() => editData && handleSaveEdit(editData)}
              fields={editFormFields}
              erroresValidacion={erroresValidacion}
              onEliminarError={eliminarError}
            />

            <ConfirmModal
              show={isConfirmOpen}
              confirmMessage={confirmModalMessage}
              onAction={confirmModalAction}
            />
          </div>
          <div className="modal-footer flex-center">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onHide}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  //#endregion
};
