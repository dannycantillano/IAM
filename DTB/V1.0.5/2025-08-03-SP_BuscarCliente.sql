USE [IAMDB]
GO
IF NOT EXISTS (
    SELECT 1
    FROM sys.procedures
    WHERE name = 'SP_buscarCliente'
        AND SCHEMA_ID('CORE') = schema_id
) BEGIN EXEC(
    'CREATE PROCEDURE CORE.SP_buscarCliente AS BEGIN SET NOCOUNT ON; END'
);
END
GO -- =============================================
    -- Autor: Danny Cantillano Arias
    -- Fecha creación: 15/08/2025
    -- Descripción: Busca clientes asociados a un usuario con filtros opcionales por nombre, apellido, teléfono y correo.
    -- =============================================
    ALTER PROCEDURE [CORE].[SP_buscarCliente] @NombreCliente NVARCHAR(100) = N'',
    @ApellidoCliente NVARCHAR(100) = N'',
    @TelefonoCliente NVARCHAR(30) = NULL,
    @CorreoCliente NVARCHAR(100) = NULL,
    @ID_Usuario INT AS BEGIN
SET NOCOUNT ON;
-- Normalizar entradas
SET @NombreCliente = LTRIM(RTRIM(ISNULL(@NombreCliente, N'')));
SET @ApellidoCliente = LTRIM(RTRIM(ISNULL(@ApellidoCliente, N'')));
SET @TelefonoCliente = LTRIM(RTRIM(ISNULL(@TelefonoCliente, N'')));
SET @CorreoCliente = LTRIM(RTRIM(ISNULL(@CorreoCliente, N'')));
-- Búsqueda segura por usuario + filtros opcionales
SELECT [ID_Cliente],
    [ID_Usuario],
    [NombreCliente],
    [ApellidoCliente],
    [TelefonoCliente],
    [CorreoCliente]
FROM [CORE].[TBL_CLIENTES] C
WHERE C.ID_Usuario = @ID_Usuario
    AND (
        (
            @NombreCliente <> N''
            AND C.NombreCliente LIKE N'%' + @NombreCliente + N'%'
        )
        OR (
            @ApellidoCliente <> N''
            AND C.ApellidoCliente LIKE N'%' + @ApellidoCliente + N'%'
        )
        OR (
            @TelefonoCliente <> N''
            AND C.TelefonoCliente LIKE N'%' + @TelefonoCliente + N'%'
        )
        OR (
            @CorreoCliente <> N''
            AND C.CorreoCliente LIKE N'%' + @CorreoCliente + N'%'
        )
    );
IF @@ROWCOUNT = 0 BEGIN
SELECT [COD_ALERTA],
    [Nombre],
    [Mensaje],
    [Tipo]
FROM [UTIL].[TBL_ALERTAS]
WHERE [COD_ALERTA] = 'A0022';
END
END
GO