/* 忍战带土：神威和子技能使用独立状态，避免把虚化当作普通硬体。 */
(function(global){
  'use strict';
  const Base=global.ArenaEngine,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),isOB=f=>f?.id==='obito-war',other=s=>s==='player'?'enemy':'player';
  let serial=20000;
  const fresh=()=>({move:null,events:[],queued:false,height:0,vy:0,phase:0,phaseAge:10,perfect:0,
    unlock:0,qUsed:false,eUsed:false,woodWindow:0,woodCast:null,airFollow:0,
    subHit:0,subUid:'',comboReady:0,pocket:null,aim:{x:0,y:0},phaseMove:false});
  class ObitoEngine extends Base{
    _fighter(profile,side,index){const f=super._fighter(profile,side,index);if(isOB(f))f.obito=fresh();return f;}
    setButtonHeld(key,value){super.setButtonHeld(key,value);this._obButtons=this._obButtons||{};this._obButtons[key]=!!value;}
    action(key){if(isOB(this.state.player)){if(this.state.status!=='playing')return false;return this._action(this.state.player,key===' '?'space':String(key).toLowerCase());}return super.action(key);}
    _obCancel(f){const s=f.obito;s.events=[];s.move=null;s.queued=false;s.phaseMove=false;this._stopDash(f);this._clearArmor(f);for(const e of this.state.entities)if(e.ownerUid===f.uid&&e.obAttached)e.life=0;}
    _obRelease(target,launch=true){
      if(!target?.inKamui)return;const info=target.inKamui,owner=this.state?.teams?.[info.owner]?.find(f=>f.uid===info.ownerUid);
      target.inKamui=null;if(owner?.obito)owner.obito.pocket=null;
      if(target.dead)return;
      if(owner&&target.action!=='substitute'){target.x=clamp(owner.x+owner.facing*175,110,1170);target.y=owner.y;}
      target.stun=0;target._vx=target._vy=target.knockdown=target.recovery=0;
      if(target.action!=='substitute'){target.action=launch?'hurt':'idle';target.actionTime=launch?.25:0;target.air=launch?45:0;target._airV=launch?230:0;target._launched=launch;}
      if(owner)this._obVisual(owner,'portal',target.x,target.y-55,.5,{radius:85});
    }
    _resetReaction(f,invuln=0,kind=''){
      if(f.inKamui)this._obRelease(f,false);
      if(isOB(f)){const target=this.state?.[other(f.side)];if(target?.inKamui?.ownerUid===f.uid)this._obRelease(target,false);f.obito=fresh();}
      f.obRoot=null;super._resetReaction(f,invuln,kind);
    }
    _substitute(f,target){const ok=super._substitute(f,target);if(ok){this._obRelease(f,false);f.obRoot=null;if(isOB(f)){this._obCancel(f);f.obito.height=f.obito.vy=f.obito.phase=0;}}return ok;}
    _obStart(f,name,fx,duration,armor='skill'){
      this._obCancel(f);const s=f.obito;s.move={id:++serial,name,fx,duration,elapsed:0};f.action=fx==='jubi'||fx==='dimensionPalm'?'ultimate':fx==='basic'?'attack':'skill';f.actionTime=duration;f.castType='genjutsu';f.castName=name;f.armorKind=armor;f.armorTime=armor?duration:0;
      this._event('cast',{fighter:f,name,type:fx.includes('Fire')||fx==='fire'?'fire':'genjutsu',ultimate:f.action==='ultimate'});
      if(!['basic','jubi','dimensionPalm'].includes(fx))this._effect('text',f.x,f.y-155-s.height,'#e8d7fb',.65,{text:name});
      return {ownerUid:f.uid,awardChakra:true,pointAwarded:false};
    }
    _obLater(f,time,fn){f.obito.events.push({time,fn});}
    _obHit(f,fx,cast,props={}){return this._entity(f,{kind:'strike',type:'genjutsu',obFX:fx,obAttached:true,x:f.x+f.facing*85,y:f.y,
      width:235,height:105,radius:110,life:.25,damage:65,knockback:65,lift:230,stun:.45,
      color:'#b1a0d5',follow:true,offsetX:85,cast,airReach:230,...props});}
    _obVisual(f,fx,x,y,life,props={}){return this._entity(f,{kind:'area',type:'genjutsu',obFX:fx,x,y,life,radius:120,visualOnly:true,damage:0,...props});}
    _obAim(f){const aim=this._direction(f);this._face(f);return aim;}
    _action(f,key){
      if(!isOB(f)){if(f.inKamui&&key!=='space')return false;return super._action(f,key);}
      const s=f.obito,target=this.state[other(f.side)];if(f.dead||target.dead)return false;
      if(key==='space')return this._substitute(f,target);
      if(f.inKamui||f.captured||f.obRoot||f.stun>0||f.air>0||f._airV>0||f.knockdown>0||f.recovery>0)return false;
      if(key==='i'){
        if(f.cooldowns.i>0||s.move?.fx==='jubi'||s.move?.fx==='dimensionPalm')return false;
        this._obStart(f,'神威 · 虚化','phase',.22,'');f.cooldowns.i=11;s.phase=.5;s.phaseAge=0;s.perfect=0;s.unlock=5;s.qUsed=s.eUsed=false;s.airFollow=2.6;return true;
      }
      if(s.phaseMove)return false;
      if((target.invuln>0&&target.invulnKind!=='hit')||target.obito?.phase>0){s.subHit=s.comboReady=0;}
      if(key==='q'||key==='e'){
        if(s.unlock<=0||s[key+'Used']||f.actionTime>.035&&s.move?.fx!=='phase')return false;
        s[key+'Used']=true;this._obStart(f,key==='q'?'神威 · 突进':'神威 · 坠落','subPrepare',.2,'');s.phase=Math.max(s.phase,.22);
        this._obLater(f,.18,()=>{const held=this._onlineButtons?!!this._onlineButtons[f.side]?.[key]:(f.side==='enemy'?false:!!this._obButtons?.[key]);this._obSub(f,key,held);});return true;
      }
      if(key==='u'&&s.comboReady>0&&s.perfect>0){return this._obCombo(f,false);}
      if(key==='o'&&s.comboReady>0&&s.perfect>0){if(f.chakra<4)return false;return this._obCombo(f,true);}
      if(key==='j'&&s.pocket){this._obRelease(target,true);return true;}
      if(key==='u'&&s.pocket){this._obRelease(target,true);if(f.cooldowns.u>0)return true;}
      if(key==='j'&&s.subHit>0&&s.subUid===target.uid){this._obPocket(f,target,2.4);s.subHit=0;this._obStart(f,'神威 · 吸入时空间','absorb',.4,'');return true;}
      if(key==='u'){
        if(s.woodWindow>0)return this._obFire(f);
        if(f.cooldowns.u>0||f.actionTime>.035&&s.move?.fx!=='phase')return false;return this._obWood(f);
      }
      if(f.actionTime>.035){if(key==='j'&&s.move?.fx==='basic'){s.queued=true;return true;}return false;}
      if(key==='j')return this._obBasic(f);
      if(key==='o'){
        if(f.chakra<4)return false;f.chakra-=4;s.height=s.vy=0;const cast=this._obStart(f,'通灵术 · 十尾','jubi',3.4,'adamant');cast.awardChakra=false;
        const x=clamp(f.x+f.facing*245,230,1050),y=f.y;this._obVisual(f,'jubi',x,y,3.4,{radius:330,obAttached:true});
        for(let i=0;i<5;i++)this._obLater(f,.9+i*.3,()=>this._obHit(f,'shock',cast,{kind:'area',x,y,follow:false,radius:300,height:200,damage:49,lift:270,knockback:0,stun:.6,isUltimate:true,groundSweep:true,life:.2}));
        this._obLater(f,2.65,()=>this._obHit(f,'cataclysm',cast,{kind:'area',x,y,follow:false,radius:340,height:220,damage:275,lift:420,knockback:240,stun:.8,isUltimate:true,groundSweep:true,life:.5}));this._banner('通灵术 · 十尾',.75);return true;
      }
      return super._action(f,key);
    }
    _obBasic(f){
      const s=f.obito,t=this.state[other(f.side)];this._face(f,t);f.attackIndex=f._lastBasic<1.1?f.attackIndex%6+1:1;f._lastBasic=0;
      const n=f.attackIndex,cast=this._obStart(f,`${n}A`,'basic',[0,.3,.34,.57,.48,.38,.65][n],'');cast.awardChakra=false;
      if(n===4||n===6){s.phase=Math.max(s.phase,.2);this._obVisual(f,'portal',f.x,f.y-70,.45,{radius:65});
        this._obLater(f,.12,()=>{if(Math.abs(t.x-f.x)<330){f.x=clamp(t.x+(n===4?70:-100)*f.facing,110,1170);f.y=t.y;this._face(f,t);}else f.x=clamp(f.x+f.facing*120,110,1170);});}
      this._obLater(f,n===4||n===6?.23:.08,()=>this._obHit(f,n===2||n===3?'shuriken':n===5?'woodFist':n===6?'chain':'kick',cast,
        {damage:28+n*3,isBasic:true,lift:n===1||n===2?0:n===3?470:n===6?380:300,knockback:n===6?170:35,width:n===6?330:n===5?280:220,offsetX:n===5?125:80}));
      if(n===3)this._obLater(f,.34,()=>this._obHit(f,'shuriken',cast,{damage:23,isBasic:true,lift:330,width:245}));return true;
    }
    _obWood(f){
      const s=f.obito;this._obAim(f);f.cooldowns.u=10;
      const cast=this._obStart(f,'木遁 · 扦插之术','wood',.65);s.woodCast=cast;s.woodWindow=3.2;
      if(s.airFollow>0){s.height=105;s.vy=70;}
      this._obVisual(f,'woodBranches',f.x-f.facing*18,f.y,.7,{obAttached:true});
      this._obLater(f,.12,()=>{for(let i=-1;i<=1;i++)this._obHit(f,'woodSpike',cast,{kind:'projectile',x:f.x+f.facing*65,y:f.y+i*19,follow:false,obAttached:false,
        width:105,radius:45,height:85,vx:f.facing*690,vy:i*12,life:1.1,damage:i===0?85:27,lift:0,knockback:0,root:1.45,stun:.55,color:'#bead84'});});return true;
    }
    _obFire(f){
      const s=f.obito;if(s.move?.fx==='wood'&&s.move.elapsed<.12)return false;this._obAim(f);const cast=s.woodCast||{ownerUid:f.uid,awardChakra:true,pointAwarded:false};s.woodWindow=0;
      this._obStart(f,'火遁 · 爆风乱舞','fire',.85);if(s.airFollow>0){s.height=Math.max(85,s.height);s.vy=35;}
      this._obLater(f,.13,()=>this._obHit(f,'spiralFire',cast,{kind:'projectile',follow:false,obAttached:false,x:f.x+f.facing*95,y:f.y,vx:f.facing*510,
        radius:95,width:190,height:150,life:1.3,damage:135,lift:270,knockback:140,burn:2.5,ignite:true,type:'fire',color:'#ff9c4b'}));return true;
    }
    _obSub(f,key,held){
      const s=f.obito;this._obAim(f);const drop=key==='e';const cast=this._obStart(f,held?(drop?'虚化 · 坠落':'虚化 · 突进'):(drop?'神威 · 黑棒坠击':'神威 · 黑棒贯穿'),held?(drop?'voidDrop':'voidDash'):(drop?'subDrop':'subDash'),drop?.95:.65,held?'':'skill');
      if(held){s.phase=Math.max(s.phase,drop?.95:.65);s.phaseMove=true;}
      else s.phase=0;
      if(drop){s.height=180;s.vy=0;f.x=clamp(f.x+f.facing*180,110,1170);this._obVisual(f,'portal',f.x,f.y-210,.55,{radius:75});
        this._obLater(f,.32,()=>{s.height=35;if(!held)this._obHit(f,'blackRods',cast,{kind:'area',radius:150,width:300,height:145,offsetX:35,damage:145,lift:340,stun:.8,grab:true,obSub:true,groundSweep:true,life:.3});});
        this._obLater(f,.6,()=>{s.height=s.vy=0;});
      }else{f._dashTime=.43;f._dashVX=f.facing*720;this._obVisual(f,'portal',f.x,f.y-65,.4,{radius:70});
        if(!held)this._obLater(f,.06,()=>this._obHit(f,'blackRod',cast,{damage:135,lift:340,grab:true,obSub:true,life:.42,width:185,follow:true,offsetX:70,knockback:80}));}
    }
    _obPocket(f,target,time){
      if(target.dead)return;if(target.inKamui)this._obRelease(target,false);
      if(target.captured)this._xyRelease(target);target.obRoot=null;
      target.inKamui={owner:f.side,ownerUid:f.uid,time,maxTime:time};f.obito.pocket=target.uid;
      this._stopDash(target);this._clearArmor(target);target.air=target._airV=target._vx=target._vy=target.knockdown=target.recovery=0;target.stun=.2;target.action='kamui';target.actionTime=.2;
      if(target.xiayin){this._xyCancel(target);target.xiayin.height=target.xiayin.vy=0;}
      if(target.shenju){this._sjCancel(target);target.shenju.height=target.shenju.vy=0;}
      if(target.obito){this._obCancel(target);target.obito.height=target.obito.vy=0;}
      this._obVisual(f,'absorb',target.x,target.y-65,.75,{radius:110});
    }
    _obCombo(f,palm){
      const s=f.obito,target=this.state[other(f.side)];if(s.subUid!==target.uid||target.dead)return false;
      if(palm)f.chakra-=4;s.comboReady=s.subHit=s.perfect=0;
      this._obPocket(f,target,palm?2.1:1.95);
      const cast=this._obStart(f,palm?'神威 · 魔像巨掌':'神威 · 爆风乱舞',palm?'dimensionPalm':'dimensionFire',palm?2.1:1.95,'adamant');cast.awardChakra=false;
      const x=target.x,y=target.y;this._obVisual(f,palm?'dimensionPalm':'dimensionFire',x,y,palm?2.1:1.95,{obAttached:true,radius:270});
      if(palm){this._obLater(f,1.25,()=>this._obHit(f,'palmImpact',cast,{kind:'area',x,y,follow:false,radius:280,height:200,damage:430,lift:0,stun:0,knockback:0,isUltimate:true,allowVoid:true,life:.35}));}
      else for(let i=0;i<5;i++)this._obLater(f,.3+i*.27,()=>this._obHit(f,'spiralFire',cast,{kind:'area',x,y,follow:false,radius:235,height:170,damage:56,lift:0,knockback:0,type:'fire',allowVoid:true,burn:2,life:.17}));
      this._obLater(f,palm?1.9:1.75,()=>this._obRelease(target,true));return true;
    }
    _tickFighter(f,dt){
      super._tickFighter(f,dt);
      if(f.obRoot&&!f.dead){f.obRoot.time-=dt;if(f.obRoot.time<=0)f.obRoot=null;else if(!f.inKamui&&!f.captured){f._vx=f._vy=0;f.stun=Math.max(f.stun,.14);f.action='hurt';}}
      if(f.inKamui&&!f.dead){f.inKamui.time-=dt;const info=f.inKamui,owner=this.state.teams[info.owner].find(x=>x.uid===info.ownerUid);if(info.time<=0||!owner||owner.dead)this._obRelease(f,true);else{f.air=f._airV=f._vx=f._vy=f.knockdown=f.recovery=0;f.stun=.2;f.actionTime=.2;f.action='kamui';}}
      if(!isOB(f)||f.dead)return;const s=f.obito;
      for(const key of ['phase','perfect','unlock','woodWindow','airFollow','subHit','comboReady'])s[key]=Math.max(0,s[key]-dt);s.phaseAge+=dt;
      if(f.inKamui||f.captured||f.obRoot||f.stun>0||f.air>0||f.knockdown>0||f.recovery>0){this._obCancel(f);s.height=s.vy=0;return;}
      if(s.height>0&&!['voidDrop','subDrop'].includes(s.move?.fx)){s.height=Math.max(0,s.height+s.vy*dt);s.vy-=490*dt;if(s.height>150){s.height=150;s.vy=Math.min(0,s.vy);}if(!s.height)s.vy=0;}
      if(s.move){const move=s.move;move.elapsed+=dt;
        for(const event of [...s.events]){if(s.move!==move)break;event.time-=dt;if(event.time<=0){s.events.splice(s.events.indexOf(event),1);event.fn();}}
        if(s.move===move&&move.elapsed>=move.duration){s.move=null;s.events=[];s.phaseMove=false;f.actionTime=0;this._clearArmor(f);if(s.queued){s.queued=false;this._action(f,'j');}}}
    }
    _move(f,x,y,dt){
      if(f.inKamui||f.obRoot)return;
      if(!isOB(f))return super._move(f,x,y,dt);f.obito.aim={x,y};if(f.dead||f.captured||f.stun>0||f.air>0||f.knockdown>0||f.recovery>0)return;
      if(f.obito.height>0&&['wood','fire','subDrop','voidDrop'].includes(f.obito.move?.fx)){f.y=clamp(f.y+y*145*dt,400,590);return;}
      return super._move(f,x,y,dt);
    }
    _collides(e,target){if(e.visualOnly||target.inKamui&&!e.allowVoid)return false;if(isOB(target)&&target.obito.height>(e.airReach||115))return false;return super._collides(e,target);}
    _hit(attacker,target,e){
      if(target.inKamui&&!e.allowVoid)return false;
      if(isOB(target)&&target.obito.phase>0&&!target.dead){const s=target.obito;
        if(s.phaseAge<=.14&&!s.perfect){s.perfect=5;s.phase=Math.max(s.phase,1.05);this._effect('text',target.x,target.y-155,'#e2b2ff',.8,{text:'神威 · 完美闪避'});this._obVisual(target,'perfect',target.x,target.y-60,.7,{radius:125});}
        return false;
      }
      const props={...e},rooted=e.ignite&&target.obRoot?.ownerUid===attacker.uid;
      if(e.grab&&target.invuln<=0)this._clearArmor(target);
      if(e.groundSweep&&target.knockdown>0&&target.invuln<=0)target.knockdown=0;
      if(rooted)props.damage=e.damage*1.65;
      const hit=super._hit(attacker,target,props);if(!hit)return false;
      if(isOB(attacker)&&e.obFX&&!e.visualOnly)this._obVisual(attacker,'hitBurst',target.x,target.y,.3,{radius:e.isUltimate?112:e.root?68:e.type==='fire'?95:72,hitColor:e.type==='fire'?'#ffca70':e.root?'#d6c7a1':'#d0bbf5',groundFX:!!(e.root||e.groundSweep)});
      if(e.root&&!target.dead){target.obRoot={ownerUid:attacker.uid,time:e.root};target.air=target._airV=target._vx=target._vy=0;target.stun=.2;}
      if(rooted&&!target.dead){target.obRoot=null;this._obHit(attacker,'fireExplosion',e.cast,{kind:'area',x:target.x,y:target.y,follow:false,obAttached:false,radius:155,height:150,damage:75,delay:.15,life:.35,lift:340,burn:2,type:'fire'});}
      if(e.obSub&&isOB(attacker)&&!target.dead){const s=attacker.obito;s.subHit=1.7;s.subUid=target.uid;if(s.perfect>0)s.comboReady=2.6;}
      if(target.inKamui&&!target.dead){target.air=target._airV=target._vx=target._vy=0;target.stun=.2;target.action='kamui';}
      if(isOB(target)&&target.action==='hurt'){const h=target.obito.height;this._obCancel(target);target.obito.height=target.obito.vy=0;if(h>0){target.air=h;target._airV=Math.max(100,target._airV);target._launched=true;}}
      return true;
    }
    _cpu(dt){
      const f=this.state.enemy;if(!isOB(f))return super._cpu(dt);if(this.mode==='training'||f.dead||this.state.player.dead)return;
      const s=f.obito,t=this.state.player;this._aiTimer-=dt;
      if(f.inKamui||f.captured||f.obRoot||f.stun>0||f.air>0||f.knockdown>0||f.recovery>0){if(f.chakra>=1&&!f.cooldowns.space&&f.hp<2400)this._substitute(f,t);return;}
      this._move(f,Math.abs(t.x-f.x)>135?Math.sign(t.x-f.x):0,Math.abs(t.y-f.y)>16?Math.sign(t.y-f.y):0,dt);
      if(this._aiTimer>0)return;this._aiTimer=this.difficulty==='easy'?.55:.26;
      if(s.comboReady>0){this._action(f,f.chakra>=4?'o':'u');return;}
      if(s.subHit>0||s.pocket){this._action(f,'j');return;}
      if(s.unlock>0&&!s.qUsed&&Math.abs(t.x-f.x)<400){this._action(f,'q');return;}
      if(f.actionTime>.03)return;
      if(f.chakra>=4){this._action(f,'o');return;}
      if(!f.cooldowns.i&&(Math.abs(t.x-f.x)<240||t.action==='skill')){this._action(f,'i');return;}
      if(s.woodWindow>0){this._action(f,'u');return;}
      if(!f.cooldowns.u&&Math.abs(t.x-f.x)<580){this._action(f,'u');return;}
      if(Math.abs(t.x-f.x)<200)this._action(f,'j');
    }
  }
  global.ArenaEngine=ObitoEngine;
})(window);
