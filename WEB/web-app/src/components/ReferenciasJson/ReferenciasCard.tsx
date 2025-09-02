
export interface RefItem {
  nombre: string;
  valor: string;
}

interface Props {
  items: RefItem[];
}

export const ReferenciaCards = ({ items }: Props) => {
  if (items.length === 0) {
    return (
      <>
        <span aria-hidden="true" className="text-muted">—</span>
      </>
    );
  }

  return (
    <div className="d-flex flex-wrap ms-n1">
      {items.map((ref, idx) => (
        <span key={ref.nombre + idx} className="badge badge-light fw-semibold px-3 py-2 d-flex align-items-center">
          <span className="text-primary fw-bold me-1">{ref.nombre}{ref.valor ? `:` : ""}</span>
          <span className="text">
            {ref.valor ? ` ${ref.valor}` : ""}
          </span>
        </span>
      ))}
    </div>
  );
};
