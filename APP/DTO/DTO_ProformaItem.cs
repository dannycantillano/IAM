using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DTO
{
    public class DTO_ProformaItem
    {
        #region Atributos
        private int iD_ProformaItem;
        private int iD_Proforma;
        private DTO_Estado estado;
        private string nombreItemProforma;
        private string descripcionItemProforma;
        private decimal? precioItemProforma;
        private decimal? cantidadItemProforma;
        private DateTime? fechaCreacion;
        private DateTime? fechaModificacion;
        #endregion


        #region Constructor
        public DTO_ProformaItem()
        {
            ID_ProformaItem = 0;
            ID_Proforma = 0;
            Estado = new();
            NombreItemProforma = string.Empty;
            DescripcionItemProforma = string.Empty;
            PrecioItemProforma = null;
            CantidadItemProforma = null;
            FechaCreacion = null;
            FechaModificacion = null;
        }
        #endregion


        #region Getter y Setter
        public int ID_ProformaItem { get => iD_ProformaItem; set => iD_ProformaItem = value; }
        public int ID_Proforma { get => iD_Proforma; set => iD_Proforma = value; }
        public DTO_Estado Estado { get => estado; set => estado = value; }
        public string NombreItemProforma { get => nombreItemProforma; set => nombreItemProforma = value; }
        public string DescripcionItemProforma { get => descripcionItemProforma; set => descripcionItemProforma = value; }
        public decimal? PrecioItemProforma { get => precioItemProforma; set => precioItemProforma = value; }
        public decimal? CantidadItemProforma { get => cantidadItemProforma; set => cantidadItemProforma = value; }
        public DateTime? FechaCreacion { get => fechaCreacion; set => fechaCreacion = value; }
        public DateTime? FechaModificacion { get => fechaModificacion; set => fechaModificacion = value; }
        #endregion
    }
}

