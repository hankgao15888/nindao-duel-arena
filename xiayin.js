/* 侠隐柱间：专属金钟、木龙、地空连击。精确数值为离线调校。 */
(function(global){
  'use strict';
  const Base=global.ArenaEngine,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),isXY=f=>f?.id==='hashirama-xiayin',other=s=>s==='player'?'enemy':'player';
  let id=10000;
  const fresh=()=>({move:null,events:[],queued:false,guard:0,recast:0,counter:false,slide:'',slideTime:0,
    bell:null,bellCooldown:0,airReady:0,height:0,vy:0,airCombo:0,basicRelease:false,
    inputHold:0,inputSign:0,aim:{x:0,y:0},scroll:'gate',blocked:0});
  class XiayinEngine extends Base{
    _fighter(profile,side,index){const f=super._fighter(profile,side,index);if(isXY(f))f.xiayin=fresh();return f;}
    setButtonHeld(key,value){this._xyButtons=this._xyButtons||{};this._xyButtons[key]=!!value;
      const f=this.state.player;if(isXY(f)&&key==='j'&&!value&&f.attackIndex===2)f.xiayin.basicRelease=true;
    }
    setXiayinScroll(value){const f=this.state.player;if(isXY(f))f.xiayin.scroll=value==='forest'?'forest':'gate';}
    action(key){if(isXY(this.state.player)){if(this.state.status!=='playing')return false;return this._action(this.state.player,key===' '?'space':String(key).toLowerCase());}return super.action(key);}
    _resetReaction(f,invuln=0,kind=''){
      if(f.captured)this._xyRelease(f);
      if(isXY(f)){this._xyBreakBell(f,false);const scroll=f.xiayin?.scroll||'gate';f.xiayin=fresh();f.xiayin.scroll=scroll;}
      super._resetReaction(f,invuln,kind);
    }
    _substitute(f,target){const success=super._substitute(f,target);if(success){this._xyRelease(f);if(isXY(f)){this._xyCancel(f);f.xiayin.height=f.xiayin.vy=0;f.xiayin.recast=0;}}return success;}
    _xyCancel(f){const s=f.xiayin;s.events=[];s.move=null;s.queued=false;s.guard=0;this._stopDash(f);this._clearArmor(f);for(const e of this.state.entities)if(e.ownerUid===f.uid&&e.xyAttached)e.life=0;}
    _xyStart(f,name,fx,duration,armor='skill'){
      this._xyCancel(f);const s=f.xiayin;s.move={name,fx,elapsed:0,duration,id:++id};f.action=fx==='ultimate'?'ultimate':['basic','airBasic','bellKick'].includes(fx)?'attack':'skill';f.actionTime=duration;f.castName=name;f.castType='wood';f.armorKind=armor;f.armorTime=armor?duration:0;
      this._event('cast',{fighter:f,name,type:'wood',ultimate:fx==='ultimate'});
      if(!['basic','airBasic','ultimate'].includes(fx))this._effect('text',f.x,f.y-155-s.height,'#f5e4b3',.7,{text:name});
      return {ownerUid:f.uid,awardChakra:true,pointAwarded:false};
    }
    _xyLater(f,time,fn){f.xiayin.events.push({time,fn});}
    _xyHit(f,fx,cast,props={}){return this._entity(f,{kind:'strike',type:'wood',xyFX:fx,xyAttached:true,
      x:f.x+f.facing*95,y:f.y,width:235,height:105,radius:110,life:.25,damage:65,
      knockback:45,lift:230,stun:.42,color:'#e3c98a',follow:true,offsetX:95,cast,airReach:230,...props});}
    _xyVisual(f,fx,x,y,life,props={}){return this._entity(f,{kind:'area',type:'wood',xyFX:fx,x,y,radius:150,life,visualOnly:true,damage:0,...props});}
    _xyTargetBell(f){const b=f.xiayin.bell,target=this.state[other(f.side)];return b&&b.time>0&&target.captured?.bellId===b.id&&!target.dead?b:null;}
    _xyRelease(target){if(!target?.captured)return;const owner=this.state?.teams?.[target.captured.owner]?.find(f=>f.uid===target.captured.ownerUid);if(owner?.xiayin?.bell)owner.xiayin.bell.targetUid='';target.captured=null;target.stun=0;if(!target.dead&&target.action!=='substitute'){target.actionTime=0;target.action='idle';}}
    _xyBreakBell(f,burst=true){const b=f.xiayin?.bell;if(!b)return;for(const side of ['player','enemy'])if(this.state?.[side]?.captured?.bellId===b.id)this._xyRelease(this.state[side]);
      if(b.visual)b.visual.life=0;if(burst&&this.state)this._xyVisual(f,'splinters',b.x,b.y,.45);f.xiayin.bell=null;
    }
    _xyBell(f,x,y,real=true,cast){
      this._xyBreakBell(f);const b={id:++id,x:clamp(x,105,1175),y:clamp(y,400,590),time:real?2.8:.65,maxTime:2.8,real,vx:0,targetUid:''};f.xiayin.bell=b;
      b.visual=this._xyVisual(f,'bell',b.x,b.y,b.time,{bell:b,radius:100});
      this._xyHit(f,'hands',cast,{kind:'area',x:b.x,y:b.y,follow:false,radius:120,height:130,life:.3,damage:real?75:45,grab:real,captureBell:real?b:null,groundSweep:true,lift:real?0:180,knockback:0});
      if(real)f.xiayin.bellCooldown=7;
      return b;
    }
    _xyCapture(f,target,b){
      if(!b||!b.real||target.dead)return;
      this._xyRelease(target);target.captured={owner:f.side,ownerUid:f.uid,bellId:b.id};b.targetUid=target.uid;
      this._stopDash(target);this._clearArmor(target);target.air=target._airV=target._vx=target._vy=target.knockdown=target.recovery=0;target.stun=.2;target.action='captured';target.actionTime=.2;target.x=b.x;target.y=b.y;
      if(isXY(target)){this._xyCancel(target);target.xiayin.height=target.xiayin.vy=0;}
      if(target.shenju){this._sjCancel(target);target.shenju.height=target.shenju.vy=target.shenju.jumps=0;}
      this._effect('text',b.x,b.y-160,'#f1d895',.6,{text:'钟 · 禁锢'});
    }
    _action(f,key){
      if(!isXY(f))return super._action(f,key);
      const s=f.xiayin,target=this.state[other(f.side)];if(f.dead||target.dead)return false;
      if(key==='space')return this._substitute(f,target);
      if(f.captured||f.stun>0||f.air>0||f._airV>0||f.knockdown>0||f.recovery>0)return false;
      const bell=this._xyTargetBell(f);
      if(s.move?.fx==='basic'&&f.attackIndex===3&&['u','i','l','h','uj','ij'].includes(key)){this._xyBlink(f,true);this._xyCancel(f);f.actionTime=0;}
      if(key==='uj')return this._xyGrab(f,s.height>0);
      if(key==='ij')return this._xyDive(f,s.slide==='i');
      if(key==='j'){
        if(s.guard>0||s.slide==='u'&&s.slideTime>0)return this._xyGrab(f,s.height>0);
        if(s.slide==='i'&&s.slideTime>0)return this._xyDive(f,true);
        if(bell&&f.actionTime<.05)return this._xyKick(f,bell);
        const input=f.side==='player'?this.input:s.aim;
        if(s.move?.fx==='basic'&&f.attackIndex===2&&s.basicRelease&&s.move.elapsed>.12&&s.move.elapsed<.33){s.height=80;s.vy=70;s.airCombo=0;f.actionTime=0;return this._xyAirBasic(f);}
        if(f.actionTime>.035){if(['basic','airBasic'].includes(s.move?.fx)){s.queued=true;return true;}return false;}
        if(s.height>0)return this._xyAirBasic(f);
        if(s.airReady>0&&input.y<-.35){s.height=120;s.vy=30;s.airCombo=0;this._effect('smoke',f.x,f.y-55,'#bfc9bd',.3,{radius:45});return this._xyAirBasic(f);}
        return this._xyBasic(f);
      }
      if(key==='u'){
        if(s.recast>0){return this._xyDrop(f);}
        if(f.cooldowns.u>0)return false;
        if(s.height>0)return this._xyGrab(f,true);
        if(bell)return this._xyChant(f,bell);
        if(f.actionTime>.035)return false;
        f.cooldowns.u=11;this._xyStart(f,'金钟法相','guard',1.45,'');s.guard=1.45;s.recast=2.6;s.counter=false;s.slide='u';s.slideTime=.35;s.blocked=0;return true;
      }
      if(key==='i'){
        if(f.cooldowns.i>0)return false;
        if(bell)return this._xyTwins(f,bell);
        if(f.actionTime>.035)return false;
        if(s.height>0)return this._xyDive(f,false);
        f.cooldowns.i=10;const cast=this._xyStart(f,'木龙之术','dragon',.72);s.slide='i';s.slideTime=.35;
        this._xyVisual(f,'coil',f.x,f.y,.55,{radius:120});
        this._xyLater(f,.23,()=>this._xyHit(f,'dragon',cast,{kind:'projectile',follow:false,xyAttached:false,x:f.x+f.facing*85,y:f.y,vx:f.facing*650,radius:85,width:190,height:110,life:1.35,damage:165,lift:310,knockback:220,nearSweep:true}));return true;
      }
      if(key==='o'){
        if(f.chakra<4||f.actionTime>.035)return false;f.chakra-=4;s.height=s.vy=0;this._xyBreakBell(f);const cast=this._xyStart(f,'六龙 · 苍天大树','ultimate',3.4,'adamant');cast.awardChakra=false;
        const x=clamp(f.x+f.facing*250,225,1055),y=f.y;this._xyVisual(f,'ultimate',x,y,3.4,{radius:310,ultimate:true,xyAttached:true});
        for(let i=0;i<6;i++)this._xyLater(f,.45+i*.3,()=>this._xyHit(f,'dragonImpact',cast,{kind:'area',x,y,follow:false,radius:265,height:180,damage:43,lift:240,stun:.55,knockback:0,isUltimate:true,groundSweep:true,life:.2}));
        this._xyLater(f,2.65,()=>this._xyHit(f,'greatTree',cast,{kind:'area',x,y,follow:false,radius:320,height:205,damage:275,lift:400,stun:.85,knockback:260,isUltimate:true,groundSweep:true,life:.6}));
        this._banner('六龙归一 · 苍天大树',.8);return true;
      }
      if(key==='l'){
        if(f.cooldowns.l>0||f.actionTime>.035)return false;f.cooldowns.l=20;
        const forest=s.scroll==='forest',cast=this._xyStart(f,forest?'秘卷 · 树界降临':'秘卷 · 明神门',forest?'forest':'gate',.7,'adamant');cast.awardChakra=false;
        this._xyLater(f,.2,()=>this._xyHit(f,forest?'forest':'gate',cast,{kind:'area',x:f.x+f.facing*(forest?145:200),y:f.y,follow:false,radius:forest?225:130,height:155,damage:forest?130:110,lift:forest?190:0,stun:forest?.8:1,grab:!forest,groundSweep:true,life:forest?1.5:.8}));return true;
      }
      return super._action(f,key);
    }
    _xyBasic(f){
      const s=f.xiayin,target=this.state[other(f.side)];f.facing=target.x>=f.x?1:-1;f.attackIndex=f._lastBasic<1.15?f.attackIndex%4+1:1;f._lastBasic=0;
      const n=f.attackIndex,cast=this._xyStart(f,`${n}A`,'basic',[0,.32,.48,.5,.66][n],'');cast.awardChakra=false;s.basicRelease=false;
      if(n===4){this._xyBreakBell(f);s.airReady=1.8;this._xyLater(f,.28,()=>this._xyBell(f,f.x+f.facing*145,f.y,s.bellCooldown<=0,cast));}
      else if(n===3){s.move.blinked=false;s.move.originalFacing=f.facing;this._xyLater(f,.2,()=>this._xyBlink(f,false));this._xyLater(f,.28,()=>this._xyHit(f,'branches',cast,{width:300,offsetX:125,damage:42,isBasic:true,lift:395}));}
      else this._xyLater(f,.09,()=>this._xyHit(f,n===1?'palm':'roots',cast,{isBasic:true,damage:n===1?31:40,lift:n===1?0:350,nearSweep:n===2,width:n===2?290:205,offsetX:80}));
      return true;
    }
    _xyBlink(f,forceMax){
      const s=f.xiayin,m=s.move;if(m?.fx!=='basic'||f.attackIndex!==3||m.blinked)return;m.blinked=true;
      const aim=f.side==='player'?this.input:s.aim,dir=m.originalFacing||f.facing,relative=aim.x*dir;
      const held=s.inputHold>.18&&!forceMax,backward=relative<-.3,forward=relative>.3;
      const travel=held?105:245;this._effect('smoke',f.x,f.y-60,'#c3c9bc',.3,{radius:45});
      f.x=clamp(f.x+(backward?-dir:dir)*travel,105,1175);
      f.facing=backward?(held?-dir:dir):forward?(held?dir:-dir):this.state[other(f.side)].x>=f.x?1:-1;
      f.invuln=Math.max(f.invuln,.12);f.invulnKind='blink';
    }
    _xyAirBasic(f){
      const s=f.xiayin;s.airCombo=s.airCombo%4+1;const n=s.airCombo;f.attackIndex=n;const cast=this._xyStart(f,`空中 ${n}A`,'airBasic',n===4?.57:.3,'');cast.awardChakra=false;s.vy=Math.max(s.vy,80);
      if(n===4){this._xyBreakBell(f);this._xyLater(f,.22,()=>this._xyBell(f,f.x+f.facing*125,f.y,s.bellCooldown<=0,cast));s.airReady=1.5;}
      else this._xyLater(f,.06,()=>this._xyHit(f,n===1?'uproot':'kick',cast,{isBasic:true,damage:36,lift:300,groundSweep:false,width:245,airReach:300}));return true;
    }
    _xyDrop(f){
      const s=f.xiayin,target=this.state[other(f.side)],counter=s.counter;s.recast=0;s.slide='';const cast=this._xyStart(f,counter?'金钟 · 索敌反制':'金钟 · 从天而降','drop',.65);
      const x=counter?target.x:clamp(f.x+f.facing*205,110,1170),y=counter?target.y:f.y;
      this._xyVisual(f,'fallingBell',x,y,.5,{radius:110});this._xyLater(f,.32,()=>this._xyBell(f,x,y,true,cast));return true;
    }
    _xyGrab(f,air){
      const s=f.xiayin;if(s.move?.fx==='grab'||s.move?.fx==='ultimate')return false;
      const canReuse=s.guard>0||s.recast>0||s.slide==='u';if(f.cooldowns.u>0&&!canReuse)return false;
      f.cooldowns.u=air?6:11;s.recast=0;s.slide='';
      const dir=f.facing,target=this.state[other(f.side)],x=air?target.x:clamp(f.x+dir*245,105,1175);
      const cast=this._xyStart(f,'慈悲 · 跃空擒拿','grab',1.05,'');f.invuln=Math.max(f.invuln,.32);f.invulnKind='blink';s.height=145;s.vy=0;
      this._xyLater(f,.16,()=>{f.x=x;});
      this._xyLater(f,.34,()=>{s.height=45;this._xyHit(f,'mercy',cast,{kind:'area',x:f.x,y:f.y,follow:false,radius:105,height:110,damage:150,lift:0,stun:.9,grab:true,execute:.1,knockback:0,groundSweep:true,life:.32});});
      this._xyLater(f,.76,()=>{const aim=f.side==='player'?this.input:s.aim;this._effect('smoke',f.x,f.y-45,'#e3dac4',.3,{radius:55});f.x=clamp(f.x+(Math.abs(aim.x)>.3?Math.sign(aim.x):-dir)*205,105,1175);s.height=s.vy=0;});return true;
    }
    _xyDive(f,reuse){
      const s=f.xiayin;if(!reuse&&f.cooldowns.i>0)return false;if(s.move?.fx==='dive'||s.move?.fx==='ultimate')return false;
      f.cooldowns.i=10;s.slide='';const cast=this._xyStart(f,'乘龙 · 木龙俯冲','dive',1.2);s.height=160;s.vy=0;
      const x=clamp(f.x+f.facing*290,110,1170);this._xyVisual(f,'dragonDive',x,f.y,1.15,{radius:165,xyAttached:true});
      this._xyLater(f,.7,()=>{f.x=clamp(f.x+f.facing*140,105,1175);this._xyHit(f,'dragonImpact',cast,{kind:'area',x,y:f.y,follow:false,radius:170,height:145,damage:185,lift:380,knockback:200,nearSweep:true,life:.4});s.height=s.vy=0;});return true;
    }
    _xyKick(f,bell){
      const cast=this._xyStart(f,'飞踢 · 送钟','bellKick',.65,'');cast.awardChakra=false;
      f.x=clamp(bell.x-f.facing*90,105,1175);this._xyLater(f,.17,()=>{bell.vx=f.facing*880;bell.time=Math.max(bell.time,1.3);this._xyHit(f,'bellShock',cast,{kind:'area',x:bell.x,y:bell.y,follow:false,radius:110,height:130,damage:65,lift:0,knockback:0,life:.15});});return true;
    }
    _xyTwins(f,bell){
      f.cooldowns.i=10;const cast=this._xyStart(f,'双龙 · 盘钟','twins',1.35);bell.time=Math.max(bell.time,3.4);this._xyVisual(f,'twins',bell.x,bell.y,1.6,{bell,xyAttached:true,radius:170});
      for(let i=0;i<4;i++)this._xyLater(f,.2+i*.28,()=>this._xyHit(f,'bellShock',cast,{kind:'area',x:bell.x,y:bell.y,follow:false,radius:115,height:150,damage:48,lift:0,knockback:0,life:.17}));return true;
    }
    _xyChant(f,bell){
      f.cooldowns.u=15;const cast=this._xyStart(f,'清越 · 钟上感化','chant',2.5,'skill');bell.time=Math.max(bell.time,3.3);f.x=bell.x;f.y=bell.y;f.xiayin.height=158;f.xiayin.vy=0;
      this._xyVisual(f,'chant',bell.x,bell.y,2.5,{bell,radius:170,xyAttached:true});for(let i=0;i<5;i++)this._xyLater(f,.25+i*.4,()=>this._xyHit(f,'bellShock',cast,{kind:'area',x:bell.x,y:bell.y,follow:false,radius:115,height:140,damage:33,lift:0,knockback:0,life:.15}));
      this._xyLater(f,2.35,()=>{f.xiayin.height=f.xiayin.vy=0;});return true;
    }
    _tickFighter(f,dt){
      super._tickFighter(f,dt);
      if(f.captured&&!f.dead){const o=this.state.teams[f.captured.owner].find(a=>a.uid===f.captured.ownerUid),b=o?.xiayin?.bell;if(!b||b.time<=0||b.id!==f.captured.bellId)this._xyRelease(f);else{f.x=b.x;f.y=b.y;f.air=f._airV=f._vx=f._vy=f.knockdown=f.recovery=0;f.action='captured';f.stun=.2;f.actionTime=.2;}}
      if(!isXY(f)||f.dead)return;const s=f.xiayin;
      s.recast=Math.max(0,s.recast-dt);s.slideTime=Math.max(0,s.slideTime-dt);if(!s.slideTime)s.slide='';s.airReady=Math.max(0,s.airReady-dt);s.bellCooldown=Math.max(0,s.bellCooldown-dt);s.blocked=Math.max(0,s.blocked-dt);
      const aim=f.side==='player'?this.input:s.aim;if(Math.abs(aim.x)>.3){const sign=Math.sign(aim.x);s.inputHold=s.inputSign===sign?s.inputHold+dt:0;s.inputSign=sign;}else{s.inputHold=0;s.inputSign=0;}
      if(s.bell){const b=s.bell;b.time-=dt;b.x=clamp(b.x+b.vx*dt,110,1170);if(b.visual){b.visual.x=b.x;b.visual.y=b.y;b.visual.life=Math.max(.01,b.time);}
        if(s.move?.fx==='chant'){f.x=b.x;f.y=b.y;}
        if(b.vx&&(b.x===110||b.x===1170)){b.vx=0;this._xyVisual(f,'splinters',b.x,b.y,.5);const t=this.state[other(f.side)];if(t.captured?.bellId===b.id)this._xyHit(f,'bellShock',{ownerUid:f.uid,awardChakra:false},{kind:'area',x:b.x,y:b.y,follow:false,radius:100,height:140,damage:70,lift:0,knockback:0,life:.15});}
        if(b.time<=0)this._xyBreakBell(f);}
      if(f.captured||f.stun>0||f.air>0||f.knockdown>0||f.recovery>0){this._xyCancel(f);s.height=s.vy=0;return;}
      if(s.height>0&&!['grab','dive','chant','ultimate'].includes(s.move?.fx)){s.height=Math.max(0,s.height+s.vy*dt);s.vy-=380*dt;if(s.height>160){s.height=160;s.vy=Math.min(0,s.vy);}if(!s.height){s.vy=0;s.airCombo=0;}}
      if(s.guard>0){s.guard=Math.max(0,s.guard-dt);const held=f.side==='enemy'?s.move?.elapsed<.7:this._xyButtons?.u;if(!s.guard||!held&&s.move?.elapsed>.2){s.guard=0;s.move=null;s.events=[];f.actionTime=0;this._clearArmor(f);}}
      if(s.move){const move=s.move;move.elapsed+=dt;for(const event of [...s.events]){event.time-=dt;if(event.time<=0){s.events.splice(s.events.indexOf(event),1);event.fn();}}
        if(s.move===move&&move.elapsed>=move.duration){s.move=null;s.events=[];f.actionTime=0;this._clearArmor(f);if(s.queued){s.queued=false;this._action(f,'j');}}}
    }
    _move(f,x,y,dt){
      const foe=this.state[other(f.side)],guard=foe?.xiayin?.guard>0&&Math.hypot(f.x-foe.x,(f.y-foe.y)*2)<215;
      f.slowed=!!guard;if(guard){x*=.38;y*=.38;}
      if(!isXY(f))return super._move(f,x,y,dt);const s=f.xiayin;s.aim={x,y};if(f.dead||f.stun>0||f.air>0||f.captured||f.knockdown>0||f.recovery>0)return;
      if(s.move?.fx==='grab'||s.move?.fx==='dive'){f.y=clamp(f.y+y*150*dt,400,590);return;}
      if(s.height>0&&s.move?.fx!=='chant'){f.x=clamp(f.x+x*220*dt,105,1175);f.y=clamp(f.y+y*145*dt,400,590);return;}
      return super._move(f,x,y,dt);
    }
    _collides(e,target){if(e.visualOnly)return false;if(isXY(target)&&target.xiayin.height>(e.airReach||110))return false;return super._collides(e,target);}
    _hit(attacker,target,e){
      if(e.visualOnly)return false;
      if(isXY(target)&&target.xiayin.guard>0&&!e.grab&&!e.isUltimate&&target.invuln<=0&&!target.dead){const s=target.xiayin;s.counter=true;s.recast=Math.max(s.recast,1.8);s.blocked=.35;
        this._effect('text',target.x,target.y-175,'#fff0b7',.6,{text:'金钟 · 格挡'});this._xyVisual(target,'guardFlash',target.x,target.y,.4,{radius:130});return true;}
      const healthBefore=target.hp,props={...e};if(e.nearSweep)props.groundSweep=Math.abs(attacker.x-target.x)<175&&Math.abs(attacker.y-target.y)<70;
      if(props.groundSweep&&target.knockdown>0&&target.invuln<=0)target.knockdown=0;
      if(e.grab&&target.invuln<=0)this._clearArmor(target);
      if(e.execute&&target.hp<=target.maxHP*e.execute)props.damage=target.hp+100;
      const hit=super._hit(attacker,target,props);if(!hit)return false;
      if(e.execute&&healthBefore<=target.maxHP*e.execute&&!target.dead){this._effect('text',target.x,target.y-125,'#f6e7ba',.8,{text:'慈悲感化'});target.hp=0;this._defeat(target,'mercy');}
      if(e.captureBell&&!target.dead)this._xyCapture(attacker,target,e.captureBell);
      else if(target.captured&&!target.dead){target.air=target._airV=target._vx=target._vy=0;target.action='captured';target.stun=.2;}
      if(isXY(target)&&target.action==='hurt'){const height=target.xiayin.height;this._xyCancel(target);target.xiayin.height=target.xiayin.vy=0;if(height>0){target.air=height;target._airV=Math.max(100,target._airV);target._launched=true;}}
      return true;
    }
    _cpu(dt){
      const f=this.state.enemy;if(!isXY(f))return super._cpu(dt);if(this.mode==='training'||f.dead||this.state.player.dead)return;
      const s=f.xiayin,t=this.state.player;this._aiTimer-=dt;
      if(f.stun>0||f.air>0||f.captured||f.knockdown>0||f.recovery>0){if(f.chakra>=1&&!f.cooldowns.space&&f.hp<2300)this._substitute(f,t);return;}
      this._move(f,Math.abs(t.x-f.x)>150?Math.sign(t.x-f.x):0,Math.abs(t.y-f.y)>18?Math.sign(t.y-f.y):0,dt);
      if(this._aiTimer>0)return;this._aiTimer=this.difficulty==='easy'?.6:.3;
      if(s.guard>0)return;if(s.recast>0){this._action(f,'u');return;}
      if(f.actionTime>.03)return;const b=this._xyTargetBell(f);
      if(b){this._action(f,!f.cooldowns.i?'i':!f.cooldowns.u?'u':'j');return;}
      if(f.chakra>=4){this._action(f,'o');return;}
      if(s.height>0){this._action(f,!f.cooldowns.i?'i':'j');return;}
      if(Math.abs(t.x-f.x)<240){if(!f.cooldowns.u&&f.hp<2500)this._action(f,'u');else this._action(f,'j');}
      else if(!f.cooldowns.i&&Math.abs(t.y-f.y)<70)this._action(f,'i');
    }
  }
  global.ArenaEngine=XiayinEngine;
})(window);
