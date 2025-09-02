import { validadorGenerico } from "./validadorGenerico";
import {DTO_Param, DTO_Tarifa } from "@/models";

// tipoValidacion: "C" = Crear, "U" = Actualizar, "D" = Eliminar

export class valida_DTO_Tarifas {

  static validar(tarifa: DTO_Tarifa, tipoValidacion: string): DTO_Param[] {
    const errores: DTO_Param[] = [];

    if (tipoValidacion === "U" || tipoValidacion === "D") {
      if (validadorGenerico.isEmpty(tarifa.iD_Tarifa)) {
        errores.push({
          nombre: "iD_Tarifa",
          valor: "El ID de la tarifa no puede estar vacío."
        });
      } else if (!validadorGenerico.isNumeric(tarifa.iD_Tarifa)) {
          errores.push({
              nombre: "iD_Tarifa",
              valor: "El ID de la tarifa debe ser numérico."
            });
        }
    }
    
    if (validadorGenerico.isEmpty(tarifa.nombreTarifa)) {
      errores.push({
        nombre: "nombreTarifa",
        valor: "El nombre de la tarifa es requerido."
      });
    } else if (!validadorGenerico.hasMaxLength(tarifa.nombreTarifa, 100)) {
      errores.push({
        nombre: "nombreTarifa",
        valor: `El nombre no puede exceder los 100 caracteres. Actualmente (${tarifa.nombreTarifa.length}).`
      });
      }
      
      if (validadorGenerico.isEmpty(tarifa.precioTarifa)) {
          errores.push({
              nombre: "precioTarifa",
              valor: "El precio de la tarifa es requerido."
          });
      } else if (!validadorGenerico.isNumeric(tarifa.precioTarifa)) {
          errores.push({
              nombre: "precioTarifa",
              valor: `El precio debe ser un número válido. Actualmente (${tarifa.precioTarifa}).`
          });
      } else if (!validadorGenerico.isNonNegative(tarifa.precioTarifa)) {
            errores.push({
                nombre: "precioTarifa",
                valor: "El precio de la tarifa no puede ser negativo."
            });
        }

    return errores;
  }
}
