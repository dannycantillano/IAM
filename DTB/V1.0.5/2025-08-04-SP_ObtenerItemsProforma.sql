USE [IAMDB]
GO 
IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_ObtenerItemsProforma'
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_ObtenerItemsProforma AS BEGIN SET NOCOUNT ON; END'
    )
END
GO -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 14/08/2025
    -- Descripción: Obtiene ítems de una proforma.
    --   - @SoloActivos = 1 (default) -> solo ítems con ID_Estado = 29 (Activo)
    --   - @SoloActivos = 0 -> trae todos los estados (incluye 30=Eliminado)
    -- =============================================
    ALTER PROCEDURE CORE.SP_ObtenerItemsProforma 
    @ID_Proforma INT,
    @SoloActivos BIT = 1 AS BEGIN
SET NOCOUNT ON;
SELECT I.ID_ProformaItem,
    I.ID_Proforma,
    I.ID_Estado,
    I.NombreItemProforma,
    I.DescripcionItemProforma,
    I.PrecioItemProforma,
    I.CantidadItemProforma,
    I.FechaCreacion,
    I.FechaModificacion,
    (I.PrecioItemProforma * I.CantidadItemProforma) AS SubtotalCalculado,
    ES.Nombre AS EstadoNombre
FROM CORE.TBL_PROFORMAS_ITEMS I
    LEFT JOIN UTIL.TBL_ESTADOS ES ON ES.ID_Estado = I.ID_Estado
WHERE I.ID_Proforma = @ID_Proforma
    AND (
        @SoloActivos = 0
        OR I.ID_Estado = 29 -- Activo
    )
ORDER BY I.ID_ProformaItem;
-- 2) Alerta correcta para "ítems obtenidos"
SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'B048';
END
GO