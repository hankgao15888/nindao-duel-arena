/* Offline UI and controls. No network requests are required to play. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const roster = window.NINJAS || [];
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if (!roster.length || !window.ArenaEngine || !window.ArenaRenderer) { $('selection').innerHTML='<p style="padding:50px">游戏文件未完整加载。请保持整个“忍道决斗场”文件夹完整，然后双击桌面的“火影忍者决斗场.html”。</p>'; return; }
  const renderer = new window.ArenaRenderer($('arena'));
  let team = roster.slice(0,3).map(n=>n.id), slot=0, viewed=team[0], rank='all', mode='duel', engine=null, pausedForModal=false;
  let last=performance.now(), drawTime=0, lastHUD=0, portraitIds='', toastTimer, audio=null, sound=false, won=false;
  const held = new Set(), byId=id=>roster.find(n=>n.id===id)||roster[0];
  const joystick=$('joystick'),stick={x:0,y:0,pointerId:null};
  function movementInput(){
    const keyboardX=(held.has('d')||held.has('arrowright')?1:0)-(held.has('a')||held.has('arrowleft')?1:0);
    const keyboardY=(held.has('s')||held.has('arrowdown')?1:0)-(held.has('w')||held.has('arrowup')?1:0);
    return {x:Math.max(-1,Math.min(1,keyboardX+stick.x)),y:Math.max(-1,Math.min(1,keyboardY+stick.y))};
  }
  function clearControls(){
    held.clear();stick.x=stick.y=0;
    const pointerId=stick.pointerId;stick.pointerId=null;
    if(pointerId!==null&&joystick.hasPointerCapture(pointerId))joystick.releasePointerCapture(pointerId);
    if(engine){engine.setInput({x:0,y:0});if(engine.setButtonHeld)for(const k of ['j','u','i','q','e'])engine.setButtonHeld(k,false);}
    joystick.querySelector('.stick-center').style.transform='translate(0px,0px)';
  }
  try { const saved=JSON.parse(localStorage.getItem('naruto-duel-team')||'null'); if (Array.isArray(saved)&&saved.length===3&&saved.every(id=>roster.some(n=>n.id===id))&&new Set(saved).size===3) team=saved; viewed=team[0]; } catch {}
  const portrait = (n,cls='') => n.portrait ? `<img class="${cls}" src="${esc(n.portrait)}" alt="${esc(n.name)}" ${n.portraitPosition?`style="object-position:${esc(n.portraitPosition)}"`:''} loading="eager">` : typeof renderer.portraitSVG==='function' ? renderer.portraitSVG(n) : `<span style="font-size:42px;color:${esc(n.color||'#f0bf70')}">${esc(n.name.slice(0,1))}</span>`;
  const fullName=n=>n.name+(n.variant?`「${n.variant}」`:'');
  function bindFallbacks(root) { root.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{ const n=roster.find(n=>img.getAttribute('src')===n.portrait); if(n&&typeof renderer.portraitSVG==='function') img.outerHTML=renderer.portraitSVG(n); else img.style.opacity='.15'; },{once:true})); }
  function drawRoster() {
    const q=$('search').value.trim().toLowerCase();
    const list=roster.filter(n=>(rank==='all'||(rank==='B'?['B','C'].includes(n.rank):n.rank===rank))&&fullName(n).toLowerCase().includes(q));
    $('roster').innerHTML=list.length?list.map(n=>`<button class="ninja-card ${team.includes(n.id)?'selected':''} ${viewed===n.id?'viewing':''}" data-id="${esc(n.id)}" aria-label="选择${esc(fullName(n))}"><div class="card-art">${portrait(n)}<span class="card-rank">${esc(n.rank||'A')}</span>${team.includes(n.id)?`<span class="squad-number">${team.indexOf(n.id)+1}</span>`:''}</div><div class="card-caption"><b>${esc(n.name)}</b><small>${esc(n.variant||'常规形态')}</small></div></button>`).join(''):'<div class="empty-roster">没有找到符合条件的忍者</div>';
    $('rosterCount').textContent=`${list.length} / ${roster.length} 位忍者`;
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
    $('heroSkills').innerHTML=[...n.skills.map((s,i)=>({...s,key:i?'I':'U'})),{...n.ultimate,key:'O'}].map(s=>`<div class="hero-skill"><span>${s.key}</span><div><b>${esc(s.name)}</b><p>${esc(s.description||'按对应按键施放忍术。')}</p></div></div>`).join('');
  }
  function save(){try{localStorage.setItem('naruto-duel-team',JSON.stringify(team));}catch{}}
  function pick(id){const existing=team.indexOf(id);if(existing!==-1&&existing!==slot){[team[slot],team[existing]]=[team[existing],team[slot]];}else team[slot]=id;viewed=id;slot=(slot+1)%3;save();drawRoster();drawSquad();drawDetail();tone(350,.04);}
  $('search').addEventListener('input',drawRoster);
  document.querySelectorAll('[data-rank]').forEach(b=>b.addEventListener('click',()=>{rank=b.dataset.rank;document.querySelectorAll('[data-rank]').forEach(x=>x.classList.toggle('active',x===b));drawRoster();}));
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));$('start').innerHTML=mode==='training'?'进入练习 <span>▶</span>':'开始决斗 <span>▶</span>';}));
  $('random').addEventListener('click',()=>{team=[...roster].sort(()=>Math.random()-.5).slice(0,3).map(n=>n.id);viewed=team[0];slot=0;save();drawRoster();drawSquad();drawDetail();});
  function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,1800);}
  function tone(freq,duration=.06,type='sine',gain=.04){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.45),audio.currentTime+duration);g.gain.setValueAtTime(gain,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
  function onEvent(e){if(e.type==='hit')tone(130,.065,'triangle',.055);if(e.type==='cast')tone(500,.14,'sawtooth',.025);if(e.type==='ko')tone(90,.4,'triangle',.08);if(e.type==='end')setTimeout(showResult,400);}
  function begin(){clearControls();won=false;const enemies=[...roster].sort(()=>Math.random()-.5).slice(0,3).map(n=>n.id);engine=new window.ArenaEngine({roster,team:[...team],enemy:enemies,difficulty:$('difficulty').value,mode,onEvent});engine.start();portraitIds='';$('selection').hidden=true;$('modal').hidden=true;$('hud').hidden=false;$('trainingTip').hidden=mode!=='training';$('arena').focus();syncHUD();tone(700,.22);}
  $('start').addEventListener('click',begin);
  function showSelection(){clearControls();engine=null;$('hud').hidden=true;$('modal').hidden=true;$('selection').hidden=false;drawRoster();drawSquad();drawDetail();}
  function modal(label,title,body,buttons){$('modalLabel').textContent=label;$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modalActions').innerHTML='';buttons.forEach(([text,fn,primary])=>{const b=document.createElement('button');b.className=primary?'gold-button':'icon-button';b.textContent=text;b.onclick=fn;$('modalActions').append(b);});$('modal').hidden=false;}
  function resume(){if(engine&&engine.state.status==='paused')engine.pause(false);clearControls();$('modal').hidden=true;$('arena').focus();}
  function pauseGame(){if(!engine||engine.state.status==='ended')return;if(engine.state.status==='paused'){resume();return;}engine.pause(true);clearControls();modal('MATCH PAUSED','对战暂停','喘口气，下一次出手更加从容。',[['继续对战',resume,true],['重新选人',showSelection,false]]);}
  $('pause').onclick=pauseGame;
  $('reselect').onclick=()=>{if(engine&&engine.state.status==='playing')engine.pause(true);clearControls();modal('CHANGE SQUAD','重新选择忍者','本场对战将结束，返回出战阵容。',[['返回选人',showSelection,true],['继续对战',resume,false]]);};
  function showResult(){if(!engine||engine.state.status!=='ended'||won)return;won=true;const s=engine.state;const r=s.result;const winner=typeof r==='string'?r:r?.winner;const victory=winner==='player';modal('DUEL COMPLETE',victory?'决斗胜利':winner==='draw'?'势均力敌':'再接再厉',`<p>${victory?'忍道，由你来证明。':'调整技能距离与替身时机，再战一场。'}</p><p>出战阵容：${team.map(id=>esc(byId(id).name)).join(' · ')}</p>`,[['再次对战',begin,true],['更换阵容',showSelection,false]]);tone(victory?660:180,.5,'triangle',.06);}
  const helpBody=`<div class="help-grid"><div><b>摇杆 / WASD / 方向键</b>移动</div><div><b>J</b>普通攻击，连按衔接</div><div><b>U / I</b>技能一 / 技能二</div><div><b>O</b>奥义，消耗四格奥义点</div><div><b>空格</b>替身，消耗一格奥义点</div><div><b>L</b>秘卷</div><div><b>H</b>通灵</div><div><b>Esc</b>暂停 / 继续</div></div>
    <p>双方每位忍者的生命值为 3000。普攻区分平推和击飞；受击、浮空、倒地及起身期间只能在冷却和奥义点允许时使用替身。</p>
    <p>普通技能施放期间的硬体可抵抗普攻打断。奥义、秘卷与通灵的施放保护可抵抗控制，但仍会受到伤害；替身和起身无敌才会阻止伤害。</p>
    <p>U / I 技能成功命中后，每次施放最多获得一格奥义点；打空、普攻、秘卷、通灵和奥义不额外加点。四格可释放奥义，替身消耗一格。</p>
    <p>浮空受击会累计保护，黄保和红保会加快下落并减少普通伤害；奥义无视该减伤。自然落地后进入倒地、起身和短暂无敌，再恢复交战。</p>
    <p><b>神驹佑将专属：</b>J 四段普攻后接 U，分别为陷阵→灭神斩、狂风→火焰戟、连环→神烈驹、乱舞→神鬼，黄条内再按 U 出二段。I 可取消攻击并跳跃，再按 I 二段跳；摇杆调整空中落点。空中 J 挥戟，二段跳 J 砸地，空中 U 下戳；I 快接 J 或从二技能滑向普攻为上撩。</p>
    <p>神驹斑最多六格奥义点，U / I 使用能量条。O 消耗四格进入无双；J 九段连斩，U 蓝色键或 O 消耗剩余点数与能量发动须佐终结。无双期间仅命中回能，斩击时有霸体。练习模式可点“练习补给”体验完整招式。</p>
    <p><b>侠隐江湖专属：</b>U 金钟格挡，可长按；黄条内再次 U 落钟，成功格挡后落钟索敌。U 快接 J 为跳抓，I 快接 J 为乘龙俯冲，也可从技能按钮滑向普攻。4A 后上方向加 J 进入空中连击。钟禁锢敌人时，J 飞踢送钟，I 双龙盘钟，U 钟上感化（技能需冷却就绪）。左下角可选择明神门或树界降临。</p>
    <p><b>忍战带土专属：</b>U 扦插固定，再按 U 爆风乱舞，引燃木刺追加爆炸。I 神威可取消普攻或忍术，并解锁 Q 突进、E 坠落；短按攻击，长按只虚化移动。子技能命中后 J 吸入时空间，再按 J 提前扔出，或用 U 扔出接木遁。神威瞬间闪避攻击会触发紫光，紫光子技能命中后可接 U 空间火遁、O 魔像巨掌。普通 O 为十尾奥义。</p>
    <p>三人依次出战，击倒对方全队获胜。练习模式的对手不主动攻击。当前为原版规则的参考实现，精确帧数和数值仍有简化。</p>`;
  $('help').onclick=()=>{pausedForModal=!!engine&&engine.state.status==='playing';if(pausedForModal)engine.pause(true);clearControls();modal('HOW TO PLAY','操作说明',helpBody,[['知道了',()=>{if(pausedForModal)resume();else $('modal').hidden=true;},true]]);};
  $('reference').onclick=()=>{const n=byId(viewed);modal('CHARACTER REFERENCE',n.name,`<div class="reference-notes"><strong>${esc(fullName(n))}</strong><p>技能名称与主要表现参考用户提供的角色攻略。本作使用自行编写的动画与战斗逻辑。</p><p>冷却、伤害、移动距离和浮空数值为本地游戏调校，不能作为原版数据使用。</p>${n.notes?`<p>${esc(n.notes)}</p>`:''}<a href="${esc(n.source)}" target="_blank" rel="noopener">打开该角色的参考文章 ↗</a></div>`,[['返回选人',()=>$('modal').hidden=true,true]]);};
  $('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'音效：开':'音效：关';if(sound)tone(660,.12);};
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{toast('当前浏览器不支持全屏，可按 F11。');}};
  function controlLabel(fighter){
    if(fighter.dead)return '退场';
    if(fighter.inKamui)return '神威空间';
    if(fighter.obRoot)return '扦插固定';
    if(fighter.captured)return '禁锢';
    if(fighter.knockdown>0)return '倒地';
    if(fighter.recovery>0)return '起身';
    if(fighter.air>0||fighter._airV>0)return '浮空';
    return fighter.stun>0?'受击':'';
  }
  function act(key){
    if(!engine||engine.state.status!=='playing'||!$('modal').hidden)return;
    const player=engine.state.player;if(!player||player.dead)return;
    const locked=controlLabel(player);
    if(locked&&key!=='space'){toast(`${locked}中，仅可使用替身`);return;}
    if(key==='o'&&player.chakra<4&&!player.shenju?.wushuang){toast('奥义需要四格奥义点');return;}
    if(key==='space'&&player.chakra<1){toast('替身需要一格奥义点');return;}
    if(key==='space'&&player.cooldowns.space>0){toast('替身尚未冷却');return;}
    engine.setInput(movementInput());engine.action(key);syncHUD();
  }
  function keyName(e){return e.code==='Space'?'space':e.key.toLowerCase();}
  window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const k=keyName(e);if(['space','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k==='escape'){if(!$('modal').hidden){if(engine&&engine.state.status==='paused')resume();else $('modal').hidden=true;}else pauseGame();return;}held.add(k);if(engine?.setButtonHeld)engine.setButtonHeld(k,true);if(['j','u','i','o','space','l','h','q','e'].includes(k)&&(!e.repeat||k==='j'))act(k);});
  window.addEventListener('keyup',e=>{const k=keyName(e);held.delete(k);if(engine?.setButtonHeld)engine.setButtonHeld(k,false);});
  window.addEventListener('blur',()=>{clearControls();if(engine&&engine.state.status==='playing')pauseGame();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearControls();if(engine&&engine.state.status==='playing')pauseGame();}});
  document.querySelectorAll('[data-action]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{event.preventDefault();if(engine?.setButtonHeld)engine.setButtonHeld(button.dataset.action,true);act(button.dataset.action);});
    button.addEventListener('click',event=>{if(event.detail===0)act(button.dataset.action);});
  });
  for(const key of ['u','i']){const button=document.querySelector(`[data-action="${key}"]`);
    button.addEventListener('pointerdown',event=>{const p=engine?.state.player;if(p?.xiayin||key==='i'&&p?.shenju)button.setPointerCapture(event.pointerId);});
    button.addEventListener('pointerup',event=>{const p=engine?.state.player;if(!p?.xiayin&&!(key==='i'&&p?.shenju))return;const r=document.querySelector('[data-action="j"]').getBoundingClientRect();if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)act(p.xiayin?key+'j':'j');});
  }
  for(const event of ['pointerup','pointercancel'])window.addEventListener(event,()=>{if(engine?.setButtonHeld)for(const k of ['j','u','i','q','e'])engine.setButtonHeld(k,false);});
  for(const side of ['p','e']){const bar=document.createElement('div');bar.id=side+'Energy';bar.className='shenju-energy';bar.hidden=true;bar.innerHTML='<i></i><span></span>';$(side+'Chakra').after(bar);}
  const special=document.createElement('div');special.id='shenjuPanel';special.className='shenju-panel';special.hidden=true;
  special.innerHTML='<b id="shenjuMove"></b><div class="shenju-follow"><i id="shenjuFollow"></i></div><span id="shenjuHint"></span><div id="wushuangTrack" class="wushuang-track" hidden><i></i><b></b></div>';$('hud').append(special);
  const supply=document.createElement('button');supply.id='trainingSupply';supply.className='icon-button training-supply';supply.textContent='练习补给';supply.hidden=true;$('hud').append(supply);
  supply.onclick=()=>{if(!engine||engine.mode!=='training')return;const p=engine.state.player;if(p.dead)return;p.chakra=p.maxChakra||4;if(p.shenju)p.shenju.energy=100;if(p.xiayin)p.xiayin.bellCooldown=0;if(p.obito)p.obito.qUsed=p.obito.eUsed=false;Object.keys(p.cooldowns).forEach(k=>p.cooldowns[k]=0);syncHUD();toast('练习补给：能量、奥义点与冷却已恢复');$('arena').focus();};
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
      const energy=$(side+'Energy');energy.hidden=!fighter.shenju;if(fighter.shenju){energy.querySelector('i').style.width=fighter.shenju.energy+'%';energy.querySelector('span').textContent=`能量 ${Math.floor(fighter.shenju.energy)} / 100`;}
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
      if(fighter.obRoot)notes.push('扦插');
      if(fighter.armorTime>0)notes.push(fighter.armorKind==='adamant'?'金刚体':'硬体');
      if(fighter.invuln>0&&['substitute','getup'].includes(fighter.invulnKind))notes.push(fighter.invulnKind==='substitute'?'替身无敌':'起身无敌');
      $(side+'State').textContent=[side==='p'?'玩家':'电脑',...notes].join(' · ');
      $(side+'Portrait').classList.toggle('protection-yellow',level==='yellow');
      $(side+'Portrait').classList.toggle('protection-red',level==='red');
    });
    syncShenju(p);syncXiayin(p);syncObito(p);if(!p.xiayin)document.querySelector('[data-action="l"] b').textContent='秘卷';
    const locked=controlLabel(p);$('hud').classList.toggle('control-locked',!!locked);$('airborneStatus').hidden=!locked;
    $('airborneStatus').textContent=p.dead?'忍者退场 · 下一位即将登场':`${locked}中 · 仅可使用替身`;
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
      else if(key==='o'&&p.chakra<4&&!p.shenju?.wushuang)text=`${Math.floor(p.chakra)}/4`;
      else if(key==='space'&&p.chakra<1)text='1格';
      cover.hidden=!text;cover.textContent=text;button.classList.toggle('not-ready',!!text);
    });
    const combo=typeof s.combo==='number'?s.combo:s.combo?.count||0;$('combo').hidden=combo<2;if(combo>=2)$('combo').querySelector('strong').textContent=combo;
    if(s.status==='ended')showResult();
  }
  function tick(now){const dt=Math.min(.033,(now-last)/1000);last=now;drawTime+=dt;if(engine){const input=movementInput();engine.setInput(input);engine.update(dt);renderer.render(engine.state,dt);const center=joystick.querySelector('.stick-center');center.style.transform=`translate(${input.x*24}px,${input.y*24}px)`;if(now-lastHUD>70){syncHUD();lastHUD=now;}}else renderer.render({elapsed:drawTime,status:'idle',entities:[],effects:[],player:null,enemy:null},dt);requestAnimationFrame(tick);}
  drawRoster();drawSquad();drawDetail();requestAnimationFrame(tick);
})();
