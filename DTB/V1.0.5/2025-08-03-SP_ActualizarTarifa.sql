USE [IAMDB]
GO
 IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_actualizarTarifa'
            AND schema_id = SCHEMA_ID('CORE')
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_actualizarTarifa AS BEGIN SET NOCOUNT ON; END'
    );
END
GO  -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 18/08/2025
    -- Descripción: Actualiza una tarifa con parámetros opcionales.
    --  - Si el parámetro viene NULL o vacío (''), NO se modifica ese campo.
    --  - Permite cambiar el estado a 23/24/25 (incluye Eliminado = 25).
    --  - Devuelve la fila actualizada y luego la alerta (dos result sets).
    -- =============================================
    ALTER PROCEDURE [CORE].[SP_actualizarTarifa] @ID_Tarifa INT,
    @ID_Estado INT = NULL,
    -- 23/24/25
    @NombreTarifa NVARCHAR(100) = NULL,
    -- '' o NULL => no cambia
    @DescripcionTarifa NVARCHAR(255) = NULL,
    -- '' o NULL => no cambia
    @PrecioTarifa DECIMAL(16, 3) = NULL -- NULL => no cambia
    AS BEGIN
SET NOCOUNT ON;
-- Normalizar strings: vacío => NULL (para "ignorar" el cambio)
SET @NombreTarifa = NULLIF(LTRIM(RTRIM(@NombreTarifa)), N'');
SET @DescripcionTarifa = NULLIF(LTRIM(RTRIM(@DescripcionTarifa)), N'');
-- Actualización "a la OS": solo cambia lo que trae valor
UPDATE CORE.TBL_TARIFAS
SET ID_Estado = ISNULL(@ID_Estado, ID_Estado),
    NombreTarifa = ISNULL(@NombreTarifa, NombreTarifa),
    DescripcionTarifa = ISNULL(@DescripcionTarifa, DescripcionTarifa),
    PrecioTarifa = ISNULL(@PrecioTarifa, PrecioTarifa),
    FechaModificacion = GETDATE()
WHERE ID_Tarifa = @ID_Tarifa;
-- 1) Devolver registro actualizado (igual que en OS)
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
WHERE T.ID_Tarifa = @ID_Tarifa;
-- 2) Alerta (mismo patrón que OS)
SELECT [COD_ALERTA],
    [Nombre],
    [Mensaje],
    [Tipo]
FROM [UTIL].[TBL_ALERTAS]
WHERE [COD_ALERTA] = 'B037';
END
GO