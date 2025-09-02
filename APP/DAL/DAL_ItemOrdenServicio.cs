using DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UTL;

namespace DAL
{
    public  class DAL_ItemOrdenServicio : DAL_Conexion
    {
        DTO_Respuesta respuesta = new();
        public async Task<DTO_Respuesta> guardarItemOrdenServicio(DTO_ItemOrdenServicio itemOrdenServicio)
        {
            try
            {
                string query = "CORE.SP_guardarItemOrdenDeServicio";

                using (SqlCommand sqlcmd = new(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = System.Data.CommandType.StoredProcedure;
                    sqlcmd.Parameters.AddWithValue("@ID_OrdenServicio", itemOrdenServicio.ID_OrdenServicio);
                    sqlcmd.Parameters.AddWithValue("@NombreItemOrdenServicio", itemOrdenServicio.NombreItemOrdenServicio);
                    sqlcmd.Parameters.AddWithValue("@Descripcion", itemOrdenServicio.Descripcion);
                    sqlcmd.Parameters.AddWithValue("@Monto", itemOrdenServicio.Monto);
                    sqlcmd.Parameters.AddWithValue("@Avance", itemOrdenServicio.Avance);
                    sqlcmd.Parameters.AddWithValue("@Cantidad", itemOrdenServicio.Cantidad);



                    foreach (SqlParameter param in sqlcmd.Parameters)
                    {
                        param.Direction = ParameterDirection.Input;
                    }

                    this.Open();

                    using (SqlDataReader reader = await sqlcmd.ExecuteReaderAsync())
                    {
                        while (reader.Read())
                        {
                            itemOrdenServicio.ID_ItemOrdenServicio = UTL_DBHelper.ReadNullSafeInt(reader["ID_ItemOrdenServicio"]);
                            itemOrdenServicio.Estado.ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]);
                        }

                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                respuesta = manejarRespuesta(reader);
                            }
                        }
                    }

                    respuesta.Resultado.Add(itemOrdenServicio);
                    return respuesta;
                }
            }
            catch (Exception e)
            {
                this.Close();
                throw e;
            }
            finally
            {
                this.Close();
            }
        }
        public async Task<DTO_Respuesta> guardarItemsDesdeProforma([FromBody] List<DTO_ItemOrdenServicio> items)
        {
            try
            {
                string query = "CORE.SP_guardarItemsDesdeProforma";

                //Se crea la tabla para que coincida con el type de la base de datos
                var dt = new DataTable();
                dt.Columns.Add("NombreItemOrdenServicio", typeof(string));
                dt.Columns.Add("Descripcion", typeof(string));
                dt.Columns.Add("Monto", typeof(decimal));
                dt.Columns.Add("Cantidad", typeof(decimal));
                dt.Columns.Add("Avance", typeof(int));


                // cargamos la tabla con los valores
                foreach (var it in items)
                {
                    // Mapeos desde tu DTO:
         
                    string nombre = it.NombreItemOrdenServicio ?? string.Empty;
                    string desc = it.Descripcion ?? string.Empty;
                    decimal monto = it.Monto?? 0;
                    decimal cantidad = it.Cantidad ?? 1;
                    int? avance = null; // si en tu UI hay avance, mapéalo

                    dt.Rows.Add(nombre, desc, monto, cantidad, (object?)avance ?? DBNull.Value);
                }




                using (SqlCommand sqlcmd = new(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = System.Data.CommandType.StoredProcedure;
                    sqlcmd.Parameters.AddWithValue("@Items", dt);
                    sqlcmd.Parameters.AddWithValue("@ID_OrdenServicio", items[0].ID_OrdenServicio);
               



                    foreach (SqlParameter param in sqlcmd.Parameters)
                    {
                        param.Direction = ParameterDirection.Input;
                    }

                    this.Open();

                    using (SqlDataReader reader = await sqlcmd.ExecuteReaderAsync())
                    {

           
                            while (reader.Read())
                            {
                                respuesta = manejarRespuesta(reader);
                            }
                        
                    }

                    return respuesta;
                }
            }
            catch (Exception e)
            {
                this.Close();
                throw e;
            }
            finally
            {
                this.Close();
            }
        }

        public async Task<DTO_Respuesta> actualizarItemOrdenServicio(DTO_ItemOrdenServicio itemOrdenServicio)
        {
            try
            {
                string query = "CORE.SP_actualizarItemOrdenDeServicio";

                using (SqlCommand sqlcmd = new(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = System.Data.CommandType.StoredProcedure;
                    sqlcmd.Parameters.AddWithValue("@ID_ItemOrdenServicio", itemOrdenServicio.ID_ItemOrdenServicio);
                    sqlcmd.Parameters.AddWithValue("@ID_Estado", itemOrdenServicio.Estado.ID_Estado);
                    sqlcmd.Parameters.AddWithValue("@NombreItemOrdenServicio", itemOrdenServicio.NombreItemOrdenServicio);
                    sqlcmd.Parameters.AddWithValue("@Descripcion", itemOrdenServicio.Descripcion);
                    sqlcmd.Parameters.AddWithValue("@Monto", itemOrdenServicio.Monto);
                    sqlcmd.Parameters.AddWithValue("@Avance", itemOrdenServicio.Avance);
                    sqlcmd.Parameters.AddWithValue("@Cantidad", itemOrdenServicio.Cantidad);



                    foreach (SqlParameter param in sqlcmd.Parameters)
                    {
                        param.Direction = ParameterDirection.Input;
                    }

                    this.Open();

                    using (SqlDataReader reader = await sqlcmd.ExecuteReaderAsync())
                    {
                        while (reader.Read())
                        {
                            respuesta = manejarRespuesta(reader);
                        }
                    }

                    return respuesta;
                }
            }
            catch (Exception e)
            {
                this.Close();
                throw e;
            }
            finally
            {
                this.Close();
            }
        }

        public async Task<DTO_Respuesta> obtenerItemOrdenServicio(DTO_ItemOrdenServicio itemOrdenServicio)
        {
            try
            {
                string query = "CORE.SP_obtenerItemOrdenDeServicio";
                List<DTO_ItemOrdenServicio> lista = new();

                using (SqlCommand sqlcmd = new(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = System.Data.CommandType.StoredProcedure;
                    sqlcmd.Parameters.AddWithValue("@ID_OrdenServicio", itemOrdenServicio.ID_OrdenServicio);



                    foreach (SqlParameter param in sqlcmd.Parameters)
                    {
                        param.Direction = ParameterDirection.Input;
                    }

                    this.Open();

                    using (var reader = await sqlcmd.ExecuteReaderAsync())
                    {
                        // ——— Primer result set: órdenes de servicio ———
                        while (reader.Read())
                        {
                            itemOrdenServicio = new DTO_ItemOrdenServicio
                            {
                                ID_ItemOrdenServicio = UTL_DBHelper.ReadNullSafeInt(reader["ID_ItemOrdenServicio"]),
                                ID_OrdenServicio = UTL_DBHelper.ReadNullSafeInt(reader["ID_OrdenServicio"]),
                                NombreItemOrdenServicio = UTL_DBHelper.ReadNullSafeString(reader["NombreItemOrdenServicio"]),
                                Estado = new DTO_Estado
                                {
                                    ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                                    Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"])
                                },
                                Descripcion = UTL_DBHelper.ReadNullSafeString(reader["Descripcion"]),
                                Monto = UTL_DBHelper.ReadNullSafeDecimal(reader["Monto"]),
                                Avance = UTL_DBHelper.ReadNullSafeInt(reader["Avance"]),
                                Cantidad = UTL_DBHelper.ReadNullSafeInt(reader["Cantidad"])
                            };

                            lista.Add(itemOrdenServicio);
                        }

                        // ——— Segundo result set: alertas ———
                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                // manejarRespuesta debería rellenar tipoRespuesta, mensaje y código
                                respuesta = manejarRespuesta(reader);
                            }
                        }
                    }

                    respuesta.Resultado.Add(lista);
                    return respuesta;
                }
            }
            catch (Exception e)
            {
                this.Close();
                throw e;
            }
            finally
            {
                this.Close();
            }
        }
    }
}
