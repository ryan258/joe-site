# Tabletop Session State & Recovery Architecture

This document describes the state management, schema validation, error boundaries, and export/backup workflows implemented in the **Joe, Keeper of the Cow** tabletop companion HUD (`assets/js/app.js` and `layouts/partials/hud-dock.html`).

---

## 1. Storage Model & Schema Normalization

The companion HUD maintains client-side persistence in the browser's `localStorage` under the key:
```javascript
const STORAGE_KEY = 'joe_tabletop_hud_v1';
```

### Canonical State Shape
```json
{
  "hp": 51,
  "hpMax": 51,
  "tempHp": 0,
  "acMode": "mage_armor",
  "slots": {
    "l1": [true, true, true, true],
    "l2": [true, true, true],
    "l3": [true, true, true],
    "l4": [true],
    "magic_initiate_shield": true
  },
  "wandCharges": 7,
  "wandMax": 7,
  "concentrationSpell": null,
  "turnPhase": 0
}
```

### Normalization & Boundary Validation (`normalizeState`)
Any state retrieved from storage or an imported backup passes through strict validation:
* **Numeric Bounds:** HP ($0 \le \text{hp} \le \text{hpMax} \le 10,000$), Temp HP ($\ge 0$), Wand Charges ($0 \le \text{charges} \le \text{wandMax} \le 100$).
* **Turn Phase:** Integer in range $[0, 4]$ (representing Start of Turn, Movement, Action, Bonus Action, Cow Action).
* **AC Mode:** Enumerated values only (`'base'`, `'mage_armor'`, `'shield'`, `'full'`).
* **Spell Slots:** Discrete boolean arrays per level matching exact slot capacity (4 $\times$ Level 1, 3 $\times$ Level 2, 3 $\times$ Level 3, 1 $\times$ Level 4, plus Magic Initiate free Shield boolean). Default arrays are deeply cloned to avoid shared references across normalization passes.
* **Concentration:** Clean string (capped at 200 characters) or `null`. Rendered to the DOM via `textContent` to prevent script execution from untrusted imports.

---

## 2. Fault Tolerance & Corrupted Data Protection

Tabletop device browsers (e.g. mobile Safari, tablet Chrome) occasionally suffer storage quotas, private browsing blocks, or corrupt data from interrupted sessions. The engine protects user data through defensive state transitions:

1. **Malformed Storage Retention:**
   * If `localStorage` contains invalid or corrupted text, the system enters `savedProtection = 'recovery'`.
   * Existing stored raw bytes are **never silently overwritten** by normal counter increments or clicks.
   * The HUD falls back to an in-memory session and displays:
     > *"Saved text needs recovery and was kept. This session is temporary; download the stored copy before replacing it."*
   * A **"Download stored copy"** button is made visible, enabling the player to download raw corrupted text for manual extraction.

2. **Storage Quota & Blocked Access:**
   * If `localStorage.getItem` or `setItem` throws (e.g. private browsing storage block or quota exceeded), `savedProtection = 'unavailable'` is flagged.
   * State changes continue in temporary memory without crashing the interface.
   * The user is notified via the polite live status region that changes are in temporary memory and should be exported to keep.

---

## 3. Session Backup & Portability

Players moving between a laptop during preparation and an iPad/phone at the game table can export and import sessions safely.

### Backup File Format (`joe-hud-backup` v1)
Exported backup files wrap normalized state with metadata:
```json
{
  "format": "joe-hud-backup",
  "version": 1,
  "exportedAt": "2026-10-27T12:00:00.000Z",
  "state": {
    "hp": 51,
    "hpMax": 51,
    "tempHp": 0,
    "acMode": "mage_armor",
    "slots": { ... },
    "wandCharges": 7,
    "wandMax": 7,
    "concentrationSpell": "Web",
    "turnPhase": 2
  }
}
```

### Import Validation & Atomic Replacement
* **Schema Verification:** Files must contain valid JSON and match either the versioned `joe-hud-backup` format or a valid legacy raw state object.
* **Size Cap:** Uploaded files larger than 1 MB are rejected immediately.
* **Confirmation Gate:** Users are prompted with a confirmation dialog before replacement.
* **Atomic Rollback:** If storage write fails or parsing throws, the import is aborted and existing session state and saved storage bytes are retained unaltered.
* **Transient Object URL Cleanup:** Blob download URLs are revoked immediately after trigger via `URL.revokeObjectURL(url)`.

---

## 4. Accessibility & Responsive Viewport Clearance

### Accessibility (a11y)
* **Interactive Elements:** Spell slots and concentration pills are semantic `<button type="button">` elements with explicit `aria-label` tags describing slot level and index.
* **State Reporting:** Spell slot buttons toggle `aria-pressed="true"` when expended and `"false"` when available.
* **Live Status:** Session save and backup feedback is communicated via `#hud-save-status` configured as an ARIA live region:
  ```html
  <p id="hud-save-status" role="status" aria-live="polite" aria-atomic="true">...</p>
  ```

### Dynamic Bottom Dock Clearance
The fixed HUD dock wraps on narrow mobile displays or high-zoom tablet orientations.
* `initHudLayout()` monitors `.live-hud-dock` dimensions using `ResizeObserver` (with `window.onresize` fallback).
* The dock's measured height dynamically updates the CSS custom property `--hud-dock-height` on `document.documentElement`.
* Body padding automatically scales:
  ```scss
  padding-bottom: calc(var(--hud-dock-height, 90px) + env(safe-area-inset-bottom, 0px));
  ```
  This ensures page content, play cards, and modals are never occluded behind the floating dock.

---

## 5. Offline Test Suite

The test suite in [`tests/hud-recovery.test.cjs`](../tests/hud-recovery.test.cjs) runs under Node's native test runner (`node --test`) without third-party test dependencies.

Execute tests via:
```bash
node --test tests/hud-recovery.test.cjs
```

The 8 regression tests verify:
1. Malformed stored text retention and protection from overwrite.
2. Blocked storage reads and writes behavior.
3. Partial and legacy state normalization with independent array allocations.
4. Import rollback on storage write failure or schema violations.
5. Versioned backup serialization and round-trip fidelity.
6. Turn phase persistence across session reloads and UI updates.
7. HTML injection immunity when displaying concentration text.
8. Rejection of empty or unrelated JSON payloads.
