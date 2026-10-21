/* 忍道决斗场 · procedural arena and character renderer. No network resources. */
(function () {
  'use strict';
  const W = 1280, H = 720, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  // VFX gradients always receive a finite, six-digit color before adding opacity.
  function fxColor(value, fallback = '#a3e6ef') {
    const s = typeof value === 'string' ? value.trim() : '';
    if (/^#[\da-f]{6}([\da-f]{2})?$/i.test(s)) return s.slice(0, 7);
    if (/^#[\da-f]{3}([\da-f])?$/i.test(s)) return '#' + s.slice(1, 4).split('').map(v => v + v).join('');
    const rgb = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (rgb) return '#' + rgb.slice(1, 4).map(v => Math.round(clamp(Number(v) || 0, 0, 255)).toString(16).padStart(2, '0')).join('');
    return fallback;
  }
  function fade(color, opacity) { return fxColor(color) + Math.round(clamp(Number(opacity) || 0, 0, 1) * 255).toString(16).padStart(2, '0'); }
  function seeded(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function path(c, points, fill, stroke, width = 1) {
    c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function oval(c, x, y, rx, ry, fill, stroke, width = 1) {
    c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function line(c, points, color, width, cap = 'round') {
    c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = cap; c.lineJoin = 'round'; c.stroke();
  }
  function rounded(c, x, y, w, h, radius, fill, stroke, width = 1) {
    c.beginPath(); c.roundRect(x, y, w, h, radius); if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  const OUTLINE = '#172a32';
  function appearance(p = {}) {
    const n = String(p.name || p.id || '')+' '+String(p.variant||''), a = {
      skin: '#efc09b', hair: '#e9be44', top: '#dc6629', leg: '#d9652c', trim: '#263c46',
      band: true, face: '', costume: 'naruto', hairStyle: 'spiky', name: n,
    };
    if (/佐助|sasuke/i.test(n)) Object.assign(a, { hair: '#202837', top: '#d7dce1', leg: '#34425a', trim: '#726193', costume: 'sasuke' });
    if (/卡卡西|kakashi/i.test(n)) Object.assign(a, { hair: '#c9d6dd', top: '#758a61', leg: '#253d52', trim: '#263d4d', costume: 'vest', face: 'mask' });
    if (/小樱|春野|sakura/i.test(n)) Object.assign(a, { hair: '#ed91ad', top: '#ad3c50', leg: '#30394c', trim: '#ead6cb', costume: 'sakura', hairStyle: 'bob' });
    if (/雏田|hinata/i.test(n)) Object.assign(a, { hair: '#242942', top: '#b5b1d0', leg: '#33455d', trim: '#eee4d4', costume: 'hinata', hairStyle: 'long', band: false });
    if (/水门|minato/i.test(n)) Object.assign(a, { hair: '#f5d464', top: '#718d70', leg: '#294a63', trim: '#f6eee0', costume: 'minato' });
    if (/我爱罗|gaara/i.test(n)) Object.assign(a, { hair: '#934644', top: '#9c5241', leg: '#533b3d', trim: '#c8b386', costume: 'gaara', band: false, hairStyle: 'short' });
    if (/鹿丸|shikamaru/i.test(n)) Object.assign(a, { hair: '#202a2e', top: '#728563', leg: '#303e4b', trim: '#3b5949', costume: 'vest', hairStyle: 'pony' });
    if (/李洛克|洛克|小李|迈特|阿凯|凯\b|rock.?lee|might.?guy/i.test(n)) Object.assign(a, { hair: '#20342c', top: '#4e7950', leg: '#416c43', trim: '#bc7242', costume: 'lee', hairStyle: 'bowl' });
    if (/鼬|itachi|佩恩|天道|pain|迪达拉|deidara|鬼鲛|kisame|飞段|角都|小南|蝎/.test(n)) Object.assign(a, { hair: '#232b34', top: '#272b35', leg: '#293542', trim: '#b64243', costume: 'akatsuki', hairStyle: 'long' });
    if (/佩恩|天道|pain/.test(n)) Object.assign(a, { hair: '#d88739', hairStyle: 'spiky', face: 'piercing' });
    if (/迪达拉|deidara/.test(n)) Object.assign(a, { hair: '#e4c355', hairStyle: 'deidara' });
    if (/小南/.test(n)) Object.assign(a, { hair: '#687cac', hairStyle: 'bob', face: 'flower' });
    if (/鬼鲛|kisame/.test(n)) Object.assign(a, { skin: '#8eacbb', hair: '#2b465a', hairStyle: 'spiky', face: 'gills' });
    if (/斑|madara/.test(n)) Object.assign(a, { hair: '#252631', top: '#9d4545', leg: '#303749', trim: '#672e36', costume: 'armor', hairStyle: 'madara' });
    if (/柱间|hashirama/.test(n)) Object.assign(a, { hair: '#292c30', top: '#9b4e48', leg: '#344047', trim: '#6c3535', costume: 'armor', hairStyle: 'long' });
    if (/扉间|tobirama/.test(n)) Object.assign(a, { hair: '#e4e8df', top: '#437b9a', leg: '#2f495f', trim: '#e5ded1', costume: 'armor', face: 'redmark' });
    if (/自来也|jiraiya/.test(n)) Object.assign(a, { hair: '#e9e3d4', top: '#a9463c', leg: '#68765d', trim: '#b8bb9c', costume: 'jiraiya', hairStyle: 'madara', face: 'redmark' });
    if (/纲手|tsunade/.test(n)) Object.assign(a, { hair: '#dbc477', top: '#698f6e', leg: '#435569', trim: '#d9d6c1', costume: 'tsunade', hairStyle: 'long', band: false });
    if (/带土|obito|阿飞/.test(n)) Object.assign(a, { hair: '#242c32', top: '#30303b', leg: '#292f3c', trim: '#a74d3b', costume: 'akatsuki', face: 'obito', hairStyle: 'short' });
    if (/宁次|neji/.test(n)) Object.assign(a, { hair: '#473b37', top: '#d5c9a9', leg: '#3b4a5e', trim: '#817c68', costume: 'hinata', hairStyle: 'long' });
    if (/大蛇丸|orochimaru/.test(n)) Object.assign(a, { skin: '#dfd9bc', hair: '#20222c', top: '#c5bb9b', leg: '#343647', trim: '#807399', costume: 'sasuke', hairStyle: 'long' });
    if (/药师兜|kabuto/.test(n)) Object.assign(a, { skin:'#d8d4b8',hair:'#ccd1dc',top:'#d4ccb7',leg:'#777381',trim:'#887ba0',costume:'sasuke',hairStyle:'long',face:'glasses',band:false });
    if (/^白\s|haku/.test(n)) Object.assign(a, { hair:'#27313a',top:'#c7d7cf',leg:'#49586a',trim:'#728d8d',costume:'haku',hairStyle:'long',band:false,face:'haku' });
    if (/^艾\s|\bay\b/.test(n)) Object.assign(a, { skin:'#ad7959',hair:'#e6d49f',top:'#cfbfa1',leg:'#e7e1cf',trim:'#d6c7a3',costume:'ay',hairStyle:'short',band:false });
    if (/止水|shisui/.test(n)) Object.assign(a, { hair:'#20342c',top:'#344d49',leg:'#314754',trim:'#a4ab96',costume:'shisui',hairStyle:'short' });
    if (/小南.*夏日/.test(n)) Object.assign(a, { top:'#e9e3ed',leg:'#52537d',costume:'konan',hairStyle:'bob',band:false });
    if (/六道|九喇嘛|九尾|仙人鸣人/.test(n) && /鸣人|naruto/.test(n)) Object.assign(a, { top: '#f7cc55', leg: '#f1c25a', trim:'#282e32', costume: 'kcm', glow: '#ffce53' });
    if (/水门.*秽土/.test(n)) Object.assign(a, {glow:'#ffe397',leg:'#c4af6d',skin:'#e8c78e'});
    if (p.hair) a.hair = p.hair;
    if (p.coat && !['akatsuki','kcm'].includes(a.costume)) a.top = p.coat;
    if (p.skinColor) a.skin = p.skinColor;
    return a;
  }

  class ArenaRenderer {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); canvas.width = W; canvas.height = H;
      this.bg = document.createElement('canvas'); this.bg.width = W; this.bg.height = H;
      this.time = 0; this.last = 0; this.drawBackground(this.bg.getContext('2d'));
      this.seenImpacts = new WeakSet(); this.impactPulse = 0; this.impactPower = 0;
      this.impactPoint = { x: W / 2, y: H / 2 }; this.ultimatePulse = 0; this.previousUltimate = null;
    }

    drawBackground(c) {
      const rand = seeded(10203);
      let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#76b5bc'); g.addColorStop(.46, '#dfd6ad'); g.addColorStop(.72, '#b4bd93'); g.addColorStop(1, '#8d9c79'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      g = c.createRadialGradient(983, 90, 5, 983, 90, 350); g.addColorStop(0, '#fff5c8'); g.addColorStop(.17, '#f8eabb80'); g.addColorStop(1, '#f0df9d00'); c.fillStyle = g; c.fillRect(590, 0, 690, 430);
      oval(c, 982, 92, 33, 33, '#fff2cc');
      const clouds = [[64,86,1],[360,44,.9],[661,120,.7],[1105,57,.8]];
      clouds.forEach(([x,y,s]) => { c.save(); c.translate(x,y); c.scale(s,s); c.globalAlpha=.35;
        [[-80,8,72,14],[-21,-3,48,19],[25,2,61,16],[84,12,77,10]].forEach(q=>oval(c,...q,'#fff7db')); c.restore(); });
      path(c, [[0,290],[0,180],[95,124],[163,170],[241,95],[325,172],[403,119],[507,192],[569,155],[651,204],[742,115],[823,182],[928,123],[1026,173],[1123,130],[1280,198],[1280,340]], '#8aa99b');
      path(c, [[0,308],[0,235],[106,184],[182,232],[286,165],[365,217],[437,180],[538,252],[634,207],[738,244],[830,171],[935,211],[1042,171],[1127,231],[1210,190],[1280,219],[1280,350]], '#78978a');
      // Weathered Hokage cliff, carved faces and broken horizontal rock strata.
      path(c, [[258,300],[271,198],[315,155],[381,149],[410,133],[474,141],[504,131],[554,151],[610,143],[677,176],[705,235],[718,319]], '#afad8a');
      path(c, [[270,240],[296,188],[338,178],[381,166],[429,153],[478,158],[532,165],[577,160],[651,188],[687,243],[704,312],[271,312]], '#bfbb97');
      for(let i=0;i<18;i++){ const y=166+i*8; line(c,[[291-rand()*10,y],[340+rand()*60,y+rand()*6],[436+rand()*40,y-2],[520+rand()*120,y+4],[665+rand()*20,y+rand()*7]], '#8c927744', 1.2); }
      [[354,212,.82],[440,199,.93],[536,209,.87],[622,227,.7]].forEach(([x,y,s], idx) => this.monument(c,x,y,s,idx));
      // Dense forest canopy, in three depth bands.
      for(let band=0;band<3;band++) {
        const base=305+band*29;
        for(let x=-30;x<1330;x+=25+rand()*25){const h=30+rand()*64;this.tree(c,x,base,h,['#587c6c','#456d5d','#315f50'][band],rand);}
      }
      // Konoha's low village roofs peek through the foliage.
      for(let side=0;side<2;side++) for(let j=0;j<8;j++) {
        const x=(side?970:20)+j*35+rand()*20,y=298+rand()*36,w=35+rand()*33,h=25+rand()*31;
        rounded(c,x,y,w,h,1,'#d6c5a1','#777d66',1); path(c,[[x-7,y+1],[x+w*.5,y-19],[x+w+8,y+1]],j%2?'#72837b':'#965b49','#53645b',1.2);
        for(let k=1;k<3;k++) rounded(c,x+w*k/3-4,y+9,7,10,1,'#596b64');
      }
      // River behind the arena and low stone parapets.
      g=c.createLinearGradient(0,330,0,434);g.addColorStop(0,'#688f85');g.addColorStop(.5,'#8aafa1');g.addColorStop(1,'#c6c6a1');c.fillStyle=g;c.fillRect(0,343,W,110);
      for(let i=0;i<55;i++){const x=rand()*W,y=356+rand()*75;line(c,[[x,y],[x+15+rand()*55,y]],'#d7dcc180',1);}
      this.rail(c,0,369,1280);
      // Left wall and wooden training structures.
      this.pillar(c,87,378,151); this.pillar(c,1188,378,151);
      line(c,[[58,235],[1210,235]],'#3c5546',17); line(c,[[53,227],[1217,227]],'#aa5d41',12); line(c,[[44,220],[1223,220]],'#c2744d',6);
      path(c,[[35,217],[1231,217],[1214,227],[53,227]],'#344c43');
      // Upper gate is intentionally an edge frame, keeping the combat center clear.
      c.save();c.globalAlpha=.2;line(c,[[132,244],[1149,244]],'#b36c40',3);c.restore();
      [126,1150].forEach((x,i)=>{
        line(c,[[x,243],[x,326]],'#563b2d',3);
        path(c,[[x-19,249],[x+19,249],[x+19,317],[x,330],[x-19,317]],i?'#a94f3b':'#b75d3e','#e0ad6c',2);
        c.font='bold 25px serif';c.textAlign='center';c.fillStyle='#edcf8d';c.fillText(i?'忍':'火',x,287);
      });
      // Stone arena: perspective seams, fine mottling, worn edge and engraved circle.
      path(c,[[0,416],[1280,416],[1280,720],[0,720]],'#c3bea0');
      g=c.createLinearGradient(0,408,0,720);g.addColorStop(0,'#c2b994');g.addColorStop(.45,'#d5c7a2');g.addColorStop(1,'#9e9e80');c.fillStyle=g;c.fillRect(0,416,W,304);
      path(c,[[0,415],[1280,415],[1280,430],[0,430]],'#e5d1a8');line(c,[[0,430],[1280,430]],'#788570',4);
      const ys=[434,466,509,565,638,720];ys.forEach((y,i)=>line(c,[[0,y],[1280,y]],'#7c846a50',i>2?2:1.2));
      const vanishX=640;for(let x=-900;x<2300;x+=185) line(c,[[mix(vanishX,x,.46),430],[x,720]],'#777e6550',1.6);
      for(let i=0;i<480;i++){const x=rand()*W,y=433+rand()*287;oval(c,x,y,rand()*2+.3,rand()*.7+.2,i%3?'#717d5b22':'#fff0be2b');}
      c.save();c.translate(640,552);c.scale(1,.31);oval(c,0,0,247,247,null,'#8d97724d',3);oval(c,0,0,229,229,null,'#e4dbb044',2);
      for(let i=0;i<12;i++){const a=i*TAU/12;line(c,[[Math.cos(a)*229,Math.sin(a)*229],[Math.cos(a)*244,Math.sin(a)*244]],'#8d977244',2);}
      c.beginPath();for(let i=0;i<115;i++){const a=i*.105,r=i*.51;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.strokeStyle='#8d97723b';c.lineWidth=9;c.stroke();c.restore();
      // Scattered cracks and shadows lend the flat arena physical depth.
      [[22,551,1],[1100,474,.7],[405,662,.8],[948,654,.9],[173,474,.5]].forEach(([x,y,s])=>{c.save();c.translate(x,y);c.scale(s,s);line(c,[[0,0],[16,7],[25,4],[37,12],[44,10]],'#69745a77',1.5);line(c,[[16,7],[13,17]],'#69745a55',1);c.restore();});
      g=c.createLinearGradient(0,0,0,170);g.addColorStop(0,'#203d5344');g.addColorStop(1,'#203d5300');c.fillStyle=g;c.fillRect(0,0,W,170);
      // Side vegetation and posts, below the combat band.
      for(let side=0;side<2;side++){const x=side?1273:7;for(let i=0;i<18;i++){const xx=x+(side?-1:1)*rand()*41,yy=640+rand()*80;line(c,[[xx,yy],[xx+(rand()-.5)*27,yy-14-rand()*30]],'#526d49',2);}}
      g=c.createRadialGradient(640,390,260,640,390,760);g.addColorStop(0,'#293c3000');g.addColorStop(1,'#20332b4d');c.fillStyle=g;c.fillRect(0,0,W,H);
    }

    monument(c,x,y,s,i) {
      c.save();c.translate(x,y);c.scale(s,s);
      path(c,[[-29,-31],[-23,-46],[-5,-53],[19,-44],[30,-25],[25,30],[11,45],[-11,43],[-26,26]],'#c5c29d','#9b9e7e',2);
      path(c,[[-24,-31],[-35,-23],[-29,-43],[-14,-56],[1,-62],[23,-50],[34,-35],[27,-21],[20,-37],[7,-42],[-6,-38]],'#8c9577');
      path(c,[[-25,-18],[24,-18],[24,-6],[-25,-6]],'#a0a585');line(c,[[-21,-16],[21,-16]],'#d0cba4',2);
      line(c,[[-17,2],[-9,0],[-4,3]],'#7f886c',2.3);line(c,[[6,2],[15,0],[20,3]],'#7f886c',2.3);
      path(c,[[1,0],[-3,19],[5,20]],'#aaaE8b');line(c,[[-10,29],[8,29],[14,26]],'#8e9677',2);
      if(i===1)line(c,[[-21,7],[-26,26],[-12,43]],'#9ca17f',5);
      c.restore();
    }
    tree(c,x,y,h,col,r) {
      line(c,[[x,y],[x-3,y-h*.62]],'#465b45',h*.08);
      for(let j=0;j<4;j++){const yy=y-h*.42-j*h*.16;oval(c,x+(r()-.5)*h*.22,yy,h*(.31-j*.035),h*.24,col);}
      oval(c,x-h*.1,y-h*.82,h*.19,h*.19,col);
    }
    rail(c,x,y,w) {
      c.fillStyle='#7d8c75';c.fillRect(x,y,w,15);c.fillStyle='#b7b795';c.fillRect(x,y-5,w,9);
      for(let xx=x+15;xx<x+w;xx+=95){rounded(c,xx,y+12,53,27,2,'#a1aa88','#6e816b',1.4);line(c,[[xx+4,y+17],[xx+46,y+17]],'#c2c29a',1);}
      c.fillStyle='#687c65';c.fillRect(x,y+37,w,7);
    }
    pillar(c,x,y,h) {
      rounded(c,x-15,y-h,30,h,2,'#8e4e38','#3f4939',2);
      c.fillStyle='#bd7951';c.fillRect(x-11,y-h+5,7,h-5);c.fillStyle='#5a4233';c.fillRect(x+10,y-h+2,5,h-2);
      rounded(c,x-22,y-11,44,16,3,'#687565','#405442',2);rounded(c,x-20,y-h-5,40,13,2,'#d49a64','#5c5f46',2);
    }

    render(state = {}, dt = 1/60) {
      const delta=Number.isFinite(dt)?clamp(dt,0,.05):1/60;
      this.time = Number.isFinite(state.elapsed) ? state.elapsed : this.time + delta;
      const t=this.time,c=this.ctx; c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);
      const entities=state.entities||[],effects=state.effects||[],chars=[state.player,state.enemy].filter(Boolean);
      const ult=chars.find(f=>f.action==='ultimate');
      this.impactPulse=Math.max(0,this.impactPulse-delta);this.ultimatePulse=Math.max(0,this.ultimatePulse-delta);
      // Effects retain identity while paused, so every confirmed hit gets one impulse.
      for(const e of effects){if(e&&e.type==='spark'&&e.life>0&&!this.seenImpacts.has(e)){
        this.seenImpacts.add(e);this.impactPulse=.14;this.impactPower=Number(e.radius)>80?6.6:4.2;
        this.impactPoint={x:Number(e.x)||640,y:Number(e.y)||470};
      }}
      if(ult&&ult!==this.previousUltimate)this.ultimatePulse=.62;
      this.previousUltimate=ult||null;
      c.save();
      const shake=clamp((Number(state.shake||state.cameraShake)||0)+this.impactPower*(this.impactPulse/.14)**2,0,9);
      if(shake)c.translate(Math.sin(t*97+this.impactPulse*43)*shake,Math.cos(t*121+this.impactPulse*31)*shake*.6);
      c.drawImage(this.bg,-9,-9,W+18,H+18);
      if(ult){
        c.save();const envelope=clamp((Number(ult.actionTime)||0)/.26,0,1),pulse=this.ultimatePulse/.62;
        c.fillStyle=`rgba(7,17,32,${envelope*(.27+pulse*.17)})`;c.fillRect(0,0,W,H);
        if(pulse>0){
          c.beginPath();c.rect(0,146,W,520);c.clip();c.globalCompositeOperation='screen';
          const cx=Number(ult.x)||640,cy=(Number(ult.y)||520)-75,col=fxColor(ult.profile?.color,'#d7dfff');
          for(let i=0;i<30;i++){const a=i*TAU/30+.025*Math.sin(i*17),inner=210+(i%5)*22,outer=inner+230+(i%4)*70;
            const g=c.createLinearGradient(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner,cx+Math.cos(a)*outer,cy+Math.sin(a)*outer);
            g.addColorStop(0,fade(col,0));g.addColorStop(.55,fade(col,pulse*.35));g.addColorStop(1,fade('#ffffff',pulse*.5));
            line(c,[[cx+Math.cos(a)*inner,cy+Math.sin(a)*inner],[cx+Math.cos(a)*outer,cy+Math.sin(a)*outer]],g,1.4+i%3*1.3);
          }
        }c.restore();
      }
      // Floating dust and leaves are deliberately quiet behind the fighters.
      for(let i=0;i<22;i++){const x=(i*151.37+t*(9+i%4*3))%1320-20,y=300+(i*57.1)%300+Math.sin(t*.55+i)*12;
        c.save();c.globalAlpha=.12+(i%3)*.04;oval(c,x,y,i%4?1.5:3,i%4?1.5:1.2,'#fff0bd');c.restore();}
      this.fighters={player:state.player,enemy:state.enemy};
      entities.filter(e=>e.kind==='area'||e.delay>0).forEach(e=>this.entity(c,e,t,true));
      effects.filter(e=>['circle','aura','heal','clone'].includes(e.type)).forEach(e=>this.effect(c,e,t));
      const depth=chars.map(f=>({kind:'fighter',y:f.y||520,value:f})).concat(entities.filter(e=>e.kind!=='area'&&!(e.delay>0)).map(e=>({kind:'entity',y:e.y||500,value:e})));
      depth.sort((a,b)=>a.y-b.y).forEach(e=>e.kind==='fighter'?this.fighter(c,e.value,t):this.entity(c,e.value,t,false));
      entities.filter(e=>e.kind==='area'&&!(e.delay>0)).forEach(e=>this.entity(c,e,t,false));
      effects.filter(e=>!['circle','aura','heal','clone'].includes(e.type)).forEach(e=>this.effect(c,e,t));
      if(this.impactPulse>0){
        c.save();c.globalCompositeOperation='screen';const p=this.impactPulse/.14,rr=this.impactPower>5?190:125;
        const g=c.createRadialGradient(this.impactPoint.x,this.impactPoint.y,0,this.impactPoint.x,this.impactPoint.y,rr);
        g.addColorStop(0,fade('#fffbe3',p*.38));g.addColorStop(.23,fade('#ffe2a3',p*.14));g.addColorStop(1,'#fff5d800');
        oval(c,this.impactPoint.x,this.impactPoint.y,rr,rr,g);c.restore();
      }
      c.restore();
      if(ult){c.save();const a=clamp((Number(ult.actionTime)||.5)*.5,0,.55);c.fillStyle=`rgba(5,17,29,${a})`;c.fillRect(0,124,W,27);c.fillRect(0,655,W,24);
        c.fillStyle='#ebd59b';c.font='italic 700 18px "Microsoft YaHei",sans-serif';c.textAlign='right';c.fillText(ult.castName||'奥义 · 解放',1238,675);c.restore();}
      if(state.banner&&typeof state.banner==='string')this.banner(c,state.banner,state);
    }

    fighter(c,f,t) {
      const a=appearance(f.profile),x=Number(f.x)||640,y=Number(f.y)||530,dir=f.facing===-1?-1:1;
      const air=typeof f.air==='number'?f.air:0,dead=f.dead||f.action==='dead',action=f.action||'idle',moving=action==='run'||action==='dash';
      const knocked=!dead&&(Number(f.knockdown)>0||action==='knockdown');
      const gettingUp=!dead&&!knocked&&(Number(f.recovery)>0||action==='getup');
      // The engine's 0.24-second recovery counts down; only the visual pose interpolates.
      const rise= gettingUp?clamp(1-(Number(f.recovery)||0)/.24,0,1):1,riseEase=rise*rise*(3-2*rise);
      const lying=dead||knocked,groundPose=lying?1:gettingUp?1-riseEase:0;
      const scale=.89+clamp((y-400)/190,0,1)*.14;
      c.save();c.globalAlpha=dead?.52:1;
      oval(c,x-dir*30*groundPose*scale,y+3,(34+24*groundPose)*scale*(1-clamp(air/350,0,.35)),8*scale,'#233e344d');
      // Team markers stay on the ground while a fighter moves or is airborne.
      if(!dead){
        const enemy=f.side==='enemy'||f===this.fighters?.enemy;
        const ring=enemy?'#ff4b52':'#369eff',rim=enemy?'#ffd0ca':'#c4edff';
        c.save();
        oval(c,x,y+3,45*scale,13*scale,ring+'24','#142638b8',6*scale);
        c.shadowColor=ring;c.shadowBlur=9;
        oval(c,x,y+3,45*scale,13*scale,null,ring,3.4*scale);
        c.shadowBlur=0;
        oval(c,x,y+3,39*scale,9*scale,null,rim+'c4',1.1*scale);
        c.restore();
      }
      if(f.invuln>0){oval(c,x,y+2,42,10,null,'#cbe9df80',1.5);}
      c.translate(x,y-air);c.scale(dir*scale,scale);
      if(lying){c.translate(1,-12);c.rotate(-1.36);c.scale(.88,.88);}
      else if(gettingUp){c.translate(groundPose,-12*groundPose+Math.sin(rise*Math.PI)*8);c.rotate(-1.36*groundPose);const s=1-.12*groundPose;c.scale(s,s);}
      const gait=(Number(f.walk)||t*10)*(action==='run'?1:.4),wave=Math.sin(gait*1.6),idle=lying||gettingUp?0:Math.sin(t*3.5+x*.01)*1.3;
      const attacking=action==='attack',casting=action==='skill'||action==='ultimate';
      const hurt=action==='hurt',dash=action==='dash';
      let bodyX=moving?10:0,bodyY=moving?-2:idle;
      if(hurt)bodyX=-6;
      if(air>8)bodyY-=3;
      c.translate(bodyX,bodyY);
      // Silhouette and glow behind the limbs.
      if(a.glow||action==='ultimate') {
        c.save();c.globalCompositeOperation='screen';const gr=c.createRadialGradient(0,-65,8,0,-65,95);gr.addColorStop(0,(a.glow||'#63b5ff')+'32');gr.addColorStop(1,'#ffe29a00');c.fillStyle=gr;c.fillRect(-110,-175,220,205);c.restore();
      }
      if(dash){c.save();c.globalAlpha=.13;for(let i=1;i<=3;i++){c.fillStyle=a.top;c.beginPath();c.ellipse(-i*24,-65,20,49,0,0,TAU);c.fill();line(c,[[-i*26,-105],[-i*26-36,-101]],a.hair,6);}c.restore();}
      if(a.hairStyle==='long'||a.hairStyle==='madara'||a.hairStyle==='deidara')this.backHair(c,a,t,moving);
      if(['akatsuki','minato','jiraiya','tsunade','gaara','kcm'].includes(a.costume))this.cape(c,a,t,moving,casting);
      if(a.face==='glasses') {c.save();c.translate(-28,-47);c.rotate(-.3);c.beginPath();c.moveTo(0,-30);c.bezierCurveTo(-29,-10,20,21,-8,34);c.strokeStyle=OUTLINE;c.lineWidth=15;c.stroke();c.strokeStyle='#bcbfa9';c.lineWidth=11;c.stroke();for(let i=0;i<4;i++)line(c,[[-8+i,-14+i*11],[3+i,-10+i*11]],'#7f8c80',1);c.restore();}
      if(a.costume==='gaara') {c.save();c.translate(-25,-67);c.rotate(-.22);oval(c,0,5,18,30,'#b8a174',OUTLINE,2);oval(c,0,-21,12,16,'#b8a174',OUTLINE,2);rounded(c,-6,-39,12,9,2,'#9d815c',OUTLINE,2);line(c,[[-14,0],[14,0]],'#896a49',3);line(c,[[-11,-20],[11,-20]],'#896a49',2);c.restore();}
      // The farther arm sits behind the body.
      let backShoulder=[-13,-84],backElbow=[-23,-64],backHand=[-16,-50];
      if(moving){backElbow=[-37,-91+wave*4];backHand=[-57,-85+wave*3];}
      if(casting){backElbow=[-21,-77];backHand=[-4,-74];}
      if(attacking){backElbow=[-25,-69];backHand=[-5,-76];}
      if(hurt){backElbow=[-32,-75];backHand=[-37,-65];}
      if(knocked){backElbow=[-24,-65];backHand=[-30,-44];}
      if(gettingUp){backElbow=[mix(-28,-23,riseEase),mix(-64,-64,riseEase)];backHand=[mix(-35,-16,riseEase),mix(-34,-50,riseEase)];}
      this.arm(c,backShoulder,backElbow,backHand,a,false);
      // Legs are bent at real knees with wrapped shins and open-toe sandals.
      let lk=[-10,-23],lf=[-16,-3],rk=[13,-23],rf=[17,-2];
      if(moving){lk=[-15-wave*10,-27+Math.abs(wave)*5];lf=[-10-wave*27,-3-Math.max(0,wave)*13];rk=[14+wave*10,-28+Math.abs(wave)*5];rf=[12+wave*27,-3-Math.max(0,-wave)*13];}
      if(air>8){lk=[-23,-29];lf=[-27,-12];rk=[21,-39];rf=[34,-30];}
      if(attacking&&Number(f.attackIndex)%3===0){rk=[29,-44];rf=[51,-44];}
      if(hurt){lk=[-16,-23];lf=[-20,-3];rk=[12,-27];rf=[26,-7];}
      if(knocked){lk=[-14,-26];lf=[-20,-5];rk=[15,-28];rf=[24,-9];}
      if(gettingUp){const bend=Math.sin(rise*Math.PI);lk=[-10-12*bend,-23-7*bend];lf=[-16-5*bend,-3];rk=[13+9*bend,-23-10*bend];rf=[17+12*bend,-2-3*bend];}
      this.leg(c,[-8,-52],lk,lf,a,true);this.leg(c,[8,-52],rk,rf,a,false);
      this.torso(c,a,t,action);
      // Head and neck, independently tilted with the animation.
      c.save();c.translate(moving?3:0,moving?1:0);if(hurt)c.rotate(-.12);else if(moving)c.rotate(.12);
      rounded(c,-5,-100,11,15,3,a.skin,OUTLINE,1.2);this.head(c,a,t);c.restore();
      let sh=[12,-83],el=[24,-63],hand=[20,-47];
      if(moving){el=[-11,-71-wave*4];hand=[-34,-62-wave*3];}
      if(casting){el=[27,-80];hand=[40,-93];}
      if(attacking){const k=(Number(f.attackIndex)||1)%3;el=k===0?[22,-78]:[30,-80];hand=k===0?[22,-103]:[53,-83];}
      if(action==='ultimate'){el=[19,-103];hand=[22,-124];}
      if(hurt){el=[31,-89];hand=[35,-103];}
      if(knocked){el=[25,-67];hand=[35,-49];}
      if(gettingUp){el=[mix(26,24,riseEase),mix(-65,-63,riseEase)];hand=[mix(36,20,riseEase),mix(-30,-47,riseEase)];}
      this.arm(c,sh,el,hand,a,true);
      if(casting||attacking){
        if(a.costume==='sasuke'&&attacking){line(c,[[hand[0]-4,hand[1]+7],[hand[0]+31,hand[1]-30]],'#dbe9e5',4);line(c,[[hand[0]-4,hand[1]+8],[hand[0]-12,hand[1]+17]],'#242e3d',5);line(c,[[hand[0]-8,hand[1]+1],[hand[0]+1,hand[1]+10]],'#c2b379',3);}
        if(casting){const typ=String(f.castType||f.castName||'');this.handChakra(c,hand,typ,t,action==='ultimate');}
      }
      // Armor resists reactions while taking damage: open contour accents, without a shield bubble.
      if(!dead&&!knocked&&Number(f.armorTime)>0&&(f.armorKind==='skill'||f.armorKind==='adamant')){
        const color=f.armorKind==='adamant'?'#f5ce76':'#8bd0f5';
        c.save();c.globalAlpha=.46+Math.sin(t*7)*.07;c.shadowColor=color;c.shadowBlur=4;
        line(c,[[-17,-91],[-23,-82],[-21,-65],[-17,-52]],color,2.2);
        line(c,[[17,-91],[22,-81],[22,-65],[17,-52]],color,2.2);
        line(c,[[-9,-93],[-2,-95]],color,1.7);line(c,[[7,-94],[13,-92]],color,1.7);
        c.restore();
      }
      // A narrow rim light makes fighters read against both scenery and VFX.
      if(f.invuln>0&&!dead){c.save();c.globalAlpha=.3+.15*Math.sin(t*25);c.strokeStyle='#d4f7e7';c.lineWidth=2;c.beginPath();c.ellipse(0,-68,29,67,0,-1.3,1.3);c.stroke();c.restore();}
      c.restore();
    }

    backHair(c,a,t,moving) {
      const sway=Math.sin(t*4)*3+(moving?-9:0),long=a.hairStyle==='madara';
      path(c,[[-16,-123],[-29,-109],[-31+sway,-83],[-35+sway,-65],[-22+sway,-74],[-28+sway,-47],[-11+sway,-62],[-2,-95],[14,-112],[12,-128]],a.hair,OUTLINE,2);
      if(long){path(c,[[-18,-124],[-35,-110],[-42+sway,-86],[-46+sway,-74],[-32+sway,-82],[-35+sway,-56],[-23+sway,-65],[-24,-43],[-10,-61],[11,-88],[17,-115]],a.hair,OUTLINE,2);line(c,[[-23,-111],[-28,-78],[-20,-60]],'#73809044',2);}
      if(a.hairStyle==='deidara'){path(c,[[-8,-135],[-22,-143],[-36,-133],[-26,-126],[-33,-106],[-40+sway,-85],[-27+sway,-93],[-18,-121]],a.hair,OUTLINE,2);}
    }
    cape(c,a,t,moving,casting) {
      const sway=Math.sin(t*4.4)*4,back=moving?-18:0;
      if(a.costume==='kcm'){
        path(c,[[-16,-89],[-23,-78],[-30+back,-34],[-21+sway,-38],[-23+sway,-25],[-12,-35],[-4,-29],[10,-35],[15,-83]],'#f8cb55',OUTLINE,2);
        line(c,[[-19,-78],[-24,-45]],'#333237',3);line(c,[[-25,-36],[-20,-30],[-11,-38]],'#f8e49a',2);
        c.save();c.globalAlpha=.5;c.shadowColor='#ffcf56';c.shadowBlur=12;line(c,[[-24,-77],[-30+back,-35],[-23+sway,-26]],'#ffe7a3',2);c.restore();
      }else if(a.costume==='akatsuki'){
        path(c,[[-18,-90],[-26,-72],[-29+back,-28],[-18+sway,-20],[-3,-23],[15+sway,-23],[23,-34],[17,-89]],'#242a34',OUTLINE,2.5);
        path(c,[[-20,-91],[-24,-101],[-6,-99],[5,-91],[16,-99],[21,-90],[9,-79],[-7,-83]],'#8e363d',OUTLINE,2);
      }else if(a.costume==='minato'){
        path(c,[[-19,-89],[-26,-78],[-39+back,-32],[-23+sway,-34],[-28+sway,-20],[-11,-27],[2,-23],[19,-25],[16,-88]],'#e9e5d5',OUTLINE,2.5);
        path(c,[[-38+back,-31],[-31+back,-35],[-29+back,-27],[-23,-39],[-21,-28],[-15,-37],[-12,-27],[-4,-37],[0,-25],[9,-36],[15,-26],[18,-28],[18,-21],[-9,-20],[-27,-17]],'#b74d39');
        line(c,[[-22,-78],[-29,-46]],'#b1bcab',2);
      }else if(a.costume==='jiraiya'){
        path(c,[[-22,-87],[-31,-81],[-32+back,-34],[-15,-25],[-8,-64],[8,-64],[15,-26],[24,-32],[22,-85]],'#a84e42',OUTLINE,2.4);
        oval(c,-19,-72,4,5,'#e9d89b');oval(c,17,-72,4,5,'#e9d89b');
      }else if(a.costume==='tsunade'){
        path(c,[[-22,-86],[-28,-74],[-31+back,-30],[-15,-24],[-7,-61],[10,-60],[20,-24],[26,-29],[21,-84]],'#69926f',OUTLINE,2);
      }else {path(c,[[-16,-86],[-24,-70],[-29+back,-27],[-14,-21],[3,-26],[20,-28],[16,-86]],'#b6a582',OUTLINE,2);}
    }
    leg(c,hip,knee,foot,a,far) {
      const pants=a.leg,thick=a.costume==='sakura'||a.costume==='konan'?11:a.costume==='ay'?16:13;
      line(c,[hip,knee,foot],OUTLINE,thick+3);line(c,[hip,knee,foot],pants,thick);
      if(a.costume==='lee') {line(c,[[mix(knee[0],foot[0],.35),mix(knee[1],foot[1],.35)],foot],'#bc7950',thick+1);}
      else {line(c,[[mix(knee[0],foot[0],.6),mix(knee[1],foot[1],.6)],foot],'#bdc3ad',thick-1);}
      for(let i=0;i<3;i++){const q=.64+i*.12;line(c,[[mix(knee[0],foot[0],q)-4,mix(knee[1],foot[1],q)],[mix(knee[0],foot[0],q)+4,mix(knee[1],foot[1],q)+1]],'#526868',1);}
      rounded(c,foot[0]-6,foot[1]-4,17,8,3,'#263e4b',OUTLINE,1.5);rounded(c,foot[0]+5,foot[1]-2,6,4,1,a.skin);
      if(far){c.save();c.globalAlpha=.13;line(c,[hip,knee,foot],'#142b37',thick);c.restore();}
    }
    arm(c,sh,el,hand,a,front) {
      const sleeveless=['sakura','konan','ay','shisui'].includes(a.costume),bulky=a.costume==='ay';
      line(c,[sh,el,hand],OUTLINE,bulky?17:13);line(c,[sh,el],sleeveless?a.skin:a.costume==='vest'||a.costume==='minato'?'#2f4658':a.top,bulky?14:10);
      line(c,[el,hand],a.costume==='akatsuki'?'#2b303a':sleeveless?a.skin:a.costume==='vest'||a.costume==='minato'?'#2f4658':a.top,bulky?13:9);
      if(a.costume!=='akatsuki') {const q=[mix(el[0],hand[0],.75),mix(el[1],hand[1],.75)];line(c,[q,hand],a.costume==='sakura'?'#283748':'#e1dcc1',9);}
      oval(c,hand[0],hand[1],5.1,5.3,a.skin,OUTLINE,1.4);
      if(front)line(c,[[hand[0]+2,hand[1]-2],[hand[0]+3,hand[1]+2]],'#a87458',.8);
    }
    torso(c,a,t,action) {
      const co=a.costume;
      if(co==='akatsuki') {
        path(c,[[-17,-90],[14,-90],[20,-38],[9,-31],[-9,-31],[-21,-39]],a.top,OUTLINE,2.3);
        line(c,[[5,-88],[7,-36]],'#aa4648',2.5);this.cloud(c,-9,-64,.7);this.cloud(c,10,-41,.5);
        return;
      }
      path(c,[[-16,-89],[14,-89],[18,-55],[11,-48],[-11,-48],[-18,-55]],a.top,OUTLINE,2.3);
      path(c,[[-15,-85],[-17,-58],[-7,-53],[-7,-82]],'#111f2a18');
      if(co==='naruto') {
        path(c,[[-15,-90],[14,-90],[16,-76],[-16,-76]],'#293b47');line(c,[[1,-88],[1,-52]],'#ecd5a1',2);line(c,[[4,-81],[10,-81]],'#d5d3b6',1);
        rounded(c,-16,-56,33,8,2,'#273d48',OUTLINE,1.2);rounded(c,6,-55,6,5,1,'#959c91');
        line(c,[[-11,-72],[-11,-60]],'#f9a85c',2.4);
      } else if(co==='kcm') {
        path(c,[[-16,-89],[-11,-95],[-3,-88],[4,-95],[15,-89],[11,-79],[-12,-79]],'#f9de87',OUTLINE,1.5);
        line(c,[[0,-87],[0,-51]],'#343335',3);line(c,[[-15,-57],[15,-57]],'#333237',4);line(c,[[-12,-76],[-11,-63]],'#fff0a5',2);
        [-9,-4,4,9].forEach((xx,i)=>{oval(c,xx,-79+(i===0||i===3?-2:1),1.9,2.4,'#2f3031');line(c,[[xx,-77],[xx-2,-74]],'#2f3031',1.7);});
        oval(c,0,-66,6,6,null,'#373233',2.5);c.beginPath();c.arc(0,-66,2.8,0,4.8);c.strokeStyle='#373233';c.lineWidth=1.6;c.stroke();
        line(c,[[-12,-50],[-10,-35]],'#343335',3);line(c,[[11,-50],[12,-35]],'#343335',3);
      } else if(co==='vest'||co==='minato') {
        path(c,[[-16,-88],[-5,-92],[0,-81],[7,-92],[16,-88],[16,-55],[-16,-55]],'#7b8d65',OUTLINE,1.5);
        line(c,[[0,-82],[0,-54]],'#374d43',2);
        [[-12,-77],[-12,-65],[5,-77],[5,-65]].forEach(([x,y])=>rounded(c,x,y,8,9,1,'#879877','#52664d',1));
        path(c,[[-14,-90],[-17,-97],[-3,-96],[0,-84],[6,-96],[17,-96],[16,-88]],'#6a7e5a',OUTLINE,1.3);
      } else if(co==='sasuke') {
        path(c,[[-14,-90],[-5,-82],[0,-67],[5,-82],[14,-90],[8,-95],[0,-86],[-8,-95]],'#e7e6df',OUTLINE,1.5);
        path(c,[[-5,-84],[0,-68],[5,-84]],a.skin);
        line(c,[[-17,-54],[17,-54]],'#8373a0',8);oval(c,11,-54,5,6,null,'#9585b0',3);line(c,[[11,-48],[17,-39],[11,-32]],'#8373a0',4);
        rounded(c,-18,-68,4,14,1,'#a4acb2');
      } else if(co==='sakura') {
        path(c,[[-11,-54],[-18,-35],[0,-41],[17,-34],[11,-54]],a.top,OUTLINE,2);
        line(c,[[0,-88],[0,-47]],'#e0bb9e',1.4);oval(c,0,-72,7,8,null,'#e5d3bb',2);
      } else if(co==='armor') {
        for(let i=0;i<4;i++)rounded(c,-19,-89+i*11,38,10,3,i%2?a.top:'#a9534d',OUTLINE,1.5);
        [[-25,-84],[20,-84]].forEach(([x,y])=>{rounded(c,x,y,12,24,2,a.top,OUTLINE,1.5);line(c,[[x+1,y+8],[x+11,y+8]],a.trim,1.5);line(c,[[x+1,y+16],[x+11,y+16]],a.trim,1.5);});
        path(c,[[-19,-48],[-25,-28],[-9,-26],[-5,-46]],a.top,OUTLINE,1.5);path(c,[[4,-46],[9,-27],[25,-29],[19,-48]],a.top,OUTLINE,1.5);
      } else if(co==='hinata') {
        path(c,[[-13,-90],[0,-77],[14,-90],[13,-82],[0,-70],[-14,-82]],'#e4dfcf',OUTLINE,1.2);line(c,[[0,-74],[0,-51]],'#696c85',1.5);rounded(c,-11,-65,8,5,1,'#8b8caa');
      } else if(co==='lee') {
        rounded(c,-17,-58,34,7,2,'#bd8360',OUTLINE,1);rounded(c,-7,-59,13,9,1,'#9ba6a4',OUTLINE,1);this.leaf(c,0,-54,3,'#364946');
      } else if(co==='jiraiya') {
        path(c,[[-10,-89],[11,-89],[12,-52],[-11,-52]],'#8c977c',OUTLINE,1.3);line(c,[[-13,-54],[13,-54]],'#4e5d4a',5);
      } else if(co==='tsunade') {
        path(c,[[-13,-90],[0,-69],[13,-90],[10,-51],[-11,-51]],'#d5d4be',OUTLINE,1.3);line(c,[[-12,-54],[12,-54]],'#647484',6);
      } else if(co==='gaara') {
        line(c,[[-11,-86],[14,-57]],'#c6b389',10);line(c,[[-12,-56],[17,-56]],'#d6c6a1',7);rounded(c,-4,-60,10,8,1,'#8e8468');
      } else if(co==='haku') {
        path(c,[[-15,-88],[-1,-73],[12,-89],[15,-80],[0,-66],[-17,-79]],'#e5e7d5',OUTLINE,1.2);line(c,[[-17,-57],[17,-57]],'#6e8990',7);path(c,[[-17,-53],[-24,-29],[0,-36],[23,-29],[17,-53]],a.top,OUTLINE,1.8);
      } else if(co==='ay') {
        path(c,[[-17,-90],[0,-92],[17,-88],[19,-52],[-18,-52]],a.skin,OUTLINE,2);line(c,[[-16,-79],[-3,-82]],'#734f40',1.5);line(c,[[5,-82],[16,-79]],'#734f40',1.5);line(c,[[0,-80],[0,-59]],'#916147',1.5);line(c,[[-19,-53],[19,-53]],'#6f855e',8);rounded(c,-6,-56,13,8,1,'#d6c7a3',OUTLINE,1);path(c,[[-20,-88],[-25,-91],[-22,-68],[-15,-58],[-12,-69]],'#eee8d4',OUTLINE,1.5);
      } else if(co==='shisui') {
        path(c,[[-17,-91],[15,-91],[16,-80],[-16,-79]],'#263b39',OUTLINE,1.3);line(c,[[-16,-56],[16,-56]],'#a7a798',7);rounded(c,-6,-59,13,8,1,'#a4b8b4',OUTLINE,1);this.leaf(c,0,-55,3,'#4d6868');
      } else if(co==='konan') {
        path(c,[[-13,-88],[-8,-96],[0,-86],[8,-96],[14,-88],[15,-71],[1,-66],[-14,-72]],'#d8d7e7',OUTLINE,1.5);path(c,[[-14,-69],[-12,-51],[12,-51],[14,-68]],a.skin,OUTLINE,1.3);path(c,[[-13,-52],[-18,-38],[0,-42],[17,-38],[13,-52]],'#66668e',OUTLINE,1.5);oval(c,0,-78,4,5,'#8586ab');
      }
      line(c,[[-10,-49],[10,-49]],'#101f2a55',1);
    }
    head(c,a,t) {
      const hs=a.hairStyle;
      // Ear and jaw proportions stay human; the face is angled toward the opponent.
      oval(c,-14,-114,4,6,a.skin,OUTLINE,1.3);oval(c,13,-113,4,6,a.skin,OUTLINE,1.3);
      path(c,[[-14,-126],[-7,-133],[7,-132],[16,-123],[15,-108],[8,-99],[-1,-97],[-11,-103],[-15,-114]],a.skin,OUTLINE,1.7);
      path(c,[[9,-125],[15,-120],[14,-108],[7,-101],[2,-101],[5,-112]],'#b57c5b25');
      if(a.face==='obito') {
        oval(c,2,-115,16,20,'#c87939',OUTLINE,1.5);
        for(let i=0;i<4;i++){c.beginPath();c.ellipse(8,-115,3+i*3,4+i*4,0,-1.5,2.3);c.strokeStyle='#713f2c';c.lineWidth=1;c.stroke();}
        oval(c,8,-117,3.3,4.7,'#1e2731');
      } else {
        if(a.face==='mask') {path(c,[[-15,-113],[15,-111],[12,-103],[3,-98],[-9,-102]],'#2d4355',OUTLINE,1.2);line(c,[[-12,-110],[10,-107]],'#52697c',1);}
        else {line(c,[[6,-105],[11,-105]],'#8e594c',1);path(c,[[10,-116],[13,-110],[9,-110]],'#be8668');}
        line(c,[[-8,-118],[-3,-119]],'#3b3640',1.8);line(c,[[6,-119],[12,-118]],'#3b3640',1.8);
        oval(c,-4,-115,2.4,1.7,/雏田|宁次/.test(a.name)?'#e6dfe7':'#d2d9d5');oval(c,10,-115,2.4,1.7,/雏田|宁次/.test(a.name)?'#e6dfe7':'#d2d9d5');
        if(!/雏田|宁次/.test(a.name)){oval(c,-3.5,-115,1.1,1.6, /佐助|鼬|斑|卡卡西/.test(a.name)?'#a34143':'#374954');oval(c,10.5,-115,1.1,1.6,/佐助|鼬|斑/.test(a.name)?'#a34143':'#374954');}
        if(a.costume==='naruto'||a.costume==='kcm'){[[-12,-110],[-12,-107],[6,-110],[6,-107]].forEach(([x,y],i)=>line(c,[[x,y],[x+5,y+(i%2?1:-1)]],'#9c6b52',.9));}
        if(a.face==='piercing'){[-5,0,5].forEach(x=>oval(c,x,-103,.9,1.2,'#373b42'));oval(c,0,-111,1,1.2,'#373b42');}
        if(a.face==='gills'){line(c,[[-12,-109],[-7,-107]],'#46697a',1);line(c,[[-13,-106],[-8,-104]],'#46697a',1);}
        if(a.face==='redmark'){line(c,[[-9,-113],[-10,-102]],'#a84941',2);line(c,[[10,-113],[11,-104]],'#a84941',2);}
        if(a.face==='glasses'){oval(c,-5,-115,6,5,null,'#6c7483',1.1);oval(c,9,-115,6,5,null,'#6c7483',1.1);line(c,[[1,-116],[3,-116]],'#6c7483',1);line(c,[[-10,-118],[-16,-120]],'#6c7483',1);}
        if(a.face==='haku'){line(c,[[-10,-112],[-8,-109]],'#a2514f',1.4);line(c,[[11,-112],[13,-109]],'#a2514f',1.4);}
      }
      // Hair shapes are drawn as large interlocking locks with a fine highlight.
      if(hs==='spiky'||hs==='short'){
        path(c,[[-16,-117],[-24,-123],[-16,-128],[-22,-134],[-10,-133],[-10,-142],[-3,-138],[3,-148],[9,-137],[17,-141],[18,-132],[26,-131],[19,-125],[24,-119],[14,-121],[8,-130],[1,-125],[-6,-130],[-10,-121]],a.hair,OUTLINE,1.8);
        line(c,[[-7,-136],[-4,-131]],'#ffffff3b',1.5);line(c,[[5,-140],[8,-133]],'#ffffff3b',1.5);
      } else if(hs==='bowl') {
        c.beginPath();c.moveTo(-18,-116);c.bezierCurveTo(-24,-140,18,-145,20,-115);c.lineTo(12,-117);c.lineTo(7,-124);c.lineTo(-9,-122);c.closePath();c.fillStyle=a.hair;c.fill();c.strokeStyle=OUTLINE;c.lineWidth=1.8;c.stroke();line(c,[[-13,-130],[7,-135]],'#9ab79a55',2);
      } else if(hs==='bob'){
        path(c,[[-16,-109],[-22,-121],[-19,-136],[-6,-142],[10,-138],[20,-125],[18,-106],[11,-112],[9,-128],[3,-125],[-2,-133],[-9,-123],[-9,-111]],a.hair,OUTLINE,1.8);
        line(c,[[-15,-132],[-16,-117]],'#ffffff44',1.6);
      } else if(hs==='pony') {
        path(c,[[-16,-123],[-25,-135],[-16,-139],[-20,-148],[-6,-143],[1,-154],[7,-142],[16,-143],[13,-132],[18,-121],[9,-127],[-2,-128]],a.hair,OUTLINE,1.8);
      } else {
        path(c,[[-17,-109],[-21,-125],[-17,-137],[-4,-144],[13,-138],[21,-126],[16,-108],[10,-115],[8,-132],[0,-126],[-6,-134],[-12,-118],[-11,-103]],a.hair,OUTLINE,1.8);
        if(hs==='madara')path(c,[[-11,-139],[2,-143],[16,-137],[24,-124],[17,-115],[11,-120],[12,-108],[6,-116],[1,-121],[-5,-115],[-3,-132]],a.hair,OUTLINE,1.5);
        if(hs==='deidara')path(c,[[-8,-137],[5,-139],[15,-131],[15,-104],[7,-111],[6,-123],[-1,-127]],a.hair,OUTLINE,1.2);
      }
      if(a.band&&a.face!=='obito'){
        // Tie tails and steel Leaf plate, readable even at game scale.
        path(c,[[-15,-124],[-29,-120],[-39,-125],[-33,-116],[-18,-118]],'#263d4d',OUTLINE,1);
        path(c,[[-16,-124],[16,-124],[16,-116],[-15,-117]],'#2d4351',OUTLINE,1);
        rounded(c,-10,-124,22,8,1.5,'#aebcb9','#4c6269',1);this.leaf(c,1,-120,3,'#425a60');
        if(a.face==='mask') {path(c,[[-15,-125],[0,-126],[-2,-112],[-15,-113]],'#aebcb9',OUTLINE,1);line(c,[[-12,-119],[-3,-117]],'#506269',1);}
        if(a.costume==='akatsuki')line(c,[[-8,-122],[10,-119]],'#52626a',1.5);
      }
      if(a.face==='flower'){for(let j=0;j<5;j++){const q=j*TAU/5;oval(c,-15+Math.cos(q)*3,-128+Math.sin(q)*3,2.5,2.5,'#d4dce6','#8995b8',.6);}}
      if(a.costume==='gaara'){c.fillStyle='#803c37';c.font='bold 7px serif';c.fillText('愛',1,-125);}
    }
    leaf(c,x,y,s,color) {
      c.save();c.translate(x,y);c.strokeStyle=color;c.lineWidth=.8;c.beginPath();c.arc(0,0,s*.7,.2,5.3);c.lineTo(s*.7,-s*.7);c.lineTo(s*1.2,-s*.6);c.lineTo(s*.8,.7);c.lineTo(-s*.8,s*.75);c.stroke();c.restore();
    }
    cloud(c,x,y,s) {
      c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(-13,3);c.bezierCurveTo(-18,-2,-12,-8,-8,-5);c.bezierCurveTo(-6,-14,5,-13,6,-6);c.bezierCurveTo(14,-9,18,-1,12,2);c.bezierCurveTo(7,7,-6,7,-13,3);c.fillStyle='#b24447';c.fill();c.strokeStyle='#dec7b8';c.lineWidth=1.1;c.stroke();c.restore();
    }
    handChakra(c,hand,type,t,ult) {
      const mode=this.mode(type),r=ult?28:19,col=mode==='fire'?'#ffac44':mode==='lightning'?'#9bdfff':mode==='sand'?'#e9cc81':mode==='purple'?'#c4a2ff':'#7de7ff';
      c.save();c.translate(hand[0]+9,hand[1]-3);c.globalCompositeOperation='screen';const g=c.createRadialGradient(0,0,1,0,0,r*2.15);g.addColorStop(0,'#ffffff');g.addColorStop(.23,col);g.addColorStop(.55,fade(col,.36));g.addColorStop(1,fade(col,0));oval(c,0,0,r*2.15,r*2.15,g);
      oval(c,0,0,r*.47,r*.47,'#eaffff');
      for(let i=0;i<4;i++){c.beginPath();c.ellipse(0,0,r*(.8+i*.08),r*.32,t*10+i*.8,0,TAU);c.strokeStyle=i%2?'#ffffff':col;c.lineWidth=1.9;c.stroke();}
      if(mode==='lightning')this.lightning(c,-r*.8,r*.6,r*.9,-r*.7,t,col,2);
      c.restore();
    }

    mode(type) {
      const s=String(type||'').toLowerCase();
      if(/fire|flame|火|炎|burn/.test(s))return'fire';if(/lightning|chidori|雷|千鸟/.test(s))return'lightning';
      if(/rasen|螺旋|风|wind/.test(s))return'rasengan';if(/water|水|鲛/.test(s))return'water';if(/sand|砂|沙/.test(s))return'sand';
      if(/wood|木|树/.test(s))return'wood';if(/shuriken|kunai|手里剑|苦无/.test(s))return'shuriken';if(/susano|紫|须佐|amaterasu|天照|purple|幻|写轮|瞳/.test(s))return'purple';
      if(/paper|纸/.test(s))return'paper';if(/genjutsu|幻术|月读/.test(s))return'purple';if(/pull|引|天征/.test(s))return'gravity';if(/trap|起爆|土流/.test(s))return'earth';
      if(/summon|通灵|蛤蟆|蛇|狗/.test(s))return'summon';if(/ink|墨/.test(s))return'ink';if(/clone|分身/.test(s))return'clone';if(/heal|疗|治/.test(s))return'heal';if(/punch|kick|melee|体术|拳|踢|八门|莲华/.test(s))return'physical';return'chakra';
    }
    entity(c,e,t,back) {
      // Only the drawing radius grows; entity geometry and collision data stay untouched.
      const x=Number(e.x)||0,y=Number(e.y)||0,r=clamp(Number(e.radius)||33,6,330)*1.43,color=fxColor(e.color);
      const caster=this.fighters&&this.fighters[e.owner],prof=caster?.profile||{},style=prof.style||'';
      let mode=this.mode(e.type);
      if(mode==='summon'&&['sasuke','itachi','madara','shisui'].includes(style))mode='purple';
      if(mode==='summon'&&style==='hashirama')mode='wood';
      if(mode==='summon'&&style==='orochimaru')mode='snake';
      if(mode==='chakra'&&['naruto','minato'].includes(style))mode='rasengan';
      if(mode==='chakra'&&['sasuke','madara','shisui'].includes(style))mode='purple';
      const age=clamp(1-(Number(e.life)||0)/(Number(e.maxLife)||1),0,1),dir=e.facing===-1?-1:1;
      if(e.delay>0){if(!back)return;c.save();c.translate(x,y);oval(c,0,1,r*.88,r*.27,'#d87b4829','#ffd18dcc',2.5);oval(c,0,1,r*.62,r*.19,null,'#ffead08c',1.5);c.restore();return;}
      if(e.kind==='area'&&back){c.save();c.translate(x,y);oval(c,0,2,r,r*.32,fade(color,.14),fade(color,.72),3.2);oval(c,0,2,r*(.7+age*.36),r*(.22+age*.1),null,fade('#f7f4d5',(1-age)*.6),2);c.restore();return;}
      if(e.kind==='area'&&back===false){c.save();c.translate(x,y);c.globalAlpha=clamp((Number(e.life)||.2)/Math.min(Number(e.maxLife)||.2,.16),0,.96);
        if(mode==='wood'){
          for(let i=0;i<7;i++){const xx=(i-3)*r*.24,hh=(70+Math.sin(i*13)*31)*(e.isUltimate?1.8:1);path(c,[[xx-10,0],[xx-15,-hh*.5],[xx+Math.sin(i)*18,-hh],[xx+13,-hh*.62],[xx+12,0]],'#879553','#294f3d',2.5);path(c,[[xx+1,-5],[xx-1,-hh*.48],[xx+Math.sin(i)*18,-hh],[xx+13,-hh*.62],[xx+12,0]],'#526e43');line(c,[[xx-3,-10],[xx-7,-hh*.65]],'#e2ca85',3);line(c,[[xx-5,-hh*.55],[xx-22,-hh*.76]],'#7b8c4d',7);}
          for(let i=0;i<8;i++){const q=i*2.4;path(c,[[Math.sin(q)*r*.9,-18-i*7],[Math.sin(q)*r*.9+7,-24-i*7],[Math.sin(q)*r*.9+13,-17-i*7],[Math.sin(q)*r*.9+4,-13-i*7]],'#d3d58c','#5e7b4e',1);}
        }
        else if(mode==='sand'){
          for(let i=0;i<9;i++){const q=i*1.83+t*2.2,xx=Math.cos(q)*r*.58,yy=-30-Math.sin(i*2)*45;oval(c,xx,yy,18+i%3*6,33+i%4*8,'#dec184db','#ffe6a9bb',1.8);line(c,[[xx-9,yy-7],[xx+7,yy-15]],'#a58957',1.5);}
          for(let i=0;i<8;i++){const q=i*2.4+t*3;oval(c,Math.cos(q)*r*.88,-30-Math.sin(q)*58,3+i%3,2+i%2,'#fff0b6');}
        }
        else if(mode==='fire')this.fire(c,0,0,r*.8,t,e.isUltimate);
        else if(mode==='lightning'){for(let i=0;i<4;i++)this.lightning(c,-r+i*r*.6,0,Math.sin(i+t*18)*30,-120-i%2*50,t+i,color,3.2);}
        else if(mode==='purple'){
          const h=Math.max((Number(e.height)||150)*1.4,e.isUltimate?315:205),col=color;
          const glow=c.createRadialGradient(0,-h*.45,0,0,-h*.45,r);glow.addColorStop(0,fade(col,.36));glow.addColorStop(1,fade(col,0));oval(c,0,-h*.45,r,r,glow);
          path(c,[[-r*.6,0],[-r*.62,-h*.5],[-r*.3,-h*.83],[0,-h],[r*.3,-h*.83],[r*.62,-h*.5],[r*.6,0]],'#49327788',fade(col,.95),4);
          for(let i=0;i<4;i++){const yy=-h*.3-i*h*.1;line(c,[[-r*(.48-i*.04),yy-3],[-r*.26,yy+8],[0,yy+12],[r*.26,yy+8],[r*(.48-i*.04),yy-3]],fade(col,.94),5);}
          line(c,[[0,-h*.74],[0,-h*.21]],'#42305dbb',15);line(c,[[0,-h*.74],[0,-h*.21]],fade(col,.95),7);
          path(c,[[-r*.2,-h*.78],[-r*.23,-h*.96],[-r*.12,-h*.9],[0,-h*1.03],[r*.12,-h*.9],[r*.23,-h*.96],[r*.2,-h*.78],[0,-h*.7]],fade(col,.4),fade(col,.95),3);
          line(c,[[-r*.11,-h*.85],[-r*.04,-h*.83]],'#ffffff',4.5);line(c,[[r*.04,-h*.83],[r*.11,-h*.85]],'#ffffff',4.5);
          line(c,[[-r*.39,-h*.64],[-r*.76,-h*.4],[-r*.9,-h*.64]],fade(col,.8),19);line(c,[[r*.39,-h*.64],[r*.77,-h*.5],[r,-h*.6]],fade(col,.8),19);
          line(c,[[r*.9,-h*.52],[r*1.36,-h*1.2]],fade(col,.8),15);line(c,[[r*.9,-h*.52],[r*1.36,-h*1.2]],'#e9e6ff',3);line(c,[[r*.85,-h*.63],[r*1.01,-h*.54]],fade(col,.95),5);
        }
        else if(mode==='water'){for(let i=0;i<6;i++){const xx=Math.sin(i*1.7+t*3)*r*.7;line(c,[[xx,0],[xx+Math.sin(t*6+i)*23,-43-i%3*33]],'#75d8e6dd',11);line(c,[[xx-2,-6],[xx+Math.sin(t*6+i)*23-2,-43-i%3*33]],'#e1ffffcc',2);oval(c,xx,0,32,10,null,'#c9fff3cc',2.5);}}
        else if(mode==='paper'){
          for(let i=0;i<20;i++){const q=i*2.4+t*9,yy=-(i%7)*23,xx=Math.cos(q)*r*(.4+i%3*.15);c.save();c.translate(xx,yy);c.rotate(q);path(c,[[-7,-13],[7,-13],[7,13],[-7,13]],'#f6fffff2','#6c90b0',1.3);line(c,[[-4,-3],[4,-3]],'#8599b1',1.2);line(c,[[-4,2],[3,2]],'#9ca5bc',1);c.restore();}
        }
        else if(mode==='earth'){
          for(let i=0;i<6;i++){const xx=(i-2.5)*r*.31,hh=30+(i%3)*21;path(c,[[xx-15,0],[xx-13,-hh*.7],[xx-2,-hh],[xx+15,-hh*.65],[xx+18,-6]],'#8d8b72','#5b6c55',2);path(c,[[xx-2,-hh],[xx+15,-hh*.65],[xx+18,-6],[xx+3,-8]],'#6f7d64');line(c,[[xx-10,-hh*.6],[xx-1,-hh*.65]],'#c4bd91',2);}
          if(e.trap){rounded(c,-10,-51,20,34,1,'#e1c792','#665a42',1);c.font='bold 18px serif';c.textAlign='center';c.fillStyle='#9b4936';c.fillText('爆',0,-27);}
        }
        else if(mode==='gravity'){
          c.save();c.globalCompositeOperation='screen';for(let i=0;i<4;i++){const q=(t*2+i*.25)%1;oval(c,0,-28,r*q,r*q*.45,null,'#d7f2ed'+Math.floor((1-q)*180).toString(16).padStart(2,'0'),2+(1-q)*3);}c.restore();
          for(let i=0;i<7;i++){const q=i*2.4,rr=r*(.5+Math.sin(t*5+i)*.08);c.save();c.translate(Math.cos(q)*rr,-30+Math.sin(q)*rr*.3);c.rotate(t+i);path(c,[[-7,-4],[-1,-9],[8,-3],[5,6],[-4,8]],'#8f9582','#536c60',1.2);c.restore();}
        }
        else if(mode==='snake'){
          c.save();c.translate(0,-5);c.beginPath();c.moveTo(-r*.5,0);c.bezierCurveTo(r,-20,-r*.6,-100,5,-135);c.strokeStyle=OUTLINE;c.lineWidth=35;c.stroke();c.strokeStyle='#b8bba1';c.lineWidth=29;c.stroke();
          path(c,[[-12,-137],[-27,-157],[-19,-175],[8,-182],[28,-168],[19,-143],[2,-136]],'#c8c6a8',OUTLINE,2);line(c,[[-15,-163],[-6,-160]],'#a9943a',3);line(c,[[10,-163],[19,-166]],'#a9943a',3);path(c,[[-5,-146],[17,-149],[10,-139]],'#8b5956',OUTLINE,1);line(c,[[7,-142],[7,-129],[15,-125]],'#a85455',2);c.restore();
        }
        else if(mode==='summon')this.summon(c,r,t);
        else {for(let i=0;i<4;i++)oval(c,0,-i*20,r*(1-i*.12),r*.25,null,fade(color,.68),3.5);}
        c.restore();return;}
      c.save();c.translate(x,y-25);if(e.kind==='strike'){const wid=(Number(e.width)||r*1.4)*1.24;c.scale(dir,1);if(mode==='physical'){this.slash(c,0,-18,wid*.7,age,color);}else if(mode==='lightning'){this.lightning(c,-wid*.3,0,wid*.55,-40,t,color,4.5);}else{this.slash(c,0,-10,wid*.7,age,color);}c.restore();return;}
      const vx=Number(e.vx)||dir*100,vy=Number(e.vy)||0,angle=Math.atan2(vy,vx);c.rotate(angle);
      if(mode==='shuriken'){c.rotate(t*23);path(c,[[0,-r],[-r*.2,-r*.2],[-r,0],[-r*.2,r*.2],[0,r],[r*.2,r*.2],[r,0],[r*.2,-r*.2]],'#d2dfdc','#203c48',2);oval(c,0,0,r*.15,r*.15,'#344c55','#6f8b91',1);}
      else if(mode==='fire'){this.fire(c,0,0,r,t,e.isUltimate);}
      else if(mode==='lightning'){this.lightning(c,-r*3,0,0,0,t,'#70bde8',5);this.ball(c,r,t,color,mode);}
      else if(mode==='rasengan'){this.ball(c,r,t,color,mode);}
      else if(mode==='sand'){for(let i=0;i<16;i++){const q=i*2.4+t*8;oval(c,Math.cos(q)*r*.8,Math.sin(q)*r*.5,3+i%4,2+i%3,'#d9c18b','#9d8658',.7);}path(c,[[-r*.9,-r*.6],[r*.6,-r*.8],[r,0],[r*.4,r*.7],[-r,r*.3]],'#c0a370','#856f4b',1.7);}
      else if(mode==='wood'){path(c,[[-r*2,-r*.2],[r,-r*.35],[r*1.5,0],[r,r*.3],[-r*2,r*.2]],'#8b8957','#4c6745',2);line(c,[[-r,0],[r,0]],'#bdaf71',1.5);}
      else if(mode==='water'){this.ball(c,r,t,color,mode);for(let i=0;i<3;i++)line(c,[[-r*4,-r+i*r],[-r*2,-r*.4+i*r*.4]],'#72c7d3bb',3);}
      else if(mode==='paper'){for(let i=0;i<6;i++){c.save();c.translate(-i*r*.45,Math.sin(t*12+i)*r*.5);c.rotate(t*8+i);path(c,[[-8,-12],[8,-12],[8,12],[-8,12]],'#e7e8df','#889da6',1);line(c,[[-4,-3],[4,-3]],'#a6aeb4',1);line(c,[[-4,1],[3,1]],'#a6aeb4',1);c.restore();}}
      else if(mode==='ink'){oval(c,0,0,r*1.2,r*.6,'#202d35','#6d8790',2);path(c,[[r,0],[-r,-r],[-r*.6,0],[-r,r]],'#24313a');}
      else if(mode==='purple')this.ball(c,r,t,color,mode);
      else this.ball(c,r,t,color,'chakra');
      c.restore();
    }
    ball(c,r,t,color,mode) {
      color=fxColor(color);c.save();
      const tail=c.createLinearGradient(-r*4.8,0,r*.1,0);tail.addColorStop(0,fade(color,0));tail.addColorStop(.6,fade(color,.25));tail.addColorStop(1,fade(color,.86));
      path(c,[[-r*4.8,0],[-r*.65,-r*.7],[r*.2,0],[-r*.65,r*.7]],tail);
      oval(c,0,0,r*.85,r*.85,mode==='purple'?'#6846ad':mode==='rasengan'?'#168ab9':'#2b9bc2',fade('#103a64',.9),2.5);
      c.globalCompositeOperation='screen';const g=c.createRadialGradient(0,0,0,0,0,r*1.9);g.addColorStop(0,'#ffffff');g.addColorStop(.25,color);g.addColorStop(.53,fade(color,.66));g.addColorStop(1,fade(color,0));oval(c,0,0,r*1.9,r*1.9,g);
      oval(c,-r*.1,-r*.1,r*.43,r*.43,'#f0ffff');
      for(let i=0;i<5;i++){c.beginPath();c.ellipse(0,0,r*(.7+i*.08),r*(.2+i*.035),t*(8+i)+i,0,TAU);c.strokeStyle=i%2?'#ffffff':color;c.lineWidth=2.3;c.stroke();}
      for(let i=0;i<4;i++){const yy=Math.sin(i*9+t*5)*r*.8;line(c,[[-r*(2.1+i*.55),yy],[-r*(1+i*.4),yy*.6]],fade(color,.62),1.8);}
      if(mode==='lightning'){for(let i=0;i<4;i++){const a=t*11+i*1.6;this.lightning(c,Math.cos(a)*r*.3,Math.sin(a)*r*.3,Math.cos(a)*r*1.65,Math.sin(a)*r*1.65,t+i,color,1.8);}}
      c.restore();
    }
    fire(c,x,y,r,t,big) {
      r=Math.min(r,big?210:170);c.save();c.translate(x,y);
      const g=c.createRadialGradient(0,-r*.6,0,0,-r*.6,r*2.2);g.addColorStop(0,'#ff9c3b88');g.addColorStop(1,'#e65d2400');oval(c,0,-r*.6,r*2.2,r*2.2,g);
      for(let i=0;i<8;i++){const q=i*1.97,xx=Math.sin(q)*r*.8,hh=r*(1.4+(i%3)*.42),sw=Math.sin(t*14+i)*r*.2;
        path(c,[[xx-r*.38,0],[xx-r*.48+sw,-hh*.45],[xx+sw,-hh],[xx+r*.24+sw,-hh*.45],[xx+r*.42,0]],i%2?'#f18426e8':'#d6532bd9','#ffb945aa',1.5);
        path(c,[[xx-r*.18,0],[xx-r*.2+sw*.5,-hh*.33],[xx+sw*.7,-hh*.72],[xx+r*.2+sw*.5,-hh*.3],[xx+r*.21,0]],i%2?'#fff09cdd':'#ffc348e8');
      }
      c.globalCompositeOperation='screen';oval(c,0,-r*.3,r*.6,r*.54,'#fff4c3cc');
      for(let i=0;i<10;i++){const q=(t*1.8+i*.137)%1,xx=Math.sin(i*17)*r*(.6+q*.35);oval(c,xx,-r*(.5+q*2.3),2+i%3,3+i%2,fade('#ffde7a',(1-q)*.9));}
      c.restore();
    }
    lightning(c,x1,y1,x2,y2,t,col,width) {
      col=fxColor(col);width=Math.min(10.5,Math.max(1,width*1.55));
      const len=Math.hypot(x2-x1,y2-y1),nx=-(y2-y1)/(len||1),ny=(x2-x1)/(len||1),pts=[];
      for(let i=0;i<=7;i++){const q=i/7,j=(i===0||i===7)?0:Math.sin(i*31.8+Math.floor(t*20))*len*.15;pts.push([mix(x1,x2,q)+nx*j,mix(y1,y2,q)+ny*j]);}
      c.save();line(c,pts,'#245c9fbb',width*1.7);c.shadowColor=col;c.shadowBlur=17;line(c,pts,col,width);line(c,pts,'#f5ffff',Math.max(1.2,width*.38));
      if(len>35){for(let j=0;j<2;j++){const i=j?5:2,p=pts[i],sign=j?-1:1,b=len*.2;const branch=[p,[p[0]+nx*b*.65*sign+(x2-x1)*.07,p[1]+ny*b*.65*sign+(y2-y1)*.07],[p[0]+nx*b*sign+(x2-x1)*.23,p[1]+ny*b*sign+(y2-y1)*.23]];line(c,branch,col,width*.48);line(c,branch,'#eaffff',Math.max(1,width*.2));}}
      c.restore();
    }
    slash(c,x,y,r,p,color) {
      r*=1.16;color=fxColor(color);c.save();c.translate(x,y);c.rotate(-.6+p*.3);
      c.beginPath();c.ellipse(0,0,r,r*.45,0,-1.7,1.4);c.strokeStyle='#36578499';c.lineWidth=Math.max(3,19*(1-p));c.stroke();
      c.globalCompositeOperation='screen';c.strokeStyle=color;c.lineWidth=Math.max(2.5,14*(1-p));c.shadowColor=color;c.shadowBlur=14;c.stroke();c.beginPath();c.ellipse(-3,1,r*.88,r*.37,0,-1.6,1.1);c.strokeStyle='#ffffff';c.lineWidth=3.2;c.stroke();c.restore();
    }
    summon(c,r,t) {
      // A large spectral toad, intentionally part of the special effect, not a fighter.
      c.save();c.globalAlpha=.78;oval(c,0,-32,r*.7,45,'#a9a977','#4f694e',3);oval(c,-r*.45,-65,24,25,'#b9b17b','#4f694e',2);oval(c,r*.45,-65,24,25,'#b9b17b','#4f694e',2);oval(c,-r*.43,-69,9,11,'#ebd99b','#4a5b3f',2);oval(c,r*.43,-69,9,11,'#ebd99b','#4a5b3f',2);line(c,[[-r*.43,-77],[-r*.43,-62]],'#3e4c3b',3);line(c,[[r*.43,-77],[r*.43,-62]],'#3e4c3b',3);line(c,[[-r*.45,-27],[0,-21],[r*.45,-27]],'#536b4d',3);oval(c,-r*.7,-6,31,16,'#839064','#4f694e',2);oval(c,r*.7,-6,31,16,'#839064','#4f694e',2);c.restore();
    }
    effect(c,e,t) {
      const max=Number(e.maxLife)||Number(e.duration)||.6,life=Number.isFinite(e.life)?e.life:max-(Number(e.age)||0),p=clamp(1-life/max,0,1);
      const x=Number(e.x)||0,y=Number(e.y)||0,ty=e.type||'spark',r=(Number(e.radius)||42)*(ty==='text'||ty==='clone'?1:1.38),color=fxColor(e.color,'#c5edee');
      c.save();c.translate(x,y);c.globalAlpha=clamp(life*6,0,1);
      if(ty==='text') {c.translate(0,-p*32-30);c.scale(1+(1-p)*.15,1+(1-p)*.15);c.textAlign='center';c.font=/连|COMBO|击/.test(String(e.text))?'italic 900 25px "Microsoft YaHei",sans-serif':'italic 800 24px "Microsoft YaHei",sans-serif';c.lineWidth=4;c.strokeStyle='#24333c';c.strokeText(String(e.text||''),0,0);c.fillStyle=color;c.fillText(String(e.text||''),0,0);}
      else if(ty==='slash'){c.scale(e.facing===-1?-1:1,1);this.slash(c,0,-30,r*(.7+p*.5),p,color);}
      else if(ty==='lightning'){this.lightning(c,-r*.5,-20,r*.5,-85,t,color,3.6);}
      else if(ty==='smoke'){c.globalAlpha*=.72*(1-p);for(let i=0;i<7;i++){const a=i*2.399;oval(c,Math.cos(a)*r*p,Math.sin(a)*r*p*.45-15,r*(.24+p*.3),r*(.24+p*.25),'#e3e2d3','#f9edcc55',1);}}
      else if(ty==='circle'||ty==='aura'||ty==='heal'){
        if(ty==='aura'){const g=c.createRadialGradient(0,-35,0,0,-35,r*1.7);g.addColorStop(0,fade(color,.3));g.addColorStop(.45,fade(color,.17));g.addColorStop(1,fade(color,0));oval(c,0,-35,r*1.7,r*1.7,g);
          for(let i=0;i<6;i++){const a=i*TAU/6+t*2;line(c,[[Math.cos(a)*r*.5,-35+Math.sin(a)*r*.5],[Math.cos(a)*r*(.7+p*.8),-35+Math.sin(a)*r*(.7+p*.8)]],fade(color,(1-p)*.7),2.4);}}
        oval(c,0,0,r*(.6+p*.7),r*(.18+p*.21),null,fade(color,(1-p)*.92),3.8);
        oval(c,0,-4,r*(.4+p*.65),r*(.12+p*.2),null,fade('#fff6d4',(1-p)*.75),1.8);
        if(ty==='heal'){for(let i=0;i<6;i++){const xx=Math.sin(i*8)*r*.65,yy=-p*90-i*4;line(c,[[xx-4,yy],[xx+4,yy]],color,2);line(c,[[xx,yy-4],[xx,yy+4]],color,2);}}
      }else if(ty==='clone'){
        c.globalAlpha*=.3*(1-p);c.translate(0,-2);path(c,[[-17,-90],[-17,-51],[-23,-2],[-10,-2],[0,-45],[13,-2],[26,-2],[17,-52],[17,-90]],'#e7a14b',OUTLINE,2);oval(c,0,-109,15,18,'#e3c29d',OUTLINE,1.5);path(c,[[-16,-116],[-22,-129],[-10,-127],[-5,-140],[3,-132],[13,-137],[18,-123],[22,-118]],'#e6ca54',OUTLINE,1.5);
      }else {
        // Angular impact, sparks and dust radiate from a real point of contact.
        if(p<.24)oval(c,0,-24,r*.35*(1-p),r*.35*(1-p),'#785f57aa');
        c.globalCompositeOperation='screen';
        const g=c.createRadialGradient(0,-24,0,0,-24,r*(.6+p));g.addColorStop(0,'#fff8d7cc');g.addColorStop(.25,fade(color,.64));g.addColorStop(1,fade(color,0));oval(c,0,-24,r*(.6+p),r*(.6+p),g);
        const count=ty==='burst'?18:12;
        for(let i=0;i<count;i++){const a=i*TAU/count+.4,dist=r*(.15+p*.95),rr=(1-p)*(i%2?22:37);line(c,[[Math.cos(a)*dist,Math.sin(a)*dist-24],[Math.cos(a)*(dist+rr),Math.sin(a)*(dist+rr)-24]],i%3?color:'#fff9df',i%3?3:4.5);}
        oval(c,0,-24,r*(.3+p*1.2),r*(.18+p*.72),null,fade('#fff5cc',(1-p)*.85),3.5*(1-p)+1);
        oval(c,0,-24,r*(.15+p*.9),r*(.1+p*.5),null,fade(color,(1-p)*.8),2);
        if(p<.48){const ss=(1-p)*1.55;c.save();c.translate(0,-24);c.scale(ss,ss);path(c,[[0,-31],[7,-10],[28,-2],[8,7],[0,27],[-7,8],[-30,-2],[-8,-10]],'#fff7cf');line(c,[[-20,16],[22,-21]],'#ffffff',3);c.restore();}
      }
      c.restore();
    }
    banner(c,text,state) {
      if(text==='')return;const len=text.length,size=len>10?32:46;
      c.save();c.translate(W/2,300);const g=c.createLinearGradient(-390,0,390,0);g.addColorStop(0,'#0f283300');g.addColorStop(.25,'#142c38dc');g.addColorStop(.75,'#142c38dc');g.addColorStop(1,'#0f283300');c.fillStyle=g;c.fillRect(-410,-55,820,97);
      line(c,[[-335,-47],[335,-47]],'#d8ba6f77',1);line(c,[[-335,33],[335,33]],'#d8ba6f77',1);c.font=`italic 900 ${size}px "Microsoft YaHei",sans-serif`;c.textAlign='center';c.strokeStyle='#102936';c.lineWidth=5;c.strokeText(text,0,7);c.fillStyle='#f3dba5';c.fillText(text,0,7);c.restore();
    }
    portraitSVG(profile) { return portraitSVG(profile); }
  }

  function portraitSVG(profile) {
    const a=appearance(profile),id=String(profile?.id||profile?.name||'ninja').replace(/[^a-zA-Z0-9]/g,'')||'ninja';
    const hair=a.hairStyle==='spiky'||a.hairStyle==='short'?'M22 43 13 31 25 32 22 18 34 24 40 9 48 22 60 13 62 26 77 25 70 37 80 42 64 43 58 32 48 39 38 31 30 44Z':a.hairStyle==='bowl'?'M19 46C13 6 78 3 81 45L67 43 60 32 32 35 30 47Z':'M20 62 16 40 22 20 43 11 65 18 79 36 75 65 64 55 61 30 48 39 36 28 30 50 31 65Z';
    const extra=a.costume==='akatsuki'?'<path d="M22 84 26 69 44 79 48 73 54 79 74 68 81 86" fill="#9c3945" stroke="#172a32" stroke-width="2"/>':'';
    const face=a.face==='mask'?'<path d="M29 54 70 54 67 66 54 74 39 69Z" fill="#2d4355" stroke="#1c303a"/>':a.face==='obito'?'<ellipse cx="51" cy="49" rx="21" ry="27" fill="#c87939" stroke="#573d32"/><path d="M57 38c20 6 4 34-11 26s-3-29 10-20 1 17-5 10" fill="none" stroke="#805036" stroke-width="2"/><ellipse cx="59" cy="46" rx="4" ry="6" fill="#202a35"/>':'';
    const band=a.band&&a.face!=='obito'?'<path d="M27 36 73 36 73 47 28 47Z" fill="#2b4353"/><rect x="35" y="36" width="31" height="11" rx="2" fill="#b1c3be" stroke="#526971"/><path d="M49 39c-7 0-7 8 0 7l5-5 3 1-1 4-12 1" fill="none" stroke="#445c64" stroke-width="1.3"/>':'';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="p${id}" x2="0" y2="1"><stop stop-color="#638b89"/><stop offset="1" stop-color="#223b49"/></linearGradient></defs><rect width="100" height="100" fill="url(#p${id})"/><circle cx="78" cy="18" r="38" fill="#e2c799" opacity=".13"/><path d="M10 100 17 80 37 71 61 71 82 81 94 100" fill="${a.top}" stroke="#172a32" stroke-width="3"/>${extra}<path d="M39 64 39 80 51 86 63 78 62 62" fill="${a.skin}" stroke="#273844" stroke-width="2"/><path d="M29 28 47 19 66 27 72 47 68 63 55 75 43 73 30 61 25 44Z" fill="${a.skin}" stroke="#273844" stroke-width="2"/><path d="M35 51 43 50M57 50 66 51" fill="none" stroke="#3b3540" stroke-width="2.4"/><ellipse cx="41" cy="54" rx="2" ry="2.6" fill="${/佐助|鼬|斑/.test(a.name)?'#b14b4f':'#344757'}"/><ellipse cx="62" cy="54" rx="2" ry="2.6" fill="#344757"/><path d="M50 57 48 62 54 62M47 68 58 68" fill="none" stroke="#aa775c" stroke-width="1.3"/>${face}<path d="${hair}" fill="${a.hair}" stroke="#172a32" stroke-width="2"/>${band}${a.costume==='naruto'?'<path d="M29 61 38 63M29 66 38 67M61 63 69 61M62 67 69 66" stroke="#9c6b52" stroke-width="1.4"/>':''}<path d="M18 99 21 85 33 78M76 80 84 90" stroke="#ffffff" opacity=".12" stroke-width="4"/></svg>`;
  }
  ArenaRenderer.portraitSVG=portraitSVG;
  window.ArenaRenderer=ArenaRenderer;
})();
