# Project Overview

This is a Next.js fitness application with Supabase authentication/data storage and Gemini-powered AI features for chat, food scanning, and body scanning.

# Replit Migration Notes

- The app runs with `npm run dev` on `0.0.0.0:5000` for Replit preview compatibility.
- Gemini browser calls were moved behind the server route `app/api/gemini/route.ts` so the API key is not referenced by client components.
- Supabase public URL and anon key remain client-side because Supabase browser authentication requires them.

# Key Files

- `app/` contains Next.js pages and API routes.
- `components/` contains the main UI and feature components.
- `lib/supabase.ts` initializes the Supabase browser client.
- `.local/state/replit/agent/progress_tracker.md` tracks import migration completion.