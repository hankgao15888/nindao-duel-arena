/* Physical keyboard bindings. Combat modules continue to use their original action IDs. */
(() => {
  'use strict';
  const actions = [
    ['w','向上移动','KeyW'], ['a','向左移动','KeyA'],
    ['s','向下移动','KeyS'], ['d','向右移动','KeyD'],
    ['j','普通攻击','KeyJ'], ['u','技能一','KeyU'], ['i','技能二','KeyI'],
    ['o','奥义','KeyO'], ['space','替身','Space'], ['l','秘卷','KeyL'],
    ['h','通灵','KeyH'], ['q','带土子技能一','KeyQ'], ['e','带土子技能二','KeyE']
  ].map(([id,name,code]) => Object.freeze({id,name,code}));
  const defaults = Object.freeze(Object.fromEntries(actions.map(a => [a.id,a.code])));
  const arrows = {ArrowUp:'w',ArrowLeft:'a',ArrowDown:'s',ArrowRight:'d'};
  const names = {Space:'空格',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',
    Enter:'Enter',Tab:'Tab',Backspace:'退格',ShiftLeft:'左 Shift',ShiftRight:'右 Shift',
    CapsLock:'CapsLock',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',
    Backslash:'\\',Semicolon:';',Quote:"'",Backquote:'`',Comma:',',Period:'.',Slash:'/',
    Home:'Home',End:'End',PageUp:'PageUp',PageDown:'PageDown',Insert:'Insert',Delete:'Delete',
    NumpadAdd:'数字区 +',NumpadSubtract:'数字区 -',NumpadMultiply:'数字区 ×',
    NumpadDivide:'数字区 ÷',NumpadDecimal:'数字区 .',NumpadEnter:'数字区 Enter'};
  const allowed = code => typeof code === 'string' &&
    (/^(Key[A-Z]|Digit[0-9]|Numpad[0-9])$/.test(code) || Object.hasOwn(names,code));
  const label = code => names[code] || (/^Key[A-Z]$/.test(code) ? code.slice(3) :
    /^Digit[0-9]$/.test(code) ? code.slice(5) : /^Numpad[0-9]$/.test(code) ? '数字区 '+code.slice(6) : code);
  class ArenaKeybindings {
    constructor(storage) {
      this.storage = storage;
      this.bindings = {...defaults};
      try {
        const saved = JSON.parse(storage.getItem('naruto-duel-keybindings') || 'null');
        if (saved && actions.every(a => allowed(saved[a.id])) &&
            new Set(actions.map(a => saved[a.id])).size === actions.length)
          this.bindings = Object.fromEntries(actions.map(a => [a.id,saved[a.id]]));
      } catch {} // Private browsing or malformed data keeps the original controls usable.
    }
    label(action) { return label(this.bindings[action]); }
    resolve(code) {
      // Explicit bindings take priority over the spare arrow-key movement controls.
      return actions.find(a => this.bindings[a.id] === code)?.id || arrows[code] || null;
    }
    bind(action,code) {
      if (!Object.hasOwn(defaults,action) || !allowed(code)) return {ok:false};
      const swapped = actions.find(a => a.id !== action && this.bindings[a.id] === code);
      if (swapped) this.bindings[swapped.id] = this.bindings[action];
      this.bindings[action] = code;
      return {ok:true,swapped:swapped?.name,saved:this.save()};
    }
    reset() { this.bindings = {...defaults}; return this.save(); }
    save() {
      try { this.storage.setItem('naruto-duel-keybindings',JSON.stringify(this.bindings)); return true; }
      catch { return false; }
    }
  }
  ArenaKeybindings.actions = Object.freeze(actions);
  ArenaKeybindings.allowed = allowed;
  window.ArenaKeybindings = ArenaKeybindings;
})();
