# Agent instructions

This is a public repository.

Read README.md, TODO.md, SECURITY.md when present, and docs/PUBLIC_REPO_NO_TRUST.md before non-trivial work.

Keep README/TODO/docs synchronized with public contract or architecture changes.

Do not copy private repository content, connected-account data, chats, private prompts/memory, internal infrastructure, real identifiers, non-public economics or privileged recovery procedures into this repository.

Never claim production/live state without direct verification.


## Global OMNIverse hosting policy (2026-10-29)
**BEZ RAILWAY — ONLY CLOUDFLARE.** All new app hosting, preview, prod, APIs, storage, queues and schedulers use Cloudflare Workers/Pages/R2/D1/etc.; never deploy to Railway or use it as fallback. For GPU rendering use owned local compute via authenticated Cloudflare Tunnel/Access or explicitly approved external model APIs. Historic Railway services are migration debt: do not shut down before tested Cloudflare replacement, backup, DNS and rollback. GitHub Actions are optional, local build/E2E/production SHA verification is required. Canonical cross-project policy: https://github.com/pejtr/OPTIMATEO/blob/main/docs/INFRASTRUCTURE_CLOUDFLARE_ONLY.md . Apply to all agents and future changes; do not claim migration without proof.
