# Priority Lexus Aftermarket Menu

This is an interactive digital menu for customers to explore and select vehicle protection packages and a la carte options. The application is built with React, TypeScript, Vite, and Tailwind CSS, and it uses Firebase for its backend data storage and authentication.

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

### Step 7: Get App Credentials for `.env` file

1. Go to **Project Settings** (gear icon).
2. Under **"Your apps"**, click the Web icon (`</>`) to register a web app if you haven't already.
3. Find the `firebaseConfig` object. Copy the key-value pairs from this object into your `.env.local` file as shown in the "Local Development Setup" section.