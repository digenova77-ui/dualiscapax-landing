# Base cases — halt here

code: scripts/dclm_base_cases.py

- HTTP 200 → cite
- 308/301 to self → hole self_redirect
- 404 → hole not_on_mouth
- cite ping fail → hole cite_down
- title miss → anomaly title_mismatch
- PHI / minor / token-ask → veto

No hop 3 content. After halt, write the verdict. Do not invent the next node.
