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
    public class ClienteController : ControllerBase
    {
        private UTL_ManejoError manejoError = new();
        private BLL_Cliente bLL_Cliente = new();
        private DTO_Respuesta respuesta = new();
        DTO_Usuario usuario = new();

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [Route("buscarClientes")]
        [HttpPost]

        public async Task<IActionResult> BuscarClientes([FromBody] DTO_SolicitudDeBusqueda solicitud)
        {

            usuario.ID_Usuario = Convert.ToInt32(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var lista = await bLL_Cliente.BuscarClientesAsync(solicitud, usuario);
            return Ok(lista);
        }

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [Route("obtenerClientes")]
        [HttpPost]
        public async Task<DTO_Respuesta> obtenerClientes() // Change method to async
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            DTO_Usuario usuario = new();

            try
            {
                if (userIdClaim == null) throw new UnauthorizedAccessException("API ERROR: User ID claim is missing.");
                usuario.ID_Usuario = Convert.ToInt32(userIdClaim.Value);
                respuesta = await bLL_Cliente.obtenerClientes(usuario); // Await the Task<DTO_Respuesta>
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }
            return respuesta;
        }

        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [Route("guardarCliente")]
        [HttpPost]
        public async Task<DTO_Respuesta> guardarCliente([FromBody] DTO_Cliente cliente)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            try
            {
                if (userIdClaim == null) throw new UnauthorizedAccessException("User ID claim is missing.");
                cliente.ID_Usuario = Convert.ToInt32(userIdClaim.Value);
                respuesta = await bLL_Cliente.guardarCliente(cliente);
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }

            return respuesta;
        }


        [Authorize(Roles = "1")]
        [Produces("application/json")]
        [Route("actualizarCliente")]
        [HttpPost]
        public async Task<DTO_Respuesta> actualizarCliente([FromBody] DTO_Cliente cliente)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            try
            {
                if (userIdClaim == null) throw new UnauthorizedAccessException("User ID claim is missing.");
                cliente.ID_Usuario = Convert.ToInt32(userIdClaim.Value);
                respuesta = await bLL_Cliente.actualizarCliente(cliente);
            }
            catch (Exception ex)
            {
                respuesta = manejoError.errorNoControlado(ex);
            }

            return respuesta;
        }

    }


}
