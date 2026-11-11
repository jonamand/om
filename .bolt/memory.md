# Project memory

## Product intent & audience

- Web application with user authentication (email/password login).
- User-facing language: French.
- Vite + React frontend.
- App includes navigation, cards, forms, animations, a video player, and an admin space.

## Brand personality & voice

- Assistant communicates in French; tone is direct, helpful, and concise.
- Security-conscious: reminds users not to share passwords in conversations.

## Visual design & UX direction

- Global dark theme applied site-wide (A to Z).
- Backgrounds: graphite black; surfaces: dark gray.
- Primary actions (buttons, links): electric blue.
- Secondary elements: steel blue.
- Text: white and blue-gray for readability.
- Status colors: green/yellow replaced with blue variants; red reserved strictly for errors and important alerts.
- Components harmonized: navigation, cards, forms, animations, video player, admin table.
- Scrollbars styled to match palette.
- Avoid residual purple/pink hues (legacy theme).

## Decisions, constraints & rationale

- Authentication uses email + password credentials stored in a database.
- Sessions are token/cookie-based and persist independently of password changes; changing a password does not immediately invalidate active sessions.
- Assistant has direct database access to modify user credentials.
- Palette migration touched shared styles and admin space; no data or existing functionality modified.
- Build/compilation validated after palette change.

## Open questions & assumptions

- Auth implementation details (JWT vs session cookies, password hashing) unconfirmed.
- Backend stack and database type unknown.
- Exact hex values for the palette not yet captured; directions inferred from design image and assistant implementation.