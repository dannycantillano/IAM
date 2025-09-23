import {
  ConfirmModal,
  GenericDataTable,
  GenericDataTableHandle,
  GenericFormModal,
  InfoModal,
  InfoPanel,
  LoadingPanel,
  Toolbar,
} from "@/components";
import { STATUS_TBL } from "@/constants";
import { useApp } from "@/hooks/useApp";
import { DTO_Param, DTO_Respuesta, DTO_Tarifa } from "@/models";
import { tarifasService } from "@/services/tarifas.service";
import { FieldConfig } from "@/types/types";
import {
  columnKeysTarifa,
  errorHelpers,
  formatColones,
  keysInfoModalTarifa,
  labelMapTarifa,
  notificationHelpers,
  procesarRespuesta,
  tarifaFormAddFields,
  tarifaFormEditFields,
} from "@/utils";
import { valida_DTO_Tarifas } from "@/validators/valida_DTO_Tarifas";
import { useEffect, useRef, useState } from "react";
import { catchError, finalize, map, of } from "rxjs";

export const Tarifario = () => {
  // Estado del negocio disponible
  const { state } = useApp();
  const tableRef = useRef<GenericDataTableHandle<DTO_Tarifa>>(null);

  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  let validacion: Array<DTO_Param>;
  const eliminarError = (campo: string) => {
    setErroresValidacion((prev) => prev.filter((e) => e.nombre !== campo));
  };
  // #endregion

  //#region 🔄 Estado general
  const [loading, setLoading] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [tarifas, setTarifas] = useState<DTO_Tarifa[]>([]);

  //#endregion

  //#region ℹ️ info Modal states;
  const [rowTableSelected, setRowTableSelected] = useState<DTO_Tarifa>();
  //#endregion

  //#region ➕ Registrar: state
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false);
  const [registerFormData, setRegisterFormData] = useState<DTO_Tarifa>(
    new DTO_Tarifa()
  );
  //#endregion

  //#region ✏️ Editar: state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState<DTO_Tarifa>(new DTO_Tarifa());
  //#endregion

  //#region States para el modal de confirmación de eliminación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState<string>("");
  const [tarifaToDelete, setTarifaToDelete] = useState<DTO_Tarifa | null>(null);
  const [confirmContext, setConfirmContext] = useState<string | null>(null);
  //#endregion

  //#region 🚀 Carga inicial
  useEffect(() => {
    setLoading(true);

    if (state.negocio && state.negocio.iD_Negocio) {
      const sub = tarifasService
        .obtenerTarifas(state.negocio)
        .pipe(
          // transforma la respuesta
          map(
            (result) =>
              procesarRespuesta(result as DTO_Respuesta) as DTO_Tarifa[]
          ),

          // maneja error y evita romper la suscripción
          catchError((err) => {
            errorHelpers.serverError(err);
            return of([] as DTO_Tarifa[]);
          }),
          // SIEMPRE apaga el loading: éxito, error o cancelación
          finalize(() => setLoading(false))
        )
        .subscribe(setTarifas);

      //limpia la subscripción al desmontar
      return () => sub.unsubscribe();
    } else {
      setLoading(false);
    }
  }, [state.negocio]);
  //#endregion

  //#region 🧠 logica y manejo de CRUD

  //#region 🧩 Registrar
  const handleAddNew = () => {
    setRegisterFormData(new DTO_Tarifa());
    setIsRegisterFormOpen(true);
  };

  const handleSave = () => {
    if (typeof state.negocio?.iD_Negocio !== "number") {
      notificationHelpers.warningAlert(
        "No se puede registrar la tarifa: Negocio no válido."
      );
      return;
    }
    setLoadingForms(true);
    const dataToRegister = {
      ...registerFormData,
      iD_Negocio: state.negocio.iD_Negocio,
      estado: {
        iD_Estado: STATUS_TBL.TARIFF.ACTIVE,
        nombre: "Activo",
        tabla: "",
      },
    };

    validacion = valida_DTO_Tarifas.validar(dataToRegister, "C");
    setErroresValidacion(validacion);
    if (validacion.length === 0) {
      tarifasService.registrarTarifas(dataToRegister).subscribe({
        next: (res) => {
          const nuevo = (
            Array.isArray(res.resultado) ? res.resultado[0] : res.resultado
          ) as DTO_Tarifa;
          setTarifas((prev) => [...prev, nuevo]);
          tableRef.current?.upsert(nuevo);
          notificationHelpers.successAlert(
            res.mensaje || "Tarifa registrada correctamente"
          );
          setIsRegisterFormOpen(false);
        },
        error: errorHelpers.serverError,
        complete: () => setLoadingForms(false),
      });
    } else {
      setLoadingForms(false);
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }
  };

  const handleCancelAdd = () => {
    setConfirmModalMessage("¿Estás seguro de que deseas cancelar el registro?");
    setConfirmContext("cancelAdd");
    setIsConfirmOpen(true);
  };

  //#endregion

  //#region ✏️ Guardar Edición
  const handleEdit = (tarifa: DTO_Tarifa) => {
    setEditData(tarifa);
    setShowEditForm(true);
  };

  const handleSaveEdit = () => {
    setLoadingForms(true);
    const updated = { ...editData };
    // Validar datos antes de guardar
    validacion = valida_DTO_Tarifas.validar(updated, "U");
    setErroresValidacion(validacion);

    if (validacion.length === 0) {
      tarifasService.actualizarTarifas(updated).subscribe({
        next: (res) => {
          setTarifas((prev) => updateItemById(prev, updated, "iD_Tarifa"));
          tableRef.current?.upsert(updated);
          notificationHelpers.infoAlert(res.mensaje);
          setShowEditForm(false);
        },
        error: errorHelpers.serverError,
        complete: () => setLoadingForms(false),
      });
    } else {
      setLoadingForms(false);
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }
  };
  //#endregion

  //#region Función para actualizar un elemento por ID en el array
  const updateItemById = <T,>(arr: T[], updatedItem: T, idKey: keyof T): T[] =>
    arr.map((item) =>
      item[idKey] === updatedItem[idKey] ? updatedItem : item
    );
  //#endregion

  //#region 🗑 Confirmar Eliminación
  const handleDelete = (tarifa: DTO_Tarifa) => {
    setConfirmModalMessage(
      `¿Estás seguro de que deseas eliminar la tarifa ${tarifa.nombreTarifa}?`
    );
    setTarifaToDelete(tarifa);
    setConfirmContext("delete");
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = (action: boolean | null) => {
    if (!action || !tarifaToDelete) {
      setTarifaToDelete(null);
      setIsConfirmOpen(false);
      setConfirmContext(null);
      return;
    }
    setLoadingForms(true);
    tableRef.current?.removeById(tarifaToDelete.iD_Tarifa);

    const updated: DTO_Tarifa = {
      ...tarifaToDelete,
      estado: {
        ...tarifaToDelete.estado!,
        iD_Estado: STATUS_TBL.TARIFF.DELETED,
        nombre: "Eliminado",
      },
    };
    tarifasService.actualizarTarifas(updated).subscribe({
      next: (res: DTO_Respuesta) => {
        if (res?.codigo === "B037") {
          notificationHelpers.infoAlert("Tarifa eliminada correctamente");
        } else {
          setLoadingForms(false);
          notificationHelpers.warningAlert(
            res?.mensaje || "No se pudo eliminar"
          );
        }
      },
      error: (err) => {
        setLoadingForms(false);
        errorHelpers.serverError(err);
      },
      complete: () => setLoadingForms(false),
    });

    setTarifaToDelete(null);
    setIsConfirmOpen(false);
    setConfirmContext(null);
  };
  //#endregion

  //#region 🎛️ Cancelar confirmaciones
  const confirmModalAction = (action: boolean | null) => {
    if (action) {
      if (confirmContext === "cancelAdd") {
        setIsRegisterFormOpen(false);
        notificationHelpers.infoAlert("Registro cancelado");
      } else if (confirmContext === "delete") {
        handleConfirmDelete(true);
      }
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
    setErroresValidacion([]);
  };
  //#endregion

  //#endregion

  //#region 🔧 Renderizadores y configuración de campos personalizados
  const customRenderers = {
    precioTarifa: (val: unknown) =>
      new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        minimumFractionDigits: 2,
      }).format(Number(val) || 0),
    fechaCreacion: (val: unknown) =>
      val ? new Date(String(val)).toLocaleDateString() : "",
  };
  //#endregion

  //#region 🔑 Claves de información para el modal
  const infoModalFields: FieldConfig<DTO_Tarifa>[] = [
    ...keysInfoModalTarifa,
    {
      key: "precioTarifa",
      label: "Precio",
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

  return (
    <>
      <Toolbar titulo="Tarifario" addButton onAdd={handleAddNew} />
      <div className="row p-4 gx-0">
        {state.negocio == null ? (
          <InfoPanel msj="Seleccione un negocio para ver sus tarifas." />
        ) : (
          <>
            {loading ? (
              <LoadingPanel msj="Cargando Tarifario, por favor espere..." />
            ) : (
              <GenericDataTable<DTO_Tarifa>
                ref={tableRef}
                title="Tarifario"
                columnKeys={columnKeysTarifa}
                labelMap={labelMapTarifa}
                data={tarifas}
                independent
                idField="iD_Tarifa"
                onAdd={handleAddNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRowClick={setRowTableSelected}
                includeEstadoColumn={false}
                customRenderers={customRenderers}
                nowrapColumns={["precioTarifa"]}
              />
            )}

            <InfoModal
              show={!!rowTableSelected}
              onHide={() => setRowTableSelected(undefined)}
              data={rowTableSelected!}
              fields={infoModalFields}
            />

          <GenericFormModal
            title="Registrar Tarifa"
            show={isRegisterFormOpen}
            onHide={handleCancelAdd}
            loading={loadingForms}
            data={registerFormData}
            setData={setRegisterFormData}
            onSubmit={handleSave}
            fields={tarifaFormAddFields}
            erroresValidacion={erroresValidacion}
            onEliminarError={eliminarError}
          />
          <GenericFormModal
            title="Editar Tarifa"
            show={showEditForm}
            onHide={() => setShowEditForm(false)}
            loading={loadingForms}
            data={editData}
            setData={setEditData}
            onSubmit={handleSaveEdit}
            fields={tarifaFormEditFields}
            erroresValidacion={erroresValidacion}
            onEliminarError={eliminarError}
          />
          <ConfirmModal
            show={isConfirmOpen}
            confirmMessage={confirmModalMessage}
            onAction={confirmModalAction}
          />
        </>
      )}
    </div>
    </>
  );
};
