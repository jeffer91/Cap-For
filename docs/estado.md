# Mapa documental inicial · Cap-For

**Documentos revisados y utilizados como referencia:**

- UGPA-PRO-134, acuerdo de patrocinio de capacitación: 7 ejemplos. Código RG I2 según manual, diferenciando código individual mensual. PDF individual y masivo.
- Acuerdo de formación institucional: plantilla nueva sin ejemplos históricos, con portada y firmas físicas.
- UGPA-PRO-251, plan individual de formación y capacitación: 7 ejemplos. Un plan por docente y período; apartados personales, capacitación y formación.
- UGPA-PRO-251, reporte individual de resultados: 12 ejemplos de 17 a 21 páginas. Introducción, objetivos, metodología, resultados de capacitación, formación, análisis integrado y síntesis global.

## Funciones existentes (v0.2.0)
- Administración local de docentes por cédula, con estado activo/inactivo y rol coordinador.
- Importación de PDF al almacén local privado de Electron.
- Clasificación por tipo y mes, consulta y cambio manual de estado.
- Descarga por PDF; ZIP de un docente; ZIP de los documentos filtrados; ZIP de TODOS los documentos.
- Índice JSON dentro de los ZIP exportados.

## Funciones futuras (NO implementadas)
- Firebase: proyecto previsto cap-form-1c7c5. Falta habilitar autenticación/autorización y definir reglas.
- Encuesta conjunta de detección de necesidades, con separación de los documentos de capacitación y formación.
- Formularios de docentes y capacitadores, GitHub Pages y carga de certificados.
- Generación automática de PDF con plantillas institucionales, numeración mensual con reserva transaccional y reemisión administrativa.
- Consolidación de calificaciones y reportes de resultados automatizados.
- Cierre académico, satisfacción, evaluación de impacto a 60 días y reportes institucionales.

## Reglas de negocio por implementar
- Solo el administrador modifica respuestas y documentos.
- Los inactivos se excluyen de indicadores actuales y no acceden al portal; los PDF históricos permanecen localmente.
- Las capacitaciones canceladas desaparecen del plan individual vigente; su registro de administración se conserva.
- Secuencia independiente por tipo documental y mes de elaboración, con bloqueo de número tras la emisión y reasignación solo administrativa.
- Coordinadores preferentemente al final del orden de firmas, para flexibilidad de reemplazo.
- Las firmas de los PDF institucionales irán únicamente en portada.
- Nunca publicar PDF privados de docentes ni credenciales de servicio en GitHub Pages.
