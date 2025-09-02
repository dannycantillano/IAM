// src/components/AsyncTarifaSelect.tsx
import { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import {
  DTO_Tarifa,
  DTO_Respuesta,
  DTO_SolicitudDeBusqueda,
  DTO_Negocio,
} from "@/models";
import { errorHelpers, procesarRespuesta } from "@/utils";
import { useDebouncedPromise } from "@/hooks";
import { STATUS_TBL } from "@/constants";
import { tarifasService } from "@/services/tarifas.service";

export interface TarifarioOption {
  tarifa: DTO_Tarifa;
  label: string;
  value: number;
}

type Props = {
  value: TarifarioOption | null;
  onChange: (opt: TarifarioOption | null) => void;
  reloadKey?: number;
  negocio: DTO_Negocio;
};

export const AsyncTarifaSelect = ({
  value,
  onChange,
  reloadKey = 0,
  negocio,
}: Props) => {
  const [tarifas, setTarifas] = useState<DTO_Tarifa[]>(() => []);

  useEffect(() => {
    const sub = tarifasService.obtenerTarifas(negocio).subscribe({
      next: (result) => {
        const parsed =
          (procesarRespuesta(
            result as unknown as DTO_Respuesta
          ) as DTO_Tarifa[]) || [];
        setTarifas(parsed);
      },
      error: (err) => errorHelpers.serverError(err),
    });
    return () => sub.unsubscribe?.();
  }, [reloadKey, negocio]);

  const activeTarifas = useMemo(
    () =>
      tarifas.filter((t) => t.estado?.iD_Estado !== STATUS_TBL.CLIENT.DELETED),
    [tarifas]
  );

  // este viene del obtenerTarifas
  const recentOptions: TarifarioOption[] = useMemo(
    () =>
      activeTarifas.map((t) => ({
        tarifa: t,
        value: t.iD_Tarifa ?? 0, // <-- valor único
        label: `${t.nombreTarifa} | ₡${Number(t.precioTarifa).toLocaleString(
          "es-CR"
        )}`,
      })),
    [activeTarifas]
  );

  const loadOptions = async (input: string): Promise<TarifarioOption[]> => {
    // if (!input || input.trim().length < 3) return [];
    const solicitud: DTO_SolicitudDeBusqueda = { term: input.trim(), negocio };

    const list = await tarifasService.buscarTarifas(solicitud).toPromise();
    return (list ?? [])
      .filter((t) => t.estado?.iD_Estado !== STATUS_TBL.TARIFF.DELETED)
      .map((t) => ({
        tarifa: t,
        value: t.iD_Tarifa ?? 0, // <-- valor único
        label: `${t.nombreTarifa} | ₡${Number(t.precioTarifa).toLocaleString(
          "es-CR"
        )}`,
      }));
  };

  const debouncedPromiseLoad = useDebouncedPromise(loadOptions, 300);

  return (
    <AsyncSelect<TarifarioOption, false>
      cacheOptions
      defaultOptions={recentOptions}
      loadOptions={debouncedPromiseLoad}
      onChange={onChange}
      value={value}
      placeholder="Buscar tarifa..."
      noOptionsMessage={() => "Sin resultados"}
      isMulti={false}
      getOptionValue={(opt) => String(opt.value)}
      getOptionLabel={(opt) => opt.label}
      className="text-muted"
    />
  );
};
