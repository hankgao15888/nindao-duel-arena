/* 忍战带土：黑灰神威、木火螺旋、神威空间与十尾的分层特效。 */
(function(global){
  'use strict';
  const Base=global.ArenaRenderer,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const P=(c,ps,fill,stroke='#202532',w=2)=>{c.beginPath();ps.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}};
  const L=(c,ps,color,w=2)=>{c.beginPath();ps.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.lineWidth=w;c.strokeStyle=color;c.lineCap='round';c.lineJoin='round';c.stroke();};
  const O=(c,x,y,rx,ry,fill,stroke,w=2)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}};
  const fade=(color,a)=>color+Math.round(clamp(a,0,1)*255).toString(16).padStart(2,'0');
  class ObitoRenderer extends Base{
    portraitSVG(p){if(p.id!=='obito-war')return super.portraitSVG(p);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="obg" x2="1" y2="1"><stop stop-color="#847894"/><stop offset="1" stop-color="#24384a"/></linearGradient></defs><rect width="100" height="100" fill="url(#obg)"/><path d="M8 100 13 77 29 65 72 65 90 79 98 100" fill="#333b58" stroke="#172333" stroke-width="2"/><path d="M33 63 35 81 50 89 66 80 67 62" fill="#c2a68f"/><path d="M26 29 48 17 69 27 77 46 71 67 55 79 38 72 26 54Z" fill="#c6b09b" stroke="#25323c" stroke-width="2"/><path d="M23 51 17 35 23 31 20 20 31 22 36 11 44 16 52 6 59 17 71 11 71 24 83 26 78 38 78 51 69 40 66 30 53 35 39 27 29 40Z" fill="#2b323a" stroke="#15232c" stroke-width="2"/><path d="m31 44 13 2m15 0 12-2" stroke="#48434a" stroke-width="2"/><ellipse cx="39" cy="49" rx="3" ry="3.5" fill="#9a3443"/><ellipse cx="64" cy="49" rx="3.4" ry="3.7" fill="#b4a7d3" stroke="#6d638c" stroke-width=".8"/><circle cx="64" cy="49" r="1.6" fill="none" stroke="#5c5681" stroke-width=".7"/><path d="m29 52 7 5-3 4 8 5m-13-5 6 6m12-33-6 7 3 7m10 8-2 5 6 1m-11 7h12" stroke="#8d7d73" stroke-width="1.2" fill="none"/><path d="M20 100 18 73 34 66 39 85 55 90 69 83 72 66 84 74 83 100" fill="#3b425d" stroke="#172634" stroke-width="2"/><path d="m23 74 4 23m49-23-3 25" stroke="#626b85" stroke-width="1.5"/></svg>`;}
    fighter(c,f,t){
      if(f.inKamui){c.save();O(c,f.x,f.y+3,42,11,'#1b223333','#97b9d399',1.5);this.obPortal(c,f.x,f.y-45,t,30,.45);c.restore();return;}
      if(f.id!=='obito-war'){super.fighter(c,f,t);if(f.obRoot)this.obRoots(c,f.x,f.y,t);return;}
      const s=f.obito||{},m=s.move,fx=m?.fx||'',p=m?clamp(m.elapsed/m.duration,0,1):0,dir=f.facing||1;
      const air=(f.air||0)+(s.height||0),run=f.action==='run',hurt=f.action==='hurt',down=f.dead||f.knockdown>0,scale=.99+(f.y-400)/1700;
      c.save();O(c,f.x,f.y+4,35,9,'#20374355');const team=f.side==='enemy'?'#ff4856':'#3fa8ff';
      if(!f.dead){c.shadowColor=team;c.shadowBlur=9;O(c,f.x,f.y+3,44,12,team+'22',team,3.4);c.shadowBlur=0;O(c,f.x,f.y+3,37,9,null,'#d8f4ffb0',1);}
      if(s.phase>0){this.obAfterimage(c,f,t);this.obPortal(c,f.x,f.y-air-65,t,65,.62);}
      if(s.perfect>0){c.save();c.globalCompositeOperation='screen';for(let i=0;i<9;i++){const q=(t*.55+i/9)%1,a=i*2.4+t*1.5;O(c,f.x+Math.cos(a)*(37+q*15),f.y-air-q*150,2.5-q,5-q*3,fade('#d1a6ff',Math.sin(q*Math.PI)*.72));}c.restore();}
      c.translate(f.x,f.y-air);c.scale(dir*scale,scale);if(down){c.translate(0,-10);c.rotate(-1.4);c.globalAlpha=f.dead?.5:1;}else if(f.recovery>0)c.rotate(-1.4*f.recovery/.24);
      if(s.phase>0)c.globalAlpha*=.3+Math.sin(t*23)*.07;
      const gait=run?Math.sin(t*19):0,lean=['subDash','voidDash'].includes(fx)?.25:run?.18:hurt?-.15:0;c.rotate(lean);c.translate(0,run?Math.abs(gait)*2:Math.sin(t*3)*1.1);
      // Split indigo sleeveless robe, white sash, shin bandages and dark sandals.
      const wind=run?14:Math.sin(t*4)*3;
      P(c,[[-24,-88],[-31,-55],[-39-wind,-10],[-12,-12],[-2,-53],[12,-11],[35-wind,-12],[26,-58],[23,-89]],'#424966','#1b2639',2.2);
      P(c,[[-14,-65],[-17,-25],[0,-40],[16,-22],[15,-65]],'#242e43','#172331',1.5);
      const feet=air>5?[[-22,-15],[28,-28]]:[[-14-gait*24,-2],[17+gait*24,-2]];
      for(let i=0;i<2;i++){L(c,[[i?9:-9,-61],[feet[i][0]*.7,-29],feet[i]],'#27334b',15);L(c,[[feet[i][0]*.8,-23],feet[i]],'#bbbebd',10);for(let j=0;j<3;j++)L(c,[[feet[i][0]-6,-20+j*5],[feet[i][0]+4,-18+j*5]],'#6d7f87',1);P(c,[[feet[i][0]-7,feet[i][1]-5],[feet[i][0]+8,feet[i][1]-5],[feet[i][0]+14,feet[i][1]+2],[feet[i][0]-8,feet[i][1]+2]],'#1e2e44','#132433',1.5);}
      P(c,[[-22,-119],[-29,-109],[-22,-76],[0,-67],[22,-76],[28,-110],[19,-119]],'#444c69','#1d2a3b',2.2);
      P(c,[[-23,-128],[-26,-108],[-12,-96],[11,-96],[26,-109],[22,-128]],'#39425e','#18283a',1.7);L(c,[[-20,-122],[-20,-110],[-10,-101]],'#7b8499',1.5);
      P(c,[[-25,-79],[24,-80],[26,-69],[-24,-68]],'#c6c8c4','#697985',1.3);L(c,[[-22,-75],[21,-76]],'#f0e9d5',1.8);P(c,[[15,-70],[23,-70],[30,-48],[21,-51]],'#b1b7bd','#556b7a',1.3);
      this.obHead(c,0,-128,1,s.perfect>0);
      let left=[[-25,-110],[-33,-91],[-17,-78]],right=[[25,-111],[33,-89],[25,-76]];
      if(run){left=[[-25,-110],[-39,-104],[-52,-102]];right=[[25,-111],[12,-92],[-8,-85]];}
      if(['phase','subPrepare','jubi','dimensionPalm'].includes(fx)){left=[[-25,-110],[-19,-91],[-2,-100]];right=[[25,-111],[18,-91],[5,-103]];}
      if(['wood','fire','dimensionFire'].includes(fx)){left=[[-25,-110],[-25,-90],[-8,-85]];right=[[25,-111],[39,-101],[50,-103]];}
      if(['subDash','voidDash'].includes(fx)){right=[[25,-111],[42,-110],[65,-106]];}
      if(['subDrop','voidDrop'].includes(fx)){right=[[25,-111],[42,-84],[42,-52]];}
      if(fx==='basic'){right=[[25,-111],[37,-95],[f.attackIndex===5?70:46,-90]];}
      this.obArm(c,left,false);this.obArm(c,right,true);
      if(s.perfect>0){c.globalAlpha=.85;c.shadowColor='#bf79ff';c.shadowBlur=16;L(c,[[-23,-126],[-29,-108],[-24,-84]],'#d2a5ff',2.4);L(c,[[23,-126],[28,-107],[23,-83]],'#d9b3ff',2.4);L(c,[[-34,-15],[-39,-10],[-12,-12]],'#b58df2',2);}
      c.restore();if(f.obRoot)this.obRoots(c,f.x,f.y,t);
    }
    obHead(c,x,y,scale=1,purple=false){
      c.save();c.translate(x,y);c.scale(scale,scale);
      P(c,[[-12,-23],[0,-30],[13,-22],[16,-7],[9,5],[-2,11],[-13,3],[-17,-9]],'#c5ae99','#27323c',1.5);
      P(c,[[-16,-7],[-22,-21],[-16,-23],[-19,-31],[-8,-29],[-5,-38],[4,-32],[13,-38],[15,-28],[24,-27],[20,-17],[18,-6],[11,-17],[8,-24],[0,-19],[-9,-25],[-14,-16]],'#2a333c','#15242f',1.6);
      L(c,[[-11,-12],[-3,-11]],'#4a4350',1.6);L(c,[[5,-11],[13,-13]],'#4a4350',1.6);O(c,-6,-8,1.5,1.8,'#a94a5b');O(c,10,-8,1.7,1.9,'#b6a5d7','#5d6092',.5);O(c,10,-8,.8,1,null,'#65638b',.5);
      L(c,[[-13,-4],[-7,0],[-9,3],[-4,6]],'#8d7a71',.9);L(c,[[-14,-16],[-9,-18],[-7,-14]],'#8d7a71',.9);L(c,[[1,-4],[-1,1],[4,1]],'#9b8473',.8);L(c,[[0,5],[7,5]],'#8c6f6c',.8);
      if(purple){c.shadowColor='#a780e6';c.shadowBlur=6;L(c,[[6,-11],[13,-12]],'#c5b5f4',1);}
      c.restore();
    }
    obArm(c,pts,front){L(c,pts,'#273743',13);L(c,pts,front?'#c1ac98':'#a69b8b',9);const h=pts[2];O(c,h[0],h[1],5,6,'#cdb39c','#3d4a4c',1.1);L(c,[[h[0]-4,h[1]+4],[h[0]+4,h[1]+4]],'#e3dfd3',3);}
    obAfterimage(c,f,t){
      const fx=f.obito?.move?.fx||'',moving=['subDash','voidDash','subDrop','voidDrop'].includes(fx),dir=f.facing||1,air=(f.air||0)+(f.obito?.height||0);
      c.save();for(let i=3;i>0;i--){const trail=moving?i*29:i*9,x=f.x-dir*trail,y=f.y-air+(fx.includes('Drop')?-i*25:0);c.globalAlpha=(.16-i*.025)*(moving?1:.65);c.translate(x,y);P(c,[[-17,-120],[-29,-85],[-35,-13],[-8,-15],[0,-55],[13,-14],[32,-13],[24,-93],[17,-122]],'#9993c4',null);O(c,0,-139,17,24,'#a8a3ca');c.translate(-x,-y);}
      c.globalAlpha=1;c.globalCompositeOperation='screen';for(let i=0;i<7;i++){const q=(t*1.7+i*.137)%1,xx=f.x-dir*(18+q*(moving?145:45)),yy=f.y-air-25-i*17;L(c,[[xx,yy],[xx+dir*(14+q*24),yy+Math.sin(t*5+i)*5]],fade('#bab5f6',(1-q)*.42),1.2);}
      c.restore();
    }
    obBurst(c,x,y,t,p,r=100,color='#c8b8ff',ground=false){
      const a=Math.sin(Math.PI*clamp(p,0,1));if(a<=0)return;c.save();c.translate(x,y);c.globalCompositeOperation='screen';
      const glow=c.createRadialGradient(0,0,0,0,0,r*(.55+p*.7));glow.addColorStop(0,fade('#fff7df',a*.55));glow.addColorStop(.23,fade(color,a*.38));glow.addColorStop(1,fade(color,0));O(c,0,0,r*(.55+p*.7),r*(ground?.35:1)*(.55+p*.7),glow);
      O(c,0,0,r*(.18+p*.82),r*(ground?.22:1)*(.18+p*.82),null,fade(color,a*.8),4*(1-p)+.6);
      for(let i=0;i<14;i++){const angle=i*2.399+Math.sin(i*4)*.13,inner=r*(.15+p*.48),outer=inner+r*(.2+i%3*.07)*(1-p);L(c,[[Math.cos(angle)*inner,Math.sin(angle)*inner*(ground?.35:1)],[Math.cos(angle)*outer,Math.sin(angle)*outer*(ground?.35:1)]],fade(i%3?color:'#fff7e2',a*(.42+i%2*.22)),i%3?1.5:2.8);}
      c.restore();
    }
    obPortal(c,x,y,t,r=80,alpha=1){
      c.save();c.translate(x,y);c.globalAlpha*=alpha;c.scale(1,.83);
      const g=c.createRadialGradient(0,0,1,0,0,r*1.25);g.addColorStop(0,'#030915f5');g.addColorStop(.3,'#142137dd');g.addColorStop(.7,'#64708a44');g.addColorStop(1,'#a4b6ca00');O(c,0,0,r*1.25,r*1.25,g);
      for(let j=0;j<7;j++){const pts=[];for(let i=0;i<35;i++){const q=i/34,a=q*TAU*1.85+j*TAU/7+t*4.5,rr=q*r;pts.push([Math.cos(a)*rr,Math.sin(a)*rr]);}L(c,pts,j%2?'#aebed8a8':'#151f32df',j%2?2.1:8);}
      c.globalCompositeOperation='screen';for(let j=0;j<3;j++){c.beginPath();const a=t*(j%2?-1.4:1.2)+j*2.1;c.arc(0,0,r*(.72+j*.13),a,a+1.1+j*.15);c.strokeStyle=j===1?'#e4d6ffb8':'#9bb6d577';c.lineWidth=j===1?2:1;c.stroke();}
      for(let i=0;i<18;i++){const q=(t*.8+i*.0618)%1,a=i*2.4+t*2.2+q*4,rr=r*(1.18-q*.98),xx=Math.cos(a)*rr,yy=Math.sin(a)*rr,s=1.5+(1-q)*3.7;c.save();c.translate(xx,yy);c.rotate(a+.6);c.globalAlpha=alpha*Math.sin(q*Math.PI)*.75;P(c,[[-s*2,0],[s,-s*.5],[s*.6,s*.7]],i%3?'#a5b9d9':'#f0ddff',null);c.restore();}
      c.globalCompositeOperation='source-over';O(c,0,0,r*.13,r*.13,'#070d1c');O(c,0,0,r*.17,r*.17,null,'#c7c4e16b',1);c.restore();
    }
    obRoots(c,x,y,t){c.save();c.translate(x,y);O(c,0,3,53,12,'#3d382d44');for(let i=-2;i<=2;i++){const xx=i*13;P(c,[[xx-7,0],[xx-10,-26],[xx+Math.sin(i)*14,-85-i%2*15],[xx+5,-41],[xx+10,-7]],'#a59973','#53614a',1.6);L(c,[[xx,-6],[xx+Math.sin(i)*12,-70]],'#d7c59e',1.3);}for(let i=0;i<8;i++){const a=i*2.4+t*.7,xx=Math.cos(a)*(26+i*3),yy=-22-(t*21+i*11)%90;c.save();c.translate(xx,yy);c.rotate(a);O(c,0,0,4,1.7,'#9fbc6788');c.restore();}c.restore();}
    obFlame(c,x,y,t,r=120,dir=1){
      c.save();c.translate(x,y-65);c.scale(dir,1);
      const halo=c.createRadialGradient(-r*.4,0,3,-r*.4,0,r*1.45);halo.addColorStop(0,'#ffb84b36');halo.addColorStop(.6,'#f45d1a16');halo.addColorStop(1,'#5e252000');O(c,-r*.4,0,r*1.65,r*.75,halo);
      for(let i=0;i<7;i++){const q=(t*.6+i*.15)%1;O(c,-r*1.4+q*r*2,Math.sin(i*8)*r*.36,22+q*27,13+q*15,fade('#343140',(1-q)*.17));}
      c.shadowColor='#ff731c';c.shadowBlur=24;
      const base=[];for(let i=0;i<=40;i++){const q=i/40;base.push([-r*1.8+q*r*2.5,Math.sin(q*TAU*1.7-t*13)*r*.37*(.25+q*.7)]);}
      L(c,base,'#be3b20aa',43);L(c,base,'#ed6424',29);L(c,base,'#ffb23a',17);L(c,base,'#fff3ab',6.5);
      for(let j=0;j<2;j++){const pts=[];for(let i=0;i<=35;i++){const q=i/35;pts.push([-r*1.8+q*r*2.5,Math.sin(q*TAU*1.7-t*13+Math.PI+j*.2)*r*.33]);}L(c,pts,j?'#ffe18e':'#f77228',j?3:12);}
      c.shadowBlur=0;for(let i=0;i<13;i++){const q=(t*.7+i*.077)%1,xx=-r*1.7+q*r*2.4,yy=Math.sin(q*TAU*1.7-t*13)*r*.37*(.25+q*.7),a=q*10-t*4;P(c,[[xx-10,yy+4],[xx+Math.cos(a)*13,yy-21-i%3*5],[xx+13,yy+2]],i%2?'#ffb641cc':'#ffe697b8',null);}
      c.globalCompositeOperation='screen';for(let i=0;i<29;i++){const q=(t*1.3+i*.0618)%1,xx=q*r*2.5-r*1.8,yy=Math.sin(i*12)*r*(.45+q*.3)-q*24;L(c,[[xx,yy],[xx-6-i%4*3,yy+3+i%3]],fade(i%3?'#ffd477':'#fff8cb',Math.sin(q*Math.PI)*.83),1+i%3*.5);}
      c.restore();
    }
    obDimension(c,t){
      c.save();const sky=c.createLinearGradient(0,155,0,635);sky.addColorStop(0,'#071322fa');sky.addColorStop(.6,'#152c42f5');sky.addColorStop(1,'#253e4ff5');c.fillStyle=sky;c.fillRect(0,155,1280,480);
      for(let i=0;i<9;i++){const x=(i*173+t*8)%1430-75;L(c,[[640,315],[x,635]],'#7596b41a',1);L(c,[[0,420+i*i*3],[1280,420+i*i*3]],'#8ba5bb15',1);}
      for(let i=0;i<11;i++){const x=i*145-65,y=370+Math.sin(i*1.4)*95,h=110+i%4*65;
        P(c,[[x,y],[x+75,y-24],[x+75,y+h],[x,y+h+25]],'#2b3f53','#132438',1);P(c,[[x+75,y-24],[x+117,y+1],[x+117,y+h+16],[x+75,y+h]],'#1b3044','#132438',1);P(c,[[x,y],[x+45,y-45],[x+117,y+1],[x+75,y+23]],'#42586c','#182e42',1);}
      for(let i=0;i<24;i++){const q=(t*.08+i*.043)%1,x=i*137%1280,y=185+q*420;O(c,x,y,1+i%3*.4,1+i%3*.4,fade('#b2bded',Math.sin(q*Math.PI)*.46));}
      c.restore();
    }
    obSeal(c,x,y,t,p,r=190){
      c.save();c.translate(x,y+10);c.scale(1,.26);c.rotate(t*.24);c.globalAlpha=clamp(Math.sin(Math.PI*p)*1.4,0,1);c.shadowColor='#b987db';c.shadowBlur=12;
      O(c,0,0,r,r,'#24203355','#bba1dc99',3);O(c,0,0,r*.86,r*.86,null,'#e3c5f9b0',1.5);O(c,0,0,r*.43,r*.43,null,'#b9a8e1b0',2.5);
      for(let i=0;i<12;i++){const a=i*TAU/12;c.save();c.rotate(a);L(c,[[r*.88,0],[r*.98,0]],'#dfd4ef',2);P(c,[[r*.57,-5],[r*.7,-11],[r*.78,0],[r*.69,10]],null,'#c7a9e6',1.5);c.restore();}
      for(let i=0;i<3;i++){const a=i*TAU/3;c.save();c.rotate(a);c.beginPath();c.arc(r*.23,0,r*.3,-1.8,1.8);c.strokeStyle='#cfbce3aa';c.lineWidth=3;c.stroke();c.restore();}c.restore();
    }
    obDust(c,x,y,t,p,r=180){
      c.save();c.translate(x,y);for(let i=0;i<10;i++){const a=i*2.4,xx=Math.cos(a)*r*(.25+p*.85),yy=Math.sin(a)*r*.16-p*12,alpha=Math.sin(Math.PI*p)*.27;O(c,xx,yy,16+p*20+i%3*5,8+p*13,fade(i%2?'#c6bab7':'#7c7887',alpha));}c.restore();
    }
    obPalm(c,x,y,t,p){
      c.save();c.translate(x,y-(1-clamp(p*1.7,0,1))*310);c.rotate(-.18);
      P(c,[[-100,110],[-126,44],[-117,-33],[-132,-94],[-116,-108],[-95,-73],[-97,-154],[-77,-163],[-62,-99],[-60,-182],[-37,-189],[-20,-106],[-15,-178],[8,-181],[19,-101],[32,-149],[55,-144],[56,-48],[80,-13],[94,-74],[114,-83],[128,-62],[111,-16],[95,31],[66,75],[33,119]],'#6f675e','#2b3033',4);
      P(c,[[-84,74],[-101,26],[-83,-50],[-51,-74],[10,-70],[52,-42],[64,19],[30,65]],'#8c7d68','#4b4e47',2.5);O(c,-18,2,35,31,'#514e49','#b1a58a',2);
      for(let i=0;i<4;i++){const xx=-88+i*37,yy=-115-i%2*27;P(c,[[xx-10,yy],[xx-9,yy-21],[xx+6,yy-24],[xx+11,yy]],'#b6b2a3','#5e635b',1.3);L(c,[[xx-13,yy+29],[xx+11,yy+24]],'#3c4741',3);}
      L(c,[[-81,41],[-49,20],[-55,-30]],'#b0a187',3);L(c,[[35,38],[10,23],[13,-31]],'#ad9b81',3);c.restore();
    }
    obJubi(c,x,y,t,p){
      c.save();c.translate(x,y);const breath=Math.sin(t*2)*4;
      const aura=c.createRadialGradient(4,-180,40,4,-180,310);aura.addColorStop(0,'#bba0c82d');aura.addColorStop(.65,'#9186bb18');aura.addColorStop(1,'#9186bb00');O(c,4,-170,325,310,aura);
      // Ten long, root-like tails frame the rough torso and single huge eye.
      for(let i=0;i<10;i++){const a=i*.48-3.75,xx=Math.cos(a)*285,yy=-80+Math.sin(a)*190;
        c.beginPath();c.moveTo(-5,-85);c.bezierCurveTo(xx*.5,yy-60,xx*1.2,yy-140,xx*1.3,yy-170);c.strokeStyle='#292c35';c.lineWidth=28-i%3*4;c.stroke();c.strokeStyle='#5c514e';c.lineWidth=17-i%3*3;c.stroke();}
      P(c,[[-102,8],[-137,-70],[-95,-145],[-47,-175],[-17,-253],[10,-285],[44,-265],[62,-184],[112,-130],[128,-63],[94,16],[40,42],[-51,34]],'#51484a','#282a32',4);
      P(c,[[-38,-165],[-15,-230],[14,-264],[42,-241],[45,-176],[73,-126],[43,-60],[-2,-72]],'#75615a','#3c3b3f',3);
      for(const side of [-1,1]){c.save();c.scale(side,1);L(c,[[84,-116],[155,-78],[173,7]],'#252a32',42);L(c,[[84,-116],[155,-78],[173,7]],'#665650',31);
        for(let i=0;i<4;i++)L(c,[[172+i*3,0],[186+i*12,40],[202+i*16,45]],'#65584e',10);c.restore();}
      P(c,[[-26,-246],[-49,-284],[-37,-320],[-22,-281],[7,-286],[27,-323],[37,-286],[30,-251],[10,-231]],'#67554f','#292b31',3);
      O(c,4,-264+breath,41,32,'#e88043','#282a32',5);O(c,4,-264+breath,29,24,null,'#6f302e',2);O(c,4,-264+breath,16,14,null,'#752c29',2);O(c,4,-264+breath,5,5,'#252b31');
      for(let i=0;i<3;i++){const a=i*TAU/3+t*.2;O(c,4+Math.cos(a)*25,-264+breath+Math.sin(a)*18,5,7,'#35292c');}
      c.save();c.globalCompositeOperation='screen';c.shadowColor='#fb773b';c.shadowBlur=24;O(c,4,-264+breath,43,33,null,'#ffb473a0',2.5);const eyeGlow=c.createRadialGradient(4,-264+breath,3,4,-264+breath,85);eyeGlow.addColorStop(0,'#ffb85e3d');eyeGlow.addColorStop(1,'#f0835000');O(c,4,-264+breath,85,66,eyeGlow);c.restore();
      for(let i=0;i<7;i++){const yy=-186+i*25;L(c,[[-33,yy],[-4,yy+8],[34,yy-2]],'#9c7a6855',3);}
      L(c,[[-14,-224],[11,-215],[31,-223]],'#302e34',5);c.restore();
    }
    obCataclysm(c,x,y,t,p){
      const envelope=Math.min(1,p*7)*clamp((1-p)*3.5,0,1);c.save();c.translate(x,y);c.globalAlpha=envelope;c.globalCompositeOperation='screen';
      const field=c.createRadialGradient(0,-110,5,0,-110,370);field.addColorStop(0,'#eed1ff52');field.addColorStop(.55,'#bf7fdc25');field.addColorStop(1,'#b367e100');O(c,0,-110,410,260,field);
      for(let i=0;i<9;i++){const xx=(i-4)*72+Math.sin(i*5)*18,w=11+i%3*7,lean=Math.sin(i*7)*17;c.shadowColor='#df9bef';c.shadowBlur=23;P(c,[[xx-w*1.8,20],[xx-w,-340],[xx+lean,-470],[xx+w,-330],[xx+w*1.8,20]],'#d694e17b',null);L(c,[[xx+lean,-455],[xx,15]],'#ffeaffb8',w*.75);L(c,[[xx+lean,-455],[xx,15]],'#fff9ff',Math.max(2,w*.23));}
      c.shadowBlur=0;for(let i=0;i<36;i++){const q=(p*1.3+i*.0618)%1,xx=Math.sin(i*4.9)*(70+q*290),yy=-q*(80+i%5*80);L(c,[[xx,yy],[xx*1.02,yy-7-i%3*4]],fade(i%3?'#e4a4ed':'#fff1fa',Math.sin(q*Math.PI)*.8),1+i%3*.8);}
      for(let i=0;i<3;i++){const q=(p*1.8+i/3)%1;O(c,0,1,(70+q*340),(20+q*85),null,fade('#eab1ef',(1-q)*.65),4-q*3);}
      c.restore();this.obDust(c,x,y,t,p,330);this.obBurst(c,x,y-10,t,p,320,'#dfb7f3',true);
      c.save();c.translate(x,y);c.globalAlpha=clamp((1-p)*4,0,1);for(let i=0;i<26;i++){const a=i*2.4,xx=Math.cos(a)*(80+p*250),yy=-25-Math.sin(Math.PI*p)*(20+i%4*41);c.save();c.translate(xx,yy);c.rotate(p*(i%2?2:-2));P(c,[[-7,0],[-3,-19],[12,-9],[9,5]],'#313646','#151f32',1.5);c.restore();}c.restore();
    }
    entity(c,e,t,back){
      if(!e.obFX)return super.entity(c,e,t,back);if(e.delay>0)return;
      const fx=e.obFX,p=clamp(1-e.life/e.maxLife,0,1),dir=e.facing||1,r=e.radius||100;
      if(['jubi','dimensionFire','dimensionPalm'].includes(fx)){
        if(back){if(fx==='jubi'){c.save();c.fillStyle=p<.2?'#1d1021ed':'#293349e8';c.fillRect(0,155,1280,480);for(let i=0;i<10;i++)O(c,(i*161+t*19)%1400-50,220+i%3*80,150,30,'#56607933');this.obSeal(c,e.x,e.y,t,Math.min(.85,p*1.4),270);c.restore();}else this.obDimension(c,t);return;}
        if(fx==='jubi'){
          c.save();if(p<.2){c.globalAlpha=Math.sin(p/.2*Math.PI);P(c,[[350,630],[420,330],[530,245],[735,245],[850,335],[930,630]],'#363852','#141d2e',4);this.obHead(c,640,355,4,false);c.fillStyle='#ec797a22';c.fillRect(0,155,1280,480);}
          else{const q=clamp((p-.2)/.22,0,1);this.obDust(c,e.x,e.y,t,clamp((p-.2)/.5,0,1),300);c.globalAlpha=q;this.obJubi(c,e.x,e.y+25,t,p);c.globalAlpha=1;if(p<.52)this.obBurst(c,e.x,e.y,t,clamp((p-.2)/.32,0,1),285,'#beabd8',true);if(p>.55)this.obCataclysm(c,e.x,e.y,t,(p-.55)/.45);}
          c.restore();
        }else if(fx==='dimensionPalm'){this.obPortal(c,e.x,e.y-170,t,150,(1-p)*.55);this.obPalm(c,e.x,e.y-25,t,p);if(p>.6)this.obCataclysm(c,e.x,e.y,t,(p-.6)/.4);}
        else{this.obPortal(c,e.x,e.y-65,t,150,.65);for(let i=0;i<3;i++)this.obFlame(c,e.x+Math.sin(t*4+i)*60,e.y-i*55,t+i,170,dir);}
        return;
      }
      if(fx==='portal'||fx==='absorb'){if(back)return;this.obPortal(c,e.x,e.y,t,r,fx==='absorb'?1-p*.3:1-p*.7);return;}
      if(fx==='perfect'){if(back)return;this.obBurst(c,e.x,e.y,t,p,r*1.3,'#d0a9f5');c.save();c.translate(e.x,e.y);c.globalAlpha=(1-p)*.85;O(c,0,0,r,r,'#85364c44','#d17997',4);O(c,0,0,r*.6,r*.6,null,'#2b233c',4);for(let i=0;i<3;i++){const a=i*TAU/3+t;O(c,Math.cos(a)*r*.6,Math.sin(a)*r*.6,12,18,'#31253d');}c.restore();return;}
      if(fx==='hitBurst'){if(back)return;this.obBurst(c,e.x,e.y-60,t,p,r,e.hitColor||'#c8b8ff');if(e.groundFX)this.obBurst(c,e.x,e.y,t,p,r*1.1,e.hitColor||'#c8b8ff',true);return;}
      if(back)return;c.save();c.translate(e.x,e.y);c.scale(dir,1);c.globalAlpha=clamp(e.life/.12,0,1);
      if(fx==='spiralFire'){c.restore();this.obFlame(c,e.x,e.y,t,e.kind==='area'?165:100,dir);return;}
      if(fx==='woodBranches'||fx==='woodFist'||fx==='woodSpike'){
        for(let i=0;i<11;i++){const q=(p+i*.089)%1,xx=-70+q*150,yy=-22-(i%4)*21-q*10;c.save();c.translate(xx,yy);c.rotate(i+p*3);P(c,[[-6,0],[4,-2],[8,2],[-2,3]],i%3?'#c9b995a0':'#8e9a62aa',null);c.restore();}
        if(fx==='woodSpike'){P(c,[[-85,-45],[33,-60],[65,-54],[36,-45],[-85,-38]],'#9f9674','#485a48',2);L(c,[[-78,-44],[44,-53]],'#d4c7a7',2);}
        else{for(let i=0;i<6;i++){const xx=(i-2.5)*24,hh=80+i%3*29;P(c,[[xx-11,0],[xx-15,-hh*.4],[xx+Math.sin(i)*40,-hh],[xx+7,-hh*.64],[xx+18,-15]],'#8d9173','#4c5f49',2);L(c,[[xx,-9],[xx-3,-hh*.4],[xx+Math.sin(i)*40,-hh]],'#c8c09a',2);}if(fx==='woodFist')L(c,[[-85,-65],[80,-65]],'#869576',22);}
        if(fx!=='woodSpike'){this.obDust(c,0,0,t,p,105);this.obBurst(c,0,0,t,p,100,'#d7caa4',true);}else for(let i=0;i<4;i++)L(c,[[-115-i*9,-40-i*8],[-45-i*7,-41-i*8]],'#ddd4bf66',1.2);
      }else if(fx==='blackRod'||fx==='blackRods'){
        const count=fx==='blackRod'?1:5;for(let i=0;i<count;i++){const xx=(i-(count-1)/2)*40;
          L(c,[[xx-40,-155],[xx+30,-15]],'#141f30',9);L(c,[[xx-43,-154],[xx+27,-15]],'#969daf',1.5);P(c,[[xx+20,-35],[xx+34,-13],[xx+27,-41]],'#182538');}
      }else if(fx==='shuriken'){
        c.translate(0,-62);c.rotate(t*19);P(c,[[0,-48],[8,-10],[48,0],[10,8],[0,48],[-8,10],[-48,0],[-10,-8]],'#5e6f80','#16283a',2);O(c,0,0,6,6,'#1b2b3c','#a4b2bf',1.5);
      }else if(fx==='chain'){
        c.translate(0,-62);for(let i=0;i<15;i++){const xx=(i-7)*20;O(c,xx,Math.sin(i*.6+t*9)*10,13,5,null,i%2?'#e1dce4':'#6c7c91',3);}L(c,[[-160,0],[160,0]],'#b5a1dc44',9);
      }else if(fx==='kick'){c.translate(0,-60);c.rotate(-.4+p);c.beginPath();c.ellipse(0,0,100,33,0,-2.5,1.4);c.strokeStyle='#d1c5f2';c.lineWidth=4*(1-p)+1;c.stroke();}
      else if(fx==='fireExplosion'){c.restore();this.sjFlames(c,e.x,e.y,r*.7,t);return;}
      else if(fx==='shock'){O(c,0,-28,r*(.2+p),r*(.12+p*.25),null,'#f6c6ef',6*(1-p)+1);this.obBurst(c,0,-20,t,p,r,'#dfb7ef',true);}
      else if(fx==='cataclysm'||fx==='palmImpact'){c.restore();this.obCataclysm(c,e.x,e.y,t,p);return;}
      c.restore();
    }
  }
  global.ArenaRenderer=ObitoRenderer;
})(window);
