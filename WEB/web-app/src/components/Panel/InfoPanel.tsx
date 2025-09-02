import { ROUTES } from "@/constants";
import { Link } from "react-router-dom";

interface InfoPanelProps {
  msj?: string;
}

export const InfoPanel = ({ msj }: InfoPanelProps) => {
  return (
    <>
      <div className="card shadow-sm mt-5">
        <div className="card-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-info-circle-fill text-primary fs-2"></i>
            <span className="card-title text-gray-600">Información</span>
          </div>
        </div>
        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center text-gray-400 fs-5" style={{ width: "100%" }}>
          {msj ??
            "Seleccione un negocio para ver su información. Si no tiene uno, puede crearlo fácilmente."}

          <div className="text-gray-400 fw-bold fs-7">
            ¿Aún no tiene un negocio registrado?{" "}
            <Link to={ROUTES.BUSINESS} className="link-primary fw-bolder">
              Registrar un Negocio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
