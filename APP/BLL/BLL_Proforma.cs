using DAL;
using DTO;

namespace BLL
{
    public class BLL_Proforma
    {
        private readonly DAL_Proforma dal = new();

        public async Task<DTO_Respuesta> RegistrarProforma(DTO_Proforma p)
            => await dal.RegistrarProforma(p);

        public async Task<DTO_Respuesta> ActualizarProforma(DTO_Proforma p)
            => await dal.ActualizarProforma(p);

        public async Task<DTO_Respuesta> ObtenerProformas(DTO_Proforma proforma)
            => await dal.ObtenerProformas(proforma);

        public async Task<DTO_Respuesta> BuscarProformas(DTO_SolicitudDeBusqueda busqueda)
         => await dal.BuscarProformas(busqueda);

    }
}
