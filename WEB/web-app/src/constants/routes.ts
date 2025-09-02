export const ROUTES = {
    HOME: "/home",
    ABOUT: "/about",
    STATISTICS: "/statistics",
    CHAT_AI: "/chat",
    CONTACT: "/contact",
    SERVICES: "/services",
    BLOG: "/blog",
    LOGIN: "/login",
    SIGNUP: "/sign-up",
    REGISTER: "/register",
    PROFILE: "/profile",
    DASHBOARD: "/dashboard",
    SETTINGS: "/settings",
    HELP: "/help",
    TERMS: "/terms",
    PRIVACY: "/privacy",
    BUSINESS: "/business",
    MONITOR: "/monitor",
    ACCOUNTS: "/accounts",
    CLIENTS: "/clients",
    TRANSACTIONS: "/transactions",
    SERVICE_ORDER: "/service-order",
    QUOTATION: "/quotation",
    INFO: "/info",
    RATES: "/rates",
    NOT_FOUND: "*",
} as const;

// Tipo para las claves de las rutas
export type RouteKeys = keyof typeof ROUTES;

// Tipo para los valores de las rutas
export type RouteValues = (typeof ROUTES)[RouteKeys];
