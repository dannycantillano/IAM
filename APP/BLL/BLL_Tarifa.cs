
using DAL;
using DTO;

namespace BLL
{
    public class BLL_Tarifa
    {
        private readonly DAL_Tarifa dal = new();

        public async Task<List<DTO_Tarifa>> BuscarTarifasAsync(DTO_SolicitudDeBusqueda busqueda)
            => await dal.BuscarTarifasAsync(busqueda);

        public async Task<DTO_Respuesta> ObtenerTarifas(DTO_Negocio negocio)
            => await dal.ObtenerTarifas(negocio);

        public async Task<DTO_Respuesta> RegistrarTarifa(DTO_Tarifa tarifa)
            => await dal.RegistrarTarifa(tarifa);

        public async Task<DTO_Respuesta> ActualizarTarifa(DTO_Tarifa tarifa)
            => await dal.ActualizarTarifa(tarifa);
    }
}
