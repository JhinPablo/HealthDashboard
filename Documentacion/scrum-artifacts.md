# Scrum Artifacts

## Roles
- Product Owner: define alcance del entregable y validacion academica.
- Scrum Master: seguimiento del sprint, Definition of Done y remocion de bloqueos.
- Development Team: implementacion full stack, documentacion y pruebas.

## Sprint Backlog
| ID | Historia | Estado |
| --- | --- | --- |
| US-01 | Crear pacientes FHIR-lite | Done |
| US-02 | Registrar observaciones | Done |
| US-03 | Doble API key para integraciones | Done |
| US-04 | Portal restringido del paciente | Done |
| US-05 | Paginacion `limit/offset` | Done |
| US-06 | Cifrado de datos sensibles | Done |
| US-07 | Rate limiting | Done |
| US-08 | Dashboard general del doctor | Done |
| US-09 | Dashboard del paciente | Done |
| US-10 | Gestion de usuarios/API keys | Done |

## Definition of Ready
- Historia vinculada a un endpoint, dashboard o requisito no funcional concreto.
- Reglas de rol y permisos definidas.
- Datos necesarios identificados en PostgreSQL.

## Definition of Done
- Cambio implementado y compilando.
- Validacion automatizada o manual documentada.
- Swagger/Postman o UI actualizados cuando corresponde.
- Documentacion tecnica y Scrum ajustada.

## Riesgos registrados
- Dependencia de credenciales reales en Render.
- Rate limiting en memoria no escala horizontalmente.
- El rol `doctor` separado se posterga para una siguiente iteracion.
