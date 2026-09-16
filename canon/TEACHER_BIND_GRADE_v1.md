# TEACHER_BIND_GRADE_v1

The point of signup is ease.

If a teacher grants their board mailbox (or the board signs Dualis as an OIDC client),
Dualis looks up:

1. domain → board (`@hpedsb.on.ca` / `@alcdsb.on.ca` / `@limestone.on.ca`)
2. directory / mailbox → school + grade

Dualis does not invent the grade.
Dualis does not scrape staff emails onto git.
Until the mailbox is granted, grade is `awaiting_mailbox`.

Named cite: Sara Kristen Foster, Easthill Grade 2 — David seated that room.

person_door = OAuth PKCE S256 against the board tenant.
awaiting_board_oidc until a board row exists.
