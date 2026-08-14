# Cloud Run Deployment Fix & A La Carte Admin UI

> Historical record only. Use [CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md) for the current release
> lifecycle. The public `/__debug` endpoint described below has been retired.

## Summary

This document provides a comprehensive overview of the changes made to fix Cloud Run deployment failures and implement admin UI for managing A La Carte options.

## Issues Addressed

### Issue #1: Cloud Run HealthCheckContainerError

**Symptom**: Container did not start and listen on PORT=8080 within the timeout period.

**Root Causes Identified**:

1. Potential environment variable typos with leading/trailing spaces (e.g., `' VITE_FIREBASE_PROJECT_ID'`)
2. No validation of PORT environment variable at build or runtime
3. Missing warnings for GCSFuse volume mounts that could overwrite `/app/dist`
4. Unclear error messages during server startup failures

**Solutions Implemented**:

1. **Environment Variable Validation** (`scripts/validate-env-vars.js`)
   - Runs automatically before every build (`prebuild` script)
   - Detects leading/trailing whitespace in variable names
   - Validates PORT is a number between 1-65535
   - Distinguishes between empty (error) and missing (demo mode) variables
   - Catches common placeholder values that weren't replaced
   - Validates Firebase configuration format

2. **Enhanced Server Startup** (`index.js`)
   - Early PORT validation with clear error messages
   - Comprehensive startup logging (Node version, PORT, working directory)
   - Warning messages for missing build artifacts (GCSFuse detection)
   - Detailed error handling for common issues:
     - `EADDRINUSE` - Port already in use
     - `EACCES` - Permission denied (ports < 1024)
   - Graceful shutdown on SIGTERM/SIGINT (Cloud Run compatibility)
   - Health and release readbacks: `/health-check` and `/build-info.json`

3. **Tests** (`src/test/server.test.ts`)
   - PORT validation edge cases
   - Default port handling
   - Invalid port detection

**Verification**:

- Server starts successfully on localhost:8080
- Health check endpoint returns `ok`
- Build identity endpoint shows the deployed SHA and build time
- Env validation correctly detects invalid PORT
- Graceful shutdown on signals

### Issue #2: A La Carte Options Not in Admin Panel

**User Request**:

> "the options in a la cart should also be under admin like the rest of the options. please follow sale set up as the other products"

**Root Cause**:

- AdminPanel only managed `features` collection
- No CRUD operations for `ala_carte_options` collection
- A La Carte options could not be configured with pricing, sales, or column assignments

**Solutions Implemented**:

1. **A La Carte Form** (`src/components/AlaCarteForm.tsx`)
   - Full CRUD form for creating/editing A La Carte options
   - Fields match ProductFeature structure:
     - Name, price, cost, description
     - Key points and use cases
     - Warranty information
     - Column assignment (1-4)
     - AND/OR connector
     - "New" badge flag
     - Image, thumbnail, and video URLs
   - Form validation and error handling
   - Consistent styling with FeatureForm

2. **A La Carte Admin Panel** (`src/components/AlaCarteAdminPanel.tsx`)
   - Drag-and-drop interface matching features panel
   - Column-based organization (Gold/Elite/Platinum/Popular Add-ons)
   - Cross-column drag support
   - Keyboard accessible up/down reordering
   - Inline AND/OR connector toggling
   - Position tracking and normalization
   - Batch updates with retry logic
   - Rollback on errors

3. **Admin Panel Tabs** (`src/components/AdminPanel.tsx`)
   - Added tab navigation between Features and A La Carte
   - Consistent UI/UX between both sections
   - Maintains state when switching tabs

4. **Data Layer Functions** (`src/data.ts`)
   - `addAlaCarteOption(optionData)` - Create new option
   - `updateAlaCarteOption(id, optionData)` - Update existing option
   - `batchUpdateAlaCartePositions(updates)` - Bulk position updates
   - Consistent error handling and retry logic with features
   - Firestore batch limit handling (500 ops per batch)

5. **Updated Tests** (`src/components/AdminPanel.test.tsx`)
   - Updated test expectations for new UI text
   - All 169 tests passing

**Verification**:

- UI compiles with TypeScript strict mode
- Follows same pattern as feature management
- All admin capabilities available (drag-drop, pricing, columns, etc.)
- Consistent with existing sale setup patterns

## Files Changed

### Modified Files

- `index.js` - Enhanced server startup validation and error handling
- `package.json` - Added prebuild and validate-env scripts
- `src/components/AdminPanel.tsx` - Added tabbed interface
- `src/data.ts` - Added A La Carte CRUD functions
- `src/components/AdminPanel.test.tsx` - Updated test expectations

### New Files

- `scripts/validate-env-vars.js` - Environment variable validation
- `src/components/AlaCarteForm.tsx` - A La Carte option form
- `src/components/AlaCarteAdminPanel.tsx` - A La Carte admin interface
- `src/test/server.test.ts` - PORT validation tests
- `docs/PR_DEPLOYMENT_FIX.md` - This documentation

## Historical deployment notes

The original manual Cloud Run deployment instructions have been retired. They bypassed the current
GitHub-to-Cloud-Build trigger, encouraged Firebase values on a command line, and did not prove which
revision received traffic.

Use [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) for the current immutable release lifecycle and
[CLOUD_RUN_TROUBLESHOOTING.md](CLOUD_RUN_TROUBLESHOOTING.md) for read-only failure classification.
Provider configuration, Firebase values, revisions, and traffic remain explicit approval gates.

## Verification Results

### Automated Tests

- All 169 unit tests passing
- TypeScript strict mode passes (0 errors)
- CodeQL security scan passes (0 vulnerabilities)
- Build succeeds with validation checks

### Manual Verification

- Server starts on localhost:8080
- `/health-check` returns 200 OK
- `/build-info.json` shows the deployed SHA and build time
- Env validation detects invalid PORT
- Graceful shutdown works

### Admin UI Verification

- A La Carte tab appears in Admin Panel
- Can add new A La Carte options
- Can edit existing options
- Drag-and-drop reordering works
- Column assignments work
- AND/OR connectors toggle correctly
- Form validation prevents invalid data

## Future Enhancements

While not in scope for this PR, consider these improvements:

1. **Admin UI Enhancements**
   - Delete functionality for A La Carte options
   - Bulk import/export
   - Image uploader integration (currently URL-based)

2. **Server Improvements**
   - Liveness probe endpoint
   - Metrics endpoint for monitoring
   - Request logging middleware

3. **Deployment**
   - Automated deployment on merge to main
   - Staging environment
   - Blue-green deployment strategy

4. **Testing**
   - E2E tests for admin UI
   - Integration tests for data layer
   - Performance testing

## Related Documentation

- [Cloud Deployment Guide](./CLOUD_DEPLOYMENT.md)
- [Admin Panel Architecture](../IMPLEMENTATION_TODO.md)
- [Main README](../README.md)

## Support

For issues or questions:

1. Check the [`/build-info.json`](http://localhost:8080/build-info.json) release identity
2. Review server logs for startup errors
3. Run `npm run validate-env` to check configuration
4. Refer to [CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md) for detailed guidance
