# Switchboard AI

Canonical frontend for Switchboard AI, an enterprise AI control plane for governing where AI runs, who can use it, what company data it can access, what it costs, and how every AI action is audited.

This app is a greenfield implementation centered on **AI Applications**. Each application represents a governed employee-facing AI experience powered by a dedicated AnythingLLM instance deployed on customer infrastructure.

## Run

From the repository root:

```powershell
npm install
npm run switchboard:dev
```

From `apps/switchboard`:

```powershell
npm install
npm run dev
```

For Vercel, set the root directory to:

```text
apps/switchboard
```

## Principles

- Switchboard AI is the admin control plane, not the employee chat UI.
- Employee chat is powered by isolated AnythingLLM instances at team subdomains.
- AI content stays on customer infrastructure. Switchboard AI receives metadata only.
- Agent operations are typed, schema-validated, and allowlisted.
- ISO/IEC 42001 features support readiness preparation only, not certification.
