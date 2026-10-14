# PoetMatrix API

NestJS 12 API for accounts, sessions, and the existing content model. PostgreSQL is accessed through TypeORM. Schema changes go through migrations. `synchronize` is off.

## Layout

- `src/auth` — registration, login, refresh rotation, logout, and password reset
- `src/users` — accounts and role changes
- `src/content` — the existing piece fields: title, genre, save as, writings, plus `author_id`
- `src/common` — validation DTOs, guards' decorators, the exception filter, and access rules
- `src/database/migrations` — SQL migrations that keep existing `contents` rows
- `src/health` — liveness and database readiness

Routes are prefixed with `/api/v1`. Interactive docs are served at `/docs` outside production unless `SWAGGER_ENABLED=true`.

## Authentication

The API issues a JWT access token and an opaque refresh token. Passwords are hashed with Argon2id. The browser never stores these tokens in JavaScript: the Next.js app keeps them in httpOnly cookies and sends `Authorization: Bearer` from the server.

- Access tokens expire after 15 minutes by default and contain only the user id. Every protected request loads the current role from the database.
- Refresh tokens last 7 days, are stored as SHA-256 hashes, and rotate on use. Reuse of a revoked token revokes the whole token family.
- Logout revokes the presented refresh token. Logout-all and a successful password reset revoke every active refresh token.
- Registration accepts only `reader` or `writer`. `superAdmin` cannot be self-assigned.
- Forgotten-password responses do not reveal whether the email exists. In development only, the response includes `developmentResetToken` so the flow can be completed without an email provider. Production does not return the token. Email delivery is not wired up yet.

Roles:

| Role | Content |
| --- | --- |
| anonymous | Read published pieces |
| reader | Read published pieces and their own drafts |
| writer | Create and change their own pieces |
| superAdmin | Read and change every piece, and change other users' roles |

A super admin cannot change their own role or demote the last super admin. Hidden pieces return 404 so callers cannot probe ids.

## Setup

```bash
npm install
cp .env.example .env
```

Fill `.env` with the database settings and a `JWT_ACCESS_SECRET` of at least 32 characters. Do not commit `.env`.

```bash
npm run migration:run
npm run start:dev
```

The API listens on port 4000. Optional `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` create the first super admin when that email does not already exist. They do not reset an existing password.

## Scripts

```bash
npm run start:dev    # watch mode
npm run build
npm run start:prod
npm test
npm run test:e2e
npm run lint
npm run migration:run
npm run migration:revert
```

`migration:revert` drops the auth tables and the `author_id` column. It does not drop `contents`.
