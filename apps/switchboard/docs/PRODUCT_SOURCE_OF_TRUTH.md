# Product Source Of Truth

This frontend follows `Switchboard_AI_User_Manual_Final_5585.docx`.

## Canonical product model

- **Admin control plane:** Switchboard AI dashboard for configuring applications, servers, models, policies, budgets, teams, audit events, and evidence readiness.
- **Employee chat interface:** AnythingLLM, deployed as one isolated instance per AI Application at a team subdomain.
- **Customer infrastructure:** model serving, AnythingLLM, AI gateway, vector indexes, Nginx, SSL, and conversation history.
- **Switchboard AI infrastructure:** dashboard, control plane API, metadata, telemetry, cost, latency, health, and audit records.

## Non-negotiables

- Do not build a custom employee chat UI in the admin frontend.
- Do not imply conversation content reaches Switchboard AI.
- Do not allow arbitrary shell command language for agent operations.
- Do not claim ISO/IEC 42001 certification.
- Build around AI Applications, not a copied legacy route map.
