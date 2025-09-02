USE [IAMDB]
GO

/****** Object:  StoredProcedure [CORE].[SP_actualizarItemOrdenDeServicio]    Script Date: 30/8/2025 12:19:08 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Autor: Danny Cantillano
-- Fecha: 18/06/2025
-- Descripci�n: Guarda un nuevo item a una orden de servicio previamente creada (A un item de la orden de servicio no se le puede cambiar
-- la orden de servicio. se puede eliminar y crear una nueva en otro lugar)
-- =============================================
ALTER PROCEDURE [CORE].[SP_actualizarItemOrdenDeServicio]
	@ID_ItemOrdenServicio INT,
    @NombreItemOrdenServicio VARCHAR(100),
    @Descripcion VARCHAR(255) = NULL,
	@Monto DECIMAL(16,3),
	@Avance int,
	@ID_Estado int,
	@Cantidad DECIMAL(16,3)
AS
BEGIN

	UPDATE [CORE].[TBL_ITEMS_ORDEN_SERVICIO]
	   SET [ID_Estado] = @ID_Estado
		  ,[NombreItemOrdenServicio] = @NombreItemOrdenServicio
		  ,[Descripcion] = @Descripcion
		  ,[Monto] = @Monto
		  ,[Avance] = @Avance
		  ,Cantidad = @Cantidad
	 WHERE ID_ItemOrdenServicio = @ID_ItemOrdenServicio



	-- Alerta de �xito
	SELECT [COD_ALERTA], [Nombre], [Mensaje], [Tipo]
	FROM [UTIL].[TBL_ALERTAS]
	WHERE [COD_ALERTA] = 'A027';
END
GO


