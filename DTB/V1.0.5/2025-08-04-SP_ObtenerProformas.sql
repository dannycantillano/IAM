USE [IAMDB];
GO 
IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_ObtenerProformas'
            AND schema_id = SCHEMA_ID('CORE')
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_ObtenerProformas AS BEGIN SET NOCOUNT ON; END'
    );
END
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 20/08/2025
    -- Descripción: Lista proformas por negocio con filtros opcionales.
    --              Incluye totales (descuento monto/% e impuesto %) y datos de cliente.
    -- Estados (TBL_PROFORMAS): 26=Borrador, 27=Aprobada, 28=Anulada, 31=Eliminado
    -- =============================================
    ALTER PROCEDURE CORE.SP_ObtenerProformas @ID_Negocio INT,
    @ID_Cliente INT = NULL,
    @ID_Estado INT = NULL -- 26/27/28; NULL = todos menos eliminados
    AS BEGIN
SET NOCOUNT ON;
;
WITH Base AS (
    SELECT P.ID_Proforma,
        P.ID_Negocio,
        P.ID_Cliente,
        P.ID_Estado,
        P.FechaProforma,
        P.FechaVencimiento,
        P.ObservacionProforma,
        P.FechaModificacion,
        -- Cabecera normalizada:
        ISNULL(P.DescuentoProforma, 0) AS DescuentoProforma,
        ISNULL(P.DescuentoPorcentualProforma, 0) AS DescuentoPorcentualProforma,
        -- BIT 0/1
        ISNULL(P.ImpuestoPorcentualProforma, 0) AS ImpuestoPorcentualProforma,
        -- Extras legibles:
        E.Nombre AS EstadoNombre,
        C.NombreCliente,
        C.ApellidoCliente
    FROM CORE.TBL_PROFORMAS P
        LEFT JOIN UTIL.TBL_ESTADOS E ON E.ID_Estado = P.ID_Estado
        LEFT JOIN CORE.TBL_CLIENTES C ON C.ID_Cliente = P.ID_Cliente
    WHERE P.ID_Negocio = @ID_Negocio
        AND (
            @ID_Cliente IS NULL
            OR P.ID_Cliente = @ID_Cliente
        )
        AND (
            @ID_Estado IS NULL
            OR P.ID_Estado = @ID_Estado
        )
        AND P.ID_Estado <> 31 -- Excluye Eliminados
)
SELECT -- Cabecera
    B.ID_Proforma,
    B.ID_Negocio,
    B.ID_Cliente,
    B.ID_Estado,
    B.FechaProforma,
    B.FechaVencimiento,
    B.ObservacionProforma,
    B.FechaModificacion,
    B.DescuentoProforma,
    B.DescuentoPorcentualProforma,
    B.ImpuestoPorcentualProforma,
    -- Cliente
    B.NombreCliente,
    B.ApellidoCliente,
    -- Totales
    T.Subtotal,
    T.MontoDescuento,
    T.BaseImponible,
    T.MontoImpuesto,
    T.TotalCalculado,
    B.EstadoNombre
FROM Base B -- 1) Subtotal por proforma (ítems activos)
    OUTER APPLY (
        SELECT CAST(
                ISNULL(
                    SUM(
                        CAST(I.PrecioItemProforma AS DECIMAL(16, 3)) * CAST(I.CantidadItemProforma AS DECIMAL(16, 3))
                    ),
                    0
                ) AS DECIMAL(16, 3)
            ) AS Subtotal
        FROM CORE.TBL_PROFORMAS_ITEMS I
        WHERE I.ID_Proforma = B.ID_Proforma
            AND I.ID_Estado = 29 -- Activos
    ) AS S -- 2) Descuento (porcentaje o monto fijo)
    OUTER APPLY (
        SELECT CAST(
                CASE
                    WHEN B.DescuentoPorcentualProforma = 1 THEN ISNULL(S.Subtotal, 0) * (B.DescuentoProforma / 100.0)
                    ELSE B.DescuentoProforma
                END AS DECIMAL(16, 3)
            ) AS DescuentoCalc
    ) AS D -- 3) Base imponible (no negativa)
    OUTER APPLY (
        SELECT CAST(
                CASE
                    WHEN ISNULL(S.Subtotal, 0) - D.DescuentoCalc < 0 THEN 0
                    ELSE ISNULL(S.Subtotal, 0) - D.DescuentoCalc
                END AS DECIMAL(16, 3)
            ) AS BaseCalc
    ) AS Bc -- 4) Impuesto y Total
    OUTER APPLY (
        SELECT CAST(
                Bc.BaseCalc * (B.ImpuestoPorcentualProforma / 100.0) AS DECIMAL(16, 3)
            ) AS ImpuestoCalc,
            CAST(
                Bc.BaseCalc + (
                    Bc.BaseCalc * (B.ImpuestoPorcentualProforma / 100.0)
                ) AS DECIMAL(16, 3)
            ) AS TotalCalc
    ) AS It -- 5) Paquete final (nombres definitivos)
    OUTER APPLY (
        SELECT ISNULL(S.Subtotal, 0) AS Subtotal,
            -- item * cantidad
            ISNULL(D.DescuentoCalc, 0) AS MontoDescuento,
            -- (monto) o (subtotal * %)
            ISNULL(Bc.BaseCalc, 0) AS BaseImponible,
            -- subtotal - descuento (mínimo 0)
            ISNULL(It.ImpuestoCalc, 0) AS MontoImpuesto,
            -- base * (impuesto/100)
            ISNULL(It.TotalCalc, 0) AS TotalCalculado -- base + impuesto
    ) AS T
ORDER BY B.ID_Proforma DESC;
-- Alerta estándar
SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'B047';
END
GO