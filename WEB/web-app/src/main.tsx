import { createRoot } from 'react-dom/client';

;(window as any).global = window

import "./styles.css"
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css"
import "@/assets/plugins/global/plugins.bundle.css"
import "@/assets/css/style.bundle.css"

// 2) jQuery en global (antes de los bundles legacy)
import $ from "jquery"
window.$ = $
window.jQuery = $



// 3) Config y JS legacy como **side effects**
//    (si existen en esas rutas)
//import "@/assets/config/config.js"
import "@/assets/plugins/global/plugins.bundle.js"
import "@/assets/js/scripts.bundle.js"
import "@/assets/js/custom/widgets.js"
import "@/assets/js/custom/apps/chat/chat.js"
import "@/assets/js/custom/modals/create-app.js"
import "@/assets/js/custom/modals/upgrade-plan.js"
import "@/assets/js/custom/documentation/forms/daterangepicker.js"


import { App } from '@/App';


//import { StrictMode } from 'react';
interface AppRuntimeConfig {
  BASE_URL: string;
  // Agrega aquí más campos si los usas
  // ASSET_CDN: string;
  // AUTH_DOMAIN: string;
}

// Extiende el objeto Window
declare global {
    interface Window {
        $: JQueryStatic;
        jQuery: JQueryStatic;
        __APP_CONFIG__?: AppRuntimeConfig;
    }
}


window.$ = $;
window.jQuery = $;

const rootElement = document.getElementById('root');
// 💡 Establecer el tema sin causar recarga infinita
const storedTheme = localStorage.getItem("theme");

if (!storedTheme) {
  // Si no hay tema guardado, setear uno por defecto (light)
  localStorage.setItem("theme", "light");
  document.documentElement.setAttribute("data-kt-app-theme", "light");
} else {
  // Si ya existe, simplemente aplicarlo (sin reload)
  document.documentElement.setAttribute("data-kt-app-theme", storedTheme);
}

const root = createRoot(rootElement!);
root.render(
  // <StrictMode>
    <App />
  // </StrictMode>
);
