import { DTO_Estado } from "./DTO_Estado";

export class DTO_ProformaItem {
    iD_ProformaItem: number = 0;
    iD_Proforma: number = 0;
    estado: DTO_Estado = new DTO_Estado();
    nombreItemProforma: string = "";
    descripcionItemProforma: string = "";
    precioItemProforma?: number = undefined;
    cantidadItemProforma?: number = undefined;
    fechaCreacion?: Date = undefined;
    fechaModificacion?: Date = undefined;
}