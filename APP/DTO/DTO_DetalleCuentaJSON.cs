using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DTO
{
    public class DTO_DetalleCuentaJSON
    {
        #region Properties
        public List<DTO_Fila_Detalle> Filas { get; set; } = new();
        public DTO_Param Descuento { get; set; } = new();
        public DTO_Param Impuesto { get; set; } = new();
        #endregion


    }
}
