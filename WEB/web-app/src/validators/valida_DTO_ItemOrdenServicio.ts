import { DTO_ItemOrdenServicio, DTO_Param } from "@/models";
import { validadorGenerico } from "./validadorGenerico";

// tipoValidacion: "C" = Crear, "U" = Actualizar, "D" = Eliminar

export class valida_DTO_ItemOrdenServicio {
  static validar(item: DTO_ItemOrdenServicio, tipoValidacion: string): DTO_Param[] {
    const errores: DTO_Param[] = [];

    if (tipoValidacion === "U" || tipoValidacion === "D") {
      if (validadorGenerico.isEmpty(item.iD_ItemOrdenServicio)) {
        errores.push({
          nombre: "iD_ItemOrdenServicio",
          valor: "El ID del ítem no puede estar vacío."
        });
      } else if (!validadorGenerico.isNumeric(item.iD_ItemOrdenServicio)) {
        errores.push({
          nombre: "iD_ItemOrdenServicio",
          valor: "El ID del ítem debe ser numérico."
        });
      }
    }

    if (validadorGenerico.isEmpty(item.iD_OrdenServicio)) {
      errores.push({
        nombre: "iD_OrdenServicio",
        valor: "La orden de servicio es obligatoria."
      });
    } else if (!validadorGenerico.isNumeric(item.iD_OrdenServicio)) {
      errores.push({
        nombre: "iD_OrdenServicio",
        valor: "El ID de orden de servicio debe ser numérico."
      });
    }

        if (validadorGenerico.isEmpty(item.cantidad)) {
      errores.push({
        nombre: "cantidad",
        valor: "La cantidad no puede estar vacía"
      });
    } else if (!validadorGenerico.isNumeric(item.cantidad)) {
      errores.push({
        nombre: "cantidad",
        valor: "La cantidad debe ser numérico."
      });
    } else if (!validadorGenerico.isNonNegative(item.cantidad)) {
      errores.push({
        nombre: "cantidad",
        valor: "La cantidad debe ser un valor positivo."
      });
    }

    if (validadorGenerico.isEmpty(item.estado.iD_Estado)) {
      errores.push({
        nombre: "estado",
        valor: "Debe seleccionar un estado."
      });
    } else if (!validadorGenerico.isNumeric(item.estado.iD_Estado)) {
      errores.push({
        nombre: "estado",
        valor: "El estado debe ser numérico."
      });
    }

    if (validadorGenerico.isEmpty(item.nombreItemOrdenServicio)) {
      errores.push({
        nombre: "nombreItemOrdenServicio",
        valor: "El nombre del ítem es obligatorio."
      });
    } else if (!validadorGenerico.hasMaxLength(item.nombreItemOrdenServicio, 100)) {
      errores.push({
        nombre: "nombreItemOrdenServicio",
        valor: `El nombre no puede exceder los 100 caracteres. Actualmente (${item.nombreItemOrdenServicio.length}).`
      });
    }

    if (!validadorGenerico.hasMaxLength(item.descripcion, 255)) {
      errores.push({
        nombre: "descripcion",
        valor: `La descripción no puede exceder los 255 caracteres. Actualmente (${item.descripcion.length}).`
      });
    }

    if (validadorGenerico.isEmpty(item.monto)) {
      errores.push({
        nombre: "monto",
        valor: "El monto es obligatorio."
      });
    } else if (!validadorGenerico.isNumeric(item.monto)) {
      errores.push({
        nombre: "monto",
        valor: "El monto debe ser un número válido."
      });
    }else if (!validadorGenerico.isNonNegative(item.cantidad)) {
      errores.push({
        nombre: "cantidad",
        valor: "El monto debe ser un valor positivo."
      });
    }

    if (item.avance != null && !validadorGenerico.isNumeric(item.avance)) {
      errores.push({
        nombre: "avance",
        valor: "El avance debe ser un número."
      });
    }

    return errores;
  }
}
