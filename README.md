# Joe, Keeper of the Cow: Live Action Tabletop Reference

A high-speed, zero-latency live tabletop companion website built with [Hugo](https://gohugo.io/) for piloting **Joe, Keeper of the Cow** (Level 7 Evoker Wizard, D&D 5.5e / 2024 Rules).

Designed specifically for active gameplay at the tabletop—optimizing turn execution speed, tactical coordination with Cow (Mr. Big), instant 2024 rules arbitration, and evidence-based investigation.

---

## 🎯 Overview & Key Features

* **⚡ Combat Cockpit & Turn Pilot (`/`):** Step-by-step turn execution workflow with active phase tracking, reaction radars (*Shield*, *Counterspell*), and a live Concentration Guardian.
* **📖 250 Canonical Tactical Plays Hub (`/plays/`):** Full indexed database of **150 Joe Plays** (`J-1` to `J-150`) and **100 Cow Plays** (`C-1` to `C-100`) as individual content files with instant multi-facet filtering (Action type, actor, keywords).
* **✨ Evocation Arsenal & Spellbook (`/spellbook/`):** Complete reference for all **23 Wizard spells + 6 cantrips** under 2024 rules, featuring automated Sculpt Spells target counters and Potent Cantrip missed-attack/passed-save half-damage mechanics.
* **🦉 Cow (Mr. Big) Flight Deck (`/familiar/`):** Fey familiar operating manual detailing Flyby touch spell delivery, Help action timing, scouting sensory links, and 2024 Owl stat block rules.
* **🔍 Investigation Playbook (`/investigation/`):** Joe’s Four-Step Method distinguishing Search (Perception +3 / Passive 13) from Study (Investigation +10 / Passive 20 display), incorporating skill-based tools (Insight, Survival, Arcana, History) and safe table phrasing.
* **⚖️ 2024 Rules Arbiter (`/rules/`):** Instant table reference for 2024 rules interactions (Magic action vs. Utilize, Wand of Magic Missiles 1d20 destruction risk, Weapon Mastery limitations, Cover rules, Heroic Inspiration rerolls).
* **📊 Persistent Session HUD:** Client-side local storage tracker for real-time HP, AC states (12/15/17/20), spell slots, wand charges, and active concentration.

---

## 🚀 Quick Start & Local Development

### Prerequisites
* [Hugo Extended](https://gohugo.io/installation/) (v0.125.0 or later)

### Running Locally

1. **Navigate & Start Server:**
   ```bash
   cd joe-site
   hugo server -D
   ```
   Open [http://localhost:1313](http://localhost:1313) in your browser.

2. **Build Static Site for Production:**
   ```bash
   hugo --minify
   ```

---

## 📂 Project Structure

```
joe-site/
├── archetypes/           # Frontmatter templates (play.md, spell.md)
├── assets/
│   ├── css/              # Modular vanilla CSS design tokens & HUD styling
│   └── js/               # LocalStorage state manager, turn tracker, search
├── content/
│   ├── _index.md         # Cockpit dashboard
│   ├── plays/            # Master plays directory
│   │   ├── joe/          # J-1..J-150 individual play files
│   │   └── cow/          # C-1..C-100 individual play files
│   ├── spellbook/        # 23 Wizard spells + 6 cantrips individual files
│   ├── familiar/         # Cow / Mr. Big operational manual
│   ├── investigation/    # 4-step investigation framework & DC tables
│   ├── rules/            # 2024 rules arbiter and edge-case guides
│   └── character/        # Canonical character dossier & background
├── data/                 # Static YAML definitions (character stats, actions)
├── layouts/              # Hugo HTML layout templates and partials
├── static/               # Generated custom artwork and static assets
├── spec.md               # Complete architecture & functional specification
└── README.md             # This file
```

---

## 🕹️ Tabletop Operating Workflow

### During a Live Combat Encounter:
1. **Start Turn:** Click through the **Turn Pilot** on the homepage to verify your Movement (30 ft), Action, Bonus Action, and Cow’s Flyby movement (60 ft).
2. **Select Play:** Filter by actor or keyword (e.g. `sculpted fireball`, `cover`, `flyby touch`).
3. **Table Phrasing:** Read the exact table phrasing aloud to the Dungeon Master to prevent ambiguity.
4. **Log Resources:** Click the HUD counters to dock spell slots, wand charges, or HP without leaving your current view.

---

## 📜 Canonical Data & Rules Model

This site draws its canonical character statistics, tactical plays, and investigation rules from the core records in `../joe`:
* `joe-character.md` — Authoritative current-state character build.
* `joes-greatest-hits.md` — Plays `J-1` through `J-150`.
* `mr-bigs-greatest-hits.md` — Cow plays `C-1` through `C-100`.
* `Joe's Investigation Framework.md` — Search vs. Study protocol and Four-Step Method.
* `D&D 5.5e Rules Cheat Sheet.md` — Core numbers and 2024 PHB rulings.

All mechanics adhere strictly to the **2024 D&D 5th Edition Revision (5.5e)** rules as written.
