# OmsimSocial Core v2 API

Base URL: `http://localhost:8000/api/v1`

Auth: Bearer token on all protected routes.
```
Authorization: Bearer <token>
```

## Auth
POST `/auth/register`
```json
{
  "name": "Ari Lane",
  "username": "ari",
  "email": "ari@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

POST `/auth/login`
```json
{
  "identifier": "ari@example.com",
  "password": "password123"
}
```

POST `/auth/logout`

GET `/me`

## Connections
POST `/connections/invite`
```json
{ "method": "invite", "type": "friend", "level": "acquaintance" }
```

POST `/connections/accept-invite`
```json
{ "code": "AB12CD34" }
```

POST `/connections/handshake/initiate`

POST `/connections/handshake/confirm`
```json
{ "code": "HAND1234" }
```

GET `/connections`

PATCH `/connections/{id}`
```json
{ "type": "family", "level": "inner", "muted": false }
```

POST `/connections/{id}/block`

## Circles
POST `/circles`
```json
{ "name": "Family", "invite_only": true, "prompt_frequency": "weekly" }
```

GET `/circles`

GET `/circles/{id}`

POST `/circles/{id}/members`
```json
{ "user_id": 2, "role": "member" }
```

DELETE `/circles/{id}/members/{userId}`

PATCH `/circles/{id}`
```json
{ "name": "Work Circle", "prompt_frequency": "daily" }
```

POST `/circles/{id}/prompts`
```json
{ "prompt": "What surprised you today?" }
```

GET `/circles/{id}/feed`

## Memories
POST `/memories`
```json
{
  "scope": "circle",
  "circle_id": 1,
  "body": "First memory in our circle.",
  "tags": [2, 3]
}
```

GET `/memories/{id}`

DELETE `/memories/{id}`

POST `/memories/{id}/media` (multipart)
```
type=image|video|voice
file=<binary>
```

POST `/memories/{id}/react`
```json
{ "emoji": ":heart:" }
```

POST `/memories/{id}/adopt`
```json
{ "note": "Saving this.", "visibility": "shared" }
```

## Vault
GET `/vault`

GET `/vault/adopted`

GET `/vault/on-this-day`

POST `/time-capsules`
```json
{
  "unlock_at": "2026-02-01T10:00:00Z",
  "scope": "private",
  "title": "One year later",
  "memory_ids": [1, 2]
}
```

GET `/time-capsules`

GET `/time-capsules/{id}`

## Inbox & Messages
GET `/inbox/adoption-notes`

GET `/inbox/requests`

POST `/messages`
```json
{ "recipient_id": 2, "body": "Hey there!" }
```

GET `/messages/thread/{userId}`
