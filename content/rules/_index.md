---
title: "2024 Rules Arbiter & Edge Cases"
description: "Instant tabletop dispute resolution for D&D 5.5e (2024 Revision) rules: Magic action, Potent Cantrip on attack rolls, Wand mechanics, Cover, and Weapon Mastery."
---

<div style="background:var(--bg-surface-card);border:1px solid var(--border-subtle);border-radius:var(--border-radius-lg);padding:24px;margin-bottom:28px;">
  <span class="tag-badge tag-cyan" style="margin-bottom:8px;display:inline-block;">2024 Player's Handbook Compliance</span>
  <h2 style="font-size:1.8rem;font-weight:800;color:var(--text-pure);margin-bottom:6px;">The 2024 (5.5e) Rules Arbiter</h2>
  <p style="font-size:0.95rem;color:var(--text-med);line-height:1.5;">
    Clear, rules-as-written adjudications for common 2024 D&D edge cases. Settle rulings at the table in seconds.
  </p>
</div>

---

## ⚡ 1. The Magic Action vs. Utilize Action

<div class="plays-grid">
  <div class="hud-panel">
    <h3 style="font-size:1.1rem;font-weight:700;color:var(--accent-cyan);margin-bottom:6px;">Magic Action</h3>
    <p style="font-size:0.85rem;color:var(--text-med);line-height:1.5;">
      Used to <strong>cast a spell</strong> with a casting time of 1 Action, or to <strong>activate a magic item</strong> (like the <em>Wand of Magic Missiles</em>). Activating a magic item via the Magic Action requires <strong>no verbal, somatic, or material components</strong> unless the item specifically states otherwise.
    </p>
  </div>
  <div class="hud-panel">
    <h3 style="font-size:1.1rem;font-weight:700;color:var(--accent-amber);margin-bottom:6px;">Utilize Action</h3>
    <p style="font-size:0.85rem;color:var(--text-med);line-height:1.5;">
      Used to interact with a nonmagical object when that interaction requires an action (e.g. throwing oil, lighting a lantern, opening a stuck iron door, picking a lock with thieves' tools).
    </p>
  </div>
</div>

---

## 🪄 2. Wand of Magic Missiles (2024 Rulings & Destruction Risk)

* **Action Type:** **Magic Action** (not an attack roll, not a spell cast from slots).
* **Components:** **None**. You can fire the wand while silenced, holding a staff in the other hand, or immobilized (as long as you can hold and point the wand).
* **Targeting:** 120 ft range. Automatically hits without an attack roll or saving throw.
* **Damage:** Each dart deals `1d4 + 1` Force damage.
* **Charges & Darts:**
  * 1 Charge = 3 Darts (Level 1 equivalent, $3 \times [1\text{d}4+1]$)
  * 2 Charges = 4 Darts (Level 2 equivalent)
  * 3 Charges = 5 Darts (Level 3 equivalent)
  * Up to 7 Charges = 9 Darts ($9 \times [1\text{d}4+1]$)
* **Dawn Recharge:** Regains `1d6 + 1` expended charges daily at dawn (max 7).
* **Destruction Risk (Why Doctrine Mandates Preserving Charge 7):**
  > [!WARNING]
  > **The 1d20 Destruction Roll:** If you expend the wand's **7th (last) charge**, you must roll a **d20**. On a **1**, the wand crumbles into ashes and is permanently destroyed. Joe's standing doctrine is to **never spend the 7th charge** except to prevent a Total Party Kill (TPK).

---

## 💥 3. Evoker Subclass Features (2024 Rules)

### Potent Cantrip (Applies to Missed Attacks & Passed Saves)
* **Exact 2024 PHB Rule:** *"If your d20 attack roll misses or the target succeeds on a saving throw against a cantrip you cast, the target takes half the cantrip's damage (if any), but suffers no additional effect from the cantrip."*
* **Attack-Roll Cantrips (*Fire Bolt*, *Ray of Frost*):** On a missed attack roll, target takes **half damage** (e.g., half of `2d10` or `2d8`). No secondary rider (e.g. speed reduction) applies on a miss.
* **Saving-Throw Cantrips:** If the target passes its saving throw, it takes **half damage**.

### Sculpt Spells
* **Eligibility:** Any Wizard **Evocation spell** that forces other creatures to make a saving throw (e.g. *Fireball*, *Thunderwave*, *Ice Storm*, *Burning Hands*, *Lightning Bolt*).
* **Protected Targets:** You can choose up to **$1 + \text{Spell Level}$** creatures in the area (e.g. **4 creatures** for *Fireball* at 3rd level; **5 creatures** at 4th level).
* **Effect:** Chosen creatures **automatically succeed** on their saving throw and **take NO damage** (not even half).

---

## 🗡️ 4. Weapon Mastery & Unarmed Strike Limitation

* **D&D Beyond Display vs. Table Legality:** D&D Beyond displays Weapon Mastery properties on Joe's inventory (e.g. *Nick* on daggers, *Topple* on quarterstaffs).
* **Rules Adjudication:** In the 2024 rules, Weapon Mastery properties can **only** be used by characters with the **Weapon Mastery class feature** (e.g. Fighters, Barbarians, Rogues, Paladins, Rangers) or the *Weapon Master* feat.
* **Joe's Status:** As a pure Wizard 7 with the Sage background and *Magic Initiate* feat, **Joe cannot use Nick or Topple**. His daggers and staff deal standard weapon damage without mastery riders.

---

## 🛡️ 5. Cover & Tactical Positioning

```
+-------------------------------------------------------------+
| COVER TYPE         | BONUS TO AC / DEX SAVES | EXAMPLES     |
+--------------------+-------------------------+--------------+
| Half Cover         | +2 AC & +2 Dex Saves    | Low wall,    |
|                    |                         | another ally |
+--------------------+-------------------------+--------------+
| Three-Quarters     | +5 AC & +5 Dex Saves    | Arrow slit,  |
| Cover              |                         | heavy pillar |
+--------------------+-------------------------+--------------+
| Total Cover        | Cannot be targeted      | Solid wall,  |
|                    | directly by spells      | closed door  |
+--------------------+-------------------------+--------------+
```

---

## 🎲 6. Heroic Inspiration & Memorize Spell

* **Heroic Inspiration (Resourceful Human Trait):** Joe gains Heroic Inspiration whenever he finishes a Long Rest. He can expend it to reroll **any d20 die roll** immediately after seeing the result, taking the new roll.
* **Memorize Spell (Wizard 5+):** Whenever Joe finishes a Short Rest, he can study his spellbook to swap **one prepared level 1+ spell** for any other spell in his spellbook.
