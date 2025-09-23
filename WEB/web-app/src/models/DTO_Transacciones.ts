import { DTO_Estado } from "./DTO_Estado";

export class DTO_Transacciones {
    iD_Transaccion: number = 0;
    iD_Negocio: number = 0;
    estado: DTO_Estado = new DTO_Estado();
    concepto: string = '';
    monto: number | undefined = undefined;
    tipo: string = '';
    numReferencia: string = '';
    tipoNumReferencia: string = '';
    fechaTransaccion: Date = new Date();
}
