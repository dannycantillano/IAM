USE [IAMDB]
GO
--Creación del tipo de dato para carga masciva de items de ODS desde items de proforma (Table Value Parameter)
CREATE TYPE CORE.TYPE_ItemsProforma AS TABLE
(
    NombreItemOrdenServicio      VARCHAR(100)   NOT NULL,
    Descripcion VARCHAR(255)       NULL,
    Monto       DECIMAL(16,3)  NOT NULL,
    Cantidad    DECIMAL(16,3)      NULL,
    Avance      INT                NULL  
);
GO