(function (global) {
  'use strict';

  const W = 1280, H = 720;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const number = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const distance = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2);
  const opposite = side => side === 'player' ? 'enemy' : 'player';
  const SKILL_TYPES = ['dash', 'projectile', 'fire', 'area', 'pull', 'lightning', 'clone', 'water', 'sand', 'wood', 'teleport', 'melee', 'trap', 'heal', 'summon', 'paper', 'genjutsu'];
  // Local reference-mode estimates, not extracted official frame/threshold data.
  const PROTECTION_YELLOW = .20, PROTECTION_RED = .55;
  const KNOCKDOWN_TIME = .38, RECOVERY_TIME = .24, GETUP_INVULN = 1, SUBSTITUTE_INVULN = 2;
  let serial = 0;

  class ArenaEngine {
    constructor(options = {}) {
      this.options = options;
      this.roster = Array.isArray(options.roster) ? options.roster : (global.NINJAS || []);
      this.onEvent = typeof options.onEvent === 'function' ? options.onEvent : () => {};
      this.difficulty = options.difficulty || 'normal';
      this.mode = options.mode === 'training' ? 'training' : 'duel';
      this.input = { x: 0, y: 0 };
      this._reset();
    }

    _reset() {
      const fallback = this.roster[0] || { id: 'ninja', name: '忍者', color: '#f39b38', speed: 1, skills: [] };
      const team = Array.isArray(this.options.team) && this.options.team.length ? this.options.team.slice(0, 3) : [fallback.id];
      const enemy = Array.isArray(this.options.enemy) && this.options.enemy.length ? this.options.enemy.slice(0, 3) : [fallback.id];
      const make = (ids, side) => ids.map((id, i) => this._fighter(this.roster.find(p => p.id === id) || fallback, side, i));
      this.state = {
        status: 'idle', mode: this.mode, width: W, height: H, time: 60, elapsed: 0, round: 1,
        player: null, enemy: null,
        teams: { player: make(team, 'player'), enemy: make(enemy, 'enemy') },
        indices: { player: 0, enemy: 0 }, entities: [], effects: [], combo: 0, comboTime: 0,
        banner: '准备决斗', bannerTime: 1.5, result: null
      };
      this.state.player = this.state.teams.player[0];
      this.state.enemy = this.state.teams.enemy[0];
      this._switches = {};
      this._queuedAttack = false;
      this._aiTimer = this.difficulty === 'easy' ? 1.1 : this.difficulty === 'hard' ? .45 : .8;
      this._aiDirection = 1;
      this.input.x = this.input.y = 0;
    }

    _fighter(profile, side, index) {
      return {
        id: profile.id, uid: `${side}-${index}-${++serial}`, profile, side,
        x: side === 'player' ? 330 : 950, y: 505, facing: side === 'player' ? 1 : -1,
        hp: 3000, maxHP: 3000, chakra: 2,
        cooldowns: { u: 0, i: 0, space: 0, k: 0, l: 0, h: 0 },
        stun: 0, invuln: 0, invulnKind: '', action: 'idle', actionTime: 0, air: 0, walk: 0, dead: false,
        armorKind: '', armorTime: 0, knockdown: 0, recovery: 0,
        protectionDamage: 0, protection: 0, protectionLevel: 'none', _launched: false,
        attackIndex: 0, castType: '', castName: '',
        _vx: 0, _vy: 0, _airV: 0, _basicTimer: 0, _lastBasic: 0, _dashTime: 0, _dashVX: 0,
        _neutralTime: 0, _aiCombo: 0
      };
    }

    start() {
      if (this.state.status === 'ended') return this.restart();
      if (this.state.status === 'idle') {
        this.state.status = 'playing';
        this._banner(this.mode === 'training' ? '自由练习 · 技能无对手干扰' : '决斗开始', 1.7);
        this._event('round', { round: 1, player: this.state.player, enemy: this.state.enemy });
      }
      return this;
    }

    restart() { this._reset(); return this.start(); }

    pause(value = true) {
      if (this.state.status === 'playing' && value) this.state.status = 'paused';
      else if (this.state.status === 'paused' && !value) this.state.status = 'playing';
      return this;
    }

    setInput(input = {}) {
      this.input.x = clamp(number(input.x, 0), -1, 1);
      this.input.y = clamp(number(input.y, 0), -1, 1);
    }

    _direction(f) {
      return this._onlineInputs?.[f.side] || (f.side === 'player' ? this.input : f.shenju?.aim || f.xiayin?.aim || f.obito?.aim || f.sasukeXiayin?.aim || {x:0,y:0});
    }

    _face(f, target = this.state[opposite(f.side)]) {
      const human = f.side === 'player' || !!this._onlineInputs;
      const x = this._direction(f).x;
      if (human && Math.abs(x) > .15) f._manualFacing = Math.sign(x);
      f.facing = human && f._manualFacing ? f._manualFacing : target.x >= f.x ? 1 : -1;
      return f.facing;
    }

    _queueBasic(f) {
      if (f.dead || f.stun > 0 || f.air > 0 || f._airV > 0 || f.knockdown > 0 || f.recovery > 0 || f.captured || f.inKamui || f.sxGrab || f.obRoot || !['skill','ultimate'].includes(f.action) || f.actionTime <= .025) return false;
      f._basicBuffer = Math.min(5, f.actionTime + .3);
      return true;
    }

    action(key) {
      key = String(key || '').toLowerCase();
      if (key === ' ' || key === 'spacebar') key = 'space';
      if (this.state.status !== 'playing') return false;
      const p = this.state.player;
      if (key === 'j' && p.action === 'attack' && p.actionTime < .26 && !p.dead && !p.stun && !p.knockdown && !p.recovery && p.air <= 0 && p._airV <= 0) {
        this._queuedAttack = true;
        return true;
      }
      return this._action(p, key);
    }

    update(dt) {
      if (this.state.status !== 'playing') return;
      // A frame may contain at most six fixed-size integration steps after a stalled tab.
      let remaining = clamp(number(dt, 0), 0, .1);
      while (remaining > .000001 && this.state.status === 'playing') {
        const step = Math.min(1 / 60, remaining);
        this._step(step);
        remaining -= step;
      }
    }

    _step(dt) {
      const s = this.state;
      s.elapsed += dt;
      s.bannerTime = Math.max(0, s.bannerTime - dt);
      if (!s.bannerTime) s.banner = '';
      s.comboTime = Math.max(0, s.comboTime - dt);
      if (!s.comboTime) s.combo = 0;
      for (const effect of s.effects) {
        effect.life -= dt;
        if (effect.type === 'text') effect.y -= 20 * dt;
      }
      s.effects = s.effects.filter(e => e.life > 0).slice(-120);

      for (const side of ['player', 'enemy']) {
        const f=s[side];
        if (!f.dead && !f.stun && !f.knockdown && !f.recovery && f.air <= 0 && !f.captured && !f.inKamui && !f.sxGrab && !f.obRoot && Math.abs(this._direction(f).x) > .15) this._face(f);
        this._tickFighter(f, dt);
      }
      for (const side of Object.keys(this._switches)) {
        this._switches[side] -= dt;
        if (this._switches[side] <= 0) this._advance(side);
      }
      if (s.status !== 'playing') return;

      if (!s.player.dead && !s.enemy.dead) {
        if (this.mode !== 'training') {
          s.time = Math.max(0, s.time - dt);
          if (s.time <= 0) { this._timeout(); return; }
        }
        this._move(s.player, this.input.x, this.input.y, dt);
        this._cpu(dt);
        if (!s.player.stun && !s.player.knockdown && !s.player.recovery && s.player.air <= 0 && s.player._airV <= 0 && s.player.actionTime < .02 && this._queuedAttack) {
          this._queuedAttack = false;
          this._action(s.player, 'j');
        }
        for (const side of ['player', 'enemy']) {
          const f = s[side], target = s[opposite(side)];
          if (!f.stun && !f.knockdown && !f.recovery && f.air <= 0 && f._airV <= 0 && f.action !== 'dash' && f.action !== 'attack' && f.action !== 'skill' && f.action !== 'ultimate') this._face(f,target);
          if (f._basicBuffer > 0 && f.actionTime <= .025 && !f.dead && !f.stun && f.air <= 0 && f._airV <= 0 && !f.knockdown && !f.recovery && !f.captured && !f.inKamui && !f.sxGrab && !f.obRoot) { f._basicBuffer=0; this._action(f,'j'); }
        }
      }
      this._tickEntities(dt);
    }

    _tickFighter(f, dt) {
      f._basicBuffer = Math.max(0, (f._basicBuffer || 0) - dt);
      if (f.stun > 0 || f.air > 0 || f.dead || f.captured || f.inKamui || f.sxGrab || f.obRoot) f._basicBuffer=0;
      if (f._airHold) {
        const h=f._airHold,owner=this.state.teams[h.side]?.find(a=>a.uid===h.uid);h.time-=dt;
        if (h.time<=0 || !owner || owner.dead || owner.stun>0 || owner.air>0 || owner.knockdown>0 || f.protectionLevel==='red' || f.captured || f.inKamui || f.sxGrab) f._airHold=null;
      }
      for (const key of Object.keys(f.cooldowns)) f.cooldowns[key] = Math.max(0, f.cooldowns[key] - dt);
      f.stun = Math.max(0, f.stun - dt);
      f.invuln = Math.max(0, f.invuln - dt);
      if (!f.invuln) f.invulnKind = '';
      f.actionTime = Math.max(0, f.actionTime - dt);
      f.armorTime = Math.max(0, f.armorTime - dt);
      if (!f.armorTime || !f.actionTime) this._clearArmor(f);
      if (f.recovery > 0) f.recovery = Math.max(0, f.recovery - dt);
      if (f.knockdown > 0) {
        f.knockdown = Math.max(0, f.knockdown - dt);
        if (!f.knockdown && !f.dead) {
          f.recovery = RECOVERY_TIME;
          f.invuln = GETUP_INVULN; f.invulnKind = 'getup';
          this._resetProtection(f);
          this._clearCombo();
        }
      }
      f._basicTimer = Math.max(0, f._basicTimer - dt);
      f._lastBasic += dt;
      if (f._dashTime > 0) {
        const dashStep = Math.min(dt, f._dashTime);
        f.x += f._dashVX * dashStep;
        f._dashTime = Math.max(0, f._dashTime - dt);
      }
      f.x = clamp(f.x + f._vx * dt, 100, 1180);
      f.y = clamp(f.y + f._vy * dt, 400, 590);
      f._vx *= Math.exp(-9 * dt);
      f._vy *= Math.exp(-9 * dt);
      if (f.air > 0 || f._airV > 0) {
        const maxAir = Math.max(120, f.y - 270);
        const gravity = f.protectionLevel === 'red' ? 2300 : f.protectionLevel === 'yellow' ? 1550 : 1050;
        const holding = f._airHold && f._airV <= 0 && f.air > 0;
        if (holding) f._airV=0;
        else { f.air = clamp(f.air + f._airV * dt, 0, maxAir); f._airV -= gravity * dt; }
        if (f.air >= maxAir) f._airV = Math.min(f._airV, 0);
        if (!f.air) {
          f._airV = 0;
          if (f._launched && !f.dead) {
            f.knockdown = KNOCKDOWN_TIME; f.stun = 0; f.actionTime = 0;
            this._clearArmor(f);
            this._stopDash(f);
            if (f.side === 'player') this._queuedAttack = false;
          }
        }
      }
      if (f.dead) { f.action = 'dead'; return; }
      if (f.knockdown > 0) f.action = 'knockdown';
      else if (f.recovery > 0) f.action = 'getup';
      else if (f.stun > 0 || f.air > 0 || f._airV > 0) f.action = 'hurt';
      else if (f.actionTime <= 0) { f.action = 'idle'; f.castType = ''; }
    }

    _move(f, x, y, dt) {
      if (f.dead || f.knockdown > 0 || f.recovery > 0 || f.stun > 0 || f.actionTime > 0 || f.air > 0 || f._airV > 0) return;
      const length = Math.hypot(x, y);
      if (length < .05) return;
      const rawSpeed = number(f.profile.speed, 1);
      const speed = rawSpeed > 10 ? clamp(rawSpeed, 170, 290) : 220 * clamp(rawSpeed, .7, 1.35);
      const scale = length > 1 ? 1 / length : 1;
      f.x = clamp(f.x + x * scale * speed * dt, 100, 1180);
      f.y = clamp(f.y + y * scale * speed * .57 * dt, 400, 590);
      if (Math.abs(x) > .1) f.facing = x > 0 ? 1 : -1;
      f.walk += dt * 10;
      f.action = 'run';
    }

    _stopDash(f) { f._dashTime = 0; f._dashVX = 0; }

    _clearArmor(f) { f.armorKind = ''; f.armorTime = 0; }
    _resetProtection(f) {
      f.protectionDamage = 0; f.protection = 0; f.protectionLevel = 'none'; f._launched = false;
    }
    _refreshProtection(f) {
      f.protection = clamp(f.protectionDamage / f.maxHP, 0, 1);
      f.protectionLevel = f.protection >= PROTECTION_RED ? 'red' : f.protection >= PROTECTION_YELLOW ? 'yellow' : 'none';
    }
    _resetReaction(f, invuln = 0, invulnKind = '') {
      this._stopDash(f); this._clearArmor(f); this._resetProtection(f);
      f.stun = f.air = f._airV = f._vx = f._vy = f.knockdown = f.recovery = f.actionTime = 0;
      f.action = f.dead ? 'dead' : 'idle'; f.castType = f.castName = '';
      f._airHold=null; f._basicBuffer=0; f._manualFacing=0;
      f.attackIndex = 0; f._lastBasic = 1; f._basicTimer = 0;
      f.invuln = invuln; f.invulnKind = invulnKind;
    }
    _clearCombo() { this.state.combo = this.state.comboTime = 0; }

    _resetCooldowns(f) {
      for (const key of Object.keys(f.cooldowns)) f.cooldowns[key] = 0;
    }

    _resetRoundCooldowns() {
      for (const side of ['player', 'enemy']) this._resetCooldowns(this.state[side]);
    }

    _action(f, key) {
      const s = this.state, target = s[opposite(f.side)];
      if (f.dead) return false;
      if (key === 'space') return this._substitute(f, target);
      if (key === 'k') return false;
      if (target.dead) return false;
      if (f.knockdown > 0 || f.recovery > 0 || f.air > 0 || f._airV > 0 || f.stun > 0 || f.actionTime > .025) return false;
      this._face(f,target);
      if (key === 'j') return this._basic(f);
      if (key === 'u' || key === 'i') {
        if (f.cooldowns[key] > 0) return false;
        const skill = (f.profile.skills || [])[key === 'u' ? 0 : 1] || { name: key === 'u' ? '突进之术' : '影分身之术', type: key === 'u' ? 'dash' : 'clone', damage: 140, cd: 9 };
        f.cooldowns[key] = Math.max(2, number(skill.cd, 9)) * (f.side === 'enemy' && this.difficulty === 'easy' ? 1.3 : 1);
        this._cast(f, skill, false, undefined, true);
        return true;
      }
      if (key === 'o') {
        if (f.chakra < 4) {
          if (f.side === 'player') this._effect('text', f.x, f.y - 120, '#ffe095', .8, { text: '需要 4 格奥义点' });
          return false;
        }
        f.chakra = 0;
        this._cast(f, f.profile.ultimate || { name: '奥义 · 终结连击', type: 'area', damage: 360 }, true);
        return true;
      }
      if (key === 'l' || key === 'h') {
        if (f.cooldowns[key]) return false;
        f.cooldowns[key] = key === 'l' ? 20 : 25;
        this._cast(f, key === 'l'
          ? { name: '秘卷 · 风遁压害', type: 'area', damage: 110, range: 175, lift: 370 }
          : { name: '通灵 · 蛤蟆吉', type: 'summon', damage: 85, range: 450 }, false, 'adamant');
        return true;
      }
      return false;
    }

    _basic(f) {
      if (f._basicTimer > 0) return false;
      this._clearArmor(f);
      this._stopDash(f);
      f.attackIndex = f._lastBasic < .85 ? f.attackIndex % 5 + 1 : 1;
      f._lastBasic = 0;
      const last = f.attackIndex === 5;
      const duration = last ? .48 : .31;
      f.action = 'attack'; f.actionTime = duration; f._basicTimer = duration - .02;
      f.x = clamp(f.x + f.facing * 13, 100, 1180);
      this._entity(f, {
        kind: 'strike', type: 'melee', x: f.x + f.facing * 50, y: f.y, width: last ? 155 : 132, height: 72,
        radius: 64, damage: last ? 48 : 29 + f.attackIndex * 3, life: .13, delay: .085,
        knockback: last ? 285 : 65, lift: last ? 390 : (f.attackIndex === 3 ? 330 : 0), stun: last ? .42 : .28,
        follow: true, offsetX: 52, hitStop: .018, isBasic: true
      });
      this._effect('slash', f.x + f.facing * 65, f.y - 54, f.profile.color || '#ffcf6f', .22, { facing: f.facing, radius: last ? 85 : 57 });
      return true;
    }

    _substitute(f, target) {
      if (f.cooldowns.space > 0 || f.chakra < 1 || f.dead) return false;
      this._stopDash(f);
      this._clearArmor(f); this._resetProtection(f); this._clearCombo();
      f.chakra -= 1; f.cooldowns.space = 15; f.stun = 0; f.invuln = SUBSTITUTE_INVULN; f.invulnKind = 'substitute';
      f.knockdown = f.recovery = 0;
      f.action = 'substitute'; f.actionTime = .22; f.air = 0; f._airV = 0; f._vx = f._vy = 0; f._dashTime = 0;
      f._airHold=null; f._basicBuffer=0;
      this._effect('smoke', f.x, f.y - 45, '#e1e9e9', .6, { radius: 65, text: '替身' });
      const behind = target.x - target.facing * 160;
      f.x = clamp(behind, 110, 1170);
      f.y = clamp(target.y + (target.y > 500 ? -65 : 65), 405, 585);
      f.facing = target.x >= f.x ? 1 : -1;
      this._effect('text', f.x, f.y - 100, '#b1f1ff', .8, { text: '替身 · 免伤' });
      if (f.side === 'player') this._queuedAttack = false;
      this._event('cast', { fighter: f, key: 'space', name: '替身术', type: 'substitute' });
      return true;
    }

    _cast(f, skill, ultimate, armorKind, awardChakra = false) {
      this._stopDash(f);
      const target = this.state[opposite(f.side)];
      const type = SKILL_TYPES.includes(skill.type) ? skill.type : 'melee';
      const damage = Math.max(1, number(skill.damage, ultimate ? 360 : 145));
      const range = clamp(number(skill.range, 300), 90, 900);
      const color = f.profile.color || '#ffbb55';
      const cast = { id: ++serial, ownerUid: f.uid, awardChakra, pointAwarded: false };
      f.action = ultimate ? 'ultimate' : 'skill'; f.actionTime = ultimate ? 1.1 : .48;
      f.armorKind = armorKind || (ultimate ? 'adamant' : 'skill');
      f.armorTime = f.actionTime;
      f.castType = type; f.castName = skill.name || '忍术';
      this._effect('text', f.x, f.y - 150, ultimate ? '#ffe194' : '#ffffff', ultimate ? 1.35 : .9, { text: f.castName, ultimate });
      this._event('cast', { fighter: f, name: f.castName, type, ultimate });

      if (ultimate) {
        this._banner(`奥义 · ${f.castName.replace(/^奥义[ ·：:]*/, '')}`, 1.4);
        this._effect('aura', f.x, f.y - 60, color, 1.1, { radius: 170, ultimate: true });
        // An ultimate has a visible startup and a generous, but escapable, target zone.
        this._entity(f, { type, kind: 'area', x: target.x, y: target.y, radius: 290, width: 580, height: 195,
          damage, life: .7, delay: .6, knockback: 360, lift: 440, stun: .7, isUltimate: true, color, cast });
        return;
      }

      const base = { type, damage, color, life: .25, delay: .16, knockback: 150, lift: number(skill.lift, 140), stun: .46, cast };
      const spawn = props => this._entity(f, { ...base, ...props });
      switch (type) {
        case 'dash':
          f.actionTime = .4; f._dashTime = .32; f._dashVX = f.facing * 740;
          spawn({ kind: 'strike', x: f.x + f.facing * 55, y: f.y, radius: 68, width: 160, height: 85, life: .36, delay: .04, follow: true, offsetX: 55, knockback: 300, lift: 250 });
          break;
        case 'teleport':
          this._effect('smoke', f.x, f.y - 30, color, .4, { radius: 55 });
          f.x = clamp(target.x - target.facing * 85, 100, 1180); f.y = target.y; this._face(f,target);
          spawn({ kind: 'area', x: target.x, y: target.y, radius: 115, height: 90, delay: .14, lift: 280 });
          break;
        case 'projectile':
        case 'fire':
        case 'water': {
          const water = type === 'water', fire = type === 'fire';
          spawn({ kind: 'projectile', x: f.x + f.facing * 65, y: f.y, radius: water ? 62 : fire ? 43 : 29,
            width: water ? 135 : fire ? 90 : 65, height: water ? 105 : 75, vx: f.facing * (water ? 410 : fire ? 470 : 610), vy: 0,
            life: 1.9, delay: .1, lift: water ? 280 : 120, knockback: water ? 260 : 160 });
          break;
        }
        case 'lightning':
          spawn({ kind: 'strike', x: f.x + f.facing * (range / 2 + 30), y: f.y, width: range, height: 85, radius: 90, life: .23, delay: .18, lift: 215, stun: .62 });
          this._effect('lightning', f.x, f.y - 45, '#b0e9ff', .4, { radius: range, facing: f.facing });
          break;
        case 'clone':
          for (let i = 0; i < 3; i++) {
            const x = clamp(f.x + f.facing * (95 + i * 105), 100, 1180);
            spawn({ kind: 'area', x, y: f.y, radius: 74, height: 80, damage: damage * .42, delay: .16 + i * .17, life: .19, knockback: 65, lift: i === 2 ? 280 : 95, stun: .32 });
            this._effect('clone', x, f.y, color, .65, { facing: f.facing, delay: i * .1, radius: 40 });
          }
          break;
        case 'pull':
          spawn({ kind: 'area', x: f.x, y: f.y, radius: Math.min(340, range), height: 170, delay: .28, pull: true, knockback: 0, lift: 180, stun: .62 });
          break;
        case 'sand':
        case 'wood':
          spawn({ kind: 'area', x: clamp(f.x + f.facing * Math.min(range, 300), 100, 1180), y: target.y, radius: type === 'sand' ? 105 : 86,
            height: 100, delay: .38, life: .48, lift: type === 'sand' ? 330 : 90, stun: type === 'wood' ? .95 : .55, knockback: 40 });
          break;
        case 'trap':
          spawn({ kind: 'area', x: clamp(f.x + f.facing * 150, 100, 1180), y: f.y, radius: 80, height: 80,
            delay: .45, life: 5, lift: 280, stun: .75, knockback: 90, trap: true });
          break;
        case 'heal':
          f.hp = Math.min(f.maxHP, f.hp + damage);
          this._effect('heal', f.x, f.y - 55, '#72e49a', .9, { radius: 90 });
          this._effect('text', f.x, f.y - 105, '#8dffad', .85, { text: `+${Math.round(damage)}` });
          break;
        case 'summon':
          for (let i = 0; i < 3; i++) spawn({ kind: 'area', x: clamp(f.x + f.facing * (150 + i * 130), 100, 1180), y: f.y,
            radius: 108, height: 110, damage: damage * .52, delay: .3 + i * .2, life: .24, lift: 240, stun: .4 });
          break;
        case 'paper':
          for (let i = -2; i <= 2; i++) spawn({ kind: 'projectile', x: f.x + f.facing * 60, y: f.y + i * 15, radius: 24,
            width: 44, height: 48, vx: f.facing * 500, vy: i * 32, life: 1.65, delay: .1 + Math.abs(i) * .04,
            damage: damage * .38, knockback: 55, lift: 75, stun: .28 });
          break;
        case 'genjutsu':
          spawn({ kind: 'area', x: clamp(f.x + f.facing * 205, 100, 1180), y: f.y, radius: 165, height: 135,
            delay: .32, life: .4, damage: damage * .8, knockback: 0, lift: 30, stun: 1.05 });
          break;
        case 'area':
          spawn({ kind: 'area', x: f.x + f.facing * 65, y: f.y, radius: Math.min(205, range), height: 140,
            delay: .23, life: .3, lift: number(skill.lift, 300), knockback: 260 });
          break;
        default:
          spawn({ kind: 'strike', x: f.x + f.facing * 90, y: f.y, width: Math.min(300, range), height: 90,
            radius: 95, delay: .13, life: .22, knockback: 240, lift: 230 });
      }
      f.armorTime = f.actionTime;
      if (type !== 'heal') this._effect('aura', f.x, f.y - 45, color, .35, { radius: 66, facing: f.facing });
    }

    _entity(f, data) {
      const e = { id: ++serial, owner: f.side, ownerUid: f.uid, kind: 'area', type: 'area', x: f.x, y: f.y,
        facing: f.facing, vx: 0, vy: 0, width: 150, height: 95, radius: 90, life: .25, delay: 0,
        damage: 100, knockback: 100, lift: 0, stun: .3, color: f.profile.color || '#ffc35b', hits: [], ...data };
      e.maxLife = e.life;
      this.state.entities.push(e);
      if (this.state.entities.length > 90) this.state.entities.splice(0, this.state.entities.length - 90);
      return e;
    }

    _tickEntities(dt) {
      const s = this.state;
      for (const e of s.entities) {
        if (e.life <= 0) continue;
        const owner = s.teams[e.owner].find(f => f.uid === e.ownerUid);
        if (e.delay > 0) { e.delay -= dt; continue; }
        e.life -= dt;
        if (e.follow && owner && !owner.dead) { e.x = owner.x + owner.facing * (e.offsetX || 0); e.y = owner.y; e.facing=owner.facing; e.visualHeight=owner.sasukeXiayin?.height||owner.shenju?.height||owner.xiayin?.height||owner.obito?.height||0; }
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.x < 30 || e.x > W + 80 || e.y < 320 || e.y > 690) e.life = 0;
        const target = s[opposite(e.owner)];
        if (!owner || target.dead || e.hits.includes(target.uid)) continue;
        if (this._collides(e, target) && this._hit(owner, target, e)) {
          e.hits.push(target.uid);
          if (e.kind === 'projectile' || e.trap) e.life = 0;
        }
      }
      s.entities = s.entities.filter(e => e.life > 0);
    }

    _collides(e, target) {
      const dx = Math.abs(target.x - e.x), dy = Math.abs(target.y - e.y);
      if (e.kind === 'strike') return dx < e.width / 2 + 25 && dy < e.height / 2 + 15;
      const rx = e.radius + 24, ry = e.height / 2 + 18;
      return (dx * dx / (rx * rx)) + (dy * dy / (ry * ry)) < 1;
    }

    _hit(attacker, target, e) {
      // This prototype has no per-move ground-pursuit flags: a downed body waits
      // for its recovery animation instead of being relaunched by every hitbox.
      if (target.invuln > 0 || target.dead || target.knockdown > 0 || target.recovery > 0) return false;
      const scale = attacker.side === 'enemy' ? (this.difficulty === 'easy' ? .42 : this.difficulty === 'hard' ? 1.13 : .64) : 1;
      const airborne = target.air > 0 || target._airV > 0;
      const reduction = e.isUltimate || !airborne ? 1 : target.protectionLevel === 'red' ? .7 : target.protectionLevel === 'yellow' ? .9 : 1;
      const damage = Math.max(1, Math.round(number(e.damage, 1) * scale * reduction));
      target.hp = Math.max(0, target.hp - damage);
      const dir = target.x >= attacker.x ? 1 : -1;
      const castArmor = target.armorTime > 0 && target.actionTime > 0 && target.stun <= 0 && !airborne
        && (target.armorKind === 'adamant' || (target.armorKind === 'skill' && e.isBasic === true));
      const launch = Math.max(0, number(e.lift, 0));
      if (!castArmor) {
        target._basicBuffer=0;
        this._stopDash(target); this._clearArmor(target);
        target._vx = dir * number(e.knockback, 0);
        if (e.pull) { target._vx = (attacker.x - target.x) * 4.5; target._vy = (attacker.y - target.y) * 3; }
        if (airborne || launch > 0) {
          target.protectionDamage += damage;
          this._refreshProtection(target);
          if (airborne) {
            // Protection weakens relaunch and increases gravity; it never
            // teleports the fighter down or grants an instant escape iframe.
            let impulse = launch || 120;
            if (target.protectionLevel === 'red') impulse = launch ? Math.min(80, launch * .35) : 0;
            else if (target.protectionLevel === 'yellow') impulse = launch ? launch * .75 : 40;
            target._airV = Math.max(target._airV, impulse);
          } else {
            target.air = 3; target._airV = launch;
          }
          target._launched = true;
          if (!e.isBasic && !e.isUltimate && target.protectionLevel !== 'red' && attacker.action === 'skill') target._airHold={uid:attacker.uid,side:attacker.side,time:clamp(attacker.actionTime+.28,.22,1.25)};
        }
        target.stun = Math.max(target.stun, clamp(number(e.stun, .3), 0, 1.05));
        target.actionTime = target.stun; target.action = 'hurt';
        // A staggered fighter cannot finish a pending body strike or dash.
        for (const attack of this.state.entities) {
          if (attack.ownerUid === target.uid && (attack.follow || attack.kind === 'strike')) attack.life = 0;
        }
      }
      target.invuln = .095; target.invulnKind = 'hit';
      if (e.cast && e.cast.awardChakra && !e.cast.pointAwarded && e.cast.ownerUid === attacker.uid) {
        attacker.chakra = clamp(attacker.chakra + 1, 0, 4);
        e.cast.pointAwarded = true;
      }
      if (attacker.side === 'player') {
        this.state.combo = this.state.comboTime > 0 ? this.state.combo + 1 : 1;
        this.state.comboTime = 2;
      } else this._queuedAttack = false;
      this._effect('spark', target.x, target.y - 55 - target.air, e.color, .28, { radius: e.isUltimate ? 105 : 43, facing: dir });
      this._effect('text', target.x + dir * 15, target.y - 108 - target.air, e.isUltimate ? '#ffe886' : '#ffffff', .65, { text: `−${damage}`, damage });
      this._event('hit', { attacker, target, damage, type: e.type, ultimate: !!e.isUltimate, combo: this.state.combo });
      if (target.hp <= 0) this._defeat(target, 'ko');
      return true;
    }

    _cpu(dt) {
      const f = this.state.enemy, target = this.state.player;
      if (this.mode === 'training' || f.dead || target.dead) return;
      this._aiTimer -= dt;
      if ((f.stun > .08 || f.air > 0 || f._airV > 0 || f.knockdown > 0 || f.recovery > 0) && f.cooldowns.space <= 0 && f.chakra >= 1 && f.hp < f.maxHP * .66) {
        this._substitute(f, target); this._aiTimer = .65; return;
      }
      if (f.knockdown > 0 || f.recovery > 0 || f.air > 0 || f._airV > 0 || f.stun > 0 || f.actionTime > 0) return;
      const dx = target.x - f.x, dy = target.y - f.y, dist = distance(f, target);
      if (Math.abs(dy) > 18) this._move(f, Math.abs(dx) > 160 ? Math.sign(dx) * .55 : 0, Math.sign(dy), dt);
      else if (Math.abs(dx) > 110) this._move(f, Math.sign(dx), 0, dt);
      else if (Math.abs(dx) < 55) this._move(f, -Math.sign(dx), 0, dt);
      if (this._aiTimer > 0) return;
      this._aiTimer = this.difficulty === 'hard' ? .18 : this.difficulty === 'easy' ? .68 : .48;
      if (f.chakra >= 4 && dist < 440 && target.invuln < .2) { this._action(f, 'o'); return; }
      if (dist < 145 && Math.abs(dy) < 48 && target.invuln < .15) {
        if (f._aiCombo++ % 4 === 3 && !f.cooldowns.u) this._action(f, 'u');
        else this._action(f, 'j');
        return;
      }
      const ready = ['u', 'i'].filter(k => f.cooldowns[k] <= 0);
      if (ready.length && dist < 570 && Math.abs(dy) < 90) {
        const key = ready[(Math.floor(this.state.elapsed * 3) + f._aiCombo) % ready.length];
        const skill = (f.profile.skills || [])[key === 'u' ? 0 : 1];
        const type = skill && skill.type;
        if (!['area', 'melee', 'pull', 'genjutsu', 'heal', 'clone'].includes(type) || dist < 280 || (type === 'heal' && f.hp < f.maxHP * .8)) {
          this._action(f, key); return;
        }
      }
      if (dist < 220 && !f.cooldowns.l && f.hp < f.maxHP * .65) this._action(f, 'l');
      else if (dist > 350 && !f.cooldowns.h && this.state.elapsed > 5) this._action(f, 'h');
    }

    _defeat(f, reason) {
      if (f.dead) return;
      f.dead = true; f.hp = 0;
      this._resetReaction(f); this._clearCombo();
      this._resetRoundCooldowns();
      this._effect('burst', f.x, f.y - 50, f.profile.color || '#ffc75f', .8, { radius: 130 });
      this._event('ko', { fighter: f, side: f.side, reason, training: this.mode === 'training' });
      if (this.mode === 'training' && f.side === 'enemy') {
        this._switches.enemy = 1.1;
        this._banner('练习目标击破 · 即将恢复', 1.2);
      } else {
        this._switches[f.side] = .95;
        this._banner(`${f.profile.name || '忍者'} 已退场`, 1.1);
      }
    }

    _advance(side) {
      delete this._switches[side];
      const s = this.state;
      if (this.mode === 'training' && side === 'enemy') {
        const f = s.enemy;
        f.hp = f.maxHP; f.dead = false;
        this._resetReaction(f, .8, 'spawn');
        f.x = 925; f.y = 505;
        s.entities = []; this._clearCombo();
        this._resetRoundCooldowns();
        this._banner('练习继续', 1);
        return;
      }
      const index = s.teams[side].findIndex((f, i) => i > s.indices[side] && !f.dead);
      if (index < 0) {
        const other = opposite(side);
        const otherHasAlive = s.teams[other].some(f => !f.dead);
        this._end(otherHasAlive ? other : 'draw', 'ko');
        return;
      }
      s.indices[side] = index;
      s[side] = s.teams[side][index];
      this._resetReaction(s[side], 1.2, 'spawn');
      s[side].x = side === 'player' ? 315 : 965; s[side].y = 505;
      // Existing traps and projectiles cannot hit an incoming fighter at the spawn point.
      s.entities = [];
      s.time = 60; s.round += 1;
      this._queuedAttack = false;
      this._clearCombo();
      const other = s[opposite(side)];
      this._resetReaction(other, other.dead ? 0 : .8, other.dead ? '' : 'spawn');
      if (!other.dead) { other.x = side === 'player' ? 950 : 330; other.y = 505; }
      this._resetRoundCooldowns();
      this._banner(`${s[side].profile.name || '忍者'} 登场`, 1.4);
      this._event('round', { round: s.round, side, player: s.player, enemy: s.enemy });
    }

    _timeout() {
      const s = this.state;
      const delta = s.player.hp / s.player.maxHP - s.enemy.hp / s.enemy.maxHP;
      this._banner('时间到 · 比较剩余体力', 1.1);
      if (Math.abs(delta) < .001) { this._defeat(s.player, 'timeout'); this._defeat(s.enemy, 'timeout'); }
      else this._defeat(delta > 0 ? s.enemy : s.player, 'timeout');
      s.time = 60;
    }

    _end(winner, reason) {
      const s = this.state;
      s.status = 'ended';
      s.result = { winner, reason, elapsed: s.elapsed, rounds: s.round,
        playerRemaining: s.teams.player.filter(f => !f.dead).length, enemyRemaining: s.teams.enemy.filter(f => !f.dead).length };
      s.banner = winner === 'player' ? '决斗胜利' : winner === 'enemy' ? '决斗失败' : '平局'; s.bannerTime = 99;
      this._event('end', s.result);
    }

    _effect(type, x, y, color, life, extra = {}) {
      this.state.effects.push({ type, x, y, color, life, maxLife: life, ...extra });
    }
    _banner(text, life) { this.state.banner = text; this.state.bannerTime = life; }
    _event(type, payload) { try { this.onEvent({ ...payload, type, skillType: payload.type }); } catch (_) { /* A sound/UI callback must not stop combat. */ } }
  }

  global.ArenaEngine = ArenaEngine;
})(typeof window !== 'undefined' ? window : globalThis);
