// src/pages/Cuentas.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  DTO_Negocio,
  DTO_Respuesta,
  DTO_Cuenta,
  DTO_DetalleCuentaJSON,
  DTO_Param,
} from "@/models";
import { cuentasService } from "@/services";
import {
  errorHelpers,
  notificationHelpers,
  procesarRespuesta,
  labelMapCuenta,
  cuentasFormEditFields,
  columnKeysCuenta,
  keysInfoModalCuenta,
  cuentasFormAddFields,
  formatColones,
  formatDetalleJSON,
  compararObjetos,
} from "@/utils";
import {
  ConfirmModal,
  DecimalInput,
  DetalleCuentaInput,
  DynamicButtonConfig,
  GenericDataTable,
  GenericDataTableHandle,
  GenericFormModal,
  InfoModal,
  InfoPanel,
  Toolbar,
  TransaccionesPorCuentaModal,
} from "@/components";
import { STATUS_TBL } from "@/constants";
import { useApp } from "@/hooks/useApp";
import { labelMapCuenta as labelMap } from "@/utils";
import Select from "react-select";
import { valida_DTO_Cuenta } from "@/validators/valida_DTO_Cuenta";
import { FieldConfig } from "@/types/types";




//#region 🔁 Estado Global y Negocio
//#region 🔁 Estado Global y Negocio
export const Cuentas = () => {
  const tableRef = useRef<GenericDataTableHandle<DTO_Cuenta>>(null);
  const { state } = useApp();

  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  let validacion: Array<DTO_Param>;
  const eliminarError = (campo: string) => {
    setErroresValidacion((prev) => prev.filter((e) => e.nombre !== campo));
  };
  // #endregion

  //#region 🧮 Estados generales
  const [selectedBusiness, setSelectedBusiness] = useState<DTO_Negocio | null>(
    null
  );
  const [accountsPayable, setAccountsPayable] = useState<DTO_Cuenta[]>([]);
  const [disableButtonAdd, setDisableButtonAdd] = useState<boolean>(true);

  //#region ➕ Crear cuenta - Estados
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [formData, setFormData] = useState<DTO_Cuenta>(new DTO_Cuenta());
  const [detalleHabilitado, setDetalleHabilitado] = useState<boolean>(
    !!formData.detalleJSON
  );
  const [montoInput, setMontoInput] = useState<string>(
    formData.monto && formData.monto !== 0 ? String(formData.monto) : ""
  );
  //#endregion

  //#Region loadings
  const [loadingForm, setLoadingForm] = useState<boolean>(false);
  //#endregion

  //#region ✏️ Editar cuenta - Estados
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<DTO_Cuenta | null>(null);
  const [rowEditSelected, setRowEditSelected] = useState<DTO_Cuenta | null>(
    null
  );
  //#endregion

  //#region ℹ️ Info Modal - Estados
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [rowTableSelected, setRowTableSelected] = useState<DTO_Cuenta>();
  //#endregion

  //#region ❓ Confirmación Modal - Estados
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmContext, setConfirmContext] = useState<
    "cancelAdd" | "delete" | null
  >(null);
  const [accountToDelete, setAccountToDelete] = useState<DTO_Cuenta | null>(
    null
  );
  //#endregion

  //#region 🔄 Transacciones por cuenta - Estados
  const [isTransaccionesModalOpen, setIsTransaccionesModalOpen] =
    useState(false);
  const [accountTransactions, setAccountTransactions] =
    useState<DTO_Cuenta | null>(null);
  //#endregion

  //#region 🔁 Efectos
  useEffect(() => {
    if (state.negocio) {
      setSelectedBusiness(state.negocio);
      handleSelectBusiness(state.negocio);
    }
  }, [state]);

  useEffect(() => {
    if (detalleHabilitado) return;
    if (formData.monto && formData.monto !== 0) {
      setMontoInput(String(formData.monto));
    } else {
      setMontoInput("");
    }
  }, [formData, detalleHabilitado]);

  useEffect(() => {
    setMontoInput(
      formData.monto && formData.monto !== 0 ? String(formData.monto) : ""
    );
  }, [formData.monto]);

  useEffect(() => {
    if (selectedBusiness) {
      refetchAccounts();
    }
  }, [selectedBusiness]);
  //#endregion

  //#region 🔁 Negocio
  const handleSelectBusiness = (negocio: DTO_Negocio) => {
    setSelectedBusiness(negocio);
    setDisableButtonAdd(false);
  };

  const refetchAccounts = () => {
    if (!selectedBusiness) return;
    cuentasService.obtenerCuentas(selectedBusiness).subscribe({
      next: (result) => {
        const res = (procesarRespuesta(result as DTO_Respuesta) as DTO_Cuenta[]) || [];
        const filterAccounts = res.filter(b => b.estado?.iD_Estado !== STATUS_TBL.ACCOUNT.DELETED);



        // (Opcional) si igual quieres mantener el estado local para otros usos:
        setAccountsPayable(filterAccounts);
      },
      error: errorHelpers.serverError,
    });
  };
  //#endregion



  const actualizarCamposCalculadosCuenta = (cuenta: DTO_Cuenta) => {

    if (cuenta.montoAbonado >= cuenta.monto)
      cuenta.estadoPago = "Pagada"
    else
      cuenta.estadoPago = "Pendiente"

    cuenta.saldoPendiente = cuenta.monto - cuenta.montoAbonado

    return cuenta;

  }


  //#region ➕ Crear cuenta - Funciones
  const handleAddNew = () => {
    setDetalleHabilitado(false);
    setFormData(new DTO_Cuenta());
    setMontoInput("");
    setIsModalFormOpen(true);
  };

  const handleSave = () => {
    setLoadingForm(true);
    formData.iD_Negocio = selectedBusiness?.iD_Negocio || 0;
    const parsed = parseFloat(montoInput.replace(/[^0-9.]/g, ""));
    formData.monto = isNaN(parsed) ? 0 : parsed;

    validacion = valida_DTO_Cuenta.validar(formData, "U");
    setErroresValidacion(validacion);
    if (validacion.length === 0) {
      cuentasService.registrarCuenta(formData).subscribe({
        next: (result: any) => {
          let nueva = (result.resultado as DTO_Cuenta[])[0];
          if (nueva.estado?.iD_Estado !== STATUS_TBL.ACCOUNT.DELETED) {
            setAccountsPayable((prev) => [nueva, ...prev]);
            nueva = actualizarCamposCalculadosCuenta(nueva);
            tableRef.current?.upsert(nueva);
          }
          notificationHelpers.successAlert(
            result.mensaje || "Cuenta registrada correctamente"
          );
          setIsModalFormOpen(false);
        },
        error: (err) => errorHelpers.serverError(err),
        complete: () => {
          setDetalleHabilitado(false);
          setMontoInput("");
          setLoadingForm(false);
        },
      });
    } else {
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }
  };

  const handleCancelAdd = () => {
    setConfirmContext("cancelAdd");
    //entramos a sacar el modal de confirmación solo si no son vacios los valores
    if (!compararObjetos(formData as DTO_Cuenta, new DTO_Cuenta, ['fechaInicial', 'fechaModificacion'])) {

      setConfirmModalMessage("¿Estás seguro de que deseas cancelar el registro?");
      setIsConfirmOpen(true);
    } else {
      setIsModalFormOpen(false);
    }
  };
  //#endregion

  //#region ✏️ Editar cuenta - Funciones
  const handleEdit = (rowData: DTO_Cuenta) => {
    setFormData(new DTO_Cuenta());
    setDetalleHabilitado(!!rowData.detalleJSON);
    setRowEditSelected(rowData);
    setEditData({ ...rowData });
    setMontoInput(String(rowData.monto || ""));
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedData: DTO_Cuenta) => {

    if (!rowEditSelected) return;
    setLoadingForm(true);
    updatedData.iD_Cuenta = rowEditSelected.iD_Cuenta;
    updatedData.iD_Negocio = selectedBusiness?.iD_Negocio || 0;

    if (!updatedData.estado && rowEditSelected.estado) {
      updatedData.estado = { ...rowEditSelected.estado };
    }

    if (detalleHabilitado) {
      const parsed = parseFloat(montoInput.replace(/[^0-9.]/g, ""));
      updatedData.monto = isNaN(parsed) ? 0 : parsed;
    }

    validacion = valida_DTO_Cuenta.validar(updatedData, "U");
    setErroresValidacion(validacion);
    if (validacion.length === 0) {
      cuentasService.actualizarCuenta(updatedData).subscribe({
        next: (result: unknown) => {
          const mensaje =
            (result as DTO_Respuesta)?.mensaje ||
            "Cuenta actualizada correctamente";
          notificationHelpers.successAlert(mensaje);

          updatedData = actualizarCamposCalculadosCuenta(updatedData);
          tableRef.current?.upsert(updatedData);
          //refetchAccounts();
          setShowEditModal(false);
        },
        error: (err) => errorHelpers.serverError(err),
        complete: () => {
          setLoadingForm(false);
        },
      });
    } else {
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }
  };
  //#endregion

  //#region 🗑 Eliminar cuenta - Funciones
  const handleDelete = (rowData: DTO_Cuenta) => {
    setConfirmModalMessage(
      `¿Estás seguro de que deseas eliminar la cuenta: ${rowData.iD_Cuenta}?`
    );
    setAccountToDelete(rowData);
    setConfirmContext("delete");
    setIsConfirmOpen(true);

  };

  const handleConfirmDelete = (action: boolean | null) => {
    if (action && accountToDelete) {
      setLoadingForm(true);
      const updatedData: DTO_Cuenta = {
        ...accountToDelete,
        estado: {
          ...accountToDelete.estado!,
          iD_Estado: STATUS_TBL.ACCOUNT.DELETED,
        },
        iD_Negocio: selectedBusiness?.iD_Negocio || 0,
      };
      cuentasService.actualizarCuenta(updatedData).subscribe({
        error: (err) => errorHelpers.serverError(err),
        next: (result: DTO_Respuesta) => {
          if (result.codigo !== "B012") {
            notificationHelpers.successAlert("Cuenta eliminada correctamente");
            tableRef.current?.removeById(updatedData.iD_Cuenta);
            setAccountsPayable((prev) =>
              prev.filter((c) => c.iD_Cuenta !== accountToDelete.iD_Cuenta)
            );
          } else {
            const mensaje = result.mensaje;
            notificationHelpers.successAlert(mensaje);
          }
        },
        complete: () => {
          setShowEditModal(false);
          setLoadingForm(false);
        },
      });
      setAccountToDelete(null);
    }
    setIsConfirmOpen(false);
  };
  //#endregion

  //#region 🔄 Transacciones por cuenta - Funciones
  const handleTransaction = (row: DTO_Cuenta) => {
    setAccountTransactions(row);
    setIsTransaccionesModalOpen(true);
  };
  //#endregion

  //#region ❓ Confirmación Modal - Funciones
  const confirmModalAction = (action: boolean | null) => {
    if (action) {
      if (confirmContext === "cancelAdd") {
        setIsModalFormOpen(false);
        notificationHelpers.infoAlert("Registro cancelado");
      } else if (confirmContext === "delete") {
        handleConfirmDelete(true);
        setIsInfoModalOpen(false);
      }
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
    setErroresValidacion([]);
  };
  //#endregion

  //#region 🔧 Renderizadores y configuración de campos personalizados
  const customRenderers = {
    monto: (val: unknown) =>
      new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        minimumFractionDigits: 2,
      }).format(Number(val) || 0),
    fechaInicial: (val: unknown) =>
      val ? new Date(String(val)).toLocaleDateString() : "",
    fechaLimite: (val: unknown) =>
      val ? new Date(String(val)).toLocaleDateString() : "",
    montoAbonado: (val: unknown) =>
      new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        minimumFractionDigits: 2,
      }).format(Number(val) || 0),
    saldoPendiente: (val: unknown) =>
      new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        minimumFractionDigits: 2,
      }).format(Number(val) || 0),
  };

  //#region custom column DetallesJson
  const detalleJSONColumn = {
    title: labelMap["detalleJSON"] ?? "Detalle",
    data: "detalleJSON",
    orderable: true,
    searchable: true,
    className: "text-center",
    defaultContent: "",
    render: function (
      _: unknown,
      type: "display" | "export" | "filter" | "sort",
      row: DTO_Cuenta
    ) {
      return formatDetalleJSON(row?.detalleJSON ?? {}, type);
    },
  };
  //#endregion

  //#region ➕ Crear cuenta - Campos formulario
  const formAddFields: FieldConfig<DTO_Cuenta>[] = [
    ...cuentasFormAddFields,
    {
      key: "detalleJSON",
      label: "",
      type: "custom",
      required: false,
      order: 6,
      errorMessage:
        "Tienes datos sin agregar. Presiona el botón ➕ antes de continuar.",
      renderer: ({ value, onChange }) => (
        <DetalleCuentaInput
          value={value}
          onChange={onChange}
          monto={formData.monto}
          setMonto={(val) => {
            console.log(val);
            setFormData({ ...formData, monto: val });
            setMontoInput(val !== 0 ? String(val) : "");
          }}
          onEnabledChange={(enabled) => setDetalleHabilitado(enabled)}
        />
      ),
    },
    {
      key: "monto",
      label: "Monto",
      type: "custom",
      //required: !detalleHabilitado,
      required: false,
      order: 7,
      renderer: () => {
        return (
            <div className="input-group">
            <span className="input-group-text">₡</span>
            <DecimalInput
              className="form-control fw-bold fs-5 text-start"
              readOnly={detalleHabilitado}
              value={montoInput}
              onChange={(val: string) => {
                setMontoInput(val);
                setFormData({ ...formData, monto: isNaN(Number(val)) ? 0 : Number(val) });
              }}
            />
            </div>
        );
      },
    },
    {
      key: "tipoCuenta",
      label: labelMapCuenta["tipoCuenta"] ?? "Tipo de Cuenta",
      type: "custom",
      required: true,
      errorMessage: "Seleccione un tipo de cuenta",
      order: 5,
      renderer: ({ value, onChange }) => (
        <Select
          value={
            value
              ? {
                label:
                  value === "Cuenta Por Pagar"
                    ? "Cuenta Por Pagar"
                    : "Cuenta Por Cobrar",
                value,
              }
              : null
          }
          onChange={(option) => {
            onChange(option?.value);
            setEditData((prev) =>
              prev ? { ...prev, tipoCuenta: option?.value } : null
            );
          }}
          options={[
            { label: "Cuenta Por Cobrar", value: "Cuenta Por Cobrar" },
            { label: "Cuenta Por Pagar", value: "Cuenta Por Pagar" },
          ]}
          placeholder="Seleccione tipo de cuenta"
          isSearchable={false}
        />
      ),
    },
  ];
  //#endregion

  //#region ✏️ Editar cuenta - Campos formulario
  const isCuentaPorCobrarOS = !!(
    editData?.concepto &&
    /^Cobro de Orden de Servicio #\d+$/i.test(editData.concepto)
  );

  const formEditFields: FieldConfig<any>[] = [
    ...cuentasFormEditFields,
    ...(editData?.iD_OrdenServicio
      ? [
        {
          key: "iD_OrdenServicio",
          label: "Orden De Servicio #",
          type: "text",
          order: 4,
        } as FieldConfig<any>,
      ]
      : []),
    {
      key: "detalleJSON",
      label: "Detalle",
      type: "custom",
      required: false,
      order: 10,
      errorMessage:
        "Tienes datos sin agregar. Presiona el botón ➕ antes de continuar.",
      renderer: ({ value, onChange }) => (
        <DetalleCuentaInput
          value={value}
          onChange={onChange}
          monto={editData?.monto ?? 0}
          setMonto={(val) => {
            setMontoInput(val !== 0 ? String(val) : "");
            setEditData((prev) => (prev ? { ...prev, monto: val } : null));
          }}
          onEnabledChange={(enabled) => setDetalleHabilitado(enabled)}
        />
      ),
    },
    {
      key: "monto",
      label: "Monto",
      type: "custom",
      required: false,
      order: 11,
      renderer: () => {
        return (
          <div className="input-group">
            <span className="input-group-text">₡</span>
            <DecimalInput
              className={`form-control fw-bold fs-5 text-start ${
                detalleHabilitado ? "bg-light" : ""
              }`}
              readOnly={detalleHabilitado}
              value={
                montoInput !== ""
                  ? montoInput
                  : editData?.monto !== undefined && editData?.monto !== 0
                  ? String(editData.monto)
                  : ""
              }
              onChange={(val: string) => {
                setMontoInput(val);
               const num = parseFloat(val);
               setEditData((prev) =>
                 prev ? { ...prev, monto: isNaN(num) ? 0 : num } : null
               );
              }}
            />
            {detalleHabilitado && (
              <div
                style={{ width: "100%" }}
                className="form-text text-muted small opacity-75"
              >
                Con la opción "Detalle" habilitada este campo es calculado.
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "concepto",
      label: labelMapCuenta["concepto"] ?? "Concepto",
      type: "text",
      order: 5,
      required: true,
      readOnly: isCuentaPorCobrarOS,
    },
    {
      key: "tipoCuenta",
      label: labelMapCuenta["tipoCuenta"] ?? "Tipo de Cuenta",
      type: "custom",
      required: !isCuentaPorCobrarOS,
      errorMessage: "Seleccione un tipo de cuenta",
      order: 9,
      readOnly: editData?.tipoCuenta == "Cuenta",
      renderer: ({ value, onChange }) => (
        <Select
          isDisabled={isCuentaPorCobrarOS}
          value={
            value
              ? {
                label:
                  value === "Cuenta Por Pagar"
                    ? "Cuenta Por Pagar"
                    : "Cuenta Por Cobrar",
                value,
              }
              : null
          }
          onChange={(option) => {
            onChange(option?.value);
            setEditData((prev) =>
              prev ? { ...prev, tipoCuenta: option?.value } : null
            );
          }}
          options={[
            { label: "Cuenta Por Cobrar", value: "Cuentas Por Cobrar" },
            { label: "Cuenta Por Pagar", value: "Cuenta Por Pagar" },
          ]}
          placeholder="Seleccione tipo de cuenta"
          isSearchable={false}
        />
      ),
    },
  ];
  //#endregion

  //#region ℹ️ Info Modal - Campos
  const infoModalFields: FieldConfig<any>[] = [
    ...(rowTableSelected?.iD_OrdenServicio
      ? [
        {
          key: "iD_OrdenServicio",
          label: "Orden De Servicio",
          type: "text",
          order: 1,
        } as FieldConfig<any>,
      ]
      : []),
    ...keysInfoModalCuenta,
    {
      key: "detalleJSON",
      label: "Detalles",
      type: "custom",
      order: 6,
      renderer: ({ value }) => {
        const detalle = value as DTO_DetalleCuentaJSON;
        const filas = detalle.filas ?? [];

        if (filas.length == 0 && detalle.descuento.valor == "" && detalle.impuesto.valor == "") {
          return (
            <>---</>
          );
        }
        return (
          <div className="d-flex flex-column gap-4">
            {filas.length > 0 && (
              <div>
                <table
                  className="table table-sm align-middle dtr-inline"
                  id="DataTables_Table_28"
                  aria-describedby="DataTables_Table_28_info"
                  data-zebra-custom="398bc2"
                >
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
                            <i
                              className="bi bi-inbox fs-1 text-muted"
                              aria-hidden="true"
                            ></i>
                            <span className="text-muted mt-2">Sin datos</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {filas.map((it, idx) => (
                      <React.Fragment key={"CardItemProforma" + idx}>
                        {/* ======= Vista MÓVIL (< sm): grid 8/2/1/1 ======= */}
                        <tr className="d-table-row">
                          <td colSpan={4} className="pb-4">
                            <div className="p-2 py-4 pb-2 pt-1 border border-secoundary rounded-3 hoverElement">
                              <div className="row py-2 pb-5">
                                <div className="col-10"><span className="fs-7 text-gray-600 mt-2">{'#' + (idx + 1)}</span></div>
                                <div className="text-end col-2">






                                </div>
                                <div className="text-end col-2"></div>
                              </div>

                              {/* Tabla para Nombre, Monto, Cantidad */}
                              <table className="table table-bordered mb-2">
                                <thead>
                                  <tr>
                                    <th className="fs-7 text-gray-600">Nombre</th>
                                    <th className="fs-7 text-gray-600">Monto</th>
                                    <th className="fs-7 text-gray-600">Cantidad</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>{it.nombre}</td>
                                    <td style={{ whiteSpace: "nowrap" }}>{formatColones(it.valor)}</td>
                                    <td>{it.cantidad || 1}</td>
                                  </tr>
                                </tbody>
                              </table>

                              {/* Importe separado */}
                              <div className="row p-0">
                                <div className="text-start col-6"></div>
                                <div className="text-end col-6">
                                  <span className="fs-7 text-gray-600 mt-2">
                                    Importe
                                  </span>{" "}
                                  <span className="fs-7 text-gray-600 mt-2 ">
                                    {formatColones(
                                      (+it.cantidad || 1) * (+it.valor || 0)
                                    )}
                                  </span>
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
            <div className="d-flex flex-wrap gap-4 pt-5">
              <div className="d-flex flex-column">
                <span className="text-muted fs-5">
                  Descuento:{" "}
                  <span className="fw-bold text-dark fs-5">
                    {detalle.descuento?.nombre === "Monto"
                      ? `₡${Number(
                          detalle.descuento?.valor ?? 0
                        ).toLocaleString("es-CR", {
                          minimumFractionDigits: 2,
                        })}`
                      : `${Number(detalle.descuento?.valor ?? 0).toLocaleString(
                          "es-CR"
                        )}%`}
                  </span>
                </span>
              </div>
              <div className="d-flex flex-column">
                <span className="text-muted fs-5">
                  Impuesto:{" "}
                  <span className="fw-bold text-dark fs-5">
                    {Number(detalle.impuesto?.valor ?? 0).toLocaleString(
                      "es-CR"
                    )}
                    %
                  </span>
                </span>
              </div>
              {/* <div className="py-3 d-flex flex-column">
                <span className="text-muted fw-semibold small">Filas: <span className="fw-bold text-gray-800 fs-6">
                  {filas.length}
                </span></span>
                
              </div> */}
            </div>
          </div>
        );
      },
    },
    {
      key: "monto",
      label: "Monto Inicial",
      type: "custom",
      order: 9,
      renderer: ({ value }) => {
        const monto = Number(value || 0);

        return (
          <>

            <span className="fs-5 text-dark text-end"></span>
            {formatColones(monto)}
          </>
        );
      },
    },
    {
      key: "montoAbonado",
      label: "Monto Abonado",
      type: "custom",
      order: 10,
      renderer: ({ value }) => {
        const monto = Number(value || 0);

        return (
          <>

            <span className="fs-5 text-dark text-end"></span>
            {formatColones(monto)}
          </>
        );
      },
    },
    {
      key: "saldoPendiente",
      label: "Saldo",
      type: "custom",
      order: 11,
      renderer: ({ value }) => {
        const monto = Number(value || 0);

        return (
          <>

            <span className="fs-5 text-dark text-end"></span>
            {formatColones(monto)}
          </>
        );
      },
    },
  ];
  //#endregion

  //#region ℹ️ Info Modal - Botones header
  const headerButtonsToInfo = [
    {
      titulo: "Eliminar",
      onClick: () => {
        handleDelete(rowTableSelected!);
      },
      className: "btn btn-bg-light btn-active-color-danger",
    },
    {
      titulo: "Ver Transacciones",
      onClick: () => {
        handleTransaction(rowTableSelected!);
        setIsTransaccionesModalOpen(true);
      },
      className: "btn btn-bg-light btn-active-color-primary",
    },
  ];
  const headerButtonsToEdit: DynamicButtonConfig[] = [
    {
      titulo: "Eliminar",
      onClick: () => {
        handleDelete(editData!);
      },
      className: "btn btn-bg-light btn-active-color-danger",
    },
    {
      titulo: "Ver Transacciones",
      onClick: () => {
        handleTransaction(editData!);
      },
      className: "btn btn-bg-light btn-active-color-primary",
    },
  ];
  //#endregion

  //#region 🧩 Botones de la tabla
  const dataTableButtons: DynamicButtonConfig[] = [
    {
      titulo: "Ver Transacciones",
      icon: <i className="bi bi-arrow-left-right fs-5 me-1" />,
      onClick: (row) => {
        handleTransaction(row);
      },
    },
  ];
  //#endregion


  //#region 🧩 Renderizado
  return (
    <>

      <Toolbar titulo="Cuentas" addButton onAdd={handleAddNew} />
      <div className="row p-4 col-12 gx-0">
        {state.negocio == null ? (
          <InfoPanel msj="Seleccione un negocio para ver sus cuentas." />
        ) : (
          <>
            <GenericDataTable<DTO_Cuenta>
              ref={tableRef}
              title="Cuentas"
              columnKeys={columnKeysCuenta}
              labelMap={labelMapCuenta}
              data={accountsPayable} // se carga 1 sola vez
              independent // ⇦ clave para que NO escuche más cambios del padre
              idField="iD_Cuenta" // ⇦ campo ID que usa upsert/remove
              onAdd={handleAddNew}
              onEdit={handleEdit}
              onDelete={handleDelete}
              disableButtonAdd={disableButtonAdd}
              includeEstadoColumn={false}
              customRenderers={customRenderers}
              customColumns={[detalleJSONColumn]}
              dataTableButtons={dataTableButtons}
              onRowClick={(row) => {
                setRowTableSelected(row);
                setIsInfoModalOpen(true);
              }}
              nowrapColumns={[
                "iD_Cuenta",
                "monto",
                "montoAbonado",
                "saldoPendiente",
                "tipoCuenta",
              ]}
            />

            <InfoModal
              show={isInfoModalOpen}
              onHide={() => {
                setIsInfoModalOpen(false);
                setRowTableSelected(undefined);
              }}
              data={rowTableSelected!}
              fields={infoModalFields}
              headerButtons={headerButtonsToInfo}
            />

            <GenericFormModal<DTO_Cuenta>
              title="Crear una Cuenta"
              show={isModalFormOpen}
              onHide={handleCancelAdd}
              loading={loadingForm}
              data={formData}
              setData={setFormData}
              onSubmit={handleSave}
              fields={formAddFields}
              erroresValidacion={erroresValidacion}
              onEliminarError={eliminarError}
            />

            <GenericFormModal<DTO_Cuenta>
              title="Editar Cuenta"
              show={showEditModal}
              onHide={() => {
                setShowEditModal(false);
                setErroresValidacion([]);
                }}
              loading={loadingForm}
              data={editData!}
              setData={(x) => setEditData(x as DTO_Cuenta)}
              onSubmit={() => {
                if (editData) {
                  handleSaveEdit(editData);
                }
              }}
              fields={formEditFields}
              headerButtons={headerButtonsToEdit}
              erroresValidacion={erroresValidacion}
              onEliminarError={eliminarError}
            />

            <ConfirmModal
              show={isConfirmOpen}
              confirmMessage={confirmModalMessage}
              onAction={confirmModalAction}
            />

            <TransaccionesPorCuentaModal
              open={isTransaccionesModalOpen}
              onHide={() => {
                setIsTransaccionesModalOpen(false);
              }}
              cuenta={accountTransactions || new DTO_Cuenta()}
              negocioId={selectedBusiness?.iD_Negocio || 0}
              onChange={(cuenta) => {
                tableRef.current?.upsert(cuenta);
              }}
            />
          </>
        )}
      </div>
    </>
  );
  //#endregion
};
//#endregion
