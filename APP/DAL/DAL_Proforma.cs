using DTO;
using Microsoft.Data.SqlClient;
using System.Data;
using UTL;

namespace DAL
{
    public class DAL_Proforma : DAL_Conexion
    {
        private DTO_Respuesta respuesta = new();

        public async Task<DTO_Respuesta> RegistrarProforma(DTO_Proforma proforma)
        {
            respuesta = new DTO_Respuesta();
            try
            {
                using var sqlcmd = new SqlCommand("CORE.SP_registrarProforma", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                sqlcmd.Parameters.Add("@ID_Negocio", SqlDbType.Int).Value = proforma.ID_Negocio;
                sqlcmd.Parameters.Add("@ID_Cliente", SqlDbType.Int).Value = proforma.ID_Cliente;
                sqlcmd.Parameters.Add("@ID_Estado", SqlDbType.Int).Value = proforma.Estado?.ID_Estado;
                sqlcmd.Parameters.Add("@ObservacionProforma", SqlDbType.NVarChar, 255).Value =
                    (object?)proforma.ObservacionProforma ?? DBNull.Value;
                sqlcmd.Parameters.Add("@DescuentoProforma", SqlDbType.Decimal).Value = proforma.DescuentoProforma;
                sqlcmd.Parameters.Add("@DescuentoPorcentualProforma", SqlDbType.Bit).Value = proforma.DescuentoPorcentualProforma;
                sqlcmd.Parameters.Add("@ImpuestoPorcentualProforma", SqlDbType.Decimal).Value = proforma.ImpuestoPorcentualProforma;
                sqlcmd.Parameters.Add("@FechaVencimiento", SqlDbType.DateTime).Value = (object?)proforma.FechaVencimiento ?? DBNull.Value;

                Open();
                using var reader = await sqlcmd.ExecuteReaderAsync();

                DTO_Proforma inserted = new();
                if (await reader.ReadAsync())
                {
                    inserted.ID_Proforma = UTL_DBHelper.ReadNullSafeInt(reader["ID_Proforma"]);
                    inserted.ID_Negocio = UTL_DBHelper.ReadNullSafeInt(reader["ID_Negocio"]);
                    inserted.ID_Cliente = UTL_DBHelper.ReadNullSafeInt(reader["ID_Cliente"]);
                    inserted.Estado = new DTO_Estado
                    {
                        ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                        Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                    };
                    inserted.FechaProforma = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaProforma"]);
                    inserted.FechaVencimiento = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaVencimiento"]);
                    inserted.ObservacionProforma = UTL_DBHelper.ReadNullSafeString(reader["ObservacionProforma"]);
                }

                if (reader.NextResult())
                {
                    while (await reader.ReadAsync())
                        respuesta = manejarRespuesta(reader); // B039
                }

                respuesta.Resultado.Add(inserted);
                return respuesta;
            }
            catch (Exception e) { Close(); throw e; }
            finally { Close(); }
        }

        public async Task<DTO_Respuesta> ActualizarProforma(DTO_Proforma proforma)
        {
            respuesta = new DTO_Respuesta();
            try
            {
                using var sqlcmd = new SqlCommand("CORE.SP_actualizarProforma", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                sqlcmd.Parameters.Add("@ID_Proforma", SqlDbType.Int).Value = proforma.ID_Proforma;
                sqlcmd.Parameters.Add("@ID_Cliente", SqlDbType.Int).Value = (object?)proforma.ID_Cliente ?? DBNull.Value;
                sqlcmd.Parameters.Add("@ID_Estado", SqlDbType.Int).Value = proforma.Estado.ID_Estado;
                sqlcmd.Parameters.Add("@ObservacionProforma", SqlDbType.NVarChar, 255).Value =
                    (object?)proforma.ObservacionProforma ?? DBNull.Value;
                sqlcmd.Parameters.Add("@FechaVencimiento", SqlDbType.DateTime).Value =
                    (object?)proforma.FechaVencimiento ?? DBNull.Value;
                sqlcmd.Parameters.Add("@DescuentoProforma", SqlDbType.Decimal).Value = proforma.DescuentoProforma;
                sqlcmd.Parameters.Add("@DescuentoPorcentualProforma", SqlDbType.Bit).Value = proforma.DescuentoPorcentualProforma;
                sqlcmd.Parameters.Add("@ImpuestoPorcentualProforma", SqlDbType.Decimal).Value = proforma.ImpuestoPorcentualProforma;


                Open();
                using var reader = await sqlcmd.ExecuteReaderAsync();

                DTO_Proforma updated = new();
                if (await reader.ReadAsync())
                {
                    updated.ID_Proforma = UTL_DBHelper.ReadNullSafeInt(reader["ID_Proforma"]);
                    updated.ID_Negocio = UTL_DBHelper.ReadNullSafeInt(reader["ID_Negocio"]);
                    updated.ID_Cliente = UTL_DBHelper.ReadNullSafeInt(reader["ID_Cliente"]);
                    updated.Estado = new DTO_Estado
                    {
                        ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                        Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                    };
                    updated.FechaProforma = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaProforma"]);
                    updated.FechaVencimiento = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaVencimiento"]);
                    updated.ObservacionProforma = UTL_DBHelper.ReadNullSafeString(reader["ObservacionProforma"]);
                    updated.FechaModificacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"]);
                    updated.DescuentoProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["DescuentoProforma"]);
                    updated.DescuentoProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["DescuentoProforma"]);
                    updated.DescuentoPorcentualProforma = UTL_DBHelper.ReadNullSafeBoolean(reader["DescuentoPorcentualProforma"]);
                    updated.ImpuestoPorcentualProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["ImpuestoPorcentualProforma"]);

                }

                if (reader.NextResult())
                {
                    while (await reader.ReadAsync())
                        respuesta = manejarRespuesta(reader); // B045
                }

                respuesta.Resultado.Add(updated);
                return respuesta;
            }
            catch (Exception e) { Close(); throw e; }
            finally { Close(); }
        }

        public async Task<DTO_Respuesta> ObtenerProformas(DTO_Proforma proforma)
        {
            respuesta = new DTO_Respuesta();
            var lista = new List<DTO_Proforma>();
            try
            {
                using var cmd = new SqlCommand("CORE.SP_ObtenerProformas", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                cmd.Parameters.Add("@ID_Negocio", SqlDbType.Int).Value = proforma.ID_Negocio;
                // Opcionales
                cmd.Parameters.Add("@ID_Cliente", SqlDbType.Int).Value = proforma.ID_Cliente > 0 ? proforma.ID_Cliente : (object)DBNull.Value;
                cmd.Parameters.Add("@ID_Estado", SqlDbType.Int).Value = (object?)(proforma.Estado?.ID_Estado > 0 ? proforma.Estado.ID_Estado : null) ?? DBNull.Value;


                Open();
                using var reader = await cmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    var p = new DTO_Proforma
                    {
                        ID_Proforma = UTL_DBHelper.ReadNullSafeInt(reader["ID_Proforma"]),
                        ID_Negocio = UTL_DBHelper.ReadNullSafeInt(reader["ID_Negocio"]),
                        ID_Cliente = UTL_DBHelper.ReadNullSafeInt(reader["ID_Cliente"]),
                        Estado = new DTO_Estado
                        {
                            ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                            Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                        },
                        FechaProforma = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaProforma"]),
                        FechaVencimiento = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaVencimiento"]),
                        ObservacionProforma = UTL_DBHelper.ReadNullSafeString(reader["ObservacionProforma"]),
                        FechaModificacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"]),
                        DescuentoProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["DescuentoProforma"]),
                        DescuentoPorcentualProforma = UTL_DBHelper.ReadNullSafeBoolean(reader["DescuentoPorcentualProforma"]),
                        ImpuestoPorcentualProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["ImpuestoPorcentualProforma"]),
                        SubTotal = UTL_DBHelper.ReadNullSafeDecimal(reader["SubTotal"]),
                        MontoDescuento = UTL_DBHelper.ReadNullSafeDecimal(reader["MontoDescuento"]),
                        BaseImponible = UTL_DBHelper.ReadNullSafeDecimal(reader["BaseImponible"]),
                        MontoImpuesto = UTL_DBHelper.ReadNullSafeDecimal(reader["MontoImpuesto"]),
                        TotalCalculado = UTL_DBHelper.ReadNullSafeDecimal(reader["TotalCalculado"]),
                        Cliente = new DTO_Cliente
                        {
                            NombreCliente = UTL_DBHelper.ReadNullSafeString(reader["NombreCliente"]),
                            ApellidoCliente = UTL_DBHelper.ReadNullSafeString(reader["ApellidoCliente"]),
                        },
                    };
                    lista.Add(p);
                }

                if (reader.NextResult())
                {
                    while (await reader.ReadAsync())
                        respuesta = manejarRespuesta(reader); // B047
                }

                respuesta.Resultado.Add(lista);
                return respuesta;
            }
            catch (Exception e) { Close(); throw e; }
            finally { Close(); }
        }

        public async Task<DTO_Respuesta> BuscarProformas(DTO_SolicitudDeBusqueda busqueda)
        {
            var respuesta = new DTO_Respuesta();
            var lista = new List<DTO_Proforma>();

            try
            {
                using var sqlcmd = new SqlCommand("CORE.SP_buscarProformas", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                sqlcmd.Parameters.Add("@ID_Negocio", SqlDbType.Int).Value = busqueda.Negocio?.ID_Negocio;
                sqlcmd.Parameters.Add("@Term", SqlDbType.NVarChar, 100).Value =
                    string.IsNullOrWhiteSpace(busqueda.Term) ? (object)DBNull.Value : busqueda.Term.Trim();

                Open();
                using var reader = await sqlcmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    var p = new DTO_Proforma
                    {
                        ID_Proforma = UTL_DBHelper.ReadNullSafeInt(reader["ID_Proforma"]),
                        ID_Negocio = UTL_DBHelper.ReadNullSafeInt(reader["ID_Negocio"]),
                        ID_Cliente = UTL_DBHelper.ReadNullSafeInt(reader["ID_Cliente"]),
                        Estado = new DTO_Estado
                        {
                            ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                            Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                        },
                        FechaProforma = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaProforma"]),
                        FechaVencimiento = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaVencimiento"]),
                        ObservacionProforma = UTL_DBHelper.ReadNullSafeString(reader["ObservacionProforma"]),
                        FechaModificacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"]),
                        DescuentoProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["DescuentoProforma"]),
                        DescuentoPorcentualProforma = UTL_DBHelper.ReadNullSafeBoolean(reader["DescuentoPorcentualProforma"]),
                        ImpuestoPorcentualProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["ImpuestoPorcentualProforma"]),
                        SubTotal = UTL_DBHelper.ReadNullSafeDecimal(reader["SubTotal"]),
                        MontoDescuento = UTL_DBHelper.ReadNullSafeDecimal(reader["MontoDescuento"]),
                        BaseImponible = UTL_DBHelper.ReadNullSafeDecimal(reader["BaseImponible"]),
                        MontoImpuesto = UTL_DBHelper.ReadNullSafeDecimal(reader["MontoImpuesto"]),
                        TotalCalculado = UTL_DBHelper.ReadNullSafeDecimal(reader["TotalCalculado"]),
                        Cliente = new DTO_Cliente
                        {
                            NombreCliente = UTL_DBHelper.ReadNullSafeString(reader["NombreCliente"]),
                            ApellidoCliente = UTL_DBHelper.ReadNullSafeString(reader["ApellidoCliente"]),
                        },
                    };
                    lista.Add(p);
                }

                if (await reader.NextResultAsync())
                {
                    while (await reader.ReadAsync())
                        respuesta = manejarRespuesta(reader); // B048
                }

                respuesta.Resultado = lista.Cast<object>().ToList();
                return respuesta;
            }
            finally { Close(); }
        }

    }
}
