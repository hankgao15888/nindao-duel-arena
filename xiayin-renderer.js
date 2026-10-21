/* 侠隐柱间：灰褐木纹、米金钟光、水墨六龙，均为程序重绘。 */
(function(global){
  'use strict';
  const Base=global.ArenaRenderer,TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const P=(c,pts,fill,stroke='#252a27',w=2)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}};
  const L=(c,pts,color,w=2)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke();};
  const O=(c,x,y,rx,ry,fill,stroke,w=2)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}};
  class XiayinRenderer extends Base{
    fighter(c,f,t){
      if(f.id!=='hashirama-xiayin')return super.fighter(c,f,t);
      const s=f.xiayin||{},m=s.move,fx=m?.fx||'',p=m?clamp(m.elapsed/m.duration,0,1):0;
      const dir=f.facing||1,scale=1.02+(f.y-400)/1800,air=(f.air||0)+(s.height||0),run=f.action==='run',hurt=f.action==='hurt',down=f.dead||f.knockdown>0;
      c.save();O(c,f.x,f.y+4,37,10,'#22352e55');const ring=f.side==='enemy'?'#ff4b59':'#39a4ff';
      if(!f.dead){c.shadowColor=ring;c.shadowBlur=8;O(c,f.x,f.y+3,45,13,ring+'22',ring,3.5);c.shadowBlur=0;O(c,f.x,f.y+3,38,9,null,'#dff3ffb8',1);}
      if(s.guard>0){this.xyBell(c,f.x,f.y,t,{guard:true,progress:m?.elapsed||0,flash:s.blocked||0});}
      c.translate(f.x,f.y-air);c.scale(dir*scale,scale);if(down){c.translate(0,-10);c.rotate(-1.4);c.globalAlpha=f.dead?.5:1;}else if(f.recovery>0)c.rotate(-1.4*f.recovery/.24);
      const stride=run?Math.sin(t*18):0,bob=run?Math.abs(stride)*2:Math.sin(t*2.7)*1.2; c.translate(0,bob);if(hurt)c.rotate(-.12);
      // Long hair and split robe move independently in the wake of a blink.
      const wind=run?20:Math.sin(t*4)*5;
      P(c,[[-7,-145],[-20,-149],[-32,-133],[-40-wind,-131],[-53-wind,-116],[-61-wind,-121],[-49-wind,-104],[-65-wind,-99],[-38-wind,-96],[-23,-109],[7,-125]],'#202727','#121c21',1.6);
      L(c,[[-20,-139],[-37-wind,-118],[-49-wind,-110]],'#4c514a',1.6);
      P(c,[[-24,-87],[-33,-57],[-43-wind*.6,-12],[-19,-19],[-3,-55],[13,-13],[35,-9],[27,-63],[22,-88]],'#2f3633','#192320',2.2);
      P(c,[[-19,-79],[-28,-26],[-9,-30],[0,-56],[10,-27],[24,-20],[18,-81]],'#4b4f45','#282e2b',1.3);
      L(c,[[-17,-69],[-27,-29]],'#777769',2);L(c,[[16,-64],[24,-24]],'#676d60',2);
      let feet=[[-13-stride*24,-3],[16+stride*24,-3]];if(air>0)feet=[[-22,-20],[27,-25]];
      if(fx==='chant')feet=[[-23,-47],[26,-48]];
      for(let i=0;i<2;i++){L(c,[[i?10:-11,-58],[feet[i][0]*.8,-25],feet[i]],'#1c2727',17);P(c,[[feet[i][0]-7,feet[i][1]-6],[feet[i][0]+8,feet[i][1]-5],[feet[i][0]+14,feet[i][1]+2],[feet[i][0]-8,feet[i][1]+2]],'#242e2c','#15201e',1.5);}
      // Crossed inner robe, heavy charcoal sleeves and gold-disc shoulder stole.
      P(c,[[-20,-125],[-29,-112],[-22,-78],[0,-70],[23,-80],[28,-113],[18,-125]],'#434943','#1b2622',2);
      P(c,[[-14,-124],[-4,-92],[13,-124],[7,-126],[-4,-107],[-9,-126]],'#b4b1a0','#5e6559',1.2);
      L(c,[[-12,-121],[-4,-102],[7,-122]],'#e1d5b6',1.2);
      P(c,[[-23,-126],[-34,-117],[-29,-90],[-13,-88],[-10,-120]],'#3b4035','#181f21',1.8);
      P(c,[[13,-122],[22,-126],[36,-114],[28,-88],[11,-88]],'#424535','#181f21',1.8);
      for(const side of [-1,1])for(let row=0;row<3;row++)for(let col=0;col<2;col++)O(c,side*(17+col*10),-116+row*11,4.1,4.9,row%2?'#bca15c':'#d9ba69','#665839',.8);
      P(c,[[-24,-81],[23,-82],[25,-72],[0,-70],[-25,-73]],'#2b2924','#1f251f',1.5);
      L(c,[[-22,-77],[0,-74],[23,-77]],'#bd7f31',2.5);O(c,0,-75,7,6,'#a43e2b','#d6b573',1.3);O(c,0,-75,3,2,'#e1c273');
      L(c,[[1,-70],[-6,-39],[-20-wind,-25]],'#ad492b',4);L(c,[[12,-72],[22,-49],[39-wind,-42]],'#ce672f',3);
      L(c,[[-13,-72],[-19,-41],[-26,-23]],'#bca567',1.5);L(c,[[17,-74],[26,-49],[31,-30]],'#c2a867',1.5);
      // Calm face with one long forelock; no armour or forehead protector.
      P(c,[[-12,-151],[1,-157],[14,-150],[16,-134],[6,-124],[-7,-128],[-15,-140]],'#d9b79d','#27322c',1.6);
      P(c,[[-17,-143],[-16,-156],[-4,-164],[12,-160],[20,-150],[15,-140],[11,-151],[1,-155],[-7,-145],[-8,-130],[-12,-140]],'#222925','#121e1d',1.5);
      L(c,[[-7,-142],[-1,-143]],'#3a3d30',1.7);L(c,[[7,-143],[12,-141]],'#3a3d30',1.7);O(c,-3,-140,1,1.4,'#3d4232');O(c,9,-140,1,1.4,'#3d4232');L(c,[[1,-132],[8,-132]],'#996e58',1);
      let left=[[-24,-113],[-32,-89],[-17,-79]],right=[[25,-112],[33,-94],[40,-89]];
      if(run){left=[[-24,-113],[-39,-102],[-54,-99]];right=[[25,-112],[12,-89],[-5,-82]];}
      if(['guard','dragon','chant','twins','ultimate'].includes(fx)){left=[[-24,-113],[-19,-95],[0,-105]];right=[[25,-112],[20,-95],[6,-105]];}
      if(fx==='drop'){right=[[25,-112],[39,-105],[42,-130]];}
      if(fx==='basic'||fx==='airBasic'){const push=f.attackIndex%2===0?50:35;right=[[25,-112],[38,-102],[push,-98+Math.sin(p*Math.PI)*12]];}
      if(fx==='grab')right=[[25,-112],[42,-108],[47,-127]];
      this.xyArm(c,left,false);this.xyArm(c,right,true);
      if(fx==='bellKick'){L(c,[[10,-57],[40,-58],[65,-48]],'#26332e',16);L(c,[[51,-50],[68,-48]],'#d1cbb4',3);}
      if(f.invuln>0){c.shadowColor='#fff0c2';c.shadowBlur=8;L(c,[[-16,-155],[0,-165],[15,-155]],'#f7e9bf',1.7);}
      c.restore();
    }
    xyArm(c,pts,front){L(c,pts,'#1c2723',21);L(c,pts,front?'#62675b':'#4a5349',16);const h=pts[2];O(c,h[0],h[1],5,7,'#d8b694','#313a2a',1.2);L(c,[[h[0]-5,h[1]+5],[h[0]+5,h[1]+5]],'#ccb678',2);}
    xyDragon(c,x,y,t,opts={}){
      const scale=opts.scale||1,dir=opts.dir||1,coil=opts.coil,phase=opts.phase||0;
      c.save();c.translate(x,y);c.scale(dir*scale,scale);c.rotate(opts.angle||0);
      const pts=[],upper=[],lower=[],count=32;
      for(let i=0;i<=count;i++){const q=i/count;let xx,yy;
        if(coil){const a=-q*TAU*1.04+phase,rr=70+q*40;xx=Math.cos(a)*rr;yy=-70+Math.sin(a)*rr*.72;}
        else{xx=(q-1)*310;yy=-64+Math.sin(q*TAU*1.2-t*9)*(1-q)*45;}
        pts.push([xx,yy]);}
      for(let i=0;i<=count;i++){const p=pts[i],prev=pts[Math.max(0,i-1)],next=pts[Math.min(count,i+1)],a=Math.atan2(next[1]-prev[1],next[0]-prev[0])+Math.PI/2,w=4+Math.sin(i/count*Math.PI*.75)*25;upper.push([p[0]+Math.cos(a)*w,p[1]+Math.sin(a)*w]);lower.push([p[0]-Math.cos(a)*w,p[1]-Math.sin(a)*w]);}
      const g=c.createLinearGradient(0,-150,0,5);g.addColorStop(0,'#d5c590');g.addColorStop(.4,'#a9a47b');g.addColorStop(.7,'#777d60');g.addColorStop(1,'#5b6650');P(c,[...upper,...lower.reverse()],g,'#444d39',2.4);
      // Long grain lines, narrow splits and branch-like dorsal spikes.
      for(let i=3;i<count;i+=2){const p=pts[i],a=Math.atan2(pts[i+1][1]-pts[i-1][1],pts[i+1][0]-pts[i-1][0]),w=12+Math.sin(i)*5;
        c.save();c.translate(...p);c.rotate(a);L(c,[[-12,-w],[4,-w*.7],[14,-w*.9]],i%3?'#dfd2a8':'#4d5941',1.3);L(c,[[-16,8],[-2,5],[12,7]],'#5a634c',1.2);
        if(i%4===3)P(c,[[-8,-18],[-14,-43],[1,-30],[7,-18]],'#c9be8c','#626b4c',1.2);c.restore();}
      const head=pts[count],prev=pts[count-1],a=Math.atan2(head[1]-prev[1],head[0]-prev[0]);
      c.translate(...head);c.rotate(a);
      P(c,[[-39,-17],[-27,-31],[-11,-28],[2,-38],[21,-26],[52,-14],[61,-2],[49,7],[26,8],[6,24],[-19,17],[-40,7]],'#c9bd8e','#505b40',2.5);
      P(c,[[-20,8],[4,22],[32,11],[51,13],[38,27],[7,35],[-20,24]],'#9a9a73','#525f45',2);
      P(c,[[5,3],[29,4],[51,-1],[38,12],[12,21]],'#303c31',null);
      for(let i=0;i<5;i++)P(c,[[12+i*7,5],[15+i*7,13],[18+i*7,4]],'#f2e8bc','#8a8a61',.7);
      P(c,[[-23,-27],[-27,-62],[-13,-43],[-4,-40],[-6,-60],[6,-39]],'#dfd3a6','#757f55',1.4);
      P(c,[[-31,-22],[-56,-40],[-46,-15],[-68,-20],[-49,-1],[-62,12],[-38,8]],'#d1c89b','#687349',1.5);
      P(c,[[-3,-21],[18,-20],[12,-9],[-2,-10]],'#edd881','#647048',1);L(c,[[11,-18],[10,-11]],'#2d3a29',2);
      L(c,[[29,-14],[48,-7]],'#817d54',1.7);L(c,[[42,16],[57,28],[79,25]],'#c7bd8d',2);L(c,[[36,22],[49,38],[76,42]],'#7e8b59',2);
      c.restore();
    }
    xyBell(c,x,y,t,opts={}){
      const ghost=opts.ghost,guard=opts.guard,scale=opts.scale||1;
      c.save();c.translate(x,y);c.scale(scale,scale);
      if(guard){const g=c.createRadialGradient(0,-70,10,0,-70,150);g.addColorStop(0,'#fff2b21c');g.addColorStop(.6,'#e8c47135');g.addColorStop(1,'#fce4a100');O(c,0,-65,155,165,g);}
      c.globalAlpha=ghost?.28:guard?.48:.8;
      const g=c.createLinearGradient(-95,-110,95,0);g.addColorStop(0,'#c8bd8655');g.addColorStop(.23,'#f1dfae99');g.addColorStop(.45,'#4d5c4a44');g.addColorStop(.8,'#b6b18588');g.addColorStop(1,'#f2df9d77');
      c.beginPath();c.moveTo(-83,-3);c.bezierCurveTo(-66,-29,-73,-121,-37,-142);c.bezierCurveTo(-27,-151,27,-151,38,-142);c.bezierCurveTo(74,-117,66,-28,84,-3);c.quadraticCurveTo(0,22,-83,-3);c.closePath();c.fillStyle=g;c.fill();c.strokeStyle='#f6e1a5';c.lineWidth=3;c.stroke();
      O(c,0,-153,16,12,null,'#d9c78c',4);O(c,0,-1,85,18,'#4c5b4533','#e3cf95',3);O(c,0,-18,72,13,null,'#a99f76',2);
      L(c,[[-55,-112],[-25,-126],[25,-126],[56,-110]],'#e9d59b',2.2);L(c,[[-67,-58],[-35,-65],[35,-65],[67,-58]],'#d2c38f',2);
      for(let side of [-1,1]){c.save();c.scale(side,1);for(let i=0;i<5;i++)O(c,29+i%2*18,-96+Math.floor(i/2)*14,2.6,3.4,'#e5d3a0');c.restore();}
      c.font='bold 36px KaiTi,serif';c.fillStyle='#efe1afa8';c.textAlign='center';c.fillText('禪',0,-76);
      c.globalAlpha=ghost?.15:.55;for(let i=0;i<3;i++){const q=(t*1.8+i/3)%1;O(c,0,-12,90+q*80,23+q*19,null,`rgba(241,218,156,${(1-q)*.65})`,1.6);}
      if(guard&&opts.flash>0){c.globalCompositeOperation='screen';c.globalAlpha=opts.flash/.35;L(c,[[-58,-135],[-49,-94],[-62,-52]],'#fffbd7',8);L(c,[[52,-136],[58,-94],[65,-51]],'#ffedb5',6);}
      c.restore();
    }
    xyRoots(c,r,t,p=0){
      c.save();for(let i=0;i<6;i++){const xx=(i-2.5)*r*.3,hh=65+(i%3)*22;
        P(c,[[xx-18,0],[xx-13,-hh*.4],[xx+Math.sin(i)*18,-hh],[xx+7,-hh*.6],[xx+25,-hh*.25],[xx+18,0]],'#979978','#4b5b40',2);
        L(c,[[xx-4,-4],[xx+1,-hh*.42],[xx+Math.sin(i)*18,-hh]],'#dfd0a4',2);L(c,[[xx+6,-hh*.36],[xx+30,-hh*.59]],'#687855',6);}
      for(let i=0;i<9;i++){const xx=Math.sin(i*9)*r*(.3+p*.5),yy=-Math.sin(p*Math.PI)*(12+i%3*16);P(c,[[xx-5,yy],[xx+1,yy-12],[xx+9,yy-2],[xx+3,yy+5]],'#958e71','#59674d',1);}
      c.restore();
    }
    xyHands(c,x,y,p,t){
      c.save();c.translate(x,y);for(const side of [-1,1]){c.save();c.scale(side,1);const gap=30+65*(1-clamp(p*2,0,1));
        P(c,[[gap+12,5],[gap+49,-12],[gap+35,-50],[gap+24,-81],[gap+18,-128],[gap+9,-133],[gap+4,-98],[gap-3,-141],[gap-13,-141],[gap-15,-97],[gap-22,-133],[gap-31,-129],[gap-24,-86],[gap-38,-111],[gap-47,-104],[gap-35,-66],[gap-46,-75],[gap-54,-69],[gap-43,-43],[gap-22,-17]],'#aeb18b','#596d4c',2);
        for(let i=0;i<3;i++)L(c,[[gap+6-i*12,-32],[gap+2-i*12,-66],[gap-i*12,-90]],'#e3d7a6',1.5);c.restore();}
      c.restore();
    }
    xyInk(c,p,t){
      c.save();c.fillStyle='#131c1b';for(let i=0;i<18;i++){const a=i*2.399,rr=p*(500+i%4*100);O(c,640+Math.cos(a)*rr*.4,410+Math.sin(a)*rr*.25,Math.max(1,p*(230+i%3*80)),Math.max(1,p*(120+i%4*30)),'#141c1b');}c.restore();
    }
    xyPrayerCloseup(c,p){
      c.save();c.beginPath();c.rect(0,155,1280,480);c.clip();c.globalAlpha=Math.sin(Math.min(1,p/.18)*Math.PI);c.translate(640,358);c.scale(2.6,2.6);
      P(c,[[-108,122],[-100,40],[-61,5],[-28,-5],[30,-5],[65,5],[104,40],[115,122]],'#383d35','#171f20',3);
      for(const side of [-1,1]){c.save();c.scale(side,1);P(c,[[39,3],[76,12],[87,83],[42,79]],'#3d4131','#1c2420',2);for(let i=0;i<6;i++)O(c,51+i%2*18,22+Math.floor(i/2)*20,8,9,'#bb9e54','#75633e',1);c.restore();}
      P(c,[[-31,-87],[-41,-54],[-34,-14],[-17,9],[11,14],[35,-12],[40,-54],[25,-85]],'#bba68c','#202b24',2.6);
      P(c,[[-42,-23],[-52,-59],[-35,-99],[-12,-115],[22,-110],[44,-91],[50,-59],[36,-22],[30,-63],[15,-86],[-2,-78],[-15,-89],[-30,-66]],'#2a312b','#15201f',2.3);
      L(c,[[-29,-44],[-11,-40]],'#34372d',4);L(c,[[10,-40],[29,-45]],'#34372d',4);P(c,[[-28,-39],[-12,-37],[-15,-32],[-25,-33]],'#efe4c9',null);P(c,[[12,-37],[29,-40],[26,-33],[16,-32]],'#efe4c9',null);O(c,-19,-35,2,3,'#323c2e');O(c,21,-35,2,3,'#323c2e');L(c,[[1,-31],[-3,-15],[5,-14]],'#766f54',1.7);
      for(const side of [-1,1]){c.save();c.scale(side,1);P(c,[[13,75],[25,59],[27,31],[15,18],[7,-1],[1,-3],[-2,3],[5,25],[-5,12],[-10,14],[-6,26],[-17,23],[-20,28],[-11,37],[-22,38],[-22,44],[0,62],[1,76]],'#bdaa8f','#4b503b',1.5);for(let i=0;i<3;i++)L(c,[[6+i*6,30],[13+i*4,40],[12+i*4,52]],'#6b7256',1);c.restore();}
      c.restore();
    }
    xyGreatTree(c,x,y,t,p){
      c.save();c.translate(x,y-30);c.rotate(-.38);
      const upper=[],lower=[],centers=[],n=42;
      for(let i=0;i<=n;i++){const q=i/n,xx=-790+q*1530,yy=Math.sin(q*6.4)*45+xx*.085,w=58+Math.sin(q*Math.PI)*47+Math.sin(q*25)*7;centers.push([xx,yy]);upper.push([xx,yy-w]);lower.push([xx,yy+w]);}
      const g=c.createLinearGradient(0,-170,0,160);g.addColorStop(0,'#9c9b82');g.addColorStop(.25,'#747c66');g.addColorStop(.52,'#46594b');g.addColorStop(.8,'#293b32');g.addColorStop(1,'#172a25');P(c,[...upper,...lower.reverse()],g,'#1e302a',3);
      // Gnarly tapered limbs grow from the twisted trunk, with smaller hooked twigs.
      for(let i=0;i<10;i++){const xx=-650+i*141,yy=Math.sin((xx+790)/1530*6.4)*45+xx*.085,side=i%2?1:-1,len=130+i%3*39;
        c.beginPath();c.moveTo(xx-33,yy);c.bezierCurveTo(xx+15,yy-side*45,xx+9,yy-side*len,xx+108,yy-side*(len+44));c.bezierCurveTo(xx+53,yy-side*(len+22),xx+66,yy-side*54,xx+41,yy+side*8);c.closePath();c.fillStyle=i%2?'#3d5142':'#67745b';c.fill();c.strokeStyle='#293c30';c.lineWidth=2;c.stroke();
        c.beginPath();c.moveTo(xx+2,yy-side*24);c.bezierCurveTo(xx+38,yy-side*74,xx+34,yy-side*len,xx+100,yy-side*(len+39));c.strokeStyle='#b4b09599';c.lineWidth=3;c.stroke();
        const tx=xx+48,ty=yy-side*(len*.7);P(c,[[tx-9,ty],[tx-57,ty-side*40],[tx-82,ty-side*98],[tx-49,ty-side*54],[tx+6,ty+side*8]],'#4e624e','#2d4435',1.5);
      }
      for(let k=0;k<11;k++){c.beginPath();for(let i=0;i<=n;i++){const [xx,yy]=centers[i],w=Math.sin(i/n*Math.PI)*12+9,off=(k-5)*11+Math.sin(i*.75+k)*w;i?c.lineTo(xx,yy+off):c.moveTo(xx,yy+off);}c.strokeStyle=k%3===0?'#c8bfa077':k%3===1?'#233b2bc2':'#91a17a77';c.lineWidth=k%3===1?3:1.6;c.stroke();}
      for(let i=0;i<12;i++){const xx=-670+i*117,yy=Math.sin((xx+790)/1530*6.4)*45+xx*.085;O(c,xx,yy+Math.sin(i)*28,16,9,null,'#253e2d',3);O(c,xx+2,yy+Math.sin(i)*28,9,4,null,'#b0b28a77',1.5);}
      c.restore();
      c.save();for(let i=0;i<30;i++){const a=i*2.399,rr=80+p*(280+i%4*70),xx=x+Math.cos(a)*rr,yy=y-80+Math.sin(a)*rr*.6;c.save();c.translate(xx,yy);c.rotate(a+p*3);P(c,[[-7,-3],[2,-15],[10,-2],[3,9]],i%3?'#4f604d':'#b1ac8e','#314435',1);c.restore();}c.restore();
    }
    entity(c,e,t,back){
      if(!e.xyFX)return super.entity(c,e,t,back);if(e.delay>0)return;
      const fx=e.xyFX,p=clamp(1-e.life/e.maxLife,0,1),r=e.radius||120,dir=e.facing||1;
      if(fx==='ultimate'){
        if(back){c.save();c.fillStyle=p<.14?'#141b19e8':'#e4dfcfef';c.fillRect(0,155,1280,480);for(let i=0;i<20;i++){const x=(i*97+t*160)%1500-100;L(c,[[x,180],[x-350,620]],'#777a651e',2+i%4*2);}c.restore();return;}
        c.save();if(p<.18){this.xyPrayerCloseup(c,p);}
        else if(p<.5){const q=(p-.18)/.32;for(let i=0;i<6;i++)this.xyDragon(c,(-220+q*1700)*dir+(dir<0?1280:0),330+i*29+Math.sin(q*8+i)*16,t+i,{dir,scale:.9+i*.035});}
        else if(p<.72){const q=(p-.5)/.22;for(let i=0;i<6;i++)this.xyDragon(c,e.x+(i-2.5)*52,e.y-q*280,t+i,{dir:1,angle:-Math.PI/2,scale:1.13});
          c.globalCompositeOperation='screen';c.globalAlpha=.35+.2*Math.sin(t*27);O(c,e.x,e.y-120,240,300,'#fff9de');}
        else{
          const q=(p-.72)/.28;this.xyGreatTree(c,e.x,e.y,t,q);
          if(q>.6)this.xyInk(c,(q-.6)/.4,t);
        }c.restore();return;
      }
      if(fx==='bell'){if(back)return;const b=e.bell;if(!b||b.time<=0)return;this.xyBell(c,b.x,b.y,t,{ghost:!b.real});return;}
      if(back){if(['roots','uproot','forest','greatTree','gate','dragonImpact','fallingBell'].includes(fx)){c.save();c.translate(e.x,e.y);O(c,0,0,r,r*.3,'#c7c18e25','#d8c99a88',1.5);c.restore();}return;}
      if(fx==='dragon'){this.xyDragon(c,e.x,e.y,t,{dir});return;}
      if(fx==='coil'){this.xyDragon(c,e.x,e.y,t,{dir,coil:true,phase:p*TAU,scale:.95});return;}
      if(fx==='twins'){const b=e.bell||e;for(let i=0;i<2;i++)this.xyDragon(c,b.x,b.y-12,t+i,{dir:i?-1:1,coil:true,phase:t*5+i*Math.PI,scale:1.15});return;}
      if(fx==='dragonDive'){const q=clamp(p*1.6,0,1);this.xyDragon(c,e.x-(1-q)*160*dir,e.y-(1-q)*300,t,{dir,angle:.9,scale:1.45});return;}
      if(fx==='fallingBell'){this.xyBell(c,e.x,e.y-(1-p)*300,t,{scale:1.05});return;}
      if(fx==='hands'){this.xyHands(c,e.x,e.y,p,t);return;}
      c.save();c.translate(fx==='chant'&&e.bell?e.bell.x:e.x,fx==='chant'&&e.bell?e.bell.y:e.y);c.scale(dir,1);c.globalAlpha=clamp(e.life/.15,0,1);
      if(fx==='palm'||fx==='kick'){c.save();c.translate(0,-65);c.rotate(-.6+p*.9);c.beginPath();c.ellipse(0,0,105,29,0,-2.4,1);c.strokeStyle='#fff2c2';c.lineWidth=5*(1-p)+1;c.stroke();c.restore();}
      else if(fx==='forest'){
        const grow=clamp(p*6,0,1);c.scale(1,Math.max(.03,grow));
        for(let i=0;i<5;i++){const x=(i-2)*73,sgn=i%2?-1:1;
          c.beginPath();c.moveTo(x,8);c.bezierCurveTo(x+sgn*70,-45,x-sgn*55,-130,x+sgn*80,-205);c.strokeStyle='#293c31';c.lineWidth=29;c.stroke();c.strokeStyle='#7f8d69';c.lineWidth=20;c.stroke();c.strokeStyle='#c2c39a';c.lineWidth=3;c.stroke();
          L(c,[[x,-70],[x-sgn*42,-132],[x-sgn*91,-170]],'#4d644b',12);L(c,[[x,-72],[x-sgn*42,-134]],'#9aa47a',2);
          for(let j=0;j<4;j++){const xx=x+sgn*80+Math.sin(j*3)*19,yy=-205+Math.cos(j*2)*11;O(c,xx,yy,19,11,j%2?'#829664':'#5f7c54','#3e6146',1.5);}
        }
      }
      else if(['roots','uproot','branches'].includes(fx)){if(fx==='branches')c.rotate(Math.PI/2);this.xyRoots(c,130,t,p);}
      else if(fx==='mercy'){this.xyHands(c,0,-20,p,t);O(c,0,-95,78,110,null,'#efd492',3);}
      else if(fx==='gate'){
        c.translate(0,-(1-p)*110);for(let i=0;i<3;i++){const yy=-65-i*47;P(c,[[-104,yy],[-99,yy-20],[99,yy-20],[105,yy],[82,yy+9],[-82,yy+9]],i%2?'#ad5b3d':'#bd7250','#543d2c',2);L(c,[[-88,yy-15],[88,yy-15]],'#d8bd83',3);}
        L(c,[[-70,-190],[-70,0]],'#5c5140',15);L(c,[[70,-190],[70,0]],'#5c5140',15);
      }else if(fx==='chant'||fx==='bellShock'||fx==='guardFlash'){
        for(let i=0;i<4;i++){const q=(p+i*.25)%1;O(c,0,-85,70+q*110,100+q*25,null,`rgba(245,224,166,${(1-q)*.85})`,2.5);}
        if(fx==='chant'){c.font='24px KaiTi,serif';c.fillStyle='#e6d4a0';c.textAlign='center';for(let i=0;i<8;i++){const a=t+i*TAU/8;c.fillText(['静','心','慈','悲','清','越','禅','定'][i],Math.cos(a)*130,-105+Math.sin(a)*40);}}
      }else if(fx==='dragonImpact'||fx==='greatTree'||fx==='splinters'){
        if(fx==='dragonImpact'){this.xyDragon(c,0,0,t,{dir:1,scale:1.35,angle:.5});O(c,0,-12,175*p,45*p,null,'#f4e1b3',4);}
        for(let i=0;i<18;i++){const a=i*2.4,xx=Math.cos(a)*r*p,yy=-Math.sin(Math.PI*p)*(20+i%4*23);c.save();c.translate(xx,yy);c.rotate(a+p*5);P(c,[[-6,-5],[3,-14],[9,-2],[1,8]],'#acaa84','#5c694f',1);c.restore();}
      }
      c.restore();
    }
  }
  global.ArenaRenderer=XiayinRenderer;
})(window);
