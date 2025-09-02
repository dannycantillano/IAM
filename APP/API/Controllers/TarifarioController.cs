using BLL;
using DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTL;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TarifarioController : ControllerBase
    {
        private readonly UTL_ManejoError manejoError = new();
        private readonly BLL_Tarifa bll = new();
        private DTO_Respuesta respuesta = new();

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [Route("buscarTarifas")] // Type-ahead: lista ligera
        [HttpPost]
        public async Task<List<DTO_Tarifa>> BuscarTarifas([FromBody] DTO_SolicitudDeBusqueda busqueda)
        {
            return await bll.BuscarTarifasAsync(busqueda);
        }

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [Route("obtenerTarifas")]
        [HttpPost]
        public async Task<DTO_Respuesta> ObtenerTarifas([FromBody] DTO_Negocio negocio)
        {
            try
            {
                respuesta = await bll.ObtenerTarifas(negocio);
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }
            return respuesta;
        }

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [Route("registrarTarifa")]
        [HttpPost]
        public async Task<DTO_Respuesta> RegistrarTarifa([FromBody] DTO_Tarifa tarifa)
        {
            try
            {
                respuesta = await bll.RegistrarTarifa(tarifa);
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }
            return respuesta;
        }

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [Route("actualizarTarifa")]
        [HttpPost]
        public async Task<DTO_Respuesta> ActualizarTarifa([FromBody] DTO_Tarifa tarifa)
        {
            try
            {
                respuesta = await bll.ActualizarTarifa(tarifa);
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }
            return respuesta;
        }
    }
}
