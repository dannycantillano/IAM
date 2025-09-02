using DTO;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UTL;

namespace DAL
{
    public class DAL_Cliente : DAL_Conexion
    {
        DTO_Respuesta respuesta = new();
        DTO_Cliente cliente = new();

        public async Task<DTO_Respuesta> obtenerClientes(DTO_Usuario usuario)
        {
            List<DTO_Cliente> listaClientes = [];
            try
            {

                string query = "CORE.SP_obtenerClientes";


                using (SqlCommand sqlcmd = new SqlCommand(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = CommandType.StoredProcedure;
                    sqlcmd.Parameters.Add("@ID_Usuario", SqlDbType.Int).Value = usuario.ID_Usuario;

                    // Establecer la dirección de los parámetros
                    foreach (SqlParameter param in sqlcmd.Parameters)
                    {
                        param.Direction = ParameterDirection.Input;
                    }

                    // Asegurarse de abrir la conexión
                    this.Open();

                    // Ejecutar el comando y obtener el lector de datos
                    using (SqlDataReader reader = await sqlcmd.ExecuteReaderAsync())
                    {
                        while (reader.Read())
                        {
                            cliente = new();
                            cliente.ID_Cliente = UTL_DBHelper.ReadNullSafeInt(reader["ID_Cliente"]);
                            cliente.ID_Usuario = UTL_DBHelper.ReadNullSafeInt(reader["ID_Usuario"]);
                            cliente.Estado.ID_Estado = UTL_DBHelper.ReadNullSafeInt(reader["ID_Estado"]);
                            cliente.Estado.Nombre = UTL_DBHelper.ReadNullSafeString(reader["EstadoNombre"]);
                            cliente.NombreCliente = UTL_DBHelper.ReadNullSafeString(reader["NombreCliente"]);
                            cliente.ApellidoCliente = UTL_DBHelper.ReadNullSafeString(reader["ApellidoCliente"]);
                            cliente.TelefonoCliente = UTL_DBHelper.ReadNullSafeString(reader["TelefonoCliente"]);
                            cliente.CorreoCliente = UTL_DBHelper.ReadNullSafeString(reader["CorreoCliente"]);


                            listaClientes.Add(cliente);
                        }

                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                respuesta = manejarRespuesta(reader);

                            }
                        }

                        respuesta.Resultado.Add(listaClientes);
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

        //Este metode es para buscar los cliente existentes y mostrarlos en u select en frontEnd
        //NO se ocupa EL DTO_Respuesta para un componente tipo type-ahead que solo necesita una lista de clientes, ese sobre-envoltorio suele ser contraproducente
        public async Task<List<DTO_Cliente>> BuscarClientesAsync(DTO_SolicitudDeBusqueda solicitud, DTO_Usuario usuario)
        {

            var lista = new List<DTO_Cliente>();
            try
            {
                using var sqlcmd = new SqlCommand("CORE.SP_buscarCliente", GetObjConexion())
                {
                    CommandType = CommandType.StoredProcedure
                };
                // Parámteros:
                sqlcmd.Parameters.Add("@ID_Usuario", SqlDbType.Int).Value = usuario.ID_Usuario;
                sqlcmd.Parameters.Add("@NombreCliente", SqlDbType.NVarChar, 100).Value = solicitud.Term;
                sqlcmd.Parameters.Add("@ApellidoCliente", SqlDbType.NVarChar, 100).Value = solicitud.Term;
                sqlcmd.Parameters.Add("@TelefonoCliente", SqlDbType.NVarChar, 50).Value = string.IsNullOrWhiteSpace(solicitud.Term) ? (object)DBNull.Value : solicitud.Term;
                sqlcmd.Parameters.Add("@CorreoCliente", SqlDbType.NVarChar, 100).Value = string.IsNullOrWhiteSpace(solicitud.Term) ? (object)DBNull.Value : solicitud.Term;

                Open();
                using var reader = await sqlcmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    cliente = new DTO_Cliente
                    {
                        ID_Cliente = UTL_DBHelper.ReadNullSafeInt(reader["ID_Cliente"]),
                        ID_Usuario = UTL_DBHelper.ReadNullSafeInt(reader["ID_Usuario"]),
                        NombreCliente = UTL_DBHelper.ReadNullSafeString(reader["NombreCliente"]),
                        ApellidoCliente = UTL_DBHelper.ReadNullSafeString(reader["ApellidoCliente"]),
                        TelefonoCliente = UTL_DBHelper.ReadNullSafeString(reader["TelefonoCliente"]),
                        CorreoCliente = UTL_DBHelper.ReadNullSafeString(reader["CorreoCliente"]),
                    };
                    lista.Add(cliente);
                }
            }
            finally
            {
                Close();
            }
            return lista;
        }

        public async Task<DTO_Respuesta> buscarCliente(DTO_Cliente cliente)
        {
            DTO_Respuesta respuesta = new DTO_Respuesta();
            List<DTO_Cliente> listaCliente = new List<DTO_Cliente>();
            try
            {

                string query = "CORE.SP_buscarCliente";


                using (SqlCommand sqlcmd = new SqlCommand(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = CommandType.StoredProcedure;
                    sqlcmd.Parameters.Add("@ID_Usuario", SqlDbType.VarChar).Value = cliente.ID_Usuario;
                    sqlcmd.Parameters.Add("@NombreCliente", SqlDbType.VarChar).Value = cliente.NombreCliente;
                    sqlcmd.Parameters.Add("@ApellidoCliente", SqlDbType.VarChar).Value = cliente.ApellidoCliente;
                    sqlcmd.Parameters.Add("@TelefonoCliente", SqlDbType.NVarChar).Value = (cliente.TelefonoCliente.Length > 0) ? cliente.TelefonoCliente : (object)DBNull.Value;
                    sqlcmd.Parameters.Add("@CorreoCliente", SqlDbType.NVarChar).Value = (cliente.CorreoCliente.Length > 0) ? cliente.CorreoCliente : (object)DBNull.Value;


                    // Establecer la dirección de los parámetros
                    foreach (SqlParameter param in sqlcmd.Parameters)
                    {
                        param.Direction = ParameterDirection.Input;
                    }

                    // Asegurarse de abrir la conexión
                    this.Open();

                    // Ejecutar el comando y obtener el lector de datos
                    using (SqlDataReader reader = await sqlcmd.ExecuteReaderAsync())
                    {
                        while (reader.Read())
                        {
                            cliente = new DTO_Cliente();
                            cliente.ID_Cliente = UTL_DBHelper.ReadNullSafeInt(reader["ID_Cliente"]);
                            cliente.ID_Usuario = UTL_DBHelper.ReadNullSafeInt(reader["ID_Usuario"]);
                            cliente.NombreCliente = UTL_DBHelper.ReadNullSafeString(reader["NombreCliente"]);
                            cliente.ApellidoCliente = UTL_DBHelper.ReadNullSafeString(reader["ApellidoCliente"]);
                            cliente.TelefonoCliente = UTL_DBHelper.ReadNullSafeString(reader["TelefonoCliente"]);
                            cliente.CorreoCliente = UTL_DBHelper.ReadNullSafeString(reader["CorreoCliente"]);

                            listaCliente.Add(cliente);
                        }


                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                respuesta = manejarRespuesta(reader);

                            }
                        }

                        respuesta.Resultado.Add(listaCliente);
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

        public async Task<DTO_Respuesta> guardarCliente(DTO_Cliente cliente)
        {
            DTO_Respuesta respuesta = new DTO_Respuesta();
            try
            {

                string query = "CORE.SP_guardarCliente";


                using (SqlCommand sqlcmd = new SqlCommand(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = CommandType.StoredProcedure;
                    sqlcmd.Parameters.Add("@ID_Usuario", SqlDbType.Int).Value = cliente.ID_Usuario;
                    sqlcmd.Parameters.Add("@NombreCliente", SqlDbType.VarChar).Value = cliente.NombreCliente;
                    sqlcmd.Parameters.Add("@ApellidoCliente", SqlDbType.VarChar).Value = cliente.ApellidoCliente;
                    sqlcmd.Parameters.Add("@TelefonoCliente", SqlDbType.VarChar).Value = cliente.TelefonoCliente;
                    sqlcmd.Parameters.Add("@CorreoCliente", SqlDbType.VarChar).Value = cliente.CorreoCliente;


                    // Establecer la dirección de los parámetros
                    foreach (SqlParameter param in sqlcmd.Parameters)
                    {
                        param.Direction = ParameterDirection.Input;
                    }

                    // Asegurarse de abrir la conexión
                    this.Open();

                    // Ejecutar el comando y obtener el lector de datos
                    using (SqlDataReader reader = await sqlcmd.ExecuteReaderAsync())
                    {
                        while (reader.Read())
                        {
                            cliente.ID_Cliente = UTL_DBHelper.ReadNullSafeInt(reader["ID_Cliente"]);
                        }

                        if (reader.NextResult())
                        {
                            while (reader.Read())
                            {
                                respuesta = manejarRespuesta(reader);

                            }
                        }
                    }

                    respuesta.Resultado.Add(cliente);
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


        public async Task<DTO_Respuesta> actualizarCliente(DTO_Cliente cliente)
        {
            try
            {
                string query = "CORE.SP_actualizarCliente";

                using (SqlCommand sqlcmd = new(query, this.GetObjConexion()))
                {
                    sqlcmd.CommandType = CommandType.StoredProcedure;

                    sqlcmd.Parameters.Add("@ID_Cliente", SqlDbType.Int).Value = cliente.ID_Cliente;
                    //sqlcmd.Parameters.Add("@ID_Usuario", SqlDbType.Int).Value = cliente.ID_Usuario;
                    sqlcmd.Parameters.Add("@ID_Estado", SqlDbType.Int).Value = cliente.Estado.ID_Estado;
                    sqlcmd.Parameters.Add("@NombreCliente", SqlDbType.VarChar).Value = cliente.NombreCliente;
                    sqlcmd.Parameters.Add("@ApellidoCliente", SqlDbType.VarChar).Value = cliente.ApellidoCliente;
                    sqlcmd.Parameters.Add("@TelefonoCliente", SqlDbType.VarChar).Value = cliente.TelefonoCliente;
                    sqlcmd.Parameters.Add("@CorreoCliente", SqlDbType.VarChar).Value = cliente.CorreoCliente;

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
    }
}
