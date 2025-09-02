// ✅ RP-19: Pantalla Transacciones adaptada a estructura definitiva (estado local, sin refetch completo, edición con lógica de cuentas)

import { useEffect, useRef, useState } from "react";
import { DTO_Negocio, DTO_Transacciones, DTO_Respuesta, DTO_Param } from "@/models";

import {
  ConfirmModal,
  FieldConfig,
  GenericDataTable,
  GenericDataTableHandle,
  GenericFormModal,
  InfoModal,
  InfoPanel,
  LoadingPanel,
  RestriccionModal,
} from "@/components";
import {
  labelMapTransacciones,
  columnKeysTransacciones,
  transaccionesFormEditFields,
  keysInfoModalTransacciones,
  formatColones,
  compararObjetos,
} from "@/utils";
import { errorHelpers, notificationHelpers, procesarRespuesta } from "@/utils";
import { STATUS_TBL } from "@/constants";
import { transaccionesService } from "@/services/transacciones.service";
import { useApp } from "@/hooks/useApp";
import { AutoAccountTransactionInfoField } from "./AutoAccountTransactionInfoField";
import { valida_DTO_Transacciones } from "@/validators/valida_DTO_Transacciones";

export const Transacciones = () => {
  const tableRef = useRef<GenericDataTableHandle<DTO_Transacciones>>(null);
  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  let validacion: Array<DTO_Param>;
  const eliminarError = (campo: string) => {
    setErroresValidacion(prev => prev.filter(e => e.nombre !== campo));
  };
  // #endregion

  //🔄 Estado general
  const { state } = useApp();

  useEffect(() => {
    if (state.negocio) {
      setSelectedBusiness(state.negocio);
      handleSelectBusiness(state.negocio);
    }
  }, [state]);

  //#endregion

  //#region 🔄 Estado y carga
  const [selectedBusiness, setSelectedBusiness] = useState<DTO_Negocio | null>(
    null
  );
  const [transacciones, setTransacciones] = useState<DTO_Transacciones[]>([]);
  const [loading, setLoading] = useState(false);
  const [disableButtonAdd, setDisableButtonAdd] = useState(true);
  //#endregion

  //#region ℹ️ info Modal estados;
  const [rowTableSelected, setRowTableSelected] = useState<DTO_Transacciones>();

  //#endregion

  //#region ➕ Registro
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [formData, setFormData] = useState<DTO_Transacciones>(
    new DTO_Transacciones()
  );
  //#endregion

  //#region ✏️ Edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<DTO_Transacciones | null>(null);
  const [rowEditSelected, setRowEditSelected] =
    useState<DTO_Transacciones | null>(null);
  //#endregion

  //#region 🗑 Confirmación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmContext, setConfirmContext] = useState<
    "cancelAdd" | "delete" | null
  >(null);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [transToDelete, setTransToDelete] = useState<DTO_Transacciones | null>(
    null
  );
  //#endregion

  //#region ⚠️ Modal restricción
  const [isModalRestriccionOpen, setIsModalRestriccionOpen] = useState(false);
  //#endregion

  //#region 📦 Efecto principal
  useEffect(() => {
    if (selectedBusiness) refetchTransacciones();
  }, [selectedBusiness]);

  const handleSelectBusiness = (negocio: DTO_Negocio) => {
    setSelectedBusiness(negocio);
    setDisableButtonAdd(false);
  };

  const refetchTransacciones = () => {
    if (!selectedBusiness) return;
    setLoading(true);
    transaccionesService.obtenerTransaccion(selectedBusiness).subscribe({
      next: (result) => {
        const lista = procesarRespuesta(
          result as DTO_Respuesta
        ) as DTO_Transacciones[];
        setTransacciones(
          lista.filter(
            (t) => t.estado?.iD_Estado !== STATUS_TBL.TRANSACTION.DELETED
          )
        );
      },
      error: errorHelpers.serverError,
      complete: () => setLoading(false),
    });
  };
  //#endregion

  //#region ✅ Crear
  const handleAddNew = () => {
    setFormData(new DTO_Transacciones());
    setIsModalFormOpen(true);
  };

  const handleSave = () => {
    formData.iD_Negocio = selectedBusiness?.iD_Negocio || 0;

    validacion = valida_DTO_Transacciones.validar(formData, "C");
    setErroresValidacion(validacion)
    if (validacion.length === 0) {

      transaccionesService.registrarTransaccion(formData).subscribe({
        next: (result) => {
          const nueva = (result.resultado as DTO_Transacciones[])[0];
          // ✅ Filtramos si no es eliminado antes de agregar
          if (nueva.estado?.iD_Estado !== STATUS_TBL.TRANSACTION.DELETED) {
            setTransacciones((prev) => [nueva, ...prev]);
            tableRef.current?.upsert(nueva);
          }
          notificationHelpers.successAlert(result.mensaje);
          setIsModalFormOpen(false);
        },
        error: errorHelpers.serverError,
      });
    } else {
      notificationHelpers.warningAlert("Por favor valida los datos ingresados nuevamente");
    }
  };

  const handleCancelAdd = () => {
    setConfirmModalMessage("¿Deseas cancelar el registro de la transacción?");
    setConfirmContext("cancelAdd");
    if(!compararObjetos(formData as DTO_Transacciones, new DTO_Transacciones, ["fechaTransaccion"]))
      setIsConfirmOpen(true);
    else
      setIsModalFormOpen(false);
  };
  //#endregion

  //#region 🛠 Editar
  const handleEdit = (rowData: DTO_Transacciones) => {
    setRowEditSelected(rowData);
    setEditData({ ...rowData });
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedData: DTO_Transacciones) => {
    if (!rowEditSelected) return;
    updatedData.iD_Transaccion = rowEditSelected.iD_Transaccion;
    updatedData.iD_Negocio = selectedBusiness?.iD_Negocio || 0;

    if (!updatedData.estado?.iD_Estado && rowEditSelected.estado?.iD_Estado) {
      updatedData.estado = { ...rowEditSelected.estado };
    }
    validacion = valida_DTO_Transacciones.validar(updatedData, "U");
    setErroresValidacion(validacion)
    if (validacion.length === 0) {
      transaccionesService.actualizarTransaccion(updatedData).subscribe({
        next: () => {
          // ✅ Si sigue activo, actualizar; si fue eliminado, eliminar de lista
          setTransacciones((prev) =>
            updatedData.estado?.iD_Estado !== STATUS_TBL.TRANSACTION.DELETED
              ? prev.map((t) =>
                t.iD_Transaccion === updatedData.iD_Transaccion
                  ? updatedData
                  : t
              )
              : prev.filter(
                (t) => t.iD_Transaccion !== updatedData.iD_Transaccion
              )
          );
          tableRef.current?.upsert(updatedData);
          notificationHelpers.successAlert(
            "Transacción actualizada correctamente"
          );
          setShowEditModal(false);
        },
        error: errorHelpers.serverError,
      });
    } else {
      notificationHelpers.warningAlert("Por favor valida los datos ingresados nuevamente");
    }

  };
  //#endregion

  //#region 🗑 Eliminar lógica
  const handleDelete = (rowData: DTO_Transacciones) => {
    setTransToDelete(rowData);
    setConfirmModalMessage("¿Deseas eliminar esta transacción?");
    setConfirmContext("delete");
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = (action: boolean | null) => {
    if (action && transToDelete) {
      const updated: DTO_Transacciones = {
        ...transToDelete,
        estado: {
          ...transToDelete.estado,
          iD_Estado: STATUS_TBL.TRANSACTION.DELETED,
        },
        iD_Negocio: selectedBusiness?.iD_Negocio || 0,
      };
      setTransacciones((prev) =>
        prev.filter((t) => t.iD_Transaccion !== updated.iD_Transaccion)
      );
      transaccionesService.actualizarTransaccion(updated).subscribe({
        next: () => {
          notificationHelpers.infoAlert("Transacción eliminada")
        tableRef.current?.removeById(updated.iD_Transaccion);
        },
        error: errorHelpers.serverError,
      });
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
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
    setErroresValidacion([])
  };
  //#endregion

  //#region 🧾 Campos edición (cuenta bloqueada)

  const editFormFields: FieldConfig<DTO_Transacciones>[] =
    transaccionesFormEditFields.map((field) => {
      const esCuenta = editData?.tipoNumReferencia?.trim().toLowerCase() === "cuenta";
      if (
        esCuenta &&
        (field.key === "tipoNumReferencia" || field.key === "numReferencia" || field.key === "tipo")
      ) {
        return {
          ...field,
          type: "custom",
          renderer: () => (
            <AutoAccountTransactionInfoField
              field={field}
              editData={editData}
            />
          ),
        };
      }
      return field;
    });
  //#endregion

  //#region 🖼️ Custom Renderers
  const customRenderers = {
    monto: (val: unknown) => formatColones(Number(val) || 0),
    fechaTransaccion: (val: unknown) =>
      val ? new Date(String(val)).toLocaleDateString() : "",
  };
  //#endregion

  //#region 🔑 Claves de información para el modal
  const infoModalFields: FieldConfig<DTO_Transacciones>[] = [
    ...keysInfoModalTransacciones,
    {
      key: "monto",
      label: "Monto",
      type: "custom",
      order: 9,
      renderer: ({ value }) => (
        <div className="border border-gray-200 px-4 py-3 d-flex align-items-center justify-content-between">
          <i className="bi bi-cash-coin fs-4 text-gray-600 me-3"></i>
          <span className="fw-semibold fs-5 text-gray-800"></span>
          {formatColones(Number(value) || 0)}
        </div>
      ),
    },
  ];

  //#endregion

  //#region 🎨 Render
  return (
    <div className="row p-4 col-12 gx-0">
      {state.negocio == null}
      {loading ? (
        <LoadingPanel msj="Cargando transacciones..." />
      ) : selectedBusiness ? (
        <GenericDataTable<DTO_Transacciones>
          ref={tableRef}
          title="Transacciones"
          columnKeys={columnKeysTransacciones}
          labelMap={labelMapTransacciones}
          data={transacciones.filter(
            (t) => t.estado?.iD_Estado !== STATUS_TBL.TRANSACTION.DELETED
          )}
          independent              
          idField="iD_Transaccion" 
          onAdd={handleAddNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          disableButtonAdd={disableButtonAdd}
          onRowClick={(row) => setRowTableSelected(row)}
          includeEstadoColumn={false}
          customRenderers={customRenderers}
          nowrapColumns={['Monto', 'ID']}

        />
      ) : (
        <InfoPanel msj="Selecciona un negocio para ver sus transacciones." />
      )}

      <InfoModal
        show={!!rowTableSelected}
        onHide={() => setRowTableSelected(undefined)}
        data={rowTableSelected!}
        fields={infoModalFields}
      />

      <GenericFormModal<DTO_Transacciones>
        title="Registrar Transacción"
        show={isModalFormOpen}
        onHide={handleCancelAdd}
        data={formData}
        setData={setFormData}
        onSubmit={handleSave}
        fields={transaccionesFormEditFields}
        erroresValidacion={erroresValidacion}
        onEliminarError={eliminarError}
      />

      <GenericFormModal<DTO_Transacciones>
        title="Editar Transacción"
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
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

      <RestriccionModal
        modalTitle="Acción no permitida"
        modalTexto="No tienes permisos para modificar esta transacción porque fue creada automáticamente desde el módulo de cuentas. Si deseas cambiar algo, primero debes eliminarla y luego crear una nueva transacción con los cambios deseados."
        show={isModalRestriccionOpen}
        onClose={() => setIsModalRestriccionOpen(false)}
      />
    </div>
  );
  //#endregion
};
