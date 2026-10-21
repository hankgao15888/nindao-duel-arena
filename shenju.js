/* 神驹佑将：按官方动作说明编写的独立状态机。数值为离线版调校。 */
(function(global){
  'use strict';
  const Base=global.ArenaEngine, clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const isSJ=f=>f?.id==='madara-shenju', other=side=>side==='player'?'enemy':'player';
  const branches=['火戟钻击','陷阵','狂风','连环','乱舞'];
  const finishes=['','灭神斩','火焰戟','神烈驹','神鬼'];
  const fresh=()=>({energy:100,maxEnergy:100,branch:0,branchTime:0,follow:0,followTime:0,
    height:0,vy:0,jumps:0,airCombo:0,wushuang:0,wushuangMax:14,wushuangCombo:0,
    move:null,events:[],castId:0,queued:false,block:0,slideWindow:0});
  class ShenjuEngine extends Base{
    _fighter(profile,side,index){const f=super._fighter(profile,side,index);f.maxChakra=isSJ(f)?6:4;if(isSJ(f))f.shenju=fresh();return f;}
    action(key){if(isSJ(this.state.player)){if(this.state.status!=='playing')return false;return this._action(this.state.player,key===' '?'space':String(key).toLowerCase());}return super.action(key);}
    _resetReaction(f,invuln=0,kind=''){super._resetReaction(f,invuln,kind);if(isSJ(f)){const energy=f.shenju?.energy??100;f.shenju=fresh();f.shenju.energy=kind==='spawn'?100:energy;}f.burn=null;}
    _substitute(f,target){const ok=super._substitute(f,target);if(ok&&isSJ(f)){const s=f.shenju;this._sjCancel(f);s.height=s.vy=s.jumps=0;s.follow=s.followTime=0;}if(ok)f.burn=null;return ok;}
    _sjCancel(f){const s=f.shenju;s.events=[];s.move=null;s.queued=false;s.block=0;this._stopDash(f);this._clearArmor(f);for(const e of this.state.entities)if(e.ownerUid===f.uid&&e.sjAttached)e.life=0;}
    _sjStart(f,name,fx,duration,armor='skill'){
      this._sjCancel(f);const s=f.shenju;s.castId++;s.move={name,fx,duration,elapsed:0,id:s.castId};
      f.action=fx==='finisher'?'ultimate':fx==='basic'||fx==='airSlash'||fx==='wushuang'?'attack':'skill';f.actionTime=duration;
      f.armorKind=armor;f.armorTime=armor?duration:0;f.castType=fx;f.castName=name;
      this._event('cast',{fighter:f,name,type:'fire',ultimate:fx==='finisher'});
      if(!['basic','airSlash','wushuang','awakening','finisher'].includes(fx))this._effect('text',f.x,f.y-170-s.height,'#ffe1a1',.85,{text:name});
      return {ownerUid:f.uid,awardChakra:true,pointAwarded:false};
    }
    _sjLater(f,at,fn){f.shenju.events.push({at,fn});}
    _sjHit(f,fx,cast,props={}){
      return this._entity(f,{kind:'strike',type:'fire',sjFX:fx,sjAttached:true,
        x:f.x+f.facing*90,y:f.y,width:235,height:100,radius:115,life:.24,delay:0,
        damage:65,knockback:50,lift:180,stun:.46,color:'#ff8635',follow:true,offsetX:90,
        cast,burn:0,airReach:220,...props});
    }
    _sjSpend(f,cost){if(f.shenju.energy+1e-6<cost){if(f.side==='player')this._effect('text',f.x,f.y-120,'#ffca83',.6,{text:'能量不足'});return false;}f.shenju.energy=Math.max(0,f.shenju.energy-cost);return true;}
    _action(f,key){
      if(!isSJ(f))return super._action(f,key);
      const s=f.shenju,target=this.state[other(f.side)];
      if(f.dead||target.dead)return false;
      if(key==='space')return this._substitute(f,target);
      if(f.stun>0||f.air>0||f._airV>0||f.knockdown>0||f.recovery>0)return false;
      if(s.wushuang>0){
        if(key==='u'||key==='o')return this._sjFinish(f);
        if(key==='j'){if(f.actionTime>.04){s.queued=true;return true;}return this._sjWushuang(f);}
        if(key==='l'||key==='h'){if(f.cooldowns[key]>0)return false;this._sjCancel(f);f.actionTime=0;return super._action(f,key);}return false;
      }
      if(key==='i'){if(s.move?.fx==='finisher')return false;return this._sjJump(f);}
      if(key==='j'){
        if(s.height>0&&s.slideWindow>0&&s.jumps===1)return this._sjAir(f,true);
        if(f.actionTime>.04){if(s.move?.fx==='basic'||s.move?.fx==='airSlash'){s.queued=true;return true;}return false;}
        return s.height>0?this._sjAir(f):this._sjBasic(f);
      }
      if(key==='u'){
        if(s.height>0)return this._sjPlunge(f,false);
        if(s.follow&&s.followTime>0)return this._sjBranch(f,s.follow,true);
        if(f.actionTime>.04&&s.move?.fx!=='basic')return false;
        return this._sjBranch(f,s.branchTime>0?s.branch:0,false);
      }
      if(key==='o'){
        if(f.chakra<4||s.height>0||f.actionTime>.04)return false;
        f.chakra-=4;s.wushuang=s.wushuangMax;s.wushuangCombo=0;s.follow=s.followTime=0;
        this._sjStart(f,'无双 · 神驹佑将','awakening',.65,'adamant');
        this._entity(f,{kind:'area',type:'fire',sjFX:'awakening',damage:0,visualOnly:true,x:f.x,y:f.y,radius:180,life:.8});
        this._banner('',0);return true;
      }
      return super._action(f,key);
    }
    _sjBasic(f){
      const s=f.shenju;f.facing=this.state[other(f.side)].x>=f.x?1:-1;
      f.attackIndex=f._lastBasic<1.15?f.attackIndex%4+1:1;f._lastBasic=0;
      const n=f.attackIndex,dur=[0,.34,.53,.42,.65][n],cast=this._sjStart(f,`${n}A`,'basic',dur,'');cast.awardChakra=false;
      s.branch=n;s.branchTime=2.1;f.x=clamp(f.x+f.facing*16,100,1180);
      if(n===4){s.height=3;s.vy=300;s.jumps=1;}
      this._sjLater(f,n===4?.48:.1,()=>this._sjHit(f,n===3?'thrust':n===4?'slam':'slash',cast,{damage:32+n*4,isBasic:true,lift:n===1?0:n===3?470:n===4?350:280,burn:n===4?2.4:0,knockback:n===3?100:45}));
      if(n===2)this._sjLater(f,.3,()=>this._sjHit(f,'downslash',cast,{damage:27,isBasic:true,lift:200}));
      return true;
    }
    _sjBranch(f,n,second){
      const s=f.shenju;if(!this._sjSpend(f,second?15:20))return false;
      const fx=second?['','sweep','firegrab','horse','eruption'][n]:['drill','charge','whirl','pierce','vortex'][n];
      const dur=second?[0,.7,1.65,1,.85][n]:[.68,.46,.9,.82,1.05][n];
      const cast=this._sjStart(f,second?finishes[n]:branches[n],fx,dur,n===4&&!second?'adamant':'skill');
      s.follow=second?0:n;s.followTime=second?0:dur+1.5;s.branch=0;s.branchTime=0;
      if(fx==='drill'||fx==='charge'){
        f._dashTime=fx==='drill'?.44:.28;f._dashVX=f.facing*(fx==='drill'?620:790);
        this._sjLater(f,.06,()=>this._sjHit(f,fx,cast,{damage:fx==='drill'?104:80,life:.38,width:225,lift:260,burn:fx==='drill'?3:0,knockback:155}));
      }else if(fx==='whirl'||fx==='vortex'){
        f._dashTime=fx==='whirl'?.65:0;f._dashVX=f.facing*260;
        if(fx==='vortex')s.block=.8;
        for(let i=0;i<4;i++)this._sjLater(f,.1+i*.2,()=>this._sjHit(f,fx,cast,{damage:33,width:fx==='vortex'?370:270,radius:170,offsetX:fx==='vortex'?0:70,pull:fx==='vortex',lift:135,knockback:0}));
      }else if(fx==='pierce'){
        for(let i=0;i<4;i++)this._sjLater(f,.08+i*.17,()=>this._sjHit(f,'pierce',cast,{damage:35,width:300,offsetX:130,knockback:30,lift:120}));
      }else if(fx==='sweep'){
        f._dashTime=.18;f._dashVX=f.facing*500;
        this._sjLater(f,.18,()=>this._sjHit(f,'sweep',cast,{width:480,radius:240,offsetX:40,damage:165,lift:360,burn:2.5,height:140,knockback:210}));
      }else if(fx==='firegrab'){
        f._dashTime=.27;f._dashVX=f.facing*680;
        this._sjLater(f,.18,()=>this._sjHit(f,'upslash',cast,{damage:55,grab:true,lift:420,knockback:0,stun:1}));
        this._sjLater(f,.72,()=>this._sjHit(f,'slam',cast,{damage:70,groundSweep:true,lift:200,knockback:0,width:260}));
        this._sjLater(f,1.08,()=>this._sjHit(f,'firewave',cast,{damage:115,offsetX:220,width:510,height:145,life:.48,lift:320,burn:3.4,groundSweep:true,knockback:230}));
      }else if(fx==='horse'){
        this._sjLater(f,.3,()=>this._sjHit(f,'horse',cast,{kind:'projectile',sjAttached:false,follow:false,
          x:f.x+f.facing*90,width:195,radius:95,height:130,vx:f.facing*680,life:1.08,damage:140,lift:310,burn:3,knockback:190,explode:true}));
      }else if(fx==='eruption'){
        this._sjLater(f,.32,()=>this._sjHit(f,'eruption',cast,{kind:'area',radius:240,width:480,height:150,damage:185,lift:440,burn:3,groundSweep:true,life:.42,offsetX:100}));
      }
      return true;
    }
    _sjJump(f){
      const s=f.shenju;if(s.jumps>=2||f.cooldowns.i>0||!this._sjSpend(f,s.height>0?16:18))return false;
      const second=s.height>0||s.move?.fx==='basic'&&f.attackIndex===4&&s.move.elapsed>.2;
      this._sjStart(f,second?'二段跃空':'跃空','jump',.16,'');s.jumps=second?2:1;s.height=Math.max(3,s.height);s.vy=second?490:520;s.airCombo=0;s.slideWindow=second?0:.2;f.cooldowns.i=.2;
      if(!second){f.invuln=Math.max(f.invuln,.2);f.invulnKind='jump';}
      this._entity(f,{kind:'area',type:'fire',sjFX:'jump',visualOnly:true,damage:0,x:f.x,y:f.y,radius:75,life:.35});return true;
    }
    _sjAir(f,rising=false){
      const s=f.shenju;if(s.jumps===2)return this._sjPlunge(f,true);
      s.airCombo=rising?0:s.airCombo%4+1;s.slideWindow=0;
      if(s.airCombo===4)return this._sjPlunge(f,false,true);
      const cast=this._sjStart(f,rising?'跃空 · 上撩':`空中 ${s.airCombo}A`,'airSlash',.27,'');cast.awardChakra=false;
      s.vy=Math.max(s.vy,70);this._sjLater(f,.04,()=>this._sjHit(f,'upslash',cast,{isBasic:true,damage:rising?47:35,lift:300,airReach:300,airHeight:s.height}));return true;
    }
    _sjPlunge(f,grab=false,fromBasic=false){
      const s=f.shenju;if(s.move?.fx==='plunge')return false;
      if(!grab&&!fromBasic&&!this._sjSpend(f,20))return false;
      this._sjStart(f,grab?'二段跳 · 戟阵':fromBasic?'空中 4A · 砸地':'飞戟 · 下戳','plunge',.7,grab?'adamant':'skill');
      s.move.grab=grab;s.move.fromBasic=fromBasic;s.move.impact=false;s.vy=-760;s.slideWindow=0;return true;
    }
    _sjLand(f){
      const s=f.shenju;s.height=s.vy=s.jumps=s.airCombo=0;
      if(s.move?.fx==='plunge'&&!s.move.impact){
        s.move.impact=true;const grab=s.move.grab,fromBasic=s.move.fromBasic;
        this._sjHit(f,grab?'spears':'slam',{ownerUid:f.uid,awardChakra:!fromBasic&&!grab,pointAwarded:false},
          {kind:'area',radius:grab?180:140,width:360,height:135,offsetX:35,damage:grab?145:fromBasic?65:125,grab,groundSweep:true,lift:grab?360:270,burn:2.2,life:.38,isBasic:fromBasic});
        if(fromBasic){s.branch=4;s.branchTime=2.1;}f.actionTime=.2;s.move.duration=s.move.elapsed+.2;
      }
    }
    _sjWushuang(f){
      const s=f.shenju;s.wushuangCombo=s.wushuangCombo%9+1;f.attackIndex=s.wushuangCombo;
      const cast=this._sjStart(f,`无双 · ${s.wushuangCombo}斩`,'wushuang',.25,'adamant');cast.awardChakra=false;
      this._sjLater(f,.055,()=>this._sjHit(f,s.wushuangCombo===9?'eruption':s.wushuangCombo%3===0?'thrust':'sweep',cast,
        {damage:s.wushuangCombo===9?95:43,width:340,height:125,offsetX:95,lift:s.wushuangCombo===9?420:160,burn:3,breakArmor:true,knockback:20,groundSweep:true}));return true;
    }
    _sjFinish(f){
      const s=f.shenju;if(s.wushuang<=0||s.move?.fx==='finisher')return false;
      const bonus=f.chakra*25+s.energy*.7;s.wushuang=0;s.energy=0;f.chakra=0;s.height=s.vy=s.jumps=0;
      const cast=this._sjStart(f,'无双终式 · 须佐长戟','finisher',2.8,'adamant');cast.awardChakra=false;
      const target=this.state[other(f.side)];const x=clamp(f.x+f.facing*210,150,1130),y=f.y;
      this._entity(f,{kind:'area',sjFX:'finisher',type:'summon',visualOnly:true,damage:0,x,y,radius:290,life:2.8,facing:f.facing});
      this._sjLater(f,.18,()=>this._sjHit(f,'upslash',cast,{x,y,follow:false,sjAttached:true,damage:50,lift:440,stun:1,grab:true,width:360,height:145,isUltimate:true,knockback:0}));
      for(const at of [.7,1.15,1.6])this._sjLater(f,at,()=>this._sjHit(f,'rocks',cast,{x,y,follow:false,sjAttached:true,kind:'area',radius:220,height:180,damage:35,lift:220,grab:true,groundSweep:true,stun:.7,knockback:0,isUltimate:true}));
      this._sjLater(f,2.15,()=>this._sjHit(f,'judgment',cast,{x,y,follow:false,sjAttached:true,kind:'area',radius:295,height:200,damage:260+bonus,lift:420,stun:.8,isUltimate:true,groundSweep:true,grab:true,burn:3,knockback:270,life:.4}));
      this._banner('神驹佑将 · 无双终式',1);return true;
    }
    _tickFighter(f,dt){
      super._tickFighter(f,dt);
      if(f.burn&&!f.dead){const burn=f.burn;burn.time-=dt;burn.tick-=dt;if(burn.tick<=0){burn.tick=.5;
        if(f.invuln<=0){const damage=5;f.hp=Math.max(0,f.hp-damage);this._effect('text',f.x,f.y-105-f.air,'#ff944a',.35,{text:`灼烧 −${damage}`});
          const owner=this.state[burn.owner];if(isSJ(owner)&&owner.shenju.wushuang>0)owner.shenju.energy=clamp(owner.shenju.energy+2,0,100);
          if(!f.hp)this._defeat(f,'burn');}}
        if(burn.time<=0)f.burn=null;}
      if(!isSJ(f)||f.dead)return;
      const s=f.shenju;
      s.branchTime=Math.max(0,s.branchTime-dt);if(!s.branchTime)s.branch=0;
      s.followTime=Math.max(0,s.followTime-dt);if(!s.followTime)s.follow=0;
      s.slideWindow=Math.max(0,s.slideWindow-dt);s.block=Math.max(0,s.block-dt);
      if(s.wushuang>0){s.wushuang=Math.max(0,s.wushuang-dt);if(!s.wushuang)this._effect('text',f.x,f.y-130,'#e9c294',.7,{text:'无双结束'});}
      else s.energy=Math.min(100,s.energy+9*dt);
      if(s.height>0||s.vy>0){s.height=Math.max(0,s.height+s.vy*dt);s.vy-=940*dt;
        if(s.height>240){s.height=240;s.vy=Math.min(0,s.vy);}if(s.height===0)this._sjLand(f);}
      if(f.stun>0||f.air>0||f.knockdown>0||f.recovery>0){this._sjCancel(f);s.height=s.vy=s.jumps=0;return;}
      if(s.move){s.move.elapsed+=dt;for(const event of [...s.events]){event.at-=dt;if(event.at<=0){s.events.splice(s.events.indexOf(event),1);event.fn();}}
        if(s.move.elapsed>=s.move.duration){s.move=null;s.events=[];f.actionTime=0;this._clearArmor(f);if(s.queued){s.queued=false;this._action(f,'j');}}
      }
    }
    _move(f,x,y,dt){
      if(!isSJ(f))return super._move(f,x,y,dt);
      const s=f.shenju;if(f.dead||f.stun>0||f.air>0||f.knockdown>0||f.recovery>0)return;
      const fx=s.move?.fx,canAir=s.height>0,canY=['whirl','horse','eruption'].includes(fx),canCombo=fx==='wushuang'&&[4,7].includes(s.wushuangCombo);
      if(canAir||canY||canCombo){const len=Math.max(1,Math.hypot(x,y));f.y=clamp(f.y+y/len*190*dt,400,590);if(canAir||canCombo)f.x=clamp(f.x+x/len*280*dt,100,1180);return;}
      if(s.wushuang>0&&f.actionTime<=0){const len=Math.max(1,Math.hypot(x,y));f.x=clamp(f.x+x/len*340*dt,100,1180);f.y=clamp(f.y+y/len*205*dt,400,590);if(x)f.facing=Math.sign(x);if(Math.abs(x)+Math.abs(y)>.05){f.action='run';f.walk+=dt*10;}return;}
      return super._move(f,x,y,dt);
    }
    _collides(e,target){if(e.visualOnly)return false;if(isSJ(target)&&target.shenju.height>(e.airReach||115))return false;return super._collides(e,target);}
    _hit(attacker,target,e){
      if(e.visualOnly)return false;
      if(isSJ(target)&&target.shenju.block>0&&!e.grab&&!e.isUltimate){if(target.invuln>0||target.dead)return false;this._effect('spark',target.x,target.y-65,'#fff0bd',.18,{radius:50});this._effect('text',target.x,target.y-140,'#ffe2a7',.35,{text:'格挡'});return true;}
      const health=target.hp,point=attacker.chakra,unawarded=e.cast?.awardChakra&&!e.cast.pointAwarded;
      const applied={...e,damage:e.damage*(isSJ(target)&&target.shenju.wushuang>0?.75:1)};
      if((e.grab||e.breakArmor)&&target.invuln<=0)this._clearArmor(target);
      if(e.groundSweep&&target.knockdown>0&&target.invuln<=0)target.knockdown=0;
      const hit=super._hit(attacker,target,applied);
      if(!hit)return false;
      if(isSJ(attacker)&&unawarded&&e.cast.pointAwarded)attacker.chakra=Math.min(6,point+1);
      if(e.burn>0&&target.hp>0)target.burn={time:e.burn,tick:.5,owner:attacker.side};
      if(isSJ(attacker)&&attacker.shenju.wushuang>0&&target.hp<health)attacker.shenju.energy=clamp(attacker.shenju.energy+7,0,100);
      if(isSJ(target)&&target.action==='hurt'){const h=target.shenju.height;this._sjCancel(target);target.shenju.height=target.shenju.vy=target.shenju.jumps=0;if(h>0){target.air=h;target._airV=Math.max(target._airV,100);target._launched=true;}}
      return true;
    }
    _tickEntities(dt){
      const horses=this.state.entities.filter(e=>e.explode&&e.life>0);super._tickEntities(dt);
      for(const e of horses)if(e.life<=0){const f=this.state.teams[e.owner].find(x=>x.uid===e.ownerUid);if(f&&!f.dead){
        this._entity(f,{kind:'strike',sjFX:'horse',x:clamp(e.x,80,1200),y:e.y,life:.25,visualOnly:true,damage:0});
        this._sjHit(f,'horseburst',e.cast,{kind:'area',x:clamp(e.x,80,1200),y:e.y,follow:false,sjAttached:false,radius:170,height:145,damage:70,lift:350,burn:2.5,life:.4});}}
    }
    _cpu(dt){
      const f=this.state.enemy;if(!isSJ(f))return super._cpu(dt);
      if(this.mode==='training'||f.dead||this.state.player.dead)return;
      const s=f.shenju,t=this.state.player;this._aiTimer-=dt;
      if(f.stun>0||f.air>0||f.knockdown>0||f.recovery>0){if(f.hp<2200&&f.chakra>0&&!f.cooldowns.space)this._substitute(f,t);return;}
      this._move(f,Math.abs(t.x-f.x)>125?Math.sign(t.x-f.x):0,Math.abs(t.y-f.y)>15?Math.sign(t.y-f.y):0,dt);
      if(this._aiTimer>0)return;this._aiTimer=this.difficulty==='easy'?.55:.28;
      if(s.wushuang>0){this._action(f,s.wushuang<3?'u':'j');return;}
      if(s.followTime>0){this._action(f,'u');return;}
      if(s.height>0){this._action(f,s.jumps===1&&s.height>80&&s.energy>25?'i':'j');return;}
      if(f.actionTime>.04)return;
      if(f.chakra>=4){this._action(f,'o');return;}
      if(Math.abs(t.x-f.x)<270){if(s.branch&&s.energy>=20&&f.attackIndex>=3)this._action(f,'u');else this._action(f,'j');}
      else if(s.energy>=20&&Math.abs(t.y-f.y)<65)this._action(f,'u');
    }
  }
  global.ShenjuRules={branches,finishes};global.ArenaEngine=ShenjuEngine;
})(window);
