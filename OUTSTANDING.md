# Outstanding Items

Items that are UI-only and do not persist or function yet.

## Settings

### Team Management (`settings/+page.svelte`)
- [x] Invite Member button — wired with modal + form action, inserts into `team_members` with null userId
- [x] Remove member — wired with confirmation dialog + form action, deletes from `team_members`
- [x] Hardcoded invited member (Alex Thompson) removed
- [ ] Role changes — roles display but cannot be changed (no edit UI or form action)

### Branding (`settings/branding/+page.svelte`)
- [x] Save Branding — wired with form action, persists to `teams.settings.branding` via RLS
- [ ] Upload Logo button — no file upload handler (button is decorative)
- [ ] Custom Domain "Verified" badge — hardcoded, no DNS verification system

### Notifications (`settings/notifications/+page.svelte`)
- [x] Save Preferences — wired with form action, persists to `teams.settings.notifications` via RLS
- [ ] Notification preferences initialize from hardcoded defaults, not loaded from DB on return visit
- [ ] In-app notifications — no notification delivery system exists
- [ ] Email notifications — no email sending infrastructure
- [ ] Push notifications — no push subscription or service worker

### Workflows (`settings/workflows/+page.svelte`)
- [x] Edit Workflow (name/description) — wired with form action, persists to `workflow_templates` table
- [x] Create Custom Workflow button — wired with modal + form action, inserts into `workflow_templates`
- [x] Automation Rules — marked "Coming Soon" (toggles disabled, settings gear disabled with tooltips)
- [x] Add Rule button — disabled with "Coming Soon" tooltip
- [x] Enable/disable automation toggle — disabled, rules shown at reduced opacity
- [x] Rule settings (gear icon) button — disabled with "Coming Soon" tooltip

### Integrations (`settings/integrations/+page.svelte`)
- [x] Connect buttons (non-Google) — disabled with "Coming Soon" tooltip
- [ ] Google Connect (`/api/integrations/google/connect`) — endpoint may not exist
- [x] Sync button on connected integrations — disabled with "Coming Soon" tooltip
- [ ] Integration status changes — no disconnect/reconnect actions

### Billing (`settings/billing/+page.svelte`)
- [ ] No `+page.server.ts` — entire page is hardcoded mock data
- [ ] Current plan, usage stats, invoices — all hardcoded in component
- [x] Upgrade/Downgrade buttons — disabled with "Stripe integration coming soon" tooltip
- [x] Update Payment Method button — disabled with "Stripe integration coming soon" tooltip
- [x] Download Invoice PDF buttons — disabled with "Coming Soon" tooltip

### Data Management (`settings/data/+page.svelte`)
- [ ] No `+page.server.ts` — entire page is hardcoded mock data
- [x] Export CSV/Reports buttons — disabled with "Coming Soon" tooltip
- [x] Backup Now button — disabled with "Coming Soon" tooltip
- [x] Data Access Request / Data Deletion Request buttons — disabled with "Coming Soon" tooltip
- [x] API Keys section — marked "Coming Soon" with badge, controls disabled
- [x] Generate New Key / Revoke Key buttons — disabled with "Coming Soon" tooltip
- [ ] Data retention settings — display only, not configurable

## Portal Settings (`listings/[id]/portal-settings/+page.svelte`)
- [x] Section visibility toggles — wired (savePortalSections action)
- [x] Document sharing settings — wired (saveDocumentSharing action)
- [x] Notification settings — wired (saveNotifications action)
- [x] Approval queue (approve/deny) — wired (approveRequest/denyRequest actions)
- [ ] Portal auth — no client login system (magic links or password needed)
- [ ] Actual client-facing portal app — does not exist yet
- [ ] "Preview Portal" button — no public portal to preview
- [ ] Approval queue items — loaded from portalSettings JSON, not a proper queue table

## Other
- [ ] Auth system — using mock/bypass auth, no real login flow for team members
- [ ] File uploads — Supabase storage configured but no upload UI is wired end-to-end
- [ ] Email sending — no transactional email provider configured
- [ ] Real-time notifications — no WebSocket or SSE infrastructure
