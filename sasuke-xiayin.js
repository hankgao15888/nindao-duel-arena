/* 宇智波佐助「侠隐江湖」：独立资源、雷火派生与三种奥义。数值为本作调校。 */
(function(g){
  'use strict';
  const Base=g.ArenaEngine,isSX=f=>f?.id==='sasuke-xiayin',opp=s=>s==='player'?'enemy':'player',clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let serial=40000;
  const fresh=()=>({energy:2,enhanced:0,height:0,move:null,events:[],pending:null,follow:'',followTime:0,guard:0,guardSuccess:false,guardAward:false,guardStep:0,queued:false,phase:0,holdTime:0,holdConsumed:false,aim:{x:0,y:0},aiClock:0,aiStep:0});
  g.NINJAS.push({id:'sasuke-xiayin',name:'宇智波佐助',variant:'侠隐江湖',rank:'A',color:'#9ab8ff',hair:'#202036',coat:'#dddce7',style:'sasuke',speed:258,
    source:'https://www.taptap.cn/moment/724199985754669415',
    skills:[{name:'炎剑 · 须佐斩',type:'fire',cd:0,description:'消耗一格能量。U 接 J：踏焰追云纵，再按 J 瞬身追剑；U 接 O：燎原十八拍，格挡后接 J 连斩，四点长按 O 发动劫火烙八荒。'},
      {name:'雷剑 · 千鸟锐枪',type:'lightning',cd:0,description:'消耗一格能量。I 接 J：疾电穿云刺，命中后 J 追斩；I 接 O：飞鸟折白梅，空中 J 千鸟千本，四点长按 O 发动雷麟碎空闪。摇杆控制位移与朝向。'}],
    ultimate:{name:'双剑齐鸣 / 踏日裁岳',type:'lightning',damage:560,description:'短按 O：须佐骨架格挡与千鸟流；O 接 J 消耗一点强化双剑。四点长按 O 释放踏日裁岳；强化中 O 接 J 也可发动。'},
    notes:'参考官方 TapTap 技能演示重绘。两格能量、五段／强化七段普攻、天照、须佐与三种奥义已实现；帧数、伤害、演出时长为本作独立调校。'});
  class SasukeXiayinEngine extends Base{
    _fighter(p,side,index){const f=super._fighter(p,side,index);if(isSX(f))f.sasukeXiayin=fresh();return f;}
    setButtonHeld(key,value){super.setButtonHeld(key,value);this._sxButtons=this._sxButtons||{};this._sxButtons[key]=!!value;}
    _sxHeld(f,key){return this._onlineButtons?!!this._onlineButtons[f.side]?.[key]:f.side==='player'?!!this._sxButtons?.[key]:false;}
    _sxAim(f){return this._onlineInputs?.[f.side]||(f.side==='player'?this.input:f.sasukeXiayin.aim);}
    action(key){if(isSX(this.state.player)){if(this.state.status!=='playing')return false;return this._action(this.state.player,key===' '?'space':String(key).toLowerCase());}return super.action(key);}
    _sxRelease(t,launch=false){if(!t?.sxGrab)return;const info=t.sxGrab;t.sxGrab=null;if(t.dead||t.action==='substitute')return;t.stun=t.actionTime=0;t.action='idle';if(launch){t.air=Math.max(8,t.air);t._airV=290;t._launched=true;t.action='hurt';}const owner=this.state.teams[info.owner]?.find(f=>f.uid===info.ownerUid);if(owner?.sasukeXiayin)owner.sasukeXiayin.grabbed='';}
    _sxCancel(f){const s=f.sasukeXiayin;if(!s)return;s.events=[];s.move=null;s.pending=null;s.follow='';s.skillCast=null;s.followTime=s.guard=s.height=s.phase=0;s.queued=false;this._stopDash(f);this._clearArmor(f);for(const e of this.state.entities)if(e.ownerUid===f.uid&&e.sxAttached)e.life=0;const t=this.state[opp(f.side)];if(t?.sxGrab?.ownerUid===f.uid)this._sxRelease(t,true);}
    _resetReaction(f,invuln=0,kind=''){if(f.sxGrab)this._sxRelease(f);if(isSX(f)){this._sxCancel(f);f.sasukeXiayin=fresh();}f.sxBurn=null;super._resetReaction(f,invuln,kind);}
    _substitute(f,t){const ok=super._substitute(f,t);if(ok){this._sxRelease(f);f.sxBurn=null;if(isSX(f))this._sxCancel(f);}return ok;}
    _sxStart(f,name,fx,duration,armor='skill'){
      const previous=f.sasukeXiayin.skillCast,height=f.sasukeXiayin.height;this._sxCancel(f);const s=f.sasukeXiayin;if(!fx.startsWith('ult'))s.height=height;s.move={id:++serial,name,fx,duration,elapsed:0};f.action=fx.startsWith('ult')?'ultimate':fx==='basic'?'attack':'skill';f.actionTime=duration;f.armorKind=armor;f.armorTime=armor?duration:0;f.castName=name;f.castType='lightning';
      if(fx!=='basic'){this._event('cast',{fighter:f,name,type:fx.includes('Fire')?'fire':'lightning',ultimate:fx.startsWith('ult')});this._effect('text',f.x,f.y-170,'#e6dcff',.65,{text:name});}
      const cast=previous&&['fireChase','thunderChase','guardChain','senbon'].includes(fx)?previous:{ownerUid:f.uid,awardChakra:!['basic','pulse','empower'].includes(fx)&&!fx.startsWith('ult'),pointAwarded:false};s.skillCast=cast;return cast;
    }
    _sxLater(f,time,fn){f.sasukeXiayin.events.push({time,fn});}
    _sxVisual(f,fx,x,y,life,props={}){return this._entity(f,{kind:'area',type:'lightning',sxFX:fx,x,y,life,radius:120,visualOnly:true,damage:0,...props});}
    _sxHit(f,fx,cast,props={}){return this._entity(f,{kind:'strike',type:fx.includes('Fire')?'fire':'lightning',sxFX:fx,sxAttached:true,x:f.x+f.facing*95,y:f.y,width:260,height:115,radius:130,life:.18,damage:70,lift:270,knockback:40,stun:.4,airReach:300,color:'#c5d5ff',follow:true,offsetX:95,cast,...props});}
    _sxFace(f){const a=this._sxAim(f);this._face(f);return a;}
    _action(f,key){
      if(f.sxGrab&&key!=='space')return false;
      if(!isSX(f)){if(Math.abs(this._direction(f).x)>.15&&!f.dead&&!f.stun&&f.air<=0&&!f.knockdown&&!f.recovery&&!f.captured&&!f.inKamui&&!f.obRoot)this._face(f);const result=super._action(f,key);return result||key==='j'&&this._queueBasic(f);}
      const s=f.sasukeXiayin,t=this.state[opp(f.side)];if(f.dead||t.dead)return false;
      if(key==='space')return this._substitute(f,t);
      if(f.inKamui||f.captured||f.obRoot||f.stun>0||f.air>0||f._airV>0||f.knockdown>0||f.recovery>0)return false;
      if(s.move?.fx==='ultFire'&&s.move.elapsed>=2.65&&['i','ij','io'].includes(key)&&s.energy>=1){this._sxCancel(f);f.actionTime=0;}
      if(['uj','uo','ij','io'].includes(key)){
        const first=key[0],last=key[1];if(s.pending?.key===first)return this._sxBranch(f,first,last);
        if(f.actionTime>.02||s.energy<1)return false;s.energy-=1;this._sxFace(f);return this._sxBranch(f,first,last);
      }
      if(key==='oj'){if(s.move?.fx==='pulse'||s.follow==='pulse')return this._sxEmpower(f);if(f.actionTime>.02)return false;return this._sxEmpower(f);}
      if(s.pending&&['j','o'].includes(key))return this._sxBranch(f,s.pending.key,key);
      if(key==='o'&&s.followTime>0&&s.follow==='fireGuard'&&s.guardSuccess&&f.chakra>=4)return this._sxUltimate(f,'Fire');
      if(key==='o'&&s.followTime>0&&s.follow==='senbon'&&f.chakra>=4)return this._sxUltimate(f,'Kirin');
      if(key==='j'&&s.followTime>0){
        if(s.follow==='pulse')return this._sxEmpower(f);
        if(s.follow==='fireGuard')return this._sxGuardChain(f);
        if(s.follow==='fireSword')return this._sxFireChase(f);
        if(s.follow==='thunderSword')return this._sxThunderChase(f);
        if(s.follow==='rise')return this._sxSenbon(f);
      }
      if(f.actionTime>.02){if(key==='j'&&s.move?.fx==='basic'){s.queued=true;return true;}return key==='j'&&this._queueBasic(f);}
      if(key==='j')return this._sxBasic(f);
      if(key==='u'||key==='i'){
        if(s.energy<1)return false;s.energy-=1;this._sxFace(f);this._sxStart(f,key==='u'?'炎剑 · 起势':'雷剑 · 起势',key==='u'?'readyFire':'readyThunder',.24);s.pending={key,time:.22};return true;
      }
      if(key==='o'){
        this._sxFace(f);const cast=this._sxStart(f,'须佐骨架 · 千鸟流','pulse',.62,'');s.guard=.28;s.guardAward=false;s.guardSuccess=false;s.follow='pulse';s.followTime=.64;s.holdTime=0;s.holdConsumed=false;
        this._sxVisual(f,'ribs',f.x,f.y,.62,{sxAttached:true,follow:true});
        this._sxLater(f,.3,()=>this._sxHit(f,'stream',cast,{kind:'area',x:f.x,offsetX:0,radius:180,height:155,damage:85,lift:220}));return true;
      }
      return super._action(f,key);
    }
    _sxBranch(f,first,last){
      const s=f.sasukeXiayin;this._sxFace(f);
      if(first==='u'&&last==='j'){
        const cast=this._sxStart(f,'踏焰追云纵','fireSword',1.15);s.follow='fireSword';s.followTime=.85;s.swordX=clamp(f.x+f.facing*330,110,1170);s.swordY=f.y;
        const x=s.swordX,y=f.y;this._sxVisual(f,'spinningFire',x,y,1.15,{radius:155});
        for(let n=0;n<3;n++)this._sxLater(f,.15+n*.19,()=>this._sxHit(f,'slashFire',cast,{x:f.x+f.facing*(120+n*85),y,follow:false,sxAttached:false,width:210,damage:44,lift:230,sxBurn:2.6}));
        this._sxLater(f,.9,()=>this._sxHit(f,'amaterasu',cast,{kind:'area',x,y,follow:false,radius:155,damage:85,lift:320,grab:true,sxCapture:.35,sxBurn:3}));return true;
      }
      if(first==='u'){
        const cast=this._sxStart(f,'燎原十八拍 · 架势','fireGuard',1.15,'');s.guard=.85;s.guardSuccess=false;s.guardAward=false;s.guardStep=0;s.follow='fireGuard';s.followTime=1.2;s.holdTime=0;s.holdConsumed=false;
        this._sxVisual(f,'susanoArm',f.x+f.facing*90,f.y,1.15,{follow:true,offsetX:90,sxAttached:true});
        this._sxVisual(f,'guardMantle',f.x,f.y,1.15,{follow:true,sxAttached:true,radius:160});
        this._sxLater(f,.08,()=>this._sxHit(f,'susanoArm',cast,{damage:48,lift:230,width:190}));return true;
      }
      if(last==='j'){
        const cast=this._sxStart(f,'疾电穿云刺','thunderSword',1.05);this._sxLater(f,.15,()=>this._sxHit(f,'thunderSword',cast,{kind:'projectile',follow:false,sxAttached:false,x:f.x+f.facing*60,y:f.y,vx:f.facing*820,life:.55,radius:50,width:140,damage:100,lift:0,grab:true,sxThunder:true}));this._sxLater(f,.8,()=>{if(!s.follow){s.phase=.12;this._sxVisual(f,'blink',f.x,f.y,.3);f.x=clamp(f.x+f.facing*220,100,1180);}});return true;
      }
      const a=this._sxAim(f),dx=Math.abs(a.x)+Math.abs(a.y)<.15?f.facing:a.x,dy=a.y;
      const cast=this._sxStart(f,'飞鸟折白梅','rise',1.4,'');s.phase=.36;s.follow='rise';s.followTime=1.6;s.holdTime=0;s.holdConsumed=false;s.drift={x:dx,y:dy};
      this._sxLater(f,.22,()=>{s.height=100;this._sxHit(f,'uppercut',cast,{damage:130,lift:470,width:270});});this._sxVisual(f,'blink',f.x,f.y,.6,{radius:180});return true;
    }
    _sxDefault(f,key){
      const s=f.sasukeXiayin;if(key==='u'){
        const cast=this._sxStart(f,'炎剑 · 须佐斩','susanoSlash',.85);this._sxLater(f,.1,()=>this._sxHit(f,'susanoArm',cast,{damage:70,lift:240}));this._sxLater(f,.44,()=>this._sxHit(f,'susanoSlash',cast,{damage:125,lift:350,width:390,offsetX:160,sxBurn:2.5}));
      }else{
        const cast=this._sxStart(f,'雷剑 · 千鸟锐枪','spear',.85);const a=this._sxAim(f);s.drift={x:f.facing*.65,y:a.y};this._sxHit(f,'kick',cast,{width:150,damage:40,lift:0});
        this._sxLater(f,.4,()=>{this._sxFace(f);this._sxHit(f,'spear',cast,{width:660,offsetX:300,height:95,damage:145,lift:310,knockback:150});});
      }
    }
    _sxFireChase(f){const s=f.sasukeXiayin,x=s.swordX,y=s.swordY,cast=this._sxStart(f,'踏焰追云纵 · 瞬身追剑','fireChase',.62,'');s.phase=.18;this._sxHit(f,'trailFire',cast,{width:Math.abs(x-f.x)+150,x:(x+f.x)/2,follow:false,damage:65,lift:220,grab:true,sxBurn:2});f.x=clamp(x-f.facing*40,110,1170);f.y=y;this._sxLater(f,.19,()=>this._sxHit(f,'twinSlash',cast,{damage:150,lift:420,width:340,knockback:160,sxBurn:2.5}));return true;}
    _sxThunderChase(f){const cast=this._sxStart(f,'疾电穿云刺 · 雷影连斩','thunderChase',.83);for(let i=0;i<3;i++)this._sxLater(f,.06+i*.18,()=>this._sxHit(f,'slashThunder',cast,{damage:39,lift:260,width:300}));this._sxLater(f,.63,()=>{f.x=clamp(f.x+f.facing*110,100,1180);this._sxHit(f,'spear',cast,{damage:94,lift:340,width:360});});return true;}
    _sxGuardChain(f){
      const s=f.sasukeXiayin,success=s.guardSuccess,n=s.guardStep+1;
      if(s.move?.fx==='guardChain'&&s.move.elapsed<s.move.duration*.7){s.queued=true;return true;}
      if(!success&&n>1)return false;
      const duration=n===4?1:.55,cast=this._sxStart(f,n===4?'燎原十八拍 · 千鸟擒投':`燎原十八拍 · ${n}式`,'guardChain',duration,success?'adamant':'skill');s.guardSuccess=success;s.guardStep=n;
      this._sxVisual(f,'eighteenBeat',f.x+f.facing*110,f.y,duration,{sxStage:n,follow:true,offsetX:110,sxAttached:true,radius:n>2?240:150});
      if(success&&n<4){s.follow='fireGuard';s.followTime=1.3;}
      const count=n===2?3:1;for(let i=0;i<count;i++)this._sxLater(f,.09+i*.15,()=>this._sxHit(f,n===3?'susanoSlash':n===4?'spearGrab':'swordWave',cast,{kind:n<3?'projectile':'strike',follow:n>=3,sxAttached:n>=3,vx:n<3?f.facing*640:0,width:n===3?430:280,radius:95,life:n<3?.75:.22,damage:n===4?170:n===3?125:40,lift:n===4?380:260,grab:n===4,sxCapture:n===4?.5:0}));return true;
    }
    _sxSenbon(f){const s=f.sasukeXiayin,h=s.height,a=this._sxAim(f),cast=this._sxStart(f,'飞鸟折白梅 · 千鸟千本','senbon',.75,'');s.height=Math.max(h,80);s.follow='senbon';s.followTime=1.15;const x=clamp(f.x+f.facing*150+a.x*110,100,1180),y=clamp(f.y+a.y*100,400,590);for(let i=0;i<4;i++)this._sxLater(f,.06+i*.13,()=>this._sxHit(f,'senbon',cast,{kind:'area',x:x+(i-1.5)*34,y,follow:false,radius:95,height:160,damage:34,lift:250}));return true;}
    _sxEmpower(f){const s=f.sasukeXiayin;if(s.enhanced>0&&f.chakra>=4)return this._sxUltimate(f,'Mountain');if(f.chakra<1)return false;f.chakra-=1;this._sxStart(f,'双剑齐鸣','empower',.5,'adamant');s.enhanced=14;f.attackIndex=0;f._lastBasic=10;this._sxVisual(f,'empower',f.x,f.y,.65,{follow:true,sxAttached:true});return true;}
    _sxBasic(f){
      const s=f.sasukeXiayin,enhanced=s.enhanced>0,max=enhanced?7:5;this._sxFace(f);let n=f._lastBasic<1.35?f.attackIndex%max+1:1;if(enhanced&&n>5&&!s.basicGrab)n=1;
      f.attackIndex=n;f._lastBasic=0;const cast=this._sxStart(f,`${enhanced?'双剑强化 · ':''}${n}A`,'basic',[0,.32,.4,.5,.68,.7,.68,.75][n],'');s.basicStage=n;s.basicEnhanced=enhanced;s.basicTravel=(enhanced?[0,42,56,64,260,48,76,165]:[0,30,44,58,0,62])[n];
      if(n===1)s.basicGrab=false;
      if(!enhanced&&n===4){s.phase=.2;this._sxVisual(f,'blink',f.x,f.y,.45);this._sxLater(f,.16,()=>{f.x=clamp(f.x+f.facing*120,100,1180);});}
      if(enhanced&&n===4)s.drift={x:f.facing,y:0};
      if(!enhanced&&n===3)s.height=Math.max(s.height,28);
      if(!enhanced&&n===5||enhanced&&n===6)s.height=Math.max(s.height,55);
      this._sxVisual(f,'swordTrail',f.x,f.y,s.move.duration,{follow:true,sxAttached:true,sxStage:n,enhanced,radius:enhanced?130:90});
      this._sxLater(f,n===4?.22:.08,()=>this._sxHit(f,enhanced?'twinSlash':n===2||n===4?'slashFire':'slashThunder',cast,{damage:enhanced?48:30+n*3,isBasic:true,width:enhanced?310:240,lift:n>=3?310:0,sxBurn:n===2||n===4?2:0,grab:enhanced&&n===5,sxBasicGrab:enhanced&&n===5,sxCapture:enhanced&&n===5?.55:0}));
      if(n===3||n===5||enhanced&&n===7)this._sxLater(f,.36,()=>this._sxHit(f,n===5&&!enhanced?'spear':enhanced?'susanoSlash':'slashThunder',cast,{damage:enhanced?64:46,isBasic:true,width:n===5?500:340,offsetX:n===5?200:110,lift:350}));return true;
    }
    _sxUltimate(f,kind){
      if(f.chakra<4)return false;f.chakra-=4;const s=f.sasukeXiayin,t=this.state[opp(f.side)],duration=kind==='Mountain'?4.1:3.3,name=kind==='Mountain'?'踏日裁岳':kind==='Fire'?'劫火烙八荒':'雷麟碎空闪';
      this._sxFace(f);const cast=this._sxStart(f,name,'ult'+kind,duration,'adamant');s.holdConsumed=true;s.height=0;const x=clamp(f.x+f.facing*(kind==='Kirin'?210:180),180,1100),y=f.y;s.ultX=x;s.ultY=y;
      this._banner(name,.9);this._sxVisual(f,'ult'+kind,x,y,duration,{radius:360,sxAttached:true});
      this._sxLater(f,.18,()=>this._sxHit(f,'susanoArm',cast,{x,y,follow:false,width:470,height:160,damage:70,lift:0,grab:true,sxCapture:kind==='Mountain'?3.4:2.55,isUltimate:true,groundSweep:true}));
      const times=kind==='Mountain'?[1,1.6,2.3,3.35]:kind==='Fire'?[.85,1.4,2.45]:[1,1.65,2.55];
      times.forEach((time,i)=>this._sxLater(f,time,()=>this._sxHit(f,kind==='Fire'?'amaterasu':kind==='Kirin'?'kirinImpact':'mountainCut',cast,{kind:'area',x,y,follow:false,radius:i===times.length-1?370:250,height:220,damage:i===times.length-1?290:75,lift:i===times.length-1?420:0,knockback:0,isUltimate:true,groundSweep:true,sxBurn:kind==='Fire'?3:0})));
      this._sxLater(f,duration-.3,()=>{if(t.sxGrab?.ownerUid===f.uid)this._sxRelease(t,true);});return true;
    }
    _tickFighter(f,dt){
      super._tickFighter(f,dt);
      if(f.sxGrab&&!f.dead){const info=f.sxGrab,owner=this.state.teams[info.owner]?.find(a=>a.uid===info.ownerUid);info.time-=dt;if(!owner||owner.dead||info.time<=0||f.inKamui||f.captured)this._sxRelease(f,true);else{f.stun=f.actionTime=.15;f.action='sxGrab';f.air=f._airV=f._vx=f._vy=f.knockdown=f.recovery=0;f.x=info.x;f.y=info.y;}}
      if(f.sxBurn&&!f.dead){const b=f.sxBurn;b.time-=dt;b.tick-=dt;if(b.time<=0)f.sxBurn=null;else if(b.tick<=0){b.tick=.5;const a=this.state.teams[b.owner]?.find(x=>x.uid===b.uid);if(a&&!a.dead)this._hit(a,f,{sxDot:true,damage:12,color:'#fa9545'});}}
      if(!isSX(f)||f.dead)return;const s=f.sasukeXiayin;s.energy=clamp(s.energy+dt*.105,0,2);s.enhanced=Math.max(0,s.enhanced-dt);s.phase=Math.max(0,s.phase-dt);s.guard=Math.max(0,s.guard-dt);s.followTime=Math.max(0,s.followTime-dt);if(!s.followTime)s.follow='';
      if(f.sxGrab||f.inKamui||f.captured||f.obRoot||f.stun>0||f.air>0||f.knockdown>0||f.recovery>0){this._sxCancel(f);return;}
      if(s.height>0)s.height=Math.max(0,s.height-dt*(s.move?.fx==='rise'?25:145));
      if(!this._sxHeld(f,'o')){s.holdTime=0;s.holdConsumed=false;}else if(!s.holdConsumed){s.holdTime+=dt;if(s.holdTime>=.38&&f.chakra>=4){const fx=s.move?.fx;if(fx==='fireGuard')this._sxUltimate(f,'Fire');else if(fx==='rise')this._sxUltimate(f,'Kirin');else if(fx==='pulse')this._sxUltimate(f,'Mountain');}}
      if(s.pending){s.pending.time-=dt;if(s.pending.time<=0){const key=s.pending.key;this._sxDefault(f,key);}}
      const m=s.move;if(m){m.elapsed+=dt;for(const event of [...s.events]){if(s.move!==m)break;event.time-=dt;if(event.time<=0){s.events.splice(s.events.indexOf(event),1);event.fn();}}if(s.move===m&&m.elapsed>=m.duration){s.move=null;s.events=[];f.actionTime=0;this._clearArmor(f);if(s.queued){s.queued=false;this._action(f,'j');}}}
    }
    _move(f,x,y,dt){
      if(f.sxGrab)return;if(!isSX(f))return super._move(f,x,y,dt);const s=f.sasukeXiayin;s.aim={x,y};if(f.dead||f.stun>0||f.air>0||f.captured||f.inKamui||f.obRoot||f.knockdown>0||f.recovery>0)return;
      const fx=s.move?.fx;if(fx==='rise'&&s.move.elapsed<.27){const a=this._sxAim(f),d=s.drift||{};f.x=clamp(f.x+(Math.abs(a.x)+Math.abs(a.y)>.1?a.x:d.x||0)*680*dt,100,1180);f.y=clamp(f.y+(Math.abs(a.x)+Math.abs(a.y)>.1?a.y:d.y||0)*430*dt,400,590);return;}
      if(fx==='spear'&&s.move.elapsed<.4){f.x=clamp(f.x+f.facing*250*dt,100,1180);f.y=clamp(f.y+y*200*dt,400,590);return;}
      if(fx==='basic'){
        const m=s.move,rate=(s.basicTravel||0)/m.duration*Math.sin(Math.PI*clamp(m.elapsed/m.duration,0,1))*Math.PI/2;
        const moving=Math.hypot(x,y)>.15,dx=s.basicEnhanced&&moving?x:f.facing,dy=s.basicEnhanced&&moving?y:0,len=Math.max(1,Math.hypot(dx,dy));
        f.x=clamp(f.x+dx/len*rate*dt,100,1180);f.y=clamp(f.y+dy/len*rate*.85*dt,400,590);return;
      }
      return super._move(f,x,y,dt);
    }
    _collides(e,t){if(e.visualOnly||isSX(t)&&t.sasukeXiayin.height>(e.airReach||130))return false;return super._collides(e,t);}
    _hit(a,t,e){
      if(isSX(t)&&t.sasukeXiayin.phase>0)return false;
      if(t.sxGrab&&t.sxGrab.ownerUid!==a.uid)return false;
      if(isSX(t)&&t.sasukeXiayin.guard>0&&!e.isUltimate&&!e.grab&&!e.sxDot&&t.invuln<=0){const s=t.sasukeXiayin,front=(a.x-t.x)*t.facing>=-30;if(s.move?.fx==='pulse'||front){s.guardSuccess=true;if(!s.guardAward){s.guardAward=true;s.energy=clamp(s.energy+.5,0,2);this._effect('text',t.x,t.y-170,'#ddc6ff',.65,{text:'格挡成功 · 能量 +½'});}if(s.move?.fx==='fireGuard'){s.guard=Math.max(s.guard,.8);s.followTime=Math.max(s.followTime,1.4);s.move.duration=Math.max(s.move.duration,s.move.elapsed+.8);t.actionTime=.8;}this._sxVisual(t,'guardFlash',t.x+t.facing*45,t.y,.3);return true;}}
      if(e.sxDot){if(t.dead||t.invuln>0||t.inKamui||t.obito?.phase>0)return false;const scale=a.side==='enemy'?(this.difficulty==='easy'?.42:this.difficulty==='hard'?1.13:.64):1;t.hp=Math.max(0,t.hp-Math.round(e.damage*scale));this._effect('spark',t.x,t.y-55-t.air,'#b574ff',.2,{radius:18});if(t.hp<=0)this._defeat(t,'ko');return true;}
      const before=t.hp,hit=super._hit(a,t,e);if(!hit)return false;if(t.hp>=before)return hit;
      if(isSX(a)&&e.sxFX){a.sasukeXiayin.energy=clamp(a.sasukeXiayin.energy+.075,0,2);this._sxVisual(a,'impact',t.x,t.y-t.air,.3,{radius:e.isUltimate?160:65,fire:!!e.sxBurn});}
      if(e.sxBurn&&!t.dead)t.sxBurn={owner:a.side,uid:a.uid,time:e.sxBurn,tick:.5};
      if(isSX(t)&&t.action==='hurt'){const h=t.sasukeXiayin.height;this._sxCancel(t);if(h>0){t.air=Math.max(h,t.air);t._airV=Math.max(120,t._airV);t._launched=true;}}
      if(e.sxBasicGrab&&isSX(a)&&!t.dead)a.sasukeXiayin.basicGrab=true;
      if(e.sxCapture&&!t.dead&&!t.inKamui&&!t.captured){if(isSX(t))this._sxCancel(t);t.sxGrab={owner:a.side,ownerUid:a.uid,time:e.sxCapture,x:t.x,y:t.y};this._stopDash(t);this._clearArmor(t);t.air=t._airV=t._vx=t._vy=t.knockdown=t.recovery=0;t.stun=.15;t.action='sxGrab';}
      if(e.sxThunder&&isSX(a)&&!t.dead){const s=a.sasukeXiayin;s.phase=.18;a.x=clamp(t.x-a.facing*55,100,1180);a.y=t.y;s.follow='thunderSword';s.followTime=1.5;this._sxVisual(a,'blink',a.x,a.y,.4);this._sxLater(a,.15,()=>this._sxHit(a,'uppercut',e.cast,{damage:60,lift:430,width:240}));}
      return true;
    }
    _cpu(dt){
      const f=this.state.enemy;if(!isSX(f))return super._cpu(dt);if(this.mode==='training'||f.dead||this.state.player.dead)return;
      const s=f.sasukeXiayin,t=this.state.player;s.aiClock-=dt;
      if((f.stun>0||f.air>0||f.sxGrab)&&f.hp<2100&&f.chakra>=1&&!f.cooldowns.space){this._action(f,'space');return;}
      const dx=t.x-f.x,dy=t.y-f.y;this._move(f,Math.abs(dx)>150?Math.sign(dx):0,Math.abs(dy)>20?Math.sign(dy):0,dt);if(s.aiClock>0)return;s.aiClock=.3;
      if(s.pending){this._action(f,s.aiStep++%2?'j':'o');return;}
      if(s.follow&&s.followTime>0){if(s.follow==='senbon'&&f.chakra>=4)this._action(f,'o');else this._action(f,'j');return;}
      if(f.actionTime>.02)return;if(f.chakra>=4&&Math.abs(dx)<380){this._sxUltimate(f,['Mountain','Fire','Kirin'][s.aiStep++%3]);return;}
      if(s.energy>=1&&Math.abs(dy)<90&&Math.abs(dx)<500){this._action(f,['uj','ij','io','uo'][s.aiStep++%4]);return;}if(Math.abs(dx)<200&&Math.abs(dy)<65)this._action(f,'j');
    }
  }
  g.ArenaEngine=SasukeXiayinEngine;
})(typeof window!=='undefined'?window:globalThis);
