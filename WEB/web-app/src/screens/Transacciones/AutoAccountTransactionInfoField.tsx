import { FieldConfig } from "@/components";
import { DTO_Transacciones } from "@/models";
import { useEffect, useRef } from "react";

interface props {
    field: FieldConfig<DTO_Transacciones>;
    editData: DTO_Transacciones | null;
}

export const AutoAccountTransactionInfoField = ({ field, editData }: props) => {
  const infoIconRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (infoIconRef.current && (window as any).bootstrap) {
      new (window as any).bootstrap.Tooltip(infoIconRef.current);
    }
  }, []);
  return (
    <div className="d-flex align-items-center gap-2">
      <input
        type="text"
        className="form-control form-control-solid null"
        value={String(editData?.[field.key] ?? "")}
        disabled
      />
      <i
        ref={infoIconRef}
        className="bi bi-info-circle-fill"
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        title="Campo no editable ya que esta es una transacción creada automáticamente desde una cuenta"
      />
    </div>
  );
};
