import { useState, useEffect } from "react";
import { useApp } from "@/hooks/useApp";
import { DTO_MetricaKPI, DTO_Negocio, DTO_Respuesta } from "@/models";
import { metricaService } from "@/services";
import { errorHelpers, notificationHelpers } from "@/utils";
import { InfoPanel, KPI, LoadingPanel, Toolbar } from "@/components";
const OPCIONES = [
  { texto: "Hoy" },
  { texto: "Semana" },
  { texto: "Mes" },
  { texto: "Trimestre" },
  { texto: "Semestre" },
  { texto: "Año" },
];

export const Home = () => {
  const kpi: DTO_MetricaKPI = new DTO_MetricaKPI();
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<DTO_MetricaKPI[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<DTO_Negocio | null>(
    null
  );
  const { state } = useApp();

  useEffect(() => {
    if (state.negocio) {
      setSelectedBusiness(state.negocio);
      handleSelectBusiness(state.negocio);
    }
  }, [state]);

  const handleSelectBusiness = (neg: DTO_Negocio) => {
    setSelectedBusiness(neg);
  };

  useEffect(() => {
    if (
      selectedBusiness?.iD_Negocio != undefined &&
      selectedBusiness?.iD_Negocio > 0
    )
      obtenerMetrica();
  }, [selectedBusiness]);

  const [filtro, setFiltro] = useState(OPCIONES[1].texto); // “Hoy” por defecto

  const obtenerMetrica = () => {
    kpi.iD_Negocio = selectedBusiness?.iD_Negocio;
    kpi.filtro = filtro;

    metricaService.obtenerMetrica(kpi).subscribe({
      next: (res) => {
        if (!(res as DTO_Respuesta).tipoRespuesta) {
          notificationHelpers.errorAlert((res as DTO_Respuesta).mensaje);
        } else {
          setKpis((res as DTO_Respuesta).resultado[0] as DTO_MetricaKPI[]);
        }
      },
      error: (err) => errorHelpers.serverError(err),
      complete: () => setLoading(false),
    });
  };

  useEffect(() => {
    if (
      selectedBusiness?.iD_Negocio != undefined &&
      selectedBusiness?.iD_Negocio > 0
    )
      obtenerMetrica();
  }, [filtro]);

  const handleChange = (nuevo = "") => setFiltro(nuevo);

  return (
    <div>


      <Toolbar titulo="Inicio" />
      <div className="toolbar pb-2 pt-2" id="kt_toolbar">
        {/* Botones: visibles desde sm ≥ 576 px */}
        <div className="container-fluid d-none d-sm-flex flex-nowrap gap-2">
          {OPCIONES.map(({ texto }) => (
            <button
              key={texto}
              type="button"
              onClick={() => handleChange(texto)}
              className={`btn btn-active-primary  ${filtro === texto ? "active" : ""
                }`}
            >
              {texto}
            </button>
          ))}
        </div>

        {/* Select: visible solo en xs */}
        <div
          className="container-fluid d-block d-sm-none"
          style={{ paddingTop: "5px", paddingBottom: "5px" }}
        >
          <select
            className="form-select"
            value={filtro}
            onChange={(e) => handleChange(e.target.value)}
          >
            {OPCIONES.map(({ texto }) => (
              <option key={texto} value={texto}>
                {texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row p-4 gx-0">
        {loading ? (
          <LoadingPanel msj="Cargando transacciones..." />
        ) : selectedBusiness ? (
          <div className="col-xl-12" style={{ marginTop: "75px" }}>
            <div className="card card-xl-stretch mb-xl-8">
              <div className="card-body p-4">
                <div className="card position-relative">
                  <div className="row">
                    {kpis.map((kpi, i) => (
                      <KPI metrica={kpi} key={i} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="col-xl-12" style={{ marginTop: "50px" }}>
            <InfoPanel msj="Seleccione un negocio para ver las métricas." />
          </div>
        )}
      </div>
    </div>
  );
};
