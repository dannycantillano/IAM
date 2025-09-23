// ✅ RP-06: ItemsOrdenDeServicioModal adaptado con manejo local sin refetch y estructura organizada

import React, { useEffect, useRef, useState } from "react";
import { LoadingPanel } from "@/components/panels/LoadingPanel";
import { CustomRange } from "@/components/ranges/CustomRange";
import {
  columnKeysItemsOrdenServicio,
  labelMapItemsOrdenServicio,
  keysInfoModalItemsOrdenServicio,
  ItemsOrdenServicioFormEditFields,
  notificationHelpers,
  errorHelpers,
  updateItemById,
  formatColones,
} from "@/utils";
import { items_proformaService, itemsOrdenesService } from "@/services";
import { STATUS_TBL } from "@/constants";
import {
  DTO_Cliente,
  DTO_ItemOrdenServicio,
  DTO_Negocio,
  DTO_Param,
  DTO_Proforma,
  DTO_ProformaItem,
  DTO_Respuesta,
} from "@/models";
import {
  AsyncProformaSelect,
  AsyncTarifaSelect,
  ConfirmModal,
  DecimalInput,
  GenericDataTable,
  GenericFormModal,
  InfoModal,
  ProformaOption,
  TarifarioOption,
} from "@/components";
import { valida_DTO_ItemOrdenServicio } from "@/validators/valida_DTO_ItemOrdenServicio";
import { useScrollLockSmart } from "@/hooks";
import { FieldConfig } from "@/types/types";

interface ItemsOrdenDeServicioModalProps {
  open: boolean;
  onHide: () => void;
  title?: string;
  rowData: Record<string, any>;
  negocio: DTO_Negocio;
}

export const ItemsOrdenDeServicioModal = ({
  open,
  onHide,
  title = "Lista de ítems",
  rowData,
  negocio,
}: ItemsOrdenDeServicioModalProps) => {
  //#region Scroll del body
  //Ajustes para el croll del body, para bloquearlo en cuando se abren los modales
  const modalRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  useScrollLockSmart(open, {
    rootRef: modalRef,
    fallbackSelector: ".app-scroll",
  });

  useEffect(() => {
    if (open) modalRef.current?.focus();
  }, [open]);
  //#endregion Scroll del body

  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  let validacion: Array<DTO_Param>;
  const eliminarError = (campo: string) => {
    setErroresValidacion((prev) => prev.filter((e) => e.nombre !== campo));
  };
  // #endregion

  //#region 🔄 Estados generales
  const [itemsOrdenes, setItemsOrdenes] = useState<DTO_ItemOrdenServicio[]>([]);
  const [itemsProformas, setItemsProformas] = useState<DTO_ItemOrdenServicio[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [tarifaSeleccionada, setTarifaSeleccionada] =
    useState<TarifarioOption | null>(null);
  const [proformaSeleccionada, setProformaSeleccionada] =
    useState<ProformaOption | null>(null);
  const [reloadKey] = useState(0);
  //#endregion

  //#region ℹ️ info Modal estados;
  const [rowTableSelected, setRowTableSelected] =
    useState<DTO_ItemOrdenServicio>();

  //#endregion

  //#region ➕ Registro
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [formData, setFormData] = useState<DTO_ItemOrdenServicio>(
    new DTO_ItemOrdenServicio()
  );
  const [buscarProforma, setBuscarProforma] = useState<DTO_Proforma>(
    new DTO_Proforma()
  );
  //#endregion

  //#region ✏️ Edición
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState<DTO_ItemOrdenServicio>(
    new DTO_ItemOrdenServicio()
  );
  //#endregion

  //#region 🗑 Eliminación
  const [itemOrderToDelete, setItemOrderToDelete] =
    useState<DTO_ItemOrdenServicio | null>(null);
  //#endregion

  //#region ✅ Confirmación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmContext, setConfirmContext] = useState<
    "cancelAdd" | "delete" | null
  >(null);
  //#endregion

  //#region 🚀 Cargar ítems al abrir
  useEffect(() => {
    if (!open || !rowData?.iD_OrdenServicio) return;
    setLoading(true);
    const request = {
      iD_OrdenServicio: rowData.iD_OrdenServicio,
    } as DTO_ItemOrdenServicio;
    itemsOrdenesService.obtenerItemsOrdensDeServicio(request).subscribe({
      next: (result: DTO_Respuesta) => {
        if (!result.tipoRespuesta) {
          notificationHelpers.errorAlert(
            result.mensaje || "Error al cargar ítems"
          );
          return;
        }
        const raw = result.resultado?.[0];
        const items = Array.isArray(raw)
          ? (raw as DTO_ItemOrdenServicio[])
          : [];
        setItemsOrdenes(items);
      },
      complete: () => setLoading(false),
      error: errorHelpers.serverError,
    });
  }, [open, rowData]);
  //#endregion

  const handleDeleteItemProforma = (id: any) => {
    setItemsProformas((prevItems) =>
      prevItems.filter((item) => item.iD_ItemOrdenServicio !== id)
    );
  };

  //#region 🧩 Agregar nuevo
  const handleAddNew = () => {
    if (rowData.estado.iD_Estado == 22) {
      notificationHelpers.infoAlert(
        "Orden archivada, no se pueden crear nuevos ítems"
      );
    } else {
      setFormData(new DTO_ItemOrdenServicio());
      setIsModalFormOpen(true);
    }
  };

  const handleSave = () => {
    formData.iD_OrdenServicio = rowData?.iD_OrdenServicio || 0;
    formData.estado = {
      iD_Estado: STATUS_TBL.ITEMS_ORDER_SERVICE.ACTIVE,
      nombre: "activo",
      tabla: "",
    };

    validacion = valida_DTO_ItemOrdenServicio.validar(formData, "C");
    setErroresValidacion(validacion);
    if (validacion.length === 0) {
      itemsOrdenesService.registrarItemsOrdensDeServicio(formData).subscribe({
        next: (result: DTO_Respuesta) => {
          const nuevo = (result.resultado as DTO_ItemOrdenServicio[])[0];
          if (nuevo) setItemsOrdenes((prev) => [...prev, nuevo]); // Agregar el nuevo ítem
          notificationHelpers.successAlert(result.mensaje);
          setIsModalFormOpen(false);
        },
        error: errorHelpers.serverError,
      });
    } else {
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }
  };

  const handleProformaOnchange = (proforma: DTO_Proforma) => {
    items_proformaService.obtenerItemsProformas(proforma).subscribe({
      next: (result: DTO_Respuesta) => {
        const itemsProformas = result.resultado[0] as DTO_ProformaItem[];

        itemsProformas.forEach((itemP) => {
          const itemO: DTO_ItemOrdenServicio = new DTO_ItemOrdenServicio();

          itemO.avance = 0;
          itemO.cantidad = itemP.cantidadItemProforma || 1;
          itemO.descripcion = itemP.descripcionItemProforma;
          itemO.iD_OrdenServicio = rowData.iD_OrdenServicio;
          itemO.iD_ItemOrdenServicio = itemP.iD_ProformaItem;
          itemO.monto = itemP.precioItemProforma || 0;
          itemO.nombreItemOrdenServicio = itemP.nombreItemProforma;
          setItemsProformas((prev) => [...prev, itemO]);
        });
      },
      error: errorHelpers.serverError,
    });
  };
  //#endregion

  //#region ✏️ Guardar edición
  const handleEdit = (row: DTO_ItemOrdenServicio) => {
    setEditData(row);
    setShowEditForm(true);
  };

  const handleSaveEdit = () => {
    if (!editData) return;
    validacion = valida_DTO_ItemOrdenServicio.validar(editData, "U");
    setErroresValidacion(validacion);
    if (validacion.length === 0) {
      itemsOrdenesService.actualizarItemsOrdensDeServicio(editData).subscribe({
        next: (result: DTO_Respuesta) => {
          setItemsOrdenes((prev) =>
            updateItemById(prev, editData, "iD_ItemOrdenServicio")
          );
          notificationHelpers.successAlert(result.mensaje);
          setShowEditForm(false);
        },
        error: errorHelpers.serverError,
      });
    } else {
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }
  };

  const handleSaveItenmsDesdeProforma = () => {
    let cont = 1;
    validacion = [];
    itemsProformas.some((item) => {
      cont++;
      validacion = valida_DTO_ItemOrdenServicio.validar(item, "C");
      if (validacion.length > 0) {
        notificationHelpers.warningAlert(
          "Revisa la el registro #" + cont + " " + validacion[0].valor
        );

        const el = rowRefs.current[cont];

        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "end" });
        }

        return true;
      }
    });

    if (validacion.length === 0) {
      itemsOrdenesService.guardarItemsDesdeProforma(itemsProformas).subscribe({
        next: (result: DTO_Respuesta) => {
          setItemsOrdenes((prev) => [...prev, ...itemsProformas]);
          //@ts-expect-error --eer
          document.querySelector('a[href="#items"]').click();
          setItemsProformas(new Array<DTO_ItemOrdenServicio>());
          notificationHelpers.successAlert(result.mensaje);
        },
        error: errorHelpers.serverError,
      });
    }
  };

  //#endregion

  //#region 🗑 Eliminar
  const handleDelete = (item: DTO_ItemOrdenServicio) => {
    setConfirmModalMessage(
      `¿Estás seguro de eliminar el ítem ${item.nombreItemOrdenServicio}?`
    );
    setItemOrderToDelete(item);
    setConfirmContext("delete");
    setIsConfirmOpen(true);
  };

  const handleChange = (index: any, field: any, value: any) => {
    setItemsProformas((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleConfirmDelete = (action: boolean | null) => {
    if (action && itemOrderToDelete) {
      const updated = {
        ...itemOrderToDelete,
        estado: {
          ...itemOrderToDelete.estado!,
          iD_Estado: STATUS_TBL.ITEMS_ORDER_SERVICE.DELETED,
        },
      };
      setItemsOrdenes((prev) =>
        updateItemById(prev, updated, "iD_ItemOrdenServicio")
      );
      itemsOrdenesService.actualizarItemsOrdensDeServicio(updated).subscribe({
        next: (result) => {
          notificationHelpers.infoAlert(
            result?.tipoRespuesta
              ? `Ítem #${updated.iD_ItemOrdenServicio} eliminado exitosamente`
              : result?.mensaje || "No se pudo eliminar el ítem"
          );
        },
        error: errorHelpers.serverError,
      });
      setItemOrderToDelete(null);
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
  };

  const getActiveItemsOrdenes = () =>
    itemsOrdenes.filter(
      (item) =>
        item.estado?.iD_Estado !== STATUS_TBL.ITEMS_ORDER_SERVICE.DELETED
    );
  //#endregion

  //#region ✅ Confirmar cancelación
  const handleCancelAdd = () => {
    setConfirmModalMessage("¿Estás seguro de cancelar el registro?");
    setConfirmContext("cancelAdd");
    setIsConfirmOpen(true);
  };

  const confirmModalAcion = (action: boolean | null) => {
    if (action) {
      if (confirmContext === "cancelAdd") {
        setIsModalFormOpen(false);
        notificationHelpers.infoAlert("Nuevo ítem descartado correctamente");
        setErroresValidacion([]);
      } else if (confirmContext === "delete") {
        handleConfirmDelete(true);
      }
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
  };
  //#endregion

  //#region 🧾 Formularios y renderizadores
  const registerFormFields: FieldConfig<any>[] = [
    ...ItemsOrdenServicioFormEditFields,
    {
      key: "avance",
      label: "Avance",
      type: "custom",
      renderer: () => (
        <CustomRange
          data={[formData.avance ?? 0]}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, avance: value }))
          }
        />
      ),
    },
    {
      key: "Tarifario",
      label: "Tarifario",
      type: "custom",
      order: 1,
      renderer: () => (
        <AsyncTarifaSelect
          value={tarifaSeleccionada}
          onChange={(op) => {
            setTarifaSeleccionada(op);
            const itemsConTarifa: DTO_ItemOrdenServicio = {
              ...formData,
              nombreItemOrdenServicio: op?.tarifa.nombreTarifa || "",
              descripcion: op?.tarifa.descripcionTarifa || "",
              monto: op?.tarifa.precioTarifa || 0,
            };
            setFormData(itemsConTarifa);
          }}
          reloadKey={reloadKey}
          negocio={negocio}
        />
      ),
    },
  ];

  const editFormFields: FieldConfig<DTO_ItemOrdenServicio>[] = [
    ...ItemsOrdenServicioFormEditFields,
    {
      key: "avance",
      label: "Avance",
      type: "custom",
      renderer: () => (
        <CustomRange
          data={[editData.avance ?? 0]}
          onChange={(value) =>
            setEditData((prev) => ({ ...prev, avance: value }))
          }
        />
      ),
    },
  ];

  const customRenderers = {
    monto: (val: unknown) => formatColones(Number(val) || 0),
  };
  //#endregion

  //#region 🔑 Claves de información para el modal
  const infoModalFields: FieldConfig<DTO_ItemOrdenServicio>[] = [
    ...keysInfoModalItemsOrdenServicio,
    {
      key: "avance",
      label: "Avance",
      type: "custom",
      order: 7,
      renderer: () => {
        const porcentaje = rowTableSelected?.avance ?? 0;
        const barColor =
          porcentaje >= 80
            ? "bg-success"
            : porcentaje >= 50
            ? "bg-warning"
            : "bg-danger";
        return (
          <div
            className="d-flex flex-column w-100 me-2"
            style={{ minWidth: 120 }}
          >
            <div className="d-flex flex-stack mb-2">
              <span className="text-muted me-2 fs-7 fw-bold">
                {porcentaje}%
              </span>
            </div>
            <div className="progress h-6px w-100">
              <div
                className={`progress-bar ${barColor}`}
                role="progressbar"
                style={{ width: `${porcentaje}%` }}
                aria-valuenow={porcentaje}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        );
      },
    },
    {
      key: "monto",
      label: "Monto",
      type: "custom",
      order: 6,
      renderer: () => {
        const value = rowTableSelected?.monto;
        return (
          <div className="border border-gray-200 rounded px-4 py-3 d-flex align-items-center justify-content-between shadow-sm">
            <i className="bi bi-cash-coin fs-4 text-gray-600 me-3"></i>
            <span className="fw-semibold fs-5 text-gray-800"></span>
            {formatColones(Number(value) || 0)}
          </div>
        );
      },
    },
  ];

  //#endregion

  if (!open) return null;

  //#region 🎨 Render
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
        className="modal-dialog modal-fullscreen p-4 p-lg-20 d-flex justify-content-center align-items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content resizable-metronic-modal"
          style={{ borderRadius: "0.475rem", maxWidth: "1200px" }}
        >
          <div className="modal-header cursor-move border-0 p-5 py-4 py-lg-8 px-lg-10">
            <h2 className="fw-light text-gray-400 fs-5">
              {title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()}
            </h2>
            <button
              type="button"
              className="btn-close"
              onClick={onHide}
            ></button>
          </div>
          <div className="modal-body p-0">
            {loading ? (
              <LoadingPanel msj="Cargando Items de la órden de servicio, por favor espere..." />
            ) : (
              <>
                <div className="rounded border p-0">
                  <ul className="nav nav-tabs nav-line-tabs fs-6 px-4 justify-content-end px-lg-20 py-lg-5">
                    <li className="nav-item">
                      <a
                        className="nav-link"
                        data-bs-toggle="tab"
                        href="#proformas"
                      >
                        Proformas
                      </a>
                    </li>
                    <li className="nav-item">
                      <a
                        className="nav-link active"
                        data-bs-toggle="tab"
                        href="#items"
                      >
                        Ítems
                      </a>
                    </li>
                  </ul>
                  <div className="tab-content" id="myTabContent">
                    <div
                      className="tab-pane fade active show"
                      id="items"
                      role="tabpanel"
                    >
                      <GenericDataTable
                        title={`Orden de servicio #${rowData.iD_OrdenServicio}`}
                        columnKeys={columnKeysItemsOrdenServicio}
                        labelMap={labelMapItemsOrdenServicio}
                        data={getActiveItemsOrdenes()}
                        onAdd={handleAddNew}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        customRenderers={customRenderers}
                        includeEstadoColumn={false}
                        onRowClick={(row) =>
                          setRowTableSelected(row as DTO_ItemOrdenServicio)
                        }
                        nowrapColumns={["Monto", "ID"]}
                      />
                    </div>
                    <div
                      className="tab-pane fade"
                      id="proformas"
                      role="tabpanel"
                    >
                      <div
                        className="px-4 mt-5 d-flex justify-content-between align-items-center pb-2 sticky-top bg-white border-0 shadow-sm-on-scroll"
                        style={{
                          position: "sticky",
                          top: "0",
                          background: "white",
                        }}
                      >
                        <div className="col-lg-4 col-9">
                          <AsyncProformaSelect
                            value={proformaSeleccionada}
                            onChange={(op) => {
                              setProformaSeleccionada(op);

                              const proforma: DTO_Proforma = {
                                ...buscarProforma,
                                totalCalculado:
                                  op?.proforma.totalCalculado || 0,
                                cliente:
                                  op?.proforma.cliente || new DTO_Cliente(),
                              };

                              setBuscarProforma(proforma);
                              handleProformaOnchange(
                                op?.proforma as DTO_Proforma
                              );
                            }}
                            reloadKey={reloadKey}
                            negocio={negocio}
                          />
                        </div>

                        <button
                          type="button"
                          className="btn dt-button buttons-html5 btn btn-primary btn-sm mb-0 d-flex align-items-center justify-content-center gap-2 ms-auto"
                          onClick={handleSaveItenmsDesdeProforma}
                        >
                          Guardar
                        </button>
                      </div>

                      <div className="card-body p-4">
                        <table
                          className="table table-sm align-middle dtr-inline"
                          id="DataTables_Table_28"
                          aria-describedby="DataTables_Table_28_info"
                          data-zebra-custom="398bc2"
                        >
                          <thead>
                            <tr className="fs-7 text-gray-600">
                              <th className="col-6"></th>
                              <th className="text-start col-3"></th>
                              <th className="text-start col-2"></th>
                              <th className="text-center col-1"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {itemsProformas.length === 0 && (
                              <tr className="no-hover-row">
                                <td colSpan={5} className="dt-empty">
                                  <div className="dt-empty-state d-flex flex-column align-items-center justify-content-center py-10">
                                    <i
                                      className="bi bi-inbox fs-1 text-muted"
                                      aria-hidden="true"
                                    ></i>
                                    <span className="text-muted mt-2">
                                      Sin datos
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )}

                            {itemsProformas.map((it, idx) => (
                              <React.Fragment key={"CardItemProforma" + idx}>
                                {/* ======= Vista MÓVIL (< sm): grid 8/2/1/1 ======= */}

                                <tr
                                  ref={(el) => {
                                    rowRefs.current[idx] = el;
                                  }}
                                  className="d-table-row"
                                >
                                  <td colSpan={5} className="pb-4">
                                    <div className="p-2 py-4 pb-2 pt-1 border border-secoundary rounded-3 hoverElement">
                                      <div className="row py-2 pb-5">
                                        <div className="col-10">
                                          <span className="fs-7 text-gray-600 mt-2">
                                            {"#" + (idx + 1)}
                                          </span>
                                        </div>
                                        <div className="text-end col-2">
                                          <button
                                            type="button"
                                            className="btn btn-sm p-0"
                                            title="Eliminar"
                                            onClick={() =>
                                              handleDeleteItemProforma(
                                                it.iD_ItemOrdenServicio
                                              )
                                            }
                                          >
                                            <i className="bi bi-trash"></i>
                                          </button>
                                        </div>
                                      </div>

                                      <div className="row g-1">
                                        <div className="col-6">
                                          <label
                                            htmlFor={
                                              "txtNombre" + idx.toString()
                                            }
                                            className="fs-7 text-gray-600"
                                          >
                                            Nombre
                                          </label>
                                          <input
                                            type="text"
                                            className={`form-control form-control-sm 
                                            ${
                                              valida_DTO_ItemOrdenServicio
                                                .validar(it, "C")
                                                .filter(
                                                  (error) =>
                                                    error.nombre ===
                                                    String(
                                                      "nombreItemOrdenServicio"
                                                    )
                                                ).length > 0
                                                ? "border-danger"
                                                : ""
                                            }`}
                                            placeholder="Nombre"
                                            value={it.nombreItemOrdenServicio}
                                            onChange={(e) =>
                                              handleChange(
                                                idx,
                                                "nombreItemOrdenServicio",
                                                e.target.value
                                              )
                                            }
                                            key={"txtNombre" + idx.toString()}
                                          />
                                        </div>

                                        <div className="col-3">
                                          <label
                                          htmlFor={
                                            "txtPrecio" + idx.toString()
                                          }
                                          className="fs-7 text-gray-600"
                                          >
                                          Monto
                                          </label>
                                          <DecimalInput
                                          className={`form-control form-control-sm 
                                          ${
                                            valida_DTO_ItemOrdenServicio
                                            .validar(it, "C")
                                            .filter(
                                              (error) =>
                                              error.nombre ===
                                              String("monto")
                                            ).length > 0
                                            ? "border-danger"
                                            : ""
                                          }`}
                                          placeholder="0.00"
                                          value={it.monto}
                                          onChange={(value) =>
                                            handleChange(
                                            idx,
                                            "monto",
                                            value
                                            )
                                          }
                                          key={"txtPrecio" + idx.toString()}
                                          />
                                        </div>

                                        <div className="col-3">
                                          <label
                                            htmlFor={
                                              "txtCantidad" + idx.toString()
                                            }
                                            className="fs-7 text-gray-600"
                                          >
                                            Cantidad
                                          </label>
                                          <input
                                            type="number"
                                            className={`form-control form-control-sm 
                                            ${
                                              valida_DTO_ItemOrdenServicio
                                                .validar(it, "C")
                                                .filter(
                                                  (error) =>
                                                    error.nombre ===
                                                    String("cantidad")
                                                ).length > 0
                                                ? "border-danger"
                                                : ""
                                            }`}
                                            placeholder="Cant."
                                            value={it.cantidad}
                                            onChange={(e) =>
                                              handleChange(
                                                idx,
                                                "cantidad",
                                                e.target.value
                                              )
                                            }
                                            key={"txtCantidad" + idx.toString()}
                                          />
                                        </div>

                                        {/* Descripción a ancho completo */}
                                        <div className="col-12">
                                          <label
                                            htmlFor={"txtDesc" + idx.toString()}
                                            className="fs-7 text-gray-600 mt-2"
                                          >
                                            Descripción
                                          </label>
                                          <textarea
                                            className={`form-control form-control-sm mb-2 
                                            ${
                                              valida_DTO_ItemOrdenServicio
                                                .validar(it, "C")
                                                .filter(
                                                  (error) =>
                                                    error.nombre ===
                                                    String("descripcion")
                                                ).length > 0
                                                ? "border-danger"
                                                : ""
                                            }`}
                                            rows={2}
                                            placeholder="Descripción"
                                            value={it.descripcion}
                                            onChange={(e) =>
                                              handleChange(
                                                idx,
                                                "descripcion",
                                                e.target.value
                                              )
                                            }
                                            key={"txtDesc" + idx.toString()}
                                          />
                                        </div>

                                        <div className="row p-0">
                                          <div className="text-start col-6"></div>
                                          <div className="text-end col-6">
                                            <span className="fs-7 text-gray-600 mt-2">
                                              Importe
                                            </span>{" "}
                                            <span className="fs-7 text-gray-600 mt-2 ">
                                              {formatColones(
                                                (it.cantidad || 0) *
                                                  (it.monto || 0)
                                              )}
                                            </span>
                                          </div>
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
                    </div>
                  </div>
                </div>
              </>
            )}

            <InfoModal
              show={!!rowTableSelected}
              onHide={() => setRowTableSelected(undefined)}
              data={rowTableSelected!}
              fields={infoModalFields}
            />

            <GenericFormModal
              title="Registrar Item de Orden de Servicio"
              show={isModalFormOpen}
              onHide={handleCancelAdd}
              data={formData}
              setData={setFormData}
              onSubmit={handleSave}
              fields={registerFormFields}
              erroresValidacion={erroresValidacion}
              onEliminarError={eliminarError}
            />

            <GenericFormModal
              title="Editar Orden de Servicio"
              show={showEditForm}
              onHide={() => setShowEditForm(false)}
              data={editData}
              setData={setEditData}
              onSubmit={handleSaveEdit}
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
          <div className="modal-footer flex-center">
            <button type="button" className="btn btn-light" onClick={onHide}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  //#endregion
};
