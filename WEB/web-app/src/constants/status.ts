export const STATUS = {
    UNAUTHORIZED: 401,
    TOKEN_REFRESH_REQUIRED: 403,
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;

export const STATUS_TBL = {
    USER: {
        ACTIVE: 1,
        INACTIVE: 2,
    },
    Chat_AI: {
        ACTIVE: 3,
        INACTIVE: 0,
        DELETED: 13,
        ARCHIVED: 15,
    },
    CLIENT: {
        ACTIVE: 16,
        INACTIVE: 0,
        DELETED: 17,
        PENDING: 0,
    },
    BUSINESS: {
        ACTIVE: 4,
        DELETED: 11,
        INACTIVE: 0,
    },
    ACCOUNT: {
        ACTIVE: 5,
        DELETED: 14,
        INACTIVE: 0,
        PENDING: 0,
        PAID: 0,
    },
    ORDER_SERVICE: {
        NEW: 6,
        IN_PROCESS: 7,
        PENDING: 8,
        COMPLETED: 9,
        DELETED: 10,
        ARCHIVED: 22,
    },
    ITEMS_ORDER_SERVICE: {
        ACTIVE: 18,
        DELETED: 19,
        IN_PROCESS: 0,
        PENDING: 0,
        COMPLETED: 0,
    },
    TRANSACTION: {
        ACTIVE: 20,
        INACTIVE: 0,
        DELETED: 21,
        PENDING: 0,
        COMPLETED: 0,
    },
    TARIFF: {
        ACTIVE: 23,
        INACTIVE: 24,
        DELETED: 25,
    },
    PROFORMA: {
        DRAFT: 26, //borrador
        APPROVED: 27,
        ANNULLED: 28, //anulado
        DELETED: 31,
    },
    PROFORMA_ITEM: {
        ACTIVE: 29,
        DELETED: 30,
    },


}

export const FILTER_STATUS = {
    ACTIVO: 'Activo',
    INACTIVO: 'Inactivo',
    ELIMINADO: 'Eliminado',
    PENDIENTE: 'Pendiente',
    TODOS: 'Todos',
    TODOS_SIN_ELIMINADOS: 'Todos_sin_eliminados',
    NUEVO: 'Nuevo',
    EN_PROCESO: 'En Proceso',
    EN_ESPERA: 'En Espera',
    COMPLETADO: 'Completado',
}

export const STATUS_ORDEN_SERVICIO_OPTIONS = [
    { label: FILTER_STATUS.NUEVO, value: STATUS_TBL.ORDER_SERVICE.NEW },
    { label: FILTER_STATUS.EN_PROCESO, value: STATUS_TBL.ORDER_SERVICE.IN_PROCESS },
    { label: FILTER_STATUS.EN_ESPERA, value: STATUS_TBL.ORDER_SERVICE.PENDING },
    { label: FILTER_STATUS.COMPLETADO, value: STATUS_TBL.ORDER_SERVICE.COMPLETED },
];