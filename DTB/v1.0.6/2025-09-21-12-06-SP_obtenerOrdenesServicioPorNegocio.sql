USE [IAMDB]
GO

/****** Object:  StoredProcedure [CORE].[SP_obtenerOrdenesServicioPorNegocio]    Script Date: 21/9/2025 12:27:35 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- Ahora sí, definimos el procedimiento real
ALTER PROCEDURE [CORE].[SP_obtenerOrdenesServicioPorNegocio]
    @ID_Negocio INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (1000)
        ORDEN.ID_OrdenServicio,
        ORDEN.ID_Cliente,
        ORDEN.ID_Negocio,
        ESTADO.ID_Estado,
        ESTADO.Nombre       AS EstadoNombre,
        ORDEN.FechaOrdenServicio,
        ORDEN.FechaEstimadaEntrega,
        ORDEN.FechaInicio,
        ORDEN.FechaFinal,
        ORDEN.FechaEntrega,
        ORDEN.ReferenciaJSON,
        -- Concatenamos el nombre del cliente al final de la nota
          'Cliente: ' 
          + CLIENTE.NombreCliente 
		  + ' | '
		  + ORDEN.NotaOrdenServicio 
         
        AS NotaOrdenConCliente
    FROM CORE.TBL_ORDENES_SERVICIO AS ORDEN
    INNER JOIN CORE.TBL_CLIENTES        AS CLIENTE
        ON CLIENTE.ID_Cliente = ORDEN.ID_Cliente
    INNER JOIN UTIL.TBL_ESTADOS         AS ESTADO
        ON ESTADO.ID_Estado  = ORDEN.ID_Estado
    WHERE ORDEN.ID_Negocio = @ID_Negocio
	AND ORDEN.ID_Estado != 10
    ORDER BY ORDEN.ID_OrdenServicio DESC;

    -- Alerta de éxito
    SELECT
        COD_ALERTA,
        Nombre,
        Mensaje,
        Tipo
    FROM UTIL.TBL_ALERTAS
    WHERE COD_ALERTA = 'B028';
END

GO


