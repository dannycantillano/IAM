USE [IAMDB]
GO
INSERT INTO [UTIL].[TBL_ALERTAS] ([COD_ALERTA], [Nombre], [Mensaje], [Tipo]) VALUES
('B035', N'Buscar Tarifario', N'Búsqueda de tarifas realizada correctamente', 'I'),
('B036', N'Crear Tarifario', N'Tarifa creada correctamente', 'I'),
('B037', N'Actualizar Tarifario', N'Tarifa actualizada correctamente', 'I'),
('B038', N'Eliminar Tarifario', N'Tarifa eliminada correctamente', 'I'),
('B039', N'Crear Proforma',  N'Proforma creada correctamente', 'I'),
('B040', N'Agregar Proforma Item',  N'Ítem agregado a proforma correctamente', 'I'),
('B041', N'Eliminar Proforma Item',  N'Ítem eliminado de proforma correctamente', 'I'),
('B042', N'Aprobar Proforma',  N'Proforma aprobada correctamente', 'I'),
('B043', N'Actualizar Proforma Item',  N'Ítem de proforma actualizado correctamente', 'I'),
('B044', N'Registrar Proforma',  N'Consulta de proforma realizada correctamente', 'I'),
('B045', N'Actualizar Proforma',  N'Proforma actualizada correctamente', 'I'),
('B046', N'Registrar Tarifario', N'Tarifas obtenidas correctamente', 'I'),
('B047', N'Registrar Proforma',  N'Proformas obtenidas correctamente', 'I'),
('B048', N'Registrar Proforma Item', N'Ítems de proforma obtenidos correctamente', 'I'),
('B049', N'Buscar Proforma', N'Búsqueda de proformas realizada correctamente', 'I');

INSERT INTO [UTIL].[TBL_ESTADOS] ([ID_Estado], [Nombre], [Tabla]) VALUES
(23, 'Activo',    'TBL_TARIFAS'),
(24, 'Inactivo',  'TBL_TARIFAS'),
(25, 'Eliminado', 'TBL_TARIFAS'),
(26, 'Borrador',  'TBL_PROFORMAS'),
(27, 'Aprobado',  'TBL_PROFORMAS'),
(28, 'Anulado',   'TBL_PROFORMAS'),
(29, 'Activo',    'TBL_PROFORMAS_ITEMS'),
(30, 'Eliminado', 'TBL_PROFORMAS_ITEMS'),
(31, 'Eliminado', 'TBL_PROFORMAS');
