USE [IAMDB]
GO

/****** Object:  StoredProcedure [CORE].[SP_ConsultarClientesPorUsuario]    Script Date: 21/9/2025 12:20:18 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Autor: Danny Cantillano Arias
-- Creación: 04/05/2025
-- Descripción: Procedimiento para consultar clientes por ID_Usuario
-- =============================================
ALTER PROCEDURE [CORE].[SP_ConsultarClientesPorUsuario]
	@ID_Usuario INT
AS
BEGIN
	SELECT [ID_Cliente],
		   [NombreCliente],
		   [ApellidoCliente],
		   [TelefonoCliente],
		   [CorreoCliente]
	  FROM [CORE].[TBL_CLIENTES]
	 WHERE [ID_Usuario] = @ID_Usuario
	 AND ID_Estado != 17
END
GO


