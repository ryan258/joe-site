# Project Roadmap: Joe, Keeper of the Cow Companion Site

This document outlines the development lifecycle, delivered capabilities, and future evolution of the **Joe, Keeper of the Cow** tabletop companion website.

---

## 🎯 Completed Milestones

### Phase 1: Core Architecture & Design System (Completed)
- [x] High-contrast, low-glare dark mode UI built with vanilla CSS design tokens.
- [x] Hugo Extended static site structure with zero external runtime dependencies.
- [x] Persistent client-side session HUD tracking HP, AC states, spell slots, wand charges, and concentration in `localStorage`.
- [x] Tablet and mobile touch-target optimization for tabletop iPad usage.

### Phase 2: Tactical Plays Database (Completed)
- [x] Indexed database of 250 canonical plays (150 Joe plays `J-1`..`J-150`, 100 Cow plays `C-1`..`C-100`).
- [x] Fast client-side multi-facet search by actor, phase (Action, Bonus Action, Reaction, Movement), and keywords.
- [x] Dedicated play detail modal and direct bookmarkable URL routes.
- [x] One-click table phrasing script copier for fast verbal declaration at the table.

### Phase 3: Grimoire & Evocation Arsenal (Completed)
- [x] Complete 2024 reference for all 23 Wizard spells and 6 cantrips.
- [x] Automated Sculpt Spells target counters and damage-negation scope display.
- [x] Potent Cantrip half-damage annotations on missed attack rolls and passed saves.
- [x] Costly component tags and ritual casting indicators.

### Phase 4: Cow (Mr. Big) Flight Deck (Completed)
- [x] Revised 2024 Owl statblock alignment (AC 11, 1 HP, 60 ft fly speed, Darkvision 120 ft, Perception +5, Stealth +5, no Keen Hearing/Sight trait).
- [x] Flyby touch spell delivery workflow and shared 60 ft approach/egress movement accounting.
- [x] Tactical Help action optimization guide with risk assessment criteria.
- [x] Staying aloft doctrine (falling on Prone, Incapacitated, or 0 speed without Hover).

### Phase 5: 2024 Rules Arbiter & Edge-Case Engine (Completed)
- [x] One Spell Slot Per Turn mechanical guardrails and Reaction timing.
- [x] Magic Action vs. Utilize Action distinctions (potions as Bonus Actions, oil application limitations).
- [x] Wand of Magic Missiles max 3-charge / 5-dart casting cap and 7th charge 1d20 destruction warning.
- [x] Counterspell 2024 Constitution saving throw, V/S/M trigger requirement, and slot preservation rules.
- [x] Dimension Door passenger size restriction removal.
- [x] Weapon Mastery disqualification for pure wizards.

### Phase 6: Operational Documentation & Tooling (Completed)
- [x] Comprehensive architectural guides in `docs/` and updated `spec.md`.
- [x] Reusable generation scripts in `scratch/parse_plays.py` and `scratch/parse_spells.py` aligned with 2024 rules.
- [x] Sub-second build performance via Hugo minify pipeline.

---

### Phase 7: Session Portability, Recovery & Accessibility (Completed)
- [x] Versioned JSON session backup export and import (`joe-hud-backup` v1) with full schema normalization and boundary validation.
- [x] Corrupted/malformed storage retention, non-destructive temporary in-memory fallback, and raw stored copy recovery download.
- [x] Semantic accessible button controls for spell slots and concentration with ARIA state binding (`aria-pressed`, `aria-label`, `aria-live="polite"`).
- [x] Responsive HUD dock wrapping with dynamic viewport bottom padding compensation (`--hud-dock-height` via `ResizeObserver`).
- [x] Active Turn Pilot phase persistence across browser sessions and reloads.
- [x] Native offline test suite (`tests/hud-recovery.test.cjs`) covering 8 state recovery, validation, and sanitization scenarios.

---

## 🔮 Future Horizons & Enhancements

### Phase 8: Encounter Assistant & Dice Tools
- [ ] Tabletop dice macro roller for signature plays (*Fireball* `8d6`, *Wand of Magic Missiles* `1d4+1` force, *Toll the Dead* `2d8`/`2d12`).
- [ ] Spell slot quick-reset presets for Short Rest (Arcane Recovery) and Long Rest.
- [ ] Combat round elapsed counter with initiative order tracker.

### Phase 9: Progressive Web App & Offline Media
- [ ] Progressive Web App (PWA) manifest with service worker caching for offline access.
- [ ] Tabletop PDF cheat-sheet exporter formatted for physical printouts.
- [ ] Audio cue triggers for high-stakes spell declarations and reaction alerts.
