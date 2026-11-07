# Kindred

A small, responsive social app built with React, Vite, and Supabase. It includes email sign-up/sign-in, editable profiles, profile browsing, a shared post feed, likes, comments, and admin moderation.

## Run locally

1. Install Node.js 20 or later.
2. Create a Supabase project.
3. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql). If you already ran an earlier version, run the updated script again to add likes and admin moderation.
4. Copy `.env.example` to `.env.local` and fill in the project URL and anon key from **Supabase → Project Settings → API**:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

5. In Supabase **Authentication → URL Configuration**, add your local URL (for example `http://localhost:5173`) to the allowed redirect URLs.
6. Install and start the app:

   ```sh
   npm install
   npm run dev
   ```

The anon/publishable key is intended for browser apps; access is controlled by the row-level security policies in the SQL schema. **Never add a Supabase service-role key to this app or commit your `.env.local` file.**

The schema grants the `lukagg202@gmail.com` account admin status, including if its account already exists when the schema is applied. Admins can ban/unban members and remove comments; database policies enforce these permissions. Members can browse profiles, edit their own profile, and like/unlike posts.

## Deploy to GitHub Pages

1. Push this project to a GitHub repository, with the workflow at `.github/workflows/deploy.yml` on its `main` branch.
2. In your repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions → Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` using the values from your Supabase project's API settings. These are public browser values, not secret service-role credentials.
4. In Supabase **Authentication → URL Configuration**, add your GitHub Pages URL to the allowed redirect URLs (for a project site, this is `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`).
5. The workflow builds and deploys the static app whenever you push to `main`.

For local builds you can use `.env.local`. Do not use a service-role key.
