USE [IAMDB]
GO

CREATE TABLE CORE.TBL_TARIFAS
(
    ID_Tarifa INT IDENTITY(1,1) NOT NULL, --PK
    ID_Negocio INT NOT NULL, --FK (CORE.TBL_NEGOCIOS)
    ID_Estado INT NOT NULL, --FK (UTIL.TBL_ESTADOS)  Ej: Activo/Inactivo
    NombreTarifa VARCHAR(100) NOT NULL,
    DescripcionTarifa NVARCHAR(255) NULL,
    PrecioTarifa DECIMAL(16,3) NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE() NOT NULL,
    FechaModificacion DATETIME NULL
)
GO

CREATE TABLE CORE.TBL_PROFORMAS
(
    ID_Proforma INT IDENTITY(1,1) NOT NULL, --PK
    ID_Negocio INT NOT NULL,   --FK (CORE.TBL_NEGOCIOS)
    ID_Cliente INT NULL,       --FK (CORE.TBL_CLIENTES)
    ID_Estado INT NOT NULL,    --FK (UTIL.TBL_ESTADOS)  Ej: Borrador/Aprobada/Anulada
    DescuentoProforma DECIMAL(16, 3) NULL DEFAULT(0),
    DescuentoPorcentualProforma BIT NULL, -- true = porcentual, false = monto fijo
    ImpuestoPorcentualProforma DECIMAL(5, 2) NULL DEFAULT(0),
    FechaProforma DATETIME DEFAULT GETDATE() NOT NULL,
    FechaVencimiento DATETIME NULL,
    ObservacionProforma NVARCHAR(255) NULL,
    FechaModificacion DATETIME NULL
)
GO

CREATE TABLE CORE.TBL_PROFORMAS_ITEMS (
    ID_ProformaItem INT IDENTITY(1, 1) NOT NULL,  --PK
    ID_Proforma INT NOT NULL, --FK (CORE.TBL_PROFORMAS)
    ID_Estado INT NOT NULL, --FK (UTIL.TBL_ESTADOS) 
    NombreItemProforma VARCHAR(100) NOT NULL,
    DescripcionItemProforma NVARCHAR(255) NULL,
    PrecioItemProforma DECIMAL(16, 3) NOT NULL,
    CantidadItemProforma DECIMAL(16, 3) NOT NULL DEFAULT(1),
    FechaCreacion DATETIME DEFAULT GETDATE() NOT NULL,
    FechaModificacion DATETIME NULL
)
GO