# Architecture rules

- Snapshot certificate template presentation in certificate metadata at issuance so later template edits never alter historical certificates.
- Render certificate template previews with the same client-side PDF renderer as downloads, using PDF.js only for display, to maintain output fidelity.