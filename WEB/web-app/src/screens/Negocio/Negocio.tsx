// ✅ RP-14: Pantalla Negocio adaptada a estructura definitiva (estado local, sin refetch, confirmación, referencias y filtros)

import {
  ConfirmModal,
  FieldConfig,
  GenericDataTable,
  GenericFormModal,
  InfoModal,
  ReferenciaCards,
  ReferenciasJsonInput,
} from "@/components";
import ReactDOM from "react-dom/client";
import { FILTER_STATUS, STATUS_TBL } from "@/constants";
import { AuthContext } from "@/context";
import { useApp } from "@/hooks/useApp";
import { DTO_Negocio, DTO_Respuesta, DTO_FiltroEstado, DTO_Param } from "@/models";
import { negocioService } from "@/services";
import {
  keysInfoModalNegocio,
  columnKeysNegocio,
  errorHelpers,
  labelMapNegocio,
  negocioFormEditFields,
  notificationHelpers,
  procesarRespuesta,
  updateItemById,
  parametrosAString,
} from "@/utils";
import { useContext, useEffect, useState } from "react";
import { valida_DTO_Negocio } from "@/validators/valida_DTO_Negocio";

export const Negocio = () => {

  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  let validacion: Array<DTO_Param>;
  const eliminarError = (campo: string) => {
    setErroresValidacion(prev => prev.filter(e => e.nombre !== campo));
  };
  // #endregion

  //#region 🔄 Estado y contexto
  const { state, setListaNegocios, setNegocio } = useApp();
  const { user } = useContext(AuthContext);
  const [business, setBusiness] = useState<DTO_Negocio[]>([]);
  const [disableButtonAdd] = useState<boolean>(false);
  const [filtroEstado] = useState<DTO_FiltroEstado>({
    filtroEstado: FILTER_STATUS.ACTIVO,
  });
  //#endregion

  //#region ℹ️ info Modal estados;
  const [rowTableSelected, setRowTableSelected] = useState<DTO_Negocio>();

  //#endregion

  //#region ➕ Registro
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [formData, setFormData] = useState<DTO_Negocio>(new DTO_Negocio());
  //#endregion

  //#region ✏️ Edición
  const [showModalUpdateBusiness, setShowModalUpdateBusiness] = useState(false);
  const [editData, setEditData] = useState<DTO_Negocio | null>(null);
  const [rowBusinessSelected, setRowBusinessSelected] =
    useState<DTO_Negocio | null>(null);
  //#endregion

  //#region 🗑 Eliminación lógica
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmContext, setConfirmContext] = useState<
    "cancelAdd" | "delete" | null
  >(null);
  const [businessToDelete, setBusinessToDelete] = useState<DTO_Negocio | null>(
    null
  );
  //#endregion

  //#region 🚀 Obtener negocios al iniciar
  useEffect(() => {
    negocioService.obtenerNegocios(filtroEstado).subscribe({
      next: (result) => {
        const negocios = procesarRespuesta(
          result as DTO_Respuesta
        ) as DTO_Negocio[];
        setBusiness(negocios);
      },
      error: errorHelpers.serverError,
    });
  }, [filtroEstado]);
  //#endregion

  //#region ✅ Registrar negocio
  const handleAddNewBusiness = () => {
    setFormData(new DTO_Negocio());
    setIsModalFormOpen(true);
  };

  const handleSave = () => {
    formData.iD_Usuario = user?.iD_Usuario || 0;
    formData.estado = {
      iD_Estado: STATUS_TBL.BUSINESS.ACTIVE,
      nombre: "activo",
      tabla: "",
    };

    validacion = valida_DTO_Negocio.validar(formData, "C");
    setErroresValidacion(validacion)
    if (validacion.length === 0) {

      negocioService.registrarNegocio(formData).subscribe({
        next: (result: DTO_Respuesta) => {
          const nuevo = (result.resultado as DTO_Negocio[])[0];
          if (result.codigo === "B002") {
            notificationHelpers.infoAlert(result.mensaje);
            setIsModalFormOpen(false);

            return;
          }
          if (nuevo) setBusiness((prev) => [...prev, nuevo]);
          {
            notificationHelpers.successAlert(result.mensaje);
            setListaNegocios([...state.listaNegocios, nuevo]);
            //Seleccionarlo por defecto globalmente
          }
          setNegocio(nuevo);

          setIsModalFormOpen(false);
        },
        error: errorHelpers.serverError,
      });

    } else {
      notificationHelpers.warningAlert("Por favor valida los datos ingresados nuevamente");
    }

  };
  //#endregion

  //#region ✏️ Guardar edición
  const handleEdit = (rowData: DTO_Negocio) => {
    setRowBusinessSelected(rowData);
    setEditData({ ...rowData });
    setShowModalUpdateBusiness(true);
  };

  const handleSaveBusiness = (updatedData: DTO_Negocio) => {
    if (!rowBusinessSelected) return;
    updatedData.iD_Negocio = rowBusinessSelected.iD_Negocio;
    updatedData.iD_Usuario = user?.iD_Usuario || 0;

    if (!updatedData.estado && rowBusinessSelected.estado) {
      updatedData.estado = { ...rowBusinessSelected.estado };
    }

    validacion = valida_DTO_Negocio.validar(updatedData, "U");
    setErroresValidacion(validacion)
    if (validacion.length === 0) {

      negocioService.actualizarNegocio(updatedData).subscribe({
        next: (result: DTO_Respuesta) => {
          setBusiness((prev) => updateItemById(prev, updatedData, "iD_Negocio"));
          notificationHelpers.successAlert(result.mensaje);
          setShowModalUpdateBusiness(false);
          //Actualizamos la lista de negocios con los nuevos datos
          setListaNegocios(state.listaNegocios.map((n: DTO_Negocio) => n.iD_Negocio === updatedData.iD_Negocio ? updatedData : n));
          if(state.negocio?.iD_Negocio === updatedData.iD_Negocio){
            setNegocio(updatedData);
          }
        },

        error: errorHelpers.serverError,
      });
    } else {
      notificationHelpers.warningAlert("Por favor valida los datos ingresados nuevamente");
    }
  };
  //#endregion

  //#region 🗑 Confirmar eliminación
  const handleDelete = (rowData: DTO_Negocio) => {
    setConfirmModalMessage(
      `¿Estás seguro de que deseas eliminar el negocio ${rowData.nombreNegocio}?`
    );
    setBusinessToDelete(rowData);
    setConfirmContext("delete");
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = (action: boolean | null) => {
    if (action && businessToDelete) {
      const updatedData: DTO_Negocio = {
        ...businessToDelete,
        estado: {
          ...businessToDelete.estado!,
          iD_Estado: STATUS_TBL.BUSINESS.DELETED,
          nombre: "eliminado",
        },
      };
      setBusiness((prev) => updateItemById(prev, updatedData, "iD_Negocio"));

      negocioService.actualizarNegocio(updatedData).subscribe({
        next: (result) => {
          if (result.codigo === "B003") {
            notificationHelpers.infoAlert("Negocio Eliminado correctamente");
          }

          if (result.tipoRespuesta && businessToDelete) {
            const nuevaLista = state.listaNegocios.filter(
              (n) => n.iD_Negocio !== businessToDelete.iD_Negocio
            );
            setListaNegocios(nuevaLista);

            if (state.negocio?.iD_Negocio === businessToDelete.iD_Negocio) {
              setNegocio(
                state.listaNegocios.length > 1
                  ? state.listaNegocios.find(
                    (n) => n.iD_Negocio !== businessToDelete.iD_Negocio
                  ) ?? null
                  : null
              );
            }
          }
        },
        error: errorHelpers.serverError,
      });
    }
    setBusinessToDelete(null);
    setIsConfirmOpen(false);
    setConfirmContext(null);
  };
  //#endregion

  //#region ❌ Cancelar
  const handleCancel = () => {
    setConfirmModalMessage("¿Estás seguro de que deseas cancelar?");
    setConfirmContext("cancelAdd");
    setIsConfirmOpen(true);
  };

  const confirmModalAcion = (action: boolean | null) => {
    if (action) {
      if (confirmContext === "cancelAdd") {
        setIsModalFormOpen(false);
        notificationHelpers.infoAlert("Cambios descartados correctamente");
      } else if (confirmContext === "delete") {
        handleConfirmDelete(true);
      }
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
    setErroresValidacion([])
  };
  //#endregion

  //#region 🧾 Campos formularios
  const newFormFields: FieldConfig<DTO_Negocio>[] = [
    ...negocioFormEditFields,
    {
      key: "referenciaJSON",
      label: "Configuración de Ordenes de Servicio",
      type: "custom",
      renderer: () => (
        <>
         <p className=".text-gray-700">Cada referencia configurada se solicitará al momento de crear una orden de servicio para este negocio</p>
        <ReferenciasJsonInput
          value={formData.referenciaJSON}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, referenciaJSON: val }))
          }
        />
        </>
      ),
      validate: (val) => {
        if (!Array.isArray(val) || val.length === 0) return "";
        for (const ref of val) {
          if (!ref.nombre) return "Todos los campos deben estar completos.";
        }
        return "";
      },
    },
  ];

  const editFormFields: FieldConfig<DTO_Negocio>[] = [
    ...negocioFormEditFields,
    {
      key: "referenciaJSON",
      label: "Configuración de Ordenes de Servicio",
      type: "custom",
      renderer: () => (
        <>
        <p className=".text-gray-700">Cada referencia configurada se solicitará al momento de crear una orden de servicio para este negocio</p>
        <ReferenciasJsonInput
          hideCheckbox={true}
          editable={false}
          value={editData?.referenciaJSON || []}
          onChange={(val) =>
            setEditData((prev) =>
              prev ? { ...prev, referenciaJSON: val } : null
            )
          }
        />
        </>
      ),
      validate: (val) => {
        if (!Array.isArray(val) || val.length === 0) return "";
        for (const ref of val) {
          if (!ref.nombre) return "Todos los campos deben estar completos.";
        }
        return "";
      },
    },
  ];
  //#endregion

  //#region 🏷️ Columna Referencias para DataTable
  const referenciaJSONColumn = {
    title: labelMapNegocio["referenciaJSON"],
    data: null,
    orderable: true,
    searchable: true,
    defaultContent: "",
    render: function (_data: unknown, type: string, row: DTO_Negocio) {
      const esExport =
        type === "export" || type === "filter" || type === "sort";

      if (esExport && Array.isArray(row.referenciaJSON)) {
        return parametrosAString(row.referenciaJSON);
      }

      return "";
    },
    createdCell: (cell: Node, _data: unknown, row: DTO_Negocio) => {
      try {
        const container = document.createElement("div");
        const htmlCell = cell as HTMLElement;
        htmlCell.innerHTML = "";
        container.classList.add("w-100");
        ReactDOM.createRoot(container).render(
          <ReferenciaCards items={row.referenciaJSON || []} />
        );
        htmlCell.appendChild(container);
      } catch (err) {
        console.warn("Error ref JSON", err);
      }
    },
  };

  //#endregion

  //#region 🔑 Claves de información para el modal
  const infoModalFields: FieldConfig<DTO_Negocio>[] = [
    ...keysInfoModalNegocio,
    {
      key: "referenciaJSON",
      label: "Referencias",
      type: "custom",
      order: 9,
      renderer: ({ value }) => <ReferenciaCards items={value ?? []} />,
    },
  ];

  //#endregion

  //#region 🎨 Render
  return (
    <div className="row p-4 col-12 gx-0">
      <GenericDataTable<DTO_Negocio>
        title="Negocios"
        columnKeys={columnKeysNegocio}
        labelMap={labelMapNegocio}
        data={business.filter(
          (b) => b.estado?.iD_Estado !== STATUS_TBL.BUSINESS.DELETED
        )}
        onAdd={handleAddNewBusiness}
        onEdit={handleEdit}
        onDelete={handleDelete}
        disableButtonAdd={disableButtonAdd}
        includeEstadoColumn
        customRenderers={{
          fechaRegistro: (val: unknown) =>
            val ? new Date(String(val)).toLocaleDateString() : "",
        }}
        customColumns={[referenciaJSONColumn]}
        onRowClick={(rowData) => {
          setRowTableSelected(rowData);
        }}
      />

      <InfoModal
        show={!!rowTableSelected}
        onHide={() => setRowTableSelected(undefined)}
        data={rowTableSelected!}
        fields={infoModalFields}
      />

      <GenericFormModal
        title="Registrar Negocio"
        show={isModalFormOpen}
        onHide={handleCancel}
        data={formData}
        setData={setFormData}
        onSubmit={handleSave}
        fields={newFormFields}
        erroresValidacion={erroresValidacion}
        onEliminarError={eliminarError}
      />

      <GenericFormModal
        title="Editar datos del Negocio"
        show={showModalUpdateBusiness}
        onHide={() => setShowModalUpdateBusiness(false)}
        data={editData!}
        setData={(x) => setEditData(x as DTO_Negocio)}
        onSubmit={() => editData && handleSaveBusiness(editData)}
        fields={editFormFields}
        erroresValidacion={erroresValidacion}
        onEliminarError={eliminarError}
      />

      <ConfirmModal
        show={isConfirmOpen}
        confirmMessage={confirmModalMessage}
        onAction={confirmModalAcion}
      />
    </div>
  );
  //#endregion
};
