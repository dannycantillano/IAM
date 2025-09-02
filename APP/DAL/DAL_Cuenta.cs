using DTO;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using UTL;

namespace DAL
{
    public class DAL_Cuenta : DAL_Conexion
    {

        DTO_Respuesta respuesta = new();
        public DTO_Respuesta registrarCuenta(DTO_Cuenta cuenta)
        {
            DTO_Respuesta respuesta = new();
            string query = "CORE.SP_registrarCuenta";

            try
            {
                string jsonDetalle = System.Text.Json.JsonSerializer.Serialize(cuenta.DetalleJSON);

                using (SqlCommand sqlcmd = new(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = CommandType.StoredProcedure;

                    sqlcmd.Parameters.AddWithValue("@ID_Negocio", cuenta.ID_Negocio);
                    sqlcmd.Parameters.AddWithValue("@Concepto", cuenta.Concepto ?? string.Empty);
                    sqlcmd.Parameters.AddWithValue("@Descripcion", cuenta.Descripcion ?? string.Empty);
                    sqlcmd.Parameters.AddWithValue("@Monto", cuenta.Monto);
                    sqlcmd.Parameters.AddWithValue("@TipoCuenta", cuenta.TipoCuenta ?? "Por Pagar");
                    sqlcmd.Parameters.AddWithValue("@FechaLimite", cuenta.FechaLimite);
                    sqlcmd.Parameters.AddWithValue("@ID_OrdenServicio", cuenta.ID_OrdenServicio ?? (object)DBNull.Value);
                    sqlcmd.Parameters.AddWithValue("@DetalleJSON", jsonDetalle ?? (object)DBNull.Value);

                    this.Open();

                    using (SqlDataReader reader = sqlcmd.ExecuteReader())
                    {
                        DTO_Cuenta cuentaRegistrada = new();

                        if (reader.Read())
                        {
                            cuentaRegistrada.ID_Cuenta = UTL_DBHelper.ReadNullSafeInt(reader["ID_Cuenta"]);
                            cuentaRegistrada.ID_Negocio = UTL_DBHelper.ReadNullSafeInt(reader["ID_Negocio"]);
                            cuentaRegistrada.Estado = new DTO_Estado
                            {
                                ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]),
                                Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"]),
                                Tabla = UTL_DBHelper.ReadNullSafeString(reader["EstadoTabla"])
                            };
                            cuentaRegistrada.Concepto = UTL_DBHelper.ReadNullSafeString(reader["Concepto"]);
                            cuentaRegistrada.Descripcion = UTL_DBHelper.ReadNullSafeString(reader["Descripcion"]);
                            cuentaRegistrada.Monto = UTL_DBHelper.ReadNullSafeDecimal(reader["Monto"]);
                            cuentaRegistrada.FechaInicial = (DateTime)UTL_DBHelper.ReadNullSafeDateTime(reader["FechaInicial"]);
                            cuentaRegistrada.FechaModificacion = (DateTime)UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"]);
                            cuentaRegistrada.FechaLimite = (DateTime)UTL_DBHelper.ReadNullSafeDateTime(reader["FechaLimite"]);
                            cuentaRegistrada.TipoCuenta = UTL_DBHelper.ReadNullSafeString(reader["TipoCuenta"]);
                            cuentaRegistrada.ID_OrdenServicio = UTL_DBHelper.ReadNullSafeInt(reader["ID_OrdenServicio"]);

                            string json = UTL_DBHelper.ReadNullSafeString(reader["DetalleJSON"]);
                            if (!string.IsNullOrEmpty(json))
                            {
                                cuentaRegistrada.DetalleJSON = Newtonsoft.Json.JsonConvert.DeserializeObject<DTO_DetalleCuentaJSON>(json)
                                                                ?? new DTO_DetalleCuentaJSON();
                            }
                            else
                            {
                                cuentaRegistrada.DetalleJSON = null;
                            }

                            // 2do result set: alerta
                            if (reader.NextResult())
                            {
                                while (reader.Read())
                                {
                                    respuesta = manejarRespuesta(reader);
                                }
                            }

                            respuesta.Resultado.Add(cuentaRegistrada);
                        }
                    }

                    return respuesta;
                }
            }
            catch (Exception ex)
            {
                this.Close();
                throw;
            }
            finally
            {
                this.Close();
            }
        }



        public DTO_Respuesta obtenerCuenta(DTO_Negocio negocio)
        {
            List<DTO_Cuenta> listaCuentas = [];
            DTO_Cuenta cuenta;
            try
            {

                string query = "CORE.SP_obtenerCuentas";


                using (SqlCommand sqlcmd = new SqlCommand(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = CommandType.StoredProcedure;
                    sqlcmd.Parameters.Add("@ID_Negocio", SqlDbType.Int).Value = negocio.ID_Negocio;

                    // Establecer la dirección de los parámetros
                    foreach (SqlParameter param in sqlcmd.Parameters)
                    {
                        param.Direction = ParameterDirection.Input;
                    }

                    // Asegurarse de abrir la conexión
                    this.Open();

                    // Ejecutar el comando y obtener el lector de datos
                    using (SqlDataReader reader = sqlcmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            cuenta = new();
                            cuenta.ID_Cuenta = UTL_DBHelper.ReadNullSafeInt(reader["ID_Cuenta"]);
                            cuenta.ID_Negocio = UTL_DBHelper.ReadNullSafeInt(reader["ID_Negocio"]);
                            cuenta.Estado.ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]);
                            cuenta.Estado.Nombre = UTL_DBHelper.ReadNullSafeString(reader["NombreEstado"]);
                            cuenta.Concepto = UTL_DBHelper.ReadNullSafeString(reader["Concepto"]);
                            cuenta.Descripcion = UTL_DBHelper.ReadNullSafeString(reader["Descripcion"]);
                            cuenta.Monto = UTL_DBHelper.ReadNullSafeDecimal(reader["Monto"]);
                            cuenta.FechaInicial = (DateTime)UTL_DBHelper.ReadNullSafeDateTime(reader["FechaInicial"]);
                            cuenta.FechaModificacion = (DateTime)UTL_DBHelper.ReadNullSafeDateTime(reader["FechaModificacion"]);
                            cuenta.FechaLimite = (DateTime)UTL_DBHelper.ReadNullSafeDateTime(reader["FechaLimite"]);
                            cuenta.TipoCuenta = UTL_DBHelper.ReadNullSafeString(reader["TipoCuenta"]);
                            cuenta.ID_OrdenServicio = UTL_DBHelper.ReadNullSafeInt(reader["ID_OrdenServicio"]);

                            //Campos Calculados
                            cuenta.MontoAbonado = UTL_DBHelper.ReadNullSafeDecimal(reader["MontoAbonado"]);
                            cuenta.SaldoPendiente = UTL_DBHelper.ReadNullSafeDecimal(reader["SaldoPendiente"]);
                            cuenta.EstadoPago = UTL_DBHelper.ReadNullSafeString(reader["EstadoPago"]);

                            string json = UTL_DBHelper.ReadNullSafeString(reader["DetalleJSON"]);
                            if (!string.IsNullOrWhiteSpace(json))
                            {
                                try
                                {
                                    // Deserializamos a List<DTO_Param>:
                                    cuenta.DetalleJSON = Newtonsoft.Json.JsonConvert.DeserializeObject<DTO_DetalleCuentaJSON>(json)
                                                                ?? new DTO_DetalleCuentaJSON();
                                }
                                catch (Exception jsonEx)
                                {
                                    // lista vacía e ignorar el error
                                    cuenta.detalleJSON = new DTO_DetalleCuentaJSON();
                                }
                            }
                            else
                            {
                                // Si el campo estuvo vacío o nulo:
                                cuenta.detalleJSON = new DTO_DetalleCuentaJSON();
                            }


                            listaCuentas.Add(cuenta);

                        }

                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                respuesta = manejarRespuesta(reader);

                            }
                        }

                        respuesta.Resultado.Add(listaCuentas);
                    }
                    return respuesta;
                }
            }
            catch (Exception e)
            {
                this.Close();
                throw e;  // Luego se guardan las ecepciones en un log
            }
            finally
            {
                this.Close();
            }
        }


        public DTO_Respuesta actualizarCuenta(DTO_Cuenta cuenta)
        {
            try
            {
                string query = "CORE.SP_actualizarCuenta";
                string jsonDetalle = System.Text.Json.JsonSerializer.Serialize(cuenta.DetalleJSON);

                using (SqlCommand sqlcmd = new(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = CommandType.StoredProcedure;

                    sqlcmd.Parameters.Add("@ID_Cuenta", SqlDbType.Int).Value = cuenta.ID_Cuenta;
                    sqlcmd.Parameters.Add("@Concepto", SqlDbType.VarChar).Value = cuenta.Concepto;
                    sqlcmd.Parameters.Add("@Descripcion", SqlDbType.VarChar).Value = cuenta.Descripcion;
                    sqlcmd.Parameters.Add("@Monto", SqlDbType.Decimal).Value = cuenta.Monto;
                    sqlcmd.Parameters.Add("@ID_Estado", SqlDbType.VarChar).Value = cuenta.Estado.ID_Estado;
                    sqlcmd.Parameters.AddWithValue("@DetalleJSON", jsonDetalle ?? (object)DBNull.Value);

                    foreach (SqlParameter param in sqlcmd.Parameters)
                    {
                        param.Direction = ParameterDirection.Input;
                    }

                    this.Open();

                    using (SqlDataReader reader = sqlcmd.ExecuteReader())
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


    }
}
