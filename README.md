# SyncSpace (frontend phase)
Run: open this project folder in VS Code, then right-click `index.html` and choose "Open with Live Server" (or open it directly in a browser).
Data is stored in your browser's localStorage (keys `syncspace_db_v1`, `syncspace_prefs_v1`). Settings > Reset demo data restores the seed.
Supabase later: auth, shared database + row-level security policies, realtime subscriptions, Storage for files, and an atomic
`update ... where id = ? and version = ?` for conflict detection. Replace the services in `storage.js`.
