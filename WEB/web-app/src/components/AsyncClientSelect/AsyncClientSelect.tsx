// src/components/AsyncClientSelect.tsx
import { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import { clientesService } from "@/services";
import {
  DTO_Cliente,
  DTO_Respuesta,
  DTO_SolicitudDeBusqueda,
  DTO_Negocio,
} from "@/models";
import { errorHelpers, procesarRespuesta } from "@/utils";
import { useDebouncedPromise } from "@/hooks";
import { STATUS_TBL } from "@/constants";

export interface ClientOption {
  value: number;
  label: string;
}

interface Props {
  value: ClientOption | null;
  onChange: (opt: ClientOption | null) => void;
  reloadKey?: number;
}

export const AsyncClientSelect = ({
  value,
  onChange,
  reloadKey = 0,
}: Props) => {
  const [clients, setClients] = useState<DTO_Cliente[]>([]);

  useEffect(() => {
    clientesService.obtenerClientes().subscribe({
      next: (result) =>
        setClients(
          (procesarRespuesta(
            result as unknown as DTO_Respuesta
          ) as DTO_Cliente[]) || []
        ),
      error: (err) => errorHelpers.serverError(err),
    });
  }, [reloadKey]);

  const activeClients = clients.filter(
    (c) => c.estado?.iD_Estado !== STATUS_TBL.CLIENT.DELETED
  );

  const recentOptions: ClientOption[] = useMemo(
    () =>
      activeClients.map((c) => ({
        value: c.iD_Cliente,
        label: `${c.nombreCliente} ${c.apellidoCliente}`,
      })),
    [activeClients]
  );

  const loadPromise = async (input: string): Promise<ClientOption[]> => {
    if (!input || input.trim().length < 3) return [];
    const solicitud: DTO_SolicitudDeBusqueda = {
      term: input,
      negocio: new DTO_Negocio(),
    };

    const list = await clientesService.buscarClientes(solicitud).toPromise();
    return (list ?? [])
      .filter(
        (c: DTO_Cliente) => c.estado?.iD_Estado !== STATUS_TBL.CLIENT.DELETED
      )
      .map((c: DTO_Cliente) => ({
        value: c.iD_Cliente,
        label: `${c.nombreCliente} ${c.apellidoCliente}`,
      }));
  };

  const debouncedPromiseLoad = useDebouncedPromise(loadPromise, 300);

  return (
    <>
      <div className="input-group" >
        <span className="input-group-text bg-light border-0">
          <i className="bi bi-person fs-4" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <AsyncSelect
            classNamePrefix="text-muted"
            cacheOptions
            defaultOptions={recentOptions}
            loadOptions={debouncedPromiseLoad}
            onChange={onChange}
            value={value}
            placeholder="Buscar cliente..."
            noOptionsMessage={() => "Escribe al menos 3 caracteres"}
            isMulti={false}
            styles={{
              container: (base) => ({
          ...base,
          width: "100%",
          minWidth: 0,
              }),
              control: (base) => ({
          ...base,
          minHeight: "40px",
          width: "100%",
          minWidth: 0,
              }),
              menu: (base) => ({
          ...base,
          width: "100%",
          minWidth: 0,
              }),
            }}
          />
        </div>
      </div>
    </>
  );
};
