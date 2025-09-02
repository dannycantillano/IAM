USE [IAMDB]
GO 
IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_registrarItemsProforma'
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_registrarItemsProforma AS BEGIN SET NOCOUNT ON; END'
    )
END
GO 
    -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 13/08/2025
    -- Descripción: Agrega un ítem a la proforma y devuelve el registro insertado
    -- Estados (TBL_PROFORMAS_ITEMS): 29=Activo, 30=Eliminado
    -- =============================================
    ALTER PROCEDURE CORE.SP_registrarItemsProforma 
    @ID_Proforma INT,
    @NombreItemProforma VARCHAR(100),
    @DescripcionItemProforma NVARCHAR(255) = NULL,
    @PrecioItemProforma DECIMAL(16, 3),
    @CantidadItemProforma DECIMAL(16, 3) = 1 AS BEGIN
SET NOCOUNT ON;
DECLARE @Inserted TABLE(
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
INSERT INTO CORE.TBL_PROFORMAS_ITEMS (
        ID_Proforma,
        ID_Estado,
        NombreItemProforma,
        DescripcionItemProforma,
        PrecioItemProforma,
        CantidadItemProforma,
        FechaCreacion,
        FechaModificacion
    ) OUTPUT inserted.ID_ProformaItem,
    inserted.ID_Proforma,
    inserted.ID_Estado,
    inserted.NombreItemProforma,
    inserted.DescripcionItemProforma,
    inserted.PrecioItemProforma,
    inserted.CantidadItemProforma,
    inserted.FechaCreacion,
    inserted.FechaModificacion INTO @Inserted
VALUES (
        @ID_Proforma,
        29, -- Activo
        @NombreItemProforma,
        @DescripcionItemProforma,
        @PrecioItemProforma,
        @CantidadItemProforma,
        GETDATE(),
        NULL
    );
-- 1) Ítem insertado + subtotal
SELECT I.*,
    (I.PrecioItemProforma * I.CantidadItemProforma) AS SubtotalCalculado,
    E.Nombre AS EstadoNombre
FROM @Inserted I
    LEFT JOIN UTIL.TBL_ESTADOS E ON E.ID_Estado = I.ID_Estado;
-- 2) Alerta
SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'B040';
END
GO