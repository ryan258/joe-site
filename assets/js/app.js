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

  const cloneDefaultState = () => JSON.parse(JSON.stringify(defaultState));
  let state = cloneDefaultState();
  let storedRaw = null;
  let savedProtection = null;

  function normalizeState(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Session must be an object.');
    const next = cloneDefaultState();
    for (const field of ['hp', 'hpMax', 'tempHp', 'wandCharges', 'wandMax', 'turnPhase']) {
      if (Object.hasOwn(raw, field)) next[field] = raw[field];
      if (!Number.isInteger(next[field])) throw new Error(`${field} must be an integer.`);
    }
    if (next.hpMax < 1 || next.hpMax > 10000 || next.hp < 0 || next.hp > next.hpMax || next.tempHp < 0 || next.tempHp > 10000) throw new Error('HP is outside the supported range.');
    if (next.wandMax < 1 || next.wandMax > 100 || next.wandCharges < 0 || next.wandCharges > next.wandMax) throw new Error('Wand charges are outside the supported range.');
    if (next.turnPhase < 0 || next.turnPhase > 4) throw new Error('Turn phase is invalid.');
    if (Object.hasOwn(raw, 'acMode')) next.acMode = raw.acMode;
    if (!['base', 'mage_armor', 'shield', 'full'].includes(next.acMode)) throw new Error('AC mode is invalid.');
    if (Object.hasOwn(raw, 'concentrationSpell')) next.concentrationSpell = raw.concentrationSpell;
    if (next.concentrationSpell !== null && (typeof next.concentrationSpell !== 'string' || next.concentrationSpell.length > 200)) throw new Error('Concentration must be text or null.');
    if (Object.hasOwn(raw, 'slots')) {
      if (!raw.slots || typeof raw.slots !== 'object' || Array.isArray(raw.slots)) throw new Error('Slots must be an object.');
      for (const level of ['l1', 'l2', 'l3', 'l4']) {
        if (!Object.hasOwn(raw.slots, level)) continue;
        const slots = raw.slots[level];
        if (!Array.isArray(slots) || slots.length !== defaultState.slots[level].length || slots.some(value => typeof value !== 'boolean')) throw new Error(`${level} slots are invalid.`);
        next.slots[level] = slots.slice();
      }
      if (Object.hasOwn(raw.slots, 'magic_initiate_shield')) {
        if (typeof raw.slots.magic_initiate_shield !== 'boolean') throw new Error('Magic Initiate slot is invalid.');
        next.slots.magic_initiate_shield = raw.slots.magic_initiate_shield;
      }
    }
    return next;
  }

  function setSaveStatus(message) {
    const status = document.getElementById('hud-save-status');
    if (status) status.textContent = message;
    const storedButton = document.getElementById('hud-download-stored-btn');
    if (storedButton) storedButton.hidden = storedRaw === null;
  }

  function loadState() {
    state = cloneDefaultState();
    savedProtection = null;
    try {
      storedRaw = localStorage.getItem(STORAGE_KEY);
      if (storedRaw !== null) state = normalizeState(JSON.parse(storedRaw));
      setSaveStatus(storedRaw === null ? 'New session. Export a backup when you want to keep it elsewhere.' : 'Stored session restored. Export a backup before clearing this browser.');
    } catch (error) {
      savedProtection = storedRaw === null ? 'unavailable' : 'recovery';
      setSaveStatus(savedProtection === 'recovery' ? 'Saved text needs recovery and was kept. This session is temporary; download the stored copy before replacing it.' : 'Browser storage is unavailable. This session is temporary; export a backup to keep it.');
    }
  }

  function saveState() {
    renderHud();
    if (savedProtection) {
      setSaveStatus('Temporary session: stored data needs recovery or storage is unavailable. Export this session to keep it.');
      return false;
    }
    try {
      const raw = JSON.stringify(normalizeState(state));
      localStorage.setItem(STORAGE_KEY, raw);
      storedRaw = raw;
      setSaveStatus('Saved in this browser. Export a backup before clearing browser data.');
      return true;
    } catch (error) {
      setSaveStatus('Not saved: browser storage failed. This HUD still works; export this session to keep changes.');
      return false;
    }
  }

  function validateBackup(raw) {
    if (raw && Object.hasOwn(raw, 'format')) {
      if (raw.format !== 'joe-hud-backup' || raw.version !== 1) throw new Error('Unsupported backup format or version.');
      return normalizeState(raw.state);
    }
    if (!raw || typeof raw !== 'object' || !Object.keys(defaultState).some(field => Object.hasOwn(raw, field))) throw new Error('This file does not contain a Joe session.');
    return normalizeState(raw); // Existing unwrapped session exports remain importable.
  }

  function serializeBackup() {
    return JSON.stringify({ format: 'joe-hud-backup', version: 1, exportedAt: new Date().toISOString(), state: normalizeState(state) }, null, 2);
  }

  function applyImport(raw) {
    let next;
    try { next = validateBackup(JSON.parse(raw)); }
    catch (error) { setSaveStatus(`Backup not imported: ${error.message} Existing session was kept.`); return false; }
    const encoded = JSON.stringify(next);
    try { localStorage.setItem(STORAGE_KEY, encoded); }
    catch (error) { setSaveStatus('Backup not imported: browser storage failed. Existing session was kept.'); return false; }
    state = next; storedRaw = encoded; savedProtection = null;
    renderHud(); setSaveStatus('Backup imported and saved in this browser.');
    return true;
  }

  function downloadSessionText(raw, name) {
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = name;
    document.body.appendChild(link);
    try { link.click(); } finally { link.remove(); URL.revokeObjectURL(url); }
  }

  function initBackupHandlers() {
    const exportButton = document.getElementById('hud-export-btn');
    const storedButton = document.getElementById('hud-download-stored-btn');
    const importButton = document.getElementById('hud-import-btn');
    const input = document.getElementById('hud-import-file');
    if (exportButton) exportButton.addEventListener('click', () => {
      downloadSessionText(serializeBackup(), 'joe-session-backup.json');
      setSaveStatus('Backup download started. Keep the file for recovery on another browser.');
    });
    if (storedButton) storedButton.addEventListener('click', () => {
      if (storedRaw !== null) downloadSessionText(storedRaw, 'joe-stored-session-recovery.json');
    });
    if (importButton && input) importButton.addEventListener('click', () => input.click());
    if (input) input.addEventListener('change', async () => {
      const file = input.files && input.files[0]; input.value = '';
      if (!file) return;
      if (file.size > 1024 * 1024) { setSaveStatus('Backup not imported: file is larger than 1 MB.'); return; }
      try {
        const raw = await file.text();
        validateBackup(JSON.parse(raw));
        if (confirm('Replace this session with the checked backup? Export your current session or stored recovery copy first if you need to keep it.')) applyImport(raw);
      } catch (error) { setSaveStatus(`Backup not imported: ${error.message} Existing session was kept.`); }
    });
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
        concBtn.innerHTML = '<span>🧠 Conc:</span> <strong></strong> <span style="font-size:10px;opacity:0.8;">(Click to Drop)</span>';
        concBtn.querySelector('strong').textContent = state.concentrationSpell;
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
        btn.setAttribute('aria-pressed', String(!state.slots[level][index]));
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
      miBtn.setAttribute('aria-pressed', String(!state.slots.magic_initiate_shield));
      if (state.slots.magic_initiate_shield) {
        miBtn.classList.remove('used');
      } else {
        miBtn.classList.add('used');
      }
    }
    renderTurnPilot();
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
      notes: "Cow rolls own initiative. Approach and exit share 60 ft total movement; Flyby prevents only Opportunity Attacks on the flying exit. Help when the benefit is worth exposure. Ready Reaction (*Shield* / *Counterspell*)."
    }
  ];

  function renderTurnPilot() {
    document.querySelectorAll('.pilot-step-btn').forEach((button, index) => {
      if (index === state.turnPhase) button.classList.add('active');
      else button.classList.remove('active');
    });
    const title = document.getElementById('pilot-phase-title');
    const notes = document.getElementById('pilot-phase-notes');
    if (title && notes) {
      title.textContent = turnPhasesData[state.turnPhase].title;
      notes.innerHTML = turnPhasesData[state.turnPhase].notes;
    }
  }

  function initTurnPilot() {
    document.querySelectorAll('.pilot-step-btn').forEach((button, index) => {
      button.addEventListener('click', () => { state.turnPhase = index; saveState(); });
    });
    renderTurnPilot();
  }

  // Filter Engine for Plays Page
  function initPlaysFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const playCards = document.querySelectorAll('.play-card');
    const searchInput = document.getElementById('plays-inline-search');
    const countEl = document.getElementById('plays-count-indicator');

    function applyFilters() {
      const activeBtn = document.querySelector('.filter-btn.active');
      const filterCategory = activeBtn ? activeBtn.dataset.filter : 'all';
      const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
      let visibleCount = 0;

      playCards.forEach(card => {
        const actor = card.dataset.actor || '';
        const type = card.dataset.type || '';
        const tags = card.dataset.tags || '';
        const title = card.querySelector('.play-title')?.textContent.toLowerCase() || '';
        const tmpl = card.querySelector('.play-modal-data');
        const modalText = tmpl && tmpl.content ? tmpl.content.textContent.toLowerCase() : '';
        const cardText = card.textContent.toLowerCase();

        let matchesCategory = true;
        if (filterCategory === 'joe') matchesCategory = actor.includes('joe');
        else if (filterCategory === 'cow') matchesCategory = actor.includes('cow');
        else if (filterCategory === 'action') matchesCategory = type.toLowerCase() === 'action';
        else if (filterCategory === 'bonus') matchesCategory = type.toLowerCase().includes('bonus');
        else if (filterCategory === 'reaction') matchesCategory = type.toLowerCase().includes('reaction');
        else if (filterCategory === 'sculpt') matchesCategory = tags.toLowerCase().includes('sculpt') || modalText.includes('sculpt');

        let matchesSearch = true;
        if (term) {
          matchesSearch = title.includes(term) || cardText.includes(term) || tags.toLowerCase().includes(term) || modalText.includes(term);
        }

        if (matchesCategory && matchesSearch) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (countEl) {
        countEl.textContent = `Showing ${visibleCount} of ${playCards.length} plays`;
      }
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

    if (countEl && playCards.length > 0) {
      countEl.textContent = `Showing ${playCards.length} of ${playCards.length} plays`;
    }
  }

  // Play Detail Modal Controller (<dialog> with light-dismiss & keyboard navigation)
  function initPlayDetailModal() {
    const modal = document.getElementById('play-detail-modal');
    if (!modal) return;

    // Feature test for HTMLDialogElement and showModal method
    if (typeof HTMLDialogElement === 'undefined' || typeof modal.showModal !== 'function') {
      console.warn('Native <dialog> not supported; falling back to direct page links.');
      return;
    }

    const mount = document.getElementById('play-modal-mount');
    const prevBtn = document.getElementById('play-modal-prev-btn');
    const nextBtn = document.getElementById('play-modal-next-btn');
    const counterEl = document.getElementById('play-modal-counter');
    const closeBtn = document.getElementById('play-modal-close-btn');
    const playsGrid = document.getElementById('plays-grid');

    let currentCard = null;

    function getVisibleCards() {
      return Array.from(document.querySelectorAll('.play-card')).filter(c => c.style.display !== 'none');
    }

    function updateNav() {
      const visible = getVisibleCards();
      const idx = visible.indexOf(currentCard);

      if (counterEl) {
        counterEl.textContent = idx >= 0 ? `Play ${idx + 1} of ${visible.length}` : '';
      }
      if (prevBtn) {
        prevBtn.disabled = (idx <= 0);
      }
      if (nextBtn) {
        nextBtn.disabled = (idx < 0 || idx >= visible.length - 1);
      }
    }

    function formatPlayMechanics(container) {
      if (!container) return;

      container.querySelectorAll('h3').forEach(h3 => {
        if (h3.classList.contains('play-section-header')) return;
        const text = h3.textContent.trim().toLowerCase();
        let iconSvg = '';

        if (text.includes('when')) {
          iconSvg = '<span class="play-section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg></span>';
        } else if (text.includes('mechanic')) {
          iconSvg = '<span class="play-section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>';
        } else if (text.includes('table')) {
          iconSvg = '<span class="play-section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>';
        }

        if (iconSvg) {
          const orig = h3.textContent.trim();
          h3.className = 'play-section-header';
          h3.innerHTML = `${iconSvg}<span class="play-section-title">${orig}</span><span class="play-section-rule" aria-hidden="true"></span>`;
        }
      });

      container.querySelectorAll('.play-modal-body-mechanics p').forEach(p => {
        const trimmed = p.innerHTML.trim();
        if (trimmed.startsWith('Mechanically:')) {
          p.classList.add('play-table-mechanics-row');
          p.innerHTML = trimmed.replace(/^Mechanically:\s*/, '<span class="play-row-label">Mechanically:</span> ');
        } else if (trimmed.startsWith('Verbally:')) {
          p.classList.add('play-table-verbally-row');
          p.innerHTML = trimmed.replace(/^Verbally:\s*/, '<span class="play-row-label">Verbally:</span> ');
        }
      });
    }

    function openPlayModal(card, updateHash = true) {
      if (!card) return;
      currentCard = card;

      const tmpl = card.querySelector('.play-modal-data');
      if (tmpl && mount) {
        mount.innerHTML = '';
        mount.appendChild(tmpl.content.cloneNode(true));
        formatPlayMechanics(mount);
      }

      updateNav();

      if (!modal.open) {
        modal.showModal();
      }

      const playId = card.id;
      if (updateHash && playId) {
        history.replaceState(null, '', '#' + playId);
      }
    }

    function closePlayModal() {
      if (modal.open) {
        modal.close();
      }
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    // Prev / Next navigation
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const visible = getVisibleCards();
        const idx = visible.indexOf(currentCard);
        if (idx > 0) {
          openPlayModal(visible[idx - 1]);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const visible = getVisibleCards();
        const idx = visible.indexOf(currentCard);
        if (idx >= 0 && idx < visible.length - 1) {
          openPlayModal(visible[idx + 1]);
        }
      });
    }

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', closePlayModal);
    }

    // Keyboard navigation (Escape is native; arrow keys switch plays)
    document.addEventListener('keydown', (e) => {
      if (!modal.open) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevBtn?.click();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextBtn?.click();
      }
    });

    // Native closedby="any" fallback for backdrop click
    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      modal.addEventListener('click', (event) => {
        if (event.target !== modal) return;
        const rect = modal.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isDialogContent) {
          closePlayModal();
        }
      });
    }

    // Clean hash on native dismiss (e.g. Esc key)
    modal.addEventListener('close', () => {
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });

    // Card click & keyboard triggers via event delegation with progressive enhancement
    if (playsGrid) {
      playsGrid.addEventListener('click', (e) => {
        // Do not intercept if clicking the copy phrase button
        if (e.target.closest('.copy-phrase-btn')) return;

        // If user holds modifier key (Cmd/Ctrl/Shift), allow default link navigation to single page
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        const card = e.target.closest('.play-card');
        if (card) {
          e.preventDefault();
          openPlayModal(card);
        }
      });

      playsGrid.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const card = e.target.closest('.play-card');
          if (card && (e.target === card || e.target.closest('.play-title-link') || e.target.closest('.play-card-expand-cta'))) {
            e.preventDefault();
            openPlayModal(card);
          }
        }
      });
    }

    // Deep link support from URL hash
    function checkHashForPlay() {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash) {
        const targetCard = document.getElementById(hash);
        if (targetCard && targetCard.classList.contains('play-card')) {
          if (targetCard.style.display === 'none') {
            const searchInput = document.getElementById('plays-inline-search');
            if (searchInput && searchInput.value) {
              searchInput.value = '';
            }
            const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
            if (allBtn) {
              allBtn.click();
            } else if (searchInput) {
              searchInput.dispatchEvent(new Event('input'));
            }
          }
          openPlayModal(targetCard, false);
        }
      }
    }

    checkHashForPlay();
    window.addEventListener('hashchange', checkHashForPlay);
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

  // Copy Phrasing to Clipboard (Delegated for static cards and dynamic modal content)
  function initCopyButtons() {
    function announceStatus(msg) {
      let liveRegion = document.getElementById('a11y-live-region');
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'a11y-live-region';
        liveRegion.className = 'sr-only';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
      }
      liveRegion.textContent = '';
      setTimeout(() => {
        liveRegion.textContent = msg;
      }, 50);
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.copy-phrase-btn');
      if (!btn) return;
      e.stopPropagation();

      const text = btn.dataset.phrase;
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          const originalHtml = btn.innerHTML;
          const originalAriaLabel = btn.getAttribute('aria-label');
          const originalTitle = btn.getAttribute('title');
          const isIconOnly = btn.classList.contains('play-card-copy-btn');

          if (isIconOnly) {
            btn.classList.add('is-copied');
            btn.setAttribute('aria-label', 'Copied table script');
            btn.setAttribute('title', 'Copied table script');
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';

            setTimeout(() => {
              btn.classList.remove('is-copied');
              if (originalAriaLabel) {
                btn.setAttribute('aria-label', originalAriaLabel);
              } else {
                btn.removeAttribute('aria-label');
              }
              if (originalTitle) {
                btn.setAttribute('title', originalTitle);
              } else {
                btn.removeAttribute('title');
              }
              btn.innerHTML = originalHtml;
            }, 1600);
          } else {
            btn.innerHTML = '<span style="color:#34d399;font-weight:700;">✓ Copied!</span>';
            setTimeout(() => { btn.innerHTML = originalHtml; }, 1600);
          }

          announceStatus('Copied table script to clipboard');
        }).catch(err => {
          console.warn('Clipboard copy failed:', err);
          announceStatus('Failed to copy to clipboard');
        });
      }
    });
  }

  // Keep document content clear of the fixed dock as controls/status wrap.
  function initHudLayout() {
    const dock = document.querySelector('.live-hud-dock');
    if (!dock) return;
    const update = () => document.documentElement.style.setProperty('--hud-dock-height', `${Math.ceil(dock.getBoundingClientRect().height)}px`);
    update();
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(dock);
    window.addEventListener('resize', update);
  }

  // Initialize all components on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderHud();
    initHudHandlers();
    initBackupHandlers();
    initHudLayout();
    initTurnPilot();
    initPlaysFilter();
    initPlayDetailModal();
    initSearchModal();
    initCopyButtons();

    // Auto-format standalone play single pages if present
    const singleWrap = document.querySelector('.play-single-card');
    if (singleWrap) {
      const headings = singleWrap.querySelectorAll('h3');
      headings.forEach(h3 => {
        if (h3.classList.contains('play-section-header')) return;
        const text = h3.textContent.trim().toLowerCase();
        let iconSvg = '';

        if (text.includes('when')) {
          iconSvg = '<span class="play-section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg></span>';
        } else if (text.includes('mechanic')) {
          iconSvg = '<span class="play-section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>';
        } else if (text.includes('table')) {
          iconSvg = '<span class="play-section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>';
        }

        if (iconSvg) {
          const orig = h3.textContent.trim();
          h3.className = 'play-section-header';
          h3.innerHTML = `${iconSvg}<span class="play-section-title">${orig}</span><span class="play-section-rule" aria-hidden="true"></span>`;
        }
      });

      singleWrap.querySelectorAll('.play-modal-body-mechanics p').forEach(p => {
        const trimmed = p.innerHTML.trim();
        if (trimmed.startsWith('Mechanically:')) {
          p.classList.add('play-table-mechanics-row');
          p.innerHTML = trimmed.replace(/^Mechanically:\s*/, '<span class="play-row-label">Mechanically:</span> ');
        } else if (trimmed.startsWith('Verbally:')) {
          p.classList.add('play-table-verbally-row');
          p.innerHTML = trimmed.replace(/^Verbally:\s*/, '<span class="play-row-label">Verbally:</span> ');
        }
      });
    }
  });

})();
