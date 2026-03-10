# Product Backlog (Entregable 1)

## Epica 1 - Core interoperable
- US-01: Como `doctor_admin` quiero crear pacientes FHIR-lite para mantener historias estructuradas.
- US-02: Como `doctor_admin` quiero registrar observaciones clinicas para monitoreo longitudinal.
- US-03: Como integracion quiero consumir `Patient` y `Observation` mediante Swagger/Postman con doble API key.
- US-04: Como paciente quiero consultar solo mi propia ficha y mis observaciones.
- US-05: Como sistema quiero paginar listados para escalar a miles de registros.
- US-06: Como organizacion quiero cifrar datos sensibles en PostgreSQL.
- US-07: Como operador quiero limitar el trafico para frenar rafagas abusivas.

## Epica 2 - Portal por rol
- US-08: Como `doctor_admin` quiero un dashboard general con alertas de outliers y vista global de pacientes.
- US-09: Como paciente quiero un dashboard personal con mi historial y tendencia clinica.
- US-10: Como `doctor_admin` quiero crear cuentas de paciente y gestionar API keys.

## Criterios de aceptacion clave
- Todas las historias cumplen formato `FHIR-lite` para `Patient` y `Observation`.
- Un `patient` no puede acceder a un `patient_id` ajeno.
- Consultas masivas usan `limit` y `offset`.
- Campos sensibles nunca quedan en texto plano en PostgreSQL.
- Si se supera el limite por minuto, la API responde `429`.
- Swagger queda accesible y la coleccion Postman cubre login, creacion, consulta y denegacion.
