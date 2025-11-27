# Priority Lexus Aftermarket Menu

This is an interactive digital menu for customers to explore and select vehicle protection packages and a la carte options. The application is built with React, TypeScript, Vite, and Tailwind CSS, and it uses Firebase for its backend data storage, authentication, analytics, and file storage.

## Features

- 🎨 **Interactive Package Selection** - Browse and select from curated protection packages
- 🛒 **A La Carte Options** - Build custom packages with individual options
- 🤖 **AI Assistant** - Get help choosing the right protection with Google Gemini AI
- 📊 **Analytics Tracking** - Comprehensive Firebase Analytics integration
- 📸 **Image Upload** - Firebase Storage integration for product images
- 🔒 **Admin Panel** - Secure admin interface for managing products
- ✅ **Type-Safe** - Full TypeScript with strict mode enabled
- 🧪 **Tested** - Comprehensive test coverage with Vitest
- 📱 **Responsive** - Mobile-friendly design with Tailwind CSS

## Local Development Setup

### Step 1: Clone the Repository
Clone this repository to your local machine.

### Step 2: Install Dependencies
Navigate to the project directory and install the required npm packages.
```bash
npm install
```

### Step 3: Set Up Environment Variables
The application connects to a Firebase project and uses the Gemini API. You need to provide credentials for both.

1.  Create a new file named `.env.local` in the root of the project.
2.  Copy the contents of `.env.example` into your new `.env.local` file.
3.  Fill in the values with your actual Firebase Web App configuration and your Gemini API key. All variables must start with `VITE_` to be recognized by the application.
3.  Fill in the values with your actual Firebase Web App configuration and your Gemini API key.

### Step 4: Run the Development Server
Start the Vite development server.
```bash
npm run dev
```
The application will now be running on your local machine, typically at `http://localhost:5173`.

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run typecheck    # Run TypeScript type checking
```

### Testing
```bash
npm test             # Run tests in watch mode
npm run test:ui      # Open Vitest UI for interactive testing
npm run test:run     # Run all tests once (CI mode)
npm run test:coverage # Generate test coverage report
```

### Deployment
```bash
npm start            # Build and start production server
npm run serve        # Start production server (requires build)
```

## Deploying to Google Cloud Run

### The Problem: Build-Time vs. Run-Time Variables
A Vite application like this one needs its environment variables (the ones starting with `VITE_`) to be available when it's **built**, not just when it's running. This is because Vite bundles the values directly into the final JavaScript files. The standard Google Cloud Run deployment process sets variables for run-time, which is too late for the build step, causing the build to fail or the app to run in a broken state.

### The Solution: Pass Variables to the Build
The correct way to fix this is to explicitly tell Google Cloud Build (which `gcloud run deploy` uses behind the scenes) to use your variables during the build.

### Step 1: Deploy from Your Local Machine
Run the following command from your project's root directory. This single command will build your application with the correct variables and deploy it to Cloud Run.

**Replace all the `YOUR_...` placeholders with your actual keys and settings.**

```bash
gcloud run deploy YOUR_SERVICE_NAME \
  --source . \
  --region YOUR_REGION \
  --allow-unauthenticated \
  --set-build-env-vars="VITE_FIREBASE_API_KEY=YOUR_API_KEY,VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN,VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID,VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET,VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID,VITE_FIREBASE_APP_ID=YOUR_APP_ID,VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY"
```

**Command Breakdown:**
*   `YOUR_SERVICE_NAME`: The name you want for your Cloud Run service (e.g., `lexus-aftermarket-menu`).
*   `YOUR_REGION`: The Google Cloud region where you want to host your service (e.g., `us-central1`).
*   `--set-build-env-vars`: This is the crucial flag. It takes a comma-separated list of key-value pairs and makes them available to the build process.

After running this command, your application should be successfully deployed and fully functional.
This application is configured to be deployed to Google Cloud Run.

### Step 1: Build the Application
First, build the application for production.
```bash
npm run build
```

### Step 2: Deploy to Google Cloud Run
Deploy the application using the `gcloud` CLI. You will be prompted to set up the service during the first deployment.

```bash
gcloud run deploy
```

### Step 3: Configure Environment Variables in Google Cloud Run
After deploying, you need to configure the environment variables in the Google Cloud Run service.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to your Cloud Run service.
3.  Click **"Edit & Deploy New Revision"**.
4.  Under the **"Variables & Secrets"** tab, add the following environment variables with their corresponding values from your Firebase project and Google AI Studio:
    *   `VITE_FIREBASE_API_KEY`
    *   `VITE_FIREBASE_AUTH_DOMAIN`
    *   `VITE_FIREBASE_PROJECT_ID`
    *   `VITE_FIREBASE_STORAGE_BUCKET`
    *   `VITE_FIREBASE_MESSAGING_SENDER_ID`
    *   `VITE_FIREBASE_APP_ID`
    *   `VITE_GEMINI_API_KEY`
5.  Click **"Deploy"** to apply the changes.

## Firebase Backend Setup

This guide walks you through setting up a Firebase project to act as a dynamic backend.

### Step 1: Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"**.
3.  Give your project a name (e.g., `lexus-menu-backend`).
4.  Disable Google Analytics if not needed and click **"Create project"**.

### Step 2: Set Up Firestore Database

1.  In your project dashboard, go to **Build > Firestore Database**.
2.  Click **"Create database"**.
3.  Start in **Production mode**.
4.  Select a Cloud Firestore location and click **"Enable"**.

### Step 3: Create Data Collections

In the **Data** tab within Firestore, create three collections: `features`, `ala_carte_options`, and `packages`.

### Step 4: Add Your Product Data

Structure your documents as follows:

#### `features` collection
*   **name** (string): "Graphene Ceramic Coating"
*   **price** (number): 1295
*   **cost** (number): 600
*   **description** (string): "A liquid polymer that bonds..."
*   **points** (array): ["Extreme Gloss & Shine"]
*   **useCases** (array): ["Water beads and rolls off..."]
*   **warranty** (string): "7-Year Limited Warranty"

#### `ala_carte_options` collection
*   **name** (string): "Suntek Standard PPF"
*   **price** (number): 995
*   **cost** (number): 450
*   **description** (string): "Partial hood and fender coverage..."
*   **points** (array): ["Protects key impact zones"]
*   **isNew** (boolean): true
*   **warranty** (string): "10-Year Limited Warranty"

#### `packages` collection
*   **name** (string): "Platinum"
*   **price** (number): 3995
*   **cost** (number): 1900
*   **is_recommended** (boolean): true
*   **tier_color** (string): "blue-400"
*   **featureIds** (array): ["ppf-full", "ceramic-coating"] (These are Document IDs from the `features` collection).

### Step 5: Configure Firestore Security Rules

In the **Rules** tab of Firestore, use these rules to allow public reading and authenticated writing.
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 6: Set Up Authentication

1.  Go to **Build > Authentication** and click **"Get started"**.
2.  Enable the **Email/Password** sign-in provider.
3.  In the **Users** tab, click **"Add user"** to create an account for the admin panel.

### Step 7: Enable Firebase Analytics

1. Go to **Build > Analytics** and click **"Get started"**.
2. Follow the prompts to enable Google Analytics for your Firebase project.
3. Analytics will automatically track user interactions and custom events.

### Step 8: Set Up Firebase Storage

1. Go to **Build > Storage** and click **"Get started"**.
2. Start in **Production mode** (you'll configure rules later).
3. Select a Cloud Storage location and click **"Done"**.

#### Configure Storage Security Rules

In the **Rules** tab of Storage, use these rules for secure image uploads:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /product_images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### Step 9: Get App Credentials for `.env` file

1. Go to **Project Settings** (gear icon).
2. Under **"Your apps"**, click the Web icon (`</>`) to register a web app if you haven't already.
3. Find the `firebaseConfig` object. Copy the key-value pairs from this object into your `.env.local` file as shown in the "Local Development Setup" section.

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
npm run test:e2e              # Run Playwright E2E tests
npm run test:e2e:update       # Update visual snapshots
```

Note: E2E tests require a built application. The Playwright configuration will automatically start the preview server.

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
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

## Feature Position & Connector Migration

The application supports feature ordering and connector configuration (AND/OR) between features in packages. This requires a one-time migration for existing data.

### Running the Migration

1. **Set up credentials**: Export the path to your Firebase Admin SDK service account JSON file:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   ```

2. **Run dry-run first** (recommended): This will show what changes would be made without actually modifying data:
   ```bash
   npm run migrate:feature-positions -- --dry-run
   ```

3. **Run the migration**:
   ```bash
   npm run migrate:feature-positions
   ```

### Migration Details
- Creates a backup JSON file before making any changes (stored in `./backup/`)
- Assigns sequential positions (0-indexed) to features within each column
- Sets `connector='AND'` for all features that don't have a connector set
- Idempotent: Safe to run multiple times
- Uses chunked batch writes (max 500 per batch) with retry logic

### Required Secrets for CI
For the CI pipeline to run E2E tests with Firebase, you'll need to configure these secrets in your repository:
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Service account JSON for Firebase Admin SDK
- `TEST_FIRESTORE_PROJECT_ID` - Firebase project ID for testing
- `FIREBASE_API_KEY` - Firebase Web API key
- `FIREBASE_AUTH_DOMAIN` - Firebase Auth domain
- `FIREBASE_STORAGE_BUCKET` - Firebase Storage bucket
- `FIREBASE_MESSAGING_SENDER_ID` - Firebase Messaging sender ID
- `FIREBASE_APP_ID` - Firebase App ID

## Analytics

The application includes comprehensive **Firebase Analytics** tracking:

### Tracked Events
- **Package Selection** - Which packages users choose
- **A La Carte Options** - Individual options added/removed
- **Feature Views** - Which features users click to learn more
- **Quote Finalization** - When users finalize their selection
- **Print Actions** - Quote printing behavior
- **AI Assistant Usage** - Assistant opens, messages sent, engagement
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
- **Between Columns**: Drag features to different columns (Gold, Elite, Platinum, Popular Add-ons)
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
- **Column 2**: Elite Tier features (additional beyond Gold)
- **Column 3**: Platinum Tier features
- **Column 4**: Popular Add-ons (a la carte options)
- **Unassigned**: Features not yet assigned to a column

### Guest View Rendering
Changes made in the Admin Panel are immediately reflected in the guest view:
- Features appear in their assigned column order
- AND/OR connectors render as dividers between features in packages
- Position determines the display order within each package tier

## Architecture

### Technology Stack
- **Frontend**: React 18.2.0 with TypeScript 5.2.2
- **Build Tool**: Vite 5.2.0
- **Styling**: Tailwind CSS 3.4.3
- **Backend**: Firebase 12.6.0 (Firestore, Auth, Analytics, Storage)
- **AI**: Google Gemini AI
- **Testing**: Vitest 4.0.10 + React Testing Library + Playwright
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Validation**: Zod 4.1.12
- **Deployment**: Google Cloud Run (containerized Express.js server)

### Project Structure
```
src/
├── components/       # React components
│   ├── *.tsx        # Component files
│   └── *.test.tsx   # Component tests
├── test/            # Test utilities
│   ├── setup.ts     # Test setup and global mocks
│   ├── test-utils.tsx # Custom render and mock factories
│   └── vitest.d.ts  # Type declarations for tests
├── analytics.ts     # Firebase Analytics utilities
├── firebase.ts      # Firebase initialization
├── schemas.ts       # Zod validation schemas
├── types.ts         # TypeScript type definitions
├── data.ts          # Firestore data access layer
└── App.tsx          # Main application component
```