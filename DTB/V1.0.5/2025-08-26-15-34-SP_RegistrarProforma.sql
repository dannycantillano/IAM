USE [IAMDB];
GO -- Stub: si no existe, créalo para poder ALTER sin fallar
    IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_registrarProforma'
            AND schema_id = SCHEMA_ID('CORE')
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_registrarProforma AS BEGIN SET NOCOUNT ON; END'
    );
END
GO -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 26/08/2025
    -- Descripción: Crea proforma con estado por defecto 26=Borrador
    --              y registra descuento/impuesto. Devuelve el insert.
    --              (26=Borrador, 27=Aprobada, 28=Anulada)
    -- =============================================
    ALTER PROCEDURE [CORE].[SP_registrarProforma] 
    @ID_Negocio INT,
    @ID_Cliente INT = NULL,    -- opcional (0 se trata como NULL)
    @ID_Estado INT = 26,    -- si NULL => 26 (Borrador)
    @ObservacionProforma NVARCHAR(255) = NULL,
    @FechaVencimiento DATETIME = NULL,  
    @DescuentoProforma DECIMAL(16, 3) = 0,    
    @DescuentoPorcentualProforma BIT = NULL,
    @ImpuestoPorcentualProforma DECIMAL(5, 2) = 0 
    AS BEGIN
SET NOCOUNT ON;
-- Normalizaciones
IF (@ID_Cliente = 0)
SET @ID_Cliente = NULL;
DECLARE @Estado INT = ISNULL(@ID_Estado, 26);
IF (
    @FechaVencimiento IS NOT NULL
    AND @FechaVencimiento < '1753-01-01'
)
SET @FechaVencimiento = NULL;
DECLARE @Inserted TABLE(
        ID_Proforma INT,
        ID_Negocio INT,
        ID_Cliente INT NULL,
        ID_Estado INT,
        DescuentoProforma DECIMAL(16, 3) NULL,
        DescuentoPorcentualProforma BIT NULL,
        ImpuestoPorcentualProforma DECIMAL(5, 2) NULL,
        FechaProforma DATETIME,
        FechaVencimiento DATETIME,
        ObservacionProforma NVARCHAR(255),
        FechaModificacion DATETIME
    );
INSERT INTO CORE.TBL_PROFORMAS (
        ID_Negocio,
        ID_Cliente,
        ID_Estado,
        DescuentoProforma,
        DescuentoPorcentualProforma,
        ImpuestoPorcentualProforma,
        FechaProforma,
        FechaVencimiento,
        ObservacionProforma,
        FechaModificacion
    ) OUTPUT inserted.ID_Proforma,
    inserted.ID_Negocio,
    inserted.ID_Cliente,
    inserted.ID_Estado,
    inserted.DescuentoProforma,
    inserted.DescuentoPorcentualProforma,
    inserted.ImpuestoPorcentualProforma,
    inserted.FechaProforma,
    inserted.FechaVencimiento,
    inserted.ObservacionProforma,
    inserted.FechaModificacion INTO @Inserted
VALUES (
        @ID_Negocio,
        @ID_Cliente,
        26, -- por defecto 26=Borrador
        @DescuentoProforma,
        @DescuentoPorcentualProforma,
        @ImpuestoPorcentualProforma,
        GETDATE(),
        @FechaVencimiento,
        @ObservacionProforma,
        GETDATE()
    );
SELECT I.*,
    E.Nombre AS EstadoNombre
FROM @Inserted I
    LEFT JOIN UTIL.TBL_ESTADOS E ON E.ID_Estado = I.ID_Estado;
SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'B039';
END
GO