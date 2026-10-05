# Preaching time and manuscript workshops

## Timing

The document-count overlay now includes a clickable estimated duration. Open it to adjust speaking pace (60–240 words/minute), pauses/audience interaction (0–100 percent) and additional time (0–3600 seconds). Settings belong to each sermon's preparation metadata, so autosave, emergency recovery, database sync and version restoration retain them.

Calculation: manuscript words / pace, increased by the interaction percentage, plus fixed additional time. Empty documents return zero. Estimates include all text, including headings and preparation cues inside the manuscript. Separate Scratchpad, Research and Comments are excluded. These estimates are not measured delivery durations.

Outline sections show estimates using every paragraph until the next section boundary. They use the same pace and percentage. Fixed additional time belongs to the sermon total, rather than being repeated for each section. Future post-sermon reflections can inform manually adjusted pace; automatic calibration is outside this phase.

## Assistant workshops

Assistant → Chat → Workshops offers Opening workshop, Closing workshop and Find callbacks. Requests use the live manuscript, current audience, editable profile, pinned research and current selection. Text in the message box supplies additional instructions.

Responses stream brief coaching and up to three independently expandable options. Completed options use the existing safe sermon-format renderer. Opening approaches connect tension to the central message; closings can offer application, prayer or an invitation supported by the sermon. Callback drafts connect actual opening images/questions/lines to the ending. Personal experiences and citations must not be invented.

Without an attached selection, options can be copied but cannot be directly applied. With a selection, every option is instructed to replace that entire selection and preserve material outside the intended opening/closing change. Application revalidates the captured text before and after creating a checkpoint. A changed or detached passage is rejected. Application uses native insertion for Undo. Other options from the same response become disabled after application. Ordinary Chat and Deep Study requests retain their previous behavior and temporary separate histories.

## Verification

All 27 tests and the production build pass. New tests cover timing arithmetic, bounded inputs, whole-section estimates, complete streamed option parsing, request/protocol constraints and timing restoration from versions. Browser testing used an isolated localhost test document: adjustable duration matched the computed estimate, live opening/closing/callback requests produced alternatives, non-selected Apply stayed disabled, selected closing application preserved the opening/application/Scripture and zero paragraph margins, and native Undo restored the ending. Section times, persisted settings after reload and the pre-apply checkpoint were verified. Existing PDF evaluation and large-bundle build warnings remain. The user's existing document tab was not edited during these tests.
