USE [IAMDB];
GO
    /* =========================
     PKs
     ========================= */
    -- CORE.TBL_TARIFAS
    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE [type] = 'PK'
            AND [name] = 'PK_TBL_TARIFAS'
    ) BEGIN
ALTER TABLE CORE.TBL_TARIFAS
ADD CONSTRAINT PK_TBL_TARIFAS PRIMARY KEY CLUSTERED (ID_Tarifa);
END
GO -- CORE.TBL_PROFORMAS
    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE [type] = 'PK'
            AND [name] = 'PK_TBL_PROFORMAS'
    ) BEGIN
ALTER TABLE CORE.TBL_PROFORMAS
ADD CONSTRAINT PK_TBL_PROFORMAS PRIMARY KEY CLUSTERED (ID_Proforma);
END
GO -- CORE.TBL_PROFORMAS_ITEMS
    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE [type] = 'PK'
            AND [name] = 'PK_TBL_PROFORMAS_ITEMS'
    ) BEGIN
ALTER TABLE CORE.TBL_PROFORMAS_ITEMS
ADD CONSTRAINT PK_TBL_PROFORMAS_ITEMS PRIMARY KEY CLUSTERED (ID_ProformaItem);
END
GO

-- CLUSTERED es el que define el orden físico de las filas de la tabla, si no se define, SQL Server crea un índice no clustered por defecto.