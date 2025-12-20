# Cloud Run Troubleshooting Guide

This guide helps diagnose and fix common Cloud Run deployment failures for the Aftermarket Menu application.

## Common Failure Symptoms

- `HealthCheckContainerError`: Container failed to start and listen on PORT
- Startup probe TCP failures with `Connection failed with status CANCELLED`
- Container exits with code 137 (often OOM/SIGKILL)
- Logs show "did not listen on port" errors

## Issue 1: Environment Variable Names with Whitespace

### Symptom
The Cloud Run revision has environment variables with leading or trailing spaces in the **key name**, such as:
- `" VITE_FIREBASE_PROJECT_ID"` (note the leading space)

### Why This Breaks Deployment
1. **Build-time configuration fails**: Vite looks for `VITE_FIREBASE_PROJECT_ID` but the actual key is `" VITE_FIREBASE_PROJECT_ID"` (with space)
2. **Variable is effectively missing**: The application cannot access the value
3. **Firebase initialization fails**: Missing Firebase config causes runtime errors
4. **Application may not bind to PORT correctly**: Configuration errors can prevent proper startup

### How to Detect
Check your Cloud Run service logs for diagnostic messages:

```
[DIAGNOSTICS] ⚠️  WARNING: Environment variables with whitespace detected!
[DIAGNOSTICS]   ❌ " VITE_FIREBASE_PROJECT_ID" (has whitespace)
[DIAGNOSTICS]      Should be: "VITE_FIREBASE_PROJECT_ID"
[DIAGNOSTICS] ⚠️  This is a common Cloud Run misconfiguration!
```

### How to Fix in Cloud Run Console

1. **Open Cloud Run Console**
   - Go to https://console.cloud.google.com/run
   - Select your service (e.g., `aftermarket-menu`)

2. **Edit the Service**
   - Click "EDIT & DEPLOY NEW REVISION" at the top

3. **Check Environment Variables**
   - Scroll to "Container(s)" → "Variables & Secrets" tab
   - Look for any variable names with leading/trailing spaces
   - Common culprits:
     - `" VITE_FIREBASE_PROJECT_ID"` (leading space)
     - `"VITE_FIREBASE_API_KEY "` (trailing space)
     - Variables with tabs or other whitespace

4. **Remove Bad Variables**
   - Click the trash icon next to each malformed variable
   - **Important**: Do NOT try to edit the name - you must delete and recreate

5. **Re-add Variables with Correct Names**
   - Click "ADD VARIABLE"
   - Enter the **exact** name without any whitespace:
     - `VITE_FIREBASE_PROJECT_ID` (no spaces!)
   - Enter the value
   - Note: These should be set as **BUILD** environment variables, not runtime variables

6. **Deploy the New Revision**
   - Click "DEPLOY" at the bottom
   - Monitor the logs for successful startup

### Prevention
- Use `gcloud` CLI with `--set-build-env-vars` flag (recommended)
- Copy-paste variable names from documentation, not from Cloud Console
- Run `npm run validate-env` locally before deploying
- Use the provided `scripts/validate-env-vars.js` which auto-detects whitespace

## Issue 2: GCSFuse Volume Mount Masking `/app/dist`

### Symptom
Cloud Run logs show:
```
[DIAGNOSTICS] ⚠️  WARNING: Dist directory does not exist!
[DIAGNOSTICS] ⚠️  Possible causes:
[DIAGNOSTICS]      2. GCSFuse volume mounted at /app/dist
```

Or:
```
[BOOT WARNING] Build artifacts missing - app will show splash page
[BOOT WARNING] This may indicate:
[BOOT WARNING]   2. GCS volume mount overwrote /app/dist
```

### Why This Breaks Deployment
1. **Build artifacts are baked into the container image** at `/app/dist` during the build step
2. **A GCSFuse volume mounted to `/app/dist`** replaces the entire directory with the contents of a GCS bucket
3. **If the bucket is empty or doesn't contain the built files**, the application has no UI to serve
4. **Container may fail health checks** if it cannot serve the expected routes

### How to Detect
Check your Cloud Run revision configuration:

1. **Via Cloud Console**:
   - Go to your Cloud Run service
   - Click on the current revision
   - Scroll to "Volumes" section
   - Look for a volume mounted at `/app/dist`

2. **Via Logs**:
   - Look for diagnostics showing empty or missing dist directory
   - Check if file count is 0 or sample files list is empty

### How to Fix

#### Option A: Remove the Volume Mount (Recommended for Most Cases)
If you don't need persistent storage for the built application:

1. Go to Cloud Run Console → Your Service → "EDIT & DEPLOY NEW REVISION"
2. Scroll to "Container(s)" → "Volumes" tab
3. Find the volume mounted at `/app/dist`
4. Click "REMOVE"
5. Deploy the new revision

#### Option B: Use a Different Mount Path
If you need the GCS bucket for other purposes:

1. Change the mount path to something other than `/app/dist`
2. For example: `/app/storage` or `/app/uploads`
3. Update your application code to reference the new path if needed

#### Option C: Populate the GCS Bucket with Build Artifacts
If you intentionally want to serve from GCS:

1. Build your application locally: `npm run build`
2. Upload the entire `dist` directory to your GCS bucket
3. Ensure the bucket is mounted read-only in Cloud Run
4. **Note**: This approach requires rebuilding and uploading on every code change

### Prevention
- Only mount GCSFuse volumes for dynamic content (uploads, user data)
- Never mount volumes over application directories (`/app/dist`, `/app/src`, etc.)
- Document the purpose of each volume mount in your deployment

## Issue 3: Memory Issues (OOM/Exit 137)

### Symptom
- Container exits with code 137
- Logs show high memory usage before crash
- Health checks fail before the server finishes starting

### How to Detect
Check Cloud Run logs for memory snapshots:

```
[MEMORY] T+5s: RSS=245.5 MB, Heap=89.2 MB/120.5 MB
[MEMORY] T+10s: RSS=512.7 MB, Heap=450.3 MB/512.0 MB
[MEMORY] T+15s: RSS=1.2 GB, Heap=980.5 MB/1.0 GB
```

If memory usage is approaching your container's memory limit, that's the issue.

### How to Fix

#### Temporary: Increase Memory
1. Go to Cloud Run Console → Your Service → "EDIT & DEPLOY NEW REVISION"
2. Scroll to "Container(s)" → "Resources" tab
3. Increase "Memory" (try 1 GiB or 2 GiB)
4. Deploy and monitor

#### Permanent: Optimize the Application
1. **Review dependencies**: Remove unused packages from `package.json`
2. **Enable code splitting**: Use dynamic imports in Vite
3. **Reduce bundle size**: Check `npm run validate-build` warnings
4. **Optimize images**: Compress large assets

### Prevention
- Monitor memory usage in production
- Set up alerts for containers approaching memory limits
- Test builds with production data volumes

## Verification Steps After Fixes

After making changes, verify the deployment:

### 1. Check Deployment Success
```bash
gcloud run services describe aftermarket-menu --region=us-west1 --format="value(status.url)"
```

Visit the URL to ensure the app loads.

### 2. Check Logs for Diagnostics
```bash
gcloud run services logs read aftermarket-menu --region=us-west1 --limit=50
```

Look for:
- `[DIAGNOSTICS] ✓ No whitespace in environment variable names`
- `[DIAGNOSTICS] Dist exists: true`
- `[DIAGNOSTICS] index.html exists: true`
- `[BOOT] ✓ Server ready to accept connections`

### 3. Test Health Check
```bash
curl https://your-service-url.run.app/health-check
```

Should return: `ok`

### 4. Test Debug Endpoint
```bash
curl https://your-service-url.run.app/__debug
```

Should return JSON with:
- `distExists: true`
- `indexExists: true`
- `distFiles: [...]` (non-empty array)

## Recommended Cloud Run Settings for Troubleshooting

When debugging deployment issues, temporarily use these settings:

### Container Resources
- **Memory**: 2 GiB (can reduce after identifying the issue)
- **CPU**: 2 (can reduce to 1 after troubleshooting)
- **Request timeout**: 300 seconds
- **Maximum requests per container**: 1 (to isolate issues)

### Container Startup
- **Startup probe period**: 300 seconds (default is 240s)
- **Minimum instances**: 1 (keeps one instance warm for testing)

### Logging
- Enable Cloud Logging
- Set log level to debug if your app supports it

### After Identifying the Issue
Once resolved, you can scale back to production settings:
- Memory: 512 MiB or 1 GiB
- CPU: 1
- Request timeout: 60 seconds
- Maximum requests per container: 80
- Minimum instances: 0 (for cost savings)

## Quick Reference: Deploy Commands

### Deploy with Build-Time Environment Variables
```bash
gcloud run deploy aftermarket-menu \
  --source . \
  --region us-west1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --set-build-env-vars="VITE_FIREBASE_API_KEY=YOUR_KEY,VITE_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN,VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT,VITE_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET,VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER,VITE_FIREBASE_APP_ID=YOUR_APP_ID,VITE_USE_AI_PROXY=true" \
  --set-env-vars="GEMINI_API_KEY=YOUR_GEMINI_KEY"
```

**Important**: 
- Use `--set-build-env-vars` for `VITE_*` variables (needed during build)
- Use `--set-env-vars` for server-side secrets like `GEMINI_API_KEY`
- Ensure variable names have **no whitespace**

### View Current Configuration
```bash
# Check environment variables
gcloud run services describe aftermarket-menu \
  --region=us-west1 \
  --format="value(spec.template.spec.containers[0].env)"

# Check volumes
gcloud run services describe aftermarket-menu \
  --region=us-west1 \
  --format="value(spec.template.spec.volumes)"
```

## Getting Help

If issues persist after following this guide:

1. **Check the logs** for the specific error messages
2. **Run diagnostics locally**:
   ```bash
   npm run validate-env
   npm run build
   npm run validate-build
   npm start
   ```
3. **Review related documentation**:
   - [Cloud Deployment Guide](./CLOUD_DEPLOYMENT.md)
   - [PR Deployment Fix](./PR_DEPLOYMENT_FIX.md)

4. **Common debugging steps**:
   - Verify all environment variables are set correctly
   - Ensure no volume mounts at `/app/dist`
   - Check container memory isn't maxed out
   - Verify the build completes successfully
   - Test health check endpoint returns 200 OK

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Health Checks](https://cloud.google.com/run/docs/configuring/healthchecks)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [GCSFuse with Cloud Run](https://cloud.google.com/run/docs/tutorials/network-filesystems-fuse)
