USE [IAMDB];
GO
IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_buscarProformas'
            AND schema_id = SCHEMA_ID('CORE')
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_buscarProformas AS BEGIN SET NOCOUNT ON; END'
    );
END
GO -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 20/08/2025
    -- Descripción: Búsqueda por texto/número en proformas. Incluye totales con
    --              descuento (monto/%) e impuesto (%).
    -- =============================================
    ALTER PROCEDURE CORE.SP_buscarProformas @ID_Negocio INT,
    @Term NVARCHAR(100) = N'' AS BEGIN
SET NOCOUNT ON;
-- Normalización y parseo numérico opcional
SET @Term = LTRIM(RTRIM(ISNULL(@Term, N'')));
DECLARE @QInt INT = TRY_CONVERT(INT, @Term);
DECLARE @QDec DECIMAL(16, 3) = TRY_CONVERT(DECIMAL(16, 3), @Term);
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
        ISNULL(P.DescuentoProforma, 0) AS DescuentoProforma,
        ISNULL(P.DescuentoPorcentualProforma, 0) AS DescuentoPorcentualProforma,
        ISNULL(P.ImpuestoPorcentualProforma, 0) AS ImpuestoPorcentualProforma,
        E.Nombre AS EstadoNombre,
        C.NombreCliente,
        C.ApellidoCliente
    FROM CORE.TBL_PROFORMAS P
        LEFT JOIN UTIL.TBL_ESTADOS E ON E.ID_Estado = P.ID_Estado
        LEFT JOIN CORE.TBL_CLIENTES C ON C.ID_Cliente = P.ID_Cliente
    WHERE P.ID_Negocio = @ID_Negocio
        AND P.ID_Estado <> 31
)
SELECT B.ID_Proforma,
    B.ID_Negocio,
    B.ID_Cliente,
    B.ID_Estado,
    B.FechaProforma,
    B.FechaVencimiento,
    B.ObservacionProforma,
    B.FechaModificacion,
    B.EstadoNombre,
    B.NombreCliente,
    B.ApellidoCliente,
    B.DescuentoProforma,
    B.DescuentoPorcentualProforma,
    B.ImpuestoPorcentualProforma,
    T.Subtotal,
    T.MontoDescuento,
    T.BaseImponible,
    T.MontoImpuesto,
    T.TotalCalculado
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
            AND I.ID_Estado = 29
    ) AS S -- 2) Cálculos centralizados y reusables
    OUTER APPLY (
        -- Descuento (porcentaje o monto fijo)
        SELECT CAST(
                CASE
                    WHEN B.DescuentoPorcentualProforma = 1 THEN ISNULL(S.Subtotal, 0) * (B.DescuentoProforma / 100.0)
                    ELSE B.DescuentoProforma
                END AS DECIMAL(16, 3)
            ) AS DescuentoCalc
    ) AS D
    OUTER APPLY (
        -- Base no negativa
        SELECT CAST(
                CASE
                    WHEN ISNULL(S.Subtotal, 0) - D.DescuentoCalc < 0 THEN 0
                    ELSE ISNULL(S.Subtotal, 0) - D.DescuentoCalc
                END AS DECIMAL(16, 3)
            ) AS BaseCalc
    ) AS Bc
    OUTER APPLY (
        -- Impuesto sobre Base y Total = Base + Impuesto
        SELECT CAST(
                Bc.BaseCalc * (B.ImpuestoPorcentualProforma / 100.0) AS DECIMAL(16, 3)
            ) AS ImpuestoCalc,
            CAST(
                Bc.BaseCalc + (
                    Bc.BaseCalc * (B.ImpuestoPorcentualProforma / 100.0)
                ) AS DECIMAL(16, 3)
            ) AS TotalCalc
    ) AS It -- Paquete final de totales (para dejar nombres definitivos)
    OUTER APPLY (
        SELECT ISNULL(S.Subtotal, 0) AS Subtotal, -- item * cantidad = subtotal
            ISNULL(D.DescuentoCalc, 0) AS MontoDescuento, -- Descuento (monto fijo o %) (si es % => subtotal * (descuento/100)) OR Si es monto fijo => descuento
            ISNULL(Bc.BaseCalc, 0) AS BaseImponible, -- BaseCalc evita los valores negativos, aplica el descuento sobre el subtotal => subtotal - MontoDescuento, es lo que queda después del descuento
            ISNULL(It.ImpuestoCalc, 0) AS MontoImpuesto,-- Impuesto sobre la base (base * (impuesto/100))
            ISNULL(It.TotalCalc, 0) AS TotalCalculado
    ) AS T
WHERE @Term = N''
    OR (
        -- Texto
        (
            B.ObservacionProforma IS NOT NULL
            AND B.ObservacionProforma LIKE N'%' + @Term + N'%'
        )
        OR (
            B.NombreCliente IS NOT NULL
            AND B.NombreCliente LIKE N'%' + @Term + N'%'
        )
        OR (
            B.ApellidoCliente IS NOT NULL
            AND B.ApellidoCliente LIKE N'%' + @Term + N'%'
        )
        OR (
            B.EstadoNombre IS NOT NULL
            AND B.EstadoNombre LIKE N'%' + @Term + N'%'
        ) -- Numérico por total (reutiliza el cálculo)
        OR (
            @QDec IS NOT NULL
            AND (
                T.TotalCalculado = @QDec
                OR CONVERT(NVARCHAR(50), T.TotalCalculado) LIKE N'%' + @Term + N'%'
            )
        ) -- (Opcional) Buscar por ID si se habilita:
        -- OR (@QInt IS NOT NULL AND B.ID_Proforma = @QInt)
    )
ORDER BY B.ID_Proforma DESC;
IF @@ROWCOUNT = 0 BEGIN
SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'B049';
END
END
GO