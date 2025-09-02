using BLL;
using DAL;
using DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UTL;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProformaController : ControllerBase
    {
        private readonly UTL_ManejoError manejoError = new();
        private readonly BLL_Proforma bll = new();
        private DTO_Respuesta respuesta = new();

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [HttpPost]
        [Route("registrarProforma")]
        public async Task<DTO_Respuesta> RegistrarProforma([FromBody] DTO_Proforma proforma)
        {
            try
            {
                respuesta = await bll.RegistrarProforma(proforma);
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }
            return respuesta;
        }

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [HttpPost]
        [Route("actualizarProforma")]
        public async Task<DTO_Respuesta> ActualizarProforma([FromBody] DTO_Proforma proforma)
        {
            try
            {
                respuesta = await bll.ActualizarProforma(proforma);
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }
            return respuesta;
        }

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [HttpPost]
        [Route("obtenerProformas")]
        public async Task<DTO_Respuesta> ObtenerProformas([FromBody] DTO_Proforma proforma)
        {
            try
            {
                respuesta = await bll.ObtenerProformas(proforma);
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }
            return respuesta;
        }

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [HttpPost]
        [Route("buscarProformas")]
        public async Task<IActionResult> BuscarProformas([FromBody] DTO_SolicitudDeBusqueda busqueda)
        {
            try
            {
                respuesta = await bll.BuscarProformas(busqueda);
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }
            return Ok(respuesta.Resultado);
        }

    }
}
