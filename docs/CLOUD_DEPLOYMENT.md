# Cloud Build and Cloud Run Deployment Guide

This guide provides detailed instructions for deploying the Priority Lexus Aftermarket Menu application to Google Cloud Run using Cloud Build.

## The Critical Issue: Build-Time vs. Run-Time Environment Variables

### Understanding the Problem

**Vite** (the build tool used by this application) needs environment variables at **build time**, not runtime. This is because Vite bundles the values directly into the final JavaScript files during the build process.

When deploying to Cloud Run with buildpacks (no Dockerfile):
1. Cloud Build runs `npm run gcp-build` which executes `vite build`
2. During this build step, Vite looks for `VITE_*` environment variables
3. If these variables are not available, Vite compiles `undefined` into your code
4. Even if you set runtime environment variables later in Cloud Run, they won't help because the build is already complete

### The Symptom

If environment variables aren't set correctly at build time, you may see:
- Application falls back to mock data
- Firebase initialization errors in browser console
- Missing or incorrect data rendering
- "Totals not working" or similar UI issues

## Solution: Correct Cloud Build Configuration

There are two recommended approaches:

### Option 1: Use `gcloud run deploy` with Build-Time Variables (Recommended)

This is the simplest and most reliable method for direct deployments.

```bash
gcloud run deploy YOUR_SERVICE_NAME \
  --source . \
  --region YOUR_REGION \
  --allow-unauthenticated \
  --set-build-env-vars="VITE_FIREBASE_API_KEY=YOUR_API_KEY,VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN,VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID,VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET,VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID,VITE_FIREBASE_APP_ID=YOUR_APP_ID,VITE_USE_AI_PROXY=true" \
  --set-env-vars="GEMINI_API_KEY=YOUR_GEMINI_API_KEY"
```

**Important flags explained:**
- `--source .` - Deploy from local source code
- `--set-build-env-vars` - Sets environment variables **during the build process** (critical for Vite!)
- `--set-env-vars` - Sets runtime-only environment variables (for server-side secrets)
- `--allow-unauthenticated` - Makes the service publicly accessible

**Replace these values:**
- `YOUR_SERVICE_NAME` - Name for your Cloud Run service (e.g., `aftermarket-menu`)
- `YOUR_REGION` - GCP region (e.g., `us-west1`, `us-central1`)
- `YOUR_API_KEY`, etc. - Your actual Firebase configuration values
- `YOUR_GEMINI_API_KEY` - Your Gemini API key (kept server-side only)

### Option 2: Use Cloud Build Trigger with Build-Time Substitutions (For CI/CD)

For automated CI/CD deployments, configure environment variables directly in the Cloud Build trigger, not in cloudbuild.yaml:

1. **Create a Cloud Build trigger** in the GCP Console
2. **Configure substitution variables** in the trigger settings:
   - `_VITE_FIREBASE_API_KEY`
   - `_VITE_FIREBASE_AUTH_DOMAIN`
   - `_VITE_FIREBASE_PROJECT_ID`
   - `_VITE_FIREBASE_STORAGE_BUCKET`
   - `_VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `_VITE_FIREBASE_APP_ID`
   - `_GEMINI_API_KEY` (server-side only, no VITE_ prefix)
   - `_VITE_USE_AI_PROXY=true` (forces use of backend proxy)

3. **Use this cloudbuild.yaml**:

```yaml
steps:
  # Deploy to Cloud Run with build-time environment variables
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'aftermarket-menu'
      - '--source=.'
      - '--region=us-west1'
      - '--allow-unauthenticated'
      - '--platform=managed'
      - '--set-build-env-vars=VITE_FIREBASE_API_KEY=${_VITE_FIREBASE_API_KEY},VITE_FIREBASE_AUTH_DOMAIN=${_VITE_FIREBASE_AUTH_DOMAIN},VITE_FIREBASE_PROJECT_ID=${_VITE_FIREBASE_PROJECT_ID},VITE_FIREBASE_STORAGE_BUCKET=${_VITE_FIREBASE_STORAGE_BUCKET},VITE_FIREBASE_MESSAGING_SENDER_ID=${_VITE_FIREBASE_MESSAGING_SENDER_ID},VITE_FIREBASE_APP_ID=${_VITE_FIREBASE_APP_ID},VITE_USE_AI_PROXY=true'
      - '--set-env-vars=GEMINI_API_KEY=${_GEMINI_API_KEY}'

substitutions:
  _VITE_FIREBASE_API_KEY: 'set-in-trigger'
  _VITE_FIREBASE_AUTH_DOMAIN: 'set-in-trigger'
  _VITE_FIREBASE_PROJECT_ID: 'set-in-trigger'
  _VITE_FIREBASE_STORAGE_BUCKET: 'set-in-trigger'
  _VITE_FIREBASE_MESSAGING_SENDER_ID: 'set-in-trigger'
  _VITE_FIREBASE_APP_ID: 'set-in-trigger'
  _GEMINI_API_KEY: 'set-in-trigger'

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'

timeout: '1200s'
```

**Important:** This approach passes environment variables to the buildpack build process via `--set-build-env-vars`, ensuring Vite has access to them during compilation. Runtime-only variables like `GEMINI_API_KEY` use `--set-env-vars` instead.

Then create a Cloud Build trigger with the substitution variables set.

## Step-by-Step Deployment Process

### Prerequisites

1. **Google Cloud CLI** installed and configured
   ```bash
   gcloud --version
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable required APIs**
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com
   ```

3. **Get your Firebase credentials** from the Firebase Console:
   - Go to Project Settings > General
   - Find your web app config
   - Copy all the values

### Deployment Steps

1. **Navigate to your project directory**
   ```bash
   cd /path/to/AFTERMARKET-MENU
   ```

2. **Test the build locally first**
   ```bash
   npm run build
   npm run validate-build
   ```
   
   This ensures your code builds successfully before deploying.

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy aftermarket-menu \
     --source . \
     --region us-west1 \
     --allow-unauthenticated \
     --set-build-env-vars="VITE_FIREBASE_API_KEY=AIza...,VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com,VITE_FIREBASE_PROJECT_ID=your-project-id,VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com,VITE_FIREBASE_MESSAGING_SENDER_ID=123456789,VITE_FIREBASE_APP_ID=1:123456789:web:abc123,VITE_USE_AI_PROXY=true" \
     --set-env-vars="GEMINI_API_KEY=AIza..."
   ```

4. **Wait for deployment to complete**
   
   The deployment process will:
   - Upload your source code
   - Install dependencies (`npm install`)
   - Run the build (`npm run gcp-build` → `npm run build`)
   - Validate the build (`npm run postbuild` → `npm run validate-build`)
   - Create a container image
   - Deploy to Cloud Run

5. **Verify deployment**
   
   Once deployed, Cloud Build will output a service URL like:
   ```
   Service [aftermarket-menu] revision [aftermarket-menu-00001-xyz] has been deployed 
   and is serving 100 percent of traffic.
   Service URL: https://aftermarket-menu-abc123-uc.a.run.app
   ```
   
   Visit this URL to test your application.

## Verification Checklist

After deployment, verify that everything is working:

- [ ] Application loads without errors
- [ ] No Firebase initialization errors in browser console (F12)
- [ ] Package prices are displayed correctly ($2,399, $2,899, $3,499)
- [ ] Totals calculate correctly when selecting packages
- [ ] A la carte items can be added and totals update
- [ ] Combined package + a la carte totals work correctly
- [ ] Admin panel is accessible (requires authentication)

## Troubleshooting

### Issue: "Firebase initialization was skipped"

**Symptom:** Console error saying Firebase environment variables are missing.

**Cause:** Environment variables were not available during build time.

**Solution:** Redeploy with `--set-build-env-vars` flag as shown above.

### Issue: Application shows mock data instead of Firebase data

**Symptom:** Application works but shows default "Elite", "Platinum", "Gold" packages with generic data.

**Cause:** Firebase not initialized due to missing build-time environment variables.

**Solution:** Same as above - redeploy with correct build-time variables.

### Issue: Build fails with "vite: not found"

**Symptom:** Build fails during `npm run build` step.

**Cause:** Dependencies not installed or node_modules corrupted.

**Solution:** 
1. Ensure `.gcloudignore` is present and configured correctly
2. Cloud Build will install dependencies automatically
3. Locally, run `npm install` before building

### Issue: "Totals not working" or prices show as $0.00

**Symptom:** Package prices or totals display incorrectly.

**Cause:** Usually indicates a build issue or missing data.

**Solution:**
1. Check browser console for JavaScript errors
2. Verify Firebase connection is working
3. Check that package data exists in Firestore
4. Redeploy with correct environment variables

### Issue: Large build size warnings

**Symptom:** Build validation warns about files >1MB.

**Cause:** Single large JavaScript bundle.

**Solution:** This is normal for this application. The warning is informational. To reduce size in future:
- Implement code splitting with dynamic imports
- Use build.rollupOptions.output.manualChunks in vite.config.ts

## Environment Variables Reference

All environment variables must be prefixed with `VITE_` to be available in the client-side code.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_USE_AI_PROXY` | **Recommended** | Set to `'true'` to use backend proxy for AI (prevents API key exposure) |
| `GEMINI_API_KEY` | Required for AI | Server-side Gemini API key (used by backend proxy endpoint `/api/chat`) |

**Security Note:** 
- **DO NOT** set `VITE_GEMINI_API_KEY` at build time for production deployments, as it exposes your API key in the client bundle where anyone can extract and abuse it.
- **ALWAYS** use `VITE_USE_AI_PROXY='true'` in production to route AI requests through the backend proxy endpoint (`/api/chat`).
- Set only `GEMINI_API_KEY` (without `VITE_` prefix) as a **runtime** environment variable in Cloud Run using `--set-env-vars`.
- The backend proxy (`index.js`) securely handles API key authentication without exposing it to clients.

## Continuous Deployment with GitHub Actions

If you want automatic deployments on push to main:

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: your-project-id
  SERVICE_NAME: aftermarket-menu
  REGION: us-west1

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE_NAME }} \
            --source . \
            --region ${{ env.REGION }} \
            --allow-unauthenticated \
            --set-build-env-vars="VITE_FIREBASE_API_KEY=${{ secrets.VITE_FIREBASE_API_KEY }},VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }},VITE_FIREBASE_PROJECT_ID=${{ secrets.VITE_FIREBASE_PROJECT_ID }},VITE_FIREBASE_STORAGE_BUCKET=${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }},VITE_FIREBASE_MESSAGING_SENDER_ID=${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }},VITE_FIREBASE_APP_ID=${{ secrets.VITE_FIREBASE_APP_ID }},VITE_USE_AI_PROXY=true" \
            --set-env-vars="GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}"
```

2. Set up GitHub Secrets:
   - `GCP_SA_KEY` - Service account JSON key
   - `VITE_FIREBASE_API_KEY` through `VITE_FIREBASE_APP_ID` - Your Firebase credentials
   - `GEMINI_API_KEY` - Your Gemini API key (server-side only, no VITE_ prefix)

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Cloud Build Configuration](https://cloud.google.com/build/docs/configuring-builds/create-basic-configuration)
