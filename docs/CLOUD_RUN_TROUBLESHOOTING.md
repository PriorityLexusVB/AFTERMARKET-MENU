# AFTERMARKET-MENU Cloud Run troubleshooting

Use this guide to identify a failed release without changing production. The authoritative release
lifecycle and acceptance gates are in [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md).

## Safety boundary

Troubleshooting is read-only until an owner explicitly approves a provider change. Do not:

- run an ad hoc `gcloud run deploy --source` command;
- edit Cloud Build triggers, build variables, runtime variables, IAM, Firebase, revisions, or traffic;
- print Firebase values, raw build logs, tokens, customer data, or employee data;
- assume a successful source build means a revision received traffic.

Use exact project, service, and region identifiers for every provider read. Record environment
variable names only, never values.

## Source gates

Start with the exact candidate checkout:

```powershell
npm ci
npm run verify
```

`npm run verify` must prove all of these before provider investigation:

- ASCII/hidden-Unicode policy;
- lint and TypeScript health;
- runtime start has no `prestart` build;
- unit and Chromium E2E behavior;
- production build validation;
- no public source maps;
- valid build SHA and time;
- `npm start` leaves the complete `dist` fingerprint unchanged.

If a source gate fails, fix the source in a branch and repeat the full command. Do not deploy around
the failure.

## Provider evidence order

After explicit approval for provider readback, collect only the minimum metadata needed to locate
the first failed boundary:

1. remote `main` SHA;
2. external Cloud Build check identity and terminal status;
3. Buildpack, Push, and Deploy step statuses;
4. the one logged source SHA and candidate revision name;
5. Cloud Run service, current traffic revision, image digest, launch command, and environment names;
6. Firebase project and web-app identity names.

Stop at the first mismatch. A Buildpack failure with Push and Deploy still queued proves that no new
image or revision was produced. A completed Deploy step does not prove traffic without a service
traffic readback.

## Failure classification

### Buildpack fails before Push

Check the safe projection for:

- all six exact `VITE_FIREBASE_*` names;
- whitespace-padded or blank names;
- `npm run gcp-build` execution;
- a real source SHA available to `build-info.json`;
- the first non-secret validator error.

Do not print values. Do not weaken `gcp-build` or `postbuild` to make the build pass.

### Image builds but the container will not start

Confirm the image uses `node index.js` and contains a validated `dist`. Runtime startup must not run
Vite or mutate the build. Check only bounded status/log projections for the first boot error; do not
dump raw logs.

### Health endpoint fails

The expected probes are:

```text
GET /health-check -> 200, body: ok
GET /ping         -> 200, body: pong
```

If these fail, compare the candidate locally with `npm run test:runtime-smoke`. Do not change traffic
until the candidate passes both locally and on a no-traffic revision.

### Release identity is missing or wrong

`GET /build-info.json` must return only a real Git `sha` and ISO build `time`, with
`Cache-Control: no-store`. The SHA must equal the tested remote commit. The retired `/__debug` path
must return `404`.

An `unknown` SHA is a failed acceptance gate, not permission to infer the deployed revision from
dates or asset names.

### Sign-in is replaced by Demo Mode

Stop. The deployed bundle does not have the approved Firebase build configuration. Preserve the
last known-good revision and compare:

- the candidate build SHA;
- the six build-variable names;
- the served JavaScript asset name and SHA-256;
- iPad landscape behavior: Sign In visible, Demo Mode absent, one email and one password field.

Do not repair the live service by injecting runtime `VITE_*` values; Vite embeds them at build time.

### Static assets or source maps are wrong

Require JavaScript and CSS assets to return the expected content types. No `*.map` file or
`sourceMappingURL` may be public. A guessed map path must not return source-map JSON.

## Candidate acceptance

A candidate is releasable only when all evidence refers to the same exact SHA:

1. local `npm run verify` passes;
2. GitHub CI and the required WebKit iPad smoke pass;
3. Buildpack, Push, and Deploy complete for that SHA;
4. the no-traffic revision serves the exact `build-info.json` SHA;
5. health, assets, headers, source-map denial, and iPad sign-in behavior pass;
6. an explicit traffic approval is recorded;
7. the same checks pass after traffic moves.

If any field is unknown, report it as unknown. Never claim cloud-wide synchronization or production
acceptance from source, CI, or public URL evidence alone.
