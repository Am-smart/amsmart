# Certificate template PDF fidelity

## Goal
Make every downloadable certificate use the colour and wording selected by the administrator when it was issued.

## Implementation
- Resolve and validate the selected template during certificate issuance.
- Store a snapshot of the template title, body wording, and accent colour on the certificate so later template edits do not change already-issued certificates.
- Include that snapshot in certificate responses and use it in the browser PDF renderer.
- Keep backward compatibility by resolving older certificates from the current template list, with the existing classic design as a final fallback.
- Verify type safety, build status, and generated PDF rendering.

## Technical details
- Extend certificate metadata/DTO mapping rather than changing the database schema.
- Keep PDF generation client-side and dynamically load the existing PDF library.
- Sanitize colour values and wrap long administrator-provided wording to prevent clipping.
