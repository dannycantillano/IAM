USE [IAMDB]
GO 
IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_actualizarItemsProforma'
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_actualizarItemsProforma AS BEGIN SET NOCOUNT ON; END'
    )
END
GO -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 13/08/2025
    -- Descripción: Actualiza un ítem de proforma y devuelve el registro actualizado
    -- =============================================
    ALTER PROCEDURE CORE.SP_actualizarItemsProforma 
    @ID_ProformaItem INT,
    @ID_Estado INT, -- 29=Activo, 30=Eliminado
    @NombreItemProforma VARCHAR(100),
    @DescripcionItemProforma NVARCHAR(255) = NULL,
    @PrecioItemProforma DECIMAL(16, 3) = NULL,
    @CantidadItemProforma DECIMAL(16, 3) = NULL AS BEGIN
SET NOCOUNT ON;
-- Normalizar: 0 => NULL (no cambiar)
SET @ID_Estado = NULLIF(@ID_Estado, 0);

DECLARE @Updated TABLE(
        ID_ProformaItem INT,
        ID_Proforma INT,
        ID_Estado INT,
        NombreItemProforma VARCHAR(100),
        DescripcionItemProforma NVARCHAR(255),
        PrecioItemProforma DECIMAL(16, 3),
        CantidadItemProforma DECIMAL(16, 3),
        FechaCreacion DATETIME,
        FechaModificacion DATETIME
    );
UPDATE CORE.TBL_PROFORMAS_ITEMS
SET ID_Estado = ISNULL(@ID_Estado, ID_Estado),
    NombreItemProforma = @NombreItemProforma,
    DescripcionItemProforma = @DescripcionItemProforma,
    PrecioItemProforma = ISNULL(@PrecioItemProforma, PrecioItemProforma),
    CantidadItemProforma = ISNULL(@CantidadItemProforma, CantidadItemProforma),
    FechaModificacion = GETDATE()
    OUTPUT inserted.ID_ProformaItem,
    inserted.ID_Proforma,
    inserted.ID_Estado,
    inserted.NombreItemProforma,
    inserted.DescripcionItemProforma,
    inserted.PrecioItemProforma,
    inserted.CantidadItemProforma,
    inserted.FechaCreacion,
    inserted.FechaModificacion INTO @Updated
WHERE ID_ProformaItem = @ID_ProformaItem;
-- 1) Ítem actualizado + subtotal
SELECT U.*,
    (U.PrecioItemProforma * U.CantidadItemProforma) AS SubtotalCalculado,
    E.Nombre AS EstadoNombre
FROM @Updated U
    LEFT JOIN UTIL.TBL_ESTADOS E ON E.ID_Estado = U.ID_Estado;
-- 2) Alerta
SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'B043';
END
GO