# Reusable prompt — WebMCP, SEO, AEO, and GEO

Replace bracketed values. Produce a baseline before implementation when no
report exists. Scanner scores are evidence, not the goal: the result must
improve the site for people, search engines, and agents.

```text
Audit, implement, and validate [SITE_URL] for WebMCP, SEO, AEO, and GEO.

Repository: [REPOSITORY_PATH]
Existing report: [REPORT_PATH / NONE]
Preferred origin: [WWW / APEX / AUDIT_FIRST]
WebMCP Origin Trial: [TOKEN_CONFIGURED / REGISTRATION_REQUIRED / NOT_APPLICABLE]
Local scanner: [SCANNER_PATH / NONE]

1. Protect the worktree
- Read AGENTS.md, CLAUDE.md, README, and local instructions.
- Inspect architecture, hosting, commands, branch, remotes, and git status.
- Preserve pre-existing changes and never revert other people's work.
- Capture published behavior and baseline scores before editing.
- Do not commit, push, deploy, or perform destructive external actions without
  explicit authorization.

2. Canonical origin and public access
- Audit HTTP/HTTPS, apex/www, redirects, and authentication middleware.
- Select one canonical origin based on evidence and use it in canonical URLs,
  sitemap, JSON-LD, Open Graph, RSS, llms.txt, APIs, and generated links.
- Confirm public pages and technical files do not silently redirect to login.

3. Technical SEO
- Implement page-specific title and description, absolute canonical, Open Graph,
  Twitter Cards, robots.txt, sitemap with lastmod, and indexable URLs.
- Use semantic HTML, one clear H1, progressive headings, alt text, and genuine
  internal links.
- Add JSON-LD only when it matches visible content.
- Use RSS and llms.txt when useful; state that llms.txt is informational.

4. AEO and GEO
- Publish direct answers to real questions, definitions, comparisons, lists,
  and tables only when those formats improve the answer.
- Identify the entity, publisher, contact, update date, methodology, sources,
  and limitations.
- Keep essential facts in HTML rather than behind JavaScript only.
- Provide sanitized, read-only public APIs for useful public data.
- Never fabricate numbers, ratings, credentials, authorship, or sources.

5. WebMCP strategy
- Map real journeys before defining tools. Prefer a small set of distinct tools
  with specific verb-based names.
- Define purpose, boundaries, effects, closed inputSchema, structured output,
  and accurate annotations for each tool.
- Feature-detect document.modelContext, support AbortSignal/cancellation, and
  preserve a visible manual path.
- Distinguish read-only, idempotent, open-world, and mutating tools.
- Critical actions must separate preparation from confirmation and enforce both
  backend authorization and human confirmation. Copy and annotations are not
  security controls.
- Do not duplicate a tool merely to satisfy a scanner.

6. Declarative WebMCP
- Convert at least one real form with toolname, tooldescription, and
  toolparamdescription.
- Preserve labels, validation, accessibility, manual submission, and visible
  feedback without WebMCP.
- For mutations, an agent may fill fields, but the person must review and submit.

7. Real browser availability
- Check current official documentation because WebMCP is evolving.
- Report three separate states:
  A) definition found in HTML or script;
  B) tool registered in document.modelContext;
  C) tool executable by an ordinary production visitor.
- While an Origin Trial is required, register the exact origin and publish a
  first-party token through a meta tag or response header.
- Never invent, expose, or reuse another origin's token.
- Use a server-only variable, document expiry, and warn when it is absent.
- If issuance requires the owner's external account, prepare integration and
  report the exact human action still required without claiming completion.

8. Headers and security
- Require HTTPS and a valid certificate.
- Send `Origin-Agent-Cluster: ?1`; treat `?0` as a WebMCP blocker.
- Send `Permissions-Policy: tools=(self)` and restrict other capabilities.
- Do not pass merely because any Permissions-Policy exists; verify `tools`.
- Never expose tokens, secrets, protected data, or private product sequences.
- Do not weaken CSP, authentication, authorization, or isolation for a score.

9. Observability and self-test
- Locally record tool name, duration, success, and failure.
- Redact emails, tokens, credentials, and PII; cap and clear session history.
- Do not send telemetry server-side without need and consent.
- Where available, use getTools/executeTool for a deterministic self-test.
- Self-tests may execute only read-only tools with safe synthetic inputs.

10. Scanner behavior for modern sites
- Discover declarative tools in HTML and use getTools without executing actions
  when document.modelContext exists.
- Statically inspect same-origin scripts under strict count, byte, redirect, and
  timeout limits; never execute their JavaScript or tools.
- Deduplicate dynamic, declarative, and static findings.
- Label static findings as heuristic. Finding zero does not prove absence.
- Inspect HTTPS, Origin Trial meta/header, Origin-Agent-Cluster,
  Permissions-Policy, schemas, annotations, cancellation, fallback, and
  confirmation signals.
- Before suggesting a missing tool, compare intent, parameters, and output with
  existing tools. Heuristic opportunities are not facts.
- Separate site-owned and platform-supplied tools only with evidence.
- Preserve SSRF defenses: block private networks, URL credentials, non-HTTP(S)
  protocols, unvalidated redirects, excessive responses, and timeouts.

11. Validation
- Run tests, typecheck, build, available lint, and git diff --check.
- Inspect desktop/mobile, focus, overflow, and reduced motion.
- Verify statuses, redirects, headers, canonical, robots, sitemap, APIs, JSON-LD.
- Validate WebMCP through HTML, static scripts, and a compatible browser or
  controlled polyfill.
- Test missing/expired Origin Trial behavior without breaking the human fallback.
- Separate scanner limitations, false positives, and pre-existing warnings.

12. Publishing, only after authorization
- Publish only related files and preserve the user's existing changes.
- Wait for deployment and revalidate the real domain.
- Verify the published first-party token, OAC, and tools policy.
- Run the authorized scanner and compare before/after WebMCP, SEO, AEO, GEO,
  and overall scores. Never present a prediction as a measurement.

13. Handoff
Report baseline, decisions, files, tests, before/after scores, warnings,
limitations, pending actions, and final git state. Include a readiness matrix:
- detected statically;
- registered in the browser;
- executable by an ordinary visitor.
Report Origin Trial status and expiry without revealing the token.
```
