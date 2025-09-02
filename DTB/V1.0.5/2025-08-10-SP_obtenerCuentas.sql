USE [IAMDB]
GO

/****** Object:  StoredProcedure [CORE].[SP_obtenerCuentas]    Script Date: 10/8/2025 05:17:07 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

    -- Definición real del SP
    -- =============================================
    ALTER PROCEDURE [CORE].[SP_obtenerCuentas] @ID_Negocio INT AS BEGIN
SET NOCOUNT ON;
SELECT
    CP.[ID_Cuenta],
    CP.[ID_Negocio],
    CP.[ID_Estado],
    E.[Nombre] AS NombreEstado,
    CP.[Concepto],
    CP.[Descripcion],
    CP.[Monto],
    CP.[FechaInicial],
    CP.[FechaModificacion],
    CP.[FechaLimite],
    CP.[TipoCuenta],
    CP.[ID_OrdenServicio],
    CP.[DetalleJSON],

    -- Calculadas
    CAST(ISNULL(T.MontoAbonado, 0.000) AS decimal(16,3))        AS MontoAbonado,
    CAST(CP.Monto - ISNULL(T.MontoAbonado, 0) AS decimal(16,3)) AS SaldoPendiente,
    CASE 
        WHEN ISNULL(T.MontoAbonado, 0) >= CP.Monto THEN 'Pagada'
        ELSE 'Pendiente'
    END                                                          AS EstadoPago
FROM [CORE].[TBL_CUENTAS] AS CP
INNER JOIN [UTIL].[TBL_ESTADOS] AS E
    ON CP.[ID_Estado] = E.[ID_Estado]
OUTER APPLY (
    SELECT
        SUM(tr.[Monto]) AS MontoAbonado 
    FROM [CORE].[TBL_TRANSACCIONES] tr
    WHERE tr.[ID_Negocio] = CP.[ID_Negocio]
      AND UPPER(tr.[TipoNumReferencia]) = 'cuenta'
      AND TRY_CONVERT(int, tr.[NumReferencia]) = CP.[ID_Cuenta]
      AND (
            -- Cuentas por COBRAR: solo abonan los Ingresos
            (CP.[TipoCuenta] = 'Cuenta Por Cobrar' AND tr.[Tipo] = 'Ingreso')
            -- Cuentas por PAGAR: solo abonan los Gastos (pagos/egresos)
         OR (CP.[TipoCuenta] = 'Cuenta Por Pagar'   AND tr.[Tipo] = 'Gasto')
      ) 
	  AND tr.ID_Estado = 20 --Activo

) AS T
WHERE CP.[ID_Negocio] = @ID_Negocio;

-- 3) Verificar si se obtuvieron filas
IF @@ROWCOUNT = 0 BEGIN
SELECT [COD_ALERTA],
    [Nombre],
    [Mensaje],
    [Tipo]
FROM [UTIL].[TBL_ALERTAS]
WHERE [COD_ALERTA] = 'B013';
-- No se encontraron registros
RETURN;
END -- 4) Todo correcto
SELECT [COD_ALERTA],
    [Nombre],
    [Mensaje],
    [Tipo]
FROM [UTIL].[TBL_ALERTAS]
WHERE [COD_ALERTA] = 'B012';
-- Consulta exitosa
END
GO


