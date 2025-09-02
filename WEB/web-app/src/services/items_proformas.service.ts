import { api } from "@/api";
import { API_ENDPOINTS } from "@/constants";
import { DTO_Proforma, DTO_ProformaItem, DTO_Respuesta } from "@/models";
import { AxiosResponse } from "axios";
import { map } from 'rxjs';
import { defer, Observable } from "rxjs";


export class items_proformaService {


    static obtenerItemsProformas(proforma: DTO_Proforma): Observable<DTO_Respuesta> {
        return defer(() =>
            api.post<DTO_Respuesta>(API_ENDPOINTS.PROFORMA_ITEMS.GET_ITEMS, proforma)
        ).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }

    static registrarItemProforma(item: DTO_ProformaItem): Observable<DTO_Respuesta> {
        return defer(() =>
            api.post<DTO_Respuesta>(API_ENDPOINTS.PROFORMA_ITEMS.ADD_ITEMS, item)
        ).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
    static actualizarItemProforma(item: DTO_ProformaItem): Observable<DTO_Respuesta> {
        return defer(() =>
            api.post<DTO_Respuesta>(API_ENDPOINTS.PROFORMA_ITEMS.UPDATE_ITEMS, item)
        ).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }

}