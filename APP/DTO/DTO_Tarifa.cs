using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DTO
{
    public class DTO_Tarifa
    {
        #region Atributos
        private int iD_Tarifa;
        private int iD_Negocio;
        private DTO_Estado estado;
        private string nombreTarifa;
        private string descripcionTarifa;
        private decimal? precioTarifa;
        private DateTime? fechaCreacion;
        private DateTime? fechaModificacion;
        #endregion

        #region Constructor
        public DTO_Tarifa()
        {
            ID_Tarifa = 0;
            ID_Negocio = 0;
            Estado = new();
            NombreTarifa = string.Empty;
            DescripcionTarifa = string.Empty;
            PrecioTarifa = null;
            FechaCreacion = null;
            FechaModificacion = null;
        }
        #endregion

        #region Getter y Setter
        public int ID_Tarifa { get => iD_Tarifa; set => iD_Tarifa = value; }
        public int ID_Negocio { get => iD_Negocio; set => iD_Negocio = value; }
        public DTO_Estado Estado { get => estado; set => estado = value; }
        public string NombreTarifa { get => nombreTarifa; set => nombreTarifa = value; }
        public string DescripcionTarifa { get => descripcionTarifa; set => descripcionTarifa = value; }
        public decimal? PrecioTarifa { get => precioTarifa; set => precioTarifa = value; }
        public DateTime? FechaCreacion { get => fechaCreacion; set => fechaCreacion = value; }
        public DateTime? FechaModificacion { get => fechaModificacion; set => fechaModificacion = value; }
        #endregion
    }
}

