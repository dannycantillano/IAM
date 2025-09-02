// LayoutMain.tsx
import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants";
import { Link } from "react-router-dom";
import "./LayoutMain.css";
import { useLogout } from "@/hooks/useLogout";
import { BusinessButtons, ConfirmModal } from "@/components";
import { AuthContext } from "@/context";

//imagenes 
import imgLogo6 from "@assets/media/logos/logo-6.svg";
import imgLogo2 from "@assets/media/logos/logo-2.svg";
import imgAvatar from "@assets/media/avatars/blank.png";

declare global {
  interface Window {
    KTDrawer: { createInstances: () => void };
    KTMenu: { createInstances: () => void };
    KTScroll: { createInstances: () => void };
  }
}

export const LayoutMain = () => {


  useEffect(() => {
    // Este useEffect habilita el sonido de la notificación previamente
    const habilitarSonido = () => {
      try {
        const audioTemp = new Audio("@/assets/media/audios/Monitor.mp3");
        audioTemp.play().then(() => {
          audioTemp.pause();
          audioTemp.currentTime = 0;
        }).catch(() => { });
      } catch (err) {
        // Captura errores inesperados en caso de fallo de Audio
        console.warn("⚠️ Error al intentar habilitar el sonido:", err);
      }

      // Quitamos el listener
      window.removeEventListener("click", habilitarSonido);
    };

    window.addEventListener("click", habilitarSonido);
    return () => window.removeEventListener("click", habilitarSonido);
  }, []);





  const { user } = useContext(AuthContext);
  const asideRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  //Manejo del modal de confirmaciones
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [confirmModalMessage, setconfirmModalMessage] = useState<string>("");
  const [confirmModalType, setconfirmModalType] = useState<string>("");

  const logout = useLogout();

  useEffect(() => {
    // añade las clases globales que exige Metronic
    document.body.classList.add("aside-enabled", "aside-fixed");
    return () => {
      document.body.classList.remove("aside-enabled", "aside-fixed");
    };
  }, []);

  useEffect(() => {
    if (asideRef.current && window.KTDrawer) {
      // (re)crea drawers, menús y scrolls después de montar el DOM
      window.KTDrawer.createInstances();
      window.KTMenu?.createInstances?.();
      window.KTScroll?.createInstances?.();
    }
  }, []);

  const limpiarConfirmModalAcion = () => {
    setconfirmModalMessage("");
    setconfirmModalType("");
  };

  const abrirconfirmModal = (tipo: string, mensaje: string) => {
    setconfirmModalType(tipo);
    setconfirmModalMessage(mensaje);
    setIsConfirmOpen(true);
  };
  const confirmModalAcion = (action: boolean | null) => {
    setIsConfirmOpen(false);
    // cerrarconfirmModal();
    limpiarConfirmModalAcion();
    switch (confirmModalType) {
      case "login":
        if (action) logout();
        break;

      default:
        break;
    }
  };

  const handlePopoverToChat = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    // Elimina cualquier popover existente
    const existing = document.getElementById("popover-chat");
    if (existing) existing.remove();

    // Crea el popover
    const popover = document.createElement("div");
    popover.id = "popover-chat";
    popover.style.position = "absolute";
    popover.style.zIndex = "9999";
    popover.style.background = "#fff";
    popover.style.border = "1px solid #ddd";
    popover.style.borderRadius = "8px";
    popover.style.padding = "12px 18px";
    popover.style.boxShadow = "0 2px 8px rgba(63, 252, 104, 0.15)";
    popover.style.minWidth = "220px";
    popover.innerHTML = `
                    <div style="display:flex;align-items:center;">
                    <div>
                      <span style="font-size:13px;">Esta opción estará disponible en <span style="font-weight:600; color:#0a1">próximas actualizaciones</span>.</span>
                    </div>
                    </div>
                  `;

    // Calcula la posición a la derecha del módulo
    const rect = target.getBoundingClientRect();
    popover.style.top = `${rect.top + window.scrollY + rect.height / 2 - 22}px`;
    popover.style.left = `${rect.right + window.scrollX + 12}px`;
    document.body.appendChild(popover);

    // Cierra el popover al hacer click fuera
    const closePopover = (ev: MouseEvent) => {
      if (!popover.contains(ev.target as Node)) {
        popover.remove();
        document.removeEventListener("mousedown", closePopover);
      }
    };
    document.addEventListener("mousedown", closePopover);

    // Cierra automáticamente el popover después de 2.5 segundos
    setTimeout(() => {
      popover.remove();
      document.removeEventListener("mousedown", closePopover);
    }, 3000);
  };

  return (
    <div style={{ display: "contents" }}>
      {/* ASIDE */}
      <div
        ref={asideRef}
        id="kt_aside"
        className="aside pb-5 pt-5 pt-lg-0"
        data-kt-drawer="true"
        data-kt-drawer-name="aside"
        data-kt-drawer-activate="{default: true, lg: false}"
        data-kt-drawer-overlay="true"
        data-kt-drawer-width="{default:'80px', '300px': '100px'}"
        data-kt-drawer-direction="start"
        data-kt-drawer-toggle="#kt_aside_mobile_toggle"
      >
        <div className="aside-logo py-8" id="kt_aside_logo">
          <Link to={ROUTES.HOME} className="d-flex align-items-center">
            <img
              alt="Logo"
              className="h-45px logo"
              src={imgLogo6}
            />
          </Link>
        </div>

        <div className="aside-menu flex-column-fluid" id="kt_aside_menu">
          <div
            className="hover-scroll-overlay-y my-2 my-lg-5 pe-lg-n1"
            id="kt_aside_menu_wrapper"
            data-kt-scroll="true"
            data-kt-scroll-height="auto"
            data-kt-scroll-dependencies="#kt_aside_logo, #kt_aside_footer"
            data-kt-scroll-wrappers="#kt_aside, #kt_aside_menu"
            data-kt-scroll-offset="5px"
            style={{ overflowY: "auto", maxHeight: "100vh" }}
          >
            <div
              className="menu menu-column menu-title-gray-700 menu-state-title-primary menu-state-icon-primary menu-state-bullet-primary menu-arrow-gray-500 fw-bold"
              id="kt_aside_menu"
              data-kt-menu="true"
            >
              <div className="menu-item py-2">
                <Link
                  to={ROUTES.HOME}
                  className={`menu-link menu-center${
                    pathname === ROUTES.HOME ? " active" : ""
                  }`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-house fs-2" />
                  </span>
                  <span className="menu-title">Inicio</span>
                </Link>
              </div>

      

              <div className="menu-item py-2">
                <Link
                  to={ROUTES.CLIENTS}
                  className={`menu-link menu-center${
                    pathname === ROUTES.CLIENTS ? " active" : ""
                  }`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-people fs-2" />
                  </span>
                  <span className="menu-title">Clientes</span>
                </Link>
              </div>

              <div className="menu-item py-2">
                <Link
                  to={ROUTES.ACCOUNTS}
                  className={`menu-link menu-center${
                    pathname === ROUTES.ACCOUNTS ? " active" : ""
                  }`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-cash-stack fs-2" />
                  </span>
                  <span className="menu-title">Cuentas</span>
                </Link>
              </div>

              <div className="menu-item py-2">
                <Link
                  to={ROUTES.SERVICE_ORDER}
                  className={`menu-link menu-center${
                    pathname === ROUTES.SERVICE_ORDER ? " active" : ""
                  }`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-clipboard-check fs-2" />
                  </span>
                  <span className="menu-title">Ordenes</span>
                </Link>
              </div>

              <div className="menu-item py-2">
                <Link
                  to={ROUTES.MONITOR}
                  className={`menu-link menu-center${
                    pathname === ROUTES.MONITOR ? " active" : ""
                  }`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-window fs-2" />
                  </span>
                  <span className="menu-title">Monitor</span>
                </Link>
              </div>

              <div className="menu-item py-2">
                <Link
                  to={ROUTES.TRANSACTIONS}
                  className={`menu-link menu-center${
                    pathname === ROUTES.TRANSACTIONS ? " active" : ""
                  }`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-arrow-left-right fs-2" />
                  </span>
                  <span className="menu-title">Transacciones</span>
                </Link>
              </div>

                     

              
              <div className="menu-item py-2">
                <Link
                  to={ROUTES.RATES}
                  className={`menu-link menu-center${
                    pathname === ROUTES.RATES ? " active" : ""
                  }`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                    <span className="menu-icon me-0">
                    <i className="bi bi-currency-exchange fs-2" />
                    </span>
                  <span className="menu-title">Tarifario</span>
                </Link>
              </div>

              <div className="menu-item py-2">
                <Link
                  to={ROUTES.QUOTATION}
                  className={`menu-link menu-center${pathname === ROUTES.QUOTATION ? " active" : ""}`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-file-earmark-text fs-2" />
                  </span>
                  <span className="menu-title">Proformas</span>
                </Link>
              </div>

                  <div className="menu-item py-2">
                <Link
                  to={ROUTES.BUSINESS}
                  className={`menu-link menu-center${
                    pathname === ROUTES.BUSINESS ? " active" : ""
                  }`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-briefcase fs-2" />
                  </span>
                  <span className="menu-title">Negocio</span>
                </Link>
              </div>

               <div className="menu-item py-2">
                {/* <Link
                  to={ROUTES.CHAT_AI}
                  className={`menu-link menu-center${
                    pathname === ROUTES.CHAT_AI ? " active" : ""
                  }`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-chat-left fs-2" />
                  </span>
                  <span className="menu-title">Chat</span>
                </Link> */}

                
          

                <div
                  className="menu-link menu-center disabled"
                  style={{
                    cursor: "not-allowed",
                    opacity: 0.6,
                    position: "relative",
                  }}
                  tabIndex={0}
                  title="Próximamente"
                  onClick={handlePopoverToChat}
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-chat-left fs-2" />
                  </span>
                  <span className="menu-title">IA</span>
                </div>

              </div>

              <div className="menu-item py-2">
                <Link
                  to={ROUTES.INFO}
                  className={`menu-link menu-center${
                    pathname === ROUTES.INFO ? " active" : ""
                  }`}
                  data-bs-trigger="hover"
                  data-bs-dismiss="click"
                  data-bs-placement="right"
                >
                  <span className="menu-icon me-0">
                    <i className="bi bi-info-circle-fill" />
                  </span>
                  <span className="menu-title">Informacion</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WRAPPER */}
      <div
        className="wrapper d-flex flex-column flex-row-fluid pt-0"
        id="kt_wrapper"
      >
        {/* HEADER */}
        <div id="kt_header" className="header align-items-stretch">
          <div className="container-fluid d-flex align-items-stretch justify-content-between">
            <div
              className="d-flex align-items-center d-lg-none ms-n1 me-2"
              title="Show aside menu"
            >
              <button
                id="kt_aside_mobile_toggle"
                className="btn btn-icon btn-active-color-primary w-30px h-30px w-md-40px h-md-40px"
                type="button"
              >
                <span className="svg-icon svg-icon-2x mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M21 7H3C2.4 7 2 6.6 2 6V4C2 3.4 2.4 3 3 3H21C21.6 3 22 3.4 22 4V6C22 6.6 21.6 7 21 7Z"
                      fill="black"
                    />
                    <path
                      opacity="0.3"
                      d="M21 14H3C2.4 14 2 13.6 2 13V11C2 10.4 2.4 10 3 10H21C21.6 10 22 10.4 22 11V13C22 13.6 21.6 14 21 14ZM22 20V18C22 17.4 21.6 17 21 17H3C2.4 17 2 17.4 2 18V20C2 20.6 2.4 21 3 21H21C21.6 21 22 20.6 22 20Z"
                      fill="black"
                    />
                  </svg>
                </span>
              </button>
            </div>

            {/* logo móvil */}
            <div className="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
              <Link to={ROUTES.HOME} className="d-lg-none">
                <img
                  alt="Logo"
                  className="h-30px"
                  src={imgLogo2}
                />
              </Link>
            </div>

            <div className="separator my-2" />

            <BusinessButtons />

            <div className="d-flex align-items-stretch justify-content-between flex-lg-grow-1">
              <div className="d-flex align-items-stretch" id="kt_header_nav" />

              <div
                className="d-flex align-items-center ms-1 ms-lg-3"
                id="kt_header_user_menu_toggle"
              >
                <div
                  className="cursor-pointer symbol symbol-30px symbol-md-40px menu-dropdown"
                  data-kt-menu-trigger="click"
                  data-kt-menu-attach="parent"
                  data-kt-menu-placement="bottom-end"
                  data-kt-menu-flip="bottom"
                >
             
                  <i className="bi bi-person-fill fs-1"></i>
                </div>

                <div
                  className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px"
                  data-kt-menu="true"
                  data-popper-placement="bottom-end"
                  style={{
                    zIndex: 105,
                    position: "fixed",
                    inset: "0 auto auto 0",
                    margin: 0,
                    transform: "translate(1382px, 65px)",
                  }}
                >
                  <div className="menu-item px-3">
                    <div className="menu-content d-flex align-items-center px-3">
                      <div className="symbol symbol-50px me-5">
                        {/* {Aqui debe ir la foto del cliente usuario } */}
                        <img
    
                          src={imgAvatar}
                          alt="Foto de usuario"
                        />
                      </div>

                      <div className="d-flex flex-column">
                        <div className="fw-bolder d-flex align-items-center fs-5">
                          {user?.nombreUsuario + " " + user?.apellido}
                        </div>
                        <a className="fw-bold text-muted text-hover-primary fs-7">
                          {user?.correoUsuario}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* <div className="separator my-2" /> */}
                  {/* Perfil en contrucción, cuando esté listo se habilita esta opción */}
                  {/* <div className="menu-item px-5">
                    <a className="menu-link px-5">Mi perfil</a>
                  </div> */}

                  <div
                    className="menu-item px-5"
                    data-kt-menu-trigger="hover"
                    data-kt-menu-placement="left-start"
                    data-kt-menu-flip="bottom, top"
                  ></div>

                  <div className="separator my-2" />

                  <div className="menu-item px-5">
                    <a
                      onClick={() => {
                        abrirconfirmModal("login", "¿Desea cerrar la sesión?");
                      }}
                      className="menu-link px-5"
                    >
                      Cerrar Sesión
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="content d-flex flex-column flex-column-fluid mt-10"
          id="kt_content"
        >
          <Outlet /> {/* aquí se renderizan las rutas hijas */}
        </div>

        {/* FOOTER */}
        <div className="footer py-4 d-flex flex-lg-column" id="kt_footer">
          <div className="container-fluid d-flex flex-column flex-md-row align-items-center justify-content-between">
            <div className="text-dark order-2 order-md-1">
              <span className="text-muted fw-bold me-1">
                {new Date().getFullYear()}©
              </span>
              <a
                target="_blank"
                rel="noreferrer"
                className="text-gray-800 text-hover-primary"
              >
                V1.0.5
              </a>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={isConfirmOpen}
        confirmMessage={confirmModalMessage}
        onAction={(action) => confirmModalAcion(action)}
      />
    </div>
  );
};
