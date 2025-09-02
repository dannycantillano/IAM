import { Observable, defer } from 'rxjs';
import { map } from 'rxjs';
import { DTO_ItemOrdenServicio, DTO_Respuesta } from "@/models";
import { api } from '@/api';
import { API_ENDPOINTS } from '@/constants';
import { AxiosResponse } from 'axios';


export class itemsOrdenesService {

    static obtenerItemsOrdensDeServicio(itemsOrden: DTO_ItemOrdenServicio | null): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.ITEMS_ORDERS.GET_ORDERS, itemsOrden)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
    
    static guardarItemsDesdeProforma(itemsOrden: Array<DTO_ItemOrdenServicio>): Observable<DTO_Respuesta> {
        console.log(itemsOrden);
        
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.ITEMS_ORDERS.ADD_ITEMS_PROFORMA, itemsOrden as Array<DTO_ItemOrdenServicio>)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
    
    static registrarItemsOrdensDeServicio(itemsOrden: DTO_ItemOrdenServicio | null): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.ITEMS_ORDERS.ADD_ORDER, itemsOrden as DTO_ItemOrdenServicio)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
    
    static actualizarItemsOrdensDeServicio(itemsOrden: DTO_ItemOrdenServicio | null): Observable<DTO_Respuesta> {
        return defer(() =>
            api.post<DTO_Respuesta>(API_ENDPOINTS.ITEMS_ORDERS.UPDATE_ORDER, itemsOrden as DTO_ItemOrdenServicio)
        ).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
}