using DTO;
using Microsoft.Data.SqlClient;
using System.Data;
using UTL;

namespace DAL
{
    public class DAL_ItemsProforma : DAL_Conexion
    {
        DTO_Respuesta respuesta = new();
        public async Task<DTO_Respuesta> RegistrarItemsProforma(DTO_ProformaItem item)
        {
            respuesta = new DTO_Respuesta();
            try
            {
                using var sqlsqlcmd = new SqlCommand("CORE.SP_registrarItemsProforma", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                sqlsqlcmd.Parameters.Add("@ID_Proforma", SqlDbType.Int).Value = item.ID_Proforma;
                sqlsqlcmd.Parameters.Add("@NombreItemProforma", SqlDbType.VarChar, 100).Value = item.NombreItemProforma;
                sqlsqlcmd.Parameters.Add("@DescripcionItemProforma", SqlDbType.NVarChar, 255).Value =
                    (object?)item.DescripcionItemProforma ?? DBNull.Value;
                sqlsqlcmd.Parameters.Add("@PrecioItemProforma", SqlDbType.Decimal).Value = item.PrecioItemProforma;
                sqlsqlcmd.Parameters.Add("@CantidadItemProforma", SqlDbType.Decimal).Value = item.CantidadItemProforma;

                Open();
                using var reader = await sqlsqlcmd.ExecuteReaderAsync();

                DTO_ProformaItem inserted = new();
                if (await reader.ReadAsync())
                {
                    inserted.ID_ProformaItem = UTL_DBHelper.ReadNullSafeInt(reader["ID_ProformaItem"]);
                    inserted.ID_Proforma = UTL_DBHelper.ReadNullSafeInt(reader["ID_Proforma"]);
                    inserted.Estado = new DTO_Estado
                    {
                        ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                        Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                    };
                    inserted.NombreItemProforma = UTL_DBHelper.ReadNullSafeString(reader["NombreItemProforma"]);
                    inserted.DescripcionItemProforma = UTL_DBHelper.ReadNullSafeString(reader["DescripcionItemProforma"]);
                    inserted.PrecioItemProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["PrecioItemProforma"]);
                    inserted.CantidadItemProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["CantidadItemProforma"]);
                    inserted.FechaCreacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaCreacion"]);
                    inserted.FechaModificacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"]);
                }

                if (reader.NextResult())
                {
                    while (await reader.ReadAsync())
                        respuesta = manejarRespuesta(reader); // B040
                }

                respuesta.Resultado.Add(inserted);
                return respuesta;
            }
            catch (Exception e) { Close(); throw e; }
            finally { Close(); }
        }

        public async Task<DTO_Respuesta> ActualizarItemsProforma(DTO_ProformaItem item)
        {
            respuesta = new DTO_Respuesta();
            try
            {
                using var sqlcmd = new SqlCommand("CORE.SP_actualizarItemsProforma", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                sqlcmd.Parameters.Add("@ID_ProformaItem", SqlDbType.Int).Value = item.ID_ProformaItem;
                sqlcmd.Parameters.Add("@ID_Estado", SqlDbType.Int).Value = item.Estado.ID_Estado;
                sqlcmd.Parameters.Add("@NombreItemProforma", SqlDbType.VarChar, 100).Value = item.NombreItemProforma;
                sqlcmd.Parameters.Add("@DescripcionItemProforma", SqlDbType.NVarChar, 255).Value =
                    (object?)item.DescripcionItemProforma ?? DBNull.Value;
                sqlcmd.Parameters.Add("@PrecioItemProforma", SqlDbType.Decimal).Value = item?.PrecioItemProforma;
                sqlcmd.Parameters.Add("@CantidadItemProforma", SqlDbType.Decimal).Value = item?.CantidadItemProforma;

                Open();
                using var reader = await sqlcmd.ExecuteReaderAsync();

                DTO_ProformaItem updated = new();
                if (await reader.ReadAsync())
                {
                    updated.ID_ProformaItem = UTL_DBHelper.ReadNullSafeInt(reader["ID_ProformaItem"]);
                    updated.ID_Proforma = UTL_DBHelper.ReadNullSafeInt(reader["ID_Proforma"]);
                    updated.Estado = new DTO_Estado
                    {
                        ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                        Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                    };
                    updated.NombreItemProforma = UTL_DBHelper.ReadNullSafeString(reader["NombreItemProforma"]);
                    updated.DescripcionItemProforma = UTL_DBHelper.ReadNullSafeString(reader["DescripcionItemProforma"]);
                    updated.PrecioItemProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["PrecioItemProforma"]);
                    updated.CantidadItemProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["CantidadItemProforma"]);
                    updated.FechaCreacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaCreacion"]);
                    updated.FechaModificacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"]);
                }

                if (reader.NextResult())
                {
                    while (await reader.ReadAsync())
                        respuesta = manejarRespuesta(reader); // B043
                }

                respuesta.Resultado.Add(updated);
                return respuesta;
            }
            catch (Exception e) { Close(); throw e; }
            finally { Close(); }
        }

        public async Task<DTO_Respuesta> ObtenerItemsProforma(DTO_Proforma proforma)
        {
            respuesta = new DTO_Respuesta();
            var lista = new List<DTO_ProformaItem>();
            try
            {
                using var sqlcmd = new SqlCommand("CORE.SP_ObtenerItemsProforma", GetObjConexion())
                { CommandType = CommandType.StoredProcedure };

                sqlcmd.Parameters.Add("@ID_Proforma", SqlDbType.Int).Value = proforma.ID_Proforma;

                Open();
                using var reader = await sqlcmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    var items = new DTO_ProformaItem
                    {
                        ID_ProformaItem = UTL_DBHelper.ReadNullSafeInt(reader["ID_ProformaItem"]),
                        ID_Proforma = UTL_DBHelper.ReadNullSafeInt(reader["ID_Proforma"]),
                        Estado = new DTO_Estado
                        {
                            ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                            Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                        },
                        NombreItemProforma = UTL_DBHelper.ReadNullSafeString(reader["NombreItemProforma"]),
                        DescripcionItemProforma = UTL_DBHelper.ReadNullSafeString(reader["DescripcionItemProforma"]),
                        PrecioItemProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["PrecioItemProforma"]),
                        CantidadItemProforma = UTL_DBHelper.ReadNullSafeDecimal(reader["CantidadItemProforma"]),
                        FechaCreacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaCreacion"]),
                        FechaModificacion = UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"])
                    };
                    lista.Add(items);
                }

                if (reader.NextResult())
                {
                    while (await reader.ReadAsync())
                        respuesta = manejarRespuesta(reader); // B048
                }

                respuesta.Resultado.Add(lista);
                return respuesta;
            }
            catch (Exception e) { Close(); throw e; }
            finally { Close(); }
        }
    }
}
