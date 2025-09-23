// src/components/ProformaCrearEditarModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AsyncClientSelect,
  AsyncTarifaSelect,
  ClientOption,
  DecimalInput,
  Stepper,
  TarifarioOption,
} from "@/components";
import { useApp } from "@/hooks/useApp";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import {
  DTO_Proforma,
  DTO_ProformaItem,
  DTO_Respuesta,
  DTO_Estado,
  DTO_Param,
} from "@/models";
import {
  formatColones,
  notificationHelpers,
  procesarRespuesta,
  calcularTotales,
  TipoDescuento
} from "@/utils";
import {
  items_proformaService,
  proformaService
} from "@/services";
import { valida_DTO_Items_y_Proformas } from "@/validators/valida_DTO_Items_y_Proformas";
import { useScrollLockSmart } from "@/hooks";

// CONSTANTE de soft-delete para items
const PROFORMA_ITEM_DELETED = 30;

type Mode = "create" | "edit";

type Props = {
  show: boolean;
  mode: Mode;
  onClose: () => void;
  proforma?: DTO_Proforma | null;
  itemsIniciales?: DTO_ProformaItem[] | null;
  onRegistered?: (nuevaProforma: DTO_Proforma) => void;
  onUpdated?: (proformaActualizada: DTO_Proforma) => void;
};

type ItemLocal = {
  idTemp: string;
  iD_ProformaItem?: number;
  iD_Tarifa?: number | null;
  nombreItemProforma: string;
  descripcionItemProforma: string;
  precioItemProforma?: number;
  cantidadItemProforma?: number;
  _isNew?: boolean;
  _dirty?: boolean;
  _deleted?: boolean;
};

export const ProformaCrearEditarModal = (props: Props) => {
  const {
    show,
    mode,
    onClose,
    proforma,
    itemsIniciales,
    onRegistered,
    onUpdated,
  } = props;

  //#region App state negocio
  const { state } = useApp();
  const negocio = state.negocio;
  //#endregion

  //#region Scroll del body
  //Ajustes para el croll del body, para bloquearlo en cuando se abren los modales
  const modalRef = useRef<HTMLDivElement>(null);

  useScrollLockSmart(show, {
    rootRef: modalRef,
    fallbackSelector: ".app-scroll",
  });

  useEffect(() => {
    if (show) modalRef.current?.focus();
  }, [show]);
  //#endregion

  // Cabecera
  const [clienteOpt, setClienteOpt] = useState<ClientOption | null>(null);
  const [tabActive, setTabActive] = useState<"manual" | "tarifa">("manual");
  const [descuentoTipo, setDescuentoTipo] = useState<TipoDescuento>("Monto");
  const [descuentoValor, setDescuentoValor] = useState<number>();
  const [impuesto, setImpuesto] = useState<number>();
  const [observaciones, setObservaciones] = useState<string>("");
  const [fechaP, setFechaP] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [fechaV, setFechaV] = useState<string>(
    dayjs().add(15, "day").format("YYYY-MM-DD")
  );

  const [loadingForm, setLoadingForm] = useState(false);

  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  const eliminarError = (campo: string) => {
    setErroresValidacion((prev) => prev.filter((e) => e.nombre !== campo));
  };
  // Helpers de mapeo/lectura de errores
  const nombreValidadorToUI = (name: string): string => {
    if (name === "cliente") return "iD_Cliente"; // mapea a tu input visible
    return name;
  };
  const getErrors = (campo: string) =>
    erroresValidacion.filter((e) => e.nombre === campo);

  const focusByErrKey = (key: string) => {
    const el = document.querySelector<HTMLElement>(`[data-err="${key}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus?.();
    }
  };
  // #endregion

  // refs para foco/scroll
  const nombreRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Ítems
  const [items, setItems] = useState<ItemLocal[]>([
    {
      idTemp: uuid(),
      nombreItemProforma: "",
      descripcionItemProforma: "",
      precioItemProforma: undefined,
      cantidadItemProforma: 1,
      _isNew: true,
    },
  ]);
  const [tarifaSel, setTarifaSel] = useState<TarifarioOption | null>(null);

  // PDF
  const [loadingPDF, setLoadingPDF] = useState(false);

  // === Hidratación en modo edición (carga cabecera + ítems si no vienen) ===
  useEffect(() => {
    if (mode !== "edit" || !proforma) return;

    // Cabecera
    setClienteOpt(
      proforma.cliente
        ? {
            value: Number(proforma.iD_Cliente),
            label:
              `${(proforma.cliente as any)?.nombreCliente ?? ""} ${
                (proforma.cliente as any)?.apellidoCliente ?? ""
              }`.trim() || String(proforma.iD_Cliente),
          }
        : {
            value: Number(proforma.iD_Cliente),
            label: String(proforma.iD_Cliente),
          }
    );
    setFechaP(dayjs(proforma.fechaProforma ?? new Date()).format("YYYY-MM-DD"));
    setFechaV(
      dayjs(proforma.fechaVencimiento ?? dayjs().add(15, "day")).format(
        "YYYY-MM-DD"
      )
    );
    setObservaciones(proforma.observacionProforma ?? "");
    setDescuentoTipo(
      proforma.descuentoPorcentualProforma ? "Porcentaje" : "Monto"
    );
    setDescuentoValor(proforma.descuentoProforma ?? undefined);
    setImpuesto(proforma.impuestoPorcentualProforma ?? undefined);

    // Ítems
    if (!itemsIniciales || !itemsIniciales.length) {
      const sub = items_proformaService
        .obtenerItemsProformas({
          iD_Proforma: proforma.iD_Proforma,
        } as DTO_Proforma)
        .subscribe({
          next: (r: DTO_Respuesta) => {
            const list =
              (procesarRespuesta(r) as unknown as DTO_ProformaItem[]) || [];
            const mapped: ItemLocal[] = list.map((x) => ({
              idTemp: uuid(),
              iD_ProformaItem: x.iD_ProformaItem,
              iD_Tarifa: undefined,
              nombreItemProforma: x.nombreItemProforma,
              descripcionItemProforma: x.descripcionItemProforma ?? "",
              precioItemProforma: Number(x.precioItemProforma ?? 0),
              cantidadItemProforma: Number(x.cantidadItemProforma ?? 1),
              _isNew: false,
              _dirty: false,
              _deleted: x.estado?.iD_Estado === PROFORMA_ITEM_DELETED,
            }));
            setItems(
              mapped.length
                ? mapped
                : [
                    {
                      idTemp: uuid(),
                      nombreItemProforma: "",
                      descripcionItemProforma: "",
                      precioItemProforma: 0,
                      cantidadItemProforma: 1,
                      _isNew: true,
                    },
                  ]
            );
          },
          error: () => {
            setItems([
              {
                idTemp: uuid(),
                nombreItemProforma: "",
                descripcionItemProforma: "",
                precioItemProforma: 0,
                cantidadItemProforma: 1,
                _isNew: true,
              },
            ]);
          },
        });
      return () => sub.unsubscribe?.();
    } else {
      const mapped = itemsIniciales.map((x) => ({
        idTemp: uuid(),
        iD_ProformaItem: x.iD_ProformaItem,
        iD_Tarifa: undefined,
        nombreItemProforma: x.nombreItemProforma,
        descripcionItemProforma: x.descripcionItemProforma ?? "",
        precioItemProforma: Number(x.precioItemProforma ?? 0),
        cantidadItemProforma: Number(x.cantidadItemProforma ?? 1),
        _isNew: false,
        _dirty: false,
        _deleted: false,
      }));
      setItems(mapped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, proforma?.iD_Proforma]);

  //#region foco al agregar item

  const ensureFlashStyles = () => {
    const id = "dt-flash-row-style";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
@keyframes flashBorder { from { opacity: 1 } to { opacity: 0 } }

.flash-blue-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 30;
  border-radius: .5rem;
}
.flash-blue-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: inherit;
  background: var(--bs-primary, #3e96d2);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  animation: flashBorder 2s ease-out forwards;
}
.dt-flash-rel { position: relative !important; }

/* Desktop: overlay fijo al viewport */
.flash-row-fixed {
  position: fixed;
  pointer-events: none;
  z-index: 2000;
  border-radius: .5rem;
}
.flash-row-fixed::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: inherit;
  background: var(--bs-primary, #3e96d2);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  animation: flashBorder 2s ease-out forwards;
}
`;

    document.head.appendChild(s);
  };

  const rowRefs = useRef<
    Record<string, HTMLTableRowElement | HTMLDivElement | null>
  >({});

  const setRowRefVisibleOnly =
    (id: string) => (el: HTMLTableRowElement | HTMLDivElement | null) => {
      if (!el) return;
      try {
        const cs = getComputedStyle(el);
        const isHidden = cs.display === "none" || cs.visibility === "hidden";
        if (isHidden) return; // no guardar clones ocultos (d-none)
      } catch {
        // si getComputedStyle falla, igualmente guardamos
      }
      rowRefs.current[id] = el;
    };

  useEffect(() => {
    if (!lastAddedId) return;
    ensureFlashStyles();

    let cancelled = false;

    const raf1 = requestAnimationFrame(() => {
      if (cancelled) return;

      // 1) consigue el nodo visible
      let row = rowRefs.current[lastAddedId] as
        | HTMLDivElement
        | HTMLTableRowElement
        | null;

      if (!row) {
        row = document.querySelector(`[data-rowid="${lastAddedId}"]`) as
          | HTMLDivElement
          | HTMLTableRowElement
          | null;
      }
      if (!row) return;

      // 2) scroll primario hacia la fila
      row.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      // 2.b) scroll de respaldo dentro del contenedor del modal
      const container = modalBodyRef.current;
      if (container) {
        const rowRect = row.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        const desiredTop =
          rowRect.top -
          contRect.top +
          container.scrollTop -
          Math.max(0, container.clientHeight / 2 - rowRect.height / 2);

        container.scrollTo({
          top: Math.max(0, desiredTop),
          behavior: "smooth",
        });
      }

      // 3) highlight
      if (row instanceof HTMLDivElement) {
        // móvil: overlay interno
        row.classList.add("dt-flash-rel");
        const overlay = document.createElement("div");
        overlay.className = "flash-blue-overlay";
        row.appendChild(overlay);

        setTimeout(() => {
          overlay.remove();
          row.classList.remove("dt-flash-rel");
          setLastAddedId(null);
        }, 2200);
      } else if (row instanceof HTMLTableRowElement) {
        // desktop: overlay fijo al viewport
        const rect = row.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          // si aún no se midió, reintenta una vez
          requestAnimationFrame(() => setLastAddedId(lastAddedId));
          return;
        }
        const overlay = document.createElement("div");
        overlay.className = "flash-row-fixed";
        overlay.style.top = `${rect.top}px`;
        overlay.style.left = `${rect.left}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
        document.body.appendChild(overlay);

        setTimeout(() => {
          overlay.remove();
          setLastAddedId(null);
        }, 2200);
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
    };
  }, [lastAddedId, items.length]);

  //#endregion

  // Totales (solo ítems no eliminados)
  const itemsVigentes = useMemo(
    () => items.filter((i) => !i._deleted),
    [items]
  );
  const totales = useMemo(
    () =>
      calcularTotales(
        itemsVigentes,
        descuentoTipo,
        typeof descuentoValor === "number" ? descuentoValor : 0,
        typeof impuesto === "number" ? impuesto : 0
      ),
    [itemsVigentes, descuentoTipo, descuentoValor, impuesto]
  );

  // Handlers de ítems
  function addItemVacio() {
    const id = uuid();
    setItems((prev) => [
      {
        idTemp: id,
        nombreItemProforma: "",
        descripcionItemProforma: "",
        precioItemProforma: undefined,
        cantidadItemProforma: 1,
        _isNew: true,
      },
      ...prev,
    ]);
    setLastAddedId(id);
  }

  function addItemDesdeTarifa(opt: TarifarioOption | null) {
    setTarifaSel(opt);
    const id = uuid();
    if (!opt) return;
    const t = opt.tarifa;
    setItems((prev) => [
      {
        idTemp: id,
        iD_Tarifa: t.iD_Tarifa,
        nombreItemProforma: t.nombreTarifa,
        descripcionItemProforma: t.descripcionTarifa ?? "",
        precioItemProforma: Number(t.precioTarifa ?? 0),
        cantidadItemProforma: 1,
        _isNew: true,
      },
      ...prev,
    ]);
    setLastAddedId(id);
  }

  function patchItem(idTemp: string, patch: Partial<ItemLocal>) {
    setItems((prev) =>
      prev.map((i) =>
        i.idTemp === idTemp ? { ...i, ...patch, _dirty: true } : i
      )
    );
  }

  /** En edición se hace soft-delete (toggle); en creación se remueve */
  function removeOrToggleDelete(idTemp: string) {
    setItems(
      (prev) =>
        prev
          .map((i) => {
            if (i.idTemp !== idTemp) return i;
            if (mode === "edit" && i.iD_ProformaItem) {
              return { ...i, _deleted: !i._deleted, _dirty: true };
            }
            return null; // en create se elimina realmente
          })
          .filter(Boolean) as ItemLocal[]
    );
    delete nombreRefs.current[idTemp];

    // Limpia errores asociados a esa fila
    setErroresValidacion((prev) =>
      prev.filter((e) => !e.nombre.startsWith(`${idTemp}.`))
    );
  }

  // helper de reset
  function resetForm() {
    setClienteOpt(null);
    setDescuentoTipo("Monto");
    setDescuentoValor(undefined);
    setImpuesto(undefined);
    setObservaciones("");
    setFechaP(dayjs().format("YYYY-MM-DD"));
    setFechaV(dayjs().add(15, "day").format("YYYY-MM-DD"));
    setTarifaSel(null);
    setItems([]);
    setErroresValidacion([]);
    //desactivamos la creacion de un item vacío al abrir, se coloca un array vacio
    // si se necesita un item por defecto al aabrir colocar:
    // setItems([
    //   {
    //     idTemp: uuid(),
    //     nombreItemProforma: "",
    //     descripcionItemProforma: "",
    //     precioItemProforma: undefined,
    //     cantidadItemProforma: 1,
    //     _isNew: true,
    //   },
    // ]);
  }

  // resetea al abrir (solo en create)
  const prevShowRef = useRef(false);
  useEffect(() => {
    if (mode === "create" && show && !prevShowRef.current) {
      resetForm();
    }
    prevShowRef.current = show;
  }, [show, mode]);

  // === Validación completa (cabecera + ítems) ===
  const runValidations = (dtoCabecera: DTO_Proforma): DTO_Param[] => {
    const errs: DTO_Param[] = [];

    // Cabecera
    const errsCab = valida_DTO_Items_y_Proformas.validarProforma(
      dtoCabecera,
      mode === "edit" ? "U" : "C"
    );
    for (const e of errsCab) {
      errs.push({
        nombre: nombreValidadorToUI(e.nombre),
        valor: e.valor,
      });
    }

    // Ítems vigentes -> prefijar idTemp para pintar por fila
    for (const it of itemsVigentes) {
      const dtoItem: DTO_ProformaItem = {
        iD_ProformaItem: Number(it.iD_ProformaItem ?? 0),
        iD_Proforma: Number(dtoCabecera.iD_Proforma ?? 0),
        estado: undefined as any,
        nombreItemProforma: it.nombreItemProforma,
        descripcionItemProforma: it.descripcionItemProforma,
        precioItemProforma: Number(it.precioItemProforma ?? 0),
        cantidadItemProforma: Number(it.cantidadItemProforma ?? 0),
        fechaCreacion: new Date(fechaP),
        fechaModificacion: undefined,
      } as any;

      const errsIt = valida_DTO_Items_y_Proformas.validarItems(dtoItem);
      for (const e of errsIt) {
        errs.push({
          nombre: `${it.idTemp}.${e.nombre}`,
          valor: e.valor,
        });
      }
    }

    return errs;
  };

  // Guardar
  async function handleGuardar() {
    if (!itemsVigentes.length) {
      notificationHelpers.warningAlert("Agregue al menos un ítem.");
      return;
    }
    setLoadingForm(true);

    const dtoCabecera: DTO_Proforma = {
      iD_Proforma: mode === "edit" ? Number(proforma?.iD_Proforma ?? 0) : 0,
      iD_Negocio: Number(negocio?.iD_Negocio ?? 0),
      iD_Cliente: Number(clienteOpt?.value ?? 0),
      estado: undefined as any,
      fechaProforma: new Date(fechaP),
      fechaVencimiento: new Date(fechaV),
      observacionProforma: observaciones ?? "",
      fechaModificacion: undefined,
      descuentoProforma: Number(descuentoValor || 0),
      descuentoPorcentualProforma: descuentoTipo === "Porcentaje",
      impuestoPorcentualProforma: Number(impuesto || 0),
      subTotal: totales.subTotal,
      montoDescuento: totales.montoDescuento,
      baseImponible: totales.baseImponible,
      montoImpuesto: totales.montoImpuesto,
      totalCalculado: totales.totalCalculado,
      cliente: { iD_Cliente: Number(clienteOpt?.value ?? 0) } as any,
    };

    // ▶︎ Nueva validación
    const errs = runValidations(dtoCabecera);
    setErroresValidacion(errs);
    if (errs.length > 0) {
      setLoadingForm(false);
      notificationHelpers.warningAlert(
        "Por favor corrige los campos marcados."
      );
      focusByErrKey(errs[0].nombre);
      return;
    }

    try {
      if (mode === "create") {
        const r = await proformaService
          .registrarProformas(dtoCabecera)
          .toPromise();
        if (!r)
          throw new Error("No se obtuvo respuesta del registro de proforma.");
        const parsed = procesarRespuesta(r as DTO_Respuesta) as DTO_Proforma;
        const idProforma = parsed.iD_Proforma;
        if (!idProforma) throw new Error("No se obtuvo el ID de la proforma.");

        for (const it of itemsVigentes) {
          const dti: DTO_ProformaItem = {
            iD_ProformaItem: 0,
            iD_Proforma: idProforma,
            estado: undefined as any,
            nombreItemProforma: it.nombreItemProforma,
            descripcionItemProforma: it.descripcionItemProforma,
            precioItemProforma: Number(it.precioItemProforma ?? 0),
            cantidadItemProforma: Number(it.cantidadItemProforma ?? 0),
          };
          const r2 = await items_proformaService
            .registrarItemProforma(dti)
            .toPromise();
          if (!r2?.tipoRespuesta)
            throw new Error(r2?.mensaje ?? "Error al registrar item.");
          setLoadingForm(false);
        }
        notificationHelpers.successAlert("Proforma registrada correctamente.");
        setLoadingForm(false);
        const nuevaProforma = {
          ...parsed,
          cliente: { nombreCliente: clienteOpt?.label ?? "" } as any,
          subTotal: totales.subTotal,
          montoDescuento: totales.montoDescuento,
          baseImponible: totales.baseImponible,
          montoImpuesto: totales.montoImpuesto,
          totalCalculado: totales.totalCalculado,
          descuentoProforma: dtoCabecera.descuentoProforma,
          impuestoPorcentualProforma: dtoCabecera.impuestoPorcentualProforma,
          descuentoPorcentualProforma: dtoCabecera.descuentoPorcentualProforma,
        };
        onRegistered?.(nuevaProforma);
        return;
      }

      // ===== EDITAR =====
      setLoadingForm(true);
      const r0 = await proformaService
        .actualizarProformas(dtoCabecera)
        .toPromise();
      if (!r0?.tipoRespuesta) {
        setLoadingForm(false);
        throw new Error(r0?.mensaje ?? "Error al actualizar proforma.");
      }

      const nuevos = items.filter((i) => i._isNew && !i._deleted);
      const modificados = items.filter(
        (i) => !i._isNew && i._dirty && !i._deleted && i.iD_ProformaItem
      );
      const eliminados = items.filter(
        (i) => !i._isNew && i._deleted && i.iD_ProformaItem
      );

      const respuestaActualizar = procesarRespuesta(r0);

      // crear nuevos
      for (const it of nuevos) {
        const dti: DTO_ProformaItem = {
          iD_ProformaItem: 0,
          iD_Proforma: Number(proforma?.iD_Proforma),
          estado: undefined as any,
          nombreItemProforma: it.nombreItemProforma,
          descripcionItemProforma: it.descripcionItemProforma,
          precioItemProforma: Number(it.precioItemProforma ?? 0),
          cantidadItemProforma: Number(it.cantidadItemProforma ?? 0),
        };
        const rN = await items_proformaService
          .registrarItemProforma(dti)
          .toPromise();
        if (!rN?.tipoRespuesta)
          throw new Error(rN?.mensaje ?? "Error al crear ítem.");
      }

      // actualizar modificados
      for (const it of modificados) {
        const dti: DTO_ProformaItem = {
          iD_ProformaItem: Number(it.iD_ProformaItem),
          iD_Proforma: Number(proforma?.iD_Proforma),
          estado: undefined as any,
          nombreItemProforma: it.nombreItemProforma,
          descripcionItemProforma: it.descripcionItemProforma,
          precioItemProforma: Number(it.precioItemProforma ?? 0),
          cantidadItemProforma: Number(it.cantidadItemProforma ?? 0),
        };
        const rU = await items_proformaService
          .actualizarItemProforma(dti)
          .toPromise();
        if (!rU?.tipoRespuesta)
          throw new Error(rU?.mensaje ?? "Error al actualizar ítem.");
      }

      // soft-delete (estado = 30) usando actualizarItemProforma
      for (const it of eliminados) {
        const dti: DTO_ProformaItem = {
          iD_ProformaItem: Number(it.iD_ProformaItem),
          iD_Proforma: Number(proforma?.iD_Proforma),
          estado: { iD_Estado: PROFORMA_ITEM_DELETED } as DTO_Estado,
          nombreItemProforma: it.nombreItemProforma,
          descripcionItemProforma: it.descripcionItemProforma,
          precioItemProforma: Number(it.precioItemProforma ?? 0),
          cantidadItemProforma: Number(it.cantidadItemProforma ?? 0),
        };
        const rD = await items_proformaService
          .actualizarItemProforma(dti)
          .toPromise();
        if (!rD?.tipoRespuesta)
          throw new Error(rD?.mensaje ?? "Error al eliminar ítem.");
      }

      const proformaActualizadaParaTabla: DTO_Proforma = {
        ...(proforma as DTO_Proforma),
        ...respuestaActualizar,
        subTotal: totales.subTotal,
        montoDescuento: totales.montoDescuento,
        baseImponible: totales.baseImponible,
        montoImpuesto: totales.montoImpuesto,
        totalCalculado: totales.totalCalculado,
        cliente: { nombreCliente: clienteOpt?.label ?? "" } as any,
      };

      notificationHelpers.successAlert("Proforma actualizada correctamente.");
      setLoadingForm(false);
      onUpdated?.(proformaActualizadaParaTabla);
    } catch (err: any) {
      setLoadingForm(false);
      notificationHelpers.errorAlert(
        err?.message ?? "Ocurrió un error al guardar."
      );
    }
  }

  // PDF
  const printRef = useRef<HTMLDivElement>(null);
  async function handlePdf() {
    setLoadingPDF(true);
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const pdfElementHTML = printRef.current;
      if (!pdfElementHTML) return;

      await new Promise((r) => requestAnimationFrame(r));

      const canvas = await html2canvas(pdfElementHTML, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
      });

      const pdf = new jsPDF("p", "pt", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;

      const imgW = pageW - margin * 2;
      const scale = imgW / canvas.width;
      const innerH = pageH - margin * 2;
      const sliceHeightPx = Math.floor(innerH / scale);
      const totalPages = Math.ceil(canvas.height / sliceHeightPx);

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;

      for (let i = 0; i < totalPages; i++) {
        const startY = i * sliceHeightPx;
        const sliceHeight = Math.min(sliceHeightPx, canvas.height - startY);
        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext("2d")!;
        ctx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          startY,
          canvas.width,
          sliceHeight,
          0,
          0,
          sliceCanvas.width,
          sliceHeight
        );

        const sliceData = sliceCanvas.toDataURL("image/png");
        if (i > 0) pdf.addPage();

        const sliceHeightPt = sliceHeight * scale;
        pdf.addImage(sliceData, "PNG", margin, margin, imgW, sliceHeightPt);

        pdf.setFontSize(9);
        pdf.text(
          `Página ${i + 1} de ${totalPages}`,
          pageW - margin,
          pageH - 10,
          { align: "right" }
        );
      }

      const nombreCliente = clienteOpt?.label.replace(/\s+/g, "_") ?? "Cliente";
      pdf.save(
        `Proforma_${NombreSeguro(nombreCliente)}_${dayjs().format(
          "DD-MM-YYYY"
        )}.pdf`
      );

      setLoadingPDF(false);
    } catch (err) {
      console.error(err);
      setLoadingPDF(false);
      notificationHelpers?.errorAlert?.(
        "No se pudo generar el PDF. Intenta nuevamente."
      );
    }
  }

  // nombre seguro para archivos
  const NombreSeguro = (name: string) =>
    name.replace(/[\\/:*?"<>|]+/g, "").slice(0, 80);

  //#region Steps (
  const steps = [
    {
      title: "Encabezado",
      renderer: (
        <>
          {/* Cliente */}
          <div className="fv-row mb-5">
            <label className="form-label">Cliente</label>
            {negocio && (
              <div style={{ position: "relative", zIndex: 1061 }}>
                <AsyncClientSelect
                  value={clienteOpt}
                  onChange={(opt) => {
                    setClienteOpt(opt);
                    eliminarError("iD_Cliente");
                  }}
                />
              </div>
            )}
          </div>

          {/* Fecha vencimiento */}
          <label className="form-label">Fecha de vencimiento</label>
          <div className="input-group">
            <input
              data-err="fechaVencimiento"
              type="date"
              className="form-control  text-muted"
              value={fechaV}
              onChange={(e) => {
                setFechaV(e.target.value);
                eliminarError("fechaVencimiento");
              }}
            />
          </div>
          {getErrors("fechaVencimiento").map((e, i) => (
            <div key={i} className="invalid-feedback d-block">
              {e.valor}
            </div>
          ))}
        </>
      ),
    },
    {
      title: "Detalle",
      validator: (): DTO_Param[] => {
        const errs: DTO_Param[] = [];
        // Valida que haya al menos un ítem no eliminado
        if (itemsVigentes.length === 0) {
          errs.push({
            nombre: "items",
            valor: "Debe agregar al menos un ítem",
          });
          return errs; // Si no hay ítems, no tiene sentido validar cada uno
        }

        for (const it of itemsVigentes) {
          const dtoItem: DTO_ProformaItem = {
            iD_ProformaItem: Number(it.iD_ProformaItem ?? 0),
            iD_Proforma: 0,
            estado: undefined as any,
            nombreItemProforma: it.nombreItemProforma,
            descripcionItemProforma: it.descripcionItemProforma,
            precioItemProforma: Number(it.precioItemProforma ?? 0),
            cantidadItemProforma: Number(it.cantidadItemProforma ?? 0),
            fechaCreacion: new Date(),
            fechaModificacion: undefined,
          } as any;

          const errsIt = valida_DTO_Items_y_Proformas.validarItems(dtoItem);
          for (const e of errsIt) {
            errs.push({
              nombre: `${it.idTemp}.${e.nombre}`,
              valor: e.valor,
            });
          }
        }

        return errs;
      },
      children: (
        <>
          <div
            className="d-flex justify-content-between align-items-center mb-2"
            style={{ gap: 16 }}
          >
            <span className="fw-bold">Subtotal</span>
            <span className="fw-bold">
              {formatColones(Number(totales.subTotal ?? 0))}
            </span>
          </div>
        </>
      ),
      renderer: (
        <>
          <div className="row g-3 align-items-end">
            {/* Ítems */}
            <div className="card mt-6"></div>

            <div className="card-body p-0 pt-3">
              {/* Tabs  */}
              <div className="rounded border pb-4 mb-5">
                <ul className="nav nav-tabs nav-line-tabs fs-6 px-4 justify-content-end px-lg-20  py-lg-5">
                  <li className="nav-item">
                    <a
                      className={`nav-link ${
                        tabActive === "tarifa" ? "active" : ""
                      }`}
                      data-bs-toggle="tab"
                      href="#Tarifario"
                      onClick={() => setTabActive("tarifa")}
                    >
                      Tarifario
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className={`nav-link ${
                        tabActive === "manual" ? "active" : ""
                      }`}
                      data-bs-toggle="tab"
                      href="#Agregaritems"
                      onClick={() => setTabActive("manual")}
                    >
                      Agregar Ítems
                    </a>
                  </li>
                </ul>
                <div className="tab-content" id="myTabContent">
                  {/* Pestaña: Agregar Ítems */}
                  <div
                    className={`tab-pane fade ${
                      tabActive === "manual" ? "active show" : ""
                    }`}
                    id="Agregaritems"
                    role="tabpanel"
                  >
                    <div
                      className="d-flex justify-content-between align-items-center border-bottom px-4 py-3"
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "white",
                        zIndex: 10,
                      }}
                    >
                      {/* Texto informativo */}
                      <div className="d-flex align-items-start gap-2 flex-grow-1">
                        <i className="fa fa-info-circle text-muted mt-1" />
                        <span
                          className="text-muted small"
                          style={{ textAlign: "justify" }}
                        >
                          El botón <strong>Agregar ítem</strong> crea filas
                          vacías para que puedas llenarlas manualmente. Si
                          deseas agregar ítems automáticamente, utiliza la
                          pestaña <strong>Tarifario</strong>.
                        </span>
                      </div>
                    </div>
                    {/* Botón a la derecha */}
                    <div className="d-flex justify-content-end ms-auto mt-3 me-4">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={addItemVacio}
                      >
                        Agregar ítem
                      </button>
                    </div>
                  </div>

                  {/* Pestaña: Tarifario */}
                  <div
                    className={`tab-pane fade ${
                      tabActive === "tarifa" ? "active show" : ""
                    }`}
                    id="Tarifario"
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
                      <div
                        className="flex-grow-1 min-w-0"
                        style={{ zIndex: 1061 }}
                      >
                        {negocio && (
                          <div className="d-flex row justify-content-end ms-auto">
                            <label className="form-label">
                              Seleccionar Tarifa
                            </label>
                            <AsyncTarifaSelect
                              value={tarifaSel}
                              onChange={addItemDesdeTarifa}
                              reloadKey={0}
                              negocio={negocio}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* === Desktop (≥ md) === */}
              <div className="table-responsive d-none d-md-block">
                {/* Quitamos align-middle */}
                <table className="table table-row-dashed gy-2">
                  <thead>
                    <tr className="fw-semibold text-muted">
                      <th style={{ width: 20 }}>#</th>
                      <th style={{ width: 210 }}>Nombre</th>
                      <th style={{ width: 250 }}>Descripción</th>
                      <th className="text-end" style={{ width: 160 }}>
                        Precio
                      </th>
                      <th className="text-end" style={{ width: 130 }}>
                        Cantidad
                      </th>
                      <th className="text-end" style={{ width: 90 }}>
                        Importe
                      </th>
                      <th style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-muted">
                          <i className="bi bi-inbox fs-1 mb-2 d-block" />
                          <div className="fw-semibold">Sin datos</div>
                          <div className="small">No hay ítems agregados</div>
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => {
                        const importe =
                          Number(it.precioItemProforma ?? 0) *
                          Number(it.cantidadItemProforma ?? 0);
                        const rowClass = it._deleted
                          ? "opacity-50 text-decoration-line-through"
                          : "";
                        return (
                          <tr
                            key={it.idTemp}
                            data-rowid={it.idTemp}
                            ref={setRowRefVisibleOnly(it.idTemp)}
                            className={rowClass}
                          >
                            {/* Forzamos align-top en TODOS los td */}
                            <td className="align-top">{idx + 1}</td>

                            {/* Nombre */}
                            <td className="align-top">
                              <div className="text-start">
                                <input
                                  className={`form-control text-muted form-control-sm ${
                                    getErrors(`${it.idTemp}.nombreItemProforma`)
                                      .length
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                  ref={(el) => {
                                    nombreRefs.current[it.idTemp] = el;
                                  }}
                                  value={it.nombreItemProforma}
                                  data-err={`${it.idTemp}.nombreItemProforma`}
                                  onChange={(e) => {
                                    eliminarError(
                                      `${it.idTemp}.nombreItemProforma`
                                    );
                                    patchItem(it.idTemp, {
                                      nombreItemProforma: e.target.value,
                                    });
                                  }}
                                  placeholder="Nombre del ítem"
                                  disabled={it._deleted}
                                />
                                {getErrors(
                                  `${it.idTemp}.nombreItemProforma`
                                ).map((e, i) => (
                                  <div
                                    key={i}
                                    className="invalid-feedback d-block text-start"
                                  >
                                    {e.valor}
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Descripción */}
                            <td className="align-top">
                              <div className="text-start">
                                <input
                                  className={`form-control text-muted form-control-sm ${
                                    getErrors(
                                      `${it.idTemp}.descripcionItemProforma`
                                    ).length
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                  value={it.descripcionItemProforma}
                                  data-err={`${it.idTemp}.descripcionItemProforma`}
                                  onChange={(e) => {
                                    eliminarError(
                                      `${it.idTemp}.descripcionItemProforma`
                                    );
                                    patchItem(it.idTemp, {
                                      descripcionItemProforma: e.target.value,
                                    });
                                  }}
                                  placeholder="Descripción (opcional)"
                                  disabled={it._deleted}
                                />
                                {getErrors(
                                  `${it.idTemp}.descripcionItemProforma`
                                ).map((e, i) => (
                                  <div
                                    key={i}
                                    className="invalid-feedback d-block text-start"
                                  >
                                    {e.valor}
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Precio */}
                            <td className="text-end align-top">
                              <div className="text-start">
                                <DecimalInput
                                  required
                                  value={it.precioItemProforma}
                                  min={0}
                                  onChange={(num) => {
                                    patchItem(it.idTemp, {
                                      precioItemProforma:
                                        typeof num === "string"
                                          ? parseFloat(num)
                                          : num,
                                    });
                                  }}
                                  className={`form-control-sm ${
                                    getErrors(`${it.idTemp}.precioItemProforma`)
                                      .length
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                />
                                {getErrors(
                                  `${it.idTemp}.precioItemProforma`
                                ).map((e, i) => (
                                  <div
                                    key={i}
                                    className="invalid-feedback d-block text-start"
                                  >
                                    {e.valor}
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Cantidad */}
                            <td className="text-end align-top">
                              <div className="text-start">
                                <input
                                  type="number"
                                  step="1"
                                  min={1}
                                  className={`form-control text-muted form-control-sm text-end ${
                                    getErrors(
                                      `${it.idTemp}.cantidadItemProforma`
                                    ).length
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                  value={
                                    it.cantidadItemProforma === undefined
                                      ? "" // deja borrar
                                      : String(it.cantidadItemProforma)
                                  }
                                  data-err={`${it.idTemp}.cantidadItemProforma`}
                                  onChange={(e) => {
                                    const valStr = e.target.value
                                      .replace(/[^\d.]/g, "")
                                      .replace(",", ".")
                                      .replace(/(\..*?)\..*/g, "$1")
                                      .replace(/^0+(?=\d)/, "");

                                    eliminarError(
                                      `${it.idTemp}.cantidadItemProforma`
                                    );
                                    if (valStr === "") {
                                      patchItem(it.idTemp, {
                                        cantidadItemProforma: undefined,
                                      });
                                      return;
                                    }

                                    const valNum = parseInt(valStr, 10);
                                    if (!isNaN(valNum) && valNum >= 1) {
                                      patchItem(it.idTemp, {
                                        cantidadItemProforma: valNum,
                                      });
                                    }
                                  }}
                                  disabled={it._deleted}
                                />
                                {getErrors(
                                  `${it.idTemp}.cantidadItemProforma`
                                ).map((e, i) => (
                                  <div
                                    key={i}
                                    className="invalid-feedback d-block text-start"
                                  >
                                    {e.valor}
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Importe */}
                            <td
                              className="text-end align-top"
                              style={{ whiteSpace: "nowrap" }}
                            >
                              <span className="text-muted">
                                {formatColones(importe.toFixed(2))}
                              </span>
                            </td>

                            {/* Acciones */}
                            <td className="text-center align-top">
                              <button
                                className={`btn btn-icon btn-sm ${
                                  it._deleted
                                    ? "btn-light-warning"
                                    : "btn-light-danger"
                                }`}
                                onClick={() => removeOrToggleDelete(it.idTemp)}
                                title={
                                  it._deleted
                                    ? "Restaurar ítem"
                                    : "Eliminar ítem"
                                }
                              >
                                <i
                                  className={`bi ${
                                    it._deleted
                                      ? "bi-arrow-counterclockwise"
                                      : "bi-trash"
                                  }`}
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {/* === Movil (< md) === */}
              <div className="d-block d-md-none">
                {items.map((it, idx) => {
                  const importe =
                    Number(it.precioItemProforma ?? 0) *
                    Number(it.cantidadItemProforma ?? 0);
                  const cardCls = it._deleted ? "opacity-50" : "";
                  return (
                    <div
                      key={it.idTemp}
                      data-rowid={it.idTemp}
                      ref={setRowRefVisibleOnly(it.idTemp)}
                      className={`border rounded-3 p-3 mb-3 w-100 ${cardCls}`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-light text-dark">
                          #{idx + 1}
                        </span>
                        {it._deleted && (
                          <span className="badge bg-warning text-dark me-2">
                            Eliminado
                          </span>
                        )}
                        <button
                          className={`btn btn-icon btn-sm ${
                            it._deleted
                              ? "btn-light-warning"
                              : "btn-light-secondary"
                          }`}
                          onClick={() => removeOrToggleDelete(it.idTemp)}
                          aria-label={
                            it._deleted ? "Restaurar ítem" : "Eliminar ítem"
                          }
                        >
                          <i
                            className={`bi ${
                              it._deleted
                                ? "bi-arrow-counterclockwise"
                                : "bi-trash"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mb-2">
                        <label className="text-muted mb-1">Nombre</label>
                        <input
                          className={`form-control text-muted form-control-sm ${
                            getErrors(`${it.idTemp}.nombreItemProforma`).length
                              ? "is-invalid"
                              : ""
                          }`}
                          ref={(el) => {
                            nombreRefs.current[it.idTemp] = el;
                          }}
                          value={it.nombreItemProforma}
                          data-err={`${it.idTemp}.nombreItemProforma`}
                          onChange={(e) => {
                            eliminarError(`${it.idTemp}.nombreItemProforma`);
                            patchItem(it.idTemp, {
                              nombreItemProforma: e.target.value,
                            });
                          }}
                          placeholder="Nombre del ítem"
                          disabled={it._deleted}
                        />
                        {getErrors(`${it.idTemp}.nombreItemProforma`).map(
                          (e, i) => (
                            <div key={i} className="invalid-feedback d-block">
                              {e.valor}
                            </div>
                          )
                        )}
                      </div>

                      <div className="mb-2">
                        <label className="text-muted mb-1">Descripción</label>
                        <input
                          className={`form-control text-muted form-control-sm ${
                            getErrors(`${it.idTemp}.descripcionItemProforma`)
                              .length
                              ? "is-invalid"
                              : ""
                          }`}
                          value={it.descripcionItemProforma}
                          data-err={`${it.idTemp}.descripcionItemProforma`}
                          onChange={(e) => {
                            eliminarError(
                              `${it.idTemp}.descripcionItemProforma`
                            );
                            patchItem(it.idTemp, {
                              descripcionItemProforma: e.target.value,
                            });
                          }}
                          placeholder="Descripción (opcional)"
                          disabled={it._deleted}
                        />
                        {getErrors(`${it.idTemp}.descripcionItemProforma`).map(
                          (e, i) => (
                            <div key={i} className="invalid-feedback d-block">
                              {e.valor}
                            </div>
                          )
                        )}
                      </div>

                      <div className="row g-2">
                        <div className="col-6">
                          <label className="text-muted mb-1">Precio</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="1"
                            min={0}
                            placeholder="0" // 👈 solo se ve cuando el campo está vacío
                            className={`form-control text-muted form-control-sm text-end ${
                              getErrors(`${it.idTemp}.precioItemProforma`)
                                .length
                                ? "is-invalid"
                                : ""
                            }`}
                            value={
                              it.precioItemProforma === undefined ||
                              it.precioItemProforma === null
                                ? "" // 👈 vacío, muestra el placeholder
                                : String(it.precioItemProforma)
                            }
                            data-err={`${it.idTemp}.precioItemProforma`}
                            onChange={(e) => {
                              const valStr = e.target.value
                                .replace(/[^\d.]/g, "")
                                .replace(",", ".")
                                .replace(/(\..*?)\..*/g, "$1")
                                .replace(/^0+(?=\d)/, "");

                              eliminarError(`${it.idTemp}.precioItemProforma`);

                              if (valStr === "") {
                                patchItem(it.idTemp, {
                                  precioItemProforma: undefined,
                                });
                                return;
                              }

                              const valNum = parseFloat(valStr);
                              if (!isNaN(valNum) && valNum >= 0) {
                                patchItem(it.idTemp, {
                                  precioItemProforma: valNum,
                                });
                              }
                            }}
                            disabled={it._deleted}
                          />
                          {getErrors(`${it.idTemp}.precioItemProforma`).map(
                            (e, i) => (
                              <div key={i} className="invalid-feedback d-block">
                                {e.valor}
                              </div>
                            )
                          )}
                        </div>

                        <div className="col-6">
                          <label className="text-muted mb-1">Cantidad</label>
                          <input
                            type="number"
                            step="1"
                            min={1}
                            className={`form-control text-muted form-control-sm text-end ${
                              getErrors(`${it.idTemp}.cantidadItemProforma`)
                                .length
                                ? "is-invalid"
                                : ""
                            }`}
                            value={
                              it.cantidadItemProforma === undefined
                                ? "" // deja borrar
                                : String(it.cantidadItemProforma)
                            }
                            data-err={`${it.idTemp}.cantidadItemProforma`}
                            onChange={(e) => {
                              const valStr = e.target.value
                                .replace(/[^\d.]/g, "")
                                .replace(",", ".")
                                .replace(/(\..*?)\..*/g, "$1")
                                .replace(/^0+(?=\d)/, "");

                              eliminarError(
                                `${it.idTemp}.cantidadItemProforma`
                              );
                              if (valStr === "") {
                                patchItem(it.idTemp, {
                                  cantidadItemProforma: undefined,
                                });
                                return;
                              }

                              const valNum = parseInt(valStr, 10);
                              if (!isNaN(valNum) && valNum >= 1) {
                                patchItem(it.idTemp, {
                                  cantidadItemProforma: valNum,
                                });
                              }
                            }}
                            disabled={it._deleted}
                          />
                          {getErrors(`${it.idTemp}.cantidadItemProforma`).map(
                            (e, i) => (
                              <div key={i} className="invalid-feedback d-block">
                                {e.valor}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <small className="text-muted">Importe</small>
                        <span className="text-muted">
                          {formatColones(importe.toFixed(2))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      title: "Resumen",
      children: (
        <button
          className="btn btn-light"
          onClick={handlePdf}
          disabled={loadingPDF}
        >
          {loadingPDF ? (
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
          ) : (
            <i className="bi bi-filetype-pdf me-2" />
          )}
          {loadingPDF ? (
            <span className="d-inline-block" style={{ minWidth: 80 }}>
              <span className="dot-typing">Generando</span>
            </span>
          ) : (
            "Descargar PDF"
          )}
        </button>
      ),
      renderer: (
        <div className="row g-4">
          {/* Descuento */}
          <div className="col-12 col-md-6">
            <label className="form-label">Descuento</label>
            <div className="input-group" data-err="montoDescuento">
              <input
                type="number"
                placeholder={descuentoTipo === "Porcentaje" ? "0%" : "0.00"}
                className="form-control text-muted"
                value={descuentoValor ?? ""}
                onChange={(e) => {
                  const valStr = e.target.value;
                  let valNum = Number(valStr);
                  if (descuentoTipo === "Porcentaje") {
                    if (valNum < 0) valNum = 0;
                    if (valNum > 100) valNum = 100;
                  }
                  setDescuentoValor(valStr === "" ? undefined : valNum);
                  eliminarError("montoDescuento");
                }}
                min={0}
                max={descuentoTipo === "Porcentaje" ? 100 : undefined}
              />
              <button
                type="button"
                className={`btn ${
                  descuentoTipo === "Porcentaje"
                    ? "btn-primary"
                    : "btn-light pulse pulse-primary"
                } btn-icon pulse`}
                onClick={() => {
                  setDescuentoTipo((prev) =>
                    prev === "Porcentaje" ? "Monto" : "Porcentaje"
                  );
                  setDescuentoValor(undefined);
                  eliminarError("montoDescuento");
                }}
                title="Cambiar tipo"
                aria-label="Cambiar tipo de descuento"
              >
                {descuentoTipo === "Porcentaje" ? "%" : "₡"}
                <span className="pulse-ring" />
              </button>
            </div>
            {getErrors("montoDescuento").map((e, i) => (
              <div key={i} className="invalid-feedback d-block">
                {e.valor}
              </div>
            ))}
            <small className="text-muted">
              Tipo: {descuentoTipo === "Porcentaje" ? "Porcentaje" : "Monto"}
            </small>
          </div>

          {/* IVA */}
          <div className="col-12 col-md-6">
            <label className="form-label">IVA (%)</label>
            <div className="input-group">
              <input
                type="number"
                placeholder="0%"
                className="form-control text-muted"
                data-err="montoImpuesto"
                value={impuesto ?? ""}
                min={0}
                max={100}
                step="0.5"
                inputMode="decimal"
                onChange={(e) => {
                  let val = e.target.valueAsNumber;
                  if (!Number.isFinite(val)) return;
                  if (val < 0) val = 0;
                  if (val > 100) val = 100;
                  setImpuesto(val);
                  eliminarError("montoImpuesto");
                }}
              />
            </div>
            {getErrors("montoImpuesto").map((e, i) => (
              <div key={i} className="invalid-feedback d-block">
                {e.valor}
              </div>
            ))}
            <small className="text-muted">Tipo: Porcentaje</small>
          </div>

          {/* Observaciones */}
          <div className="col-12 col-md-6">
            <label className="form-label">Observaciones</label>
            <div className="input-group">
              <textarea
                className="form-control text-muted"
                rows={4}
                data-err="observacionProforma"
                value={observaciones}
                onChange={(e) => {
                  setObservaciones(e.target.value);
                  eliminarError("observacionProforma");
                }}
              />
            </div>
            {getErrors("observacionProforma").map((e, i) => (
              <div key={i} className="invalid-feedback d-block">
                {e.valor}
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="col-12 col-md-6 d-flex align-items-end justify-content-md-end">
            <div className="w-100" style={{ maxWidth: 340 }}>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Subtotal</span>
                <span className="text-muted">
                  {formatColones(totales.subTotal ?? 0)}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">
                  Descuento{" "}
                  {descuentoTipo === "Porcentaje"
                    ? `(${descuentoValor ?? 0}%)`
                    : ""}
                </span>
                <span className="text-muted">
                  - {formatColones(totales.montoDescuento ?? 0)}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span title="Subtotal con descuento" className="text-muted">
                  Subtotal c/desc:
                </span>
                <span className="text-muted">
                  {formatColones(totales.baseImponible ?? 0)}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">IVA {impuesto ?? 0}%</span>
                <span className="text-muted">
                  {formatColones(totales.montoImpuesto ?? 0)}
                </span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fs-4">
                <span className="fw-bold">TOTAL</span>
                <span className="fw-bold">
                  {formatColones(totales.totalCalculado ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];
  //#endregion
  if (!show) return null;

  return (
    <>
      <div
        className="modal shadowClearBackground show d-block"
        role="dialog"
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Fullscreen en sm-down para UX móvil */}
        <div
          className="modal-dialog modal-fullscreen-sm-down modal-xl"
          style={{
            maxWidth: "900px", // Expande el modal en pantallas ≥768px
            width: "100%",
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {mode === "edit"
                  ? `Editar Proforma : #${proforma?.iD_Proforma}`
                  : "Nueva Proforma"}
              </h5>
              <button
                className="btn btn-sm btn-icon btn-light"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="modal-body" ref={modalBodyRef}>
              {/* Cabecera */}
              <Stepper
                steps={steps}
                loading={loadingForm}
                onSubmit={handleGuardar}
                setErroresValidacion={setErroresValidacion}
                focusByErrKey={focusByErrKey}
              />

              {/* Área PDF (offscreen, no display:none) */}
              <div
                aria-hidden="true"
                style={{
                  position: "fixed",
                  left: 0,
                  top: 0,
                  width: 0,
                  height: 0,
                  opacity: 0,
                  pointerEvents: "none",
                  overflow: "visible",
                  zIndex: -1,
                }}
              >
                <div
                  ref={printRef}
                  style={{
                    width: 794, // ~A4 a 96dpi
                    background: "#ffffff",
                    padding: 32,
                    fontFamily:
                      "Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif",
                    color: "#111827",
                  }}
                >
                  {/* Banda superior */}
                  <div
                    style={{
                      background: "#EEF6FF",
                      border: "1px solid #DBEAFE",
                      borderRadius: 8,
                      padding: "16px 20px",
                      marginBottom: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          letterSpacing: 0.4,
                          color: "#1E3A8A",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        {negocio?.nombreNegocio ?? ""}
                      </div>
                      {negocio?.direccion ? (
                        <div style={{ fontSize: 12, color: "#374151" }}>
                          {negocio.direccion}
                        </div>
                      ) : null}
                      {negocio?.telefonoNegocio ? (
                        <div style={{ fontSize: 12, color: "#374151" }}>
                          Tel: {negocio.telefonoNegocio}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          letterSpacing: 0.4,
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                        className="text-muted"
                      >
                        proforma
                      </div>
                      <div style={{ fontSize: 12, color: "#475569" }}>
                        Fecha:{" "}
                        <strong>{dayjs(fechaP).format("DD/MM/YYYY")}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: "#475569" }}>
                        Vence:{" "}
                        <strong>{dayjs(fechaV).format("DD/MM/YYYY")}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Bloque Cliente */}
                  <div
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>
                        Cliente
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        {clienteOpt?.label ?? "-"}
                      </div>
                    </div>
                    {observaciones ? (
                      <div style={{ maxWidth: 420 }}>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                          Observaciones
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#111827",
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {observaciones}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Tabla de Ítems */}
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: 0,
                      fontSize: 12,
                      marginTop: 8,
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        <th
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #E5E7EB",
                            padding: "10px 8px",
                            color: "#374151",
                            fontWeight: 700,
                          }}
                        >
                          Descripción
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            borderBottom: "1px solid #E5E7EB",
                            padding: "10px 8px",
                            color: "#374151",
                            fontWeight: 700,
                            width: 120,
                          }}
                        >
                          Precio unit.
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            borderBottom: "1px solid #E5E7EB",
                            padding: "10px 8px",
                            color: "#374151",
                            fontWeight: 700,
                            width: 80,
                          }}
                        >
                          Cantidad
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            borderBottom: "1px solid #E5E7EB",
                            padding: "10px 8px",
                            color: "#374151",
                            fontWeight: 700,
                            width: 140,
                          }}
                        >
                          Importe
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const unit = Number(it.precioItemProforma ?? 0);
                        const qty = Number(it.cantidadItemProforma ?? 0);
                        const imp = unit * qty;
                        const zebra = idx % 2 === 1 ? "#FCFCFD" : "#FFFFFF";
                        return (
                          <tr key={it.idTemp} style={{ background: zebra }}>
                            <td
                              style={{
                                padding: "8px 8px",
                                borderBottom: "1px solid #F3F4F6",
                                verticalAlign: "top",
                              }}
                            >
                              <div
                                style={{ fontWeight: 600, color: "#111827" }}
                              >
                                {it.nombreItemProforma || "-"}
                              </div>
                              {it.descripcionItemProforma ? (
                                <div
                                  style={{
                                    color: "#6B7280",
                                    marginTop: 2,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {it.descripcionItemProforma}
                                </div>
                              ) : null}
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                padding: "8px",
                                borderBottom: "1px solid #F3F4F6",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatColones(unit)}
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                padding: "8px",
                                borderBottom: "1px solid #F3F4F6",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {qty}
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                padding: "8px",
                                borderBottom: "1px solid #F3F4F6",
                                whiteSpace: "nowrap",
                                fontWeight: 600,
                              }}
                            >
                              {formatColones(imp)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Totales PDF */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 320,
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                        padding: 12,
                        background: "#FAFAFA",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                          color: "#374151",
                        }}
                      >
                        <span>Subtotal</span>
                        <span style={{ fontWeight: 600 }}>
                          {formatColones(Number(totales.subTotal ?? 0))}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                          color: "#374151",
                        }}
                      >
                        <span>
                          Descuento
                          {descuentoTipo === "Porcentaje" &&
                          typeof descuentoValor === "number"
                            ? ` (${descuentoValor}%)`
                            : ""}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          - {formatColones(Number(totales.montoDescuento ?? 0))}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                          color: "#374151",
                        }}
                      >
                        <span>Subtotal c/desc</span>
                        <span style={{ fontWeight: 600 }}>
                          {formatColones(Number(totales.baseImponible ?? 0))}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                          color: "#374151",
                        }}
                      >
                        <span>
                          IVA {typeof impuesto === "number" ? impuesto : 0}%
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          {formatColones(Number(totales.montoImpuesto ?? 0))}
                        </span>
                      </div>

                      <div
                        style={{
                          borderTop: "1px dashed #E5E7EB",
                          margin: "8px 0",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 16,
                        }}
                      >
                        <span style={{ fontWeight: 800 }}>TOTAL</span>
                        <span style={{ fontWeight: 800 }}>
                          {formatColones(Number(totales.totalCalculado ?? 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 24,
                      fontSize: 11,
                      color: "#6B7280",
                      textAlign: "center",
                    }}
                  >
                    Gracias por su preferencia.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
