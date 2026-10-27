/* Manual opponent controls are available only in local practice. */
(() => {
  'use strict';
  const Base=window.ArenaEngine;
  const keys=['j','u','i','o','space','l','h','q','e'];
  const special=f=>f.shenju||f.xiayin||f.obito||f.sasukeXiayin;
  class PracticeEngine extends Base {
    constructor(options={}){
      super(options);
      if(this.mode==='training'){
        this._onlineInputs={player:this.input,enemy:{x:0,y:0}};
        this._onlineButtons={player:{},enemy:{}};
        this.supplyPracticeOpponent();
      }
    }
    setButtonHeld(key,value){super.setButtonHeld(key,value);if(this.mode==='training'&&this._onlineButtons)this._onlineButtons.player[key]=!!value;}
    setPracticeHeld(key,value){
      if(this.mode!=='training'||!keys.includes(key))return;
      const buttons=this._onlineButtons.enemy,previous=!!buttons[key];buttons[key]=!!value;
      const f=this.state.enemy;if(previous&&!value&&key==='j'&&f.xiayin&&f.attackIndex===2)f.xiayin.basicRelease=true;
    }
    releasePractice(){if(this.mode!=='training')return;for(const key of keys)this.setPracticeHeld(key,false);this._practiceQueue=false;}
    practiceAction(key){
      if(this.mode!=='training'||this.state.status!=='playing'||!keys.includes(key))return false;
      const f=this.state.enemy;
      if(key==='j'&&!special(f)&&f.action==='attack'&&f.actionTime<.26&&!f.dead&&!f.stun&&!f.knockdown&&!f.recovery&&f.air<=0&&f._airV<=0){this._practiceQueue=true;return true;}
      return this._action(f,key);
    }
    setPracticeOpponent(id){
      if(this.mode!=='training'||!['playing','paused'].includes(this.state.status))return false;
      const profile=this.roster.find(n=>n.id===id);if(!profile||this.options.canPracticeOpponent?.(id)===false)return false;
      const s=this.state,old=s.enemy,x=Math.max(100,Math.min(1180,old.x)),y=old.y;
      this.releasePractice();this._resetReaction(old);this._resetReaction(s.player);
      const f=this._fighter(profile,'enemy',0);f.x=x;f.y=y;
      s.enemy=f;s.teams.enemy=[f];s.indices.enemy=0;s.entities=[];s.effects=[];
      delete this._switches.enemy;this._clearCombo();this._queuedAttack=false;
      this.supplyPracticeOpponent();this._event('practice-opponent',{fighter:f});return true;
    }
    supplyPracticeOpponent(){
      if(this.mode!=='training'||this.state.enemy.dead)return false;
      const f=this.state.enemy;f.hp=f.maxHP;f.chakra=f.maxChakra||4;this._resetCooldowns(f);
      if(f.shenju)f.shenju.energy=100;
      if(f.sasukeXiayin)f.sasukeXiayin.energy=2;
      if(f.obito)f.obito.qUsed=f.obito.eUsed=false;
      return true;
    }
    resetPractice(){
      if(this.mode!=='training')return false;
      // Keep the selected opponent, including one changed since practice began.
      this.options.enemy=[this.state.enemy.id];
      this.releasePractice();for(const key of keys)this.setButtonHeld(key,false);
      this._reset();
      this._onlineInputs={player:this.input,enemy:{x:0,y:0}};
      this._onlineButtons={player:{},enemy:{}};
      for(const side of ['player','enemy'])for(const f of this.state.teams[side]){
        f.hp=f.maxHP;f.chakra=f.maxChakra||4;this._resetCooldowns(f);
        if(f.shenju)f.shenju.energy=100;
        if(f.sasukeXiayin)f.sasukeXiayin.energy=2;
      }
      this.start();return true;
    }
    _cpu(dt){
      if(this.mode!=='training')return super._cpu(dt);
      const f=this.state.enemy;this._move(f,0,0,dt);
      if(this._practiceQueue&&!f.dead&&!f.stun&&!f.knockdown&&!f.recovery&&f.air<=0&&f._airV<=0&&f.actionTime<.02){this._practiceQueue=false;this._action(f,'j');}
    }
    _advance(side){super._advance(side);if(this.mode==='training'&&side==='enemy'){this.releasePractice();this.supplyPracticeOpponent();}}
  }
  window.ArenaEngine=PracticeEngine;

  const names={j:'普攻',u:'一技能',i:'二技能',o:'奥义',space:'替身',l:'秘卷',h:'通灵',q:'神威突进',e:'神威坠落'};
  const glyphs={j:'拳',u:'忍',i:'術',o:'奥',space:'替',l:'封',h:'召',q:'穿',e:'坠'};
  class PracticeControls {
    constructor(options){
      this.options=options;this.pointers=new Map();this.held=new Set();this.selected='naruto-kcm';
      try{const id=localStorage.getItem('naruto-practice-opponent');if(options.roster.some(n=>n.id===id))this.selected=id;}catch{}
      this.root=document.createElement('div');this.root.id='practiceControls';this.root.className='practice-controls';this.root.hidden=true;
      this.root.innerHTML='<div class="practice-heading"><label>对手 <select aria-label="练习对手角色"></select></label><button type="button" class="practice-refill" aria-label="恢复对手生命、奥义点和技能冷却" title="对手补给：恢复生命、奥义点、能量和冷却">↻</button><button type="button" class="practice-reset" title="双方全部补给并恢复开局位置">复位</button></div><div class="practice-actions" role="group" aria-label="练习对手技能"></div>';
      document.querySelector('.enemy-hud').append(this.root);this.select=this.root.querySelector('select');this.refreshRoster();
      this.select.onchange=()=>{
        const e=this.options.engine(),id=this.select.value;
        this.release();if(e?.setPracticeOpponent(id)){this.selected=id;try{localStorage.setItem('naruto-practice-opponent',id);}catch{}this.options.changed();}else this.select.value=e?.state.enemy.id||this.selected;
        document.getElementById('arena').focus();
      };
      this.root.querySelector('.practice-refill').onclick=()=>{if(this.allowed()&&this.options.engine().supplyPracticeOpponent()){this.options.changed();this.options.toast('对手补给已恢复');document.getElementById('arena').focus();}};
      this.root.querySelector('.practice-reset').onclick=()=>{if(this.allowed())this.options.reset();};
      const row=this.root.querySelector('.practice-actions');
      for(const key of keys){
        const b=document.createElement('button');b.type='button';b.className='practice-skill';b.dataset.practice=key;b.innerHTML=`<span aria-hidden="true">${glyphs[key]}</span><kbd></kbd><i hidden></i>`;
        b.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();if(!this.allowed())return;this.pointers.set(event.pointerId,key);b.setPointerCapture(event.pointerId);this.updateHeld(key);this.act(key);});
        b.addEventListener('click',event=>{if(event.detail===0)this.act(key);});row.append(b);
      }
      for(const type of ['pointerup','pointercancel','lostpointercapture'])this.root.addEventListener(type,event=>{const key=this.pointers.get(event.pointerId);this.pointers.delete(event.pointerId);if(key)this.updateHeld(key);});
      this.root.addEventListener('contextmenu',event=>event.preventDefault());
    }
    opponentId(){if(this.options.locked(this.selected))this.selected=this.options.roster.find(n=>!this.options.locked(n.id))?.id;return this.selected;}
    refreshRoster(){
      this.select.replaceChildren();
      for(const n of this.options.roster){const o=document.createElement('option');o.value=n.id;o.disabled=this.options.locked(n.id);o.textContent=n.name+(n.variant?'「'+n.variant+'」':'')+(o.disabled?' · 登录解锁':'');this.select.append(o);}
      this.select.value=this.opponentId();const e=this.options.engine();if(e?.mode==='training'&&this.options.locked(e.state.enemy.id))e.setPracticeOpponent(this.selected);
    }
    allowed(){const e=this.options.engine();return !!(e?.mode==='training'&&!e.isRemote&&e.state.status==='playing'&&!this.options.blocked());}
    updateHeld(key){this.options.engine()?.setPracticeHeld?.(key,this.held.has(key)||[...this.pointers.values()].includes(key));}
    setHeld(key,value){if(value)this.held.add(key);else this.held.delete(key);this.updateHeld(key);}
    release(){this.held.clear();this.pointers.clear();this.options.engine()?.releasePractice?.();}
    act(key){
      if(!this.allowed())return;
      const e=this.options.engine(),f=e.state.enemy;
      if(this.options.locked(f.id)){this.options.toast('请先登录解锁该忍者');return;}
      const ok=e.practiceAction(key);this.sync();if(!ok)this.options.toast(key==='space'?'对手替身需实际受伤，且冷却与奥义点就绪':'对手暂时无法施放：请检查受击、冷却或能量状态');
    }
    sync(){
      const e=this.options.engine(),visible=!!(e?.mode==='training'&&!e.isRemote);this.root.hidden=!visible;document.getElementById('hud').classList.toggle('is-practice',visible);if(!visible)return;
      const f=e.state.enemy;this.select.value=f.id;this.select.disabled=e.state.status!=='playing';
      this.root.querySelector('.practice-refill').disabled=!this.allowed()||f.dead;
      this.root.querySelector('.practice-reset').disabled=!this.allowed();
      for(const b of this.root.querySelectorAll('[data-practice]')){
        const key=b.dataset.practice,label=this.options.key('enemy_'+key);b.hidden=(key==='q'||key==='e')&&!f.obito;b.disabled=!this.allowed()||f.dead;
        const name=key==='u'?f.profile.skills[0]?.name:key==='i'?f.profile.skills[1]?.name:key==='o'?f.profile.ultimate.name:names[key];
        b.title=`对手${name} · ${label}${key==='o'&&f.sasukeXiayin?'（短按格挡，长按奥义）':''}`;b.setAttribute('aria-label',`对手${names[key]}：${name}`);b.querySelector('kbd').textContent=label;
        let cd=f.cooldowns[key]||0;if(key==='u'&&(f.xiayin?.recast>0||f.obito?.woodWindow>0||f.obito?.comboReady>0&&f.obito?.perfect>0))cd=0;
        const badge=b.querySelector('i');badge.textContent=cd>0?Math.ceil(cd):key==='o'&&f.chakra<4&&!f.shenju?.wushuang&&!f.sasukeXiayin?'4点':key==='space'&&!window.ArenaSubstitution.canEscape(f,e.state.player)?'受击':key==='space'&&f.chakra<1?'1点':f.sasukeXiayin&&['u','i'].includes(key)&&f.sasukeXiayin.energy<1&&!f.sasukeXiayin.pending?'能量':f.obito&&['q','e'].includes(key)&&f.obito.unlock<=0?'神威':'';
        badge.hidden=!badge.textContent;b.classList.toggle('not-ready',!!badge.textContent);
      }
    }
  }
  window.ArenaPracticeControls=PracticeControls;
})();
