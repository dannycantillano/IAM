USE [IAMDB]
GO 
IF NOT EXISTS (
    SELECT 1
    FROM sys.procedures
    WHERE name = 'SP_actualizarProforma'
) BEGIN EXEC(
    'CREATE PROCEDURE CORE.SP_actualizarProforma AS BEGIN SET NOCOUNT ON; END'
)
END
GO -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 13/08/2025
    -- Descripción: Actualiza cabecera de proforma y devuelve el registro actualizado
    -- Estados (TBL_PROFORMAS): 26=Borrador, 27=Aprobada, 28=Anulada
    -- =============================================
    ALTER PROCEDURE CORE.SP_actualizarProforma @ID_Proforma INT,
    @ID_Cliente INT = NULL,
    @ID_Estado INT,
    -- 26/27/28
    @ObservacionProforma NVARCHAR(255) = NULL,
    @FechaVencimiento DATETIME = NULL,
    @DescuentoProforma DECIMAL(16, 3),
    @DescuentoPorcentualProforma BIT,
    @ImpuestoPorcentualProforma DECIMAL(5, 2) AS BEGIN
SET NOCOUNT ON;
-- Normalizar: 0 => NULL (no cambiar)
SET @ID_Cliente = NULLIF(@ID_Cliente, 0);
SET @ID_Estado = NULLIF(@ID_Estado, 0);
DECLARE @Updated TABLE(
        ID_Proforma INT,
        ID_Negocio INT,
        ID_Cliente INT,
        ID_Estado INT,
        FechaProforma DATETIME,
        FechaVencimiento DATETIME,
        ObservacionProforma NVARCHAR(255),
        FechaModificacion DATETIME,
        DescuentoProforma DECIMAL(16, 3) NULL,
        DescuentoPorcentualProforma BIT NULL,
        ImpuestoPorcentualProforma DECIMAL(5, 2) NULL
    );
UPDATE CORE.TBL_PROFORMAS
SET ID_Cliente = ISNULL(@ID_Cliente, ID_Cliente),
    ID_Estado = ISNULL(@ID_Estado, ID_Estado),
    ObservacionProforma = ISNULL(@ObservacionProforma, ObservacionProforma),
    FechaVencimiento = ISNULL(@FechaVencimiento, FechaVencimiento),
    FechaModificacion = GETDATE(),
    DescuentoProforma = ISNULL(@DescuentoProforma, DescuentoProforma),
    DescuentoPorcentualProforma = ISNULL(
        @DescuentoPorcentualProforma,
        DescuentoPorcentualProforma
    ),
    ImpuestoPorcentualProforma = ISNULL(
        @ImpuestoPorcentualProforma,
        ImpuestoPorcentualProforma
    ) OUTPUT inserted.ID_Proforma,
    inserted.ID_Negocio,
    inserted.ID_Cliente,
    inserted.ID_Estado,
    inserted.FechaProforma,
    inserted.FechaVencimiento,
    inserted.ObservacionProforma,
    inserted.FechaModificacion,
    inserted.DescuentoProforma,
    inserted.DescuentoPorcentualProforma,
    inserted.ImpuestoPorcentualProforma INTO @Updated
WHERE ID_Proforma = @ID_Proforma;
SELECT U.*,
    E.Nombre AS EstadoNombre
FROM @Updated U
    LEFT JOIN UTIL.TBL_ESTADOS E ON E.ID_Estado = U.ID_Estado;
SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'B045';
END
GO