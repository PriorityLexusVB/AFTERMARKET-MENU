# Setting up the Supabase Backend

This document guides you through setting up a [Supabase](https://supabase.com/) project to act as a dynamic backend for the product menu application. This will allow you to manage packages, a la carte options, and pricing from a user-friendly dashboard without needing to change any code.

## Step 1: Create a Supabase Project

1.  Go to [supabase.com](https://supabase.com/) and sign up for a free account.
2.  Once logged in, click on **"New project"**.
3.  Choose an organization and give your project a **Name** (e.g., `lexus-menu-backend`).
4.  Generate a secure **Database Password** and save it somewhere safe (you won't need it for the app, but it's important for database management).
5.  Select a **Region** that is closest to your user base.
6.  Click **"Create new project"**. Wait a few minutes for your project to be set up.

## Step 2: Set Up Database Tables

Once your project is ready, we need to create the tables to hold your data.

1.  In the left sidebar of your Supabase dashboard, find the **SQL Editor** (it has a database icon).
2.  Click on **"+ New query"**.
3.  Copy the entire SQL script below and paste it into the SQL Editor.
4.  Click the **"RUN"** button. This will create all the necessary tables and relationships.

```sql
-- Create the table for individual features/products that can be part of a package
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  points TEXT[],
  "useCases" TEXT[] -- Using quotes to preserve camelCase
);

-- Create the table for standalone a la carte options
CREATE TABLE ala_carte_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  points TEXT[],
  "isNew" BOOLEAN DEFAULT false, -- Using quotes to preserve camelCase
  warranty TEXT,
  "useCases" TEXT[] -- Using quotes to preserve camelCase
);

-- Create the table for the main package tiers
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_recommended BOOLEAN DEFAULT false,
  tier_color TEXT NOT NULL
);

-- Create a "join table" to handle the many-to-many relationship
-- between packages and features.
CREATE TABLE package_features (
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, feature_id)
);
```

## Step 3: Add Your Product Data

Now you can add your products and packages using the Supabase interface.

1.  In the left sidebar, click the **Table Editor** icon (looks like a spreadsheet).
2.  You will see the tables you just created (`features`, `ala_carte_options`, `packages`).
3.  Click on a table (e.g., `features`) and use the **"+ Insert row"** button to add your data. Fill in the fields for each product.
    *   **Important:** For fields like `points` and `useCases`, which are arrays, enter values in this format: `{"Point 1", "Point 2", "Another Point"}`.
4.  Do the same for `ala_carte_options` and `packages`.
5.  **To link features to a package:**
    *   Go to the `package_features` table.
    *   Click **"+ Insert row"**.
    *   In the `package_id` column, select the package you want to add a feature to.
    *   In the `feature_id` column, select the feature you want to include in that package.
    *   Repeat for every feature you want in every package.

## Step 4: Configure App Credentials

The application needs to know how to connect to your new Supabase project.

1.  **Find Your Credentials:**
    *   In the left sidebar of your Supabase dashboard, go to **Project Settings** (the gear icon).
    *   Click on the **API** tab.
    *   Under **Project API Keys**, you will find your **Project URL** and your `anon` `public` key.

2.  **Create a `.env` file:**
    *   In the root directory of the application code, create a new file named `.env`.
    *   Add the following content to this file, replacing the placeholder values with the ones you just copied from your Supabase dashboard.

    ```
    SUPABASE_URL="YOUR_SUPABASE_URL"
    SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

    *   **Example:**
        ```
        SUPABASE_URL="https://xyzabcdefg.supabase.co"
        SUPABASE_ANON_KEY="eyJh...YourVeryLongPublicKey...abc"
        ```

That's it! Once the `.env` file is in place, restart your application, and it will now fetch all its data directly from your Supabase project.
