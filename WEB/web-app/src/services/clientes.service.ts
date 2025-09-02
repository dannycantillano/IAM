import { Observable, defer, of } from 'rxjs';
import { map } from 'rxjs';
import { api } from '@/api';
import { API_ENDPOINTS } from '@/constants';
import { DTO_Cliente, DTO_Respuesta, DTO_SolicitudDeBusqueda } from '@/models';
import { AxiosResponse } from 'axios';

export class clientesService {

    static buscarClientes(busqueda: DTO_SolicitudDeBusqueda | null): Observable<DTO_Cliente[]> {
        // 1) Validación previa
        console.log("Validando solicitud de búsqueda:", busqueda);
        
        if (!busqueda || busqueda.term.trim().length < 3) {
            console.log("Solicitud de búsqueda inválida, retornando lista vacía.");
            return of([]);
            
        }
        // 2) Deferir la llamada hasta la subscripción
        return defer(() =>
            api.post<DTO_Cliente[]>(API_ENDPOINTS.CLIENTS.SEARCH_CLIENTS, busqueda )
        ).pipe(
            // 3) Extraer sólo el body
            map(response => response.data)
        );
    }

    static obtenerClientes(): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.CLIENTS.GET_CLIENTS)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
    static actualizarClientes(cliente: DTO_Cliente): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.CLIENTS.UPDATE_CLIENT, cliente)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }
    static registrarClientes(cliente: DTO_Cliente): Observable<DTO_Respuesta> {
        return defer(() => api.post<DTO_Respuesta>(API_ENDPOINTS.CLIENTS.ADD_CLIENT, cliente)).pipe(map((r: AxiosResponse<DTO_Respuesta>) => r.data));
    }

}