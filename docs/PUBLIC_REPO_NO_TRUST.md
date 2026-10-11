# Public Repository NO-TRUST Policy

This repository is public. Treat every committed byte as permanent disclosure.

Before non-trivial work read README, TODO, AGENTS and SECURITY when present.

Never publish secrets, tokens, cookies, recovery material, private user/connected-account data, internal hostnames/IPs/tunnels, real cloud/account/project identifiers, private prompts/memory, non-public commercial terms, proprietary internal scoring/routing logic, privileged recovery procedures, personal filesystem paths, signed temporary URLs, or logs/screenshots containing identifiers.

Use placeholders and public architecture roles.

Keep documentation synchronized in the same PR and distinguish:
`CODE → TESTS/QA → PR → MERGED → DEPLOYED/LIVE`

A merge or green CI run is not production verification.

If sensitive content is ever committed, treat it as exposed; deletion from the current branch does not erase public git history.
