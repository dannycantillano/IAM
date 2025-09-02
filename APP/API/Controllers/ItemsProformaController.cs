using BLL;
using DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTL;

namespace API.Controllers
{
    [Route("api/[controller]")]
    public class ItemsProformaController
    {
        private readonly UTL_ManejoError manejoError = new();
        private readonly BLL_ItemsProforma bll = new();
        private DTO_Respuesta respuesta = new();


        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [HttpPost]
        [Route("registrarItemsProforma")]
        public async Task<DTO_Respuesta> RegistrarItemsProforma([FromBody] DTO_ProformaItem item)
        {
            try
            {
                respuesta = await bll.RegistrarItemsProforma(item);
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
        [Route("actualizarItemsProforma")]
        public async Task<DTO_Respuesta> ActualizarItemsProforma([FromBody] DTO_ProformaItem item)
        {
            try
            {
                respuesta = await bll.ActualizarItemsProforma(item);
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
        [Route("obtenerItemsProforma")]
        public async Task<DTO_Respuesta> ObtenerItemsProforma([FromBody] DTO_Proforma filtro)
        {
            try
            {
                respuesta = await bll.ObtenerItemsProforma(filtro);
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }
            return respuesta;
        }

    }
}
