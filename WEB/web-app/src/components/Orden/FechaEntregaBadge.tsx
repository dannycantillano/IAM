export const FechaEntregaBadge = ({
  fechaEntrega,
  fechaCreacion,
}: {
  fechaEntrega: Date | string | null;
  fechaCreacion: Date | string | null | undefined;
}) => {
  /* ────────────────────────────
   * Validaciones iniciales
   * ──────────────────────────── */
  if ((!fechaEntrega || !fechaCreacion) || fechaEntrega =="0001-01-01T00:00:00") return '---';

  const fEntrega =
    typeof fechaEntrega === "string" ? new Date(fechaEntrega) : fechaEntrega;
  const fCreacion =
    typeof fechaCreacion === "string" ? new Date(fechaCreacion) : fechaCreacion;

  if (isNaN(fEntrega.getTime()) || isNaN(fCreacion.getTime())) return null;

  /* ────────────────────────────
   * 1 ▸ Porcentaje de progreso
   * ──────────────────────────── */
  const totalMs = fEntrega.getTime() - fCreacion.getTime();
  const transMs = Date.now() - fCreacion.getTime();
  const pct = totalMs <= 0 ? 1 : Math.min(Math.max(transMs / totalMs, 0), 1); // 0–1

  /* ────────────────────────────
   * 2 ▸ Selección de clase
   * ──────────────────────────── */
  let badgeClass = "badge badge-light"; // 0–20 %
  if (pct > 0.6) badgeClass = "badge badge-light-danger"; // 60–100 %
  else if (pct > 0.4) badgeClass = "badge badge-light-warning"; // 40–60 %
  else if (pct > 0.2) badgeClass = "badge badge-light-success"; // 20–40 %

  /* ────────────────────────────
   * 3 ▸ Formateo de fecha
   * ──────────────────────────── */
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  let texto = fEntrega.toLocaleDateString("es-ES", opts).replace(",", "");
  texto = texto.charAt(0).toUpperCase() + texto.slice(1);

  return <div  
                tabIndex={0}
                role="button"
                data-bs-toggle="popover"
                data-bs-trigger="focus"
                data-bs-content={"Fecha de entrega"}
                className={badgeClass + " lbl"}>{texto}</div>;
};
