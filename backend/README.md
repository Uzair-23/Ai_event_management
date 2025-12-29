# AI Event Management - Backend

Run locally:

1. Copy `.env.example` to `.env` and fill values.
2. npm install
3. npm run dev

Endpoints:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/events
- POST /api/events (create event - expects `organizerId` from Clerk in body)
- POST /api/tickets/register (user) - send `userId` in body for Clerk users
- GET /api/tickets/me?userId=<id> (fetch user tickets)
- POST /api/ai/generate (organizer)

Note: For production, integrate Clerk server-side verification and secure these endpoints. Currently endpoints accept `organizerId` and `userId` from the frontend (Clerk) for demo purposes.
