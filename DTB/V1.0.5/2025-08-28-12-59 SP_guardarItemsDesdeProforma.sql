USE [IAMDB];
GO -- Stub: si no existe, créalo para poder ALTER sin fallar
    IF NOT EXISTS (
        SELECT 1
        FROM sys.procedures
        WHERE name = 'SP_guardarItemsDesdeProforma'
            AND schema_id = SCHEMA_ID('CORE')
    ) BEGIN EXEC(
        'CREATE PROCEDURE CORE.SP_guardarItemsDesdeProforma AS BEGIN SET NOCOUNT ON; END'
    );
END
GO -- =============================================
    -- Autor: Danny Cantillano
    -- Fecha: 28/08/2025
    -- Descripción: Esto guarda de forma masciva lo sítems que vienen desde una proforma
    -- =============================================
    ALTER PROCEDURE [CORE].SP_guardarItemsDesdeProforma 
    @ID_OrdenServicio INT,
    @Items CORE.TYPE_ItemsProforma READONLY
    AS BEGIN

INSERT INTO CORE.TBL_ITEMS_ORDEN_SERVICIO
            (ID_OrdenServicio, ID_Estado, NombreItemOrdenServicio, Descripcion, Monto, Avance, Cantidad)
        SELECT
            @ID_OrdenServicio AS ID_OrdenServicio,
			18 AS ID_Estado,
            I.NombreItemOrdenServicio AS NombreItemOrdenServicio,
            I.Descripcion AS Descripcion,
            CAST(ROUND(ISNULL(I.Monto, 0), 3) AS DECIMAL(16,3)) AS Monto,
            I.Avance,
            CAST(ROUND(ISNULL(I.Cantidad, 1), 3) AS DECIMAL(16,3)) AS Cantidad
        FROM @Items AS I;


SELECT COD_ALERTA,
    Nombre,
    Mensaje,
    Tipo
FROM UTIL.TBL_ALERTAS
WHERE COD_ALERTA = 'A031';

END
GO