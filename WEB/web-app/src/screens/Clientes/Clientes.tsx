import { useEffect, useState } from "react";
import {
  ConfirmModal,
  GenericDataTable,
  GenericFormModal,
  InfoModal,
  LoadingPanel,
} from "@/components";
import { DTO_Cliente, DTO_Param, DTO_Respuesta } from "@/models";
import { clientesService } from "@/services";
import {
  clienteFormEditFields,
  columnKeysCliente,
  errorHelpers,
  keysInfoModalCliente,
  labelMapCliente,
  notificationHelpers,
  procesarRespuesta,
  updateItemById,
} from "@/utils";
import { STATUS_TBL } from "@/constants";
import { valida_DTO_Cliente } from "@/validators/valida_DTO_Cliente";
import { catchError, finalize, map, of } from "rxjs";

export const Clientes = () => {
  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  let validacion: Array<DTO_Param>;
  const eliminarError = (campo: string) => {
    setErroresValidacion(prev => prev.filter(e => e.nombre !== campo));
  };
  // #endregion


  //#region 🔄 Estado general
  const [clientes, setClientes] = useState<DTO_Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  //#endregion

  //#region ℹ️ info Modal estados;
  const [rowTableSelected, setRowTableSelected] = useState<DTO_Cliente>();

  //#endregio

  //#region ➕ Registrar
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<DTO_Cliente>(new DTO_Cliente());
  //#endregion

  //#region ✏️ Editar
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState<DTO_Cliente>(new DTO_Cliente());
  //#endregion

  //#region 🗑 Eliminar
  const [clienteToDelete, setClienteToDelete] = useState<DTO_Cliente | null>(
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

  //#region 🚀 Carga inicial
useEffect(() => {
  setLoading(true);

  const sub = clientesService
    .obtenerClientes()
    .pipe(
      // transforma la respuesta
      map(result => procesarRespuesta(result as DTO_Respuesta) as DTO_Cliente[]),

      // maneja error y evita romper la suscripción
      catchError(err => {
        errorHelpers.serverError(err);
        return of([] as DTO_Cliente[]);
      }),

      // SIEMPRE apaga el loading: éxito, error o cancelación
      finalize(() => setLoading(false))
    )
    .subscribe(setClientes);

  // evita fugas al desmontar
  return () => sub.unsubscribe();
}, []);

  //#endregion

  //#region 🔔 Notificación
  const handleNotification = (
    result: any,
    type: "succes" | "info" | "warning"
  ) => {
    if (result.resultado) {
      const msg = result.mensaje || "Operación realizada correctamente";
      if (type === "succes") notificationHelpers.successAlert(msg);
      else if (type === "info"){
        if(confirmContext == 'delete')
        notificationHelpers.infoAlert(msg.replace("actualizados", "eliminados"));
      else
        notificationHelpers.infoAlert(msg);
      } 
      else notificationHelpers.warningAlert(msg);
    } else {
      notificationHelpers.errorAlert(
        result.mensaje || "Error al procesar la solicitud"
      );
    }
  };
  //#endregion

  //#region 🧩 Registrar
  const handleAddNew = () => {
    setFormData(new DTO_Cliente());
    setIsFormOpen(true);
  };

  const handleSave = () => {
    formData.estado = {
      iD_Estado: STATUS_TBL.CLIENT.ACTIVE,
      nombre: "activo",
      tabla: "",
    };

    validacion = valida_DTO_Cliente.validar(formData, "C");
    setErroresValidacion(validacion)
    if (validacion.length === 0) {

      clientesService.registrarClientes(formData).subscribe({
        next: (res) => {
          const nuevo = (
            Array.isArray(res.resultado) ? res.resultado[0] : res.resultado
          ) as DTO_Cliente;
          setClientes((prev) => [...prev, nuevo]);
          handleNotification(res, "succes");
          setIsFormOpen(false);
        },
        error: errorHelpers.serverError,
      });
    } else {
      notificationHelpers.warningAlert("Por favor valida los datos ingresados nuevamente");
    }

  };

  const handleCancelAdd = () => {
    setConfirmModalMessage("¿Estás seguro de que deseas cancelar el registro?");
    setConfirmContext("cancelAdd");
    setIsConfirmOpen(true);
  };

  //#endregion

  //#region ✏️ Guardar Edición
  const handleEdit = (cliente: DTO_Cliente) => {
    setEditData({ ...cliente });
    setShowEditForm(true);
  };

  const handleSaveEdit = () => {
    const updated = { ...editData };

    validacion = valida_DTO_Cliente.validar(updated, "U");
    setErroresValidacion(validacion)
    if (validacion.length === 0) {

      clientesService.actualizarClientes(updated).subscribe({
        next: (res) => {
          setClientes((prev) => updateItemById(prev, updated, "iD_Cliente"));
          handleNotification(res, "succes");
          setShowEditForm(false);
        },
        error: errorHelpers.serverError,
      });
    } else {
      notificationHelpers.warningAlert("Por favor valida los datos ingresados nuevamente");
    }

  };
  //#endregion

  //#region 🗑 Confirmar Eliminación
  const handleDelete = (cliente: DTO_Cliente) => {
    setConfirmModalMessage(
      `¿Estás seguro de que deseas eliminar al cliente ${cliente.nombreCliente}?`
    );
    setClienteToDelete(cliente);
    setConfirmContext("delete");
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = (action: boolean | null) => {
    if (action && clienteToDelete) {
      const updated: DTO_Cliente = {
        ...clienteToDelete,
        estado: {
          ...clienteToDelete.estado!,
          iD_Estado: STATUS_TBL.CLIENT.DELETED,
        },
      };
      setClientes((prev) => updateItemById(prev, updated, "iD_Cliente"));
      clientesService.actualizarClientes(updated).subscribe({
        next: (res) => handleNotification(res, "info"),
        error: errorHelpers.serverError,
      });
    }
    setClienteToDelete(null);
    setIsConfirmOpen(false);
    setConfirmContext(null);
  };
  //#endregion

  //#region 🎛️ Cancelar confirmaciones
  const confirmModalAction = (action: boolean | null) => {
    if (action) {
      if (confirmContext === "cancelAdd") {
        setIsFormOpen(false);
        notificationHelpers.infoAlert("Registro cancelado");
      } else if (confirmContext === "delete") {
        handleConfirmDelete(true);
      }
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
    setErroresValidacion([])
  };
  //#endregion

  //#region 🔍 Filtro para mostrar solo clientes activos
  const clientesActivos = clientes.filter(
    (c) => c.estado?.iD_Estado !== STATUS_TBL.CLIENT.DELETED
  );
  //#endregion

  //#region 🎨 Render
  return (
    <div className="row p-4 gx-0">
      {loading ? (
        <LoadingPanel msj="Cargando clientes, por favor espere..." />
      ) : (
        <GenericDataTable<DTO_Cliente>
          title="Clientes"
          columnKeys={columnKeysCliente}
          labelMap={labelMapCliente}
          data={clientesActivos}
          onAdd={handleAddNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          includeEstadoColumn = {false}
          onRowClick={(row) => setRowTableSelected(row)}
        
        />
      )}

      <InfoModal
        show={!!rowTableSelected}
        onHide={() => setRowTableSelected(undefined)}
        data={rowTableSelected!}
        fields={keysInfoModalCliente}
      />

      <GenericFormModal
        title="Registrar Cliente"
        show={isFormOpen}
        onHide={handleCancelAdd}
        data={formData}
        setData={setFormData}
        onSubmit={handleSave}
        fields={clienteFormEditFields}
        erroresValidacion={erroresValidacion}
        onEliminarError={eliminarError}
      />

      <GenericFormModal
        title="Editar Cliente"
        show={showEditForm}
        onHide={() => setShowEditForm(false)}
        data={editData}
        setData={setEditData}
        onSubmit={handleSaveEdit}
        fields={clienteFormEditFields}
        erroresValidacion={erroresValidacion}
        onEliminarError={eliminarError}
      />

      <ConfirmModal
        show={isConfirmOpen}
        confirmMessage={confirmModalMessage}
        onAction={confirmModalAction}
      />
    </div>
  );
  //#endregion
};

