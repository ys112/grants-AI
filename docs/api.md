# API Reference

## Base URL
`/api`

## Authentication (`/api/auth/*`)
Handled by Better Auth.
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-out`

## Grants

### Get All Grants
`GET /api/grants`

Returns a list of all grant opportunities.

**Response:**
```json
[
  {
    "id": "cm...",
    "title": "Community Arts Grant",
    "agency": "NAC",
    "amount": "$50,000",
    "deadline": "2026-03-15T00:00:00.000Z",
    "matchScore": 85,
    "isTracked": false
  }
]
```

### Track a Grant
`POST /api/grants/track`

**Body:**
```json
{
  "grantId": "grant-uuid"
}
```

### Untrack a Grant
`DELETE /api/grants/track`

**Body:**
```json
{
  "grantId": "grant-uuid"
}
```

## User Profile (Pending)

### Update Preferences
`PUT /api/user/preferences`

**Body:**
```json
{
  "interests": ["Arts", "Seniors"],
  "minFunding": 50000
}
```
