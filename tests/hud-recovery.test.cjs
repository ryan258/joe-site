const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness(options = {}) {
  const source = fs.readFileSync(process.env.JOE_SOURCE || path.join(__dirname, '..', 'assets/js/app.js'), 'utf8');
  const nodes = new Map();
  function element() { return { textContent: '', innerHTML: '', hidden: false, listeners: {},
    classList: { add() {}, remove() {} },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    querySelector() { return this.strong || (this.strong = element()); } }; }
  for (const id of ['hud-save-status', 'hud-download-stored-btn', 'hud-hp-val', 'hud-wand-val', 'hud-concentration-btn']) nodes.set(id, element());
  const steps = Array.from({ length: 5 }, () => element());
  let stored = options.stored ?? null;
  const calls = [];
  const sandbox = { console: { warn() {}, error() {} },
    document: { getElementById: id => nodes.get(id) || null, querySelectorAll: selector => selector === '.pilot-step-btn' ? steps : [], addEventListener() {} },
    localStorage: { getItem() { if (options.blockRead) throw Error('blocked'); return stored; },
      setItem(key, raw) { if (options.blockWrite) throw Error('quota'); calls.push([key, raw]); stored = raw; } },
    confirm: () => true,
  };
  vm.createContext(sandbox);
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, `
    globalThis.api = { loadState, saveState, renderHud, initTurnPilot, normalizeState, validateBackup, applyImport,
      serializeBackup, getState: () => JSON.parse(JSON.stringify(state)), change: patch => Object.assign(state, patch) };
  })();`), sandbox);
  return { ...sandbox.api, nodes, steps, calls, stored: () => stored };
}

test('malformed stored text is retained and cannot be overwritten by ordinary HUD changes', () => {
  const h = harness({ stored: '{broken owner work' });
  h.loadState(); h.change({ hp: 30 }); h.saveState();
  assert.equal(h.stored(), '{broken owner work');
  assert.deepEqual(h.calls, []);
  assert.match(h.nodes.get('hud-save-status').textContent, /temporary|recovery/i);
  assert.equal(h.nodes.get('hud-download-stored-btn').hidden, false);
  assert.equal(h.nodes.get('hud-hp-val').textContent, '30/51');
});

test('blocked reads and writes remain visible while the temporary HUD stays usable', () => {
  const blockedRead = harness({ blockRead: true });
  blockedRead.loadState(); blockedRead.change({ hp: 40 }); blockedRead.saveState();
  assert.equal(blockedRead.calls.length, 0);
  assert.match(blockedRead.nodes.get('hud-save-status').textContent, /temporary|unavailable/i);
  const blockedWrite = harness({ blockWrite: true });
  blockedWrite.loadState(); blockedWrite.change({ hp: 39 }); blockedWrite.saveState();
  assert.equal(blockedWrite.nodes.get('hud-hp-val').textContent, '39/51');
  assert.match(blockedWrite.nodes.get('hud-save-status').textContent, /not saved/i);
});

test('legacy partial states are normalized without sharing the default slot arrays', () => {
  const h = harness();
  const first = h.normalizeState({ hp: 20, slots: { l1: [false, true, true, true] } });
  const second = h.normalizeState({});
  assert.equal(first.hp, 20); assert.equal(first.slots.l1[0], false);
  assert.equal(second.slots.l1[0], true); assert.equal(first.slots.l2.length, 3);
  for (const bad of [null, [], { hp: -1 }, { hp: 99 }, { slots: { l1: [true] } }, { turnPhase: 99 }, { wandCharges: -1 }, { concentrationSpell: {} }]) {
    assert.throws(() => h.normalizeState(bad));
  }
});

test('failed imports preserve current state and saved bytes', () => {
  const saved = JSON.stringify({ hp: 30 });
  const h = harness({ stored: saved, blockWrite: true });
  h.loadState();
  assert.equal(h.applyImport(JSON.stringify({ hp: 12 })), false);
  assert.equal(h.getState().hp, 30); assert.equal(h.stored(), saved);
  assert.equal(h.applyImport('{broken'), false);
  assert.equal(h.applyImport(JSON.stringify({ format: 'joe-hud-backup', version: 99, state: { hp: 12 } })), false);
});

test('versioned backups roundtrip resources and safe imported state persists', () => {
  const h = harness(); h.change({ hp: 19, turnPhase: 3, concentrationSpell: 'Web' });
  const raw = h.serializeBackup();
  assert.equal(JSON.parse(raw).format, 'joe-hud-backup');
  assert.equal(h.validateBackup(JSON.parse(raw)).hp, 19);
  const other = harness(); assert.equal(other.applyImport(raw), true);
  assert.equal(other.getState().hp, 19); assert.equal(JSON.parse(other.stored()).turnPhase, 3);
});

test('turn phase survives reload and explicit phase changes are saved', () => {
  const h = harness({ stored: JSON.stringify({ turnPhase: 3 }) });
  h.loadState(); h.initTurnPilot();
  assert.equal(h.getState().turnPhase, 3);
  h.steps[2].listeners.click();
  assert.equal(h.getState().turnPhase, 2);
  assert.equal(JSON.parse(h.stored()).turnPhase, 2);
});

test('imported concentration text is rendered as text rather than executable markup', () => {
  const h = harness();
  const text = '<img src=x onerror=alert(1)>';
  h.change({ concentrationSpell: text }); h.renderHud();
  const button = h.nodes.get('hud-concentration-btn');
  assert.ok(!button.innerHTML.includes(text));
  assert.equal(button.querySelector('strong').textContent, text);
});


test('unrelated or empty JSON cannot silently reset a session during import', () => {
  const h = harness({ stored: JSON.stringify({ hp: 28 }) }); h.loadState();
  for (const raw of ['{}', '{"otherApp":true}', '[]']) assert.equal(h.applyImport(raw), false);
  assert.equal(h.getState().hp, 28);
  assert.equal(JSON.parse(h.stored()).hp, 28);
});
