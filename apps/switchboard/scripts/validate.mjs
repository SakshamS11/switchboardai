import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/dashboard/layout.tsx",
  "app/dashboard/page.tsx",
  "app/dashboard/applications/page.tsx",
  "app/dashboard/applications/[id]/page.tsx",
  "app/dashboard/infrastructure/page.tsx",
  "app/dashboard/infrastructure/[id]/page.tsx",
  "app/dashboard/stacks/page.tsx",
  "app/dashboard/model-catalog/page.tsx",
  "app/dashboard/safeguards/page.tsx",
  "app/dashboard/knowledge/page.tsx",
  "app/dashboard/agents/page.tsx",
  "app/dashboard/teams/page.tsx",
  "app/dashboard/operations/page.tsx",
  "app/dashboard/compliance/page.tsx",
  "app/dashboard/resource-planner/page.tsx",
  "app/dashboard/cost-capacity/page.tsx",
  "app/dashboard/audit/page.tsx",
  "app/dashboard/settings/page.tsx",
  "app/dashboard/documentation/page.tsx",
  "lib/mock-data.ts",
  "docs/CONTROL_PLANE_REFERENCE_INVENTORY.md"
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`Missing required files:\n${missing.join("\n")}`);
  process.exit(1);
}

const mockData = readFileSync("lib/mock-data.ts", "utf8");
for (const term of ["AIApplication", "Managed workspace chat", "Sovereignty Router", "Falcon", "vLLM"]) {
  if (!mockData.includes(term)) {
    console.error(`Missing product term in mock data: ${term}`);
    process.exit(1);
  }
}

console.log("Switchboard AI structure validated.");
