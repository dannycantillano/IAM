//#region updateItemById: Actualiza o agrega un elemento en una lista por su id

import { DTO_DetalleCuentaJSON } from "@/models";
import { Console } from "console";

/**
 * Actualiza un elemento en la lista si existe, comparando por la clave idKey.
 * Si no existe, agrega el elemento actualizado al final de la lista.
 * 
 * @param list - Lista original de elementos.
 * @param updatedItem - Elemento actualizado a insertar o reemplazar.
 * @param idKey - Clave que identifica de forma única a cada elemento.
 * @returns Una nueva lista con el elemento actualizado o agregado.
 */
export function updateItemById<T>(list: T[], updatedItem: T, idKey: keyof T): T[] {
    const id = updatedItem[idKey];
    const index = list.findIndex(item => item[idKey] === id);
    if (index >= 0) {
        const newList = [...list];
        newList[index] = updatedItem;
        return newList;
    }
    return [...list, updatedItem];
}
//#endregion

//#region parametrosAString: Convierte una lista de parámetros a string legible
/**
 * Convierte una lista de objetos { nombre, valor } en un string legible.
 * Cada parámetro se capitaliza y se separa por coma.
 * 
 * @param lista - Lista de parámetros a convertir.
 * @returns String con los parámetros formateados.
 */
export function parametrosAString(
    lista?: { nombre: string; valor: string }[] | null
): string {
    if (!Array.isArray(lista) || lista.length === 0) return "";

    return lista
        .map(({ nombre = "", valor = "" }) => {
            const nom = nombre.trim();
            const val = valor.trim();
            const nomCap = nom
                ? nom[0].toUpperCase() + nom.slice(1).toLowerCase()
                : "";
            return `${nomCap}: ${val}`;
        })
        .join(", ");
}
//#endregion

export function compararObjetos<T extends object>(a: T, b: T, omitKeys: (keyof T)[]) {
    const strip = (o: any): any =>
        o && typeof o === 'object'
            ? Array.isArray(o)
                ? o.map(strip)
                : Object.fromEntries(
                    Object.entries(o)
                        .filter(([k]) => !(omitKeys as string[]).includes(k))
                        .map(([k, v]) => [k, strip(v)])
                )
            : o;

    return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

//#region formatColones: Formatea un valor numérico como colones costarricenses
/**
 * Formatea un valor como moneda colón costarricense.
 * Si el valor no es numérico, retorna "₡ 0,00".
 * 
 * @param valor - Valor a formatear.
 * @returns String con el valor formateado en colones.
 */
export const formatColones = (valor: unknown): string => {
    const numero = typeof valor === "number" ? valor : Number(valor);

    if (isNaN(numero)) return "₡ 0,00";

    return `₡ ${numero
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
        .replace(".", ",")}`;
};
//#endregion

//#region formatDetalleJSON: Formatea el detalle JSON para mostrar, exportar, filtrar o ordenar
/**
 * Formatea el objeto detalleJSON en un string legible o HTML según el tipo.
 * 
 * @param detalle - Objeto detalleJSON con filas, descuento e impuesto.
 * @param type - Tipo de formato: "display", "export", "filter" o "sort".
 * @returns String con el detalle formateado.
 */
export function formatDetalleJSON(
    detalle: any,
    type: "display" | "export" | "filter" | "sort" = "display"
): string {

    
    if (detalle?.filas.length == 0 && detalle?.impuesto?.valor == 0 && detalle?.descuento?.valor == 0) {
        return ""
    }

    const filas = detalle?.filas ?? [];
    const desc = detalle?.descuento?.valor ?? "0";
    const tipoDesc = detalle?.descuento?.nombre ?? "Monto";
    const imp = detalle?.impuesto?.valor ?? "0";

    const descStr =
        tipoDesc === "Monto"
            ? `Desc: ₡${Number(desc).toLocaleString("es-CR", {
                minimumFractionDigits: 2,
            })}`
            : `Desc: ${Number(desc)}%`;

    const impStr = `Imp: ${Number(imp)}%`;
    let filasStr = "";
    if (filas.length === 0) {
        filasStr += "0";
    } else {
        const mapped = filas.map(
            (f: any) =>
                `${f.nombre}: <span style="color:green;">₡${Number(f.valor).toLocaleString("es-CR", {
                    minimumFractionDigits: 2,
                })}</span>`
        );
        filasStr += mapped.join(", ");
    }

    if (type === "export" || type === "filter" || type === "sort") {
        return `${descStr}, ${impStr}, ${filasStr}`;
    }


    // Adaptación para usar correctamente el truncate de Bootstrap
    return `
    <div class="row dt-hover-invert">
      <div class="col-auto">
        <span class="d-inline-block text-truncate bg-primary-subtle text-dark px-2 py-1 w-100" style="max-width: 100vw;">${descStr}</span>
      </div>
      <div class="col-auto">
        <span class="d-inline-block text-truncate bg-info-subtle text-dark px-2 py-1 w-100" style="max-width: 100vw;">${impStr}</span>
      </div>
      <div class="col-auto">
        <span class="d-inline-block text-truncate bg-secondary-subtle text-dark px-2 py-1 w-100" style="max-width: 40vw;">${filasStr}</span>
      </div>
    </div>
    `;
}
//#endregion