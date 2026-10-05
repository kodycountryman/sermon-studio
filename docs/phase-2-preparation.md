# Document preparation tools

Open Preparation from the editing controls, or use the outline icon in the collapsed full-screen HUD. Outline, Scratchpad and Comments share one panel. It docks on wide screens and overlays the left edge on narrower screens, with a close button to return to the document.

## Outline and section movement

Each top-level document block receives a stable `data-ss-block` ID. Existing IDs survive sanitized saves and version restores. Duplicate IDs from browser paragraph splitting receive new IDs. Loose inline document text is grouped into blocks without changing its words or formatting.

HTML headings and short yellow-highlighted paragraphs form automatic section boundaries. Scripture references appear as navigation links inside their sections. Click a section or reference to jump to it. Click a paragraph in the document and choose Use selected paragraph as a section to add a boundary. Merge removes a boundary, keeping its paragraphs with the previous section.

Drag a section above another, drop it at the end, or use Move up / Move down. All paragraphs until the next boundary move together as their original DOM nodes, preserving formatting and comment IDs. A version checkpoint is saved before movement. Use Versions to restore the prior order.

## Scratchpad

Scratchpad text is separate manuscript metadata. It autosaves, syncs and participates in version history, but is excluded from manuscript counts, copied HTML and the assistant's manuscript context.

## Comments

Highlight a passage, open Comments and add a note. Each note stores stable start/end block IDs, text offsets and its original quoted passage. Clicking the quoted passage selects the annotated text. Unresolved notes appear as margin markers and contribute to the Comments count. Resolve / Reopen and the filter retain access to completed notes.

Offsets follow edits within a paragraph. Reordering preserves anchors by block ID. Deleted passages retain their notes as detached comments; highlight another passage and use Attach to selection to reattach. Complex structural edits that remove an anchor block can also detach a note safely rather than attach it to an unrelated passage.

Preparation metadata is included in local drafts, emergency recovery, cloud records and checkpoints. Restoring a version restores its notes and boundaries. Versions predating these tools restore an empty preparation panel. Copy and Coach output omit block identifiers and margin markers.

## Verification

`npm test` covers section boundaries, whole-section movement, offset mapping, detached comments, anchor preservation during reordering and storage of preparation-only edits. The in-app preview verified navigation, passage comments, movement with preserved anchors, refresh recovery, scratchpad exclusion from the word count, resolve/reopen, deletion/reattachment and restoration of the pre-test manuscript. Temporary live database records verified metadata and checkpoint round trips and were removed.
