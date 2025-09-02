import { DTO_Estado } from "./DTO_Estado";
import { DTO_Cliente } from "./DTO_Cliente";

export class DTO_Proforma {
    iD_Proforma: number = 0;
    iD_Negocio: number = 0;
    iD_Cliente: number = 0;
    estado: DTO_Estado = new DTO_Estado();
    fechaProforma?: Date = undefined;
    fechaVencimiento?: Date = undefined;
    observacionProforma: string = "";
    fechaModificacion?: Date = undefined;
    descuentoProforma?: number = undefined;
    descuentoPorcentualProforma?: boolean = undefined;
    impuestoPorcentualProforma?: number = undefined;
    subTotal?: number = undefined;
    montoDescuento?: number = undefined;
    baseImponible?: number = undefined;
    montoImpuesto?: number = undefined;
    totalCalculado?: number = undefined;
    cliente?: DTO_Cliente = undefined;
}