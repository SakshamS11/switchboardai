# Control Plane Reference Inventory

This inventory records how the previous Control Plane mockup was used as a selective UX reference. The canonical Switchboard AI frontend is greenfield and does not inherit the old route structure, state model, or feature inventory.

| Previous pattern | What it communicated | Still relevant? | Decision | New Switchboard equivalent | Reason |
| --- | --- | --- | --- | --- | --- |
| Dark restrained sidebar | Stable enterprise navigation and brand presence | Yes | Reuse conceptually | Dark shell grouped around AI Applications, Control, Operate | Strong brand continuity without copying old page inventory |
| Sovereign Violet color system | Premium enterprise identity | Yes | Reuse conceptually | CSS variables for violet, cyan, porcelain, graphite, and status colors | Brand remains suitable |
| Compact KPI cards | Fast operational scanning | Yes | Reuse conceptually | Estate, application, infrastructure, cost, and evidence cards | Helps admins assess health quickly |
| Attention queues | Triage of active operational problems | Yes | Adapt | Health & Operations incident queue | Immediate response belongs in operations, not recommendations |
| Server fleet table | Agent connectivity, GPU, VRAM, stack state | Yes | Adapt | Infrastructure targets table | Infrastructure supports AI Applications |
| Workspace registry | Employee-facing AI access surfaces | Yes | Adapt | AI Applications registry | Workspaces become AI Applications deployed as AnythingLLM instances |
| Routing policy table | Decision logic and fallback behavior | Yes | Adapt | Safeguards & Routing registry | Strong fit for Sovereignty Router and gateway policies |
| Audit event rows | Traceability and governance | Yes | Reuse conceptually | Audit & Evidence timeline | Auditability is core |
| Deployment timeline | Confidence in remote operations | Yes | Adapt | Application deployment tab | Focus on AnythingLLM publish and redeploy lifecycle |
| Decorative charts | Visual polish, low signal | Partially | Do not carry forward | Compact native bars only | Charts should support decisions, not dominate |
| Broad old sidebar | Many modules with equal weight | No | Do not carry forward | Smaller app-first navigation | New product must not feel like a reskinned dashboard |
| Compliance-heavy global positioning | Readiness surfaced everywhere | Partially | Adapt | Evidence readiness appears in audit/settings only | Compliance supports, but does not dominate, the product |
| Infrastructure-first onboarding | Start from servers before value | Partially | Adapt | Application-first flow with infrastructure readiness | AI Applications are the central object |
| Recommendations Center prominence | Treated planning as urgent work | No | Do not carry forward | Resource/cost planning remains secondary | Incidents and approvals own immediate action |
