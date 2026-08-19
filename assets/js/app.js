/**
 * JOE, KEEPER OF THE COW - TACTICAL HUD & TURN PILOT CONTROLLER
 * D&D 5.5e (2024 Rules)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'joe_tabletop_hud_v1';

  // Default Session State
  const defaultState = {
    hp: 51,
    hpMax: 51,
    tempHp: 0,
    acMode: 'mage_armor', // 'base', 'mage_armor', 'shield', 'full'
    slots: {
      l1: [true, true, true, true],
      l2: [true, true, true],
      l3: [true, true, true],
      l4: [true],
      magic_initiate_shield: true
    },
    wandCharges: 7,
    wandMax: 7,
    concentrationSpell: null, // string or null
    turnPhase: 0 // 0: Start, 1: Movement, 2: Action, 3: Bonus Action, 4: Cow Action
  };

  let state = { ...defaultState };

  // Load from LocalStorage
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state = { ...defaultState, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not parse saved state, using defaults.', e);
    }
  }

  // Save to LocalStorage
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderHud();
    } catch (e) {
      console.error('Failed to save HUD state.', e);
    }
  }

  // Render HUD Elements across the page
  function renderHud() {
    // Render HP
    const hpValEl = document.getElementById('hud-hp-val');
    if (hpValEl) hpValEl.textContent = `${state.hp}/${state.hpMax}`;

    // Render Wand Charges
    const wandValEl = document.getElementById('hud-wand-val');
    if (wandValEl) wandValEl.textContent = `${state.wandCharges}/${state.wandMax}`;

    // Render Concentration
    const concBtn = document.getElementById('hud-concentration-btn');
    if (concBtn) {
      if (state.concentrationSpell) {
        concBtn.classList.add('active');
        concBtn.innerHTML = `<span>🧠 Conc:</span> <strong>${state.concentrationSpell}</strong> <span style="font-size:10px;opacity:0.8;">(Click to Drop)</span>`;
      } else {
        concBtn.classList.remove('active');
        concBtn.innerHTML = `<span>🧠 Concentration:</span> <strong>None</strong>`;
      }
    }

    // Render Slots in HUD
    document.querySelectorAll('.slot-toggle-btn').forEach(btn => {
      const level = btn.dataset.level;
      const index = parseInt(btn.dataset.index, 10);
      if (level && !isNaN(index) && state.slots[level]) {
        if (state.slots[level][index]) {
          btn.classList.remove('used');
        } else {
          btn.classList.add('used');
        }
      }
    });

    // Render MI Shield Slot
    const miBtn = document.getElementById('slot-mi-shield');
    if (miBtn) {
      if (state.slots.magic_initiate_shield) {
        miBtn.classList.remove('used');
      } else {
        miBtn.classList.add('used');
      }
    }
  }

  // Bind HUD Interactive Handlers
  function initHudHandlers() {
    // HP Controls
    const hpMinus = document.getElementById('hud-hp-minus');
    const hpPlus = document.getElementById('hud-hp-plus');
    if (hpMinus) {
      hpMinus.addEventListener('click', () => {
        if (state.hp > 0) state.hp--;
        saveState();
      });
    }
    if (hpPlus) {
      hpPlus.addEventListener('click', () => {
        if (state.hp < state.hpMax) state.hp++;
        saveState();
      });
    }

    // Wand Controls
    const wandMinus = document.getElementById('hud-wand-minus');
    const wandPlus = document.getElementById('hud-wand-plus');
    if (wandMinus) {
      wandMinus.addEventListener('click', () => {
        if (state.wandCharges > 0) state.wandCharges--;
        saveState();
      });
    }
    if (wandPlus) {
      wandPlus.addEventListener('click', () => {
        if (state.wandCharges < state.wandMax) state.wandCharges++;
        saveState();
      });
    }

    // Slot toggle clicks
    document.querySelectorAll('.slot-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const level = btn.dataset.level;
        const index = parseInt(btn.dataset.index, 10);
        if (level && !isNaN(index) && state.slots[level]) {
          state.slots[level][index] = !state.slots[level][index];
          saveState();
        }
      });
    });

    // MI Shield Slot Click
    const miBtn = document.getElementById('slot-mi-shield');
    if (miBtn) {
      miBtn.addEventListener('click', () => {
        state.slots.magic_initiate_shield = !state.slots.magic_initiate_shield;
        saveState();
      });
    }

    // Concentration Toggle / Set
    const concBtn = document.getElementById('hud-concentration-btn');
    if (concBtn) {
      concBtn.addEventListener('click', () => {
        if (state.concentrationSpell) {
          state.concentrationSpell = null;
        } else {
          const spell = prompt('Enter active concentration spell (e.g., Web, Fly, Arcane Eye):');
          if (spell) state.concentrationSpell = spell.trim();
        }
        saveState();
      });
    }

    // Long Rest Reset Button
    const lrBtn = document.getElementById('hud-long-rest-btn');
    if (lrBtn) {
      lrBtn.addEventListener('click', () => {
        if (confirm('Execute Long Rest Reset? (Restores HP to 51, all spell slots, MI Shield, and rolls +1d6+1 wand charges)')) {
          state.hp = state.hpMax;
          state.slots = {
            l1: [true, true, true, true],
            l2: [true, true, true],
            l3: [true, true, true],
            l4: [true],
            magic_initiate_shield: true
          };
          const wandRecharge = Math.floor(Math.random() * 6) + 1 + 1;
          state.wandCharges = Math.min(state.wandMax, state.wandCharges + wandRecharge);
          state.concentrationSpell = null;
          saveState();
          alert(`Long Rest Complete! Wand recharged by ${wandRecharge} (now ${state.wandCharges}/${state.wandMax}).`);
        }
      });
    }
  }

  // Turn Pilot Step Machine
  const turnPhasesData = [
    {
      title: "1. Start of Turn & Concentration",
      notes: "Check ongoing spell effects (*Web*, *Grease*, *Fly*). Verify Cow's position (within 100 ft). Confirm Heroic Inspiration is ready."
    },
    {
      title: "2. Movement (30 ft)",
      notes: "Seek Half Cover (+2 AC/Dex) or Three-Quarters Cover (+5 AC/Dex). Maintain 40–60 ft distance from melee threats. Never end turn exposed in open lines of sight."
    },
    {
      title: "3. Action (Cast Spell / Magic / Search / Study)",
      notes: "Lead with Control (*Web*, *Grease*) or Clustered Evocation (*Fireball* + Sculpt Spells for up to 4 allies). Wand of Magic Missiles uses Magic Action (no components)."
    },
    {
      title: "4. Bonus Action (*Misty Step* / Cow Link)",
      notes: "Use *Misty Step* (30 ft bonus action teleport) to escape grapples or melee reach. Or use Bonus Action to share Cow's senses (Darkvision 120 ft) without losing own sight."
    },
    {
      title: "5. Cow's Turn & Reaction Prep",
      notes: "Cow rolls own initiative. Flyby Help action (60 ft fly, no opportunity attacks) to grant ally advantage on next attack, or position for touch spell delivery. Ready Reaction (*Shield* / *Counterspell*)."
    }
  ];

  function initTurnPilot() {
    const stepBtns = document.querySelectorAll('.pilot-step-btn');
    const adviceTitle = document.getElementById('pilot-phase-title');
    const adviceBody = document.getElementById('pilot-phase-notes');

    function selectPhase(index) {
      state.turnPhase = index;
      stepBtns.forEach((btn, idx) => {
        if (idx === index) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      if (adviceTitle && adviceBody && turnPhasesData[index]) {
        adviceTitle.textContent = turnPhasesData[index].title;
        adviceBody.innerHTML = turnPhasesData[index].notes;
      }
    }

    stepBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => selectPhase(idx));
    });

    if (stepBtns.length > 0) {
      selectPhase(0);
    }
  }

  // Filter Engine for Plays Page
  function initPlaysFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const playCards = document.querySelectorAll('.play-card');
    const searchInput = document.getElementById('plays-inline-search');

    function applyFilters() {
      const activeBtn = document.querySelector('.filter-btn.active');
      const filterCategory = activeBtn ? activeBtn.dataset.filter : 'all';
      const term = searchInput ? searchInput.value.toLowerCase().trim() : '';

      playCards.forEach(card => {
        const actor = card.dataset.actor || '';
        const type = card.dataset.type || '';
        const tags = card.dataset.tags || '';
        const title = card.querySelector('.play-title')?.textContent.toLowerCase() || '';
        const body = card.textContent.toLowerCase();

        let matchesCategory = true;
        if (filterCategory === 'joe') matchesCategory = actor.includes('joe');
        else if (filterCategory === 'cow') matchesCategory = actor.includes('cow');
        else if (filterCategory === 'action') matchesCategory = type.toLowerCase().includes('action');
        else if (filterCategory === 'bonus') matchesCategory = type.toLowerCase().includes('bonus');
        else if (filterCategory === 'reaction') matchesCategory = type.toLowerCase().includes('reaction');
        else if (filterCategory === 'sculpt') matchesCategory = tags.toLowerCase().includes('sculpt') || body.includes('sculpt');

        let matchesSearch = true;
        if (term) {
          matchesSearch = title.includes(term) || body.includes(term) || tags.toLowerCase().includes(term);
        }

        if (matchesCategory && matchesSearch) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }
  }

  // Search Modal Hotkey Controller
  function initSearchModal() {
    const modal = document.getElementById('global-search-modal');
    const triggers = document.querySelectorAll('.quick-search-trigger');
    const input = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('global-search-results');

    function openModal() {
      if (!modal) return;
      modal.classList.add('open');
      if (input) {
        input.value = '';
        input.focus();
      }
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('open');
    }

    triggers.forEach(t => t.addEventListener('click', openModal));

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openModal();
      } else if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
        closeModal();
      }
    });

    // Quick Search Filtering
    if (input && resultsContainer) {
      input.addEventListener('input', () => {
        const query = input.value.toLowerCase().trim();
        if (!query) {
          resultsContainer.innerHTML = '<li style="padding:12px;color:var(--text-dim);text-align:center;">Type a spell name, play title, rule keyword, or stat...</li>';
          return;
        }
        // Query matching against predefined index
        const matches = (window.JOE_SEARCH_INDEX || []).filter(item => {
          return item.title.toLowerCase().includes(query) || item.summary.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
        });

        if (matches.length === 0) {
          resultsContainer.innerHTML = `<li style="padding:12px;color:var(--text-dim);text-align:center;">No results found for "${query}".</li>`;
        } else {
          resultsContainer.innerHTML = matches.slice(0, 10).map(m => `
            <li class="search-result-item" onclick="window.location.href='${m.url}'">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="color:var(--text-pure);">${m.title}</strong>
                <span class="tag-badge tag-cyan">${m.category}</span>
              </div>
              <p style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">${m.summary}</p>
            </li>
          `).join('');
        }
      });
    }
  }

  // Copy Phrasing to Clipboard
  function initCopyButtons() {
    document.querySelectorAll('.copy-phrase-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.phrase;
        if (text) {
          navigator.clipboard.writeText(text).then(() => {
            const original = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(() => { btn.textContent = original; }, 1500);
          });
        }
      });
    });
  }

  // Initialize all components on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderHud();
    initHudHandlers();
    initTurnPilot();
    initPlaysFilter();
    initSearchModal();
    initCopyButtons();
  });

})();
