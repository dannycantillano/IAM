export const Info = () => {
  return (
    <div className="container py-5">
      <div
        className="row justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body text-center">
              <i
                className="bi bi-house-door-fill mb-3"
                style={{ fontSize: "4rem", color: "#0d6efd" }}
              ></i>
              <h2 className="mb-2 fw-bold">¡Bienvenido!</h2>
              <p className="text-muted mb-4">

              </p>
              {/* Alerta de versión beta */}
              <div
                className="alert alert-info bg-opacity-10 border-info mb-4"
                role="alert"
              >
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle-fill me-2 fs-4"></i>
                  <div>

                    Este sistema se encuentra en una versión <b>Beta</b> y está en
                    constante evolución.
                  </div>
                </div>
              </div>
              <div className="row mb-4">
                <div className="col-12 col-md-6 mb-3 mb-md-0">
                  <div className="card border-0 bg-light h-100">
                    <div className="card-body">
                      <i
                        style={{ fontSize: "2rem", color: "#0d6efd" }}
                        className="bi bi-arrow-repeat"
                      ></i>
                      <h5 className="card-title fw-semibold">
                        Próximas actualizaciones
                      </h5>
                      <p className="card-text text-muted">
                        El sistema está en constante evolución para ofrecerte
                        una mejor experiencia. Próximamente podrás disfrutar de
                        nuevas funcionalidades como:
                      </p>
                      <ul className="text-muted text-start mb-0">
                      
                        <li>Mejoras en la navegación y usabilidad</li>
                        <li>Reportes personalizados</li>
                        <li>Optimización de rendimiento</li>
                        <li>Integración con nuevos módulos (como el Módulo de productos)</li>
                        <li>Integración con el chat de inteligencia artificial</li>
                        <li>Mensajes de info/ayuda en partes críticas del sistema</li>
                      </ul>

                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card border-0 bg-light h-100">
                    <div className="card-body">
                      <i
                        className="bi bi-shield-check mb-2"
                        style={{ fontSize: "2rem", color: "#198754" }}
                      ></i>
                      <h5 className="card-title fw-semibold">
                        Seguridad y soporte
                      </h5>
                      <p className="card-text text-muted">
                        Priorizamos la seguridad de tus datos y ofrecemos
                        soporte dedicado para resolver cualquier inconveniente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="accordion" id="kt_accordion_1">
                <div className="accordion-item">
                  <h2 className="accordion-header" id="kt_accordion_1_header_1">
                    <button className="accordion-button fs-4 fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#kt_accordion_1_body_1" aria-expanded="true" aria-controls="kt_accordion_1_body_1">
                      <span className="fs-4 py-2">Versión V1.0.5 {' --> '}</span> <span className="fs-4 text-muted px-4"> 01/09/2025</span>
                    </button>
                  </h2>
                  <div id="kt_accordion_1_body_1" className="accordion-collapse collapse show" aria-labelledby="kt_accordion_1_header_1" data-bs-parent="#kt_accordion_1">
                    <div className="accordion-body">

                      <table className="table table-striped gy-7 gs-7">
                        <thead>

                        </thead>
                        <tbody>
                          <tr>
                            <td>Se añadió la opción del menú "Tarifario", que permite guardar tarifas personalizadas para utilizarlas posteriormente en distintas áreas del sistema.</td>
                          </tr>
                          <tr>
                            <td>Se añadió la opción del menú "Proformas", para crear proformas por cliente; luego pueden convertirse en ítems de una orden de servicio o exportarse a PDF.</td>
                          </tr>
                          <tr>
                            <td>Se ajustaron las tablas de datos para ofrecer un diseño adaptable (responsive) y una visualización óptima en dispositivos móviles.</td>
                          </tr>
                          <tr>
                            <td>Se optimizaron las ventanas modales: se redujeron los márgenes y se amplió el área de trabajo en dispositivos móviles.</td>
                          </tr>
                          <tr>
                            <td>Se corrigió un error que afectaba la carga del Monitor en algunos navegadores (Safari y Maxthon).</td>
                          </tr>
                          <tr>
                            <td>Se corrigió un error al editar transacciones.</td>
                          </tr>
                          <tr>
                            <td>Se corrigió un error que impedía el cálculo correcto de las métricas en el menú "Inicio".</td>
                          </tr>
                          <tr>
                            <td>Se reorganizaron, de izquierda a derecha y de forma prioritaria, las columnas de las tablas de datos para mejorar la lectura.</td>
                          </tr>
                          <tr>
                            <td>Se mejoró el buscador de clientes para una búsqueda más rápida y precisa.</td>
                          </tr>
                          <tr>
                            <td>Se mejoró el despliegue de alertas en dispositivos móbles.</td>
                          </tr>
                        </tbody>

                      </table>
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header" id="kt_accordion_1_header_2">
                    <button className="accordion-button fs-4 fw-bold collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#kt_accordion_1_body_2" aria-expanded="false" aria-controls="kt_accordion_1_body_2">
                      <span className="fs-4 py-2">Versión V1.0.4 {' -->  '}</span> <span className="fs-4 text-muted px-4"> 18/08/2025</span>
                    </button>
                  </h2>
                  <div id="kt_accordion_1_body_2" className="accordion-collapse collapse" aria-labelledby="kt_accordion_1_header_2" data-bs-parent="#kt_accordion_1">
                    <div className="accordion-body">
                      <table className="table table-striped gy-7 gs-7">
                        <thead>

                        </thead>
                        <tbody>
                          <tr>
                            <td>Se lanzó la versión Beta pública de IAM (Intelligent Admin Manager), una plataforma web diseñada para la administración de negocios.</td>
                          </tr>
                          <tr>
                            <td>Se implementó el menú principal con 7 opciones fundamentales: Inicio, Clientes, Cuentas, Órdenes de servicio, Monitor, Transacciones y Negocios.</td>
                          </tr>
                          <tr>
                            <td>En el menú "Inicio" se incluyeron gráficas y métricas clave: ingresos, gastos, balance, cuentas por pagar y por cobrar, además de estadísticas de clientes, órdenes de servicio y transacciones, todo filtrable por periodos de tiempo.</td>
                          </tr>
                          <tr>
                            <td>Se habilitó el módulo "Clientes" para registrar y gestionar la lista de clientes asociados a cada usuario.</td>
                          </tr>
                          <tr>
                            <td>Se incorporó el módulo "Cuentas" para el registro de cuentas por pagar y por cobrar, con la posibilidad de asociar transacciones como abonos al saldo.</td>
                          </tr>
                          <tr>
                            <td>Se creó el módulo "Órdenes de servicio", con campos de referencia configurables, fechas estimadas y reales, y una lista de ítems con nombre y precio.</td>
                          </tr>
                          <tr>
                            <td>Se implementó el "Monitor" en tiempo real con 4 columnas (nuevas, en proceso, en pausa y finalizadas), que permite visualizar y actualizar el estado de las órdenes de servicio.</td>
                          </tr>
                          <tr>
                            <td>Se añadió el menú "Transacciones" para registrar ingresos y gastos del negocio.</td>
                          </tr>
                          <tr>
                            <td>Se incorporó el módulo "Negocios", que permite crear hasta 3 negocios por usuario, con datos generales y referencias personalizadas para órdenes de servicio.</td>
                          </tr>
                        </tbody>


                      </table>
                    </div>
                  </div>
                </div>


              </div>
              <div className="text-center mt-4">
                <small className="text-muted">
                  &copy; {new Date().getFullYear()} IAM
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
