USE [IAMDB]
GO

/****** Object:  StoredProcedure [CORE].[SP_obtenerItemOrdenDeServicio]    Script Date: 30/8/2025 12:23:14 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Autor: Danny Cantillano
-- Fecha: 18/06/2025
-- Descripci�n: Obtiene los items de una orden de servicio
-- =============================================
ALTER PROCEDURE [CORE].[SP_obtenerItemOrdenDeServicio]
	@ID_OrdenServicio INT
AS
BEGIN
	SELECT [ID_ItemOrdenServicio]
		  ,[ID_OrdenServicio]
		  ,ESTADO.[ID_Estado]
		  ,[NombreItemOrdenServicio]
		  ,[Descripcion]
		  ,[Monto]
		  ,[Avance]
		  ,[Cantidad]
		  ,ESTADO.Nombre EstadoNombre
	  FROM [CORE].[TBL_ITEMS_ORDEN_SERVICIO] ITEM
	  INNER JOIN [UTIL].[TBL_ESTADOS] ESTADO ON ITEM.ID_Estado = ESTADO.ID_Estado

	  WHERE ID_OrdenServicio = @ID_OrdenServicio and ITEM.ID_Estado != 19 

	-- Alerta de �xito
	SELECT [COD_ALERTA], [Nombre], [Mensaje], [Tipo]
	FROM [UTIL].[TBL_ALERTAS]
	WHERE [COD_ALERTA] = 'A028';
END
GO


