import { DTO_ProformaItem, DTO_Param, DTO_Proforma } from "@/models";
import { validadorGenerico } from "./validadorGenerico";

// tipoValidacion: "C" = Crear, "U" = Actualizar, "D" = Eliminar

export class valida_DTO_Items_y_Proformas{
    static validarItems(item: DTO_ProformaItem): DTO_Param[] {
        const errores: DTO_Param[] = [];

        // Nombre del ítem (requerido, máx 100)
        if (validadorGenerico.isEmpty(item.nombreItemProforma)) {
            errores.push({
                nombre: "nombreItemProforma",
                valor: "El nombre del ítem es obligatorio."
            });
        }
        // Descripción (opcional, máx 255)
        if (!validadorGenerico.hasMaxLength(item.descripcionItemProforma ?? "", 255)) {
            errores.push({
                nombre: "descripcionItemProforma",
                valor: `La descripción no puede exceder los 255 caracteres. Actualmente (${(item.descripcionItemProforma ?? "").length}).`
            });
        }

        // Precio (obligatorio, numérico)
        if (validadorGenerico.isEmpty(item.precioItemProforma)) {
            errores.push({
                nombre: "precioItemProforma",
                valor: "Debe ingresar el precio del ítem."
            });
        } else if (!validadorGenerico.isNumeric(item.precioItemProforma)) {
            errores.push({
                nombre: "precioItemProforma",
                valor: "El precio debe ser numérico."
            });
        } else if (!validadorGenerico.isNonNegative(item.precioItemProforma)) {
            errores.push({
                nombre: "cantidad",
                valor: "El precio debe ser un valor positivo."
            });
        } else if (item.precioItemProforma !== undefined && validadorGenerico.isCero(item.precioItemProforma)) {
            errores.push({
                nombre: "precioItemProforma",
                valor: "Debe ingresar un precio válido."
            });
        } else if (validadorGenerico.hasWeirdNumericPattern(item.precioItemProforma)) {
            errores.push({
                nombre: "precioItemProforma",
                valor: "El formato del precio es inválido."
            });
        } else if (!validadorGenerico.isNumericStrict(item.precioItemProforma, { allowDecimal: true, maxDecimals: 3 })) {
            errores.push({
                nombre: "precioItemProforma",
                valor: "El precio debe tener como máximo 3 decimales."
            });
        }

        // Cantidad (obligatoria, numérica)
        if (validadorGenerico.isEmpty(item.cantidadItemProforma)) {
            errores.push({
                nombre: "cantidadItemProforma",
                valor: "Debe ingresar la cantidad del ítem."
            });
        } else if (!validadorGenerico.isNumeric(item.cantidadItemProforma)) {
            errores.push({
                nombre: "cantidadItemProforma",
                valor: "La cantidad debe ser numérica."
            });
        } else if (!validadorGenerico.isNonNegative(item.cantidadItemProforma)) {
            errores.push({
                nombre: "cantidadItemProforma",
                valor: "La cantidad debe ser un valor positivo."
            });
        } else if (item.cantidadItemProforma !== undefined && validadorGenerico.isCero(item.cantidadItemProforma)) {
            errores.push({
                nombre: "cantidadItemProforma",
                valor: "Debe ingresar una cantidad válida."
            });
        } else if (validadorGenerico.hasWeirdNumericPattern(item.cantidadItemProforma)) {
            errores.push({
                nombre: "cantidadItemProforma",
                valor: "El formato de la cantidad es inválido."
            });
        }

        return errores;
    }

    static validarProforma(proforma: DTO_Proforma, tipoValidacion: string): DTO_Param[] {
        const errores: DTO_Param[] = [];

        if (tipoValidacion === "U" || tipoValidacion === "C") {

            if (validadorGenerico.isEmpty(proforma.iD_Proforma)) {
                errores.push({
                    nombre: "iD_ProformaItem",
                    valor: "El ID del ítem de proforma no puede estar vacío."
                });
            } else if (!validadorGenerico.isNumeric(proforma.iD_Proforma)) {
                errores.push({
                    nombre: "iD_ProformaItem",
                    valor: "El ID del ítem de proforma debe ser numérico."
                });
            }

        }
        // Facha de vencimiento (opcional, si existe debe ser válida)
        if (proforma.fechaVencimiento) {
            if (!validadorGenerico.isValidDate(proforma.fechaVencimiento)) {
                errores.push({
                    nombre: "fechaVencimiento",
                    valor: "La fecha de vencimiento debe ser una fecha válida."
                });
            }
        }

        // Descuento (obligatorio, numérico)
         if (!validadorGenerico.isNumeric(proforma.montoDescuento)) {
            errores.push({
                nombre: "montoDescuento",
                valor: "El valor de descuento debe ser numérico."
            });
        } else if (!validadorGenerico.isNonNegative(proforma.montoDescuento)) {
            errores.push({
                nombre: "montoDescuento",
                valor: "El descuento debe ser un valor positivo."
            });
         } else if (validadorGenerico.isNumericStrict(proforma.montoDescuento, { allowDecimal: true, maxDecimals: 3 }) === false) {
            errores.push({
                nombre: "montoDescuento",
                valor: "El descuento debe tener como máximo 3 decimales."
            });
        } else if (validadorGenerico.hasWeirdNumericPattern(proforma.montoDescuento)) {
            errores.push({
                nombre: "montoDescuento",
                valor: "El formato del descuento es inválido."
            });
        }
        

        // Impuesto (obligatorio, numérico)
        if (!validadorGenerico.isNumeric(proforma.montoImpuesto)) {
            errores.push({
                nombre: "montoImpuesto",
                valor: "El valor de impuesto debe ser numérico."
            });
        } else if (!validadorGenerico.isNonNegative(proforma.montoImpuesto)) {
            errores.push({
                nombre: "montoImpuesto",
                valor: "El impuesto debe ser un valor positivo."
            });
        }

        return errores;
    }
}
