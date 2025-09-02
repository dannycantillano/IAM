import { FieldConfig } from "@/components/Modals/GenericFormModal/types";
import { DTO_Cliente, DTO_Cuenta, DTO_ItemOrdenServicio, DTO_Negocio, DTO_OrdenServicio, DTO_Transacciones } from "@/models";
import { DTO_Proforma } from "@/models/DTO_Proforma";
import { DTO_ProformaItem } from "@/models/DTO_ProformaItem";
import { DTO_Tarifa } from "@/models/DTO_Tarifa";

//#region columnas de tablas

//  Define configuraciones de campos de formulario (FieldConfig) para construir formularios dinámicos relacionados con estos modelos.
// Los label maps permiten mostrar nombres amigables en la UI, y los arreglos de campos de formulario se usan para generar formularios de manera flexible.
export const columnKeysCuenta: (keyof DTO_Cuenta)[] = [

    "iD_Cuenta",
    "monto",
    "montoAbonado",
    "saldoPendiente",
    "estadoPago",
    "tipoCuenta",
    "fechaLimite",
    "fechaInicial",
    "concepto",

];
export const columnKeysNegocio: (keyof DTO_Negocio)[] = [
    "iD_Negocio",
    "nombreNegocio",
    "descripcion",
    "direccion",
    "telefonoNegocio",
    "correoNegocio",
    "fechaRegistro"
];
export const columnKeysOrdenDeServicio: (keyof DTO_OrdenServicio)[] = [
    "iD_OrdenServicio",
    "fechaOrdenServicio",
    "fechaEstimadaEntrega",
];

export const columnKeysCliente: (keyof DTO_Cliente)[] = [
    "iD_Cliente",
    "nombreCliente",
    "apellidoCliente",
    "telefonoCliente",
    "correoCliente",
];
export const columnKeysItemsOrdenServicio: (keyof DTO_ItemOrdenServicio)[] = [
    "iD_ItemOrdenServicio",
    "monto",
    "cantidad",
    "nombreItemOrdenServicio",
    "descripcion",

];

export const columnKeysTransacciones: (keyof DTO_Transacciones)[] = [
    "iD_Transaccion",
    "fechaTransaccion",
    "monto",
    "tipo",
    "concepto",
    "tipoNumReferencia",
    "numReferencia",

];

export const columnKeysTransaccionesPorCuenta: (keyof DTO_Transacciones)[] = [
    "iD_Transaccion",
    "fechaTransaccion",
    "monto",
    "tipo",
    "concepto",

];

export const columnKeysTarifa: (keyof DTO_Tarifa)[] = [
    "iD_Tarifa",
    // "iD_Negocio",
    "nombreTarifa",
    "descripcionTarifa",
    "precioTarifa",
    "fechaCreacion",
    // "fechaModificacion",
];

export const columnKeysProforma: (keyof DTO_Proforma)[] = [
    "iD_Proforma",                // ID principal
    "cliente",                    // Cliente asociado
    "observacionProforma",        // Observaciones
    "fechaProforma",              // Fecha de creación
    "fechaVencimiento",           // Fecha de vencimiento
    "descuentoProforma",          // % Descuento aplicado
    "montoDescuento",             // Monto de descuento
    "impuestoPorcentualProforma", // % de impuesto
    "montoImpuesto",              // Monto de impuesto
    "subTotal",                   // Subtotal antes de descuentos/impuestos
    "baseImponible",              // Monto base después de descuento
    "totalCalculado",
];

export const columnKeysItemsProforma: (keyof DTO_ProformaItem)[] = [
    "iD_ProformaItem",
    "iD_Proforma",
    "nombreItemProforma",
    "descripcionItemProforma",
    "cantidadItemProforma",
    "precioItemProforma",
    "fechaCreacion",
    "fechaModificacion",
];

//#endregion

//#region modal para visualizar detalles de objetos

// Define los atributos que se mostrarán en el infoModal de las filas de las tablas de los modelos.
export const keysInfoModalOrdenDeServicio: FieldConfig<DTO_OrdenServicio>[] = [
    {
        key: "iD_OrdenServicio",
        label: "Código",
        type: "text",
        order: 1,
    },
    {
        key: "fechaOrdenServicio",
        label: "Fecha de Orden",
        type: "date",
        order: 2,
    },
    {
        key: "fechaEstimadaEntrega",
        label: "Entrega Estimada",
        type: "date",
        order: 3,
    },
    {
        key: "fechaInicio",
        label: "Fecha de Inicio",
        type: "date",
        order: 4,
    },
    {
        key: "fechaFinal",
        label: "Fecha Final",
        type: "date",
        order: 5,
    },
    {
        key: "fechaEntrega",
        label: "Fecha de Entrega",
        type: "date",
        order: 6,
    },
    {
        key: "notaOrdenServicio",
        label: "Nota",
        type: "text",
        order: 7,
    },
    {
        key: "estado",
        label: "Estado",
        type: "text",
        order: 8,
    },
];
export const keysInfoModalNegocio: FieldConfig<DTO_Negocio>[] = [

    {
        key: "iD_Negocio",
        label: "Código",
        type: "text",
        order: 1,
    },
    {
        key: "nombreNegocio",
        label: "Nombre",
        type: "text",
        order: 2,
    },
    {
        key: "descripcion",
        label: "Descripción",
        type: "text",
        order: 3,
    },
    {
        key: "direccion",
        label: "Dirección",
        type: "text",
        order: 4,
    },
    {
        key: "telefonoNegocio",
        label: "Teléfono",
        type: "text",
        order: 5,
    },
    {
        key: "correoNegocio",
        label: "Correo",
        type: "text",
        order: 6,
    },
    {
        key: "fechaRegistro",
        label: "Fecha",
        type: "date",
        order: 7,
    },
    {
        key: "estado",
        label: "Estado",
        type: "text",
        order: 8,
    },
];

export const keysInfoModalCuenta: FieldConfig<DTO_Cuenta>[] = [

    {
        key: "iD_Cuenta",
        label: "Código",
        type: "text",
        order: 0,
    },
    {
        key: "estadoPago",
        label: "Estado",
        type: "text",
        order: 2,
    },
    {
        key: "fechaInicial",
        label: "Fecha Inicial",
        type: "date",
        order: 3,
    },
    {
        key: "fechaLimite",
        label: "Fecha Límite",
        type: "date",
        order: 4,
    },
    {
        key: "fechaModificacion",
        label: "Fecha de Modificación",
        type: "date",
        order: 5,
    },
    {
        key: "concepto",
        label: "Concepto",
        type: "text",
        order: 6,
    },
    {
        key: "tipoCuenta",
        label: "Tipo De Cuenta",
        type: "text",
        order: 7,
    },
    {
        key: "descripcion",
        label: "Descripción",
        type: "text",
        order: 8,
    },
];

export const keysInfoModalCliente: FieldConfig<DTO_Cliente>[] = [
    {
        key: "iD_Cliente",
        label: "Código",
        type: "text",
        order: 1,
    },
    {
        key: "estado",
        label: "Estado",
        type: "text",
        order: 1.5,
    },
    {
        key: "nombreCliente",
        label: "Nombre",
        type: "text",
        order: 2,
    },
    {
        key: "apellidoCliente",
        label: "Apellido(s)",
        type: "text",
        order: 3,
    },
    {
        key: "telefonoCliente",
        label: "Teléfono",
        type: "text",
        order: 4,
    },
    {
        key: "correoCliente",
        label: "Correo",
        type: "text",
        order: 5,
    },
];
export const keysInfoModalItemsOrdenServicio: FieldConfig<DTO_ItemOrdenServicio>[] = [
    {
        key: "iD_ItemOrdenServicio",
        label: "Item #",
        type: "text",
        order: 1,
    },
    {
        key: "iD_OrdenServicio",
        label: "Orden Servicio #",
        type: "text",
        order: 2,
    },
    {
        key: "nombreItemOrdenServicio",
        label: "Nombre del Item",
        type: "text",
        order: 4,
    },
    {
        key: "descripcion",
        label: "Descripción",
        type: "text",
        order: 5,
    },
    {
        key: "estado",
        label: "Estado",
        type: "text",
        order: 8,
    },
];

export const keysInfoModalTransacciones: FieldConfig<DTO_Transacciones>[] = [
    {
        key: "iD_Transaccion",
        label: "Transacción #",
        type: "text",
        order: 1,
    },
    {
        key: "fechaTransaccion",
        label: "Fecha",
        type: "date",
        order: 3,
    },
    {
        key: "concepto",
        label: "Concepto",
        type: "text",
        order: 4,
    },
    {
        key: "tipo",
        label: "Tipo",
        type: "text",
        order: 6,
    },
    {
        key: "tipoNumReferencia",
        label: "Tipo Referencia",
        type: "text",
        order: 7,
    },
    {
        key: "numReferencia",
        label: "N° Referencia",
        type: "text",
        order: 8,
    }
];

export const keysInfoModalTarifa: FieldConfig<DTO_Tarifa>[] = [
    {
        key: "iD_Tarifa",
        label: "ID",
        type: "text",
        order: 1,
    },
    {
        key: "iD_Negocio",
        label: "ID Negocio",
        type: "text",
        order: 2,
    },
    {
        key: "nombreTarifa",
        label: "Nombre",
        type: "text",
        order: 3,
    },
    {
        key: "descripcionTarifa",
        label: "Descripción",
        type: "text",
        order: 4,
    },
    {
        key: "fechaCreacion",
        label: "Creación",
        type: "date",
        order: 6,
    },
    {
        key: "fechaModificacion",
        label: "Modificación",
        type: "date",
        order: 7,
    },
    {
        key: "estado",
        label: "Estado",
        type: "text",
        order: 8,
    },
];

export const keysInfoModalProforma: FieldConfig<DTO_Proforma>[] = [
    { key: "iD_Proforma", label: "ID", type: "text", order: 1 },
    { key: "fechaProforma", label: "Creación", type: "date", order: 2 },
    { key: "fechaVencimiento", label: "Vencimiento", type: "date", order: 3 },
    {
        key: "estado",
        label: "Estado",
        type: "text",
        order: 6,
    },

];
//#endregion

//#region tablas

// Este archivo define mapas de etiquetas (label maps) para mostrar nombres legibles en los titulos del DataTable de los modelos.
export const labelMapCuenta: Record<string, string> = {
    iD_Cuenta: "ID",
    iD_OrdenServicio: "Orden",
    estado: "Estado",
    concepto: "Concepto",
    monto: "Monto",
    fechaInicial: "Creación",
    fechaLimite: "Límite",
    tipoCuenta: "Tipo",

    fechaModificacion: "Fecha de Modificación",
    detalleJSON: "Detalles",
    montoAbonado: "Abonado",
    saldoPendiente: "Saldo",
    estadoPago: "Estado"

};



export const labelMapNegocio: Record<string, string> = {
    iD_Negocio: "ID",
    estado: "Estado",
    nombreNegocio: "Nombre",
    descripcion: "Descripción",
    direccion: "Dirección",
    telefonoNegocio: "Teléfono",
    correoNegocio: "Correo",
    fechaRegistro: "Registrado",
    referenciaJSON: "Referencias",
};

export const labelMapOrdenDeServicio: Record<string, string> = {
    iD_OrdenServicio: "ID",
    estado: "Estado",
    fechaOrdenServicio: "Creación",
    fechaEstimadaEntrega: "Estimación",
    fechaInicio: "Fecha de Inicio",
    fechaFinal: "Fecha Final",
    fechaEntrega: "Fecha de Entrega",
    notaOrdenServicio: "Nota",
    referenciaJSON: "Referencias"
};

export const labelMapCliente: Record<string, string> = {
    iD_Cliente: "ID",
    nombreCliente: "Nombre",
    apellidoCliente: "Apellido(s)",
    telefonoCliente: "Teléfono",
    correoCliente: "Correo",
    estado: "Estado",
};

export const labelMapItemsOrdenServicio: Record<string, string> = {
    iD_ItemOrdenServicio: "ID",
    nombreItemOrdenServicio: "Nombre",
    descripcion: "Descripción",
    monto: "Monto",
    cantidad: "Cantidad",
    avance: "Avance",
    estado: "Estado",
};

export const labelMapTransacciones: Record<string, string> = {
    iD_Transaccion: "ID",
    iD_Negocio: "ID Negocio",
    fechaTransaccion: "Fecha",
    concepto: "Concepto",
    monto: "Monto",
    tipo: "Tipo",
    tipoNumReferencia: "Tipo Referencia",
    numReferencia: "N° Referencia",
    estado: "Estado",
};
export const labelMapTarifa: Record<string, string> = {
    iD_Tarifa: "ID",
    iD_Negocio: "ID Negocio",
    nombreTarifa: "Nombre",
    descripcionTarifa: "Descripción",
    precioTarifa: "Precio",
    fechaCreacion: "Creación",
    fechaModificacion: "Modificación",
    estado: "Estado",
};

export const labelMapProforma: Record<string, string> = {
    iD_Proforma: "ID",
    fechaProforma: "Creación",
    fechaVencimiento: "Vencimiento",
    cliente: "Cliente",
    observacionProforma: "Observaciones",
    descuentoProforma: "Descuento",
    montoDescuento: "Monto de descuento",
    impuestoPorcentualProforma: "IVA(%)",
    montoImpuesto: "Monto de impuesto",
    subTotal: "Subtotal",
    baseImponible: "Subtotal c/desc:",
    totalCalculado: "Total final",
    estado: "Estado",
};

export const labelMapItemsProforma: Record<string, string> = {
    iD_ProformaItem: "ID",
    iD_Proforma: "ID Proforma",
    nombreItemProforma: "Nombre",
    descripcionItemProforma: "Descripción",
    cantidadItemProforma: "Cantidad",
    precioItemProforma: "Precio",
    fechaCreacion: "Creación",
    fechaModificacion: "Modificación",
    estado: "Estado",
};
//#endregion

//#region campos a mostrar para el form de editar

// Exportación de los campos del formulario editar para los modelos
export const negocioFormEditFields: Array<FieldConfig<DTO_Negocio>> =
    [
        {
            key: "nombreNegocio",
            label: labelMapCuenta["nombreNegocio"] ?? "Nombre del negocio",
            type: "text",
            required: true
        },
        ...columnKeysNegocio
            .filter(key => key !== "iD_Negocio" && key !== "iD_Usuario" && key !== "fechaRegistro" && key !== "nombreNegocio") // Excluye campos que no se editan
            .map(key => ({
                key,
                label: labelMapNegocio[key] ?? key,
                type: "text" as any,
            }))

    ];

export const cuentasFormEditFields: FieldConfig<DTO_Cuenta>[] = [
    {
        key: "iD_Cuenta",
        label: labelMapCuenta["iD_Cuenta"] ?? "Cuenta #",
        type: "text",
        readOnly: true,
        order: 2,
    },
    {
        key: "descripcion",
        label: labelMapCuenta["descripcion"] ?? "Descripción",
        type: "textarea",
        required: false,
        order: 6,
    },
    {
        key: "fechaInicial",
        label: labelMapCuenta["fechaInicial"] ?? "Fecha Inicial",
        type: "date",
        required: true,
        order: 7,
    },
    {
        key: "fechaLimite",
        label: labelMapCuenta["fechaLimite"] ?? "Fecha Límite",
        type: "date",
        required: true,
        order: 8,
    },

];
export const ordenservicioFormCrearCuenta: FieldConfig<DTO_Cuenta>[] = [

    {
        key: "concepto",
        label: labelMapCuenta["concepto"] ?? "Concepto",
        type: "text",
        required: false,
        readOnly: true,
        order: 5,
    },
    {
        key: "descripcion",
        label: labelMapCuenta["descripcion"] ?? "Descripción",
        type: "textarea",
        required: false,
        order: 6,
    },
    {
        key: "fechaLimite",
        label: labelMapCuenta["fechaLimite"] ?? "Fecha Límite",
        type: "date",
        required: true,
        order: 8,
    },

];

export const clienteFormEditFields: Array<FieldConfig<DTO_Cliente>> = [
    {

        key: "nombreCliente",
        label: labelMapOrdenDeServicio["nombreCliente"] ?? "Nombre",
        type: "text",
        required: true
    },
    {

        key: "apellidoCliente",
        label: labelMapOrdenDeServicio["apellidoCliente"] ?? "Apellido",
        type: "text",
        required: true
    },
    ...columnKeysCliente
        .filter(key => key !== "iD_Cliente" && key !== "iD_Usuario" && key !== "nombreCliente" && key !== "apellidoCliente") // Excluye campos que no se editan
        .map(key => ({
            key,
            label: labelMapCliente[key] ?? key,
            type: "text" as any
        }))
];
export const ItemsOrdenServicioFormEditFields: Array<FieldConfig<DTO_ItemOrdenServicio>> = [
    {

        key: "nombreItemOrdenServicio",
        label: labelMapOrdenDeServicio["nombreItemOrdenServicio"] ?? "Nombre",
        type: "text",
        required: true
    },
    ...columnKeysItemsOrdenServicio
        .filter(key => key !== "iD_ItemOrdenServicio" && key !== "iD_OrdenServicio" && key !== "nombreItemOrdenServicio" && key !== "avance")
        .map(key => ({
            key,
            label: labelMapItemsOrdenServicio[key] ?? key,
            type: (key === "monto" ? "number" : "text") as any
        }))
];

export const ordenServicioFormEditFields: Array<FieldConfig<DTO_OrdenServicio>> = [

    {
        key: "fechaEstimadaEntrega",
        label: "Estimación de Entrega",
        type: "date",
        required: false,
        order: 1, //4
    },
    {
        key: "fechaInicio",
        label: labelMapOrdenDeServicio["fechaInicio"] ?? "Fecha de Inicio",
        type: "date",
        required: false,
        order: 2, //1
        errorMessage: "La fecha de inicio es obligatoria",
    },
    {
        key: "fechaFinal",
        label: labelMapOrdenDeServicio["fechaFinal"] ?? "Fecha Final",
        type: "date",
        required: false,
        order: 3, //2
        errorMessage: "La fecha final es obligatoria",
    },
    {
        key: "fechaEntrega",
        label: labelMapOrdenDeServicio["fechaEntrega"] ?? "Fecha de Entrega",
        type: "date",
        required: false,
        order: 4, //3
    },

    {
        key: "notaOrdenServicio",
        label: labelMapOrdenDeServicio["notaOrdenServicio"] ?? "Nota",
        type: "text",
        required: false,
        order: 7,
    },
];
export const transaccionesFormEditFields: FieldConfig<DTO_Transacciones>[] = [
    { key: "concepto", label: "Concepto", type: "text", required: true },
    { key: "monto", label: "Monto", type: "number", required: true },
    {
        key: "tipo", label: "Tipo de Transacción", type: "select", required: true, options: [
            { label: "Ingreso", value: "Ingreso" },
            { label: "Gasto", value: "Gasto" },
        ]
    },
    {
        key: "tipoNumReferencia", label: "Tipo Referencia", type: "select", required: false, options: [
            { label: "Luz", value: "Luz" },
            { label: "Internet", value: "Internet" },
            { label: "Planilla", value: "Planilla" },
            { label: "Otro", value: "Otro" },
        ]
    },
    { key: "numReferencia", label: "N° Referencia", type: "text", required: false }
];

export const tarifaFormEditFields: Array<FieldConfig<DTO_Tarifa>> = [
    {
        key: "nombreTarifa",
        label: labelMapTarifa["nombreTarifa"] ?? "Nombre",
        type: "text",
        required: true,
    },
    {
        key: "descripcionTarifa",
        label: labelMapTarifa["descripcionTarifa"] ?? "Descripción",
        type: "textarea",
        required: false,
    },
    {
        key: "precioTarifa",
        label: labelMapTarifa["precioTarifa"] ?? "Precio",
        type: "number",
        required: false,
    },
];

//#endregion

//#region campos a mostrar para el form de agregar
export const cuentasFormAddFields: FieldConfig<DTO_Cuenta>[] = [
    {
        key: "concepto",
        label: labelMapCuenta["concepto"] ?? "Concepto",
        type: "text",
        required: true,
        order: 1,
        errorMessage: "El concepto es obligatorio",
    },
    {
        key: "descripcion",
        label: labelMapCuenta["descripcion"] ?? "Descripción",
        type: "textarea",
        required: false,
        order: 2,
    },
    {
        key: "fechaLimite",
        label: labelMapCuenta["fechaLimite"] ?? "Fecha Límite",
        type: "date",
        required: true,
        order: 4,
    },
];

export const tarifaFormAddFields: Array<FieldConfig<DTO_Tarifa>> = [
    {
        key: "nombreTarifa",
        label: labelMapTarifa["nombreTarifa"] ?? "Nombre",
        type: "text",
        required: true,
    },
    {
        key: "descripcionTarifa",
        label: labelMapTarifa["descripcionTarifa"] ?? "Descripción",
        type: "textarea",
        required: false,
    },
    {
        key: "precioTarifa",
        label: labelMapTarifa["precioTarifa"] ?? "Precio",
        type: "number",
        required: true,
    },
];

//#endregion