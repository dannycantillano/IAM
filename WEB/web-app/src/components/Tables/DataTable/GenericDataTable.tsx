import React, { useEffect, useRef, useMemo, useImperativeHandle } from "react";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-responsive-bs5";
import "datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css";
import DataTable from "datatables.net-dt";
import JsZip from "jszip";
import Buttons from "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.html5.js";
import "datatables.net-fixedheader-bs5";
import "datatables.net-fixedheader-bs5/css/fixedHeader.bootstrap5.min.css";

import ReactDOM from "react-dom/client";
import { useApp } from "@/hooks/useApp";
import { ActionButtons, DynamicButtonConfig } from "@/components";

type ColumnSettings = DataTables.ColumnSettings;

declare global {
  interface Window {
    JSZip: typeof JsZip;
  }
}

window.JSZip = JsZip;

export interface GenericDataTableProps<T> {
  title: string;
  columnKeys: (keyof T)[];
  labelMap: Record<string, string>;
  data: T[];
  onAdd: () => void;
  onEdit: (rowData: T) => void;
  onDelete: (rowData: T) => void;
  disableButtonAdd?: boolean;
  customRenderers?: Partial<{
    [K in keyof T]: (value: unknown, rowData: T) => React.ReactNode;
  }>;
  includeEstadoColumn?: boolean;
  customColumns?: ColumnSettings[];
  dataTableButtons?: DynamicButtonConfig[];
  nowrapColumns?: (keyof T | string)[];
  onRowClick?: (rowData: T) => void;

  /** Si true, la tabla no escuchará cambios de `data` y sólo se manipula por métodos imperativos */
  independent?: boolean;
  /** Nombre de la propiedad ID usada por upsert/remove (p.ej. "iD_Cuenta") */
  idField?: keyof T | string;
}

// 🔌 API imperativa que expondrá la tabla (add/update/delete sin re-render del padre)
export type GenericDataTableHandle<T> = {
  load: (rows: T[]) => void; // reemplaza todo el contenido
  upsert: (row: T) => void; // inserta/actualiza por id y sube al tope
  bulkUpsert: (rows: T[]) => void; // inserta/actualiza varias
  removeById: (id: unknown) => void; // elimina por id
  clear: () => void; // limpia todo
  getData: () => T[];
};

function GenericDataTableInner<T>(
  {
    title,
    columnKeys,
    labelMap,
    data,
    onAdd,
    onEdit,
    onDelete,
    disableButtonAdd = false,
    customRenderers = {},
    includeEstadoColumn = false,
    customColumns = [],
    dataTableButtons,
    nowrapColumns = [],
    onRowClick,
    // ✅ NUEVO
    independent = false,
    idField = "id",
  }: GenericDataTableProps<T>,
  ref: React.Ref<GenericDataTableHandle<T>>
) {
  //🔄 Estado general
  const { state } = useApp();

  //#endregion
  DataTable.use(Buttons);
  const tableRef = useRef<HTMLTableElement>(null);


  // ✅ NUEVOS refs internos
  const dtApiRef = useRef<DataTables.Api | null>(null);
  const pendingOpsRef = useRef<Array<(dt: DataTables.Api) => void>>([]); // ← cola de ops antes de init
  const seqRef = useRef<number>(0);
  const idKeyRef = useRef<string>(
    typeof idField === "string" ? idField : String(idField)
  );
  useEffect(() => {
    idKeyRef.current = typeof idField === "string" ? idField : String(idField);
  }, [idField]);

  // Carga inicial única para `independent`
  const didInitialLoadRef = useRef(false);

  const withSeq = (row: T): T & { __seq: number } => ({
    ...(row as any),
    __seq: ++seqRef.current,
  });

  const withDT = (fn: (dt: DataTables.Api) => void) => {
    const dt = dtApiRef.current;
    if (dt) {
      fn(dt);
      return;
    }
    pendingOpsRef.current.push(fn);
  };

  //#region 🔧 Columnas dinámicas DataTable

  // 🔧 Helpers — detección por key o por título (case-insensitive)
  const _normalize = (v: unknown) =>
    String(v ?? "")
      .trim()
      .toLowerCase();
  const _joinClass = (base?: string, add?: string) =>
    [base, add].filter(Boolean).join(" ").trim();

  const _wantsNowrap = (
    key: string,
    title: string,
    list: (keyof T | string)[]
  ) => {
    const k = _normalize(key);
    const t = _normalize(title);
    return (list || []).some((x) => {
      const v = _normalize(x);
      return v === k || v === t;
    });
  };

  // === Highlight helpers (mínimos) ===
  const getScrollContainer = () =>
    tableRef.current?.closest('.card-body.table-responsive') as HTMLElement | null;

  const ensureFlashStyles = () => {
    const id = 'dt-flash-row-style';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
@keyframes flashBorder { from { opacity: 1 } to { opacity: 0 } }

/* Overlay absoluto para el destello azul */
.flash-blue-overlay { position: absolute; inset: auto; pointer-events: none; z-index: 30; border-radius: .5rem; }
.flash-blue-overlay::before {
  content: '';
  
  position: absolute;
  inset: 0;
  padding: 2px;                 /* grosor del borde */
  border-radius: inherit;
  background: #3e96d2 ;          /* azul brillante */
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;      /* Firefox */
  -webkit-mask-composite: xor;  /* Chrome / Safari */
  animation: flashBorder 3s ease-out forwards; /* dura 3s y desaparece */
}

/* Asegura que el contenedor reciba posicionamiento relativo si era estático */
.dt-flash-rel { position: relative !important; }
`;
    document.head.appendChild(s);
  };

  const isInView = (el: HTMLElement, container?: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const v = container
      ? container.getBoundingClientRect()
      : ({ top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight } as DOMRect);
    return r.bottom > v.top && r.top < v.bottom && r.right > v.left && r.left < v.right;
  };

  const flashRow = (tr: HTMLElement) => {
    ensureFlashStyles();

    // 1) Forzar "hover" y focus por 3s
    tr.classList.add('dt-force-hover');
    if (!tr.hasAttribute('tabindex')) tr.setAttribute('tabindex', '-1'); // focusable
    tr.focus({ preventScroll: true });
    setTimeout(() => tr.classList.remove('dt-force-hover'), 3);

    // 2) Destello azul en el borde (fila + detalle responsive si está abierto)
    const container = getScrollContainer() || document.body;
    const contRect = container.getBoundingClientRect();
    if (getComputedStyle(container).position === 'static') container.classList.add('dt-flash-rel');

    const r1 = tr.getBoundingClientRect();
    let top = r1.top, left = r1.left, right = r1.right, bottom = r1.bottom;

    const maybeChild = tr.nextElementSibling as HTMLElement | null;
    if (maybeChild && maybeChild.classList.contains('child') && maybeChild.offsetParent !== null) {
      const r2 = maybeChild.getBoundingClientRect();
      top = Math.min(top, r2.top);
      left = Math.min(left, r2.left);
      right = Math.max(right, r2.right);
      bottom = Math.max(bottom, r2.bottom);
    }

    const overlay = document.createElement('div');
    overlay.className = 'flash-blue-overlay';

    // Posicionar relativo al contenedor de scroll (o ventana)
    const scrollTop = container === document.body ? window.pageYOffset : (container as HTMLElement).scrollTop;
    const scrollLeft = container === document.body ? window.pageXOffset : (container as HTMLElement).scrollLeft;

    overlay.style.top = `${top - contRect.top + scrollTop + 2}px`;
    overlay.style.left = `${left - contRect.left + scrollLeft - 2}px`;
    overlay.style.width = `${Math.max(1, right - left) + 5}px`;
    overlay.style.height = `${Math.max(1, bottom - top) + 10}px`;

    container.appendChild(overlay);
    setTimeout(() => overlay.remove(), 3000);
  };



  // Usa el mismo dash que ya usas en la tabla
  const DASH_HTML = '<span aria-hidden="true" class="text-muted">—</span>';

  const ensureDashForRow = (tr: HTMLTableRowElement) => {
    // Rellena celdas vacías de la fila principal (omite celdas con contenido/React)
    Array.from(tr.cells).forEach((td) => {
      if (td.childElementCount > 0) return;         // ya hay HTML (acciones, badges, etc.)
      const txt = (td.textContent || '').trim();
      if (txt !== '') return;                        // tiene texto (0, ₡0, etc.)
      td.innerHTML = DASH_HTML;                      // pon dash sutil
    });
  };

  const ensureDashInDetailsForRow = (tr: HTMLTableRowElement) => {
    // Si la fila tiene panel responsive abierto, rellena la 2ª columna (valor)
    const child = tr.nextElementSibling as HTMLElement | null;
    const details = child?.querySelector('table.dtr-details') as HTMLTableElement | null;
    if (!details) return;
    details.querySelectorAll('td:nth-child(2)').forEach((td) => {
      const el = td as HTMLTableCellElement;
      if (el.childElementCount > 0) return;
      const txt = (el.textContent || '').trim();
      if (txt !== '') return;
      el.innerHTML = DASH_HTML;
    });
  };



  const dtColumns = useMemo<ColumnSettings[]>(() => {
    const cols: ColumnSettings[] = [];

    const availableKeys = independent
      ? new Set<string>(columnKeys.map(String))
      : data.reduce<Set<string>>((set, row) => {
        Object.keys(row as Record<string, unknown>).forEach((k) =>
          set.add(k)
        );
        return set;
      }, new Set<string>());

    (independent ? columnKeys.map(String) : columnKeys.map(String)).forEach(
      (keyStr) => {
        if (independent || data.length === 0 || availableKeys.has(keyStr)) {
          const col: ColumnSettings = {
            title: labelMap[keyStr] || keyStr,
            data: keyStr,
            defaultContent: "",
          };

          const titleTxt = labelMap[keyStr] || keyStr;

          // 👇 Si la columna está listada por key o por título → nowrap
          if (_wantsNowrap(keyStr, titleTxt, nowrapColumns)) {
            col.className = _joinClass(
              col.className as string | undefined,
              "text-nowrap"
            );
          }

          const key = keyStr as keyof T;
          if (customRenderers[key]) {
            const renderer = customRenderers[key]!;

            // 1) Para sorting/filter/export → devolver texto cuando sea posible
            col.render = (dataValue, _type, rowData) => {
              try {
                const out = renderer(dataValue, rowData as T);

                // Si es JSX, devolvemos string vacío (el contenido se montará en createdCell)
                if (React.isValidElement(out)) return "";

                // Si es primitivo, devuélvelo tal cual
                if (typeof out === "string" || typeof out === "number")
                  return out;

                // Cualquier otro caso
                return out ?? "";
              } catch (error) {
                console.warn(`Render error (${keyStr})`, error);
                return dataValue ?? "";
              }
            };

            // 2) Para display real en celdas → montar JSX si corresponde
            col.createdCell = (cell, dataValue, rowData) => {
              try {
                const out = renderer(dataValue, rowData as T);
                (cell as HTMLElement).innerHTML = ""; // limpia la celda

                if (React.isValidElement(out)) {
                  const container = document.createElement("span");
                  cell.appendChild(container);
                  const root = ReactDOM.createRoot(container);
                  root.render(out);
                } else {
                  // Texto plano como fallback
                  (cell as HTMLElement).textContent =
                    out != null ? String(out) : "";
                }
              } catch (error) {
                console.warn(`createdCell error (${keyStr})`, error);
                (cell as HTMLElement).textContent = "";
              }
            };
          }

          cols.push(col);
        }
      }
    );

    //#region 🧩 Custom columns (user-defined)
    if (customColumns) {
      customColumns.forEach((c) => {
        const cTitle = String((c as any).title ?? "");
        const needs = _wantsNowrap("", cTitle, nowrapColumns);
        cols.push(
          needs
            ? {
              ...c,
              className: _joinClass((c as any).className, "text-nowrap"),
            }
            : c
        );
      });
    }
    //#endregion




    //#endregion

    //#region 📊 Columna Avance (barra de progreso)
    if (labelMap["avance"]) {
      cols.push({
        title: labelMap["avance"],
        data: null,
        orderable: true,
        searchable: true,
        defaultContent: "",
        render: function (_data, type, row) {
          const porcentaje = (row as any)["avance"] ?? 0;

          // Exportaciones (Excel, PDF, etc.)
          if (type === "export") {
            return `${porcentaje}%`;
          }

          // Filtros y ordenamientos
          if (type === "filter" || type === "sort") {
            return porcentaje;
          }
          // Display: se renderiza manualmente en `createdCell`
          return "";
        },
        createdCell: (cell, _cellData, row) => {
          try {
            const porcentaje = (row as any)["avance"] ?? 0;
            const barColor =
              porcentaje >= 80
                ? "bg-success"
                : porcentaje >= 50
                  ? "bg-warning"
                  : "bg-danger";

            const container = document.createElement("div");
            (cell as HTMLElement).innerHTML = "";
            cell.appendChild(container);

            const content = (
              <div className="d-flex flex-column w-100 me-2">
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
                  />
                </div>
              </div>
            );

            ReactDOM.createRoot(container).render(content);
          } catch (error) {
            console.warn("Error renderizando columna 'avance'", error);
          }
        },
      });
    }
    //#endregion

    //#region 🟢 Columna Estado
    if (includeEstadoColumn && labelMap["estado"]) {
      cols.push({
        title: labelMap["estado"],
        /* 1️⃣  Sigue usando null: DataTables enviará la fila completa al render */
        data: null,
        orderable: true,
        searchable: true,
        defaultContent: "",
        /* 2️⃣  Render ortogonal para export/filter/sort */
        render: function (_data, type, row) {
          if (type === "export") {
            const nombre = (row as any)?.estado?.nombre ?? "";
            return nombre
              ? nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase()
              : "";
          }
          if (type === "filter" || type === "sort") {
            return (row as any)?.estado?.nombre ?? "";
          }
          return "";
        },
        createdCell: (cell, _data, row) => {
          try {
            const estado =
              (row as any)?.estado?.nombre?.toLowerCase?.() ?? "N/A";
            const badgeClassMap: Record<string, string> = {
              activo: "badge-light-success",
              nuevo: "badge badge-secondary",
              "en proceso": "badge-light-primary",
              "en espera": "badge-light-warning",
              completado: "badge-light-success",
              eliminado: "badge-light-danger",
              inactivo: "badge-light-light",
              borrador: "badge-light-info",
              anulado: "badge-light-danger",
              aprobado: "badge-light-success",
              default: "badge badge-dark",
            };
            const badgeClass =
              badgeClassMap[estado] || badgeClassMap["default"];
            const container = document.createElement("span");
            (cell as HTMLElement).innerHTML = "";
            cell.appendChild(container);
            ReactDOM.createRoot(container).render(
              <span className={`badge ${badgeClass}`}>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </span>
            );
          } catch (err) {
            console.warn("Estado error:", err);
          }
        },
      });
    }
    //#endregion

    //#region 🛠️ Columna Acciones
    cols.push({
      title: "Acciones",
      data: null,
      orderable: false,
      searchable: false,
      defaultContent: "",
      className: "noExport text-center",
      createdCell: (cell, _, row) => {
        try {
          const container = document.createElement("div");
          (cell as HTMLElement).innerHTML = "";
          cell.appendChild(container);
          ReactDOM.createRoot(container).render(
            <ActionButtons
              rowData={row as T}
              onEdit={() => onEdit(row as T)}
              onDelete={() => onDelete(row as T)}
              dataTableButtons={dataTableButtons}
            />
          );
        } catch (err) {
          console.warn("Error render actions", err);
        }
      },
    });
    //#endregion

    if (cols.length > 0) {
      const lastIdx = cols.length - 1;

      // Primera columna: máxima prioridad (se queda visible)
      // @ts-expect-error  — por el uso de la librerí a con react
      cols[0] = { ...cols[0], responsivePriority: 1 };

      // Última columna visible actual: segunda prioridad (se queda visible si hay espacio)
      // @ts-expect-error  — por el uso de la librerí a con react
      cols[lastIdx] = { ...cols[lastIdx], responsivePriority: 2 };

      // Asignar prioridades crecientes al resto (preserva orden)
      for (let i = 1; i < lastIdx; i++) {
        // @ts-expect-error  — por el uso de la librerí a con react
        cols[i] = { ...cols[i], responsivePriority: 3 + i };
      }
    }

    // 🆕 Columna oculta para ordenar siempre el último cambio primero (modo independiente)
    cols.push({
      title: "__seq",
      data: "__seq" as any,
      visible: false,
      searchable: false,
      orderable: true,
      className: "never",
    });

    return cols;
  }, [
    data,
    independent,
    columnKeys,
    labelMap,
    customColumns,
    includeEstadoColumn,
    nowrapColumns,
    customRenderers,
    onDelete,
    onEdit,
    dataTableButtons,
  ]);
  //#endregion

  //#region 🧠 Inicialización tabla con jQuery DataTable
  useEffect(() => {
    const table = tableRef.current;
    if (!table || dtColumns.length === 0) return;

    if ($.fn.dataTable.isDataTable(table)) {
      $(table).DataTable().destroy();
      $(table).empty();
    }

    const headerOffset =
      document.querySelector<HTMLElement>(".navbar, .app-navbar, .header")
        ?.offsetHeight ?? 0;

    try {
      const dtInstance = $(table).DataTable({
        data: data,
        // @ts-expect-error  — «title» aún no está en las typings
        fixedHeader: {
          header: true,
          headerOffset, // pon 0 si no tienes barra fija
        },
        columns: dtColumns,

        responsive: {
          details: {
            type: "inline", // ✅ mantiene el control en la primera columna
            target: 0, // ✅ primera columna visible
            // 👇 usa el HTML real del <td> para que se vea tu contenido personalizado
            // @ts-expect-error — compat v1/v2
            renderer: function (api, rowIdx, columns) {
              try {
                const rowsHtml = columns
                  // @ts-expect-error — compat v1/v2
                  .map(function (col) {
                    if (!col.hidden) return "";
                    // ⛔ saltar la columna interna __seq tanto por título como por data-key
                    const t = String(col.title ?? "").toLowerCase();
                    const d = String(col.data ?? "").toLowerCase?.() ?? "";
                    if (t === "__seq" || d === "__seq") return "";

                    // Índice de columna (v2: columnIndex, v1: column)
                    const cIdx = col.columnIndex ?? col.column;

                    // HTML actual del <td>
                    let cellHtml = "";
                    try {
                      const node = api
                        .cell(rowIdx, cIdx)
                        .node() as HTMLTableCellElement | null;
                      cellHtml = node ? node.innerHTML : col.data ?? "";
                    } catch {
                      cellHtml = col.data ?? "";
                    }

                    if (!cellHtml || String(cellHtml).trim() === "") {
                      cellHtml =
                        '<span aria-hidden="true" class="text-muted">—</span>';
                    }

                    return `
              <tr data-dt-row="${rowIdx}" data-dt-column="${cIdx}">
                <td class="fw-semibold pe-3">${col.title}</td>
                <td class="text-wrap">${cellHtml}</td>
              </tr>
            `;
                  })
                  .join("");

                if (!rowsHtml) return false; // si no hay ocultas, no mostrar el detalle
                // 👇 ahora con .dtr-details para poder estilizarla sin afectar la tabla principal
                return $(
                  '<table class="dtr-details table table-sm mb-0 w-100"/>'
                ).append(rowsHtml);

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (e) {
                // Fallback al renderer por defecto si hiciera falta
                // @ts-expect-error — acceso a renderer built-in
                return $.fn.dataTable.Responsive.renderer.tableDisplay()(
                  api,
                  rowIdx,
                  columns
                );
              }
            },
            headerCallback: function (thead: any) {
              // Centrar SIEMPRE todos los <th> del thead original
              $(thead).find("th").addClass("text-center");
            },
          },
        },

        autoWidth: false, // ✅ evita cálculos innecesarios
        columnDefs: [
          { targets: "_all", className: "text-center", defaultContent: "" },
          { targets: 0, className: "dtr-control text-nowrap" },
        ],

        // 👇 Orden por __seq desc si independiente; si no, dejas el tuyo original
        order: independent ? [[dtColumns.length - 1, "desc"]] : [[0, "desc"]],
        searchDelay: 200,
        processing: true,
        language: {
          search: "",
          searchPlaceholder: "Buscar…",
          emptyTable: `
          <div class="dt-empty-state d-flex flex-column align-items-center justify-content-center py-10">
            <i class="bi bi-inbox fs-1 text-muted" aria-hidden="true"></i>
            <span class="text-muted mt-2">Sin datos</span>
          </div>
        `,
          lengthMenu:
            '<span class="d-none d-sm-inline">Mostrar</span> _MENU_ <span class="d-none d-sm-inline">registros</span>',
          zeroRecords: `
          <div class="dt-empty-state d-flex flex-column align-items-center justify-content-center py-10">
            <i class="bi bi-search fs-1 text-muted" aria-hidden="true"></i>
            <span class="text-muted mt-2">Sin coincidencias</span>
            <small class="text-muted d-none d-sm-inline mt-1">Prueba otros términos o limpia el filtro</small>
          </div>
        `,
          info: "Mostrando página _PAGE_ de _PAGES_",
          infoEmpty: "",
          infoFiltered: " (filtrado de _MAX_ registros totales)",
          paginate: {
            first: "Primero",
            last: "Último",
            previous: "Anterior",
            next: "Siguiente",
          },
          processing: `
          <div class="dt-loading-inline d-flex flex-column align-items-center justify-content-center py-10">
            <i class="bi bi-arrow-repeat fs-1 text-muted dt-rotate" aria-hidden="true"></i>
            <span class="text-muted mt-2">Cargando…</span>
          </div>
        `,
        },
        deferRender: true,
        destroy: true,
        dom:
          "<'dt-toolbar d-flex flex-wrap align-items-center gap-2 px-2'<'me-auto'l><'ms-auto d-flex align-items-center flex-wrap gap-2'Bf>>" +
          "rt" +
          "<'dt-footer row gy-2 gx-2 align-items-center justify-content-center justify-content-md-between px-2'" +
          "<'col-12 col-md-auto order-2 order-md-1 text-center text-md-start'i>" +
          "<'col-12 col-md-auto order-1 order-md-2 text-center text-md-end ms-md-auto'p>" +
          ">",

        pageLength: 50,
        lengthMenu: [
          [10, 25, 50, 100],
          [10, 25, 50, 100],
        ],
        buttons: [
          {
            extend: "excelHtml5",
            text: `
  <i class="bi bi-download fs-5 js-btn-icon" aria-hidden="true"></i>
  <span class="visually-hidden">Exportar Excel</span>
  <span class="js-btn-label d-none d-sm-inline">Exportar Excel</span>
`,
            className:
              "btn btn-success btn-sm mb-0 d-flex align-items-center justify-content-center gap-2",
            filename:
              "Reporte " +
              title +
              " " +
              new Date()
                .toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
                .split("/")
                .join("-"),
            titleAttr: "Descargar como Excel",
            exportOptions: {
              // incluye TODAS las columnas (aunque estén ocultas por responsive),
              // excepto "Acciones" y "__seq" y cualquier .noExport
              columns: (idx: number, _data: unknown, node: Node | null) => {
                // fuera Acciones y __seq por índice conocido
                if (idx === dtColumns.length - 2 || idx === dtColumns.length - 1) return false;

                // respeta columnas marcadas con .noExport
                const th = node as HTMLElement | null;
                if (th?.classList.contains("noExport")) return false;

                // seguridad extra por título (por si cambian el orden)
                const titleTxt = (th?.textContent || "").trim().toLowerCase();
                if (titleTxt === "__seq" || titleTxt === "acciones") return false;

                return true; // ✅ exportar esta columna aunque esté oculta en móvil
              },
              orthogonal: "export",
            },
            title:
              "Negocio: " +
              state.negocio?.nombreNegocio +
              ", Reporte: " +
              title +
              " " +
              new Date()
                .toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
                .split("/")
                .join("-"),
            sheetName: "Datos",
            stripeClasses: ["zebra-odd", "zebra-even"],
          },
        ],
      });

      // 🆕 Guarda la instancia
      dtApiRef.current = dtInstance;

      if (independent && Array.isArray(data) && data.length > 0) {
        didInitialLoadRef.current = true;
      }

      // 🆕 Ejecuta cualquier operación que quedó en cola (load/upsert/etc. antes del init)
      if (pendingOpsRef.current.length) {
        const pending = [...pendingOpsRef.current];
        pendingOpsRef.current = [];
        pending.forEach((fn) => {
          try {
            fn(dtInstance);
          } catch {
            /* empty */
          }
        });
      }

      //#region Estilos

      // 🎨 Estilos para el bloque "info" (DT2: .dt-info / DT1: .dataTables_info)
      const styleInfo = () => {
        const $wrapper = $(table).closest(".dt-container, .dataTables_wrapper");
        const $info = $wrapper.find(".dt-info, .dataTables_info");
        $info.css({ color: "#b5b5c3", padding: "5px" });
      };
      styleInfo();
      // Reaplicar en redraw / cambio de página / longitud
      $(table)
        .off("draw.dt._styleInfo page.dt._styleInfo length.dt._styleInfo")
        .on(
          "draw.dt._styleInfo page.dt._styleInfo length.dt._styleInfo",
          styleInfo
        );

      // 🎨 Estilo para el footer (margen superior de 10px)
      const styleFooter = () => {
        const $wrapper = $(table).closest(".dt-container, .dataTables_wrapper");
        $wrapper.find(".dt-footer").css({ marginTop: "15px" });
      };
      styleFooter();
      // Reaplicar en redraw / cambio de página / cambio de longitud
      $(table)
        .off("draw.dt._styleFooter page.dt._styleFooter length.dt._styleFooter")
        .on(
          "draw.dt._styleFooter page.dt._styleFooter length.dt._styleFooter",
          styleFooter
        );

      // 🎨 Separación del panel superior (toolbar) respecto a la tabla (15px)
      const styleToolbar = () => {
        const $wrapper = $(table).closest(".dt-container, .dataTables_wrapper");
        $wrapper.find(".dt-toolbar").css({ marginBottom: "10px" });
      };
      styleToolbar();
      // Reaplicar en redraw / cambio de página / cambio de longitud
      $(table)
        .off(
          "draw.dt._styleToolbar page.dt._styleToolbar length.dt._styleToolbar"
        )
        .on(
          "draw.dt._styleToolbar page.dt._styleToolbar length.dt._styleToolbar",
          styleToolbar
        );

      // 🎨 Quitar negrita en títulos de columna (thead) — original y FixedHeader
      const styleHeader = () => {
        const $wrapper = $(table).closest(".dt-container, .dataTables_wrapper");
        // Header original
        $wrapper.find("table thead th").css({ fontWeight: "400" });
        // Header flotante de FixedHeader (DT2 y DT1)
        $(".dtfh-floatingparent thead th, .fixedHeader-floating thead th").css({
          fontWeight: "400",
        });
      };
      styleHeader();
      // Reaplicar en redraw / cambios responsivos / re-cálculo
      $(table)
        .off(
          "draw.dt._styleHeader responsive-resize.dt._styleHeader column-sizing.dt._styleHeader"
        )
        .on(
          "draw.dt._styleHeader responsive-resize.dt._styleHeader column-sizing.dt._styleHeader",
          styleHeader
        );

      // 🎨 Header: flechas sólo en hover y hover sutil (DT v2 y v1)
      (() => {
        const styleId = "dt-header-hover-sort-style";
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = `
/* ===== DataTables v2: el icono suele ser un span .dt-column-order ===== */
.dt-container table.dataTable thead th .dt-column-order {
  opacity: 0;
  transition: opacity .15s ease;
}
.dt-container table.dataTable thead th:hover .dt-column-order,
.dt-container table.dataTable thead th.dt-ordering .dt-column-order {
  opacity: 1;
}

/* ===== DataTables v1: las flechas son pseudo-elementos :before/:after ===== */
.dataTables_wrapper table.dataTable thead th.sorting:before,
.dataTables_wrapper table.dataTable thead th.sorting:after {
  opacity: 0;
  transition: opacity .15s ease;
}
.dataTables_wrapper table.dataTable thead th.sorting:hover:before,
.dataTables_wrapper table.dataTable thead th.sorting:hover:after {
  opacity: 1;
}
/* Mantener visibles cuando la columna está ordenada */
.dataTables_wrapper table.dataTable thead th.sorting_asc:before,
.dataTables_wrapper table.dataTable thead th.sorting_asc:after,
.dataTables_wrapper table.dataTable thead th.sorting_desc:before,
.dataTables_wrapper table.dataTable thead th.sorting_desc:after {
  opacity: 1;
}

/* ===== Hover del título: sin borde/caja, solo un fill MUY tenue ===== */
.dt-container table.dataTable thead th:hover,
.dataTables_wrapper table.dataTable thead th:hover {
  background-color: rgba(0,0,0,0.03) !important;
  box-shadow: none !important;
  outline: none !important;
  border-color: transparent !important;
}
`;
          document.head.appendChild(style);
        }
      })();

      // 🎯 Asegurar que la flechita quede visible en la columna ordenada (DT v2)
      // (complementa el style previo; no lo reemplaza)
      (() => {
        const styleId = "dt-header-hover-sort-style-extra";
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = `
/* Si el TH tiene orden asc/desc, mostrar el icono aunque no haya hover */
.dt-container table.dataTable thead th.dt-ordering-asc .dt-column-order,
.dt-container table.dataTable thead th.dt-ordering-desc .dt-column-order {
  opacity: 1;
}
`;
          document.head.appendChild(style);
        }
      })();

      // 🎨 Aumentar suavemente la altura del header (thead) — original y FixedHeader
      (() => {
        const styleId = "dt-header-height-style";
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = `
/* Header normal (DT2 y DT1) */
.dt-container table.dataTable thead th,
.dataTables_wrapper table.dataTable thead th {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

/* Header flotante de FixedHeader (DT2 y DT1) */
.dtfh-floatingparent thead th,
.fixedHeader-floating thead th {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}
`;
          document.head.appendChild(style);
        }
      })();

      // 🎯 FixedHeader: mantener flechas ocultas salvo hover y visibles en la columna ordenada
      (() => {
        const styleId = "dt-header-hover-sort-style-fh";
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = `
/* ===== DataTables v2 (FixedHeader): el flotante vive en .dtfh-floatingparent ===== */
.dtfh-floatingparent thead th .dt-column-order {
  opacity: 0;
  transition: opacity .15s ease;
}
.dtfh-floatingparent thead th:hover .dt-column-order,
.dtfh-floatingparent thead th.dt-ordering .dt-column-order,
.dtfh-floatingparent thead th.dt-ordering-asc .dt-column-order,
.dtfh-floatingparent thead th.dt-ordering-desc .dt-column-order {
  opacity: 1;
}

/* ===== DataTables v1 (FixedHeader): pseudo-elementos en .fixedHeader-floating ===== */
.fixedHeader-floating thead th.sorting:before,
.fixedHeader-floating thead th.sorting:after {
  opacity: 0;
  transition: opacity .15s ease;
}
.fixedHeader-floating thead th.sorting:hover:before,
.fixedHeader-floating thead th.sorting:hover:after {
  opacity: 1;
}
.fixedHeader-floating thead th.sorting_asc:before,
.fixedHeader-floating thead th.sorting_asc:after,
.fixedHeader-floating thead th.sorting_desc:before,
.fixedHeader-floating thead th.sorting_desc:after {
  opacity: 1;
}
`;
          document.head.appendChild(style);
        }
      })();

      // 📱 Desactivar hover gris del header SOLO en móvil / pantallas táctiles
      (() => {
        const id = "dt-header-hover-mobile-off";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* Teléfono (xs) o dispositivos sin hover (táctiles) */
@media (max-width: 575.98px), (hover: none) and (pointer: coarse) {
  /* DT v2 — header normal */
  .dt-container table.dataTable thead>tr>th.dt-orderable-asc:hover,
  .dt-container table.dataTable thead>tr>th.dt-orderable-desc:hover,
  .dt-container table.dataTable thead>tr>td.dt-orderable-asc:hover,
  .dt-container table.dataTable thead>tr>td.dt-orderable-desc:hover {
    background-color: transparent !important;
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
  }
  /* DT v2 — FixedHeader (header flotante) */
  .dtfh-floatingparent table.dataTable thead>tr>th.dt-orderable-asc:hover,
  .dtfh-floatingparent table.dataTable thead>tr>th.dt-orderable-desc:hover,
  .dtfh-floatingparent table.dataTable thead>tr>td.dt-orderable-asc:hover,
  .dtfh-floatingparent table.dataTable thead>tr>td.dt-orderable-desc:hover {
    background-color: transparent !important;
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
  }
  /* DT v1 (por compatibilidad) */
  .dataTables_wrapper table.dataTable thead>tr>th.sorting:hover,
  .dataTables_wrapper table.dataTable thead>tr>th.sorting_asc:hover,
  .dataTables_wrapper table.dataTable thead>tr>th.sorting_desc:hover,
  .fixedHeader-floating table.dataTable thead>tr>th.sorting:hover,
  .fixedHeader-floating table.dataTable thead>tr>th.sorting_asc:hover,
  .fixedHeader-floating table.dataTable thead>tr>th.sorting_desc:hover {
    background-color: transparent !important;
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
  }

  /* Extra: quita highlight gris en tap (iOS/Android) */
  .dtfh-floatingparent *, .dt-container * {
    -webkit-tap-highlight-color: transparent;
  }
}
`;
          document.head.appendChild(s);
        }
      })();

      // 🎨 Zebra personalizado sutil (#398bc2) SOLO para esta tabla
      (() => {
        // Limpia estilos previos anti-zebra o zebra antiguos (si existieran)
        document.getElementById("dt-no-zebra")?.remove();
        document.getElementById("dt-striped-custom")?.remove();

        // Marca esta tabla para scopear la regla
        $(table).attr("data-zebra-custom", "398bc2");

        const id = "dt-zebra-custom-398bc2";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;

          // 🎛️ Ajusta la intensidad: 0.02 (muy tenue) – 0.08 (más visible)
          const subtle = "rgba(57, 139, 194, 0.02)";

          s.textContent = `
      /* Usar clases .odd de DataTables (más robusto con filas child/responsive) */
      table[data-zebra-custom="398bc2"].dataTable tbody tr.odd > * {
        background-color: ${subtle} !important;
      }
      /* Fallback por si algún tema no aplica .odd: alternar por posición */
      table[data-zebra-custom="398bc2"].dataTable tbody tr:nth-of-type(odd) > * {
        background-color: ${subtle} !important;
      }
    `;
          document.head.appendChild(s);
        }
      })();

      // 🎨 En hover de la fila, forzar texto blanco SOLO dentro de .dt-hover-invert
      (() => {
        const id = "dt-hover-invert-inner-style";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* Sólo donde existe hover real (desktop/touchpad) */
@media (hover: hover) and (pointer: fine) {
  /* DataTables v2 y v1 con .table-hover */
  .dt-container table.dataTable.table-hover tbody tr:hover td .dt-hover-invert,
  .dataTables_wrapper table.dataTable.table-hover tbody tr:hover td .dt-hover-invert {
    color: #ffffff !important;
    filter: brightness(1) !important;
  }
  .dt-container table.dataTable.table-hover tbody tr:hover td .dt-hover-invert *,
  .dataTables_wrapper table.dataTable.table-hover tbody tr:hover td .dt-hover-invert * {
    color: #ffffff !important;
    fill: #ffffff !important;              /* para SVGs/íconos */
    border-color: #ffffff !important; /* bordes sutiles si los hay */
  }

  /* Opcional: bajar un poco fondos sutiles para mejor contraste */
  .dt-container table.dataTable.table-hover tbody tr:hover td .dt-hover-invert [class*="bg-"],
  .dataTables_wrapper table.dataTable.table-hover tbody tr:hover td .dt-hover-invert [class*="bg-"] {
    filter: brightness(1) !important;
  }
}
`;
          document.head.appendChild(s);
        }
      })();

      // ➖ Rellenar celdas vacías con un guion em (solo en display)
      (() => {
        const DASH_HTML =
          '<span aria-hidden="true" class="text-muted">—</span>';

        const fillEmptyCells = () => {
          // Busca sólo en el cuerpo (tbody)
          $(table)
            .find("tbody td")
            .each(function () {
              const td = this as HTMLTableCellElement;

              // Si la celda ya tiene contenido renderizado (React/HTML), no tocar
              if (td.childElementCount > 0) return;

              // Si tiene texto “real”, mantenerlo (p. ej. 0, ₡0, etc.)
              const txt = (td.textContent || "").trim();
              if (txt !== "") return;

              // En vacío → muestra el dash sutil
              td.innerHTML = DASH_HTML;
            });
        };

        // Aplicar ahora y re-aplicar en cada redraw / cambio de página / responsive
        fillEmptyCells();
        $(table)
          .off(
            "draw.dt._dash page.dt._dash length.dt._dash search.dt._dash responsive-display.dt._dash"
          )
          .on(
            "draw.dt._dash page.dt._dash length.dt._dash search.dt._dash responsive-display.dt._dash",
            fillEmptyCells
          );
      })();

      // 📄 Subtabla responsive: alinear a la IZQUIERDA el contenido de la 2.ª columna
      (() => {
        // elimina el estilo de centrado si estaba cargado
        document.getElementById("dt-responsive-center-flexwrap")?.remove();

        const id = "dt-responsive-left-flexwrap";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* En el detalle responsive, 2.ª columna (valor) a la izquierda */
.dtr-details tr > td:nth-child(2) {
  text-align: left !important;
  vertical-align: middle;
}

/* Si el valor usa un contenedor flex (como "referencias"), alinear a la izquierda */
.dtr-details tr > td:nth-child(2) .d-flex.flex-wrap {
  justify-content: flex-start !important;
}

/* Opcional: anulamos el margen negativo para no “empujar” afuera */
.dtr-details tr > td:nth-child(2) .ms-n1 {
  margin-left: 0 !important;
}

/* Asegura buen alineado vertical de badges/iconos */
.dtr-details tr > td:nth-child(2) .badge {
  display: inline-flex;
  align-items: center;
}
`;
          document.head.appendChild(s);
        }
      })();

      (() => {
        const id = "dt-main-center-flexwrap";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
.dt-container table.dataTable tbody td .d-flex.flex-wrap.ms-n1,
.dataTables_wrapper table.dataTable tbody td .d-flex.flex-wrap.ms-n1 {
  justify-content: center !important;
  margin-left: 0 !important;
}
`;
          document.head.appendChild(s);
        }
      })();

      // ✅ Centrar SOLO en la tabla principal (no aplica a filas .child ni a la subtabla)
      (() => {
        // borra el viejo si existe
        document.getElementById("dt-main-center-flexwrap")?.remove();

        const id = "dt-main-center-flexwrap";
        const s = document.createElement("style");
        s.id = id;
        s.textContent = `
/* Solo filas normales, NO .child (que alojan la dtr-details) */
.dt-container table.dataTable tbody tr:not(.child) td .d-flex.flex-wrap.ms-n1,
.dataTables_wrapper table.dataTable tbody tr:not(.child) td .d-flex.flex-wrap.ms-n1 {
  justify-content: center !important;
  margin-left: 0 !important;
}
`;
        document.head.appendChild(s);
      })();

      // 📄 Subtabla (dtr-details): alinear A LA IZQUIERDA la 2ª columna y tu contenedor flex
      (() => {
        const id = "dt-responsive-left-flexwrap-exact";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* Texto de la 2ª columna del detalle: izquierda */
.dtr-details tr > td:nth-child(2) {
  text-align: left !important;
  vertical-align: middle;
}

/* Tu patrón exacto: td > .w-100 > .d-flex.flex-wrap.ms-n1 … */
.dtr-details tr > td:nth-child(2) > .w-100 > .d-flex.flex-wrap.ms-n1 {
  justify-content: flex-start !important;
  margin-left: 0 !important; /* anula ms-n1 */
}

/* Por si en algún caso no viene .ms-n1 */
.dtr-details tr > td:nth-child(2) > .w-100 > .d-flex.flex-wrap {
  justify-content: flex-start !important;
}

/* Alineado vertical decente para las badges */
.dtr-details tr > td:nth-child(2) .badge {
  display: inline-flex;
  align-items: center;
}
`;
          document.head.appendChild(s);
        }
      })();

      // 📄 Subtabla responsive (detalle): 2.ª columna a la IZQUIERDA + soporte para tu contenedor flex
      (() => {
        const id = "dt-responsive-left-force";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* 2.ª columna (valor) de la tabla de detalle */
tr.child td > table.dtr-details tbody tr > td:nth-child(2) {
  text-align: left !important;
  vertical-align: middle;
}

/* Tu patrón exacto: td > .w-100 > .d-flex.flex-wrap(.ms-n1) … */
tr.child td > table.dtr-details tbody tr > td:nth-child(2) > .w-100 > .d-flex.flex-wrap {
  justify-content: flex-start !important;
}
tr.child td > table.dtr-details tbody tr > td:nth-child(2) > .w-100 > .d-flex.flex-wrap.ms-n1 {
  margin-left: 0 !important; /* anula ms-n1 que empuja a la izquierda */
}

/* Alineado vertical decente para las badges */
tr.child td > table.dtr-details tbody tr > td:nth-child(2) .badge {
  display: inline-flex;
  align-items: center;
}
`;
          document.head.appendChild(s);
        }
      })();

      // 🔧 Helper para aplicar estilos con !important a un set de elementos
      const setImportant = (
        els: JQuery<HTMLElement>,
        prop: string,
        value: string
      ) => {
        els.each(function () {
          (this as HTMLElement).style.setProperty(prop, value, "important");
        });
      };

      // Reaplica por si el panel se vuelve a dibujar
      $(table)
        .off("responsive-display.dt._leftForce")
        .on("responsive-display.dt._leftForce", function (_e, _dt, row, show) {
          if (!show) return;
          const $child = $(row.node()).next("tr.child");

          // ✅ 2.ª columna del detalle: alineación a la izquierda con !important
          setImportant(
            $child.find("td > table.dtr-details td:nth-child(2)"),
            "text-align",
            "left"
          );
          setImportant(
            $child.find("td > table.dtr-details td:nth-child(2)"),
            "vertical-align",
            "middle"
          );

          // ✅ Tu contenedor flex “referencias” con !important
          setImportant(
            $child.find(
              "td > table.dtr-details td:nth-child(2) > .w-100 > .d-flex.flex-wrap"
            ),
            "justify-content",
            "flex-start"
          );
          setImportant(
            $child.find(
              "td > table.dtr-details td:nth-child(2) > .w-100 > .d-flex.flex-wrap.ms-n1"
            ),
            "margin-left",
            "0"
          );
        });

      // 🎨 Estado vacío: fuerza ancho completo cuando no hay filas (y centra ya mismo)
      (() => {
        const id = "dt-empty-state-center-fix";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* Si la tabla está vacía, ocupa 100% (DT2 y DT1) */
.dt-container table.dataTable:has(tbody td.dt-empty),
.dataTables_wrapper table.dataTable:has(tbody td.dataTables_empty) {
  width: 100% !important;
}

/* Asegura que la celda vacía tenga ancho completo y buen padding */
.dt-container table.dataTable tbody td.dt-empty,
.dataTables_wrapper table.dataTable tbody td.dataTables_empty {
  width: 100% !important;
  text-align: center !important;
  vertical-align: middle !important;
  padding: 2rem 0 !important;
}

/* Fallback por clase (por si :has no está disponible) */
.dt-container table.dataTable.dt-empty-fullwidth,
.dataTables_wrapper table.dataTable.dt-empty-fullwidth {
  width: 100% !important;
}
`;
          document.head.appendChild(s);
        }
      })();

      // 🎨 Desactivar hover de filas cuando la tabla esté vacía
      (() => {
        const id = "dt-disable-hover-when-empty";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* Sin highlight en hover si la tabla tiene dt-no-hover */
.dt-container table.dataTable.table-hover.dt-no-hover tbody tr:hover > *,
.dataTables_wrapper table.dataTable.table-hover.dt-no-hover tbody tr:hover > * {
  background-color: transparent !important;
}

/* Anula inversión de colores de tu .dt-hover-invert cuando no hay datos */
.dt-container table.dataTable.table-hover.dt-no-hover tbody tr:hover td .dt-hover-invert,
.dataTables_wrapper table.dataTable.table-hover.dt-no-hover tbody tr:hover td .dt-hover-invert {
  color: inherit !important;
  fill: inherit !important;
  border-color: inherit !important;
}
`;
          document.head.appendChild(s);
        }
      })();

      // 🎨 Apagar hover cuando no hay registros (varias rutas de escape)
      (() => {
        const id = "dt-empty-hover-kill";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* A) Si marcamos la tabla con dt-no-hover */
table.table-hover.dataTable.dt-no-hover tbody tr:hover > *,
.dataTables_wrapper table.table-hover.dataTable.dt-no-hover tbody tr:hover > * {
  background-color: transparent !important;
}

/* B) Si la tabla está vacía (DT2 y DT1) */
table.table-hover.dataTable:has(tbody td.dt-empty) tbody tr:hover > *,
.dataTables_wrapper table.table-hover.dataTable:has(tbody td.dataTables_empty) tbody tr:hover > * {
  background-color: transparent !important;
}

/* C) Si marcamos SOLO la fila placeholder desde JS */
table.table-hover.dataTable tbody tr.no-hover-row:hover > * {
  background-color: transparent !important;
}
`;
          document.head.appendChild(s);
        }
      })();

      // 🔁 Fallback JS: añade/quita clase cuando está vacía y ajusta colspan
      const ensureEmptyFullWidth = () => {
        const $t = $(table);
        const $empty = $t.find("tbody td.dt-empty, tbody td.dataTables_empty");
        if ($empty.length) {
          $t.addClass("dt-empty-fullwidth dt-no-hover"); // (conserva lo que ya tienes)
          $t.removeClass("table-hover"); // (si ya lo pusiste, déjalo)

          // 👉 NUEVO: marca la fila placeholder para matar hover a nivel de fila
          $empty.closest("tr").addClass("no-hover-row");

          const span = dtInstance.columns({ visible: true }).count();
          $empty.attr("colspan", String(span));
          dtInstance.columns.adjust();
        } else {
          $t.removeClass("dt-empty-fullwidth dt-no-hover");
          $t.addClass("table-hover");

          // 👉 NUEVO: limpia la marca cuando vuelven registros
          $t.find("tbody tr.no-hover-row").removeClass("no-hover-row");
        }
      };

      // aplicar ahora y en redibujos relevantes
      ensureEmptyFullWidth();
      $(table)
        .off(
          "init.dt._emptyWidth draw.dt._emptyWidth page.dt._emptyWidth length.dt._emptyWidth search.dt._emptyWidth responsive-display.dt._emptyWidth"
        )
        .on(
          "init.dt._emptyWidth draw.dt._emptyWidth page.dt._emptyWidth length.dt._emptyWidth search.dt._emptyWidth responsive-display.dt._emptyWidth",
          ensureEmptyFullWidth
        );

      // 🎨 Overlay “Cargando…” + animación del ícono
      (() => {
        const id = "dt-loading-overlay-style";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* Overlay absoluto dentro del wrapper de DataTables */
.dt-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.6);
  z-index: 20;
}

/* Animación de carga para el icono */
@keyframes dtspin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
.dt-rotate { animation: dtspin 1s linear infinite }

/* Alinea el processing nativo (DT1/DT2) al centro y permite HTML bonito */
.dt-container .dt-processing,
.dataTables_wrapper .dataTables_processing {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  z-index: 21;
  background: rgba(255,255,255,.85);
  border-radius: .5rem;
  padding: 1rem 1.25rem;
  text-align: center;
  display: none; /* DataTables lo alterna a block cuando procesa */
}

/* Cuando DataTables activa procesamiento, muéstralo */
.dt-container.processing .dt-processing,
.dataTables_wrapper .dataTables_processing:empty ~ .dataTables_processing { display: block; }
`;
          document.head.appendChild(s);
        }
      })();

      // 🎨 Ocultar placeholder "Sin datos" mientras está cargando
      (() => {
        const id = "dt-hide-empty-while-loading";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* DT2 y DT1: si el wrapper está en modo carga, no mostrar la celda vacía */
.dt-loading table.dataTable tbody td.dt-empty,
.dt-loading .dataTables_wrapper table.dataTable tbody td.dataTables_empty {
  display: none !important;
}
`;
          document.head.appendChild(s);
        }
      })();

      (() => {
        const id = "dt-header-center-align";
        if (!document.getElementById(id)) {
          const s = document.createElement("style");
          s.id = id;
          s.textContent = `
/* Header normal (DT2 y DT1) */
.dt-container table.dataTable thead th,
.dataTables_wrapper table.dataTable thead th {
  text-align: center !important;
}

/* Header flotante de FixedHeader (DT2 y DT1) */
.dtfh-floatingparent thead th,
.fixedHeader-floating thead th {
  text-align: center !important;
}
`;
          document.head.appendChild(s);
        }
      })();



      //#endregion Estilos

      // Click fila
      // Click por celda, ignorando primera y última columna visibles
      $(table)
        .off("click.dtcell", "tbody td")
        .on("click.dtcell", "tbody td", function () {
          const $td = $(this);
          const $tr = $td.closest("tr");

          // Ignorar filas de detalle (Responsive)
          if ($tr.hasClass("child")) return;

          const cell = dtInstance.cell(this);
          if (!cell.any()) return;

          // Índices de columnas VISIBLES (respeta responsive/hide)
          const visibleCols = dtInstance
            .columns({ visible: true })
            .indexes()
            .toArray();
          const colIdx = cell.index().column;
          const visiblePos = visibleCols.indexOf(colIdx);

          // ⛔️ Si es la primera o la última columna visible, no hacer nada
          if (visiblePos === 0 || visiblePos === visibleCols.length - 1) return;

          // (Opcional) Si usas una columna control responsive:
          if ($td.hasClass("dtr-control")) return;

          // Disparar acción con los datos de la fila
          const row = dtInstance.row($tr);
          if (!row.any()) return;
          const rawData = row.data() as T;
          onRowClick?.(rawData);
        });

      // ✅ Nunca ocultar 1.ª y última columna en casos extremos
      $(table)
        .off("responsive-resize.dt._keepEnds")
        .on("responsive-resize.dt._keepEnds", function () {
          const n = dtInstance.columns().count();
          if (n > 1) {
            dtInstance.column(0).visible(true);
            dtInstance.column(n - 1).visible(true);
          }
        });

      // ✅ Auto-ajuste al mostrar tabs / modals (BS5)
      const adjust = () => {
        dtInstance.columns.adjust();
        // @ts-expect-error  — por el uso de la librerí a con react
        dtInstance.fixedHeader?.adjust?.();
        // @ts-expect-error  — por el uso de la librerí a con react
        dtInstance.responsive.recalc();
      };
      $(document)
        .off("shown.bs.tab.dtfix shown.bs.modal.dtfix")
        .on("shown.bs.tab.dtfix shown.bs.modal.dtfix", adjust);
    } catch (err) {
      console.error("DataTable error", err);
    }
    // ⬇️ init una sola vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //#endregion

  //#region 🔁 Actualización de datos al cambiar props
  useEffect(() => {
    const table = tableRef.current;
    if (!table || !$.fn.dataTable.isDataTable(table)) return;

    // 🆕 MODO INDEPENDIENTE: CARGA INICIAL ÚNICA si llega dataset inicial
    if (independent) {
      if (
        !didInitialLoadRef.current &&
        Array.isArray(data) &&
        data.length > 0
      ) {
        withDT((dt) => {
          const withSeqRows = data.map((r) => withSeq(r));
          dt.clear()
            .rows.add(withSeqRows)
            .order([dt.columns().count() - 1, "desc"])
            .draw(false);

          // 🔧 Recalcular anchos y responsive inmediatamente (siempre visible)
          dt.columns.adjust();
          // @ts-expect-error --d
          dt.responsive.recalc();
          // @ts-expect-error --e
          dt.fixedHeader?.adjust?.();
        });
        didInitialLoadRef.current = true;
      }
      return; // ⛔️ no escuchar más cambios del padre
    }

    try {
      const dtInstance = $(table).DataTable();
      dtInstance.clear().rows.add(data).draw();

      // Ajustes tras redibujar (por si cambia ancho)
      dtInstance.columns.adjust();
      // @ts-expect-error  — por el uso de la librerí a con react
      dtInstance.fixedHeader?.adjust?.();
      // @ts-expect-error  — por el uso de la librerí a con react
      dtInstance.responsive.recalc();
    } catch (err) {
      console.warn("Data update error", err);
    }
  }, [data, independent]);
  //#endregion


  // 🔎 Obtiene el índice de una columna por el título (case-insensitive)
  const getColIdxByTitle = (title?: string) => {
    if (!title) return -1;
    const t = String(title).trim().toLowerCase();
    return dtColumns.findIndex(c => String((c as any).title ?? '').trim().toLowerCase() === t);
  };

  // 🔁 Re-renderiza celdas "ricas" (Acciones, Avance, Estado) de UNA fila (visible u oculta)
  const rerenderRichCellsForRow = (dt: DataTables.Api, rowIdx: number, rowData: any) => {
    const tr = dt.row(rowIdx).node() as HTMLTableRowElement | null;
    if (!tr) return;

    // 1) Acciones (penúltima; la última es __seq)
    const actionsIdx = dtColumns.length - 2;
    const tdAct = tr.cells?.[actionsIdx];
    if (tdAct) {
      tdAct.innerHTML = "";
      const container = document.createElement("div");
      tdAct.appendChild(container);
      ReactDOM.createRoot(container).render(
        <ActionButtons
          rowData={rowData}
          onEdit={() => onEdit(rowData)}
          onDelete={() => onDelete(rowData)}
          dataTableButtons={dataTableButtons}
        />
      );
    }

    // 2) Avance (si existe)
    const avanceTitle = labelMap["avance"];
    const avanceIdx = getColIdxByTitle(avanceTitle);
    if (avanceIdx >= 0) {
      const tdAv = tr.cells?.[avanceIdx];
      if (tdAv) {
        const porcentaje = (rowData as any)["avance"] ?? 0;
        const barColor =
          porcentaje >= 80 ? "bg-success" : porcentaje >= 50 ? "bg-warning" : "bg-danger";
        tdAv.innerHTML = "";
        const container = document.createElement("div");
        tdAv.appendChild(container);
        ReactDOM.createRoot(container).render(
          <div className="d-flex flex-column w-100 me-2">
            <div className="d-flex flex-stack mb-2">
              <span className="text-muted me-2 fs-7 fw-bold">{porcentaje}%</span>
            </div>
            <div className="progress h-6px w-100">
              <div
                className={`progress-bar ${barColor}`}
                role="progressbar"
                style={{ width: `${porcentaje}%` }}
                aria-valuenow={porcentaje}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        );
      }
    }

    // 3) Estado (si existe)
    const estadoTitle = includeEstadoColumn && labelMap["estado"] ? labelMap["estado"] : undefined;
    const estadoIdx = getColIdxByTitle(estadoTitle);
    if (estadoIdx >= 0) {
      const tdEs = tr.cells?.[estadoIdx];
      if (tdEs) {
        const estado = ((rowData as any)?.estado?.nombre?.toLowerCase?.() ?? "N/A");
        const badgeClassMap: Record<string, string> = {
          activo: "badge-light-success",
          nuevo: "badge badge-secondary",
          "en proceso": "badge-light-primary",
          "en espera": "badge-light-warning",
          completado: "badge-light-success",
          eliminado: "badge-light-danger",
          inactivo: "badge-light-light",
          borrador: "badge-light-info",
          anulado: "badge-light-danger",
          aprobado: "badge-light-success",
          default: "badge badge-dark",
        };
        const badgeClass = badgeClassMap[estado] || badgeClassMap["default"];
        tdEs.innerHTML = "";
        const container = document.createElement("span");
        tdEs.appendChild(container);
        ReactDOM.createRoot(container).render(
          <span className={`badge ${badgeClass}`}>
            {estado.charAt(0).toUpperCase() + estado.slice(1)}
          </span>
        );
      }
    }
  };

  // 🔄 Reconstruye el panel responsive (child) de ESA fila usando el HTML actual de los TDs
  // 🔄 Reconstruye el panel responsive (child) mostrando SOLO las columnas que ya estaba mostrando
const refreshResponsiveDetailsForRow = (dt: DataTables.Api, rowIdx: number) => {
  const tr = dt.row(rowIdx).node() as HTMLTableRowElement | null;
  if (!tr) return;

  const child = tr.nextElementSibling as HTMLElement | null;
  if (!child || !child.classList.contains("child")) return;

  const detailsTable = child.querySelector("table.dtr-details") as HTMLTableElement | null;
  if (!detailsTable) return;

  // Lee qué columnas estaba mostrando el detalle
  const currentIdxs: number[] = Array
    .from(detailsTable.querySelectorAll('tr[data-dt-column]'))
    .map(el => parseInt((el as HTMLElement).getAttribute('data-dt-column') || '', 10))
    .filter(n => Number.isFinite(n));

  // Fallback: columnas ocultas si no hay marcadores
  const targetIdxs: number[] = currentIdxs.length
    ? currentIdxs
    : (dt.columns({ visible: false }).indexes().toArray() as number[]);

  // Heurística: ¿el <td> está "pendiente" (aún sin hijos reales)?
  const looksPending = (td: HTMLTableCellElement | null) => {
    if (!td) return false;
    if (td.childNodes.length === 0) return true;
    if (td.childNodes.length === 1) {
      const n = td.childNodes[0] as Node;
      if (n.nodeType === Node.ELEMENT_NODE) {
        const el = n as HTMLElement;
        if (el.innerHTML.trim() === "") return true; // típico: <span></span> del contenedor
      }
    }
    return false;
  };

  // Construye el HTML de filas del detalle tomando TODO el DOM del <td> principal
  const buildRowsHtml = () => {
    return targetIdxs.map((cIdx) => {
      const header = dt.column(cIdx).header() as HTMLElement | null;
      const title = String(header?.textContent ?? "").trim();

      // Saltar columna interna __seq
      if (title.toLowerCase() === "__seq") return "";

      const tdNode = dt.cell(rowIdx, cIdx).node() as HTMLTableCellElement | null;
      let cellHtml = "";

      if (tdNode) {
        // Concatena outerHTML de todos los hijos (incluye anidación profunda)
        cellHtml = Array.from(tdNode.childNodes).map((n) => {
          if (n.nodeType === Node.ELEMENT_NODE) return (n as HTMLElement).outerHTML;
          return n.textContent ?? "";
        }).join("").trim();

        // Fallback si el td no tenía hijos (texto plano, etc.)
        if (!cellHtml) cellHtml = tdNode.innerHTML;
      } else {
        cellHtml = String(dt.cell(rowIdx, cIdx).data() ?? "");
      }

      if (!cellHtml || cellHtml.trim() === "") {
        cellHtml = '<span aria-hidden="true" class="text-muted">—</span>';
      }

      return `
        <tr data-dt-row="${rowIdx}" data-dt-column="${cIdx}">
          <td class="fw-semibold pe-3">${title}</td>
          <td class="text-wrap">${cellHtml}</td>
        </tr>
      `;
    }).join("");
  };

  // Si alguna de las celdas objetivo está "pendiente", esperamos a que React termine
  const tds = targetIdxs
    .map(cIdx => dt.cell(rowIdx, cIdx).node() as HTMLTableCellElement | null)
    .filter(Boolean) as HTMLTableCellElement[];

  const somePending = tds.some(looksPending);
  if (!somePending) {
    detailsTable.innerHTML = buildRowsHtml();
    // Rellena guiones en detalle si procede (ya la tienes definida arriba)
    try { ensureDashInDetailsForRow(tr); } catch { /* opcional */ }
    return;
  }

  // Espera por mutaciones (o timeout) y luego reconstruye
  const waitAll = Promise.all(tds.map(td => new Promise<void>((resolve) => {
    if (!looksPending(td)) return resolve();
    const mo = new MutationObserver(() => {
      mo.disconnect();
      resolve();
    });
    mo.observe(td, { childList: true, subtree: true });
    // Timeout de seguridad por si el render ya terminó pero no hubo mutación detectable

    setTimeout(() => { try { mo.disconnect(); } catch { /* empty */ } ; resolve(); }, 800);
  })));

  waitAll.then(() => {
    detailsTable.innerHTML = buildRowsHtml();
    try { ensureDashInDetailsForRow(tr); } catch { /* opcional */ }
  });
};


  // 🔎 Detecta el root que realmente scrollea (window o contenedor con overflow)
  const getScrollRoot = (): Window | HTMLElement => {
    const table = tableRef.current;
    if (!table) return window;
    let el: HTMLElement | null = table.parentElement;
    while (el) {
      const st = getComputedStyle(el);
      const canScrollY = (st.overflowY === 'auto' || st.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
      if (canScrollY) return el;
      el = el.parentElement;
    }
    return window;
  };

  // 🧭 Scroll suave del root hasta Y; resuelve cuando “llega” o vence el timeout
  const smoothScrollToY = (scroller: Window | HTMLElement, y: number, timeout = 1000) =>
    new Promise<void>((resolve) => {
      let done = false;
      const start = Date.now();
      const onScroll = () => {
        const cur = scroller === window ? window.pageYOffset : (scroller as HTMLElement).scrollTop;
        if (Math.abs(cur - y) < 2 || Date.now() - start > timeout) {
          if (!done) {
            done = true;
            (scroller === window ? window : (scroller as HTMLElement)).removeEventListener('scroll', onScroll as any);
            resolve();
          }
        }
      };
      (scroller === window ? window : (scroller as HTMLElement)).addEventListener('scroll', onScroll as any, { passive: true });
      if (scroller === window) window.scrollTo({ top: y, behavior: 'smooth' });
      else (scroller as HTMLElement).scrollTo({ top: y, behavior: 'smooth' });
      setTimeout(onScroll, timeout + 60); // fallback
    });

  // 💡 Flash medido en viewport (evita header fijo y contenedores con scroll)
  const flashRowViewport = (tr: HTMLElement) => {
    ensureFlashStyles();
    if (!tr.hasAttribute('tabindex')) tr.setAttribute('tabindex', '-1');
    tr.focus({ preventScroll: true });

    const r1 = tr.getBoundingClientRect();
    let { top, left, right, bottom } = r1;

    const child = tr.nextElementSibling as HTMLElement | null;
    if (child && child.classList.contains('child') && child.offsetParent !== null) {
      const r2 = child.getBoundingClientRect();
      top = Math.min(top, r2.top);
      left = Math.min(left, r2.left);
      right = Math.max(right, r2.right);
      bottom = Math.max(bottom, r2.bottom);
    }

    const overlay = document.createElement('div');
    overlay.className = 'flash-blue-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = `${Math.max(0, top)}px`;
    overlay.style.left = `${Math.max(0, left)}px`;
    overlay.style.width = `${Math.max(1, right - left)}px`;
    overlay.style.height = `${Math.max(1, bottom - top)}px`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 3000);
  };


  // 🆕 API imperativa: load / upsert / bulkUpsert / remove / clear / getData
  useImperativeHandle(
    ref,
    (): GenericDataTableHandle<T> => ({
      load(rows: T[]) {
        withDT((dt) => {
          const withSeqRows = rows.map((r) => withSeq(r));
          dt.clear()
            .rows.add(withSeqRows)
            .order([dt.columns().count() - 1, "desc"])
            .draw(false);

          // 🔧 Recalcular anchos y responsive inmediatamente (siempre visible)
          dt.columns.adjust();
          // @ts-expect-error --w
          dt.responsive.recalc();
          // @ts-expect-error --w
          dt.fixedHeader?.adjust?.();

        });
      },
      upsert(row: T) {
        withDT((dt) => {
          const idKey = idKeyRef.current;
          const rowId = (row as any)?.[idKey];

          const idxes = dt
            .rows((_: any, data: any) => (data?.[idKey] ?? null) === rowId)
            .indexes();

          if (idxes.length) {
            // 🔁 EDITAR EN SU LUGAR (NO mover ni redibujar)
            idxes.each((idx: number) => {
              const cur: any = dt.row(idx).data();
              const preservedSeq = cur?.__seq ?? 0;
              const updated: any = { ...(row as any), __seq: preservedSeq };

              dt.row(idx).data(updated); // sin draw()

              // Repintar Acciones (sin draw global)
              const tr = dt.row(idx).node() as HTMLTableRowElement | null;
              const actionsIdx = dtColumns.length - 2;
              const td = tr?.cells?.[actionsIdx];
              if (td) {
                td.innerHTML = "";
                const container = document.createElement("div");
                td.appendChild(container);
                ReactDOM.createRoot(container).render(
                  <ActionButtons
                    rowData={updated as T}
                    onEdit={() => onEdit(updated as T)}
                    onDelete={() => onDelete(updated as T)}
                    dataTableButtons={dataTableButtons}
                  />
                );
              }

              // Celdas ricas + detalle responsive
              rerenderRichCellsForRow(dt, idx, updated);
              refreshResponsiveDetailsForRow(dt, idx);

              

              if (tr) {
                ensureDashForRow(tr);
                ensureDashInDetailsForRow(tr);
              }

              // Highlight solo si ya está a la vista
              if (tr) {
                const cont = getScrollContainer();
                if (!cont || isInView(tr, cont)) flashRow(tr);
              }
            });
            // ⛔ Nada de draw/order/page aquí
            return;
          }

          // 🆕 INSERTAR — 2 pasos: (A) ir a pág. 1 y subir al tope, (B) insertar + flash

          // (B) Insertar y flashear después del scroll
          const doInsertAndFlash = () => {
            // Inserta y ordena por __seq en modo independent
            dt.row.add(withSeq(row));
            if (independent) {
              dt.order([dt.columns().count() - 1, "desc"]);
            }

            // Registrar el draw del INSERT antes de dibujar
            dt.one("draw.dt.insert.flash", () => {
              dt.columns.adjust();
              // @ts-expect-error --e
              dt.responsive.recalc();
              // @ts-expect-error --e
              dt.fixedHeader?.adjust?.();

              const first = dt.row(":eq(0)", { page: "current" }).node() as HTMLElement | null;
              if (first) flashRowViewport(first);
            });

            dt.draw(false);
          };

          // (A) Una vez en pág. 1, subir al tope del scroller y luego insertar
          const afterPagedAndScrolled = () => {
            dt.columns.adjust();
            // @ts-expect-error --er
            dt.responsive.recalc();
            // @ts-expect-error --er
            dt.fixedHeader?.adjust?.();

            const scroller = getScrollRoot();
            const cur = scroller === window ? window.pageYOffset : (scroller as HTMLElement).scrollTop;

            // Si ya estamos arriba, insertamos ya; si no, scroll suave y luego insertamos
            if (cur <= 2) {
              doInsertAndFlash();
            } else {
              smoothScrollToY(scroller, 0, 1000).then(() => {
                // Ajuste por si el header fijo cambió algo al terminar el scroll
                // @ts-expect-error --er
                dt.fixedHeader?.adjust?.();
                doInsertAndFlash();
              });
            }
          };

          // Si ya estamos en la primera página, no forces un draw extra
          const info = dt.page.info();
          if (info.page === 0) {
            afterPagedAndScrolled();
          } else {
            // Registrar el draw de "ir a la primera" ANTES de dispararlo
            dt.one("draw.dt.insert.pagefirst", afterPagedAndScrolled);
            dt.page("first").draw(false);
          }
        });
      }
      ,


      bulkUpsert(rows: T[]) {
        withDT((dt) => {
          if (!rows?.length) return;
          const idKey = idKeyRef.current;

          const incoming = new Map<any, T>();
          for (const r of rows) incoming.set((r as any)[idKey], r);

          // 1) Actualizar existentes EN SU LUGAR (preserva __seq) y repintar Acciones SIN draw()
          dt.rows().every(function (this: any) {
            const cur: any = this.data();
            const curId = cur?.[idKey];
            if (incoming.has(curId)) {
              const newRow = incoming.get(curId)!;
              const preservedSeq = cur?.__seq ?? 0;
              const updated: any = { ...(newRow as any), __seq: preservedSeq };

              this.data(updated); // sin draw()

              // Repintar Acciones de esta fila
              const tr = this.node() as HTMLTableRowElement | null;
              const actionsIdx = dtColumns.length - 2;
              const td = tr?.cells?.[actionsIdx];
              if (td) {
                td.innerHTML = "";
                const container = document.createElement("div");
                td.appendChild(container);
                ReactDOM.createRoot(container).render(
                  <ActionButtons
                    rowData={updated as T}
                    onEdit={() => onEdit(updated as T)}
                    onDelete={() => onDelete(updated as T)}
                    dataTableButtons={dataTableButtons}
                  />
                );
              }

              // ✅ NUEVO: rellenar vacíos en esa fila y su detalle
if (tr) {
  ensureDashForRow(tr);
  ensureDashInDetailsForRow(tr);
}


              // 👉 Si está visible, highlight
              if (tr) {
                const cont = getScrollContainer();
                if (!cont || isInView(tr, cont)) flashRow(tr);
              }

              incoming.delete(curId);
            }
          });

          // 2) Agregar los que realmente son nuevos
          let added = 0;
          incoming.forEach((r) => {
            dt.row.add(withSeq(r));
            added++;
          });

          if (!added) return; // solo había updates → no mover ni redibujar

          if (independent) {
            dt.order([dt.columns().count() - 1, "desc"]);
          }

          // Ir a primera página y dibujar una vez
          dt.page("first").draw(false);

          dt.columns.adjust();
          // @ts-expect-error --er
          dt.responsive.recalc();
          // @ts-expect-error --er
          dt.fixedHeader?.adjust?.();

          // Highlight a la primera fila recién visible

          const first = dt.row(':eq(0)', { page: 'current' }).node() as HTMLElement | null;
          if (first) flashRow(first);

        });
      },



      removeById(id: unknown) {
        withDT((dt) => {
          const idKey = idKeyRef.current;

          const idxes = dt
            .rows((_: any, data: any) => (data?.[idKey] ?? null) === id)
            .indexes();
          if (idxes.length) {
            dt.rows(idxes).remove().draw(false);
          }
        });
      },
      clear() {
        withDT((dt) => dt.clear().draw(false));
      },
      getData(): T[] {
        const dt = dtApiRef.current;
        if (!dt) return [];

        return dt
          .rows()
          .data()
          .toArray()
          .map((r: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { __seq, ...rest } = r;
            return rest;
          });
      },
    })
  );

  //#region 🎨 Render
  return (
    <>
      <div className="card mt-5">
        <div className="card-header d-flex justify-content-between align-items-center px-5 px-sm-19 d-flex">
          <h3 className="card-title text-gray-600">{title}</h3>
          <button
            onClick={onAdd}
            className="btn dt-button buttons-html5 btn btn-primary btn-sm mb-0 d-flex align-items-center justify-content-center gap-2 ms-auto"
            disabled={disableButtonAdd}
          >
            Agregar
          </button>
        </div>
        <div className="card-body table-responsive p-2 py-10 px-lg-17 pt-5">
          <table
            ref={tableRef}
            className="table table-sm table-hover align-middle text-center w-auto"
          />
        </div>
      </div>
    </>
  );
  //#endregion
}

// ✅ Export con genéricos soportados en JSX y sin error TS (cast a unknown sugerido por TS)
type GenericDataTableComponent = <T>(
  props: GenericDataTableProps<T> & {
    ref?: React.Ref<GenericDataTableHandle<T>>;
  }
) => React.ReactElement | null;

export const GenericDataTable = React.forwardRef(
  GenericDataTableInner
) as unknown as GenericDataTableComponent;
