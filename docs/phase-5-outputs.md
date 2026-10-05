# Finished-sermon outputs

Editing controls → Outputs opens Word / PDF, Slide points and Materials in a keyboard-accessible dialog. The panel captures a named source checkpoint before exporting, collecting slide points or generating materials. Sources contain the immutable title, manuscript HTML and readable text, editor font size, audience, revision and saved version ID. A batch uses one source and one captured assistant profile.

## Word and PDF

Both download actual files. Manuscript colors preserve colored runs, yellow backgrounds, bold, italics, underline, explicit run font sizes, hard line breaks and simple list numbering. Print friendly black removes colors/backgrounds and retains emphasis. Paragraph spacing is zero before and after, with 1.6 line spacing and Letter pages. Subsequent downloads use the same snapshot until Use latest manuscript is clicked. Export engines load only when needed. Fonts are Arial in Word and embedded Roboto in PDF; arbitrary imported fonts, images and complex tables are outside this text-manuscript export.

## Slide queue

Collect highlighted points finds contiguous yellow runs and links each to its stable manuscript block. Existing queue order and edited slide wording survive recollection. Points can be edited, reordered, removed, exported as text, or used to jump to their source. Source wording changes and removed/no-longer-highlighted passages are flagged. Accept current source refreshes the recorded quotation but keeps the edited slide wording. A presentation deck exporter is deferred.

## Materials

Choose any combination of small-group guide, sermon summary, devotional, discussion questions and social captions. Generation streams complete drafts, uses the editable assistant profile and current audience, and requires no invented stories, statistics or citations. The group guide includes questions, leader notes and a practical response. Completed drafts persist with preparation metadata and are editable, expandable, copyable and downloadable as Word/PDF. Source changes are flagged. Interrupted batches retain only completed drafts; incomplete protocol fragments are discarded. Generated drafts require editorial review.

## Verification

31 automated tests pass, including nested export formatting, hard breaks and list numbering, real DOCX archive generation, zero PDF margins between paragraphs, print layout, slide deduplication/change detection, complete-only material parsing and stale-source checks. Production build passes with the existing PDF evaluation and large-bundle warnings.

An isolated localhost preview confirmed Word/PDF generation, slide collection, independently edited wording surviving recollection and reload, all five real AI material outputs sharing one version ID, material persistence on reload, and source-change flags after editing the sermon. The color PDF and black print PDF were rendered and visually checked; Word XML verified colors, highlights and before/after spacing of zero. The in-app browser did not expose a download-file event for the blob links, so physical download-path capture was unavailable; export engine files were separately rendered/inspected. The user's existing document tab was not edited during verification. Publication remains a separate action.
