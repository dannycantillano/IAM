import { api } from "@/api";
import { API_ENDPOINTS } from "@/constants";
import { DTO_Proforma, DTO_Respuesta, DTO_SolicitudDeBusqueda } from "@/models";
import { AxiosResponse } from "axios";
import { map } from 'rxjs';
import { defer, Observable, of } from "rxjs";


export class proformaService {

    static buscarProformas(busqueda: DTO_SolicitudDeBusqueda | null): Observable<DTO_Proforma[]> {
        // 1) Validación previa
        if (!busqueda || !busqueda.term) {
            return of([]);
        }
        // 2) Deferir la llamada hasta la subscripción
        return defer(() => api.post<DTO_Proforma[]>(API_ENDPOINTS.PROFORMA.SEARCH_PROFORMAS, busqueda)).pipe(map(response => response.data));
    }

    static obtenerProformas(proforma: DTO_Proforma): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.PROFORMA.GET_PROFORMAS, proforma)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
    static actualizarProformas(proforma: DTO_Proforma): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.PROFORMA.UPDATE_PROFORMA, proforma)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
    static registrarProformas(proforma: DTO_Proforma): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.PROFORMA.ADD_PROFORMA, proforma)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }

}