USE [IAMDB]
GO
 IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_registrarTarifa'
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_registrarTarifa AS BEGIN SET NOCOUNT ON; END'
    )
END
GO -- =============================================
    -- Autor: David Artavia Arias
    -- Fecha: 13/08/2025
    -- Descripción: Crea una tarifa y devuelve el registro insertado
    -- Estados (TBL_TARIFAS): 23=Activo, 24=Inactivo, 25=Eliminado
    -- =============================================
    ALTER PROCEDURE CORE.SP_registrarTarifa 
    @ID_Negocio INT,
    @NombreTarifa VARCHAR(100),
    @DescripcionTarifa NVARCHAR(255) = NULL,
    @PrecioTarifa DECIMAL(16, 3) AS BEGIN
SET NOCOUNT ON;
DECLARE @Inserted TABLE(
        ID_Tarifa INT,
        ID_Negocio INT,
        ID_Estado INT,
        NombreTarifa VARCHAR(100),
        DescripcionTarifa NVARCHAR(255),
        PrecioTarifa DECIMAL(16, 3),
        FechaCreacion DATETIME,
        FechaModificacion DATETIME
    );
INSERT INTO CORE.TBL_TARIFAS (
        ID_Negocio,
        ID_Estado,
        NombreTarifa,
        DescripcionTarifa,
        PrecioTarifa,
        FechaCreacion,
        FechaModificacion
    ) OUTPUT inserted.ID_Tarifa,
    inserted.ID_Negocio,
    inserted.ID_Estado,
    inserted.NombreTarifa,
    inserted.DescripcionTarifa,
    inserted.PrecioTarifa,
    inserted.FechaCreacion,
    inserted.FechaModificacion INTO @Inserted
VALUES (
        @ID_Negocio,
        23, -- Activo
        @NombreTarifa,
        @DescripcionTarifa,
        @PrecioTarifa,
        GETDATE(),
        NULL
    );
-- 1) Registro insertado (solo EstadoNombre)
SELECT I.*,
    E.Nombre AS EstadoNombre
FROM @Inserted I
    LEFT JOIN UTIL.TBL_ESTADOS E ON E.ID_Estado = I.ID_Estado;
-- 2) Alerta
SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'B036';
END
GO