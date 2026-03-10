# Salud Digital Interoperable

Primer entregable full stack para interoperabilidad clinica con `NestJS + Next.js`, PostgreSQL en Render, autenticacion hibrida `JWT + doble API key`, recursos `FHIR-lite`, cifrado de datos sensibles y dashboards diferenciados por rol.

## Stack
- Backend: NestJS, TypeORM, Swagger, PostgreSQL
- Frontend: Next.js App Router, TypeScript
- Seguridad: JWT para la web, `X-Access-Key` + `X-Permission-Key` para integraciones
- Datos: `Patient` y `Observation` en formato FHIR-lite

## Estructura
- `apps/api`: API NestJS y Swagger
- `apps/web`: interfaz Next.js con login y dashboards
- `Documentacion`: backlog, sprint, diagramas, Scrum y Postman
- `render.yaml`: blueprint base para despliegue

## Variables de entorno
Usa `.env.example` como referencia. Las claves principales son:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ENCRYPTION_KEY`
- `ACCESS_KEYS`
- `ADMIN_PERMISSION_KEY`
- `MEDICO_PERMISSION_KEY`
- `PACIENTE_PERMISSION_KEY`
- `DEFAULT_DOCTOR_EMAIL`
- `DEFAULT_DOCTOR_PASSWORD`
- `NEXT_PUBLIC_API_URL`

## Instalacion local
```bash
npm install
```

## Ejecucion local
API:
```bash
npm run dev:api
```

Web:
```bash
npm run dev:web
```

URLs locales:
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- Web: `http://localhost:3000`

## Scripts utiles
```bash
npm run build --workspace @saluddigital/api
npm run build --workspace @saluddigital/web
npm run test --workspace @saluddigital/api -- --runInBand
```

## Modelo de acceso
- `doctor_admin`: dashboard general, CRUD clinico y administracion de usuarios/keys
- `patient`: dashboard propio, lectura de su ficha y observaciones personales

La web usa `POST /auth/login` y recibe un `JWT`. Las integraciones externas pueden seguir usando:
- `X-Access-Key`
- `X-Permission-Key`

## Recursos principales
- `POST /auth/login`
- `GET /auth/me`
- `GET|POST|PATCH|DELETE /fhir/Patient`
- `GET|POST|PATCH|DELETE /fhir/Observation`
- `GET /admin/dashboard`
- `GET /admin/users`
- `POST /admin/users/patient`
- `GET|POST /admin/api-keys`

## Seed inicial
En el arranque, la API asegura:
- un usuario `doctor_admin` usando `DEFAULT_DOCTOR_EMAIL` y `DEFAULT_DOCTOR_PASSWORD`
- pares legacy de API keys a partir de `ACCESS_KEYS`, `ADMIN_PERMISSION_KEY`, `MEDICO_PERMISSION_KEY` y `PACIENTE_PERMISSION_KEY`

## Despliegue en Render
- API y web quedan descritos en [render.yaml](render.yaml)
- La API debe apuntar al `DATABASE_URL` de PostgreSQL Render
- La web debe exponer `NEXT_PUBLIC_API_URL` con la URL publica del backend

## Documentacion adicional
- Arquitectura: [architecture.md](Documentacion/architecture.md)
- Scrum: [scrum-artifacts.md](Documentacion/scrum-artifacts.md)
- Coleccion Postman: [SaludDigital-Entregable1.postman_collection.json](Documentacion/postman/SaludDigital-Entregable1.postman_collection.json)
