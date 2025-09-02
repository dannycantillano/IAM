import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants";
import {
  Clientes,
  Cuentas,
  Home,
  Info,
  LayoutMain,
  Monitor,
  Negocio,
  OrdenDeServicio,
  Proformas,
  Tarifario,
  Transacciones,
} from "@/screens";
import { Login, SignUp } from "@/auth";
// import { ChatAi} from "@/components";
import { RedirectIfAuth, RequireAuth } from "@/utils";
import { useEffect } from "react";
export const AppRouter = () => {
const { pathname } = useLocation(); //ruta actual

    useEffect(() => {
       //activamos el cerrado automático del menu cuando está en 
       // dimenciones pequeñas y cada vez que se cambie de ruta
        document.querySelectorAll<HTMLElement>(".drawer-overlay").forEach((el) => el.click());
    }, [pathname]);

  return (
    <Routes>
      {/* Redirige raíz a login */}
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

      {/* Rutas públicas con protección para usuarios ya autenticados */}
      <Route element={<RedirectIfAuth />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SIGNUP} element={<SignUp />} />
      </Route>

      {/* Rutas privadas (requieren autenticación) */}
      <Route element={<RequireAuth />}>
        <Route element={<LayoutMain />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          {/* <Route path={ROUTES.CHAT_AI} element={<ChatAi />} /> */}
          <Route path={ROUTES.BUSINESS} element={<Negocio />} />
          <Route path={ROUTES.RATES} element={<Tarifario />} />
          <Route path={ROUTES.MONITOR} element={<Monitor />} />
          <Route path={ROUTES.ACCOUNTS} element={<Cuentas />} />
          <Route path={ROUTES.CLIENTS} element={<Clientes />} />
          <Route path={ROUTES.TRANSACTIONS} element={<Transacciones />} />
          <Route path={ROUTES.SERVICE_ORDER} element={<OrdenDeServicio />} />
          <Route path={ROUTES.QUOTATION} element={<Proformas />} />
          <Route path={ROUTES.INFO} element={<Info />} />
        </Route>
      </Route>

      {/* Ruta por defecto si no se encuentra ninguna */}
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
};
