# AFTERMARKET-MENU Cloud Build and Cloud Run release runbook

This is the authoritative production lifecycle for the Priority Lexus Aftermarket Menu.

## Fixed topology

- Source: `PriorityLexusVB/AFTERMARKET-MENU`, branch `main`
- Build: external Google Cloud Build trigger
- Google Cloud project: `gen-lang-client-0877787739`
- Cloud Run service: `priority-lexus-aftermarket-menu`
- Region: `us-west1`
- Runtime command: `node index.js`

A merge to `main` starts the external Cloud Build trigger automatically. Do not merge a release
branch until the provider preflight below is complete.

## Immutable lifecycle

1. Cloud Build checks out the exact Git SHA. The build must see the full 40-character SHA through
   Git metadata or the provider `COMMIT_SHA` environment value; multiple sources must agree.
2. The Node buildpack runs `npm run gcp-build`.
3. `gcp-build` requires all six Firebase build-variable names and runs `npm run build`.
4. `postbuild` validates the artifact:
   - `dist/index.html` and application assets exist;
   - `build-info.json` contains only the full Git SHA and exact ISO build time;
   - no public source-map file or `sourceMappingURL` remains.
5. Only a successful build can continue to image push and Cloud Run deployment.
6. Cloud Run starts `node index.js` and serves the prebuilt `dist` directory unchanged.

The runtime must not define a `prestart` build. Runtime `VITE_*` values cannot change an already
built Vite bundle.

## Required build-variable names

Cloud Build must provide all six names without printing their values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Never place values in source, documentation, shell history, pull-request text, or raw build-log
output.

## Source gates before provider work

Run from a clean release branch:

```bash
npm ci
npm run healthcheck
npm run build
git diff --check
```

Also require the repository ASCII scan from `AGENTS.md`, a clean worktree, and the remote branch SHA
to equal the tested local SHA.

## Read-only provider preflight

Before any deploy or merge, capture these fields using explicit project, service, and region flags:

- current 100 percent traffic revision;
- current image digest and Artifact Registry repository;
- container command and arguments;
- runtime environment names only, never values;
- trigger identity and configuration without secret substitutions;
- current Firebase Web App identities;
- current API-key display names, restrictions, and usage metadata without values;
- existence of any other service or non-menu capability in the project.

The current 100 percent revision and image digest are the rollback anchor. If they are unavailable,
the release is blocked.

## Deployment approval boundary

Build configuration, secret values, Cloud Run revisions, traffic, API keys, IAM, Firebase Auth,
Firestore rules, and production writes require explicit approval. Source/test approval does not
authorize provider mutation.

Do not use an ad hoc local `gcloud run deploy --source` command. It bypasses the reviewed trigger
topology and can expose values through shell history or deploy the wrong checkout.

## Candidate acceptance

For an approved candidate, require all of the following before traffic promotion:

1. Buildpack, Push, and Deploy complete for the tested Git SHA.
2. `/health-check` returns `200` with body `ok`.
3. `/build-info.json` returns the tested SHA and a new build time with `Cache-Control: no-store`.
4. `/__debug` returns `404`.
5. The production JavaScript has no public source-map URL and the guessed `.map` path is not JSON.
6. Root and asset responses include the reviewed security headers.
7. The iPad landscape surface shows Sign In, not Demo Mode, with no console or network regression.
8. A separately approved authenticated admin/rep acceptance plan passes without unintended writes.

Traffic promotion is a separate approval after candidate acceptance.

## Rollback

If any acceptance check fails, keep or restore 100 percent traffic on the captured prior revision.
Then re-read root, health, build identity, assets, and the iPad Sign In surface. Do not roll back by
restoring an exposed key or insecure Firestore rules.
