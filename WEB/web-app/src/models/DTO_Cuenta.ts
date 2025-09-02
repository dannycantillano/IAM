import { DTO_DetalleCuentaJSON } from './DTO_DetalleCuentaJSON';
import { DTO_Estado } from './DTO_Estado';


export class DTO_Cuenta {
    iD_Cuenta: number = 0;
    iD_Negocio: number = 0;
    iD_OrdenServicio?: number;
    estado: DTO_Estado = new DTO_Estado();
    concepto: string = "";
    descripcion?: string;
    monto: number = 0;
    tipoCuenta: string = "";
    detalleJSON: DTO_DetalleCuentaJSON = new DTO_DetalleCuentaJSON();
    fechaInicial: Date = new Date();
    fechaModificacion: Date = new Date();
    fechaLimite?: Date;

    //Campos Calculados
    montoAbonado: number = 0;
    saldoPendiente: number = 0;
    estadoPago?: string;
}