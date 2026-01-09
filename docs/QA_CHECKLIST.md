# QA Checklist (iPad viewport + admin)

- [ ] Load menu on iPad Safari landscape and confirm layout respects header and bottom bar spacing.
- [ ] Toggle **Hidden items** in A La Carte Admin and verify unpublished/legacy rows appear when **Show legacy/unpublished in lanes** is enabled.
- [ ] Expand a Product Hub row and confirm inline controls (Expand, Publish to A La Carte) render with normal labels.
- [ ] Packages page (iPad Safari landscape): no scroll; all package lanes visible and clickable.
- [ ] Popular Add-ons ordering: reordering A La Carte Featured (Column 4) updates Popular Add-ons order in customer view.
- [ ] Rotate or resize the viewport and confirm CSS vars `--app-vh` and `--app-height` update together.
- [ ] Run the repo's test script (npm/pnpm/yarn as configured) and ensure tests pass.
