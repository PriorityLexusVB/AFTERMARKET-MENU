# Priority Lexus Aftermarket Menu

This is an interactive digital menu for customers to explore and select vehicle protection packages and a la carte options. The application is built with React, TypeScript, Vite, and Tailwind CSS, and it uses Firebase for its backend data storage, authentication, analytics, and file storage.

## Features

- **Interactive Package Selection** - Browse and select from curated protection packages
- **A La Carte Options** - Build custom packages with individual options
- **Analytics Tracking** - Comprehensive Firebase Analytics integration
- **Image Upload** - Firebase Storage integration for product images
- **Admin Panel** - Secure admin interface for managing products
- **Type-Safe** - Full TypeScript with strict mode enabled
- **Tested** - Comprehensive test coverage with Vitest
- **Responsive** - Mobile-friendly design with Tailwind CSS
- **Popular Add-Ons** come from A La Carte Featured (Column 4)

## Install on iPad

Open the site in Safari on iPad tap **Share** **Add to Home Screen** launch from the new icon for a full-screen experience.

## Local Development Setup

### Step 1: Clone the Repository

Clone this repository to your local machine.

### Step 2: Install Dependencies

Navigate to the project directory and install the exact locked dependency graph.

```bash
npm ci
```

### Step 3: Use the local Firebase Emulator Suite

Local development is emulator-only by default. Do not copy an actual Firebase Web App configuration
into `.env.local` or connect this checkout to a cloud project without explicit provider approval and
exact project-identity evidence.

1. Start the emulators:

```bash
npm run emulators:start
```

2. Seed the emulator with demo data (in a separate terminal):

```bash
npm run emulators:seed
```

3. Start the app in emulator mode:

```bash
npm run dev:emulator
```

Notes:

- Firestore Emulator may require Java. If you see Java-related errors, install a recent JDK (11+).
- The seed data lives in `tools/firestore-seed.json` and is loaded by `tools/seed-emulator.ts`.
- `npm run emulators:seed` waits for the Firestore emulator port to be reachable before seeding.

#### Firebase MCP boundary

The optional Firebase MCP uses the active Firebase CLI credentials and can reach Firestore, rules,
and Auth. It is not part of the normal local workflow. Do not start it against any cloud project
without explicit approval, an exact non-production project identity, least-privilege credentials,
and a read/write scope review. Never infer the target from cached CLI state.

### Step 4: Run the Development Server

Start the Vite development server in emulator mode.

```bash
npm run dev:emulator
```

The application will now be running on your local machine, typically at `http://localhost:5173`.

## Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run dev:emulator # Start dev server connected to Firebase emulators
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run typecheck    # Run TypeScript type checking
npm run verify       # Run the complete local merge gate
```

### Firebase Emulators

```bash
npm run emulators:start # Start Firestore + Auth emulators
npm run emulators:seed  # Seed Firestore emulator with demo data
```

### Testing

```bash
npm test             # Run tests in watch mode
npm run test:ui      # Open Vitest UI for interactive testing
npm run test:run     # Run all tests once (CI mode)
npm run test:coverage # Generate test coverage report
```

### Linting

```bash
npm run lint         # Run ESLint across the repo
npm run lint:fix     # Auto-fix what ESLint can
```

### Deployment

```bash
npm start            # Start the prebuilt production server
npm run serve        # Start production server (requires build)
```

`npm start` and `npm run serve` never compile the application. They serve the already validated
`dist` directory from the container image.

## CI / GitHub Actions notes

### Firebase isolation

The CI workflow runs Playwright E2E in demo/mock mode only. It does not read Firebase repository
secrets or connect the test build to a cloud Firebase project.

## Deploying to Google Cloud Run

Production uses the existing GitHub-to-Cloud-Build trigger. Do not run an ad hoc local deploy or
place Firebase values on a command line. Cloud Build must provide all six required
`VITE_FIREBASE_*` names while `npm run gcp-build` creates the image. Git metadata or the provider
`COMMIT_SHA` value must supply the same full 40-character commit. The build validator then requires
that exact SHA, an ISO build time, and no public source maps.

Cloud Run starts with `node index.js` and serves that immutable build. Runtime `VITE_*` values do
not modify an already built bundle.

See [docs/CLOUD_DEPLOYMENT.md](docs/CLOUD_DEPLOYMENT.md) for the authoritative release gates,
readback, and rollback sequence.

## Firebase backend boundary

The production Firebase project, web app, Firestore rules, Auth providers/users, Storage rules,
Analytics, credentials, and data are existing protected resources. Do not create, link, copy, or
modify any of them from this README. Every provider, Auth, rules, credential, or production-data
change requires explicit approval plus exact project-identity and rollback evidence.

For ordinary development, use the local Firebase Emulator Suite described below. If a separate
non-production cloud project is ever approved, it must have a distinct project identity, test-only
data, least-privilege rules, separate credentials, and a documented deletion/rollback owner. Never
point local seed or migration scripts at production by inference.

The application data model uses these collections:

- `features`: product description, pricing, ordering, connector, warranty, and presentation fields;
- `ala_carte_options`: standalone option pricing and presentation fields;
- `packages`: tier pricing, presentation fields, and legacy-reference metadata.

Treat this list as a source schema summary, not authorization to create or edit provider data.

## Testing

This project uses **Vitest** for unit testing with **React Testing Library** for component tests, and **Playwright** for end-to-end (E2E) testing.

### Running Unit Tests

```bash
npm test              # Run tests in watch mode
npm run test:ui       # Open interactive test UI
npm run test:run      # Run all tests once (CI mode)
npm run test:coverage # Generate coverage report
```

### Running E2E Tests

```bash
npm run test:e2e:install      # Install Playwright browsers (run once per machine)
npm run test:e2e              # Run Playwright E2E tests
npm run test:e2e:update       # Update visual snapshots
```

Note: E2E tests use a preview server. The Playwright configuration will build and start it automatically.

### Test Coverage

- **90+ tests** across unit and integration test files
- Comprehensive coverage of core components and utilities
- Mock data factories for consistent test data
- Type-safe test utilities
- E2E tests for critical user flows

### Writing Tests

Unit tests are located in `src/` alongside their source files with `.test.tsx` or `.test.ts` extensions.
E2E tests are located in the `e2e/` directory.

Example:

```typescript
// src/components/MyComponent.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "../test/test-utils";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });
});
```

## Feature position and connector migration

The repository retains migration utilities for feature ordering and connectors. They can write
Firestore and are not routine setup commands. Before any use, first prove the migration is still
needed against the exact approved project, review its dry-run output, record a backup/rollback plan,
and obtain explicit production-data and credential approval. A successful local dry run does not
authorize the write.

CI secret names are centrally managed repository settings. Do not add, rotate, print, or copy secret
values from this README; changes require separate secrets/permissions approval.

## Analytics

The application includes comprehensive **Firebase Analytics** tracking:

### Tracked Events

- **Package Selection** - Which packages users choose
- **A La Carte Options** - Individual options added/removed
- **Feature Views** - Which features users click to learn more
- **Quote Finalization** - When users finalize their selection
- **Print Actions** - Quote printing behavior
- **Admin Actions** - Admin panel access and feature management

### Viewing Analytics

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Analytics > Dashboard**
3. View real-time user activity and custom events

## Admin Panel

The Admin Panel provides a comprehensive interface for managing product features. Access it by clicking the "Admin" button in the header (requires authentication).

### Feature Management

The admin editor supports full drag-and-drop functionality for organizing features:

#### Drag and Drop

- **Within Column**: Drag features up/down to reorder within the same column
- **Between Columns**: Drag features to different columns (Elite, Platinum, Gold, Popular Add-ons)
- **Keyboard Navigation**: Use up/down arrow buttons for accessibility

#### AND/OR Connector Toggle

Each feature has a connector setting that controls how it displays relative to other features in packages:

- **AND** (green) - Feature is included together with adjacent features
- **OR** (yellow) - Customer chooses one option from a group

Click the AND/OR badge on any feature to toggle its connector type. Changes are saved immediately.

#### Adding/Editing Features

1. Click "Add New Feature" to create a new feature
2. Fill in required fields: Name, Retail Price, Internal Cost, Description
3. Select a Display Column to assign the feature to a tier
4. Choose the Feature Connector (AND or OR)
5. Add optional media (images, videos) and key points
6. Click "Save Feature" to persist changes

### Column Organization

Features are organized into columns representing package tiers:

- **Column 1**: Gold Tier features
- **Column 2**: Elite Tier features
- **Column 3**: Platinum Tier features
- **Column 4**: Popular Add-ons (a la carte options)
- **Unassigned**: Features not yet assigned to a column

#### Strict Per-Tier Column Mapping

The application uses **strict per-tier column mapping** to ensure admin and customer-facing package contents match:

- **Gold Package** = Column 1 only
- **Elite Package** = Column 2 only
- **Platinum Package** = Column 3 only

Each package derives its features exclusively from its assigned column. This eliminates the admin/customer mismatch that can occur when admin columns are empty but legacy `featureIds` arrays still contain data.

#### Multi-Tier Feature Presence

If a feature should appear in multiple package tiers:

1. Create the feature in Product Hub
2. Assign it to one column
3. Duplicate the feature for each additional tier
4. Assign each copy to its respective column

Example: A "Ceramic Coating" feature appearing in all three tiers would need three separate feature entries (one in Column 1, one in Column 2, one in Column 3).

#### Removing legacy `featureIds`

Legacy package `featureIds` are no longer used for rendering. The repository retains a removal
migration, but its need and deployed-data state are not established by this README. Do not run it
against any cloud project without the migration approval, exact project identity, dry-run evidence,
backup, and rollback gates above.

### Guest View Rendering

Changes made in the Admin Panel are immediately reflected in the guest view:

- Features appear in their assigned column order
- AND/OR connectors render as dividers between features in packages
- Position determines the display order within each package tier

## Firebase Emulator Setup (Local Development)

For local development without connecting to production Firebase, you can use the Firebase Emulator Suite with seed data.

### Prerequisites

1. Install the locked repository dependencies: `npm ci`
2. Confirm the repository CLI version: `npx --no-install firebase --version`
3. Use the checked-in emulator configuration; do not run a new global or floating CLI install

### Starting the Emulator

```bash
# Start Firebase emulators (from project root)
npm run emulators:start

# The Firestore emulator typically runs at localhost:8081
# The Emulator UI will be available at http://localhost:4000
# Check your firebase.json for actual port configuration
```

### Seeding the Emulator with Test Data

The project includes seed data for all features, packages, and a la carte options with their correct column assignments and ordering.

1. Start the Firebase emulator (see above)
2. In a new terminal, run:

```bash
# Set the emulator host and run the seed script
# Use the port configured in your firebase.json (typically 8081 for Firestore)
FIRESTORE_EMULATOR_HOST=localhost:8081 npm run seed:emulator
```

### Seed Data Structure

The seed data in `tools/firestore-seed.json` includes:

**Features (with column/position/connector):**

- RustGuard Pro (Column 1, Position 0)
- ToughGuard Premium (Column 1, Position 1)
- Interior Leather & Fabric Protection (Column 1, Position 2, connector: OR)
- Diamond Shield Windshield Protection (Column 2, Position 0)

**Packages:**

- Elite ($3,499) - All 4 features
- Platinum ($2,899) - 3 core features (recommended)
- Gold ($2,399) - 3 core features

**A La Carte Options (Column 4):**

- Suntek Pro Complete/Standard Packages
- Headlights Protection
- Door Cups Only
- EverNew Appearance Protection

### Running the App with Emulator

After seeding, start the preconfigured emulator development mode. It supplies the demo project ID
for this process without writing cloud configuration into `.env.local`.

```bash
npm run dev:emulator
```

## Architecture

### Technology Stack

- **Frontend**: React 18.2.0 with TypeScript 5.2.2
- **Build Tool**: Vite 5.2.0
- **Styling**: Tailwind CSS 3.4.3
- **Backend**: Firebase 12.6.0 (Firestore, Auth, Analytics, Storage)
- **Testing**: Vitest 4.0.10 + React Testing Library + Playwright
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Validation**: Zod 4.1.12
- **Deployment**: Google Cloud Run (containerized Express.js server)

### Project Structure

```
src/
 components/       # React components
    *.tsx        # Component files
    *.test.tsx   # Component tests
 test/            # Test utilities
    setup.ts     # Test setup and global mocks
    test-utils.tsx # Custom render and mock factories
    vitest.d.ts  # Type declarations for tests
 analytics.ts     # Firebase Analytics utilities
 firebase.ts      # Firebase initialization
 schemas.ts       # Zod validation schemas
 types.ts         # TypeScript type definitions
 data.ts          # Firestore data access layer
 App.tsx          # Main application component
```
