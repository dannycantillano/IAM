USE [IAMDB]
GO

/****** Object:  StoredProcedure [CORE].[SP_obtenerTransacciones]    Script Date: 21/9/2025 12:30:00 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

    ALTER PROCEDURE [CORE].[SP_obtenerTransacciones] @ID_Negocio INT AS BEGIN
SET NOCOUNT ON;
SELECT TRANS.ID_Transaccion,
    TRANS.ID_Negocio,
    ESTADO.ID_Estado AS Estado_ID_Estado,
    ESTADO.Nombre AS NombreEstado,
    TRANS.Concepto,
    TRANS.Monto,
    TRANS.Tipo,
    TRANS.NumReferencia,
    TRANS.TipoNumReferencia,
    TRANS.FechaTransaccion
FROM CORE.TBL_TRANSACCIONES TRANS
    INNER JOIN UTIL.TBL_ESTADOS ESTADO ON TRANS.ID_Estado = ESTADO.ID_Estado
WHERE TRANS.ID_Negocio = @ID_Negocio
AND TRANS.ID_Estado != 21
ORDER BY TRANS.ID_Transaccion DESC;
-- Alerta de éxito
SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'B033';
-- Transacciones cargadas correctamente
END
GO


