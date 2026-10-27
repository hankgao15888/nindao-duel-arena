/* Guest play remains local; account access unlocks restricted ninjas and chat. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const roster = window.NINJAS || [];
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if (!roster.length || !window.ArenaEngine || !window.ArenaRenderer || !window.ArenaKeybindings) { $('selection').innerHTML='<p style="padding:50px">游戏文件未完整加载。请刷新页面；本地游玩时，请保留整个游戏文件夹，再打开 index.html。</p>'; return; }
  const renderer = new window.ArenaRenderer($('arena'));
  const locked=n=>window.ArenaAuth?.isLocked(n)??true;
  const playable=()=>roster.filter(n=>!locked(n));
  let team = playable().slice(0,3).map(n=>n.id), slot=0, viewed=team[0], rank='all', mode='duel', engine=null, pausedForModal=false,pendingPick=null;
  let last=performance.now(), drawTime=0, lastHUD=0, portraitIds='', toastTimer, audio=null, sound=false, won=false;
  const held = new Set(), pressedKeys = new Map(), pointerKeys = new Map(), byId=id=>roster.find(n=>n.id===id)||roster[0];
  let keyStorage;try{keyStorage=window.localStorage;}catch{}
  const keybindings = new window.ArenaKeybindings(keyStorage);
  let practice=null;
  let chatPausedEngine=null;
  window.addEventListener('arena-chat-open',()=>{chatPausedEngine=engine?.state.status==='playing'?engine:null;if(chatPausedEngine)engine.pause(true);clearControls();});
  window.addEventListener('arena-chat-close',()=>{clearControls();if(engine===chatPausedEngine&&engine?.state.status==='paused'&&$('modal').hidden&&$('keySettings').hidden)engine.pause(false);chatPausedEngine=null;});
  let authPausedEngine=null;
  window.addEventListener('arena-auth-open',()=>{authPausedEngine=engine?.state.status==='playing'?engine:null;if(authPausedEngine)engine.pause(true);clearControls();});
  window.addEventListener('arena-auth-close',event=>{clearControls();if(!event.detail?.authenticated)pendingPick=null;if(engine===authPausedEngine&&engine?.state.status==='paused'&&$('modal').hidden&&$('keySettings').hidden)engine.pause(false);authPausedEngine=null;});
  let listeningFor=null, settingsResume=false, settingsOpener=null;
  const keyLabel = action => keybindings.label(action);
  const movementLabel = () => ['w','a','s','d'].map(keyLabel).join(' / ');
  const keyHints = text => String(text).replace(/\bWASD\b|\b[JUIOHLQE]\b|空格/g,
    token => token==='WASD'?movementLabel():keyLabel(token==='空格'?'space':token.toLowerCase()));
  const joystick=$('joystick'),stick={x:0,y:0,pointerId:null};
  function movementInput(){
    const keyboardX=(held.has('d')?1:0)-(held.has('a')?1:0);
    const keyboardY=(held.has('s')?1:0)-(held.has('w')?1:0);
    return {x:Math.max(-1,Math.min(1,keyboardX+stick.x)),y:Math.max(-1,Math.min(1,keyboardY+stick.y))};
  }
  function clearControls(){
    practice?.release();
    held.clear();pressedKeys.clear();pointerKeys.clear();stick.x=stick.y=0;
    const pointerId=stick.pointerId;stick.pointerId=null;
    if(pointerId!==null&&joystick.hasPointerCapture(pointerId))joystick.releasePointerCapture(pointerId);
    if(engine){engine.setInput({x:0,y:0});if(engine.setButtonHeld)for(const k of ['j','u','i','o','q','e'])engine.setButtonHeld(k,false);}
    joystick.querySelector('.stick-center').style.transform='translate(0px,0px)';
  }
  try { const saved=JSON.parse(localStorage.getItem('naruto-duel-team')||'null'); if (Array.isArray(saved)&&saved.length===3&&saved.every(id=>roster.some(n=>n.id===id))&&new Set(saved).size===3) team=saved; viewed=team[0]; } catch {}
  function sanitizeTeam(){const pool=playable().map(n=>n.id),next=[];for(const id of team)next.push(pool.includes(id)&&!next.includes(id)?id:pool.find(value=>!next.includes(value)));team=next;if(!roster.some(n=>n.id===viewed)||locked(viewed))viewed=team[0];}
  sanitizeTeam();
  const portrait = (n,cls='') => n.portrait ? `<img class="${cls}" src="${esc(n.portrait)}" alt="${esc(n.name)}" ${n.portraitPosition?`style="object-position:${esc(n.portraitPosition)}"`:''} loading="eager">` : typeof renderer.portraitSVG==='function' ? renderer.portraitSVG(n) : `<span style="font-size:42px;color:${esc(n.color||'#f0bf70')}">${esc(n.name.slice(0,1))}</span>`;
  const fullName=n=>n.name+(n.variant?`「${n.variant}」`:'');
  function bindFallbacks(root) { root.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{ const n=roster.find(n=>img.getAttribute('src')===n.portrait); if(n&&typeof renderer.portraitSVG==='function') img.outerHTML=renderer.portraitSVG(n); else img.style.opacity='.15'; },{once:true})); }
  function drawRoster() {
    const q=$('search').value.trim().toLowerCase();
    const list=roster.filter(n=>(rank==='all'||(rank==='B'?['B','C'].includes(n.rank):n.rank===rank))&&fullName(n).toLowerCase().includes(q));
    $('roster').innerHTML=list.length?list.map(n=>`<button class="ninja-card ${locked(n)?'login-locked':''} ${team.includes(n.id)?'selected':''} ${viewed===n.id?'viewing':''}" data-id="${esc(n.id)}" aria-label="${locked(n)?'登录解锁':'选择'}${esc(fullName(n))}"><div class="card-art">${portrait(n)}<span class="card-rank">${esc(n.rank||'A')}</span>${team.includes(n.id)?`<span class="squad-number">${team.indexOf(n.id)+1}</span>`:''}${locked(n)?'<span class="ninja-lock">登录解锁</span>':''}</div><div class="card-caption"><b>${esc(n.name)}</b><small>${esc(n.variant||'常规形态')}</small></div></button>`).join(''):'<div class="empty-roster">没有找到符合条件的忍者</div>';
    $('rosterCount').textContent=`${list.length} / ${roster.length} 位忍者`;
    document.querySelector('.roster-meta>span:last-child').textContent=window.ArenaAuth?.user?'已登录 · 全部忍者可用':`游客可用 ${playable().length} 位 · 登录解锁全部`;
    bindFallbacks($('roster'));
    $('roster').querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>pick(b.dataset.id)));
  }
  function drawSquad() {
    $('squad').innerHTML=team.map((id,i)=>`<button class="squad-slot ${slot===i?'active':''}" data-slot="${i}" aria-label="替换第${i+1}位：${esc(fullName(byId(id)))}"><div class="slot-art">${portrait(byId(id))}</div><b>${i+1}</b><span>${esc(byId(id).name)}</span></button>`).join('');
    bindFallbacks($('squad'));
    $('squad').querySelectorAll('[data-slot]').forEach(b=>b.addEventListener('click',()=>{slot=Number(b.dataset.slot); viewed=team[slot];drawSquad();drawDetail();drawRoster();}));
  }
  function drawDetail() {
    const n=byId(viewed);$('heroArt').innerHTML=portrait(n);bindFallbacks($('heroArt'));$('heroName').textContent=n.name;$('heroVariant').textContent=n.variant||'常规形态';$('heroRank').textContent=n.rank||'A';
    $('heroSkills').innerHTML=[...n.skills.map((s,i)=>({...s,key:i?'i':'u'})),{...n.ultimate,key:'o'}].map(s=>`<div class="hero-skill"><span>${esc(keyLabel(s.key))}</span><div><b>${esc(s.name)}</b><p>${esc(keyHints(s.description||'按对应按键施放忍术。'))}</p></div></div>`).join('');
  }
  function save(){try{localStorage.setItem('naruto-duel-team',JSON.stringify(team));}catch{}}
  function pick(id){if(locked(id)){pendingPick={id,slot};viewed=id;drawDetail();drawRoster();window.ArenaAuth?.open('登录后即可使用'+fullName(byId(id))+'，同时解锁新忍者和聊天。');return;}const existing=team.indexOf(id);if(existing!==-1&&existing!==slot){[team[slot],team[existing]]=[team[existing],team[slot]];}else team[slot]=id;viewed=id;slot=(slot+1)%3;save();drawRoster();drawSquad();drawDetail();tone(350,.04);}
  $('search').addEventListener('input',drawRoster);
  document.querySelectorAll('[data-rank]').forEach(b=>b.addEventListener('click',()=>{rank=b.dataset.rank;document.querySelectorAll('[data-rank]').forEach(x=>x.classList.toggle('active',x===b));drawRoster();}));
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));$('start').innerHTML=mode==='training'?'进入练习 <span>▶</span>':'开始决斗 <span>▶</span>';}));
  $('random').addEventListener('click',()=>{team=playable().sort(()=>Math.random()-.5).slice(0,3).map(n=>n.id);viewed=team[0];slot=0;save();drawRoster();drawSquad();drawDetail();});
  function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,1800);}
  function tone(freq,duration=.06,type='sine',gain=.04){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.45),audio.currentTime+duration);g.gain.setValueAtTime(gain,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
  function onEvent(e){if(e.type==='hit')tone(130,.065,'triangle',.055);if(e.type==='cast')tone(500,.14,'sawtooth',.025);if(e.type==='ko')tone(90,.4,'triangle',.08);if(e.type==='end')setTimeout(showResult,400);}
  function begin(){if(team.some(id=>locked(id))){sanitizeTeam();drawRoster();drawSquad();drawDetail();window.ArenaAuth?.open('此阵容含有需要登录的忍者，请先登录。');return;}clearControls();won=false;const enemies=mode==='training'?[practice.opponentId()]:playable().sort(()=>Math.random()-.5).slice(0,3).map(n=>n.id);engine=new window.ArenaEngine({roster,team:[...team],enemy:enemies,difficulty:$('difficulty').value,mode,onEvent,canPracticeOpponent:id=>!locked(id)});engine.start();portraitIds='';$('selection').hidden=true;$('modal').hidden=true;$('hud').hidden=false;$('trainingTip').hidden=mode!=='training';$('arena').focus();syncHUD();tone(700,.22);}
  $('start').addEventListener('click',begin);
  function showSelection(){clearControls();engine=null;practice?.sync();$('hud').hidden=true;$('modal').hidden=true;$('selection').hidden=false;drawRoster();drawSquad();drawDetail();}
  window.addEventListener('arena-auth-change',()=>{const restricted=team.some(id=>locked(id));if(restricted){sanitizeTeam();save();if(engine)showSelection();}if(window.ArenaAuth?.user&&pendingPick){const requested=pendingPick;pendingPick=null;slot=requested.slot;pick(requested.id);}practice?.refreshRoster();drawRoster();drawSquad();drawDetail();});
  function modal(label,title,body,buttons){$('modalLabel').textContent=label;$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modalActions').innerHTML='';buttons.forEach(([text,fn,primary])=>{const b=document.createElement('button');b.className=primary?'gold-button':'icon-button';b.textContent=text;b.onclick=fn;$('modalActions').append(b);});$('modal').hidden=false;}
  function resume(){if(engine&&engine.state.status==='paused')engine.pause(false);clearControls();$('modal').hidden=true;$('arena').focus();}
  function pauseGame(){if(!engine||engine.state.status==='ended')return;if(engine.state.status==='paused'){resume();return;}engine.pause(true);clearControls();modal('MATCH PAUSED','对战暂停','喘口气，下一次出手更加从容。',[['继续对战',resume,true],['重新选人',showSelection,false]]);}
  $('pause').onclick=pauseGame;
  $('reselect').onclick=()=>{if(engine&&engine.state.status==='playing')engine.pause(true);clearControls();modal('CHANGE SQUAD','重新选择忍者','本场对战将结束，返回出战阵容。',[['返回选人',showSelection,true],['继续对战',resume,false]]);};
  function showResult(){if(!engine||engine.state.status!=='ended'||won)return;won=true;const s=engine.state;const r=s.result;const winner=typeof r==='string'?r:r?.winner;const victory=winner==='player';modal('DUEL COMPLETE',victory?'决斗胜利':winner==='draw'?'势均力敌':'再接再厉',`<p>${victory?'忍道，由你来证明。':'调整技能距离与替身时机，再战一场。'}</p><p>出战阵容：${team.map(id=>esc(byId(id).name)).join(' · ')}</p>`,[['再次对战',begin,true],['更换阵容',showSelection,false]]);tone(victory?660:180,.5,'triangle',.06);}
  const helpBody=`<div class="help-grid"><div><b>摇杆 / WASD / 方向键</b>移动</div><div><b>J</b>普通攻击，连按衔接</div><div><b>U / I</b>技能一 / 技能二</div><div><b>O</b>奥义，消耗四格奥义点</div><div><b>空格</b>替身，消耗一格奥义点</div><div><b>L</b>秘卷</div><div><b>H</b>通灵</div><div><b>Esc</b>暂停 / 继续</div></div>
    <p>左右摇杆可调整朝向，松开后保持所选朝向；技能动作期间提前按 J，结束后接普攻。技能命中的短暂浮空便于追击，连击保护和替身继续生效。佐助强化普攻的各段均可用摇杆跨 Y 移动。</p>
    <p>双方每位忍者的生命值为 3000。普攻区分平推和击飞；替身仅能在敌方攻击实际扣血后的受击、浮空、倒地或抓取期间使用，起身后失效；消耗一格奥义点，冷却 15 秒。替身会落在敌人背后，与敌人处于同一条横线。</p>
    <p>普通技能施放期间的硬体可抵抗普攻打断。奥义、秘卷与通灵的施放保护可抵抗控制，但仍会受到伤害；替身和起身无敌才会阻止伤害。</p>
    <p>U / I 技能成功命中后，每次施放最多获得一格奥义点；打空、普攻、秘卷、通灵和奥义不额外加点。四格可释放奥义，替身消耗一格。</p>
    <p>浮空受击会累计保护，黄保和红保会加快下落并减少普通伤害；奥义无视该减伤。自然落地后进入倒地、起身和短暂无敌，再恢复交战。</p>
    <p><b>神驹佑将专属：</b>J 四段普攻后接 U，分别为陷阵→灭神斩、狂风→火焰戟、连环→神烈驹、乱舞→神鬼，黄条内再按 U 出二段。I 可取消攻击并跳跃，再按 I 二段跳；摇杆调整空中落点。空中 J 挥戟，二段跳 J 砸地，空中 U 下戳；I 快接 J 或从二技能滑向普攻为上撩。</p>
    <p>神驹斑最多六格奥义点，U / I 使用能量条。O 消耗四格进入无双；J 九段连斩，U 蓝色键或 O 消耗剩余点数与能量发动须佐终结。无双期间仅命中回能，斩击时有霸体。练习模式可点“练习补给”体验完整招式。</p>
    <p><b>侠隐江湖专属：</b>U 金钟格挡，可长按；黄条内再次 U 落钟，成功格挡后落钟索敌。U 快接 J 为跳抓，I 快接 J 为乘龙俯冲，也可从技能按钮滑向普攻。4A 后上方向加 J 进入空中连击。钟禁锢敌人时，J 飞踢送钟，I 双龙盘钟，U 钟上感化（技能需冷却就绪）。左下角可选择明神门或树界降临。</p>
    <p><b>忍战带土专属：</b>U 扦插固定，再按 U 爆风乱舞，引燃木刺追加爆炸。I 神威可取消普攻或忍术，并解锁 Q 突进、E 坠落；短按攻击，长按只虚化移动。子技能命中后 J 吸入时空间，再按 J 提前扔出，或用 U 扔出接木遁。神威瞬间闪避攻击会触发紫光，紫光子技能命中后可接 U 空间火遁、O 魔像巨掌。普通 O 为十尾奥义。</p>
    <p><b>佐助「侠隐江湖」：</b>U 炎剑、I 雷剑消耗一格剑意；自动回能，命中也回能。技能快接 J / O 或触屏滑向对应按钮可派生。U→J 火剑天照前再 J 瞬身追剑；I→J 雷剑命中再 J 雷影连斩；U→O 架势格挡成功后连按 J 四式；I→O 飞鸟上挑后 J 千鸟千本。短按 O 须佐格挡，O→J 消耗一点强化七段普攻。四点时长按 O 踏日裁岳，炎剑架势中长按 O 劫火烙八荒，飞鸟中长按 O／千本后按 O 雷麟碎空闪。强化第五段擒拿成功才可接六、七段。</p>
    <p>三人依次出战，击倒对方全队获胜。每个小回合分出胜负后，双方技能冷却全部归零，下一位忍者登场时再次重置；练习目标击破、恢复时同样生效。生命值和奥义点沿用现有规则。练习模式的对手不主动攻击。可在对手血条下选择角色、点击小技能按钮，或用数字键 1—7 施放对手普攻、两种忍术、奥义、替身、秘卷和通灵，8 / 9 为带土子技能；长按也支持，对手补给 ↻ 恢复生命、能量和冷却。对手快捷键可在按键设置中修改。当前为原版规则的参考实现，精确帧数和数值仍有简化。</p>`;
  $('help').onclick=()=>{pausedForModal=!!engine&&engine.state.status==='playing';if(pausedForModal)engine.pause(true);clearControls();modal('HOW TO PLAY','操作说明',keyHints(helpBody),[['知道了',()=>{if(pausedForModal)resume();else $('modal').hidden=true;},true]]);};
  $('reference').onclick=()=>{const n=byId(viewed);modal('CHARACTER REFERENCE',n.name,`<div class="reference-notes"><strong>${esc(fullName(n))}</strong><p>技能名称与主要表现参考用户提供的角色攻略。本作使用自行编写的动画与战斗逻辑。</p><p>冷却、伤害、移动距离和浮空数值为本地游戏调校，不能作为原版数据使用。</p>${n.notes?`<p>${esc(n.notes)}</p>`:''}<a href="${esc(n.source)}" target="_blank" rel="noopener">打开该角色的参考文章 ↗</a></div>`,[['返回选人',()=>$('modal').hidden=true,true]]);};
  $('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'音效：开':'音效：关';if(sound)tone(660,.12);};
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{toast('当前浏览器不支持全屏，可按 F11。');}};
  function refreshKeyLabels(){
    document.querySelectorAll('[data-action] kbd').forEach(kbd=>{kbd.textContent=keyLabel(kbd.parentElement.dataset.action);});
    joystick.querySelector('span').textContent='拖动 / '+movementLabel();
    $('arena').setAttribute('aria-label',`忍者决斗场，${movementLabel()}移动，${keyLabel('j')}普攻，${keyLabel('u')}和${keyLabel('i')}技能，${keyLabel('o')}奥义，${keyLabel('space')}替身`);
    drawDetail();if(engine)syncHUD();
  }
  function drawKeySettings(){
    $('keyGrid').innerHTML=window.ArenaKeybindings.actions.map(a=>`<button type="button" class="key-binding ${listeningFor===a.id?'listening':''}" data-bind="${a.id}" aria-label="修改${a.name}，当前${esc(keyLabel(a.id))}" aria-pressed="${listeningFor===a.id}"><span>${a.name}</span><kbd>${listeningFor===a.id?'请按键…':esc(keyLabel(a.id))}</kbd></button>`).join('');
    $('keyGrid').querySelectorAll('[data-bind]').forEach(button=>button.onclick=()=>{
      clearControls();listeningFor=button.dataset.bind;drawKeySettings();
      $('keyStatus').textContent='请按下新的按键；Esc 取消这次录入。';
      $('keyGrid').querySelector(`[data-bind="${listeningFor}"]`).focus();
    });
  }
  function openKeySettings(event){
    if(!$('keySettings').hidden)return;
    settingsOpener=event?.currentTarget||document.activeElement;
    settingsResume=!!engine&&engine.state.status==='playing';
    if(settingsResume)engine.pause(true);
    clearControls();listeningFor=null;drawKeySettings();
    $('keyStatus').textContent='点击要修改的操作，再按下新按键。修改立即生效。';
    $('keySettings').hidden=false;$('keyGrid').querySelector('button').focus();
    for(const region of [document.querySelector('.topbar'),$('selection'),$('hud'),$('modal')])region.inert=true;
  }
  function closeKeySettings(){
    listeningFor=null;clearControls();$('keySettings').hidden=true;
    for(const region of [document.querySelector('.topbar'),$('selection'),$('hud'),$('modal')])region.inert=false;
    if(settingsResume&&engine?.state.status==='paused')engine.pause(false);
    settingsResume=false;
    if(engine?.state.status==='playing')$('arena').focus();else settingsOpener?.focus();
  }
  document.querySelectorAll('[data-key-settings]').forEach(button=>button.onclick=openKeySettings);
  $('closeKeySettings').onclick=closeKeySettings;
  $('resetKeys').onclick=()=>{
    listeningFor=null;clearControls();const saved=keybindings.reset();drawKeySettings();refreshKeyLabels();
    $('keyStatus').textContent=saved?'已恢复默认按键，并保存到当前浏览器。':'已恢复默认按键；当前浏览器无法保存，关闭页面后会恢复默认。';
    $('resetKeys').focus();
  };
  $('keySettings').addEventListener('click',event=>{if(event.target===$('keySettings'))closeKeySettings();});
  function controlLabel(fighter){
    if(fighter.dead)return '退场';
    if(fighter.inKamui)return '神威空间';
    if(fighter.obRoot)return '扦插固定';
    if(fighter.captured)return '禁锢';
    if(fighter.sxGrab)return '擒拿';
    if(fighter.knockdown>0)return '倒地';
    if(fighter.recovery>0)return '起身';
    if(fighter.air>0||fighter._airV>0)return '浮空';
    return fighter.stun>0?'受击':'';
  }
  function act(key){
    if(!engine||engine.state.status!=='playing'||!$('modal').hidden||!$('keySettings').hidden)return;
    const player=engine.state.player;if(!player||player.dead)return;
    const locked=controlLabel(player);
    if(locked&&key!=='space'){toast(`${locked}中，仅可使用替身`);return;}
    if(key==='o'&&player.chakra<4&&!player.shenju?.wushuang&&!player.sasukeXiayin){toast('奥义需要四格奥义点');return;}
    if(key==='space'&&!window.ArenaSubstitution.canEscape(player,engine.state.enemy)){toast('仅在敌方攻击实际造成伤害后的受击状态可使用替身');return;}
    if(key==='space'&&player.chakra<1){toast('替身需要一格奥义点');return;}
    if(key==='space'&&player.cooldowns.space>0){toast('替身尚未冷却');return;}
    engine.setInput(movementInput());engine.action(key);syncHUD();
  }
  function updateButtonHeld(key){engine?.setButtonHeld?.(key,held.has(key)||[...pointerKeys.values()].includes(key));}
  window.addEventListener('keydown',e=>{
    if(!$('keySettings').hidden){
      if(e.code==='Escape'){
        e.preventDefault();if(e.repeat)return;
        if(listeningFor){const action=listeningFor;listeningFor=null;drawKeySettings();$('keyStatus').textContent='已取消录入，按键未改变。';$('keyGrid').querySelector(`[data-bind="${action}"]`).focus();}
        else closeKeySettings();return;
      }
      if(listeningFor){
        e.preventDefault();if(e.repeat)return;
        if(e.ctrlKey||e.altKey||e.metaKey||!window.ArenaKeybindings.allowed(e.code)){$('keyStatus').textContent='请使用字母、数字、方向键或常用单键；Esc 用于取消。';return;}
        const action=listeningFor,result=keybindings.bind(action,e.code);
        if(!result.ok)return;
        clearControls();listeningFor=null;drawKeySettings();refreshKeyLabels();
        $('keyStatus').textContent=(result.swapped?`已与“${result.swapped}”交换按键。`:'按键已修改。')+(result.saved?'已自动保存到当前浏览器。':'当前浏览器无法保存，此设置仅在本次打开有效。');
        $('keyGrid').querySelector(`[data-bind="${action}"]`).focus();return;
      }
      if(e.code==='Tab'){
        const buttons=[...$('keySettings').querySelectorAll('button')],first=buttons[0],last=buttons[buttons.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
      return;
    }
    if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.target.isContentEditable||e.ctrlKey||e.altKey||e.metaKey)return;
    if(e.code==='Escape'){
      e.preventDefault();if(e.repeat)return;
      if(!$('modal').hidden){if(engine&&engine.state.status==='paused')resume();else $('modal').hidden=true;}else pauseGame();return;
    }
    if(!engine||engine.state.status!=='playing'||!$('modal').hidden)return;
    const k=keybindings.resolve(e.code);if(!k||k.startsWith('enemy_')&&engine.mode!=='training')return;
    e.preventDefault();pressedKeys.set(e.code,k);held.add(k);
    if(k.startsWith('enemy_')){practice.setHeld(k.slice(6),true);if(!e.repeat||k==='enemy_j')practice.act(k.slice(6));return;}
    updateButtonHeld(k);
    if(['j','u','i','o','space','l','h','q','e'].includes(k)&&(!e.repeat||k==='j'))act(k);
  });
  window.addEventListener('keyup',e=>{
    const k=pressedKeys.get(e.code);pressedKeys.delete(e.code);if(!k)return;
    if(![...pressedKeys.values()].includes(k))held.delete(k);
    if(k.startsWith('enemy_')){practice.setHeld(k.slice(6),held.has(k));return;}updateButtonHeld(k);
  });
  window.addEventListener('blur',()=>{clearControls();if(engine&&engine.state.status==='playing')pauseGame();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearControls();if(engine&&engine.state.status==='playing')pauseGame();}});
  document.querySelectorAll('[data-action]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{event.preventDefault();if(!engine||engine.state.status!=='playing'||!$('modal').hidden||!$('keySettings').hidden)return;pointerKeys.set(event.pointerId,button.dataset.action);updateButtonHeld(button.dataset.action);act(button.dataset.action);});
    button.addEventListener('click',event=>{if(event.detail===0)act(button.dataset.action);});
  });
  for(const key of ['u','i','o']){const button=document.querySelector(`[data-action="${key}"]`);
    button.addEventListener('pointerdown',event=>{const p=engine?.state.player;if(p?.sasukeXiayin||p?.xiayin&&key!=='o'||key==='i'&&p?.shenju)button.setPointerCapture(event.pointerId);});
    button.addEventListener('pointerup',event=>{const p=engine?.state.player;if(p?.sasukeXiayin){for(const next of ['j','o']){if(key===next)continue;const r=document.querySelector(`[data-action="${next}"]`).getBoundingClientRect();if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom){act(key+next);return;}}return;}if(key==='o'||!p?.xiayin&&!(key==='i'&&p?.shenju))return;const r=document.querySelector('[data-action="j"]').getBoundingClientRect();if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)act(p.xiayin?key+'j':'j');});
  }
  for(const event of ['pointerup','pointercancel'])window.addEventListener(event,e=>{const key=pointerKeys.get(e.pointerId);pointerKeys.delete(e.pointerId);if(key)updateButtonHeld(key);});
  for(const side of ['p','e']){const bar=document.createElement('div');bar.id=side+'Energy';bar.className='shenju-energy';bar.hidden=true;bar.innerHTML='<i></i><span></span>';$(side+'Chakra').after(bar);}
  const special=document.createElement('div');special.id='shenjuPanel';special.className='shenju-panel';special.hidden=true;
  special.innerHTML='<b id="shenjuMove"></b><div class="shenju-follow"><i id="shenjuFollow"></i></div><span id="shenjuHint"></span><div id="wushuangTrack" class="wushuang-track" hidden><i></i><b></b></div>';$('hud').append(special);
  const supply=document.createElement('button');supply.id='trainingSupply';supply.className='icon-button training-supply';supply.textContent='练习补给';supply.hidden=true;document.querySelector('.arena-actions').append(supply);
  supply.onclick=()=>{if(!engine||engine.mode!=='training')return;const p=engine.state.player;if(p.dead)return;p.chakra=p.maxChakra||4;if(p.shenju)p.shenju.energy=100;if(p.xiayin)p.xiayin.bellCooldown=0;if(p.obito)p.obito.qUsed=p.obito.eUsed=false;if(p.sasukeXiayin)p.sasukeXiayin.energy=2;Object.keys(p.cooldowns).forEach(k=>p.cooldowns[k]=0);syncHUD();toast('练习补给：能量、奥义点与冷却已恢复');$('arena').focus();};
  const scrollControl=document.createElement('label');scrollControl.className='xiayin-scroll-control';scrollControl.hidden=true;scrollControl.innerHTML='专属秘卷 <select id="xiayinScroll" aria-label="专属秘卷"><option value="gate">明神门</option><option value="forest">树界降临</option></select>';document.querySelector('.arena-actions').append(scrollControl);
  $('xiayinScroll').onchange=()=>{if(engine?.setXiayinScroll)engine.setXiayinScroll($('xiayinScroll').value);$('arena').focus();};
  function syncShenju(p){
    const s=p.shenju;special.hidden=!s||s.move?.fx==='finisher';supply.hidden=mode!=='training';$('hud').classList.toggle('is-shenju',!!s);$('hud').classList.toggle('is-wushuang',!!s?.wushuang);
    const basic=document.querySelector('[data-action="j"]');basic.querySelector('span').textContent=s?(s.wushuang?'斩':'戟'):'拳';basic.querySelector('b').textContent=s?(s.wushuang?'无双连斩':'长戟普攻'):'普通攻击';
    if(!s){document.querySelector('[data-action="u"]>span').textContent='忍';document.querySelector('[data-action="i"]>span').textContent='術';return;}
    const branch=s.followTime>0?s.follow:s.branchTime>0?s.branch:0;
    $('skillU').textContent=s.wushuang?'须佐终结':s.height>0?'飞戟 · 下戳':s.followTime>0?window.ShenjuRules.finishes[branch]:window.ShenjuRules.branches[branch];
    $('skillI').textContent=s.jumps===1?'二段跳':s.jumps===2?'空中落点':'跃空';$('skillO').textContent=s.wushuang?'无双终结':'天下无双';
    document.querySelector('[data-action="u"]>span').textContent=s.wushuang?'终':s.followTime>0?'续':branch?String(branch):'戟';
    document.querySelector('[data-action="i"]>span').textContent='跃';
    $('shenjuMove').textContent=s.wushuang?'天下无双 · 九段连斩':s.move?.name||'神驹佑将 · 长戟八式';
    $('shenjuHint').textContent=s.wushuang?'J 斩击回能 · U / O 须佐终结':s.height>0?'摇杆控制落点 · J 空中普攻 · U 下戳':s.followTime>0?`再按 U → ${window.ShenjuRules.finishes[s.follow]}`:s.branchTime>0?`${s.branch}A 派生 · U → ${window.ShenjuRules.branches[s.branch]}`:'J 第 1—4 段接 U · 黄条内再按 U · I 跳跃取消';
    $('shenjuFollow').style.width=(s.followTime>0?Math.min(1,s.followTime/2.5)*100:s.branchTime>0?s.branchTime/2.1*100:0)+'%';
    $('wushuangTrack').hidden=!s.wushuang;$('wushuangTrack').querySelector('i').style.width=s.wushuang/s.wushuangMax*100+'%';$('wushuangTrack').querySelector('b').textContent=`无双 ${s.wushuang.toFixed(1)} 秒`;
  }
  function syncXiayin(p){
    const s=p.xiayin;$('hud').classList.toggle('is-xiayin',!!s);scrollControl.hidden=!s;if(!s)return;
    const target=engine.state.enemy,hasBell=!!s.bell&&target.captured?.bellId===s.bell.id;
    special.hidden=s.move?.fx==='ultimate';$('wushuangTrack').hidden=true;
    $('xiayinScroll').value=s.scroll;$('pEnergy').hidden=false;$('pEnergy').querySelector('i').style.width=(1-s.bellCooldown/7)*100+'%';$('pEnergy').querySelector('span').textContent=s.bellCooldown>0?`实钟间隔 ${s.bellCooldown.toFixed(1)} 秒 · 4A 生成虚影`:'4A 实钟就绪';
    $('skillU').textContent=s.recast>0?(s.counter?'索敌落钟':'落钟'):hasBell?'钟上感化':s.height>0?'空中跳抓':'金钟法相';
    $('skillI').textContent=hasBell?'双龙盘钟':s.height>0?'木龙俯冲':'木龙之术';$('skillO').textContent='六龙 · 苍天大树';
    document.querySelector('[data-action="u"]>span').textContent=s.recast>0?'钟':'御';document.querySelector('[data-action="i"]>span').textContent='龙';
    const attack=document.querySelector('[data-action="j"]');attack.querySelector('span').textContent=hasBell?'踢':'掌';attack.querySelector('b').textContent=hasBell?'飞踢送钟':s.height>0?'空中普攻':'木遁普攻';
    const scroll=document.querySelector('[data-action="l"]');scroll.querySelector('b').textContent=s.scroll==='forest'?'树界降临':'明神门';
    $('shenjuMove').textContent=s.move?.name||'侠隐江湖 · 金钟木龙';
    $('shenjuHint').textContent=hasBell?'J 飞踢送钟 · I 双龙 · U 钟上感化':s.guard>0?'长按 U 格挡 · 再按 U 落钟 · U 接 J 跳抓':s.recast>0?(s.counter?'格挡成功 · U 全场索敌落钟':'黄条内 U 再按落钟'):s.height>0?'空中 J 连击 · U 跳抓 · I 俯冲':'U 格挡 / U→J 跳抓 · I→J 乘龙 · 4A 后上+J 空中普攻';
    $('shenjuFollow').style.width=(s.recast>0?s.recast/2.6*100:hasBell?s.bell.time/s.bell.maxTime*100:0)+'%';
  }
  function syncObito(p){
    const s=p.obito;$('hud').classList.toggle('is-obito',!!s);$('hud').classList.toggle('obito-perfect',!!s?.perfect);$('obitoSubs').hidden=!s;
    document.querySelector('.bottom-hint').textContent=s?'WASD 移动 · J 普攻 / 吸入 · U 木遁→火遁 · I 神威 · Q / E 子技能 · O 十尾':'WASD 移动 · J 连续普攻 · U / I 忍术 · O 奥义 · 空格替身';
    if(!s)return;
    const combo=s.comboReady>0&&s.perfect>0;special.hidden=['jubi','dimensionPalm','dimensionFire'].includes(s.move?.fx);$('wushuangTrack').hidden=true;
    $('skillU').textContent=combo?'神威 · 爆风乱舞':s.woodWindow>0?'火遁·爆风乱舞':'木遁·扦插之术';$('skillI').textContent='神威';$('skillO').textContent=combo?'神威 · 魔像巨掌':'通灵术·十尾';
    document.querySelector('[data-action="u"]>span').textContent=combo?'焰':s.woodWindow>0?'火':'木';document.querySelector('[data-action="i"]>span').textContent='威';
    const attack=document.querySelector('[data-action="j"]');attack.querySelector('span').textContent=s.pocket?'出':s.subHit>0?'吸':'拳';attack.querySelector('b').textContent=s.pocket?'提前扔出':s.subHit>0?'吸入时空间':'六段普攻';
    $('shenjuMove').textContent=s.move?.name||'忍界大战 · 神威';
    $('shenjuHint').textContent=combo?'紫光命中 · U 空间火遁 / O 魔像巨掌':s.pocket?'J 提前扔出 · U 扔出并木遁追击':s.subHit>0?'子技能命中 · J 吸入时空间':s.unlock>0?'Q 突进 / E 坠落 · 短按攻击，长按虚化':s.woodWindow>0?'U 再次释放火遁，引燃扦插木刺':'I 可取消普攻、忍术 · 完美闪避解锁紫光组合';
    $('shenjuFollow').style.width=Math.min(100,(combo?s.comboReady/2.6:s.unlock>0?s.unlock/5:s.woodWindow/3.2)*100)+'%';
    if(s.unlock>0){$('pEnergy').hidden=false;$('pEnergy').querySelector('i').style.width=s.unlock/5*100+'%';$('pEnergy').querySelector('span').textContent=`神威子技能 ${s.unlock.toFixed(1)} 秒${s.perfect>0?' · 紫光':''}`;}
  }
  function syncSasuke(p){
    const s=p.sasukeXiayin;$('hud').classList.toggle('is-sasuke-xiayin',!!s);$('hud').classList.toggle('is-sasuke-enhanced',!!s?.enhanced);
    document.querySelector('[data-action="o"]>span').textContent=s?'御':'奥';if(!s)return;
    special.hidden=!!s.move?.fx?.startsWith('ult');
    $('skillU').textContent=s.pending?.key==='u'?'J 追剑 / O 架势':'炎剑 · 须佐斩';$('skillI').textContent=s.pending?.key==='i'?'J 雷刺 / O 飞鸟':'雷剑 · 千鸟锐枪';$('skillO').textContent=s.follow==='fireGuard'?'长按 · 劫火':s.follow==='rise'||s.follow==='senbon'?'长按 · 雷麟':'短按格挡 / 长按奥义';
    document.querySelector('[data-action="u"]>span').textContent='炎';document.querySelector('[data-action="i"]>span').textContent='雷';const attack=document.querySelector('[data-action="j"]');attack.querySelector('span').textContent='剑';attack.querySelector('b').textContent=s.enhanced>0?'强化七段普攻':'双剑五段普攻';
    $('shenjuMove').textContent=s.move?.name||'侠隐江湖 · 雷火双剑';
    $('shenjuHint').textContent=s.follow==='fireGuard'?(s.guardSuccess?'格挡成功 · J 连斩 · 四点 O 劫火':'J 剑气 · 四点长按 O 劫火'):s.follow==='rise'?'J 千鸟千本 · 四点长按 O 雷麟':s.follow==='senbon'?'四点 O 雷麟碎空闪':s.follow==='fireSword'?'天照前再按 J · 瞬身追剑':s.follow==='thunderSword'?'命中后 J 雷影连斩':s.follow==='pulse'?'J 一点强化双剑 · 四点长按 O 踏日裁岳':s.enhanced>0?'强化普攻各段摇杆跨 Y · 四点长按 O 奥义':'U / I 快接 J 或 O · O→J 强化 · 四点长按 O 奥义';
    $('shenjuFollow').style.width=Math.min(100,(s.pending?s.pending.time/.22:s.followTime/1.6)*100)+'%';
    $('wushuangTrack').hidden=s.enhanced<=0;$('wushuangTrack').querySelector('i').style.width=s.enhanced/14*100+'%';$('wushuangTrack').querySelector('b').textContent='双剑强化 '+s.enhanced.toFixed(1)+' 秒';
    document.querySelector('.bottom-hint').textContent='WASD 移动 · U 炎剑 / I 雷剑，快接 J 或 O 派生 · 短按 O 格挡 · 长按 O 奥义';
  }
  function updateStick(e){
    const rect=joystick.getBoundingClientRect(),radius=rect.width*.35;
    if(radius<=0)return;
    const dx=(e.clientX-rect.left-rect.width/2)/radius,dy=(e.clientY-rect.top-rect.height/2)/radius;
    const distance=Math.hypot(dx,dy),normalizer=Math.max(1,distance);
    stick.x=distance<.12?0:dx/normalizer;stick.y=distance<.12?0:dy/normalizer;
    const center=joystick.querySelector('.stick-center');center.style.transform=`translate(${stick.x*24}px,${stick.y*24}px)`;
    if(engine&&engine.state.status==='playing')engine.setInput(movementInput());
  }
  joystick.addEventListener('pointerdown',e=>{
    if(stick.pointerId!==null||!engine||engine.state.status!=='playing'||!$('modal').hidden)return;
    e.preventDefault();stick.pointerId=e.pointerId;joystick.setPointerCapture(e.pointerId);updateStick(e);
  });
  joystick.addEventListener('pointermove',e=>{if(e.pointerId===stick.pointerId){e.preventDefault();updateStick(e);}});
  function releaseStick(e){if(e.pointerId!==stick.pointerId)return;stick.pointerId=null;stick.x=stick.y=0;joystick.querySelector('.stick-center').style.transform='translate(0px,0px)';if(engine)engine.setInput(movementInput());}
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>joystick.addEventListener(event,releaseStick));
  function syncHUD(){if(!engine)return;const s=engine.state,p=s.player,e=s.enemy;if(!p||!e)return;const ids=p.id+'|'+e.id;if(ids!==portraitIds){portraitIds=ids;$('pPortrait').innerHTML=portrait(p.profile);$('ePortrait').innerHTML=portrait(e.profile);bindFallbacks($('pPortrait'));bindFallbacks($('ePortrait'));$('pName').textContent=p.profile.name;$('eName').textContent=e.profile.name;$('skillU').textContent=p.profile.skills[0].name;$('skillI').textContent=p.profile.skills[1].name;$('skillO').textContent=p.profile.ultimate.name;}
    $('pHealth').style.width=Math.max(0,p.hp/p.maxHP*100)+'%';$('eHealth').style.width=Math.max(0,e.hp/e.maxHP*100)+'%';$('pHPValue').textContent=`${Math.ceil(p.hp)} / ${p.maxHP}`;$('eHPValue').textContent=`${Math.ceil(e.hp)} / ${e.maxHP}`;$('timer').textContent=Math.max(0,Math.ceil(s.time));$('round').textContent=mode==='training'?'自由练习':`${s.indices.player+1} / 3  ·  ${s.indices.enemy+1} / 3`;
    [['p',p],['e',e]].forEach(([side,fighter])=>{
      $(side+'Chakra').innerHTML=Array.from({length:fighter.maxChakra||4},(_,index)=>`<i class="${fighter.chakra>=index+1?'full':''}"></i>`).join('');
      const energy=$(side+'Energy');energy.hidden=!fighter.shenju&&!fighter.sasukeXiayin;energy.classList.toggle('sasuke-energy',!!fighter.sasukeXiayin);if(fighter.sasukeXiayin){energy.querySelector('i').style.width=fighter.sasukeXiayin.energy/2*100+'%';energy.querySelector('span').textContent='剑意 '+fighter.sasukeXiayin.energy.toFixed(1)+' / 2';}if(fighter.shenju){energy.querySelector('i').style.width=fighter.shenju.energy+'%';energy.querySelector('span').textContent=`能量 ${Math.floor(fighter.shenju.energy)} / 100`;}
      const teamSide=side==='p'?'player':'enemy';
      $(side+'Team').innerHTML=s.teams[teamSide].map((member,index)=>`<span class="${member.dead?'dead':index===s.indices[teamSide]?'current':''}">${esc(member.profile.name)}</span>`).join('');
      const notes=[],level=fighter.protectionLevel||'none';
      if(level==='yellow')notes.push('黄保');else if(level==='red')notes.push('红保');
      if(fighter.shenju?.wushuang)notes.push('无双');
      if(fighter.shenju?.height>0)notes.push(fighter.shenju.jumps===2?'二段跳':'跃空');
      if(fighter.xiayin?.height>0)notes.push('空中');
      if(fighter.xiayin?.guard>0)notes.push('金钟格挡');
      if(fighter.captured)notes.push('钟禁锢');
      if(fighter.slowed)notes.push('减速');
      if(fighter.obito?.phase>0)notes.push('虚化');
      if(fighter.obito?.perfect>0)notes.push('紫光');
      if(fighter.inKamui)notes.push('神威空间');
      if(fighter.obRoot)notes.push('扦插');if(fighter.sxGrab)notes.push('擒拿');if(fighter.sxBurn)notes.push('灼烧');if(fighter.sasukeXiayin?.enhanced>0)notes.push('双剑强化');if(fighter.sasukeXiayin?.guard>0)notes.push('须佐格挡');
      if(fighter.armorTime>0)notes.push(fighter.armorKind==='adamant'?'金刚体':'硬体');
      if(fighter.invuln>0&&['substitute','getup'].includes(fighter.invulnKind))notes.push(fighter.invulnKind==='substitute'?'替身无敌':'起身无敌');
      $(side+'State').textContent=[side==='p'?'玩家':'电脑',...notes].join(' · ');
      $(side+'Portrait').classList.toggle('protection-yellow',level==='yellow');
      $(side+'Portrait').classList.toggle('protection-red',level==='red');
    });
    syncShenju(p);syncXiayin(p);syncObito(p);syncSasuke(p);$('shenjuHint').textContent=keyHints($('shenjuHint').textContent);document.querySelector('.bottom-hint').textContent=keyHints(document.querySelector('.bottom-hint').textContent);if(!p.xiayin)document.querySelector('[data-action="l"] b').textContent='秘卷';
    const locked=controlLabel(p);$('hud').classList.toggle('control-locked',!!locked);$('airborneStatus').hidden=!locked;
    $('airborneStatus').textContent=p.dead?'忍者退场 · 下一位即将登场':`${locked}中 · ${window.ArenaSubstitution.canEscape(p,s.enemy)?'可使用替身':'当前无法替身'}`;
    document.querySelectorAll('[data-action]').forEach(button=>{
      const key=button.dataset.action,cover=button.querySelector('.cd');if(!cover)return;
      const cooldown=p.cooldowns[key]||0;let text='';
      if(locked&&(key!=='space'||p.dead))text=locked;
      else if(cooldown>0&&!(p.xiayin&&key==='u'&&p.xiayin.recast>0)&&!(p.obito&&key==='u'&&(p.obito.woodWindow>0||p.obito.comboReady>0&&p.obito.perfect>0)))text=String(Math.ceil(cooldown));
      else if(p.obito&&['q','e'].includes(key)&&p.obito.unlock<=0)text='先神威';
      else if(p.obito&&['q','e'].includes(key)&&p.obito[key+'Used'])text='已用';
      else if(p.shenju?.wushuang&&key==='i')text='无双';
      else if(p.shenju&&key==='i'&&p.shenju.jumps>=2)text='二段';
      else if(p.shenju&&['u','i'].includes(key)&&!p.shenju.wushuang&&p.shenju.energy<(key==='i'?(p.shenju.jumps?16:18):(p.shenju.followTime>0?15:20)))text='能量';
      else if(p.sasukeXiayin&&['u','i'].includes(key)&&p.sasukeXiayin.energy<1&&!p.sasukeXiayin.pending)text='能量';
      else if(key==='o'&&p.chakra<4&&!p.shenju?.wushuang&&!p.sasukeXiayin)text=`${Math.floor(p.chakra)}/4`;
      else if(key==='space'&&p.chakra<1)text='1格';
      else if(key==='space'&&!window.ArenaSubstitution.canEscape(p,s.enemy))text='受击可用';
      cover.hidden=!text;cover.textContent=text;button.classList.toggle('not-ready',!!text);
    });
    practice?.sync();
    const combo=typeof s.combo==='number'?s.combo:s.combo?.count||0;$('combo').hidden=combo<2;if(combo>=2)$('combo').querySelector('strong').textContent=combo;
    if(s.status==='ended')showResult();
  }
  function tick(now){const dt=Math.min(.033,(now-last)/1000);last=now;drawTime+=dt;if(engine){const input=movementInput();engine.setInput(input);engine.update(dt);renderer.render(engine.state,dt);const center=joystick.querySelector('.stick-center');center.style.transform=`translate(${input.x*24}px,${input.y*24}px)`;if(now-lastHUD>70){syncHUD();lastHUD=now;}}else renderer.render({elapsed:drawTime,status:'idle',entities:[],effects:[],player:null,enemy:null},dt);requestAnimationFrame(tick);}
  practice=new window.ArenaPracticeControls({engine:()=>engine,roster,locked:id=>locked(id),key:keyLabel,blocked:()=>!$('modal').hidden||!$('keySettings').hidden,changed:()=>{portraitIds='';clearControls();syncHUD();},toast});
  drawRoster();drawSquad();refreshKeyLabels();requestAnimationFrame(tick);
})();
