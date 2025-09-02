import { Observable, defer, of } from 'rxjs';
import { map } from 'rxjs';
import { api } from '@/api';
import { API_ENDPOINTS } from '@/constants';
import { DTO_Negocio, DTO_Respuesta, DTO_SolicitudDeBusqueda } from '@/models';
import { AxiosResponse } from 'axios';
import { DTO_Tarifa } from '@/models/DTO_Tarifa';

export class tarifasService {

    static buscarTarifas(busqueda: DTO_SolicitudDeBusqueda | null): Observable<DTO_Tarifa[]> {
        // 1) Validación previa
        if (!busqueda || !busqueda.term || busqueda.term.trim().length < 3) {
            return of([]);
        }
        // 2) Deferir la llamada hasta la subscripción
        return defer(() =>
            api.post<DTO_Tarifa[]>(API_ENDPOINTS.TARIFAS.SEARCH_TARIFA, busqueda)
        ).pipe(
            // 3) Extraer sólo el body
            map(response => response.data)
        );
    }

    static obtenerTarifas(negocio: DTO_Negocio): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.TARIFAS.GET_TARIFAS, negocio)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
    static actualizarTarifas(tarifa: DTO_Tarifa): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.TARIFAS.UPDATE_TARIFA, tarifa)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
    static registrarTarifas(tarifa: DTO_Tarifa): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.TARIFAS.ADD_TARIFA, tarifa)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }

}