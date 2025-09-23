USE [IAMDB]
GO

/****** Object:  StoredProcedure [CORE].[SP_obtenerClientes]    Script Date: 21/9/2025 12:21:28 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

    ALTER PROCEDURE [CORE].[SP_obtenerClientes] @ID_Usuario INT AS BEGIN
SET NOCOUNT ON;
SELECT C.ID_Cliente,
    C.ID_Usuario,
    C.ID_Estado,
    E.Nombre AS EstadoNombre,
    C.NombreCliente,
    C.ApellidoCliente,
    C.TelefonoCliente,
    C.CorreoCliente
FROM [CORE].[TBL_CLIENTES] C
    INNER JOIN [UTIL].[TBL_ESTADOS] E ON C.ID_Estado = E.ID_Estado
WHERE C.ID_Usuario = @ID_Usuario
AND C.ID_Estado != 17
ORDER BY C.ID_Cliente DESC;
-- Alerta de éxito
SELECT [COD_ALERTA],
    [Nombre],
    [Mensaje],
    [Tipo]
FROM [UTIL].[TBL_ALERTAS]
WHERE [COD_ALERTA] = 'B030';
-- "Clientes obtenidos correctamente"
END
GO


