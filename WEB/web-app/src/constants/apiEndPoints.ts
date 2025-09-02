export const API_ENDPOINTS = {
    USERS: {
        CREATE:    "/Usuario/registrarUsuario",
        UPDATE:    "",
        GET_BY_ID: "/Usuario/obtenerUsuarioPorId",
    },
    AUTH: {
        LOGIN:           "/Usuario/autenticarUsuario",
        LOGOUT:          "/auth/logout",
        FORGOT_PASSWORD: "/auth/forgot-password",
        CHANGE_PASSWORD: "/Usuario/cambiarContrasena",
    },
    BUSINESS: {
        GET_BUSINESS: "/Negocio/obtenerNegocios",
        ADD_BUSINESS: "/Negocio/registrarNegocio",
        UPDATE_BUSINESS: "/Negocio/actualizarNegocio",
    },
    CHAT: {
        GET_CHATS:     "/ChatIA/obtenerChats",
        GET_MESSAGES: "/ChatIA/obtenerMensajes",
        SEND_MESSAGE: "/ChatIA/enviarMensaje",
        CREATE_CHAT: "/ChatIA/crearChat",
    },
    ACCOUNTS_PAYABLE: {
        GET_ACCOUNTS: "/Cuenta/obtenerCuentas",
        ADD_ACCOUNT: "/Cuenta/registrarCuenta",
        UPDATE_ACCOUNT: "/Cuenta/actualizarCuentas",
    },
    ORDERS: {
        GET_ORDERS: "/OrdenServicio/obtenerOrdenDeServicio",
        ADD_ORDER: "/OrdenServicio/registrarOrdenServicio",
        UPDATE_ORDER: "/OrdenServicio/actualizarOrdenServicio",
    },
    ITEMS_ORDERS: {
        GET_ORDERS: "/ItemOrdenServicio/obtenerItemOrdenServicio",
        ADD_ORDER: "/ItemOrdenServicio/guardarItemOrdenServicio",
        UPDATE_ORDER: "/ItemOrdenServicio/actualizarItemOrdenServicio",
        ADD_ITEMS_PROFORMA: "/ItemOrdenServicio/guardarItemsDeProf",
    },
    CLIENTS: {
        GET_CLIENTS: "/Cliente/obtenerClientes",
        SEARCH_CLIENTS: "/Cliente/buscarClientes",
        ADD_CLIENT: "/Cliente/guardarCliente",
        UPDATE_CLIENT: "/Cliente/actualizarCliente",
    },
    MONITOR: {
        GET_MONITOR_OS: "/Monitor/cargarMonitorOrdenServicio"
    },
    TRANSACTIONS: {
        ADD_TRANSACTION: "/Transacciones/registrarTransaccion",
        GET_TRANSACTION: "/Transacciones/obtenerTransaccion",
        GET_TRANSACTION_BY_ACCOUNT: "/Transacciones/obtenerTransaccionPorCuenta",
        UPDATE_TRANSACTION: "/Transacciones/actualizarTransaccion",
    },
    METRICA: {
        GET_METRICA: "/MetricaKPI/obtenerMetrica"
    },
    TARIFAS: {
        SEARCH_TARIFA: "/Tarifario/buscarTarifas",
        GET_TARIFAS: "/Tarifario/obtenerTarifas",
        ADD_TARIFA: "/Tarifario/registrarTarifa",
        UPDATE_TARIFA: "/Tarifario/actualizarTarifa",
    }
    ,
    PROFORMA: {
        ADD_PROFORMA: "/Proforma/registrarProforma",
        UPDATE_PROFORMA: "/Proforma/actualizarProforma",
        GET_PROFORMAS: "/Proforma/obtenerProformas",
        SEARCH_PROFORMAS: "/Proforma/buscarProformas",
    }
    ,
    PROFORMA_ITEMS: {
        ADD_ITEMS: "/ItemsProforma/registrarItemsProforma",
        UPDATE_ITEMS: "/ItemsProforma/actualizarItemsProforma",
        GET_ITEMS: "/ItemsProforma/obtenerItemsProforma",
    }
} as const;
