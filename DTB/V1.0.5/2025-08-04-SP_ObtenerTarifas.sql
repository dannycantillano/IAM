USE [IAMDB]
GO 
IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_ObtenerTarifas'
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_ObtenerTarifas AS BEGIN SET NOCOUNT ON; END'
    )
END
GO -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 13/08/2025
    -- Descripción: Obtiene tarifas por negocio.
    --   - Por defecto devuelve Activas + Inactivas
    --   - Siempre excluye Eliminadas
    --   - Si @SoloActivas = 1, devuelve únicamente Activas
    --   - Si @SoloActivas = 0, devuelve Activas + Inactivas
    --   - Activo = 23, Inactivo = 24, Eliminado = 25
    -- =============================================
    ALTER PROCEDURE CORE.SP_ObtenerTarifas @ID_Negocio INT,
    @SoloActivas BIT = 0 AS BEGIN
SET NOCOUNT ON;
SELECT T.ID_Tarifa,
    T.ID_Negocio,
    T.ID_Estado,
    T.NombreTarifa,
    T.DescripcionTarifa,
    T.PrecioTarifa,
    T.FechaCreacion,
    T.FechaModificacion,
    E.Nombre AS EstadoNombre
FROM CORE.TBL_TARIFAS T
    LEFT JOIN UTIL.TBL_ESTADOS E ON E.ID_Estado = T.ID_Estado
WHERE T.ID_Negocio = @ID_Negocio
    AND T.ID_Estado <> 25 -- Excluir Eliminadas
    AND (
        (
            @SoloActivas = 1
            AND T.ID_Estado = 23
        ) -- Solo Activas
        OR (
            @SoloActivas = 0
            AND T.ID_Estado IN (23, 24)
        ) -- Activas + Inactivas
    )
ORDER BY T.NombreTarifa;
-- 2) Alerta
SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'B046';
END
GO