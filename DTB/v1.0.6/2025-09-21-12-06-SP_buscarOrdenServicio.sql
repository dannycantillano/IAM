USE [IAMDB]
GO

/****** Object:  StoredProcedure [CORE].[SP_buscarOrdenServicio]    Script Date: 21/9/2025 12:11:05 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


ALTER PROCEDURE [CORE].[SP_buscarOrdenServicio]
    @ReferenciaJSON   NVARCHAR(MAX)       = NULL,
    @NombreCliente    VARCHAR(100)       = NULL,
    @ApellidoCliente  VARCHAR(100)       = NULL,
    @CorreoCliente    NVARCHAR(50)       = NULL,
    @TelefonoCliente  VARCHAR(15)        = NULL,
    @ID_OrdenServicio INT                = NULL,
    @ID_Negocio       INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        O.[ID_OrdenServicio],
        O.[ID_Cliente],
        O.[ID_Negocio],
        O.[ID_Estado],
        O.[FechaOrdenServicio],
        O.[FechaEstimadaEntrega],
        O.[FechaInicio],
        O.[FechaFinal],
        O.[FechaEntrega],
        O.[ReferenciaJSON],
        O.[NotaOrdenServicio],
        C.[ID_Cliente],
        C.[ID_Usuario],
        C.[NombreCliente],
        C.[ApellidoCliente],
        C.[TelefonoCliente],
        C.[CorreoCliente],
        E.Nombre AS EstadoNombre
    FROM CORE.TBL_ORDENES_SERVICIO AS O
    INNER JOIN CORE.TBL_CLIENTES      AS C ON O.ID_Cliente = C.ID_Cliente
    INNER JOIN UTIL.TBL_ESTADOS       AS E ON O.ID_Estado  = E.ID_Estado
    WHERE 
        O.ID_Negocio = @ID_Negocio
		AND O.ID_Estado != 10
        AND (
            -- 1) JSON: al menos un par no vac?o de @ReferenciaJSON coincide parcialmente
            (
                @ReferenciaJSON IS NOT NULL
                AND EXISTS (
                    SELECT 1
                    FROM OPENJSON(@ReferenciaJSON)
                         WITH (
                           Nombre NVARCHAR(100) '$.Nombre',
                           Valor  NVARCHAR(100) '$.Valor'
                         ) AS J_Busq
                    WHERE 
                        ISNULL(LTRIM(RTRIM(J_Busq.Valor)), '') <> ''
                        AND EXISTS (
                            SELECT 1
                            FROM OPENJSON(O.ReferenciaJSON)
                                 WITH (
                                   Nombre NVARCHAR(100) '$.Nombre',
                                   Valor  NVARCHAR(100) '$.Valor'
                                 ) AS J_Fila
                            WHERE 
                                J_Fila.Nombre = J_Busq.Nombre
                                AND J_Fila.Valor LIKE '%' + J_Busq.Valor + '%'
                        )
                )
            )
            OR
            -- 2) NombreCliente (si se pas?)
            (
                @NombreCliente IS NOT NULL
                AND C.NombreCliente LIKE '%' + @NombreCliente + '%'
            )
            OR
            -- 3) ApellidoCliente (si se pas?)
            (
                @ApellidoCliente IS NOT NULL
                AND C.ApellidoCliente LIKE '%' + @ApellidoCliente + '%'
            )
            OR
            -- 4) ID_OrdenServicio (si se pas?)
            (
                @ID_OrdenServicio IS NOT NULL
                AND CONVERT(VARCHAR(10), O.ID_OrdenServicio) LIKE '%' + CONVERT(VARCHAR(10), @ID_OrdenServicio) + '%'
            )
            OR
            -- 5) CorreoCliente (si se pas?)
            (
                @CorreoCliente IS NOT NULL
                AND C.CorreoCliente LIKE '%' + @CorreoCliente + '%'
            )
            OR
            -- 6) TelefonoCliente (si se pas?)
            (
                @TelefonoCliente IS NOT NULL
                AND C.TelefonoCliente LIKE '%' + @TelefonoCliente + '%'
            )
        );

		SELECT [COD_ALERTA],[Nombre],[Mensaje],[Tipo] FROM [UTIL].[TBL_ALERTAS] WHERE [COD_ALERTA] = 'A0025'
END
GO


