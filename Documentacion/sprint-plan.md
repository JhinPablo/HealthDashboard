# Sprint 1 Plan (1 semana)

## Sprint Goal
Disponer un MVP funcional extremo a extremo, listo para Render, demostrable con Swagger, Postman y una web con login y dashboards por rol.

## Tareas
1. Configurar monorepo `NestJS + Next.js`.
2. Modelar tablas `users`, `api_keys`, `patients`, `observations`.
3. Implementar login `JWT` para web y doble API key para integraciones.
4. Implementar RBAC para `doctor_admin` y `patient`.
5. Implementar cifrado de `identification_doc` y `medical_summary`.
6. Implementar `Patient` y `Observation` con paginacion `limit/offset`.
7. Construir dashboard clinico del medico y portal personal del paciente.
8. Documentar despliegue, backlog, arquitectura, diagramas y coleccion Postman.

## Definition of Done
- Build de API y web sin errores.
- Pruebas unitarias base del backend en verde.
- Swagger accesible con endpoints documentados.
- Dashboard web muestra informacion distinta segun el rol autenticado.
- Documentacion del repo alineada al stack real.
