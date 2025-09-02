using System;
using System.Text.Json.Serialization;

namespace DTO
{
    public class DTO_ItemOrdenServicio
    {
        #region Atributos

        private int id_ItemOrdenServicio;
        private int id_OrdenServicio;  // Corresponde al ID de OrdenServicio (FK)
        private DTO_Estado estado;         // Corresponde al ID de Estado (FK)
        private string nombreItemOrdenServicio;
        private string? descripcion;
        private decimal monto;
        private int? avance;  // Puede ser NULL, por lo que es de tipo nullable (int?)
        private decimal cantidad;  // Puede ser NULL, por lo que es de tipo nullable (int?)

        #endregion

        #region Constructor

        public DTO_ItemOrdenServicio()
        {
            // Inicializamos los valores por defecto
            ID_ItemOrdenServicio = 0;
            ID_OrdenServicio = 0;
            Estado = new();
            NombreItemOrdenServicio = string.Empty;
            Descripcion = null;
            Monto = 0m;  // Valor predeterminado para DECIMAL
            Avance = null;  // Nullable, lo dejamos como null
            Cantidad = 1;
        }

        #endregion

        #region Propiedades

    


        [JsonPropertyName("iD_ItemOrdenServicio")]
        public int? ID_ItemOrdenServicio { get; set; }

        [JsonPropertyName("iD_OrdenServicio")]
        public int? ID_OrdenServicio { get; set; }

        [JsonPropertyName("cantidad")]
        public decimal? Cantidad { get; set; } = 1;

        [JsonPropertyName("nombreItemOrdenServicio")]
        public string? NombreItemOrdenServicio { get; set; } = string.Empty;

        [JsonPropertyName("descripcion")]
        public string? Descripcion { get; set; }

        [JsonPropertyName("monto")]
        public decimal? Monto { get; set; }

        [JsonPropertyName("avance")]
        public int? Avance { get; set; }

        [JsonPropertyName("estado")]
        public DTO_Estado? Estado { get; set; } = new();

        #endregion
    }
}
