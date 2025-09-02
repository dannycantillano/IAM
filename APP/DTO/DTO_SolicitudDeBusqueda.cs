using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DTO
{
    public class DTO_SolicitudDeBusqueda
    {
        public string Term { get; set; } = string.Empty;
        public DTO_Negocio? Negocio { get; set; } = null;
    }
}
