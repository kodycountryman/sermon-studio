# Manuscript autosave and recovery

The SermonEditor saves to IndexedDB after 700 ms of inactivity. Text, title and font changes also create a synchronous localStorage safety copy immediately. The safety copy is recovered on reload, then removed once the matching draft reaches IndexedDB. Page hiding and editor closing flush the current draft. The active sermon, cursor, zoom and scroll position are restored after a refresh. Closing the editor deliberately clears the active-sermon marker.

Existing `ss_saved_sermons_v1` records migrate into IndexedDB without deleting the originals. Manuscripts and their versions are sanitized before display. Assistant conversations remain temporary and are not stored with drafts.

## History

Initial manuscripts, changes at two-minute intervals, manual saves and named versions create checkpoints. Assistant replacements preserve the prior manuscript first. Restoring a version preserves the replaced manuscript. Versions contain their own title, formatted HTML, font size, timestamp and label. The Versions button opens previews and restore controls.

## Online synchronization

Development stores drafts and versions on the device. Production additionally queues cloud writes against the existing Supabase `sermon_history` table. Manuscripts use `mode_id=saved-sermon`; versions use `mode_id=saved-sermon-version`. Revision and editor metadata are stored in the existing input column, so no schema migration is required. The generic AI history excludes both modes.

Cloud updates compare the previous timestamp and exact metadata before writing. A changed remote revision creates a conflict without overwriting either document. Review copies lets the user keep both (the device copy gets a separate sermon ID) or continue with the cloud copy. Both source copies are kept in version history. Failed requests leave pending drafts on the device; reconnection and a 30-second production interval retry them. History upload failure retains the successfully uploaded manuscript revision so subsequent edits do not create a false conflict.

## Offline access

Production's service worker caches the built HTML and hashed assets. API and database responses are not cached. Previously downloaded sermons live in IndexedDB. With no network and no active sign-in session, the lock screen offers a device-only offline library without granting access to online features. A first visit still requires a connection to download the application. Development uses the running Vite server and does not cache its live modules.

AI requests and new Scripture retrieval require a connection. Browser data clearing removes device copies. Storage errors are displayed as Needs attention rather than claiming a successful save.

## Verification

Run `npm test` for storage and service-worker tests, and `npm run build` for the production bundle. Storage tests cover reload recovery, concurrent writes, checkpoint restore, offline queues, conflicts, requests in flight, retry behavior, legacy migration and history upload failure. Service-worker tests cover cached shell/bundle responses with the network unavailable and API exclusion.

During implementation, the in-app browser verified an immediate refresh after a title edit and manuscript keystroke, exact text recovery, named checkpoint creation and restoration of the original 2,055-word sermon. Temporary live Supabase records verified inserts, conditional updates, stale-write rejection and version retrieval; those temporary records were removed.
