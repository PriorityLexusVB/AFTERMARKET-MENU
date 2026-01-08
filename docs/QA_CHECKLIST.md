# QA Checklist (iPad viewport + admin)

- [ ] Load menu on iPad Safari landscape and confirm layout respects header and bottom bar spacing.
- [ ] Toggle **Hidden items** in A La Carte Admin and verify unpublished/legacy rows appear when Show legacy is enabled.
- [ ] Expand a Product Hub row and confirm inline controls (Expand, Publish to A La Carte) render with normal labels.
- [ ] Rotate or resize the viewport and confirm CSS vars `--app-vh` and `--app-height` update together.
- [ ] Run `npm run test:run` and ensure all tests pass.
