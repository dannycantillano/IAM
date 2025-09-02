import { usuarioValidator } from "@/validators/usuarioValidator";
import { usuarioService } from "@/services/usuario.service";
import { DTO_Param, DTO_Respuesta, DTO_Usuario } from "@/models";
import { errorHelpers, notificationHelpers } from "@/utils";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import { valida_DTO_Usuario } from "@/validators/valida_DTO_Usuario";

//Imagenes
import imgLogo from "@/assets/media/logos/logo-1.svg";
import imgBG from "@/assets/media/illustrations/unitedpalms-1/14-1.png";


export const SignUp = () => {
  // #region Validaciones en los formularios
  const [erroresValidacion, setErroresValidacion] = useState<DTO_Param[]>([]);
  let validacion: Array<DTO_Param>;
  const eliminarError = (campo: string) => {
    setErroresValidacion((prev) => prev.filter((e) => e.nombre !== campo));
  };
  // #endregion

  //useContext/useStates
  const [usuario, setUsuario] = useState<DTO_Usuario | null>(new DTO_Usuario());
  const [cargando, setCargando] = useState<boolean>(false);
  const [showPass, setshowPass] = useState<boolean>(false);
  const [showPassConfirm, setShowPassConfirm] = useState<boolean>(false);
  const [confirmacionPass, setconfirmacionPass] = useState<string>("");
  const navigate = useNavigate(); // <-- Move useNavigate here
  //Eventos
  const handleOnClick = () => {
    validarDatosRegistroUsuario();
  };

  //Métodos
  const validarDatosRegistroUsuario = () => {
    validacion = valida_DTO_Usuario.validar(usuario ?? new DTO_Usuario(), "C");
    setErroresValidacion(validacion);
    if (
      usuarioValidator.validarDatosRegistroUsuario(usuario, confirmacionPass)
    ) {

      registrarUsuario();
    }
  };

  const registrarUsuario = () => {
    setCargando(true);
    usuarioService.registrarUsuario(usuario).subscribe({
      next: (result) => procesarRespuesta(result as DTO_Respuesta),
      error: (err) => errorHelpers.serverError(err), //controlamos el error del servidor
      complete: () => {
        setCargando(false);
      },
    });
  };

  const procesarRespuesta = (respuesta: DTO_Respuesta) => {
    if (respuesta.codigo === "A001") {
      notificationHelpers.successAlert(respuesta.mensaje);
      navigate(ROUTES.LOGIN);
    } else if (respuesta.codigo === "A002") {
      notificationHelpers.errorAlert(respuesta.mensaje);
    } else {
      //Controlamos el error del sistema
      errorHelpers.systemError(respuesta);
    }
  };

  // actualiza sólo el campo dinámicamente
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUsuario((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  return (
    <div className="d-flex flex-column flex-root">
      <div
        className="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center bgi-no-repeat bgi-size-contain bgi-attachment-fixed"
          style={{ backgroundImage: `url(${imgBG})` }}
      >
        <div className="d-flex flex-center flex-column flex-column-fluid p-10 pb-lg-20">
          <a className="mb-12">
            <img
              alt="Logo"
              src={imgLogo}
              className="h-40px"
            />
          </a>

          <div className="w-lg-600px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto">
            <form
              className="form w-100 fv-plugins-bootstrap5 fv-plugins-framework"
              noValidate
              id="kt_sign_up_form"
            >
              <div className="mb-10 text-center">
                <h1 className="text-dark mb-3">Registrar cuenta</h1>

                <div className="text-gray-400 fw-bold fs-4">
                  Ya tienes una cuenta?{" "}
                  <Link to={ROUTES.LOGIN} className="link-primary fw-bolder">
                    Iniciar sesión
                  </Link>
                </div>
              </div>

              <div className="row fv-row mb-7 fv-plugins-icon-container">
                <div className="col-xl-6">
                  <label className="form-label fw-bolder text-dark fs-6 required">
                    Nombre
                  </label>
                  <input
                    value={usuario?.nombreUsuario}
                    onChange={(e) => {
                      eliminarError(e.target.name);
                      handleChange(e);
                    }}
                    className="form-control form-control-lg form-control-solid "
                    type="text"
                    name="nombreUsuario"
                    autoComplete="off"
                  />
                  {erroresValidacion
                    .filter((error) => error.nombre === "nombreUsuario")
                    .map((error, idx) => (
                      <div key={idx} className="invalid-feedback d-block">
                        {error.valor}
                      </div>
                    ))}
                  <div className="fv-plugins-message-container invalid-feedback" />
                </div>

                <div className="col-xl-6">
                  <label className="form-label fw-bolder text-dark fs-6 required">
                    Apellido
                  </label>
                  <input
                    value={usuario?.apellido}
                    onChange={(e) => {
                      eliminarError(e.target.name);
                      handleChange(e);
                    }}
                    className="form-control form-control-lg form-control-solid"
                    type="text"
                    name="apellido"
                    autoComplete="off"
                  />
                  {erroresValidacion
                    .filter((error) => error.nombre === "apellido")
                    .map((error, idx) => (
                      <div key={idx} className="invalid-feedback d-block">
                        {error.valor}
                      </div>
                    ))}
                  <div className="fv-plugins-message-container invalid-feedback" />
                </div>
              </div>
              <div className="fv-row mb-7 fv-plugins-icon-container">
                <label className="form-label fw-bolder text-dark fs-6 required">
                  Teléfono
                </label>
                <input
                  value={usuario?.telefonoUsuario}
                  onChange={(e) => {
                    eliminarError(e.target.name);
                    handleChange(e);
                  }}
                  className="form-control form-control-lg form-control-solid"
                  type="tel"
                  name="telefonoUsuario"
                  autoComplete="tel"
                  pattern="[0-9]{8,15}"
                  placeholder="81234567"
                />
                {erroresValidacion
                  .filter((error) => error.nombre === "telefonoUsuario")
                  .map((error, idx) => (
                    <div key={idx} className="invalid-feedback d-block">
                      {error.valor}
                    </div>
                  ))}
                <div className="fv-plugins-message-container invalid-feedback" />
              </div>

              <div className="fv-row mb-10 fv-plugins-icon-container">
                <label className="form-label fs-6 fw-bolder text-dark required">
                  Email
                </label>
                <input
                  value={usuario?.correoUsuario}
                  onChange={(e) => {
                    eliminarError(e.target.name);
                    handleChange(e);
                  }}
                  className="form-control form-control-lg form-control-solid"
                  type="text"
                  name="correoUsuario"
                  autoComplete="off"
                  placeholder="ejemplo@gmail.com"
                />
                {erroresValidacion
                  .filter((error) => error.nombre === "correoUsuario")
                  .map((error, idx) => (
                    <div key={idx} className="invalid-feedback d-block">
                      {error.valor}
                    </div>
                  ))}
                <div className="fv-plugins-message-container invalid-feedback" />
              </div>

              <div
                className="mb-10 fv-row fv-plugins-icon-container"
                data-kt-password-meter="true"
              >
                <div className="mb-1">
                  <label className="form-label fw-bolder text-dark fs-6 required">
                    Contraseña
                  </label>

                  <div className="position-relative mb-3">
                    <input
                      value={usuario?.pass}
                      onChange={(e) => {
                        eliminarError(e.target.name);
                        handleChange(e);
                      }}
                      className="form-control form-control-lg form-control-solid"
                      type={showPass ? "text" : "password"}
                      name="pass"
                      autoComplete="off"
                    />
                    <span
                      onClick={() => {
                        setshowPass(!showPass);
                      }}
                      className="btn btn-sm btn-icon position-absolute translate-middle top-50 end-0 me-n2"
                      data-kt-password-meter-control="visibility"
                    >
                      <i
                        className={`bi bi-eye-slash fs-2${
                          showPass ? " d-none" : " "
                        }`}
                      />
                      <i
                        className={`bi bi-eye fs-2${
                          !showPass ? " d-none" : " "
                        }`}
                      />
                    </span>
                  </div>
                  {erroresValidacion
                    .filter((error) => error.nombre === "pass")
                    .map((error, idx) => (
                      <div key={idx} className="invalid-feedback d-block">
                        {error.valor}
                      </div>
                    ))}
                </div>
              </div>

              <div className="fv-row mb-5 fv-plugins-icon-container">
                <label className="form-label fw-bolder text-dark fs-6 required">
                  Confirmar contraseña
                </label>
                <div className="position-relative">
                  <input
                    value={confirmacionPass}
                    onChange={(e) => {
                      setconfirmacionPass(e.target.value);
                    }}
                    className="form-control form-control-lg form-control-solid"
                    type={showPassConfirm ? "text" : "password"}
                    name="confirm-password"
                    autoComplete="off"
                  />
                  <span
                    onClick={() => setShowPassConfirm((prev) => !prev)}
                    className="btn btn-sm btn-icon position-absolute translate-middle top-50 end-0 me-n2"
                    tabIndex={0}
                    role="button"
                    aria-label="Mostrar/Ocultar contraseña"
                  >
                    <i
                      className={`bi bi-eye-slash fs-2${
                        showPassConfirm ? " d-none" : ""
                      }`}
                    />
                    <i
                      className={`bi bi-eye fs-2${
                        !showPassConfirm ? " d-none" : ""
                      }`}
                    />
                  </span>
                </div>
                <div className="fv-plugins-message-container invalid-feedback" />
              </div>

              <div className="text-center">
                <button
                  onClick={handleOnClick}
                  data-kt-indicator={cargando ? "on" : "off"}
                  type="button"
                  id="kt_sign_up_submit"
                  className="btn btn-lg btn-primary"
                >
                  <span className="indicator-label">Crear cuenta</span>
                  <span className="indicator-progress">
                    Por favor espere…
                    <span className="spinner-border spinner-border-sm align-middle ms-2" />
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
