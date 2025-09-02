using DAL;
using DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL
{
    public class BLL_ItemsProforma
    {

        private readonly DAL_ItemsProforma dal = new();

        public async Task<DTO_Respuesta> RegistrarItemsProforma(DTO_ProformaItem item)
            => await dal.RegistrarItemsProforma(item);

        public async Task<DTO_Respuesta> ActualizarItemsProforma(DTO_ProformaItem item)
            => await dal.ActualizarItemsProforma(item);

        public async Task<DTO_Respuesta> ObtenerItemsProforma(DTO_Proforma proforma)
            => await dal.ObtenerItemsProforma(proforma);
    }
}
