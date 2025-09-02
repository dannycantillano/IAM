USE [IAMDB]
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE [object_id] = OBJECT_ID(N'[CORE].[TBL_ITEMS_ORDEN_SERVICIO]')
      AND [name] = N'Cantidad'
)
BEGIN
    ALTER TABLE [CORE].[TBL_ITEMS_ORDEN_SERVICIO]
    ADD [Cantidad] DECIMAL(16,3) NOT NULL
        CONSTRAINT DF_TBL_ITEMS_ORDEN_SERVICIO_Cantidad DEFAULT (1);
    PRINT 'Columna [Cantidad] agregada como DECIMAL(16,3) NOT NULL con DEFAULT 1';
END
ELSE
BEGIN
    PRINT 'La columna [Cantidad] ya existe en [CORE].[TBL_ITEMS_ORDEN_SERVICIO].';
END
GO
