import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
//@ts-expect-error -- error esperado
import sonidoMonitor from "../../assets/media/audios/Monitor.mp3?url";
import {
  errorHelpers,
  notificationHelpers,
  ordenservicioFormCrearCuenta,
} from "@/utils";
import {
  DetalleCuentaInput,
  FieldConfig,
  GenericFormModal,
  InfoPanel,
  LoadingPanel,
  OrdenesSeccion,
} from "@/components";
import {
  DTO_Cuenta,
  DTO_ItemOrdenServicio,
  DTO_Negocio,
  DTO_OrdenServicio,
  DTO_Param,
  DTO_Respuesta,
} from "@/models";
import {
  monitorService,
  itemsOrdenesService,
  ordenesService,
  cuentasService,
} from "@/services";
import { STATUS_TBL } from "@/constants";
import { useApp } from "@/hooks/useApp";
import { valida_DTO_Cuenta } from "@/validators/valida_DTO_Cuenta";

export const Monitor = () => {
  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  let validacion: Array<DTO_Param>;
  const eliminarError = (campo: string) => {
    setErroresValidacion((prev) => prev.filter((e) => e.nombre !== campo));
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

  const [estadoConexion, setEstadoConexion] = useState("Desconectado");
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const audio = useRef(new Audio(sonidoMonitor));
  const intentoRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [ordenes, setOrdenes] = useState<DTO_OrdenServicio[]>([]);
  const [items, setItems] = useState<DTO_ItemOrdenServicio[]>([]);
  const retryTimeoutRef = useRef<number | null>(null);
  const abortedRef = useRef(false);
  const [account, setAccount] = useState<DTO_Cuenta>();
  const [detalleHabilitado, setDetalleHabilitado] = useState<boolean>(
    !!account?.detalleJSON
  );
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [editData, setEditData] = useState<DTO_OrdenServicio>(() => {
    const dto = new DTO_OrdenServicio();
    dto.fechaInicio = null;
    dto.fechaFinal = null;
    dto.fechaEntrega = null;
    dto.fechaEstimadaEntrega = null;
    return dto;
  });

  const [montoInput, setMontoInput] = useState<string>(
    account?.monto && account?.monto !== 0 ? String(account?.monto) : ""
  );

  const isItemOrdenServicio = (obj: any): obj is DTO_ItemOrdenServicio => {
    return obj && typeof obj === "object" && "iD_ItemOrdenServicio" in obj;
  };

  const isOrdenServicio = (obj: any): obj is DTO_OrdenServicio => {
    return obj && typeof obj === "object" && "iD_Cliente" in obj;
  };

  const [selectedBusiness, setSelectedBusiness] = useState<DTO_Negocio | null>(
    null
  );

  const cambiarEstadoOrdenServicio = (
    orden: DTO_OrdenServicio,
    estado: number
  ) => {
    orden.estado.iD_Estado = estado;
    const rawNote = orden.notaOrdenServicio || "";

    const cleanedNote = rawNote.includes("|")
      ? rawNote.substring(rawNote.lastIndexOf("|") + 1).trim()
      : rawNote.trim();

    orden.notaOrdenServicio = cleanedNote;
    ordenesService.actualizarOrdensDeServicio(orden).subscribe({
      next: (result) => {
        notificationHelpers.infoAlert(result?.mensaje);
      },
      error: (err) => errorHelpers.serverError(err),
    });
  };

  // Maneja la selección de un negocio
  const handleSelectBusiness = (neg: DTO_Negocio) => {
    setSelectedBusiness(neg);
  };

  // Maneja el avance de un item
  const handleCheckboxChange = (
    item: DTO_ItemOrdenServicio,
    checked: boolean
  ) => {
    if (checked) {
      item.avance = 100;
    } else {
      item.avance = 0;
    }

    itemsOrdenesService.actualizarItemsOrdensDeServicio(item).subscribe({
      next: (res) => {
        if (!(res as DTO_Respuesta).tipoRespuesta) {
          notificationHelpers.errorAlert((res as DTO_Respuesta).mensaje);
        }
      },
      error: (err) => errorHelpers.serverError(err),
      complete: () => setLoading(false),
    });
  };

  //#region websoket
  const getToken = () => localStorage.getItem("accesToken") || "";


  useEffect(() => {
    abortedRef.current = false;

    const limpiarConexion = async () => {
      if (connectionRef.current) {
        connectionRef.current.off("RecibirNotificacion");
        try {
          await connectionRef.current.stop();
        } catch {
          console.log("Error limpiando conexión");
        }
        connectionRef.current = null;
      }
    };

    const construirConexion = () =>
      new signalR.HubConnectionBuilder()
        .withUrl(window.__APP_CONFIG__!.BASE_URL + "/hub/monitorOSHub", {
          accessTokenFactory: () => getToken(),
          withCredentials: true,
        })
        .configureLogging(signalR.LogLevel.None)
        .build();

    const extraerYRenovarToken = async (payloadText: string) => {
      const match = payloadText.match(/{.*}/s);
      if (!match) return false;
      try {
        const json = JSON.parse(match[0]);
        const nt = json?.resultado?.[0]?.accesToken;
        if (nt) {
          localStorage.setItem("accesToken", nt);
          //console.info("🆕 Token renovado desde negociación SignalR");
          return true;
        }
      } catch {
        console.log("error estrayendo el token retornado");
      }
      return false;
    };

    const handleDisconnect = async (error?: Error) => {
      if (abortedRef.current || connectionRef.current?.state == "Connected") return;

      setEstadoConexion("Desconectado");
      notificationHelpers.errorAlert("Monitor desconectado");

      // Intentar renovar token si viene en el error
      if (error?.message.includes('"accesToken"')) {
        const renovado = await extraerYRenovarToken(error.message);
        if (renovado && !abortedRef.current) {
          // Pequeño retardo antes de reconectar
          await new Promise((r) => setTimeout(r, 4000));
          iniciarConexion();
        }
      }
 
      // Reintento normal
      else if (!abortedRef.current) {
        // Usar retryTimeoutRef.current para almacenar el ID del timeout
        if(connectionRef.current?.state == signalR.HubConnectionState.Disconnected){
          await new Promise((r) => setTimeout(r, 4000));
          iniciarConexion();
        }
        // `setTimeout` devuelve un número en el navegador
      }
    };

    const handleMensaje = (msg: any) => {
      if (abortedRef.current) return;

      /* --- qué recibimos --- */
      if (isItemOrdenServicio(msg)) {
        //Aquí entra si es un item de orden de servicio
        setItems((prev) => {
          const idx = prev.findIndex(
            (i) => i.iD_ItemOrdenServicio === msg.iD_ItemOrdenServicio
          );

          /* —— 1 · Eliminar si el estado es 19 —— */
          if (msg.estado?.iD_Estado === 19) {
            // si no existe, devolvemos el array tal cual
            return idx === -1 ? prev : prev.filter((_, i) => i !== idx);
          }

          /* —— 2 · Insertar o actualizar —— */
          return idx === -1
            ? [...prev, msg] // insertar
            : prev.map(
                (
                  i // actualizar
                ) =>
                  i.iD_ItemOrdenServicio === msg.iD_ItemOrdenServicio
                    ? { ...i, ...msg }
                    : i
              );
        });

        notificationHelpers.infoAlert(
          `Ítem actualizado: ${msg.nombreItemOrdenServicio} de la Orden # ${msg.iD_OrdenServicio}`
        );

        //Aquí entra si es una orden de servicio
      } else if (isOrdenServicio(msg)) {
        setOrdenes((prev) => {
          const idx = prev.findIndex(
            (o) => o.iD_OrdenServicio === msg.iD_OrdenServicio
          );

          /* —— 1 · Eliminar si el estado es 19 —— */
          if (msg.estado?.iD_Estado === 10) {
            // si no existe, devuelve el array original
            return idx === -1 ? prev : prev.filter((_, i) => i !== idx);
          }

          /* —— 2 · Insertar o actualizar —— */
          return idx === -1
            ? [...prev, msg] // insertar
            : prev.map(
                (
                  o // actualizar
                ) =>
                  o.iD_OrdenServicio === msg.iD_OrdenServicio
                    ? { ...o, ...msg }
                    : o
              );
        });
      } else {
        console.warn("Tipo desconocido", msg);
        notificationHelpers.infoAlert("📢 Nuevo mensaje");
      }
      audio.current.play().catch(() => {});
    };

    const handleReconnecting = () => {
      if (abortedRef.current) return;
      setEstadoConexion("Reconectando...");
      notificationHelpers.infoAlert(
        "Conexión perdida, intentando reconectar..."
      );
    };

    const handleReconnected = () => {
      if (abortedRef.current) return;
      setEstadoConexion("Conectado");
      notificationHelpers.successAlert("Reconectado al monitor");
    };

    const iniciarConexion = async () => {
      if (abortedRef.current || intentoRef.current) return;

      intentoRef.current = true;

      await limpiarConexion();


      if (abortedRef.current) {
        intentoRef.current = false;
        return;
      }

      const token = getToken();
      if (!token) {
        notificationHelpers.errorAlert("Token no disponible.");
        intentoRef.current = false;
        return;
      }

      const connection = construirConexion();
      connectionRef.current = connection;

      connection.on("RecibirNotificacion", handleMensaje);
      connection.onreconnecting(handleReconnecting);
      connection.onreconnected(handleReconnected);
      connection.onclose(handleDisconnect);

        
      if (state.negocio != null) {
        try {
          await connection.start();
          if (abortedRef.current) {
            intentoRef.current = false;
            return;
          }
          setEstadoConexion("Conectado");
          notificationHelpers.successAlert("Monitor conectado");
        } catch (err: unknown) {
          // Primero, intentamos renovar token si aplica
          const texto = err instanceof Error ? err.message : String(err);
          const renovado = await extraerYRenovarToken(texto);
          if (renovado && !abortedRef.current) {
            await new Promise((r) => setTimeout(r, 500));
            intentoRef.current = false;
            return iniciarConexion();
          }
          // Si no era token, o no pudimos renovar, manejamos desconexión
          await handleDisconnect(err instanceof Error ? err : undefined);
        } finally {
          intentoRef.current = false;
        }
      }
    };
    iniciarConexion();
  
    if(connectionRef.current?.state == "Disconnected" || connectionRef.current?.state == undefined)
    intentoRef.current = false;

    return () => {
      if (state.negocio != null) {
        abortedRef.current = true;
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current); // Limpiar usando retryTimeoutRef.current
        }
        limpiarConexion().then(() => {
          setEstadoConexion("Desconectado");
          notificationHelpers.infoAlert("Monitor cerrado");
        });
      }
    };
  }, [state]);
  //#endregion

  //#region crear cuenta
  const handleCreateAccountButton = (orden: DTO_OrdenServicio | undefined) => {
    setEditData(orden || new DTO_OrdenServicio());

    if (orden) {
      getItemsToOrderServiceAccount(orden).then(() => {
        setShowCreateAccount(true);
      });
    }
  };

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
                cantidad:
                  typeof item.cantidad === "string"
                    ? item.cantidad
                    : item.cantidad?.toString() || "0.00",
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
      notificationHelpers.errorAlert("Negocio o Orden de Servicio no válidos");
      return;
    }
    validacion = valida_DTO_Cuenta.validar(cuenta, "C");
    setErroresValidacion(validacion);
    if (validacion.length === 0) {
      cuentasService.registrarCuenta(cuenta).subscribe({
        next: (res: DTO_Respuesta) => {
          notificationHelpers.successAlert(res.mensaje);
          setShowCreateAccount(false);

          const ordenToUpdate: DTO_OrdenServicio = {
            ...editData,
            estado: {
              ...editData.estado,
              iD_Estado: STATUS_TBL.ORDER_SERVICE.ARCHIVED,
              nombre: "Archivado",
            },
          };

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
      });
    } else {
      notificationHelpers.warningAlert(
        "Por favor valida los datos ingresados nuevamente"
      );
    }
  };
  //#endregion crear cuenta
  //#region cargar monitor

  // 4. Cargar órdenes al seleccionar un negocio
  useEffect(() => {
    if (!selectedBusiness) return;
    setLoading(true);

    const sub = monitorService
      .cargarMonitorOrdenServicio(selectedBusiness)
      .subscribe({
        next: (res) => {
          setOrdenes(
            ((res as DTO_Respuesta).resultado[0] as DTO_OrdenServicio[]) || []
          );
          setItems(
            ((res as DTO_Respuesta).resultado[1] as DTO_ItemOrdenServicio[]) ||
              []
          );
        },
        error: (err) => errorHelpers.serverError(err),
        complete: () => setLoading(false),
      });

    return () => sub.unsubscribe();
  }, [selectedBusiness]);

  //#endregion

  //#region para manejo de cuentas

  //#endregion

  return (
    <div>
      {/* Modal Crear Cuenta */}
      <GenericFormModal<DTO_Cuenta>
        title="Crear Cuenta"
        show={showCreateAccount}
        onHide={() => setShowCreateAccount(false)}
        data={account!}
        setData={(x) => setAccount(x as DTO_Cuenta)}
        onSubmit={() => {
          if (account) {
            handleCreateAccount(account);
          }
        }}
        fields={formCreateAccountFields}
        erroresValidacion={erroresValidacion}
        onEliminarError={eliminarError}
      />
      
      {loading && <LoadingPanel msj="Cargando, por favor espere..." />}
      {state.negocio == null ? (
        <>
          <div className="row p-4 col-12 gx-0">
            <InfoPanel msj="Selecciona un negocio para ver el monitor." />
          </div>
        </>
      ) : loading ? (
        <LoadingPanel msj="Cargando, por favor espere..." />
      ) : (
        selectedBusiness && (
          <>
            <div id="kt_content_container" className="container-xxl">
              <div className="d-flex flex-wrap flex-stack pt-10 pb-8">
                <h3 className="fw-bolder my-2">
                  <span
                    style={{ marginRight: "5px", marginBottom: "-5px" }}
                    className={`badge badge-circle ${
                      estadoConexion === "Conectado"
                        ? " badge-success"
                        : " badge-danger"
                    }`}
                  ></span>
                  {selectedBusiness?.nombreNegocio}
                  <span className="fs-6 text-gray-400 fw-bold ms-1">
                    {estadoConexion}
                  </span>
                </h3>
              </div>
              <div className="row g-9">
                <OrdenesSeccion
                  titulo="Nuevo"
                  colorBarra="bg-secondary"
                  estado={STATUS_TBL.ORDER_SERVICE.NEW}
                  ordenes={ordenes}
                  items={items}
                  onAvanceChange={handleCheckboxChange}
                  onEstadoChange={cambiarEstadoOrdenServicio}
                />
                <OrdenesSeccion
                  titulo="En proceso"
                  colorBarra="bg-primary"
                  estado={STATUS_TBL.ORDER_SERVICE.IN_PROCESS}
                  ordenes={ordenes}
                  items={items}
                  onAvanceChange={handleCheckboxChange}
                  onEstadoChange={cambiarEstadoOrdenServicio}
                />
                <OrdenesSeccion
                  titulo="Completado"
                  colorBarra="bg-success"
                  estado={STATUS_TBL.ORDER_SERVICE.COMPLETED}
                  ordenes={ordenes}
                  items={items}
                  onAvanceChange={handleCheckboxChange}
                  onEstadoChange={cambiarEstadoOrdenServicio}
                  onClickCreateCount={handleCreateAccountButton}
                />
                <OrdenesSeccion
                  titulo="En espera"
                  colorBarra="bg-warning"
                  estado={STATUS_TBL.ORDER_SERVICE.PENDING}
                  ordenes={ordenes}
                  items={items}
                  onAvanceChange={handleCheckboxChange}
                  onEstadoChange={cambiarEstadoOrdenServicio}
                />
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
};
