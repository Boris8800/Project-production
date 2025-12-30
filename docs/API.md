# API

## Base URL
- Production: `https://api.yourdomain.com/v1`

## Swagger
- `https://api.yourdomain.com/docs`

## Health
- `GET /v1/health`

## Auth (scaffold)
- `POST /v1/auth/login`
- `POST /v1/auth/magic-link`
- `POST /v1/auth/refresh`

Note: database-backed user lookup and token rotation will be wired next.
