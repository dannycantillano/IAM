
using DTO;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Globalization;
using UTL;

namespace DAL
{
    public class DAL_Tarifa : DAL_Conexion
    {
        private DTO_Respuesta respuesta = new();

        public async Task<List<DTO_Tarifa>> BuscarTarifasAsync(DTO_SolicitudDeBusqueda busqueda)
        {
            var lista = new List<DTO_Tarifa>();
            try
            {
                using var sqlcmd = new SqlCommand("CORE.SP_BuscarTarifas", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                // ID negocio (obligatorio)
                sqlcmd.Parameters.Add("@ID_Negocio", SqlDbType.Int).Value = busqueda.Negocio?.ID_Negocio;

                // Strings: manda NULL cuando no hay valor
                sqlcmd.Parameters.Add("@Term", SqlDbType.NVarChar, 100).Value =
                    string.IsNullOrWhiteSpace(busqueda.Term) ? (object)DBNull.Value : busqueda.Term;

                Open();
                using var reader = await sqlcmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var tarifario = new DTO_Tarifa
                    {
                        ID_Tarifa = UTL_DBHelper.ReadNullSafeInt(reader["ID_Tarifa"]),
                        ID_Negocio = UTL_DBHelper.ReadNullSafeInt(reader["ID_Negocio"]),
                        Estado = new DTO_Estado
                        {
                            ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                            Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                        },
                        NombreTarifa = UTL_DBHelper.ReadNullSafeString(reader["NombreTarifa"]),
                        DescripcionTarifa = UTL_DBHelper.ReadNullSafeString(reader["DescripcionTarifa"]),
                        PrecioTarifa = UTL_DBHelper.ReadNullSafeDecimal(reader["PrecioTarifa"])
                    };
                    lista.Add(tarifario);
                }
            }
            finally { Close(); }
            return lista;
        }

        public async Task<DTO_Respuesta> ObtenerTarifas(DTO_Negocio negocio)
        {
            respuesta = new DTO_Respuesta();
            var lista = new List<DTO_Tarifa>();
            try
            {
                using var sqlcmd = new SqlCommand("CORE.SP_ObtenerTarifas", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                sqlcmd.Parameters.Add("@ID_Negocio", SqlDbType.Int).Value = negocio.ID_Negocio;

                // Si mas adelante se decide filtar por activas hay que pasar un valor peticion.SoloActivas en 1
                //la DB automaitcamente lo filtra por el estado activo SoloActivas = 0, devuelve Activas + Inactivas
                //sqlcmd.Parameters.Add("@SoloActivas", SqlDbType.Bit).Value = peticion.SoloActivas;

                Open();
                using var reader = await sqlcmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    var tarifario = new DTO_Tarifa
                    {
                        ID_Tarifa = UTL_DBHelper.ReadNullSafeInt(reader["ID_Tarifa"]),
                        ID_Negocio = UTL_DBHelper.ReadNullSafeInt(reader["ID_Negocio"]),
                        Estado = new DTO_Estado
                        {
                            ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                            Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                        },
                        NombreTarifa = UTL_DBHelper.ReadNullSafeString(reader["NombreTarifa"]),
                        DescripcionTarifa = UTL_DBHelper.ReadNullSafeString(reader["DescripcionTarifa"]),
                        PrecioTarifa = UTL_DBHelper.ReadNullSafeDecimal(reader["PrecioTarifa"]),
                        FechaCreacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaCreacion"]),
                        FechaModificacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"])
                    };
                    lista.Add(tarifario);
                }

                if (reader.NextResult())
                {
                    while (await reader.ReadAsync())
                        respuesta = manejarRespuesta(reader); // B046
                }

                respuesta.Resultado.Add(lista);
                return respuesta;
            }
            catch (Exception e) { Close(); throw e; }
            finally { Close(); }
        }

        public async Task<DTO_Respuesta> RegistrarTarifa(DTO_Tarifa tarifa)
        {
            respuesta = new DTO_Respuesta();
            try
            {
                using var sqlcmd = new SqlCommand("CORE.SP_registrarTarifa", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                sqlcmd.Parameters.Add("@ID_Negocio", SqlDbType.Int).Value = tarifa.ID_Negocio;
                sqlcmd.Parameters.Add("@NombreTarifa", SqlDbType.VarChar, 100).Value = tarifa.NombreTarifa;
                sqlcmd.Parameters.Add("@DescripcionTarifa", SqlDbType.NVarChar, 255).Value =
                    (object?)tarifa.DescripcionTarifa ?? DBNull.Value;

                sqlcmd.Parameters.Add("@PrecioTarifa", SqlDbType.Decimal).Value = tarifa.PrecioTarifa.HasValue ? tarifa.PrecioTarifa : 0m;

                Open();
                using var reader = await sqlcmd.ExecuteReaderAsync();

                DTO_Tarifa inserted = new();
                if (await reader.ReadAsync())
                {
                    inserted.ID_Tarifa = UTL_DBHelper.ReadNullSafeInt(reader["ID_Tarifa"]);
                    inserted.ID_Negocio = UTL_DBHelper.ReadNullSafeInt(reader["ID_Negocio"]);
                    inserted.Estado = new DTO_Estado
                    {
                        ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                        Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                    };
                    inserted.NombreTarifa = UTL_DBHelper.ReadNullSafeString(reader["NombreTarifa"]);
                    inserted.DescripcionTarifa = UTL_DBHelper.ReadNullSafeString(reader["DescripcionTarifa"]);
                    inserted.PrecioTarifa = UTL_DBHelper.ReadNullSafeDecimal(reader["PrecioTarifa"]);
                    inserted.FechaCreacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaCreacion"]);
                    inserted.FechaModificacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"]);
                }

                if (reader.NextResult())
                {
                    while (await reader.ReadAsync())
                        respuesta = manejarRespuesta(reader); // B036
                }

                respuesta.Resultado.Add(inserted);
                return respuesta;
            }
            catch (Exception e) { Close(); throw e; }
            finally { Close(); }
        }

        public async Task<DTO_Respuesta> ActualizarTarifa(DTO_Tarifa tarifa)
        {
            var respuesta = new DTO_Respuesta();

            try
            {
                using var sqlcmd = new SqlCommand("CORE.SP_actualizarTarifa", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                // Obligatorio
                sqlcmd.Parameters.Add("@ID_Tarifa", SqlDbType.Int).Value = tarifa.ID_Tarifa;

                // @ID_Estado es OPCIONAL en el SP => si no deseas cambiarlo, manda NULL
                var idEstado = tarifa.Estado?.ID_Estado ?? 0;
                sqlcmd.Parameters.Add("@ID_Estado", SqlDbType.Int).Value =
                    idEstado > 0 ? idEstado : (object)DBNull.Value;

                sqlcmd.Parameters.Add("@NombreTarifa", SqlDbType.NVarChar, 100).Value =
                    string.IsNullOrWhiteSpace(tarifa.NombreTarifa) ? (object)DBNull.Value : tarifa.NombreTarifa.Trim();


                sqlcmd.Parameters.Add("@DescripcionTarifa", SqlDbType.NVarChar, 255).Value =
                    string.IsNullOrWhiteSpace(tarifa.DescripcionTarifa) ? (object)DBNull.Value : tarifa.DescripcionTarifa.Trim();

                if (tarifa.PrecioTarifa.HasValue)
                {
                    var pPrecio = new SqlParameter("@PrecioTarifa", SqlDbType.Decimal)
                    {
                        Precision = 16,
                        Scale = 3,
                        Value = tarifa.PrecioTarifa.Value
                    };
                    sqlcmd.Parameters.Add(pPrecio);
                }

                Open();
                using var reader = await sqlcmd.ExecuteReaderAsync();

                // Result set #1: fila actualizada
                DTO_Tarifa updated = new();
                if (await reader.ReadAsync())
                {
                    updated.ID_Tarifa = UTL_DBHelper.ReadNullSafeInt(reader["ID_Tarifa"]);
                    updated.ID_Negocio = UTL_DBHelper.ReadNullSafeInt(reader["ID_Negocio"]);
                    updated.Estado = new DTO_Estado
                    {
                        ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                        Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                    };
                    updated.NombreTarifa = UTL_DBHelper.ReadNullSafeString(reader["NombreTarifa"]);
                    updated.DescripcionTarifa = UTL_DBHelper.ReadNullSafeString(reader["DescripcionTarifa"]);
                    updated.PrecioTarifa = UTL_DBHelper.ReadNullSafeDecimal(reader["PrecioTarifa"]);
                    updated.FechaCreacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaCreacion"]);
                    updated.FechaModificacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"]);
                }

                // Result set #2: alerta (B037) según tu patrón
                if (await reader.NextResultAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        respuesta = manejarRespuesta(reader); // setea TipoRespuesta, Mensaje, Codigo, etc.
                    }
                }

                // Añadir resultado
                if (respuesta.Resultado == null)
                    respuesta.Resultado = new List<object>();
                respuesta.Resultado.Add(updated);

                return respuesta;
            }
            catch
            {
                Close();
                throw;
            }
            finally
            {
                Close();
            }
        }

    }
}
