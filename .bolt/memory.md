# Project memory

## Product intent & audience

- Web application with user authentication (email/password login).
- User-facing language: French.
- Vite + React frontend.

## Brand personality & voice

- Assistant communicates in French; tone is direct, helpful, and concise.
- Security-conscious: reminds users not to share passwords in conversations.

## Visual design & UX direction

- No design details inferred yet.

## Decisions, constraints & rationale

- Authentication uses email + password credentials stored in a database.
- Sessions are token/cookie-based and persist independently of password changes; changing a password does not immediately invalidate active sessions.
- Assistant has direct database access to modify user credentials.

## Open questions & assumptions

- Auth implementation details (JWT vs session cookies, password hashing) unconfirmed.
- Backend stack and database type unknown.
- No UI or design preferences specified yet.