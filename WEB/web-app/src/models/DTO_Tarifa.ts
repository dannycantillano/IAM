import { DTO_Estado } from "./DTO_Estado";

export class DTO_Tarifa {
    iD_Tarifa: number = 0;
    iD_Negocio: number = 0;
    estado: DTO_Estado = new DTO_Estado();
    nombreTarifa: string = "";
    descripcionTarifa: string = "";
    precioTarifa?: number = undefined;
    fechaCreacion?: Date = undefined;
    fechaModificacion?: Date = undefined;
}