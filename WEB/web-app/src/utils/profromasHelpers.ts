// src/utils/proformasHelpers.ts
import { DTO_ProformaItem, DTO_Proforma } from "@/models";

export type TipoDescuento = "Monto" | "Porcentaje";

export function calcularTotales(
    items: Pick<DTO_ProformaItem, "precioItemProforma" | "cantidadItemProforma">[],
    descuentoTipo: TipoDescuento,
    descuentoValor: number,          // 10  ó 10.5
    impuestoPorcentual: number       // 13 o 21
) {
    const subtotal = items.reduce((acumulador, itemActual) => {
        const precioUnitario = Number(itemActual.precioItemProforma ?? 0);
        const cantida = Number(itemActual.cantidadItemProforma ?? 0);
        return acumulador + precioUnitario * cantida;
    }, 0);

    const descuentoMonto =
        descuentoTipo === "Monto" ? descuentoValor : (subtotal * (descuentoValor || 0)) / 100;

    //Math.max garantiza que no existan numeros negativos en el resultado
    const baseImponible = Math.max(subtotal - (descuentoMonto || 0), 0);
    const montoImpuesto = (baseImponible * (impuestoPorcentual || 0)) / 100;
    const total = baseImponible + montoImpuesto;

    return {
        subTotal: subtotal,
        montoDescuento: descuentoMonto,
        baseImponible,
        montoImpuesto,
        totalCalculado: total,
    } as Pick<
        DTO_Proforma,
        "subTotal" | "montoDescuento" | "baseImponible" | "montoImpuesto" | "totalCalculado"
    >;
}
