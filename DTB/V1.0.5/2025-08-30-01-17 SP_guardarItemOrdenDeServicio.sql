USE [IAMDB]
GO

/****** Object:  StoredProcedure [CORE].[SP_guardarItemOrdenDeServicio]    Script Date: 30/8/2025 12:16:12 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Autor: Danny Cantillano
-- Fecha: 18/06/2025
-- Descripción: Guarda un nuevo item a una orden de servicio previamente creada
-- =============================================
ALTER PROCEDURE [CORE].[SP_guardarItemOrdenDeServicio]
	@ID_OrdenServicio INT,
    @NombreItemOrdenServicio VARCHAR(100),
    @Descripcion VARCHAR(255),
	@Monto DECIMAL(16,3),
	@Avance int,
	@Cantidad DECIMAL(16,3)
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @ID_Estado INT = 18; -- Estado "Activo" por defecto

	INSERT INTO [CORE].[TBL_ITEMS_ORDEN_SERVICIO]
			   ([ID_OrdenServicio]
			   ,[ID_Estado]
			   ,[NombreItemOrdenServicio]
			   ,[Descripcion]
			   ,[Monto]
			   ,[Avance]
			   ,[Cantidad])
			   	OUTPUT 
				inserted.ID_ItemOrdenServicio,
				inserted.[ID_OrdenServicio],
				inserted.ID_Estado,
				inserted.NombreItemOrdenServicio,
				inserted.Descripcion,
				inserted.Monto,
				inserted.ID_Estado
		 VALUES
			   (@ID_OrdenServicio
			   ,@ID_Estado
			   ,@NombreItemOrdenServicio
			   ,@Descripcion
			   ,@Monto
			   ,@Avance
			   ,@Cantidad)


	-- Alerta de �xito
	SELECT [COD_ALERTA], [Nombre], [Mensaje], [Tipo]
	FROM [UTIL].[TBL_ALERTAS]
	WHERE [COD_ALERTA] = 'A026';
END
GO


