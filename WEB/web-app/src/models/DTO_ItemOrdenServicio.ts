import { DTO_Estado } from "@/models";

export class DTO_ItemOrdenServicio {
    iD_ItemOrdenServicio: number = 0;
    iD_OrdenServicio: number = 0;
    estado: DTO_Estado = new DTO_Estado();
    nombreItemOrdenServicio: string = '';
    descripcion: string = '';
    monto: number = 0;
    avance: number = 0;
    cantidad: number = 1;
}
