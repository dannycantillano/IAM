// useScrollLockSmart.ts
"use client";
import { RefObject, useEffect } from "react";

// ───────────────────────────────────────────────────────────────────────────────
// Gestor de locks con contador por contenedor (soporta múltiples modales)
// ───────────────────────────────────────────────────────────────────────────────
type LockRecord = { count: number; prevOverflow: string; prevPR: string };
const locks = new WeakMap<HTMLElement, LockRecord>();
let bodyOpenLocks = 0; // cuántos locks totales hay (para .modal-open en <body>)

function scrollbarWidthFor(el: HTMLElement): number {
  if (el === document.body || el === document.documentElement) {
    return window.innerWidth - document.documentElement.clientWidth;
  }
  // ancho de barra de scroll del contenedor
  return el.offsetWidth - el.clientWidth;
}

function acquire(container: HTMLElement) {
  const rec = locks.get(container);
  if (!rec) {
    const prevOverflow = container.style.overflow;
    const prevPR = container.style.paddingRight;

    const sw = scrollbarWidthFor(container);
    container.style.overflow = "hidden";
    if (sw > 0) container.style.paddingRight = `${sw}px`;

    locks.set(container, { count: 1, prevOverflow, prevPR });
  } else {
    rec.count++;
  }

  bodyOpenLocks++;
  if (bodyOpenLocks === 1) {
    document.body.classList.add("modal-open");
  }
}

function release(container: HTMLElement) {
  const rec = locks.get(container);
  if (rec) {
    rec.count--;
    if (rec.count <= 0) {
      container.style.overflow = rec.prevOverflow;
      container.style.paddingRight = rec.prevPR;
      locks.delete(container);
    }
  }

  bodyOpenLocks = Math.max(0, bodyOpenLocks - 1);
  if (bodyOpenLocks === 0) {
    document.body.classList.remove("modal-open");
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Utilidades para detectar el contenedor scrolleable correcto
// ───────────────────────────────────────────────────────────────────────────────
function isScrollable(el: HTMLElement) {
  const st = getComputedStyle(el);
  const oy = st.overflowY;
  return (oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight;
}

function findScrollableAncestor(start: HTMLElement | null): HTMLElement | null {
  let el = start?.parentElement || null;
  while (el) {
    if (isScrollable(el)) return el;
    el = el.parentElement;
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Hook público (MISMO NOMBRE y MISMA FIRMA)
// ───────────────────────────────────────────────────────────────────────────────
export function useScrollLockSmart<T extends HTMLElement = HTMLElement>(
  open: boolean,
  opts: { rootRef?: RefObject<T | null>; fallbackSelector?: string } = {}
) {
  useEffect(() => {
    if (!open) return;

    // 1) Preferimos bloquear el ancestro scrolleable del modal
    const rootEl = opts.rootRef?.current ?? null;
    let container = findScrollableAncestor(rootEl);

    // 2) Si no hay ancestro scrolleable, usamos un fallback explícito (ej. ".app-scroll")
    if (!container && opts.fallbackSelector) {
      container = document.querySelector<HTMLElement>(opts.fallbackSelector) || null;
    }

    // 3) Último recurso: body
    if (!container) container = document.body;

    acquire(container);

    // cleanup al cerrar (o desmontar)
    return () => {
      release(container!);
    };
    // Nota: dependemos de `open`; leemos `rootRef.current` al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, opts.rootRef, opts.fallbackSelector]);
}
