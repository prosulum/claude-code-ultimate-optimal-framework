// All workspace file generators. Each function takes a config object and returns a string.

import { slugify } from './config.js';

const toTitle = str => str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// The on-disk filename for the local-server infra doc. Must match scaffold.js.
const localServerFile = (config) =>
  (slugify(config.infra.localServerName) || 'local-server') + '.md';

// ─── CLAUDE.md ───────────────────────────────────────────────────────────────

export function generateClaudeMd(config) {
  const { company, departments, products } = config;
  const deptRows = departments.map(d => `│   ├── ${d}/`).join('\n');
  const productRows = products.length
    ? products.map(p => `│   ├── ${p.slug}/`).join('\n')
    : '│   └── (add products as you build them)';

  const navRows = [
    '| **Capture scattered thoughts / voice notes** | Paste here — I will route and update automatically |',
    '| **Create a new project** | Say: "New project: [description]" |',
    '| **Write marketing copy or campaigns** | `departments/marketing/CONTEXT.md` |',
    '| **Work on a sales process or pipeline** | `departments/sales/CONTEXT.md` |',
    '| **Design a client workflow or SOP** | `departments/operations/CONTEXT.md` |',
    ...departments.filter(d => !['marketing','sales','operations'].includes(d)).map(d =>
      `| **${toTitle(d)} work** | \`departments/${d}/CONTEXT.md\` |`
    ),
    ...products.map(p => `| **${p.name} product work** | \`products/${p.slug}/CONTEXT.md\` |`),
  ].join('\n');

  const infraSection = config.infra.hasVps || config.infra.hasLocalServer ? `
## Devices & Sync

| Device | Role | Sync |
|--------|------|------|
| Primary machine | Development & operations | Cloud sync (Dropbox / OneDrive / etc.) |${config.infra.hasVps ? `\n| VPS (${config.infra.vpsHost || 'TBD'}) | Web app deployment | Git only |` : ''}${config.infra.hasLocalServer ? `\n| ${config.infra.localServerName || 'Local Server'} | Always-on automation | Selective sync |` : ''}

---
` : '';

  return `# ${company.name} — Workspace Map

## What This Is

${company.description}${company.tagline ? `\n\n*${company.tagline}*` : ''}

A workspace system for ${company.name}. An agent drops into a workspace, reads its CONTEXT.md, does its work, and exits.

**CONTEXT.md** (top-level) routes you to the right workspace. This file is the map.

---

## Folder Structure

\`\`\`
workspace/
├── CLAUDE.md                       ← You are here (always loaded)
├── CONTEXT.md                      ← Task router
├── PROJECT-REGISTRY.md             ← Index of all active projects
│
├── company/                        ← Evergreen company knowledge
│   ├── CONTEXT.md
│   ├── voice-brand.md              ← Brand voice, tone, messaging rules
│   ├── products.md                 ← Product catalog
│   └── sops/                       ← Internal SOPs (add as created)
│
├── departments/                    ← Department workspaces
${deptRows}
│
├── products/                       ← Product-specific workspaces
${productRows}
│
├── projects/                       ← Time-bounded initiatives
│   └── (auto-created per project)
│
└── _system/                        ← Infrastructure & templates
    ├── CONTEXT.md
    ├── infra/
${config.infra.hasVps ? '    │   ├── vps.md\n' : ''}${config.infra.hasLocalServer ? `    │   └── ${localServerFile(config)}\n` : ''}    └── templates/
        ├── biz-initiative/
        ├── va-workflow/
        └── product-build/
\`\`\`

---

## Quick Navigation

| Want to... | Go here |
|------------|---------|
${navRows}
| **Write or edit a company SOP** | \`company/CONTEXT.md\` |
| **Check or update infrastructure** | \`_system/CONTEXT.md\` |

---

## Active Projects

| Slug | Type | Department | Status | Path |
|------|------|-----------|--------|------|
| (none yet — projects auto-registered here) | | | | |

---

## New Project Creation

When I say **"New project: [description]"**:
1. Parse → infer type (biz-initiative / va-workflow / product-build), department, and a slug
2. Copy the matching template from \`_system/templates/\`
3. Create \`projects/[slug]/\` with the template files
4. Add a row to **Active Projects** above and to \`PROJECT-REGISTRY.md\`
5. Confirm what was created

---

## Naming Conventions

| Content Type | Pattern | Example |
|-------------|---------|---------|
| Project folders | \`[slug]/\` | \`q2-newsletter-campaign/\` |
| Deliverables | \`[slug]-v[n].[ext]\` | \`onboarding-sop-v2.docx\` |
| SOPs | \`sop-[process].md\` | \`sop-client-onboarding.md\` |
| Newsletters | \`[YYYY-MM-DD]-[slug].md\` | \`2026-03-10-launch-week.md\` |
| Social posts | \`[platform]-[slug].md\` | \`linkedin-launch-announce.md\` |

**Statuses:** \`draft\` → \`review\` → \`final\`

---

## Token Rules

**Each workspace is siloed.** Don't load everything.

- Writing copy? → Load \`company/voice-brand.md\`. Skip everything else.
- Department task? → Load that department's CONTEXT.md. Skip other departments.
- Infrastructure work? → Load \`_system/infra/\`. Skip company docs.

The CONTEXT.md files tell you what to load per task. Trust them.

---
${infraSection}
## Update Protocol

The workspace is **self-updating and self-generating**. When given unstructured input (voice notes, brain dumps, scattered thoughts):

### Routing Table

| Information Type | Update These Files |
|-----------------|-------------------|
| Brand voice, tone, audience, messaging | \`company/voice-brand.md\` |
| Product description, features, positioning | \`company/products.md\` |
| How a department functions | \`departments/[dept]/CONTEXT.md\` |
| A business process or repeatable workflow | \`company/sops/sop-[process].md\` (create if new) |
| New product or major tool | \`company/products.md\` + \`products/[name]/CONTEXT.md\` |
| Infrastructure or tech changes | \`_system/infra/\` files |
| New project need | Trigger New Project flow (see above) |

### Steps
1. **Parse** — extract key facts, discard filler words
2. **Route** — identify which file(s) this belongs in
3. **Edit surgically** — fill \`[TBD]\` placeholders, never erase existing content
4. **Propagate** — if update affects other files, update those too
5. **Confirm** — tell user what changed and where
`;
}

// ─── CONTEXT.md (root task router) ───────────────────────────────────────────

export function generateContextMd(config) {
  const { company, departments } = config;
  const deptRows = departments.map(d =>
    `| ${toTitle(d)} work | \`departments/${d}/CONTEXT.md\` | \`company/voice-brand.md\` (if writing) |`
  ).join('\n');

  return `# ${company.name} — Task Router

Read this at the start of every session to find the right workspace.

---

## Task → Workspace

| Task | Load | Also Load |
|------|------|-----------|
| Unstructured voice/text input | Stay here — run Update Protocol | Nothing |
| New project scaffolding | Stay here — run New Project flow | \`_system/templates/\` |
| Company voice / brand | \`company/CONTEXT.md\` | \`company/voice-brand.md\` |
| Product info | \`company/CONTEXT.md\` | \`company/products.md\` |
${deptRows}
| Infrastructure / deployment | \`_system/CONTEXT.md\` | Relevant \`_system/infra/\` file |

---

## Cross-Workspace Flow (One-Way)

\`\`\`
company/ (brand + products)
    ↓
departments/ (tactics + operations)
    ↓
products/ (build + ship)
    ↓
_system/infra/ (deploy)
\`\`\`

Context flows downstream only. A department agent never needs to know about infrastructure.

---

## What NOT to Load

- Don't load all department CONTEXT.md files at once — pick the one relevant to the task
- Don't load \`_system/infra/\` unless doing deployment work
- Don't load \`company/voice-brand.md\` unless writing copy
`;
}

// ─── PROJECT-REGISTRY.md ──────────────────────────────────────────────────────

export function generateProjectRegistry(config) {
  return `# Project Registry

Index of all time-bounded projects. Rows are auto-appended during project creation.

| Slug | Type | Department | Status | Path | Created | Notes |
|------|------|-----------|--------|------|---------|-------|
`;
}

// ─── company/CONTEXT.md ───────────────────────────────────────────────────────

export function generateCompanyContextMd(config) {
  return `# Company Knowledge

## When to Load What

| Task | Load | Skip |
|------|------|------|
| Writing any copy or messaging | \`voice-brand.md\` | \`products.md\`, SOPs |
| Referencing products / services | \`products.md\` | \`voice-brand.md\` |
| Writing about a business process | Specific SOP from \`sops/\` | Everything else |
| Both copy + product context | Both | SOPs |

---

## Folder Contents

- \`voice-brand.md\` — Tone, personality, messaging rules, audience profiles
- \`products.md\` — Product catalog, descriptions, positioning
- \`sops/\` — Internal SOPs (created as processes are documented)

---

## SOP Naming

\`sop-[process].md\` — e.g., \`sop-client-onboarding.md\`, \`sop-weekly-reporting.md\`
`;
}

// ─── company/voice-brand.md ───────────────────────────────────────────────────

export function generateVoiceBrand(config) {
  const { company } = config;
  return `# ${company.name} — Brand Voice & Messaging

**Last updated:** ${company.date}

---

## Company Overview

**What we do:** ${company.description}
${company.tagline ? `**Tagline:** ${company.tagline}` : '**Tagline:** [TBD]'}
**Industry:** ${company.industry}
**Website:** ${company.website || '[TBD]'}

---

## Brand Voice

**Tone:** [TBD — e.g., professional but approachable, confident, direct]

**Personality traits:**
- [TBD]
- [TBD]
- [TBD]

**We sound like:** [TBD — describe the voice in 1 sentence]

**We never sound:** [TBD — what to avoid]

---

## Messaging Rules

**Core value proposition:** [TBD]

**Key messages:**
1. [TBD]
2. [TBD]
3. [TBD]

**Words we use:** [TBD]
**Words we avoid:** [TBD]

---

## Audience Profiles

### Primary Audience
- **Who:** [TBD]
- **Pain point:** [TBD]
- **What they want:** [TBD]
- **How we talk to them:** [TBD]

### Secondary Audience
- **Who:** [TBD]
- **Pain point:** [TBD]

---

## Channel-Specific Notes

| Channel | Tone Adjustment | Format |
|---------|----------------|--------|
| LinkedIn | [TBD] | [TBD] |
| Email | [TBD] | [TBD] |
| Website | [TBD] | [TBD] |
| Proposals | [TBD] | [TBD] |
`;
}

// ─── company/products.md ──────────────────────────────────────────────────────

export function generateProductsMd(config) {
  const { company, products } = config;

  const productSections = products.length
    ? products.map(p => `
## ${p.name}

**Slug:** \`${p.slug}\`
**Description:** ${p.description || '[TBD]'}
**Status:** [TBD — e.g., active, in development, sunsetting]
**Target customer:** [TBD]
**Key differentiator:** [TBD]
**Pricing:** [TBD]
`).join('\n---\n')
    : `
## [Product Name]

**Slug:** \`[slug]\`
**Description:** [TBD]
**Status:** [TBD]
**Target customer:** [TBD]
**Key differentiator:** [TBD]
**Pricing:** [TBD]
`;

  return `# ${company.name} — Products & Services

**Last updated:** ${company.date}

---
${productSections}
`;
}

// ─── departments/[dept]/CONTEXT.md ────────────────────────────────────────────

const DEPT_DETAILS = {
  marketing: {
    tasks: [
      ['Write copy or campaign content', '`company/voice-brand.md`', 'All other docs'],
      ['Research trends or competitors', 'None — use Web Search', 'Company docs'],
      ['Create social posts', '`company/voice-brand.md`', 'Dept docs'],
      ['Build a campaign strategy', '`company/products.md`, `voice-brand.md`', 'Infra docs'],
    ],
    tools: [
      ['Web Search MCP', 'Research, trend analysis, competitor intel'],
      ['`/docx`', 'Written deliverables, campaign briefs'],
      ['`/pptx`', 'Presentations and pitch decks'],
    ],
    goal: 'Generate awareness and qualified leads.',
  },
  sales: {
    tasks: [
      ['Write outreach or follow-up copy', '`company/voice-brand.md`', 'Infra docs'],
      ['Build a sales process or playbook', '`company/products.md`', 'Dept docs'],
      ['Research a prospect', 'None — use Web Search', 'All docs'],
      ['Create a proposal', '`company/products.md`, `voice-brand.md`', 'Infra docs'],
    ],
    tools: [
      ['Web Search MCP', 'Prospect research, company intel'],
      ['`/docx`', 'Proposals, follow-up documents'],
    ],
    goal: 'Convert prospects into clients.',
  },
  operations: {
    tasks: [
      ['Design a client workflow', '1-2 relevant SOPs from `company/sops/`', 'Marketing/sales docs'],
      ['Write an SOP', '1-2 relevant SOPs from `company/sops/`', 'All other docs'],
      ['Prepare a client deliverable', 'None', 'All docs'],
      ['Review / revise an SOP', 'The specific SOP being revised', 'All other docs'],
    ],
    tools: [
      ['`/docx`', 'Formatted SOPs and process docs'],
      ['`/pdf`', 'Final client deliveries'],
    ],
    goal: 'Design and document efficient processes.',
  },
  networking: {
    tasks: [
      ['Find networking events', 'None — use Web Search', 'All docs'],
      ['Write outreach messages', '`company/voice-brand.md`', 'Infra docs'],
      ['Build a BD strategy', '`company/products.md`, `voice-brand.md`', 'Dept docs'],
    ],
    tools: [
      ['Web Search MCP', 'Event discovery, contact research'],
      ['`/docx`', 'Outreach templates, BD plans'],
    ],
    goal: 'Build strategic relationships and partnerships.',
  },
  hr: {
    tasks: [
      ['Write a job posting', '`company/voice-brand.md`', 'Infra docs'],
      ['Build a recruiting process', '`company/sops/`', 'All other docs'],
      ['Draft an HR policy', '1-2 relevant SOPs', 'All other docs'],
    ],
    tools: [
      ['`/docx`', 'Job descriptions, HR docs'],
    ],
    goal: 'Attract, hire, and retain great people.',
  },
  finance: {
    tasks: [
      ['Build a financial model', 'None', 'All docs'],
      ['Write financial copy', '`company/voice-brand.md`', 'Infra docs'],
      ['Create a report', 'None', 'All docs'],
    ],
    tools: [
      ['`/docx`', 'Financial reports, summaries'],
    ],
    goal: 'Maintain financial clarity and health.',
  },
  'customer-success': {
    tasks: [
      ['Write client-facing communication', '`company/voice-brand.md`', 'Infra docs'],
      ['Document a client process', '`company/sops/`', 'All other docs'],
      ['Build an onboarding flow', '`company/products.md`, `voice-brand.md`', 'Dept docs'],
    ],
    tools: [
      ['`/docx`', 'Onboarding docs, client guides'],
    ],
    goal: 'Ensure clients succeed and stay.',
  },
  product: {
    tasks: [
      ['Define product requirements', '`company/products.md`', 'Infra docs'],
      ['Write product copy', '`company/voice-brand.md`, `products.md`', 'Dept docs'],
      ['Plan a feature', '`company/products.md`', 'All other docs'],
    ],
    tools: [
      ['Web Search MCP', 'Competitive research, user research'],
      ['`/docx`', 'PRDs, feature specs'],
    ],
    goal: 'Define and evolve the product.',
  },
  engineering: {
    tasks: [
      ['Build a feature', 'Relevant `products/[name]/CONTEXT.md`', 'Company/dept docs'],
      ['Deploy an app', '`_system/infra/vps.md`', 'Company docs'],
      ['Review code or architecture', 'Relevant product CONTEXT.md', 'All other docs'],
    ],
    tools: [
      ['Web Search MCP', 'Library docs, API references'],
      ['`_system/infra/vps.md`', 'VPS deployment pattern'],
    ],
    goal: 'Build and maintain reliable software.',
  },
};

function getDefaultDeptDetails(dept) {
  return {
    tasks: [
      ['Main task', 'Relevant files only', 'All other docs'],
      ['Writing deliverables', '`company/voice-brand.md`', 'Infra docs'],
    ],
    tools: [
      ['`/docx`', 'Written deliverables'],
      ['Web Search MCP', 'Research'],
    ],
    goal: `[TBD — define the goal for ${toTitle(dept)}]`,
  };
}

export function generateDeptContextMd(dept, config) {
  const details = DEPT_DETAILS[dept] || getDefaultDeptDetails(dept);
  const taskRows = details.tasks.map(([task, load, skip]) =>
    `| ${task} | ${load} | ${skip} |`
  ).join('\n');
  const toolRows = details.tools.map(([tool, purpose]) =>
    `| ${tool} | ${purpose} |`
  ).join('\n');

  return `# ${toTitle(dept)} — Department Workspace

**Goal:** ${details.goal}

---

## Task → Load

| Task | Load These | Skip These |
|------|-----------|-----------|
${taskRows}

---

## Folder Structure

- \`brief.md\` — Project briefs and intake
- \`assets/\` — Research, source materials, raw inputs
- \`output/\` — Finished deliverables (\`[slug]-v[n].[ext]\`)

---

## Skills & Tools

| Tool | Purpose |
|------|---------|
${toolRows}

---

## What NOT to Do

- Don't load other departments' CONTEXT.md files
- Don't load \`_system/infra/\` unless this task involves deployment
- Don't load all of \`company/\` — pick only what's listed above
`;
}

// ─── products/[slug]/CONTEXT.md ───────────────────────────────────────────────

export function generateProductContextMd(product, config) {
  return `# ${product.name} — Product Workspace

**Description:** ${product.description || '[TBD]'}
**Status:** [TBD — planning / active / launched]

---

## External Resources

| Resource | Details |
|----------|---------|
| Git repo | [URL — add when created] |
| Database / backend | [ID — add when created] |
| Deployment | [domain — add when deployed] |
| Tech stack | [TBD — define in specs] |

---

## Task → Load

| Task | Load These | Skip These |
|------|-----------|-----------|
| Planning / brief | \`company/products.md\` | Infra docs, \`specs/\` |
| Technical specs | \`_system/infra/vps.md\` (if VPS deploy) | Company docs |
| Active development | \`specs/\` (this product) | Company docs |
| Deployment | \`_system/infra/vps.md\` | All other docs |
| Writing product copy | \`company/voice-brand.md\`, \`company/products.md\` | \`specs/\` |

---

## Folder Structure

- \`brief.md\` — What to build and why
- \`specs/\` — Technical specs, DB schema, API design (\`[feature]-spec.md\`)
- \`assets/\` — Design mockups, reference materials
- \`output/\` — Build artifacts, deployment notes

---

## Build Pipeline

1. Brief → \`brief.md\`
2. Specs → \`specs/[feature]-spec.md\`
3. Build → Git repo (code lives outside this folder)
4. Deploy → follow \`_system/infra/vps.md\` pattern
5. Document → update **External Resources** table above
`;
}

// ─── _system/CONTEXT.md ───────────────────────────────────────────────────────

export function generateSystemContextMd(config) {
  const infraFiles = [];
  if (config.infra.hasVps) infraFiles.push('| Deploy or update a VPS app | `infra/vps.md` | All other docs |');
  if (config.infra.hasLocalServer) {
    infraFiles.push(`| ${config.infra.localServerName} tasks | \`infra/${localServerFile(config)}\` | All other docs |`);
  }
  if (!infraFiles.length) infraFiles.push('| Infrastructure tasks | Relevant `infra/` file | All other docs |');

  return `# System — Infrastructure & Templates

## When to Load

| Task | Load These | Skip |
|------|-----------|------|
${infraFiles.join('\n')}
| Use a project template | \`templates/[type]/CONTEXT.md\` | All other docs |

---

## Folder Contents

- \`infra/\` — Infrastructure reference docs (VPS, local servers)
- \`templates/\` — Project type templates (biz-initiative, va-workflow, product-build)

---

## What NOT to Do

- Don't load \`_system/\` for anything except infrastructure or template work
- Don't load company or department docs from here
`;
}

// ─── _system/infra/vps.md ────────────────────────────────────────────────────

export function generateVpsMd(config) {
  const { infra } = config;
  return `# VPS — Infrastructure Reference

**Host**: \`${infra.vpsHost || 'TBD'}\`
**SSH alias**: \`${infra.vpsSshAlias || 'TBD'}\` (config: \`~/.ssh/config\`)

---

## Deployed Applications

| App | Domain | Internal Port | Stack | Directory |
|-----|--------|--------------|-------|-----------|
| (none yet — add as apps are deployed) | | | | |

---

## Deployment Pattern (All New Apps Follow This)

\`\`\`bash
# 1. Create app directory
mkdir ~/docker/[app-name] && cd ~/docker/[app-name]

# 2. Add: docker-compose.yml, Dockerfile, .env

# 3. Start containers
docker compose up -d

# 4. Add Nginx config
sudo nano /etc/nginx/sites-enabled/[subdomain.yourdomain.com]
sudo nginx -t && sudo systemctl reload nginx

# 5. SSL certificate
sudo certbot --nginx -d [subdomain.yourdomain.com]
\`\`\`

---

## Nginx Config Template

\`\`\`nginx
server {
    listen 80;
    server_name [subdomain.yourdomain.com];
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name [subdomain.yourdomain.com];

    ssl_certificate /etc/letsencrypt/live/[subdomain.yourdomain.com]/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/[subdomain.yourdomain.com]/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:[PORT];
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
\`\`\`

---

## Running Services

nginx, docker, containerd, cron, ssh — all managed by systemd.

---

## Known Issues

- (none yet — document as discovered)
`;
}

// ─── _system/infra/local-server.md ────────────────────────────────────────────

export function generateLocalServerMd(config) {
  const name = config.infra.localServerName || 'Local Server';
  return `# ${name} — Infrastructure Reference

**Role**: Always-on local machine for automation and development.
**Status**: Powered on continuously.

---

## Capabilities

- [TBD — document what this machine does]

---

## Automation Use Cases

| Use Case | Trigger | Notes |
|----------|---------|-------|
| [TBD] | [TBD] | |

---

## Development

Can serve as a development environment for work that doesn't need public hosting.
`;
}

// ─── _system/templates/biz-initiative/CONTEXT.md ────────────────────────────

export function generateBizInitiativeTemplateMd() {
  return `# [PROJECT-NAME] — Business Initiative

**Type:** biz-initiative
**Department:** [DEPARTMENT]
**Created:** [YYYY-MM-DD]
**Status:** active
**Goal:** [1-sentence goal from project description]

---

## What This Project Is

[Full description from project creation prompt]

---

## Task → Load

| Task | Load These | Skip These |
|------|-----------|-----------|
| Research / planning | None — use Web Search | Company docs unless writing copy |
| Writing deliverables | \`company/voice-brand.md\` | All other docs |
| Campaign assets | \`company/voice-brand.md\` | All other docs |
| Final review | \`company/voice-brand.md\` | All other docs |

---

## Folder Structure

- \`brief.md\` — Project brief, goals, and success criteria
- \`assets/\` — Research, source materials, raw inputs
- \`output/\` — Finished deliverables (naming: \`[slug]-v[n].[ext]\`)

---

## Process

1. Define goals → \`brief.md\`
2. Research → \`assets/\`
3. Create deliverables → working files or directly to \`output/\`
4. Review against brief goals
5. Finalize → \`output/[slug]-v[n].[ext]\`
6. Mark complete → update **Status** above + \`PROJECT-REGISTRY.md\`

---

## Skills & Tools

| Tool | When | Purpose |
|------|------|---------|
| Web Search MCP | Research phase | Trend data, event finding, competitor intel |
| \`/docx\` | Written deliverables | Formatted Word docs for external use |
| \`/pptx\` | Presentation deliverables | Slide decks |
`;
}

// ─── _system/templates/va-workflow/CONTEXT.md ────────────────────────────────

export function generateVaWorkflowTemplateMd() {
  return `# [PROJECT-NAME] — VA Workflow

**Type:** va-workflow
**Client:** [CLIENT-NAME]
**Created:** [YYYY-MM-DD]
**Status:** active
**Goal:** [1-sentence goal]

---

## What This Project Is

[Full description from project creation prompt]

---

## Task → Load

| Task | Load These | Skip These |
|------|-----------|-----------|
| Design workflow | \`company/sops/\` (1-2 relevant SOPs for style reference) | All other docs |
| Write SOP | \`company/sops/\` (1-2 relevant SOPs for style reference) | All other docs |
| Client deliverable prep | None | All docs |
| Review / revise | The specific SOP being revised | All other docs |

---

## Folder Structure

- \`brief.md\` — Client brief, scope, and requirements
- \`assets/\` — Client inputs, existing processes, reference materials
- \`output/\` — Finished SOPs and workflow docs (naming: \`sop-[process]-v[n].[ext]\`)

---

## Process

1. Capture client requirements → \`brief.md\`
2. Gather inputs → \`assets/\`
3. Draft SOP / workflow
4. Review with client feedback
5. Finalize → \`output/sop-[process]-v[n].[ext]\`
6. If SOP is company-internal → copy to \`company/sops/sop-[process].md\`
7. Mark complete → update **Status** above + \`PROJECT-REGISTRY.md\`

---

## Skills & Tools

| Tool | When | Purpose |
|------|------|---------|
| \`/docx\` | All SOPs | Formatted Word docs for client delivery |
| \`/pdf\` | Final delivery | PDF version if client requests it |
`;
}

// ─── _system/templates/product-build/CONTEXT.md ──────────────────────────────

export function generateProductBuildTemplateMd() {
  return `# [PROJECT-NAME] — Product Build

**Type:** product-build
**Product:** [PRODUCT-NAME]
**Created:** [YYYY-MM-DD]
**Status:** planning
**Goal:** [1-sentence goal]

---

## What This Project Is

[Full description from project creation prompt]

---

## External Resources

| Resource | Details |
|----------|---------|
| Git repo | [URL — add when created] |
| Database / backend | [ID — add when created] |
| Deployment | [domain — add when deployed] |
| Tech stack | [TBD — define in specs] |

---

## Task → Load

| Task | Load These | Skip These |
|------|-----------|-----------|
| Planning / brief | \`company/products.md\` | Infra docs, \`specs/\` |
| Technical specs | \`_system/infra/vps.md\` (if VPS deploy) | Company docs |
| Active development | \`specs/\` (this project) | Company docs |
| Deployment | \`_system/infra/vps.md\` | All other docs |
| Writing product copy | \`company/voice-brand.md\`, \`company/products.md\` | \`specs/\` |

---

## Folder Structure

- \`brief.md\` — What to build and why
- \`specs/\` — Technical specs, DB schema, API design (naming: \`[feature]-spec.md\`)
- \`assets/\` — Design mockups, reference materials
- \`output/\` — Build artifacts, deployment notes

---

## Build Pipeline

1. Brief → \`brief.md\` (what + why)
2. Specs → \`specs/[feature]-spec.md\` (tech decisions)
3. Build → Git repo (code lives outside this folder)
4. Deploy → follow \`_system/infra/vps.md\` pattern
5. Document → update **External Resources** table above with live URLs
6. Mark complete → update **Status** above + \`PROJECT-REGISTRY.md\`

---

## Skills & Tools

| Tool | When | Purpose |
|------|------|---------|
| Web Search MCP | Specs phase | Library docs, best practices, API references |
| \`_system/infra/vps.md\` | Deployment | VPS deployment pattern and commands |
`;
}
