# Outstanding Items

Items that are UI-only and do not persist or function yet.

## Settings

### Team Management (`settings/+page.svelte`)
- [ ] Invite Member button — no invite system (no form action, no email/invite flow)
- [ ] Role changes — roles display but cannot be changed (no edit UI or form action)
- [ ] Remove/deactivate member — no action available
- [ ] Invited member (Alex Thompson) is hardcoded in the component, not from DB

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
- [ ] Create Custom Workflow button — no create form or action
- [ ] Automation Rules — entirely hardcoded mock data, no DB table or persistence
- [ ] Add Rule button — no form or action
- [ ] Enable/disable automation toggle — no persistence
- [ ] Rule settings (gear icon) button — no action

### Integrations (`settings/integrations/+page.svelte`)
- [ ] Connect buttons (non-Google) — no OAuth flow or connection logic
- [ ] Google Connect (`/api/integrations/google/connect`) — endpoint may not exist
- [ ] Sync button on connected integrations — no sync action or handler
- [ ] Integration status changes — no disconnect/reconnect actions

### Billing (`settings/billing/+page.svelte`)
- [ ] No `+page.server.ts` — entire page is hardcoded mock data
- [ ] Current plan, usage stats, invoices — all hardcoded in component
- [ ] Upgrade/Downgrade buttons — no Stripe integration
- [ ] Update Payment Method button — no payment provider
- [ ] Download Invoice PDF buttons — no PDF generation or download endpoint

### Data Management (`settings/data/+page.svelte`)
- [ ] No `+page.server.ts` — entire page is hardcoded mock data
- [ ] Export CSV/Reports buttons — no export endpoint or file generation
- [ ] Backup Now button — no backup trigger action
- [ ] Data Access Request / Data Deletion Request buttons — no request handling
- [ ] API Key display — hardcoded fake key, no key generation or management
- [ ] Generate New Key / Revoke Key buttons — no API key system
- [ ] Show/Hide API key toggle — works client-side but key is fake
- [ ] Copy API key button — no clipboard action wired
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
