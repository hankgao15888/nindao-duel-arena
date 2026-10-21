/* 神驹斑专属 Canvas 动画：铁甲长戟、火环、奔马、骨架须佐。 */
(function(global){
  'use strict';
  const Base=global.ArenaRenderer,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const P=(c,p,fill,stroke='#121923',width=2)=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};
  const L=(c,p,color,width=2)=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();};
  const O=(c,x,y,rx,ry,fill,stroke,width=2)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};
  const rgba=(r,g,b,a)=>`rgba(${r},${g},${b},${clamp(a,0,1)})`;
  class ShenjuRenderer extends Base{
    fighter(c,f,t){
      if(f.id!=='madara-shenju'){
        super.fighter(c,f,t);if(f.burn){c.save();c.globalAlpha=.65;this.sjFlames(c,f.x,f.y-f.air,25,t,false);c.restore();}return;
      }
      const s=f.shenju||{},move=s.move,fx=move?.fx||'',q=move?clamp(move.elapsed/move.duration,0,1):0;
      const air=f.air+(s.height||0),dir=f.facing||1,scale=.98+(f.y-400)/1400;
      const down=f.dead||f.knockdown>0,rise=f.recovery>0?1-f.recovery/.24:1;
      const attack=!!move,run=f.action==='run',hurt=f.action==='hurt';
      c.save();O(c,f.x,f.y+4,39,10,'#182b365e');
      const team=f.side==='enemy'?'#ff4859':'#39a7ff';
      if(!f.dead){c.shadowColor=team;c.shadowBlur=10;O(c,f.x,f.y+3,46,13,team+'22',team,3.5);c.shadowBlur=0;O(c,f.x,f.y+3,39,9,null,'#d9efff8f',1);}
      if(s.wushuang>0){this.sjCracks(c,f.x,f.y,t,110);c.save();c.globalAlpha=.33;this.sjFlames(c,f.x,f.y,45,t,false);c.restore();}
      c.translate(f.x,f.y-air);c.scale(dir*scale,scale);if(down){c.translate(0,-17);c.rotate(-1.4);c.globalAlpha=f.dead?.5:1;}else if(rise<1)c.rotate(-1.4*(1-rise));
      let lean=run?.2:hurt?-.16:0,bob=run?Math.sin(t*20)*2:Math.sin(t*2.7)*1.3;
      if(['charge','drill','thrust','pierce'].includes(fx))lean=.23;
      if(['plunge','eruption'].includes(fx))lean=-.13;
      c.translate(0,bob);c.rotate(lean);
      const wind=run?24:Math.sin(t*5)*5;
      P(c,[[-8,-116],[-32,-132],[-62-wind,-129],[-87-wind,-146],[-70-wind,-120],[-92-wind,-111],[-57-wind,-116],[-27,-107]],'#782b30','#301d28',1.6);
      P(c,[[-3,-109],[-26,-102],[-52-wind,-87],[-74-wind,-94],[-54-wind,-75],[-30,-83]],'#ab4541','#3a242a',1.6);
      // Long, spiked black hair fans out behind the steel shoulder guards.
      P(c,[[-4,-154],[-27,-164],[-40,-152],[-55,-156],[-51,-137],[-65,-136],[-57,-119],[-68,-114],[-59,-97],[-67,-88],[-43,-98],[-49,-77],[-31,-89],[-22,-116],[8,-135]],'#161c25','#070d16',2);
      L(c,[[-25,-145],[-39,-125],[-43,-106]],'#3c414b',2);
      const stride=run?Math.sin(t*18):0,airbend=air>10?18:0;
      this.sjLimb(c,[[-12,-65],[-20-stride*10,-34-airbend],[-20-stride*29,-5-airbend*.7]],false);
      this.sjLimb(c,[[10,-65],[22+stride*10,-34-airbend*.5],[24+stride*29,-3-airbend*.6]],true);
      P(c,[[-24,-80],[-35,-38],[-16,-46],[-8,-30],[1,-61],[18,-36],[31,-48],[25,-85]],'#20252d','#0d131d',2);
      for(let i=0;i<3;i++){const y=-73+i*9;L(c,[[-24,y],[-7,y+6]],'#73787c',2);L(c,[[6,y+6],[24,y]],'#505861',2);}
      P(c,[[-21,-124],[-32,-111],[-24,-82],[0,-69],[24,-82],[29,-112],[15,-124]],'#333b43','#0b101a',2.7);
      P(c,[[-21,-119],[-9,-111],[0,-115],[10,-110],[21,-120],[17,-98],[0,-85],[-18,-98]],'#4e565e','#202632',1.7);
      // Etched dragon motif on the breastplate.
      L(c,[[-14,-112],[-20,-104],[-8,-105],[-11,-98],[2,-100],[8,-108],[2,-111],[8,-115],[17,-109]],'#899096',2);
      P(c,[[-11,-108],[-2,-114],[5,-106],[1,-99],[-8,-99]],'#262c36','#737b83',1.2);
      L(c,[[-20,-94],[-7,-88],[0,-81],[8,-88],[20,-94]],'#8c9195',2);
      P(c,[[-25,-82],[-26,-73],[0,-65],[27,-74],[25,-84],[1,-74]],'#111923','#626975',2);
      O(c,1,-75,7,6,'#9d2634','#b6a4a3',1.4);O(c,2,-76,2,3,'#f85d53');
      const shoulder=[[-26,-125],[-43,-117],[-42,-104],[-24,-98],[-12,-113]];
      P(c,shoulder,'#535a62','#121823',2.3);L(c,[[-39,-115],[-26,-120],[-19,-113],[-29,-110]],'#93999b',1.5);
      P(c,[[17,-126],[38,-121],[46,-111],[37,-99],[19,-102],[12,-113]],'#616970','#141a24',2.3);
      L(c,[[22,-121],[31,-116],[24,-110],[35,-111],[39,-106]],'#a6aaad',1.8);
      // Face and single red eye beneath a sharp fringe; no headband in this costume.
      P(c,[[-11,-148],[0,-157],[14,-146],[17,-130],[8,-121],[-7,-126],[-15,-136]],'#d9b29e','#141b26',1.8);
      P(c,[[-23,-144],[-31,-158],[-12,-155],[-13,-173],[-2,-160],[13,-168],[8,-156],[29,-161],[16,-148],[5,-144],[-7,-129],[-5,-149]],'#161d27','#090f19',1.8);
      L(c,[[6,-137],[13,-139]],'#25222a',2);O(c,10,-136,1.7,1.5,'#ff454c');L(c,[[10,-129],[14,-130]],'#946a61',1);
      let weapon=-.43,wx=25,wy=-81;
      if(run)weapon=-.75;
      if(attack){
        if(['drill','charge','pierce'].includes(fx)){weapon=Math.PI/2;wx=45;wy=-93;}
        else if(fx==='basic'){weapon=f.attackIndex===3?Math.PI/2:-1.6+q*3.1;}
        else if(['whirl','vortex','wushuang','sweep'].includes(fx))weapon=-Math.PI+q*TAU*1.8;
        else if(['plunge','eruption'].includes(fx)){weapon=2.7;wy=-110;}
        else if(fx==='finisher'){weapon=-.7;wy=-119;}
        else if(fx==='airSlash'){weapon=-2+q*3.6;wy=-98;}
        else if(fx==='firegrab'){weapon=q<.4?-1.4+q*6:2.7;}
      }
      this.sjLimb(c,[[-28,-109],[-24,-91],[wx-10,wy+18]],false,true);
      this.sjHalberd(c,wx,wy,weapon,1,attack||s.wushuang>0,t);
      this.sjLimb(c,[[28,-110],[41,-96],[wx,wy]],true,true);
      if(f.armorTime>0||f.invuln>0){c.shadowColor=f.invuln?'#bdefff':'#ffd58f';c.shadowBlur=9;L(c,[[-37,-119],[-43,-111],[-30,-103]],f.invuln?'#c9f5ff':'#ffd797',2);L(c,[[21,-124],[39,-120],[45,-112]],'#ffe1ab',2);}
      c.restore();
      if(f.burn){c.save();c.globalAlpha=.55;this.sjFlames(c,f.x,f.y-air,26,t,false);c.restore();}
    }
    sjLimb(c,pts,front,arm=false){
      L(c,pts,'#111723',arm?17:20);L(c,pts,front?'#424b54':'#303841',arm?13:15);
      L(c,[[pts[1][0]-5,pts[1][1]-4],[pts[1][0]+5,pts[1][1]+1]],'#8b9299',2);
      L(c,[[pts[2][0]-4,pts[2][1]-9],[pts[2][0]+5,pts[2][1]-6]],'#747e88',2);
      if(!arm)P(c,[[pts[2][0]-7,pts[2][1]-6],[pts[2][0]+8,pts[2][1]-4],[pts[2][0]+14,pts[2][1]+2],[pts[2][0]-8,pts[2][1]+2]],'#222b35','#0b111c',2);
    }
    sjHalberd(c,x,y,angle,scale,flame,t,blue=false){
      c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);
      L(c,[[0,92],[0,-114]],blue?'#2386bb':'#171c26',6);L(c,[[-1,80],[-1,-113]],blue?'#adf7ff':'#79808a',1.6);
      for(let i=0;i<4;i++)L(c,[[-3,25+i*9],[3,25+i*9]],blue?'#6cdbff':'#ab8d7c',2.5);
      P(c,[[-4,-91],[-8,-116],[-2,-153],[7,-122],[6,-95]],blue?'#b3f8ff':'#b0b7bd',blue?'#e3ffff':'#282e38',1.5);
      for(const side of [-1,1]){c.save();c.scale(side,1);P(c,[[5,-117],[15,-137],[20,-134],[16,-113],[26,-101],[35,-101],[21,-94],[12,-96],[7,-105]],blue?'#71d8fc':'#5d6977',blue?'#edffff':'#c6c9ca',1.6);c.restore();}
      P(c,[[-9,-102],[0,-110],[10,-102],[4,-92],[-6,-93]],blue?'#d9ffff':'#762f36',blue?'#6ceaff':'#353e47',1.6);
      if(flame){c.globalCompositeOperation='screen';c.shadowColor=blue?'#44baff':'#ff5b15';c.shadowBlur=14;
        L(c,[[0,-148],[5,-121],[17,-110],[28,-102]],blue?'#caffff':'#ffd56e',3);
        L(c,[[-1,-141],[-9,-119],[-22,-104]],blue?'#76dfff':'#ff722c',3);
        for(let i=0;i<5;i++){const a=t*13+i*2.7;L(c,[[Math.sin(a)*10,-116],[Math.sin(a)*15,-138-i*4]],blue?'#a4faff99':'#ff9d3b99',2);}}
      c.restore();
    }
    sjArc(c,r,t,p,vertical=false,blue=false){
      c.save();c.rotate(vertical?-.8:0);const col=blue?'#4edcff':'#ff5a19',core=blue?'#eaffff':'#fff1ae';
      c.shadowColor=col;c.shadowBlur=17;
      for(let layer=0;layer<3;layer++){c.beginPath();c.ellipse(0,0,r,r*(vertical?.66:.34),0,-2.7+p*.6,1.1+p*.7);c.strokeStyle=[col,blue?'#94f4ff':'#ffad2b',core][layer];c.lineWidth=[25,12,3][layer]*(1-p*.65);c.stroke();}
      for(let i=0;i<11;i++){const a=i*.31-2.4+p*.8,rr=r*(.98+.09*Math.sin(t*23+i));L(c,[[Math.cos(a)*rr,Math.sin(a)*rr*.34],[Math.cos(a+.1)*(rr+25),Math.sin(a+.1)*(rr+25)*.34]],col,2);}
      c.restore();
    }
    sjCracks(c,x,y,t,r){
      c.save();c.translate(x,y);c.shadowColor='#ff4c19';c.shadowBlur=10;
      for(let i=0;i<9;i++){const a=i*TAU/9;L(c,[[Math.cos(a)*23,Math.sin(a)*7],[Math.cos(a+.15)*r*.5,Math.sin(a+.15)*r*.17],[Math.cos(a)*r,Math.sin(a)*r*.33]],'#ff773c',1.7);}
      c.restore();
    }
    sjFlames(c,x,y,r,t){
      c.save();c.translate(x,y);r=Math.min(160,r);
      const glow=c.createRadialGradient(0,-r*.7,0,0,-r*.7,r*1.9);glow.addColorStop(0,'#ff9e365e');glow.addColorStop(1,'#ff410000');O(c,0,-r*.7,r*1.9,r*1.9,glow);
      for(let i=0;i<10;i++){
        const xx=Math.sin(i*2.17)*r*.74,w=r*(.19+i%3*.025),h=r*(1.15+i%4*.27),sway=Math.sin(t*13+i)*r*.22;
        for(let layer=0;layer<3;layer++){
          const scale=1-layer*.23,hh=h*scale,ww=w*scale;
          c.beginPath();c.moveTo(xx-ww,0);
          c.bezierCurveTo(xx-ww*1.8,-hh*.32,xx+sway-ww*.8,-hh*.3,xx+sway,-hh);
          c.bezierCurveTo(xx+sway+ww*.35,-hh*.7,xx+ww*1.3,-hh*.7,xx+ww*.7,-hh*.4);
          c.bezierCurveTo(xx+ww*.6,-hh*.17,xx+ww*1.7,-hh*.15,xx+ww,0);c.closePath();
          c.fillStyle=['#e43c20dc','#ff9326e8','#fff0a3ed'][layer];c.fill();
        }
      }
      c.globalCompositeOperation='screen';O(c,0,-r*.18,r*.75,r*.22,'#ffdc7b73');
      for(let i=0;i<18;i++){const q=(t*1.6+i*.113)%1,xx=Math.sin(i*17)*r*(.4+q*.6),yy=-q*r*2.5;L(c,[[xx,yy],[xx+Math.sin(i)*5,yy-7]],rgba(255,191,76,1-q),2.2);}
      c.restore();
    }
    sjHorse(c,x,y,t,dir,scale=1){
      c.save();c.translate(x,y);c.scale(dir*scale,scale);
      const glow=c.createRadialGradient(0,-66,5,0,-66,155);glow.addColorStop(0,'#ff972c91');glow.addColorStop(1,'#fc401000');O(c,0,-66,170,125,glow);
      L(c,[[-230,2],[-110,-2],[65,1]],'#ff592c78',12);L(c,[[-180,2],[-70,-1],[55,0]],'#ffdc8577',3);
      for(let i=0;i<6;i++){const xx=-65-i*28,hh=18+Math.sin(t*15+i)*9;c.beginPath();c.moveTo(xx-12,0);c.bezierCurveTo(xx-17,-hh*.5,xx+7,-hh*.4,xx-4,-hh);c.bezierCurveTo(xx+8,-hh*.8,xx+16,-4,xx+12,0);c.fillStyle=i%2?'#ff9f328e':'#f95b269e';c.fill();}
      for(let i=0;i<6;i++){const xx=-65-i*21;P(c,[[xx,-40],[xx-45,-80+Math.sin(t*20+i)*25],[xx-5,-83],[xx+20,-49]],'#e94b22aa',null);}
      c.shadowColor='#ff7826';c.shadowBlur=15;
      // A recognisable four-legged gallop with a raised neck and pointed ears.
      const phase=t*19;
      for(let i=0;i<4;i++){const front=i>1,x0=front?45:-53,sign=i%2?-1:1,sw=Math.sin(phase+(i%2)*Math.PI+(front?1.4:0));
        L(c,[[x0,-53],[x0+sw*25,-27],[x0+sw*52,-5+Math.max(0,-sw)*22]],i%2?'#bd3f21':'#f88425',12);
        L(c,[[x0+sw*25,-27],[x0+sw*52,-5+Math.max(0,-sw)*22]],'#ffd45b',2.5);}
      P(c,[[-83,-65],[-65,-98],[-27,-106],[20,-100],[42,-130],[57,-163],[74,-154],[94,-159],[116,-143],[108,-128],[84,-126],[77,-101],[66,-73],[38,-49],[-14,-45],[-57,-50]],'#d95425','#ffd46b',3);
      P(c,[[52,-142],[51,-167],[59,-178],[66,-155],[78,-167],[80,-147]],'#ffad36','#ffe485',2);
      P(c,[[-70,-91],[-38,-100],[17,-94],[43,-121],[64,-151],[53,-110],[49,-83],[12,-62],[-27,-58]],'#ff962d',null);
      L(c,[[79,-144],[88,-141]],'#fff7c5',4);L(c,[[102,-133],[110,-136]],'#6b251c',3);
      for(let i=0;i<7;i++){const yy=-151+i*9,xx=49-i*3;P(c,[[xx,yy],[xx-42-Math.sin(t*20+i)*12,yy-20],[xx-21,yy+12]],i%2?'#ffc84c':'#ff5725',null);}
      L(c,[[-72,-77],[-100,-93],[-131,-79],[-152,-88]],'#ffb334',12);
      c.globalCompositeOperation='screen';for(let i=0;i<10;i++){const q=(t*2+i*.097)%1;O(c,-90-q*170,-30-Math.sin(i*3)*35,2+i%3,3,'#ffd46d');}
      c.restore();
    }
    sjSusanoo(c,x,y,t,p,dir){
      c.save();c.translate(x,y);c.scale(dir,1);const col='#52cfff';c.shadowColor='#148bff';c.shadowBlur=22;
      const g=c.createRadialGradient(0,-155,10,0,-155,270);g.addColorStop(0,'#48c4ff70');g.addColorStop(1,'#176bff00');O(c,0,-155,280,280,g);
      // Segmented ribs, spine, angular skull and articulated bone hands.
      L(c,[[0,-60],[-4,-273]],'#156bb5',24);L(c,[[0,-60],[-4,-273]],'#a7f7ff',8);
      for(let i=0;i<5;i++){const yy=-82-i*29,w=95+i*8;for(const side of [-1,1]){c.save();c.scale(side,1);
        c.beginPath();c.moveTo(0,yy+9);c.bezierCurveTo(w*.35,yy+19,w*1.05,yy+4,w,yy-23);c.strokeStyle='#248ee0';c.lineWidth=15;c.stroke();c.strokeStyle='#aff8ff';c.lineWidth=4;c.stroke();c.restore();}}
      P(c,[[-54,-269],[-70,-320],[-46,-355],[-47,-385],[-23,-361],[0,-378],[21,-362],[43,-386],[45,-352],[65,-320],[48,-269],[22,-252],[-26,-254]],'#2485bdab','#a9f5ff',3);
      P(c,[[-44,-315],[-11,-302],[-33,-293]],'#e9ffff',null);P(c,[[43,-315],[12,-302],[31,-293]],'#e9ffff',null);
      L(c,[[-24,-271],[-18,-279],[-8,-270],[0,-279],[9,-270],[18,-279],[25,-271]],'#bdffff',3);
      const a=p<.8?-1.2:(p-.8)*6-1.2,hand=[154,-271];
      for(const side of [-1,1]){const pts=[[side*99,-236],[side*161,-187],[side*154,-271]];L(c,pts,'#1d7cc8',26);L(c,pts,'#9af1ff',7);O(c,side*161,-187,14,14,'#41afe9','#d9ffff',3);}
      for(let i=0;i<4;i++)L(c,[[hand[0]-13+i*8,hand[1]+8],[hand[0]-13+i*8,hand[1]-20],[hand[0]+4+i*7,hand[1]-27]],'#bdffff',5);
      this.sjHalberd(c,hand[0],hand[1],a,2.15,true,t,true);
      c.restore();
    }
    entity(c,e,t,back){
      if(!e.sjFX)return super.entity(c,e,t,back);
      if(e.delay>0)return;
      const fx=e.sjFX,p=clamp(1-e.life/e.maxLife,0,1),r=e.radius||110,dir=e.facing||1;
      if(fx==='finisher'){
        if(back){c.save();c.fillStyle=p<.47?'#1c060bda':'#07102be6';c.fillRect(0,157,1280,475);
          for(let i=0;i<15;i++){const xx=(i*113+t*60)%1400-60;L(c,[[xx,630],[xx+240,165]],p<.47?'#8c1e1d65':'#1d65bc49',12);}
          if(p>.35){c.globalAlpha=.18;O(c,1015,265,130,90,'#fa272f');O(c,1015,265,42,61,'#120416');for(let i=0;i<3;i++){const a=i*TAU/3;O(c,1015+Math.cos(a)*75,265+Math.sin(a)*55,17,20,'#160919');}}
          c.restore();return;}
        c.save();if(p<.52){this.sjFlames(c,e.x,e.y,90+p*140,t,true);this.sjCracks(c,e.x,e.y,t,240);}else this.sjSusanoo(c,e.x-dir*105,e.y,t,p,dir);
        for(let i=0;i<16;i++){const a=i*2.4+t*1.2,rr=100+Math.sin(i)*45,xx=e.x+Math.cos(a)*rr,yy=e.y-30-(p<.7?p*210:130)+Math.sin(a)*35;
          P(c,[[xx-13,yy],[xx-8,yy-18],[xx+9,yy-23],[xx+19,yy-7],[xx+7,yy+9]],'#554e52','#b29b8d',1.7);}
        if(p>.78&&p<.89){c.globalCompositeOperation='screen';L(c,[[e.x-dir*190,e.y-370],[e.x+dir*150,e.y]],'#219bf3',70);L(c,[[e.x-dir*190,e.y-370],[e.x+dir*150,e.y]],'#eaffff',23);}
        if(p>.79&&p<.815){c.fillStyle='#fffbf0d9';c.fillRect(0,157,1280,475);}
        c.restore();return;
      }
      if(back){if(['eruption','slam','horseburst','spears','awakening','judgment'].includes(fx))this.sjCracks(c,e.x,e.y,t,r);return;}
      c.save();c.translate(e.x,e.y);c.scale(dir,1);c.globalAlpha=clamp(e.life/.12,0,1);
      if(['slash','downslash','sweep','whirl','vortex','upslash'].includes(fx)){
        const radius=fx==='sweep'?220:fx==='vortex'?185:fx==='whirl'?155:130;
        this.sjArc(c,radius,t,p,['upslash','downslash'].includes(fx));
        if(fx==='whirl'||fx==='vortex'){c.translate(0,-65);this.sjArc(c,radius*.85,t,p);}
      }else if(['drill','thrust','pierce','charge'].includes(fx)){
        const g=c.createLinearGradient(-135,0,135,0);g.addColorStop(0,'#ff431000');g.addColorStop(.6,'#ff742c');g.addColorStop(1,'#fff3c3');
        P(c,[[-150,-40],[30,-90],[145,-61],[50,-36],[-150,-13]],g,null);
        for(let i=0;i<4;i++){c.save();c.translate(10-i*38,-55);c.rotate(.5);O(c,0,0,25,53,null,i%2?'#ff7535':'#ffe49b',4);c.restore();}
      }else if(fx==='horse'){c.restore();this.sjHorse(c,e.x,e.y,t,dir,1.05);return;}
      else if(fx==='firewave'){
        L(c,[[-210,-87],[75,-7]],'#e94e25',16);L(c,[[-210,-87],[75,-7]],'#ffd17a',5);this.sjHalberd(c,75,-10,Math.PI,.68,true,t);this.sjFlames(c,75,0,120,t,true);
      }else if(fx==='spears'){
        for(let i=-2;i<=2;i++)this.sjHalberd(c,i*57,-10,Math.PI+(i*.12),.78,true,t);this.sjFlames(c,0,0,55,t,false);
      }else if(['eruption','horseburst','slam','judgment','awakening'].includes(fx)){
        const blue=fx==='judgment';if(blue){this.sjArc(c,275,t,p,true,true);L(c,[[-140,-345],[100,0]],'#c9ffff',30*(1-p)+2);}else this.sjFlames(c,0,0,fx==='awakening'?120:fx==='eruption'?130:85,t,true);
        for(let i=0;i<12;i++){const a=i*2.4,xx=Math.cos(a)*r*p,yy=-Math.sin(Math.PI*p)*(35+i%3*40);P(c,[[xx-7,yy],[xx,yy-15],[xx+12,yy-2],[xx+4,yy+7]],'#78645a','#b9a289',1);}
        if(fx==='awakening'){c.save();c.scale(dir,1);c.font='italic 900 72px KaiTi,serif';c.textAlign='center';c.strokeStyle='#200a12';c.lineWidth=7;c.strokeText('天下无双',0,-175);c.fillStyle='#ffe8b2';c.fillText('天下无双',0,-175);c.restore();}
      }else if(fx==='rocks'){
        for(let i=0;i<8;i++){const a=i*TAU/8+t*3,xx=Math.cos(a)*120,yy=-90+Math.sin(a)*65;P(c,[[xx-13,yy],[xx-5,yy-20],[xx+17,yy-5],[xx+8,yy+12]],'#54464b','#a88b7e',2);}
      }else if(fx==='jump'){O(c,0,0,80*p,25*p,null,'#ffcc91',3*(1-p)+1);for(let i=0;i<5;i++)L(c,[[(i-2)*12,0],[(i-2)*20,40*p]],'#ffd79f',2);}
      c.restore();
    }
  }
  global.ArenaRenderer=ShenjuRenderer;
})(window);
