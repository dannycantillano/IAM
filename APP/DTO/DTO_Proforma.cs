using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace DTO
{
    public class DTO_Proforma
    {
        #region Atributos

        private int iD_Proforma;
        private int iD_Negocio;
        private int? iD_Cliente;
        private DTO_Estado estado;
        private DateTime? fechaProforma;
        private DateTime? fechaVencimiento;
        private DateTime? fechaModificacion;
        private string observacionProforma;
        private bool? descuentoPorcentualProforma;
        private decimal? descuentoProforma;
        private decimal? impuestoPorcentualProforma;
        private decimal? subTotal;
        private decimal? montoDescuento;
        private decimal? baseImponible;
        private decimal? montoImpuesto;
        private decimal? totalCalculado;
        private DTO_Cliente? cliente;

        #endregion

        #region Constructor
        public DTO_Proforma()
        {
            ID_Proforma = 0;
            ID_Negocio = 0;

            // ✅ “sin cliente”: null
            ID_Cliente = null;

            Estado = new();
            FechaProforma = null;
            FechaVencimiento = null;
            ObservacionProforma = string.Empty;
            FechaModificacion = null;
            TotalCalculado = null;
            DescuentoProforma = null;
            DescuentoPorcentualProforma = null;
            ImpuestoPorcentualProforma = null;
            SubTotal = null;
            MontoDescuento = null;
            BaseImponible = null;
            MontoImpuesto = null;

            // ✅ No instanciar para que no se serialice ni se valide
            Cliente = null;


        }
        #endregion

        #region Getter y Setter
        public int ID_Proforma { get => iD_Proforma; set => iD_Proforma = value; }
        public int ID_Negocio { get => iD_Negocio; set => iD_Negocio = value; }

        // ✅ Nullable para representar “sin cliente”
        public int? ID_Cliente { get => iD_Cliente; set => iD_Cliente = value; }

        public DTO_Estado Estado { get => estado; set => estado = value; }
        public DateTime? FechaProforma { get => fechaProforma; set => fechaProforma = value; }
        public DateTime? FechaVencimiento { get => fechaVencimiento; set => fechaVencimiento = value; }
        public string ObservacionProforma { get => observacionProforma; set => observacionProforma = value; }
        public DateTime? FechaModificacion { get => fechaModificacion; set => fechaModificacion = value; }
        public decimal? DescuentoProforma { get => descuentoProforma; set => descuentoProforma = value; }
        public bool? DescuentoPorcentualProforma { get => descuentoPorcentualProforma; set => descuentoPorcentualProforma = value; }
        public decimal? ImpuestoPorcentualProforma { get => impuestoPorcentualProforma; set => impuestoPorcentualProforma = value; }
        public decimal? SubTotal { get => subTotal; set => subTotal = value; }
        public decimal? MontoDescuento { get => montoDescuento; set => montoDescuento = value; }
        public decimal? BaseImponible { get => baseImponible; set => baseImponible = value; }
        public decimal? MontoImpuesto { get => montoImpuesto; set => montoImpuesto = value; }
        public decimal? TotalCalculado { get => totalCalculado; set => totalCalculado = value; }
        // ✅ No validar/serializar cuando es null
        [ValidateNever]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public DTO_Cliente? Cliente { get => cliente; set => cliente = value; }


        #endregion
    }
}

