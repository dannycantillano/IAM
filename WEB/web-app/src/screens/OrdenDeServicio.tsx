import {
  AsyncClientSelect,
  ClientOption,
  ConfirmModal,
  DetalleCuentaInput,
  DynamicButtonConfig,
  GenericDataTable,
  GenericFormModal,
  InfoModal,
  InfoPanel,
  ItemsOrdenDeServicioModal,
  ReferenciaCards,
  Toolbar,
} from "@/components";
import ReactDOM from "react-dom/client";
import {
  RESTRICCIONES,
  ROUTES,
  STATUS_ORDEN_SERVICIO_OPTIONS,
  STATUS_TBL,
} from "@/constants";
import {
  DTO_Cliente,
  DTO_Cuenta,
  DTO_ItemOrdenServicio,
  DTO_Negocio,
  DTO_OrdenServicio,
  DTO_Param,
  DTO_Respuesta,
} from "@/models";
import {
  clientesService,
  cuentasService,
  itemsOrdenesService,
  ordenesService,
} from "@/services";
import {
  keysInfoModalOrdenDeServicio,
  columnKeysOrdenDeServicio,
  dateHelpers,
  errorHelpers,
  labelMapOrdenDeServicio,
  notificationHelpers,
  ordenServicioFormEditFields,
  parametrosAString,
  ordenservicioFormCrearCuenta,
  procesarRespuesta,
  clienteFormEditFields,
} from "@/utils";
import { useApp } from "@/hooks/useApp";

import { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import { valida_DTO_OrdenServicio } from "@/validators/valida_DTO_OrdenServicio";
import { valida_DTO_Cuenta } from "@/validators/valida_DTO_Cuenta";
import { Link, useNavigate } from "react-router-dom";
import { valida_DTO_Cliente } from "@/validators/valida_DTO_Cliente";
import { FieldConfig } from "@/types/types";

// #region 🔑 Helpers
const generateSafeKey = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
// #endregion

export const OrdenDeServicio = () => {
  const navigate = useNavigate();
  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  let validacion: Array<DTO_Param>;
  const eliminarError = (campo: string) => {
    setErroresValidacion((prev) => prev.filter((e) => e.nombre !== campo));
  };
  // #endregion

  // #region 🔄 Estado general
  const { state } = useApp();

  useEffect(() => {
    if (state.negocio) {
      setSelectedBusiness(state.negocio);
      handleSelectBusiness(state.negocio);
    }
  }, [state]);

  const [selectedBusiness, setSelectedBusiness] = useState<DTO_Negocio | null>(
    null
  );
  const [ordenes, setOrdenes] = useState<DTO_OrdenServicio[]>([]);
  const [disableButtonAdd, setDisableButtonAdd] = useState(true);
  //#endregion

  const [clienteNombreNota, setClienteNombreNota] = useState<string>("");
  const [isModalRegisterClientOpen, setIsModalRegisterClientOpen] =
    useState(false);
  const [newClientData, setNewClientData] = useState<DTO_Cliente>(
    new DTO_Cliente()
  );
  const [clientReloadKey, setClientReloadKey] = useState(0);

  const [loadingForm, setLoadingForm] = useState(false);

  const [hasRegisteredClients, setHasRegisteredClients] =
    useState<boolean>(false);

  const [showNoClientsModal, setShowNoClientsModal] = useState(false);

  const [checkIfClientsRegistered, setCheckIfClientsRegistered] =
    useState<boolean>(false);

  // #region 🧩 Negocio seleccionado
  const handleSelectBusiness = (neg: DTO_Negocio) => {
    setSelectedBusiness(neg);
    setDisableButtonAdd(false);
  };
  //#endregion

  // #region 🚀 Obtener órdenes de servicio.
  // 0s
  useEffect(() => {
    if (!selectedBusiness) return;
    const sub = ordenesService
      .obtenerOrdensDeServicio(selectedBusiness)
      .subscribe({
        next: (res) =>
          setOrdenes(
            ((res as DTO_Respuesta).resultado as DTO_OrdenServicio[]) || []
          ),
        error: errorHelpers.serverError,
      });
    return () => sub.unsubscribe();
  }, [selectedBusiness]);
  //#endregion

  // #region 🔍 Comprobar la existencia de clientes registrado
  useEffect(() => {
    clientesService.obtenerClientes().subscribe({
      next: (result) => {
        const clients =
          (procesarRespuesta(
            result as unknown as DTO_Respuesta
          ) as DTO_Cliente[]) || [];

        const activeClients = clients.filter(
          (c) => c.estado?.iD_Estado !== STATUS_TBL.CLIENT.DELETED
        );
        if (activeClients.length > 0) {
          setHasRegisteredClients(true);
        } else {
          setHasRegisteredClients(false);
        }
      },
      error: (err) => errorHelpers.serverError(err),
    });
  }, [checkIfClientsRegistered]);
  //#endregion

  // #region ➕ Crear Orden
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<DTO_OrdenServicio>(() => {
    const dto = new DTO_OrdenServicio();
    dto.fechaInicio = null;
    dto.fechaFinal = null;
    dto.fechaEntrega = null;
    dto.fechaEstimadaEntrega = null;
    return dto;
  });
  const [selectedClientOption, setSelectedClientOption] =
    useState<ClientOption | null>(null);

  const handleAddNew = () => {
    if (!selectedBusiness) return;

    setCheckIfClientsRegistered(true);

    if (!hasRegisteredClients) {
      setShowNoClientsModal(true);
      return;
    }
    const initial = new DTO_OrdenServicio();
    initial.referenciaJSON =
      selectedBusiness.referenciaJSON?.map((r) => ({
        nombre: r.nombre,
        valor: "",
      })) || [];
    initial.fechaInicio = null;
    initial.fechaFinal = null;
    initial.fechaEntrega = null;
    initial.fechaEstimadaEntrega = null;
    setFormData(initial);
    setSelectedClientOption(null);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!selectedBusiness) return;
    setLoadingForm(true);
    const toSave: any = { ...formData };
    toSave.iD_Negocio = selectedBusiness.iD_Negocio;
    toSave.fechaOrdenServicio = new Date();

    [
      "fechaInicio",
      "fechaFinal",
      "fechaEntrega",
      "fechaEstimadaEntrega",
    ].forEach((key) => {
      const raw = (toSave[key] as string | null) ?? null;
      if (raw) {
        const d = new Date(raw);
        toSave[key] = !isNaN(d.getTime()) && d.getFullYear() >= 1753 ? d : null;
      } else {
        toSave[key] = null;
      }
    });

    validacion = valida_DTO_OrdenServicio.validar(toSave, "C");
    setErroresValidacion(validacion);
    if (validacion.length === 0) {
      ordenesService.registrarOrdensDeServicio(toSave).subscribe({
        next: (res) => {
          notificationHelpers.successAlert((res as DTO_Respuesta).mensaje);
          setIsFormOpen(false);
          setOrdenes((prev) => [
            ...((res as DTO_Respuesta).resultado as DTO_OrdenServicio[]),
            ...prev,
          ]);
        },
        error: errorHelpers.serverError,
        complete: () => setLoadingForm(false),
      });
    } else {
      setLoadingForm(false);
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }
  };

  const handleCancelAdd = () => {
    setConfirmModalMessage(
      "¿Estás seguro de que deseas cancelar la nueva orden?"
    );
    setConfirmContext("cancelAdd");
    setIsConfirmOpen(true);
  };

  //#region crear cliente
  const handleRegisterClient = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsModalRegisterClientOpen(true);
  };

  const handleSaveNewClient = () => {
    if (!newClientData) return;
    setLoadingForm(true);
    validacion = valida_DTO_Cliente.validar(newClientData, "C");
    setErroresValidacion(validacion);

    if (validacion.length === 0) {
      clientesService.registrarClientes(newClientData).subscribe({
        next: (res: DTO_Respuesta) => {
          notificationHelpers.successAlert(res.mensaje);
          setIsModalRegisterClientOpen(false);

          setClientReloadKey((k) => k + 1);

          const creado = Array.isArray(res.resultado)
            ? (res.resultado[0] as DTO_Cliente)
            : (res.resultado as DTO_Cliente);

          if (creado?.iD_Cliente) {
            const opt: ClientOption = {
              value: creado.iD_Cliente,
              label: `${creado.nombreCliente ?? ""} ${
                creado.apellidoCliente ?? ""
              }`.trim(),
            };

            setSelectedClientOption(opt);

            setFormData((prev) => ({ ...prev, iD_Cliente: creado.iD_Cliente }));

            setEditData((prev) =>
              prev ? { ...prev, iD_Cliente: creado.iD_Cliente } : prev
            );

            setHasRegisteredClients(true);
          }
        },
        complete: () => {
          setNewClientData(new DTO_Cliente());
          setLoadingForm(false);
        },
        error: errorHelpers.serverError,
      });
    } else {
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }
  };

  //#endregion

  // Campos personalizados para crear
  const buildReferencesfFields = (item: DTO_OrdenServicio) =>
    item.referenciaJSON?.map((r, idx) => ({
      key: generateSafeKey(r.nombre) as keyof DTO_OrdenServicio,
      label: r.nombre,
      type: "custom" as const,
      renderer: () => (
        <input
          className="form-control"
          value={item.referenciaJSON?.[idx].valor || ""}
          onChange={(e) => {
            const arr = [...(item.referenciaJSON || [])];
            arr[idx] = { nombre: r.nombre, valor: e.target.value };
            if (item === formData) {
              setFormData({ ...item, referenciaJSON: arr });
            } else {
              setEditData({ ...item, referenciaJSON: arr });
            }
          }}
        />
      ),
    })) || [];

  const newFormFields: FieldConfig<any>[] = [
    ...ordenServicioFormEditFields,
    {
      key: "iD_Cliente",
      label: "Cliente",
      type: "custom",
      required: true,
      renderer: ({ onChange }) => (
        <div>
          <AsyncClientSelect
            value={selectedClientOption}
            reloadKey={clientReloadKey}
            onChange={(opt) => {
              setSelectedClientOption(opt);
              onChange(opt?.value || 0);
            }}
          />
          <div
            className="mt-1 d-flex align-items-center small"
            style={{ fontSize: "0.95em" }}
          >
            <span className="me-2 text-muted">
              ¿No tienes un cliente registrado?
            </span>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1 middle"
              onClick={handleRegisterClient}
            >
              <i className="bi bi-person-plus-fill"></i>
              <span>Registrar Cliente</span>
            </button>
          </div>
        </div>
      ),
    },
    ...buildReferencesfFields(formData),
  ];
  //#endregion

  // #region ✏️ Editar Orden
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState<DTO_OrdenServicio>(() => {
    const dto = new DTO_OrdenServicio();
    dto.fechaInicio = null;
    dto.fechaFinal = null;
    dto.fechaEntrega = null;
    dto.fechaEstimadaEntrega = null;
    return dto;
  });

  const normalizeIncomingDate = (raw?: string | Date | null): string | null => {
    if (!raw) return null;
    const date = typeof raw === "string" ? new Date(raw) : raw;
    if (
      !(date instanceof Date) ||
      isNaN(date.getTime()) ||
      date.getFullYear() < 1753
    )
      return null;
    return typeof raw === "string" ? raw : date.toISOString();
  };

  const handleEdit = (row: DTO_OrdenServicio) => {
    setClienteNombreNota(row.notaOrdenServicio || "");
    const cleanedNote = row.notaOrdenServicio?.split("|").pop()?.trim() || "";
    const copy: any = {
      ...row,
      notaOrdenServicio: cleanedNote,
      iD_Negocio: row.iD_Negocio,
      fechaInicio: normalizeIncomingDate(row.fechaInicio),
      fechaFinal: normalizeIncomingDate(row.fechaFinal),
      fechaEntrega: normalizeIncomingDate(row.fechaEntrega),
      fechaEstimadaEntrega: normalizeIncomingDate(row.fechaEstimadaEntrega),
    };
    const clienteMatch = row.notaOrdenServicio?.match(/Cliente:\s*([^|]+)/);
    const clienteNombre = clienteMatch ? clienteMatch[1].trim() : "";
    setSelectedClientOption({
      value: row.iD_Cliente || 0,
      label: clienteNombre,
    });
    setEditData(copy);
    setShowEditForm(true);
  };

  // Campos personalizados para editar
  const editFormFields: FieldConfig<DTO_OrdenServicio>[] = [
    ...ordenServicioFormEditFields,
    {
      key: "iD_Cliente",
      label: "Cliente",
      type: "custom",
      order: 4,
      required: true,
      renderer: ({ onChange }) => (
        <AsyncClientSelect
          value={selectedClientOption}
          onChange={(opt) => {
            setSelectedClientOption(opt);
            onChange(opt?.value || 0);
          }}
        />
      ),
    },
    {
      key: "estado",
      label: "Estado de la orden",
      type: "custom",
      order: 5,
      required: true,
      renderer: ({ value, onChange }) => {
        const selectedOption = value?.iD_Estado
          ? { value: value.iD_Estado, label: value.nombre || "" }
          : null;
        return (
          <AsyncSelect
            cacheOptions
            defaultOptions={STATUS_ORDEN_SERVICIO_OPTIONS}
            placeholder="Seleccione un estado"
            value={selectedOption}
            onChange={(opt) =>
              onChange({ iD_Estado: opt?.value, nombre: opt?.label })
            }
            loadOptions={async (inputValue) =>
              STATUS_ORDEN_SERVICIO_OPTIONS.filter((opt) =>
                opt.label.toLowerCase().includes(inputValue.toLowerCase())
              )
            }
            isDisabled={
              editData?.estado?.nombre === "Archivado" ||
              editData?.estado?.iD_Estado === STATUS_TBL.ORDER_SERVICE.ARCHIVED
            }
          />
        );
      },
    },
    ...buildReferencesfFields(editData),
  ];

  const handleSaveEdit = () => {
    if (!selectedBusiness) return;
    setLoadingForm(true);
    const sanitized: any = { ...editData };
    sanitized.iD_Negocio = selectedBusiness.iD_Negocio;

    [
      "fechaInicio",
      "fechaFinal",
      "fechaEntrega",
      "fechaEstimadaEntrega",
    ].forEach((key) => {
      const raw = sanitized[key] ?? null;
      const d = raw ? dateHelpers.parseDateInput(raw) : null;
      sanitized[key] =
        d && d.getFullYear() >= RESTRICCIONES.MIN_ANNO_PERMITIDO ? d : null;
    });

    validacion = valida_DTO_OrdenServicio.validar(sanitized, "U");
    setErroresValidacion(validacion);
    if (validacion.length === 0) {
      ordenesService.actualizarOrdensDeServicio(sanitized).subscribe({
        next: (res: DTO_Respuesta) => {
          notificationHelpers.successAlert(res.mensaje);
          setShowEditForm(false);
        },
        error: errorHelpers.serverError,
        complete: () => setLoadingForm(false),
      });
    } else {
      setLoadingForm(false);
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }

    let clienteNombre = "";
    if (clienteNombreNota) {
      const match = clienteNombreNota.match(/Cliente:\s*([^|]+)/);
      if (match && match[1]) {
        clienteNombre = match[1].trim();
      }
    }
    sanitized.notaOrdenServicio = clienteNombre
      ? `Cliente: ${clienteNombre} | ${editData.notaOrdenServicio}`
      : editData.notaOrdenServicio;

    setOrdenes((prev) =>
      prev.map((o) =>
        o.iD_OrdenServicio === sanitized.iD_OrdenServicio ? sanitized : o
      )
    );
  };
  //#endregion

  // #region 🗑 Eliminar Orden
  const [orderToDelete, setOrderToDelete] =
    useState<DTO_OrdenServicio | null>();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmContext, setConfirmContext] = useState<
    "cancelAdd" | "delete" | null
  >(null);

  const handleDelete = (row: DTO_OrdenServicio) => {
    setConfirmModalMessage(
      `¿Estás seguro de que deseas eliminar la orden ${row.notaOrdenServicio}?`
    );
    setOrderToDelete(row);
    setConfirmContext("delete");
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = (action: boolean | null) => {
    if (action && orderToDelete) {
      setLoadingForm(true);
      const updated: DTO_OrdenServicio = {
        ...orderToDelete,
        estado: {
          ...orderToDelete.estado!,
          iD_Estado: STATUS_TBL.ORDER_SERVICE.DELETED,
        },
      };

      const dateKeys = [
        "fechaInicio",
        "fechaFinal",
        "fechaEntrega",
        "fechaEstimadaEntrega",
      ];
      const sanitized: any = { ...updated };

      dateKeys.forEach((key) => {
        const raw = sanitized[key] ?? null;
        const date = raw ? new Date(raw) : null;
        sanitized[key] =
          !date || isNaN(date.getTime()) || date.getFullYear() < 1753
            ? null
            : date;
      });

      setOrdenes((prev) =>
        prev.map((o) =>
          o.iD_OrdenServicio === sanitized.iD_OrdenServicio ? sanitized : o
        )
      );

      ordenesService.actualizarOrdensDeServicio(sanitized).subscribe({
        next: (res) => {
          if(res.resultado){
            notificationHelpers.infoAlert(res?.mensaje.replace("actualizó", "eliminó"))
          }else{
           notificationHelpers.infoAlert(res?.mensaje)
          }
         
        },
        error: errorHelpers.serverError,
        complete: () => setLoadingForm(false),
      });
    }
    setOrderToDelete(null);
    setIsConfirmOpen(false);
    setConfirmContext(null);
  };
  //#endregion

  // #region ⚡ Confirm Modal
  const confirmModalAcion = (action: boolean | null) => {
    if (action) {
      if (confirmContext === "cancelAdd") {
        setIsFormOpen(false);
        notificationHelpers.infoAlert("Nueva Orden descartada correctamente");
        setErroresValidacion([]);
      } else if (confirmContext === "delete") {
        handleConfirmDelete(true);
        setRowTableSelected(undefined);
        setShowEditForm(false);
      }
    }
    setIsConfirmOpen(false);
    setConfirmContext(null);
  };
  //#endregion

  // #region 🧩 Ítems de Orden
  const [showItemsOrdenFormModal, setShowItemsOrdenFormModal] = useState(false);
  const [dataToItemsOrder, setDataToItemsOrder] =
    useState<DTO_OrdenServicio | null>(null);
  //#endregion

  // #region 🧱 Referencias y Renderers
  const customRenderers = {
    fechaOrdenServicio: (val: unknown) => {
      if (!val) return "";
      const date = new Date(String(val));
      // Si la fecha es inválida o es 1/1/1 (año 1), mostrar vacío
      if (isNaN(date.getTime()) || date.getFullYear() <= 1) return "";
      return date.toLocaleDateString();
    },
    fechaEstimadaEntrega: (val: unknown) => {
      if (!val) return "";
      const date = new Date(String(val));
      if (isNaN(date.getTime()) || date.getFullYear() <= 1) return "";
      return date.toLocaleDateString();
    },
  };

  const referenciaJSONColumn = {
    title: labelMapOrdenDeServicio["referenciaJSON"],
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

  // #region 🧠 Memo tabla
  const { data } = useMemo(() => {
    const referenceMap = new Map<string, string>();
    ordenes.forEach((o) => {
      o.referenciaJSON?.forEach((r) => {
        referenceMap.set(r.nombre, generateSafeKey(r.nombre));
      });
    });

    // ✅ Filtrar órdenes eliminadas
    const ordenesActivas = ordenes.filter(
      (o) => o.estado?.iD_Estado !== STATUS_TBL.ORDER_SERVICE.DELETED
    );

    const prepared = ordenesActivas.map((o) => {
      const copy: any = { ...o };
      o.referenciaJSON?.forEach(
        (r) => (copy[referenceMap.get(r.nombre)!] = r.valor)
      );
      return copy;
    });

    const extLabelMap = { ...labelMapOrdenDeServicio };
    referenceMap.forEach((safe, raw) => {
      extLabelMap[safe] = raw;
    });

    return {
      data: prepared,
      labelMap: extLabelMap,
    };
  }, [ordenes]);
  //#endregion

  // #region ℹ️ Info Modal
  const [rowTableSelected, setRowTableSelected] = useState<DTO_OrdenServicio>();
  const infoModalFields: FieldConfig<DTO_OrdenServicio>[] = [
    ...keysInfoModalOrdenDeServicio,
    {
      key: "referenciaJSON",
      label: "Referencias",
      type: "custom",
      order: 9,
      renderer: ({ value }) => <ReferenciaCards items={value ?? []} />,
    },
  ];
  //#endregion

  // #region 🏦 Crear Cuenta de Orden de Servicio
  const [account, setAccount] = useState<DTO_Cuenta>();
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [detalleHabilitado, setDetalleHabilitado] = useState<boolean>(
    !!account?.detalleJSON
  );
  const [montoInput, setMontoInput] = useState<string>(
    account?.monto && account?.monto !== 0 ? String(account?.monto) : ""
  );

  const getItemsToOrderServiceAccount = (
    rowData: DTO_OrdenServicio
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!rowData) return resolve();

      const request = {
        iD_OrdenServicio: rowData.iD_OrdenServicio,
      } as DTO_ItemOrdenServicio;

      itemsOrdenesService.obtenerItemsOrdensDeServicio(request).subscribe({
        next: (result: DTO_Respuesta) => {
          if (!result.tipoRespuesta) {
            notificationHelpers.errorAlert(
              result.mensaje || "Error al cargar ítems"
            );
            return reject();
          }

          const raw = result.resultado?.[0];
          const items = Array.isArray(raw)
            ? (raw as DTO_ItemOrdenServicio[])
            : [];

          const cuenta: DTO_Cuenta = {
            ...new DTO_Cuenta(),
            iD_Negocio: rowData.iD_Negocio ?? 0,
            iD_OrdenServicio: rowData.iD_OrdenServicio,
            tipoCuenta: "Cuenta Por Cobrar",
            concepto: `Cobro de Orden de Servicio #${rowData.iD_OrdenServicio}`,
            monto: items.reduce(
              (acc, item) =>
                acc +
                (typeof item.monto === "number"
                  ? item.monto
                  : parseFloat(item.monto ?? "0")),
              0
            ),
            detalleJSON: {
              filas: items.map((item) => ({
                nombre:
                  item.nombreItemOrdenServicio ||
                  `Item ${item.iD_ItemOrdenServicio}`,
                valor:
                  typeof item.monto === "string"
                    ? item.monto
                    : item.monto?.toString() || "0.00",
                cantidad: item.cantidad?.toString() ?? "1",
              })),
              descuento: { nombre: "Monto", valor: "0" },
              impuesto: { nombre: "Impuesto", valor: "0" },
            },
          };

          setAccount(cuenta);
          resolve();
        },
        error: (err) => {
          errorHelpers.serverError(err);
          reject(err);
        },
      });
    });
  };

  const formCreateAccountFields: FieldConfig<any>[] = [
    ...ordenservicioFormCrearCuenta,
    ...(account?.iD_OrdenServicio
      ? [
          {
            key: "iD_OrdenServicio",
            label: "Orden De Servicio #",
            type: "text",
            readOnly: true,
            order: 4,
          } as FieldConfig<any>,
        ]
      : []),
    {
      key: "tipoCuenta",
      label: "Tipo de Cuenta",
      type: "custom",
      required: false,
      order: 4,
      readOnly: true,
      renderer: ({ value }) => (
        <input
          className="form-control"
          value={value || "Cuenta Por Cobrar"}
          readOnly
          disabled
        />
      ),
    },
    {
      key: "detalleJSON",
      label: "Detalle",
      type: "custom",
      //required: detalleHabilitado,
      required: false,
      order: 10,
      errorMessage:
        "Tienes datos sin agregar. Presiona el botón ➕ antes de continuar.",
      renderer: ({ value, onChange }) => (
        <DetalleCuentaInput
          value={value}
          onChange={onChange}
          monto={account?.monto ?? 0}
          setMonto={(val) => {
            setMontoInput(val !== 0 ? String(val) : "");
            setAccount((prev) => (prev ? { ...prev, monto: val } : undefined));
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
            <input
              type="text"
              className={`form-control fw-bold fs-5 text-start ${
                detalleHabilitado ? "bg-light" : ""
              }`}
              readOnly={detalleHabilitado}
              value={
                montoInput !== ""
                  ? montoInput
                  : account?.monto !== undefined && account?.monto !== 0
                  ? String(account.monto)
                  : ""
              }
              onFocus={() => {
                if ((account?.monto || 0) === 0) {
                  setMontoInput("");
                }
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setMontoInput(val);
                const num = parseFloat(val);
                setAccount((prev) =>
                  prev ? { ...prev, monto: isNaN(num) ? 0 : num } : undefined
                );
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val === "" || isNaN(Number(val))) {
                  setMontoInput("");
                  setAccount((prev) =>
                    prev ? { ...prev, monto: 0 } : undefined
                  );
                }
              }}
              placeholder="₡0.00"
              min={0}
              step={0.01}
            />
          </div>
        );
      },
    },
  ];

  const handleCreateAccount = (cuenta: DTO_Cuenta) => {
    if (!cuenta.iD_Negocio || !cuenta.iD_OrdenServicio) {
      notificationHelpers.errorAlert("Negocio u Orden de Servicio no válidos");
      return;
    }

    setLoadingForm(true);
    validacion = valida_DTO_Cuenta.validar(cuenta, "C");
    setErroresValidacion(validacion);
    if (validacion.length === 0) {
      cuentasService.registrarCuenta(cuenta).subscribe({
        next: (res: DTO_Respuesta) => {
          notificationHelpers.successAlert(res.mensaje);
          setShowCreateAccount(false);

          const ordenToUpdate = {
            ...editData,
            estado: {
              ...editData.estado,
              iD_Estado: STATUS_TBL.ORDER_SERVICE.ARCHIVED,
              nombre: "Archivado",
            },
          } as DTO_OrdenServicio;

          ordenesService.actualizarOrdensDeServicio(ordenToUpdate).subscribe({
            next: (updateRes: DTO_Respuesta) => {
              notificationHelpers.successAlert(
                "la Orden fue archivada correctamente"
              );

              let updatedOrden: DTO_OrdenServicio;

              if (
                Array.isArray(updateRes.resultado) &&
                updateRes.resultado.length > 0
              ) {
                updatedOrden = updateRes.resultado[0] as DTO_OrdenServicio;
              } else if (
                updateRes.resultado &&
                typeof updateRes.resultado === "object" &&
                !Array.isArray(updateRes.resultado)
              ) {
                updatedOrden = updateRes.resultado as DTO_OrdenServicio;
              } else {
                updatedOrden = ordenToUpdate;
              }

              setOrdenes((prev) =>
                prev.map((o) =>
                  o.iD_OrdenServicio === updatedOrden.iD_OrdenServicio
                    ? {
                        ...o,
                        ...updatedOrden,
                      }
                    : o
                )
              );

              setEditData(updatedOrden);
            },
            error: errorHelpers.serverError,
          });
        },
        error: errorHelpers.serverError,
        complete: () => setLoadingForm(false),
      });
    } else {
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }
  };

  // Método para manejar la acción de crear cuenta, reutilizable para editar y ver info
  const handleCreateAccountButton = (orden: DTO_OrdenServicio | undefined) => {
    if (
      orden?.estado?.nombre === "Archivado" ||
      orden?.estado?.iD_Estado === STATUS_TBL.ORDER_SERVICE.ARCHIVED
    ) {
      const toast = document.createElement("div");
      toast.className =
        "toast align-items-center text-bg-info border-0 show position-fixed top-0 start-50 translate-middle-x";
      toast.style.zIndex = "9999";
      toast.style.minWidth = "300px";
      toast.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
          <strong>Cuenta ya registrada</strong><br/>
          Esta orden de servicio ya tiene una cuenta asociada. No es posible crear una nueva cuenta para esta orden.
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
        `;
      document.body.appendChild(toast);

      const removeToast = () => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      };
      setTimeout(removeToast, 6000);
      toast.querySelector(".btn-close")?.addEventListener("click", removeToast);
    } else if (orden) {
      getItemsToOrderServiceAccount(orden).then(() => {
        setShowCreateAccount(true);
      });
    }
  };

  const headerButtonsToEdit = [
    {
      titulo: "Eliminar",
      onClick: () => {
        handleDelete(editData!);
      },
      className: "btn btn-bg-light btn-active-color-danger",
    },
    {
      titulo: "Crear Cuenta",
      onClick: () => handleCreateAccountButton(editData),
      className: "btn btn-bg-light btn-active-color-info",
      icon: (editData?.estado?.nombre === "Archivado" ||
        editData?.estado?.iD_Estado === STATUS_TBL.ORDER_SERVICE.ARCHIVED) && (
        <span className="ms-2" style={{ cursor: "pointer", color: "#0d6efd" }}>
          <i className="bi bi-info-circle"></i>
        </span>
      ),
    },
  ];

  // Botones para InfoModal usando rowTableSelected
  const headerButtonsToInfo = [
    {
      titulo: "Eliminar",
      onClick: () => {
        handleDelete(rowTableSelected!);
      },
      className: "btn btn-bg-light btn-active-color-danger",
    },
    {
      titulo: "Crear Cuenta",
      onClick: () => handleCreateAccountButton(editData),
      className: "btn btn-bg-light btn-active-color-info",
      icon: (editData?.estado?.nombre === "Archivado" ||
        editData?.estado?.iD_Estado === STATUS_TBL.ORDER_SERVICE.ARCHIVED) && (
        <span className="ms-2" style={{ cursor: "pointer", color: "#0d6efd" }}>
          <i className="bi bi-info-circle"></i>
        </span>
      ),
    },
  ];
  //#endregion

  //#region 🧩 Botones de la tabla
  const dataTableButtons: DynamicButtonConfig[] = [
    {
      titulo: "Ver Items",
      icon: <i className="bi bi-check2-square fs-5"></i>,
      onClick: (row) => {
        setShowItemsOrdenFormModal(true);
        setDataToItemsOrder(row as DTO_OrdenServicio);
      },
    },
  ];
  //#endregion

  // #region 🧩 Render
  return (
    <>
    <Toolbar titulo="Ordenes de servicio" addButton onAdd={handleAddNew}/>

    <div className="row p-4 gx-0">
      {state.negocio == null ? (
        <InfoPanel msj="Seleccione un negocio para ver sus órdenes de servicio." />
      ) : (
        <>
          <GenericDataTable<DTO_OrdenServicio & Record<string, string>>
            title="Órdenes de servicio"
            columnKeys={columnKeysOrdenDeServicio}
            labelMap={labelMapOrdenDeServicio}
            data={data}
            onAdd={handleAddNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
            disableButtonAdd={disableButtonAdd}
            includeEstadoColumn
            dataTableButtons={dataTableButtons}
            onRowClick={(rowData) => {
              setEditData(rowData as DTO_OrdenServicio);
              setRowTableSelected(rowData as DTO_OrdenServicio);
            }}
            customColumns={[referenciaJSONColumn]}
            customRenderers={customRenderers}
          />

          <InfoModal
            show={!!rowTableSelected}
            onHide={() => setRowTableSelected(undefined)}
            data={rowTableSelected!}
            fields={infoModalFields}
            headerButtons={headerButtonsToInfo}
          />

          {/* Modal Registrar */}
          <GenericFormModal<DTO_OrdenServicio>
            title="Registrar orden"
            show={isFormOpen}
              onHide={handleCancelAdd}
              loading={loadingForm}
            data={formData}
            setData={setFormData}
            onSubmit={handleSave}
            fields={newFormFields}
            erroresValidacion={erroresValidacion}
            onEliminarError={eliminarError}
          />

          {/* Modal Registrar Cliente */}
          <GenericFormModal
            title="Registrar cliente"
            show={isModalRegisterClientOpen}
              onHide={() => setIsModalRegisterClientOpen(false)}
              loading={loadingForm}
            data={newClientData}
            setData={setNewClientData}
            onSubmit={handleSaveNewClient}
            fields={clienteFormEditFields}
            erroresValidacion={erroresValidacion}
            onEliminarError={eliminarError}
          />

          {/* Modal Editar */}
          <GenericFormModal<DTO_OrdenServicio>
            title="Editar orden de servicio"
            show={showEditForm}
              onHide={() => setShowEditForm(false)}
              loading={loadingForm}
            data={editData}
            setData={setEditData}
            onSubmit={handleSaveEdit}
            fields={editFormFields}
            headerButtons={headerButtonsToEdit}
            erroresValidacion={erroresValidacion}
            onEliminarError={eliminarError}
          />

          {/* Modal Crear Cuenta */}
          <GenericFormModal<DTO_Cuenta>
            title="Crear cuenta"
            show={showCreateAccount}
              onHide={() => setShowCreateAccount(false)}
              loading={loadingForm}
            data={account!}
            setData={(x) => setAccount(x as DTO_Cuenta)}
            onSubmit={() => {
              if (account) {
                handleCreateAccount(account);
              }
            }}
            fields={formCreateAccountFields}
            onEliminarError={eliminarError}
            erroresValidacion={erroresValidacion}
          />

          <ItemsOrdenDeServicioModal
            open={showItemsOrdenFormModal}
            onHide={() => setShowItemsOrdenFormModal(false)}
            rowData={dataToItemsOrder || new DTO_OrdenServicio()}
            negocio={state.negocio}
          />

          {/* === Modal Genérico: Confirmación === */}
          <ConfirmModal
            show={isConfirmOpen}
            confirmMessage={confirmModalMessage}
            onAction={confirmModalAcion}
          />

          {/* Modal para advertir que no hay clientes registrados */}
          {showNoClientsModal && (
            <div
              className="modal fade show d-block shadowDarkBackground"
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">No hay clientes registrados</h5>
                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Cerrar"
                      onClick={() => setShowNoClientsModal(false)}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="d-flex align-items-start">
                      <span className="me-3">
                        <i className="bi bi-exclamation-triangle-fill text-warning fs-3"></i>
                      </span>
                      <div>
                        <p>
                          Debes registrar al menos un cliente antes de crear una
                          orden de servicio.
                          <br />
                          <Link
                            to={ROUTES.CLIENTS}
                            className="fw-semibold d-inline-flex align-items-center gap-2 ms-1"
                            onClick={() => {
                              setShowNoClientsModal(false);
                            }}
                          >
                            Ir a registrar clientes
                            <i className="bi bi-person-plus-fill"></i>
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => {
                        setShowNoClientsModal(false);
                      }}
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setShowNoClientsModal(false);
                        navigate(ROUTES.CLIENTS);
                      }}
                    >
                      {" "}
                      <i className="bi bi-person-plus-fill"></i>
                      Ir a registrar clientes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
  // #endregion
};
// #endregion
