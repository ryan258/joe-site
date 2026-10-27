# Joe, Keeper of the Cow: Live Action Tabletop Reference Site Specification (`spec.md`)

## 1. Executive Summary & Vision

### 1.1 Project Mission
To build the definitive, ultra-responsive, zero-latency live tabletop companion website for piloting **Joe, Keeper of the Cow** (Level 7 Evoker Wizard, D&D 5.5e / 2024 Rules). 

During live tabletop play, decision paralysis and rules lookups stall combat momentum. This application transforms Joe's canonical character data, 250 tactical plays (150 Joe Plays `J-1`..`J-150` + 100 Cow Plays `C-1`..`C-100`), 2024 Rules Arbiter mechanics, and the 4-step Investigation Framework into an interactive, tactical **Flight Deck & Combat Cockpit**.

### 1.2 Tabletop Operating Constraints
* **Latency Requirement:** Sub-100ms instantaneous lookup, client-side fuzzy search, zero network round-trips during live gameplay.
* **Lighting & Ergonomics:** High-contrast Dark Mode default (low glare at game tables), dense information hierarchy, tactile touch targets for tablets/phones, keyboard shortcuts (`/` for search, `1-5` for turn phases) for laptops.
* **Offline-First:** 100% functional without internet connectivity.
* **State Persistence:** Local storage tracks session HP, spell slots, Wand of Magic Missiles charges, and active concentration across page refreshes.

---

## 2. Information Architecture & Site Taxonomy

```
joe-site/
├── content/
│   ├── _index.md                  # Combat Cockpit / Turn Pilot Dashboard
│   ├── plays/                     # Tactical Plays Database (250 Plays)
│   │   ├── _index.md              # Searchable Plays Hub
│   │   ├── joe/                   # Plays J-1 through J-150
│   │   └── cow/                   # Plays C-1 through C-100
│   ├── spellbook/                 # Spells & Cantrips (29 Total)
│   │   ├── _index.md              # Prepared vs Known Grimoire Matrix
│   │   └── [spell-slug].md        # Dedicated Spell Detail Pages
│   ├── familiar/                  # Cow / Mr. Big Flight Deck
│   │   └── _index.md              # Statblock, Flyby Touch Delivery, Scouting Protocols
│   ├── investigation/             # Investigation Playbook & HUD
│   │   └── _index.md              # Search vs Study, 4-Step Method, 3 Lenses
│   ├── rules/                     # 2024 Rules Arbiter & Edge Cases
│   │   └── _index.md              # Action Economy, Wand Mechanics, Cover, Mastery
│   └── character/                 # Canonical Character Dossier
│       └── _index.md              # Stats, Backstory, Sage Traits, Inventory
```

---

## 3. Core Functional Systems

### System 1: The Combat Cockpit & Turn Pilot (`/`)
A live turn-by-turn workflow designed to execute Joe's turn in under 30 seconds.
* **Active Turn Phase Bar:** Step-through tracker for **Start of Turn -> Movement -> Action -> Bonus Action -> Cow Action** with session-persisted active phase.
* **Reaction Radar:** Real-time triggers for *Shield* (AC jumps to 17/20), *Counterspell* (60 ft, casting a spell), and Opportunity Attacks.
* **Concentration Guardian:** Persistent visual indicator of current concentration spell (e.g., *Web*, *Fly*) with script-safe text sanitization.
* **Live Session Resource HUD & Dock:**
  * HP Tracker, AC State Matrix, Wand of Magic Missiles Counter (with 1d20 destruction warning on charge 7), and Arcane Recovery Tracker.
  * Semantic, accessible spell slot toggles with `aria-pressed` states and descriptive `aria-label` tags.
  * Resilient persistence with schema validation (`normalizeState`) and corrupted `localStorage` retention (`savedProtection = 'recovery'`).
  * Manual recovery pipeline: "Download stored copy" to save corrupted raw bytes, and "Export session" / "Import backup" via versioned JSON schema (`joe-hud-backup` v1).
  * Polite live status region (`#hud-save-status`) and dynamic bottom viewport padding compensation (`ResizeObserver` updating `--hud-dock-height`).

### System 2: Tactical Plays Engine (`/plays/`)
An indexed database of all 250 canonical plays generated from `joes-greatest-hits.md` and `mr-bigs-greatest-hits.md`:
* **Taxonomy & Tags:**
  * **Actor:** Joe (`J-1` to `J-150`) vs Cow / Mr. Big (`C-1` to `C-100`).
  * **Phase:** Action, Bonus Action, Reaction, Movement, Exploration, Social.
  * **Keywords:** `Sculpt Spells`, `Potent Cantrip`, `Flyby`, `Touch Delivery`, `Help Action`, `Cover Exploit`, `Chokepoint`.
* **Play Card Structure:** Play ID, Title, When to use it / Trigger, Mechanics, and Table Phrasing Script.

### System 3: Spellbook & Evocation Arsenal (`/spellbook/`)
Detailed reference for all 23 Wizard spells and 6 cantrips under 2024 D&D rules:
* **Prepared Spells Status:** Highlights the 11 Prepared Spells, Magic Initiate *Shield*, and Ritual-Only Spells.
* **Sculpt Spells Calculator:** Highlights Evocation spells with 1 + Spell Level other visible creatures taking 0 damage on qualifying saves (excluding Joe and objects).
* **Potent Cantrip Tagging:** Highlights cantrips dealing half damage on a missed attack roll (*Fire Bolt*, *Ray of Frost*) or successful saving throw.
* **Component Tracker:** Explicitly marks costly components (50 GP reusable diamond for *Chromatic Orb*, 10 GP consumed incense for *Find Familiar*).

### System 4: Cow (Mr. Big) Flight Deck (`/familiar/`)
Dedicated operational dashboard for Joe's Fey familiar:
* **Canonical Revised Owl Statblock:** AC 11, 1 HP, Speed 5 ft / Fly 60 ft, Darkvision 120 ft, Perception +5, Stealth +5, Passive Perception 15, and no Keen Hearing and Sight trait.
* **Flyby Touch Delivery Matrix:** Pathing for delivering touch spells without opportunity attacks (approach and exit share 60 ft total movement).
* **Help Action Optimizer:** Guidelines for granting advantage on ally attack rolls with tactical exposure assessment.
* **Staying Aloft:** Familiar remains airborne without Hover, but falls on Prone, Incapacitated, or 0 speed.
* **Scouting & Sensory Link:** 100 ft telepathic command range, Bonus Action shared senses (retaining own sight).

### System 5: Investigation Playbook (`/investigation/`)
Operational implementation of Joe's 4-step Investigation Framework:
* **Search vs Study 2024 Rules Engine:**
  * **Search (Perception +3, Passive 13):** Finding and noticing raw physical features.
  * **Study (Investigation +10 Expertise, Passive 20 display):** Interpreting and deducing mechanisms.
* **Joe's Four-Step Method:**
  1. **State The Goal**
  2. **State The Method**
  3. **Choose A Suitable Tool** (Insight, Survival, Arcana, History, Perception, Investigation, Mage Hand, Cow, Detect Magic, Arcane Eye)
  4. **Separate Evidence From Theory**
* **Three Investigation Lenses:** Symmetry and Space, Wear and Mechanical Use, Arcane and Historical Order.

### System 6: 2024 Rules Arbiter & Edge-Case Engine (`/rules/`)
Instant table dispute settler for 2024 D&D rules:
* **One Spell Slot Per Turn:** Expending only one slot per turn (slotted *Fireball* + slotted *Counterspell* illegal on Joe's turn; slotted *Misty Step* allows only cantrips or non-slot actions).
* **Magic Action vs Utilize Action:** Wand activation uses Magic Action; potion consumption is a Bonus Action; familiar cannot attack or douse with oil.
* **Wand of Magic Missiles Limits:** Maximum 3 charges (5 darts) per casting; expending the 7th charge forces a 1d20 roll where a 1 destroys the wand.
* **Counterspell Specifics:** Requires Verbal, Somatic, or Material components to trigger; DC 15 Constitution save; spell slot preserved on failure.
* **Dimension Door Update:** Willing passenger within 5 ft arrives at destination with no passenger size restriction.
* **Potent Cantrip:** Half damage on missed attack rolls and successful saves.
* **Weapon Mastery Limitation:** Joe cannot use Nick or Topple without the Weapon Mastery feature.
* **Cover Rules:** Half (+2), Three-Quarters (+5), Total Cover.
* **Heroic Inspiration & Memorize Spell:** Long Rest and Short Rest features.

---

## 4. Acceptance Criteria & Quality Gates

| Feature | Status | Acceptance Criteria |
| :--- | :---: | :--- |
| **All 250 Plays** | **Complete** | All 150 Joe plays and 100 Cow plays live as individual content files with canonical IDs (`J-1`..`150`, `C-1`..`100`). |
| **All 29 Spells** | **Complete** | All 23 spells and 6 cantrips authored with exact 2024 rules, Sculpt Spells other visible creatures rules, Potent Cantrip, and component tags. |
| **Rules Arbiter** | **Complete** | Explicit adjudications for One Spell Slot Per Turn, Wand charge caps/destruction, Counterspell triggers, and Cow movement/staying aloft. |
| **Search Speed** | **Complete** | Instant filtering across all 250 plays and 29 spells in `< 50ms`. |
| **Rules Accuracy** | **Complete** | 100% compliant with 2024 PHB rules-as-written and canonical files in `../joe`. |
| **State Persistence** | **Complete** | Session tracker persists HP, spell slots, wand charges, and concentration in `localStorage`. |
| **Session Recovery & Portability** | **Complete** | Full schema validation (`normalizeState`), corrupted data protection (`savedProtection`), versioned JSON export/import (`joe-hud-backup` v1), and 8/8 regression tests in `tests/hud-recovery.test.cjs`. |
| **HUD Accessibility & Ergonomics** | **Complete** | Semantic `<button>` controls with `aria-pressed` / `aria-label`, polite live region save status, and dynamic bottom padding calculation preventing dock occlusion. |
| **Offline Capability** | **Complete** | Fully functional offline without external network dependencies. |
