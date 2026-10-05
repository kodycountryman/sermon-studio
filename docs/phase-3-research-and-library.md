# Research, assistant settings and personal stories

## Pinned research

In Assistant → Deep Study, use Pin study to save a complete response, Pin overview for its summary, or Pin section inside an expanded detail. Preparation → Research holds the saved notes, retrieved translation snapshots and translation/cross-reference links. Notes are also included in future assistant context.

Pins attach to the selected passage when it is still valid, or to a matching Scripture paragraph. Topic studies without a matching passage remain sermon research. Clicking the passage returns to its text. Deleted passages retain detached notes; select another passage and use Attach to selection. Unpin preserves a checkpoint first.

Chat and Deep Study histories remain separate and temporary. Closing the Assistant keeps them while the sermon remains open; closing the sermon or reloading clears them. Only explicitly pinned research participates in manuscript autosave, database sync and version restoration. Links point to translations and cross references; generated theological explanations are study notes rather than verified scholarly citations.

## Editable assistant settings

The gear in the Assistant header opens theology, voice, writing rules and presentation preferences. Save applies the profile to both Chat and Deep Study. General, Youth, Adults, Staff teaching and Guest speaking have editable audience guidance. The chosen audience belongs to the sermon and restores with its versions; the profile is shared across sermons. Audience guidance adjusts presentation without changing theology. Response parsing and passage replacement protocols remain controlled by the application.

## Personal story library

Preparation → Stories imports the existing built-in and saved story bank without overwriting library edits. Search titles, text and themes; create or edit a story, specify delivery seconds, add privacy/name-change notes and mark whether names are already anonymized. Archiving retains usage history and hides the story by default.

Click an insertion point in the manuscript, then Insert story. This inserts an independent blue copy with paragraph boundaries and 0pt paragraph margins. Native Undo restores the text; a pre-insertion checkpoint is also kept. Later library edits do not change inserted copies. The library records sermon identity and insertion date; this is a historical insertion log, not a live count of copies still present. Privacy notes are advisory; names are not automatically rewritten.

## Storage

Research, audience and sermon story-use records travel with the manuscript's preparation metadata. Assistant profiles and reusable stories use a separate IndexedDB database (`sermon-studio-library`) and the same queued sync/conflict machinery as manuscripts. Preview keeps these records on the device. Production uses the existing `sermon_history` table with `preparation-library` and `preparation-library-version` modes; no schema migration is required. These internal modes are excluded from regular History. Library conflicts can be compared and resolved by keeping both copies or using the database copy.

## Verification

All 22 tests and the production build pass. Preview verification covered saved profile/audience reloads, story insertion boundaries and native Undo, usage tracking, independent inserted copies, a real streamed Romans 5:8 study, pinning, translation/cross-reference links, passage navigation, pin persistence after reload and temporary separate histories. Checkpoint restoration now explicitly refreshes the editable DOM even when the checkpoint's HTML matches the previous React state. The original manuscript was restored byte-for-byte after verification. Temporary database records verified profile, story metadata/usage and research/audience round trips and were removed. Existing PDF evaluation and large-bundle build warnings remain.
