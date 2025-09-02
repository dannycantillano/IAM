// src/components/AsyncTarifaSelect.tsx
import { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import {
  DTO_Respuesta,
  DTO_SolicitudDeBusqueda,
  DTO_Negocio,
  DTO_Proforma,
} from "@/models";
import { errorHelpers, procesarRespuesta } from "@/utils";
import { useDebouncedPromise } from "@/hooks";
import { STATUS_TBL } from "@/constants";
import { proformaService } from "@/services/proformas.service";

export interface ProformaOption {
  proforma: DTO_Proforma;
  label: string;
  value: number;
}

type Props = {
  value: ProformaOption | null;
  onChange: (opt: ProformaOption | null) => void;
  reloadKey?: number;
  negocio: DTO_Negocio;
};

export const AsyncProformaSelect = ({
  value,
  onChange,
  reloadKey = 0,
  negocio,
}: Props) => {
  const [proformas, setProformas] = useState<DTO_Proforma[]>(() => []);

  useEffect(() => {
    const proforma = new DTO_Proforma();
    proforma.iD_Negocio = negocio.iD_Negocio
    const sub = proformaService.obtenerProformas(proforma).subscribe({
      next: (result) => {
        const parsed =
          (procesarRespuesta(
            result as unknown as DTO_Respuesta
          ) as DTO_Proforma[]) || [];
        setProformas(parsed);
      },
      error: (err) => errorHelpers.serverError(err),
    });
    return () => sub.unsubscribe?.();
  }, [reloadKey, negocio]);

  const activeProformas = useMemo(
    () =>
      proformas.filter((t) => t.estado?.iD_Estado !== STATUS_TBL.CLIENT.DELETED),
    [proformas]
  );

  // este viene del obtenerTarifas
  const recentOptions: ProformaOption[] = useMemo(
    () =>
      activeProformas.map((p) => ({
        proforma: p,
        value: p.iD_Proforma ?? 0, // <-- valor único
        label: `${p.iD_Proforma + " | " + p.cliente?.nombreCliente} | ₡${Number(p.totalCalculado).toLocaleString(
          "es-CR"
        )}`,
      })),
    [activeProformas]
  );

  const loadOptions = async (input: string): Promise<ProformaOption[]> => {
    //if (!input || input.trim().length < 3) return [];
    const solicitud: DTO_SolicitudDeBusqueda = { term: input.trim(), negocio };

    const respuesta = await proformaService.buscarProformas(solicitud).toPromise();

    return (respuesta ?? []).map((p: DTO_Proforma) => ({
      proforma: p,
      value: p.iD_Proforma ?? 0, // <-- valor único
      label: `${p.iD_Proforma + " | " + p.cliente?.nombreCliente} | ₡${Number(p.totalCalculado).toLocaleString(
        "es-CR"
      )}`,
    }));
  };

  const debouncedPromiseLoad = useDebouncedPromise(loadOptions, 300);

  return (
    <AsyncSelect<ProformaOption, false>
      cacheOptions
      defaultOptions={recentOptions}
      loadOptions={debouncedPromiseLoad}
      onChange={onChange}
      value={value}
      placeholder="Buscar proforma..."
      noOptionsMessage={() => "Sin resultados"}
      isMulti={false}
      getOptionValue={(opt) => String(opt.value)}
      getOptionLabel={(opt) => opt.label}
    />
  );
};
