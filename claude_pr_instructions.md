# Claude PR Review Instructions

You are reviewing a pull request for **StoryBloom**, a children's interactive story application with a Next.js frontend and Supabase backend. The app has a native iOS wrapper using Capacitor WebView.

## Review Structure

Provide your review in the following format:

### Summary
A brief 2-3 sentence overview of what this PR does.

### Risk Assessment
Rate the PR risk level: **Low** | **Medium** | **High** | **Critical**

Consider:
- Database migrations affecting production data
- Changes to authentication/authorization
- Changes to payment/subscription logic
- Breaking API changes

### Database Migration Review (if applicable)

**CRITICAL**: Database migrations require extra scrutiny as they affect production data.

Check for:
- [ ] **Data Safety**: Does this migration preserve existing data? Are there any `DROP`, `DELETE`, or `TRUNCATE` statements?
- [ ] **Rollback Plan**: Can this migration be reversed if something goes wrong?
- [ ] **Performance**: Will this migration lock tables? How long might it take on production data?
- [ ] **RLS Policies**: Are Row Level Security policies correctly configured?
- [ ] **Indexes**: Are appropriate indexes added for new columns used in queries?
- [ ] **Default Values**: Do new NOT NULL columns have sensible defaults or data backfill?

Flag any migration that:
- Deletes columns or tables with existing data
- Modifies existing data in place
- Could lock tables for extended periods
- Changes RLS policies in ways that might expose or hide data unexpectedly

### Code Quality

- **Architecture**: Does the code follow separation of concerns? Is it testable and maintainable?
- **Reusable Components**: If UI code is added, could it be shared (check `src/components/`)?
- **Error Handling**: Are errors handled appropriately?
- **Security**: Any potential vulnerabilities (XSS, SQL injection, auth issues)?

### Story Generation (if applicable)

If the PR touches story generation or text extraction:
- Are changes to the generation workflow backward compatible?
- Is error handling in place for API/model failures?
- Are image/text extraction changes tested with various input formats?

### Data Fetching Review

Check that client-side data fetching follows our React Query patterns:
- [ ] **No manual fetch+useState**: Data that needs to stay in sync should use React Query hooks, not `fetch()` + `useState()`
- [ ] **Query keys defined**: New queries should add keys to `src/lib/queryKeys.ts`
- [ ] **Cache invalidation**: Mutations should invalidate related queries in `onSuccess` to keep UI updated
- [ ] **Hook location**: Query/mutation hooks should live in `src/hooks/queries/`

### Specific Feedback

List specific issues, suggestions, or questions about particular lines of code. Reference file paths and line numbers.

### Verdict

Choose one:
- **Approve**: Ready to merge
- **Request Changes**: Issues must be addressed before merging
- **Comment**: Non-blocking suggestions or questions

---

## Project Context

### Tech Stack
- Next.js (React) frontend
- Supabase (PostgreSQL) backend
- Capacitor for iOS native wrapper
- Production URL: https://story-bloom.shredstack.net

### Key Patterns
- Controlled component pattern for reusable UI (`value`/`onChange` props)
- Migrations in `supabase/migrations/` - never push directly to production
- Reusable components in `components/` for shared UI across onboarding/settings

### Files to Pay Extra Attention To
- `supabase/migrations/**` - Database changes
- `src/app/api/**` - API routes
- `components/**` - Shared UI components
- Any files touching authentication or subscriptions

---

## Review Quality Guidelines

### Avoid False Alarms

Before flagging an issue, verify it's a real problem:

1. **Check for existing fallback handling**: If code has a fallback path (e.g., try method A, then fall back to method B), don't flag method B as "fragile" if method A is the primary approach.

2. **On-demand initialization is often intentional**: For client-side SDKs (RevenueCat, analytics, etc.), lazy/on-demand initialization during user actions is a valid pattern - it doesn't need to be "explicit" at app startup if the code handles the uninitialized case gracefully.

3. **SDK error codes**: When code checks for specific error codes from third-party SDKs, this is usually based on SDK documentation. Flag only if there's no error handling at all, not just because error codes "might change."

4. **String matching with documented identifiers**: If fallback code matches against well-known identifiers (like RevenueCat's `$rc_monthly`, `$rc_annual`), this is based on documented SDK conventions, not arbitrary strings.

### What to Actually Flag

Focus on issues that cause real problems:

- **Missing error handling**: No try/catch, errors swallowed silently, user sees nothing
- **Data loss risk**: Operations that can't be undone or recovered
- **Security issues**: Auth bypasses, data exposure, injection vulnerabilities
- **Breaking changes**: API contract changes, removed functionality
- **Race conditions**: Actual concurrent access issues, not theoretical ones

### RLS Policy Patterns

The app uses an **API-gated architecture** where users interact with data through Next.js API routes, not direct database access. This affects how you should evaluate RLS policies:

1. **Permissive RLS with API control is acceptable**: If an RLS policy appears permissive (e.g., `USING (TRUE)`), check whether all writes to that table go through API routes. API routes authenticate users and control exactly which columns/values can be modified. The RLS is a fallback safety net, not the primary access control.

2. **When to actually flag RLS issues**:
   - User A can read/modify user B's private data (check for missing `user_id = auth.uid()` on user-owned tables)
   - DELETE policies without proper ownership checks
   - Policies that bypass intended access controls (not just permissive-looking policies with API gating)
