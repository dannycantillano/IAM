USE [IAMDB];
GO 
IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_buscarTarifas'
            AND schema_id = SCHEMA_ID('CORE')
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_buscarTarifas AS BEGIN SET NOCOUNT ON; END'
    );
END
GO -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 19/08/2025
    -- Descripción: Busca tarifas por negocio a partir de un término único (@Term).
    --   - Texto: NombreTarifa, DescripcionTarifa, EstadoNombre (p.ej. "activo", "inactivo")
    --   - Numérico: PrecioTarifa (match exacto y "contenga")
    --   - Siempre excluye Eliminadas (ID_Estado = 25)
    -- =============================================
    ALTER PROCEDURE CORE.SP_buscarTarifas 
    @ID_Negocio INT,
    @Term NVARCHAR(100) = N'' -- término único de búsqueda
    AS BEGIN
SET NOCOUNT ON;
-- Normalizar
SET @Term = LTRIM(RTRIM(ISNULL(@Term, N'')));
-- Si parece número, lo usamos para comparar precio
DECLARE @TermDec DECIMAL(16, 3) = TRY_CONVERT(DECIMAL(16, 3), @Term);
SELECT T.ID_Tarifa,
    T.ID_Negocio,
    T.ID_Estado,
    T.NombreTarifa,
    T.DescripcionTarifa,
    T.PrecioTarifa,
    T.FechaCreacion,
    T.FechaModificacion,
    E.Nombre AS EstadoNombre
FROM CORE.TBL_TARIFAS AS T
    LEFT JOIN UTIL.TBL_ESTADOS AS E ON E.ID_Estado = T.ID_Estado
WHERE T.ID_Negocio = @ID_Negocio
    AND T.ID_Estado <> 25 -- SIEMPRE excluir Eliminadas
    AND (
        @Term = N'' -- lista todo cuando no mandan término
        OR T.NombreTarifa LIKE N'%' + @Term + N'%'
        OR T.DescripcionTarifa LIKE N'%' + @Term + N'%'
        OR E.Nombre LIKE N'%' + @Term + N'%' -- "activo"/"inactivo"
        OR (
            @TermDec IS NOT NULL
            AND (
                T.PrecioTarifa = @TermDec
                OR CONVERT(NVARCHAR(50), T.PrecioTarifa) LIKE N'%' + @Term + N'%'
            )
        )
    )
ORDER BY T.NombreTarifa;
IF @@ROWCOUNT = 0 BEGIN
SELECT [COD_ALERTA],
    [Nombre],
    [Mensaje],
    [Tipo]
FROM [UTIL].[TBL_ALERTAS]
WHERE [COD_ALERTA] = 'B035';
END
END
GO