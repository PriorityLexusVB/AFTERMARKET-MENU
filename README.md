# Setting up the Firebase Backend

This document guides you through setting up a [Firebase](https://firebase.google.com/) project to act as a dynamic backend for the product menu application. This will allow you to manage packages, a la carte options, and pricing from the Firebase console without needing to change any code.

## Step 1: Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.
2.  Click on **"Add project"**.
3.  Give your project a **Name** (e.g., `lexus-menu-backend`).
4.  You can disable Google Analytics for this project if you don't need it.
5.  Click **"Create project"**. Wait for your project to be set up.

## Step 2: Set Up Firestore Database

1.  In your new project's dashboard, go to the **Build** section in the left sidebar and click on **Firestore Database**.
2.  Click **"Create database"**.
3.  Choose to start in **Production mode**. Click **"Next"**.
4.  Select a **Cloud Firestore location** that is closest to your user base. Click **"Enable"**.

## Step 3: Create Data Collections

You need to create three collections to store your product data.

1.  Go to the **Data** tab within Firestore.
2.  Click **"+ Start collection"** and create the following three collections. Use "Auto-ID" for Document IDs unless you have a specific ID you want to use (like `ppf-full`).

    *   **Collection ID:** `features`
    *   **Collection ID:** `ala_carte_options`
    *   **Collection ID:** `packages`

## Step 4: Add Your Product Data

Here is how your documents should be structured in each collection.

### `features` collection
Each document represents a single product feature.
*   **Example Document:**
    *   **name** (string): "Graphene Ceramic Coating"
    *   **price** (number): 1295
    *   **cost** (number): 600
    *   **description** (string): "A liquid polymer that bonds..."
    *   **points** (array): ["Extreme Gloss & Shine", "Hydrophobic Properties"]
    *   **useCases** (array): ["Water beads and rolls off...", "Protects paint..."]
    *   **warranty** (string): "7-Year Limited Warranty"

### `ala_carte_options` collection
Each document represents a standalone menu item.
*   **Example Document:**
    *   **name** (string): "Suntek Standard PPF"
    *   **price** (number): 995
    *   **cost** (number): 450
    *   **description** (string): "Partial hood and fender coverage..."
    *   **points** (array): ["Protects key impact zones"]
    *   **isNew** (boolean): true
    *   **warranty** (string): "10-Year Limited Warranty"

### `packages` collection
Each document represents a protection package.
*   **Example Document:**
    *   **name** (string): "Platinum"
    *   **price** (number): 3995
    *   **cost** (number): 1900
    *   **is_recommended** (boolean): true
    *   **tier_color** (string): "blue-400"
    *   **featureIds** (array): ["ppf-full", "ceramic-coating", "interior-protection"]
        *   **IMPORTANT:** This is an array of strings. Each string must be the **Document ID** of a document in your `features` collection.

## Step 5: Configure Firestore Security Rules

For this app to read data publicly but only allow logged-in admins to make changes, you need to update your security rules.

1.  In Firestore, go to the **Rules** tab.
2.  Replace the default rules with the following:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow public read access to all collections
        match /{document=**} {
          allow read: if true;
          // Allow write access only for authenticated users (your admins)
          allow write: if request.auth != null;
        }
      }
    }
    ```
3.  Click **"Publish"**.

## Step 6: Set Up Authentication

To create user accounts for the admin panel, you need to enable Email/Password authentication.

1.  In your Firebase project, go to the **Build** section and click on **Authentication**.
2.  Click the **"Get started"** button.
3.  In the **Sign-in method** tab, select **"Email/Password"** from the list of providers.
4.  Enable the provider and click **"Save"**.
5.  Go to the **Users** tab and click **"Add user"**. Create at least one user account that you will use to log into the admin panel.

## Step 7: Get App Credentials

The application needs your Firebase configuration to connect to the database.

1.  In the left sidebar, go to **Project Settings** (the gear icon next to "Project Overview").
2.  Under the **General** tab, scroll down to **"Your apps"**.
3.  Click the **Web** icon (`</>`) to register a new web app.
4.  Give the app a nickname (e.g., "Menu App") and click **"Register app"**.
5.  You will be shown a `firebaseConfig` object. Copy this entire object. It will look like this:
    ```javascript
    const firebaseConfig = {
      apiKey: "AIza...",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project",
      storageBucket: "your-project.appspot.com",
      messagingSenderId: "...",
      appId: "..."
    };
    ```

## Step 8: Add Credentials as a Secret

1.  In the development environment where you are editing the code, look for a "Secrets" panel (it is often represented by a key icon 🔑 in the left sidebar).
2.  Create **one** new secret:
    *   **Name:** `VITE_FIREBASE_CONFIG`
    *   **Value:** Paste the entire `firebaseConfig` object you copied from Firebase, including the opening `{` and closing `}`.

Once you have saved this secret, the preview will automatically refresh and connect to your Firebase project.