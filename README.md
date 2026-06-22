# Switchboard AI Frontend

Canonical greenfield frontend for Switchboard AI.

This repository is intentionally centered on AI Applications: governed employee AI experiences that publish a dedicated, white-labelled AnythingLLM workspace instance on customer-owned infrastructure.

## Product Direction

- AI Applications are the primary operating surface.
- Each application owns a workspace slug, target server, allowed models, knowledge sources, governed agents, routing policy, budget, and employee chat URL.
- Publishing an application configures one isolated AnythingLLM instance per workspace.
- Customer AI content remains on customer infrastructure; Switchboard AI receives operational metadata only.
- The older Control Plane is treated only as a selective visual and UX reference.

## Run Locally

Use the bundled Node runtime or any Node 18+ install:

```bash
npm start
```

Then open the printed local URL.

## Verify

```bash
npm test
```

The current tests cover the application domain model, validation, publishing workflow, routing simulation, and immutability of the workspace slug after publish.

## Deploy

The app is a static frontend and includes `vercel.json` for Vercel hosting. Once connected to Vercel, pushes to the production branch can deploy directly through the Vercel Git integration.
