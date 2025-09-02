namespace DTO
{
    public class DTO_Cuenta
    {
        #region Atributos

        private int iD_Cuenta;
        private int iD_Negocio;
        private DTO_Estado estado;
        private string concepto;
        private string descripcion;
        private decimal monto;
        private DateTime fechaInicial;
        private DateTime fechaModificacion;
        private DateTime fechaLimite;
        private string tipoCuenta;
        private int? iD_OrdenServicio;
        public DTO_DetalleCuentaJSON detalleJSON;


        //Campos Calculados
        private decimal montoAbonado;
        private decimal saldoPendiente;
        private string estadoPago;


        #endregion

        #region Constructor

        public DTO_Cuenta()
        {
            ID_Cuenta = 0;
            ID_Negocio = 0;
            Estado = new DTO_Estado();
            Concepto = string.Empty;
            Descripcion = string.Empty;
            Monto = 0.0m;
            FechaInicial = DateTime.Now;
            FechaModificacion = DateTime.Now;
            FechaLimite = DateTime.Now;
            TipoCuenta = string.Empty;
            ID_OrdenServicio = null;
            DetalleJSON = new();

            //Campos Calculados
            MontoAbonado = 0;
            SaldoPendiente = 0;
            EstadoPago = string.Empty;
        }

        #endregion

        #region Propiedades

        public int ID_Cuenta
        {
            get => iD_Cuenta;
            set => iD_Cuenta = value;
        }

        public int ID_Negocio
        {
            get => iD_Negocio;
            set => iD_Negocio = value;
        }

        public DTO_Estado Estado
        {
            get => estado;
            set => estado = value;
        }

        public string Concepto
        {
            get => concepto;
            set => concepto = value;
        }

        public string Descripcion
        {
            get => descripcion;
            set => descripcion = value;
        }

        public decimal Monto
        {
            get => monto;
            set
            {
                if (value < 0)
                    throw new ArgumentOutOfRangeException(nameof(Monto), "El monto no puede ser negativo.");
                monto = value;
            }
        }

        public DateTime FechaInicial
        {
            get => fechaInicial;
            set => fechaInicial = value;
        }

        public DateTime FechaModificacion
        {
            get => fechaModificacion;
            set => fechaModificacion = value;
        }

        public DateTime FechaLimite
        {
            get => fechaLimite;
            set => fechaLimite = value;
        }

        public string TipoCuenta
        {
            get => tipoCuenta;
            set => tipoCuenta = value;
        }

        public int? ID_OrdenServicio
        {
            get => iD_OrdenServicio;
            set => iD_OrdenServicio = value;
        }

        public DTO_DetalleCuentaJSON DetalleJSON
        {
            get => detalleJSON;
            set => detalleJSON = value ?? throw new ArgumentNullException(nameof(DetalleJSON));
        }

        //Campos calculados
        public decimal MontoAbonado { get => montoAbonado; set => montoAbonado = value; }
        public decimal SaldoPendiente { get => saldoPendiente; set => saldoPendiente = value; }
        public string EstadoPago { get => estadoPago; set => estadoPago = value; }

        #endregion
    }
}
