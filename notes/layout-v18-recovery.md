# Layout v18 recovery

Production regression recovery introduced after the desktop footer/card release.

Protected behaviours:
- no residual black hero band below the homepage photographic composition;
- desktop footer groups are visible, not closed-and-unclickable disclosures;
- the footer ends with its content instead of stretching a dark floor through the viewport;
- reusable content-card rows use equal outer heights independent of copy length;
- Google review drawers keep a visible directional arrow affordance in closed/open states.

Validation is enforced by `tools/audit-layout-contract-v18.mjs` and the existing browser/design/Lighthouse gates.
