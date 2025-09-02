// src/pages/Proformas.tsx
import {
  ConfirmModal,
  DynamicButtonConfig,
  FieldConfig,
  GenericDataTable,
  GenericDataTableHandle,
  InfoModal,
  LoadingPanel,
  ProformaCrearEditarModal,
  InfoPanel,
} from "@/components";
import { STATUS_TBL } from "@/constants";
import { useApp } from "@/hooks/useApp";
import { DTO_Respuesta, DTO_Proforma } from "@/models";
import { proformaService } from "@/services/proformas.service";
import {
  columnKeysProforma,
  errorHelpers,
  labelMapProforma,
  notificationHelpers,
  procesarRespuesta,
  formatColones,
  keysInfoModalProforma,
} from "@/utils";
// import { valida_DTO_Proformas } from "@/validators/valida_DTO_Proformas";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { catchError, finalize, map, of } from "rxjs";

export const Proformas = () => {
  const { state } = useApp();
  const tableRef = useRef<GenericDataTableHandle<DTO_Proforma>>(null);

  //#region 🛡️ Validaciones
  // const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  // let validacion: DTO_Param[];
  // const eliminarError = (campo: string) => {
  //   setErroresValidacion((prev) => prev.filter((e) => e.nombre !== campo));
  // };
  //#endregion

  //#region 🔄 Estado General
  const [loading, setLoading] = useState(false);
  const [proformas, setProformas] = useState<DTO_Proforma[]>([]);
  //#endregion

  //#region ℹ️ InfoModal
  const [rowTableSelected, setRowTableSelected] = useState<DTO_Proforma>();
  //#endregion

  //#region ➕ Registrar

  const [showRegisterProforma, setShowRegisterProforma] = useState(false);
  //#endregion

  //#region ✏️ Editar
  const [showEditProforma, setShowEditProforma] = useState(false);
  const [editData, setEditData] = useState<DTO_Proforma>(new DTO_Proforma());
  //#endregion

  //#region 🗑 Eliminar
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState<string>("");
  const [proformaToDelete, setProformaToDelete] = useState<DTO_Proforma | null>(
    null
  );
  const [confirmContext, setConfirmContext] = useState<string | null>(null);
  //#endregion

  //#region 🚀 Carga inicial
  useEffect(() => {
    setLoading(true);
    if (state.negocio?.iD_Negocio) {
      const proformaWithBusiness = {
        ...new DTO_Proforma(),
        iD_Negocio: state.negocio.iD_Negocio,
      };

      const sub = proformaService
        .obtenerProformas(proformaWithBusiness)
        .pipe(
          map(
            (res) => procesarRespuesta(res as DTO_Respuesta) as DTO_Proforma[]
          ),
          catchError((err) => {
            errorHelpers.serverError(err);
            return of([] as DTO_Proforma[]);
          }),
          finalize(() => setLoading(false))
        )
        .subscribe(setProformas);

      return () => sub.unsubscribe();
    } else {
      setLoading(false);
    }
  }, [state.negocio]);
  //#endregion

  //#region 🧠 CRUD Logic

  //#region 🧩 Registrar
  const handleAddNew = () => {
    setShowRegisterProforma(true);
  };

  const handleSave = (proforma: DTO_Proforma) => {
    if (tableRef.current) {
      tableRef.current.upsert(proforma);
    }
    setShowRegisterProforma(false);
  };

  const handleCancelAdd = () => {
    setConfirmModalMessage("¿Deseas cancelar el registro?");
    setConfirmContext("cancelAdd");
    setIsConfirmOpen(true);
  };
  //#endregion

  //#region 🧩 Editar
  const handleEdit = (proforma: DTO_Proforma) => {
    setEditData(proforma);
    setShowEditProforma(true);
  };

  const handleSaveEdit = (proforma: DTO_Proforma) => {
    if (tableRef.current) {
      tableRef.current.upsert(proforma);
    }
    setShowEditProforma(false);
  };
  //#endregion

  //#region 🧩 Eliminar
  const handleDelete = (proforma: DTO_Proforma) => {
    setConfirmModalMessage(
      `¿Estás seguro de que deseas eliminar la proforma #${proforma.iD_Proforma}?`
    );
    setProformaToDelete(proforma);
    setConfirmContext("delete");
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = (action: boolean | null) => {
    if (!action || !proformaToDelete) {
      setProformaToDelete(null);
      setIsConfirmOpen(false);
      setConfirmContext(null);
      return;
    }
    tableRef.current?.removeById(proformaToDelete.iD_Proforma);
    const updated: DTO_Proforma = {
      ...proformaToDelete,
      estado: {
        ...(proformaToDelete.estado ?? { tabla: "" }),
        iD_Estado: STATUS_TBL.PROFORMA.DELETED,
        nombre: "Eliminado",
      },
    };
    proformaService.actualizarProformas(updated).subscribe({
      next: (res: DTO_Respuesta) => {
        if (res?.codigo === "B045") {
          notificationHelpers.infoAlert("Proforma eliminada correctamente");
        } else {
          notificationHelpers.warningAlert(
            res?.mensaje || "No se pudo eliminar"
          );
        }
      },
      error: (err) => {
        errorHelpers.serverError(err);
      },
    });

    setProformaToDelete(null);
    setIsConfirmOpen(false);
    setConfirmContext(null);
  };

  const confirmModalAction = (action: boolean | null) => {
    if (action) {
      if (confirmContext === "cancelAdd") {
        setShowRegisterProforma(false);
        notificationHelpers.infoAlert("Registro cancelado");
      } else if (confirmContext === "delete") {
        handleConfirmDelete(true);
      }
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
    // setErroresValidacion([]);
  };
  //#endregion

  //#region 🔧 Renderizadores modificado para celdas de la tabla
  const customRenderers = {
    fechaProforma: (val: unknown) =>
      val ? new Date(String(val)).toLocaleDateString("es-CR") : "",
    fechaVencimiento: (val: unknown) =>
      val ? new Date(String(val)).toLocaleDateString("es-CR") : "",
    totalCalculado: (val: unknown) => formatColones(Number(val) || 0),
    subTotal: (val: unknown) => formatColones(Number(val) || 0),
    baseImponible: (val: unknown) => formatColones(Number(val) || 0),
    montoDescuento: (val: unknown) => formatColones(Number(val) || 0),
    montoImpuesto: (val: unknown) => formatColones(Number(val) || 0),
    descuentoProforma: (val: unknown, row?: DTO_Proforma) => {
      if (row?.descuentoPorcentualProforma) {
        return typeof val === "number" ? `${val}%` : "0%";
      }
      return formatColones(Number(val) || 0);
    },
    impuestoPorcentualProforma: (val: unknown) =>
      typeof val === "number" ? `${val}%` : "0%",
    cliente: (val: unknown) => {
      if (!val) {
        return (
          <span className="d-flex align-items-center text-muted">
            <i className="bi bi-person-x me-2"></i>
            Sin cliente asignado
          </span>
        );
      }
      if (typeof val === "object") {
        const c = val as { nombreCliente?: string; apellidoCliente?: string };
        const nombreCompleto = [
          c.nombreCliente?.trim(),
          c.apellidoCliente?.trim(),
        ]
          .filter(Boolean)
          .join(" ");
        if (nombreCompleto) return nombreCompleto;
      }
      return (
        <span className="d-flex align-items-center text-muted">
          <i className="bi bi-person-x me-2"></i>
          Sin cliente asignado
        </span>
      );
    },
  };
  //#endregion

  //#region 🔑 InfoModal
  // Agrupa los campos con formatColones en una tabla
  const colonesFields: FieldConfig<DTO_Proforma>[] = [
    {
      key: "descuentoProforma",
      label: "Descuento",
      type: "custom",
      order: 1,
      renderer: ({ value }) => {
        const isPercent =
          typeof value === "number" && value >= 0 && value <= 100;
        return (
          <span>
            {isPercent ? `${value}%` : formatColones(Number(value) || 0)}
          </span>
        );
      },
    },
    {
      key: "montoDescuento",
      label: "Monto de descuento",
      type: "custom",
      order: 2,
      renderer: ({ value }) => <span>{formatColones(Number(value) || 0)}</span>,
    },
    {
      key: "impuestoPorcentualProforma",
      label: "IVA(%)",
      type: "custom",
      order: 3,
      renderer: ({ value }) => (
        <span>{typeof value === "number" ? `${value}%` : "0%"}</span>
      ),
    },
    {
      key: "montoImpuesto",
      label: "Monto de impuesto",
      type: "custom",
      order: 4,
      renderer: ({ value }) => <span>{formatColones(Number(value) || 0)}</span>,
    },
    {
      key: "subTotal",
      label: "Subtotal",
      type: "custom",
      order: 5,
      renderer: ({ value }) => <span>{formatColones(Number(value) || 0)}</span>,
    },
    {
      key: "baseImponible",
      label: "Subtotal c/desc",
      type: "custom",
      order: 6,
      renderer: ({ value }) => <span>{formatColones(Number(value) || 0)}</span>,
    },
    {
      key: "totalCalculado",
      label: "Total final",
      type: "custom",
      order: 7,
      renderer: ({ value }) => <span>{formatColones(Number(value) || 0)}</span>,
    },
  ];

  const infoModalFields: FieldConfig<any>[] = [
    ...keysInfoModalProforma,
    {
      key: "cliente",
      label: "Cliente asociado",
      type: "custom",
      order: 2,
      renderer: ({ value }) => (
        <>
          <i className="bi bi-person-fill me-2"></i>
          {value ? (
            <span className="fw-semibold">
              {value.nombreCliente} {value.apellidoCliente}
            </span>
          ) : (
            <span className="text-muted">Sin cliente asignado</span>
          )}
        </>
      ),
    },
    {
      key: "observacionProforma",
      label: "Observaciones",
      type: "custom",
      order: 5,
      renderer: ({ value }) => (
        <div className="mb-3">
          <textarea
            className="form-control border rounded-3 shadow-sm"
            rows={4}
            value={value || ""}
            readOnly
          />
        </div>
      ),
    },
    {
      key: "colonesFields",
      label: "Desglose detallado",
      type: "custom",
      order: 3,
      renderer: () => (
        <>
          <table className="table align-middle table-row-dashed gy-2">
            <tbody>
              {colonesFields.map((field) => (
                <tr key={field.key}>
                  <td className="text-muted fs-5 mb-1">{field.label}</td>
                  <td>
                    {field.renderer
                      ? field.renderer({
                          value: rowTableSelected
                            ? (rowTableSelected as any)[field.key]
                            : undefined,
                          onChange: () => {},
                          readOnly: true,
                        })
                      : rowTableSelected
                      ? (rowTableSelected as any)[field.key]
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ),
    },
  ];
  //#endregion

  //#region Cambios de estados de proforma

  const handleChangeEstado = (
    nuevoEstadoId: number,
    row: DTO_Proforma,
    nombreEstado: string
  ) => {
    if (!row) return;

    const dtoProforma: DTO_Proforma = {
      ...row,
      estado: {
        iD_Estado: nuevoEstadoId,
        nombre: nombreEstado,
        tabla: "",
      },
    };
    proformaService.actualizarProformas(dtoProforma).subscribe({
      next: (res: DTO_Respuesta) => {
        if (res?.tipoRespuesta) {
          notificationHelpers.successAlert(`Estado Cambiado a ${nombreEstado}`);
          tableRef.current?.upsert(dtoProforma);
        } else {
          notificationHelpers.warningAlert(
            res?.mensaje || "No se pudo actualizar el estado"
          );
        }
      },
      error: (err) => {
        errorHelpers.serverError(err);
      },
    });
  };

  //#endregion

  //#region botones de acción para la tabla
  const opcionesDropdown = (row: DTO_Proforma) => [
    {
      label: "Borrador",
      icon: <i className="bi bi-file-earmark-text me-2 text-info" />,
      onClick: () =>
        handleChangeEstado(STATUS_TBL.PROFORMA.DRAFT, row, "borrador"),
    },
    {
      label: "Anular",
      icon: <i className="bi bi-x-circle me-2 text-danger" />,
      danger: true,
      onClick: () =>
        handleChangeEstado(STATUS_TBL.PROFORMA.ANNULLED, row, "anulado"),
    },
    {
      label: "Aprobar",
      icon: <i className="bi bi-check2-circle me-2 text-success" />,
      danger: false,
      onClick: () =>
        handleChangeEstado(STATUS_TBL.PROFORMA.APPROVED, row, "aprobado"),
    },
  ];

  const dataTableButtons: DynamicButtonConfig[] = [
    {
      render: ({ row }) => (
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm "
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="dropdown-toggle fs-3"></i>
          </button>

          <ul className="dropdown-menu dropdown-menu-end">
            {opcionesDropdown(row).map((it, i) => (
              <li key={`opt-${i}`}>
                <button
                  type="button"
                  className={`dropdown-item d-flex align-items-center ${
                    it.danger ? "text-danger" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    it.onClick?.();
                  }}
                >
                  {it.icon}
                  {it.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
  ];
  //#endregion

  return (
    <>
      <div className="row p-4 gx-0">
        {state.negocio == null ? (
          <InfoPanel msj="Seleccione un negocio para ver sus proformas." />
        ) : (
          <>
            {loading ? (
              <LoadingPanel msj="Cargando Proformas, por favor espere..." />
            ) : (
              <GenericDataTable<DTO_Proforma>
                ref={tableRef}
                title="Proformas"
                columnKeys={columnKeysProforma}
                labelMap={labelMapProforma}
                dataTableButtons={dataTableButtons}
                data={proformas}
                independent
                includeEstadoColumn
                idField="iD_Proforma"
                onAdd={handleAddNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRowClick={setRowTableSelected}
                customRenderers={customRenderers}
                nowrapColumns={[
                  "iD_Proforma",
                  "totalCalculado",
                  "cliente",
                  "montoDescuento",
                  "subTotal",
                  "baseImponible",
                  "montoImpuesto",
                  "descuentoProforma",
                ]}
              />
            )}

            <ProformaCrearEditarModal
              mode="create"
              show={showRegisterProforma}
              onClose={handleCancelAdd}
              onRegistered={handleSave}
            />
            <ProformaCrearEditarModal
              mode="edit"
              show={showEditProforma}
              proforma={editData}
              onUpdated={handleSaveEdit}
              onClose={() => setShowEditProforma(false)}
            />

            <InfoModal
              show={!!rowTableSelected}
              onHide={() => setRowTableSelected(undefined)}
              data={rowTableSelected!}
              fields={infoModalFields}
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
