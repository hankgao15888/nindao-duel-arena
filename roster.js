/* 技能名称与动作方向参考用户指定的游侠人物栏目；数值与判定为本地原型调校，非原作数据。 */
window.NINJAS = [
  {
    id:'obito-war',name:'宇智波带土',variant:'忍界大战',rank:'S',
    color:'#9f79c5',hair:'#303335',coat:'#474956',style:'obito-war',speed:270,
    source:'https://hyrz.qq.com/web202003/newsDetails.html?aid=18100447',
    skills:[
      {name:'木遁·扦插之术',type:'wood',cd:10,description:'U 木刺固定，再按 U 释放火遁·爆风乱舞；燃烧扦插可追加爆炸。神威后可在空中连续施放。'},
      {name:'神威',type:'teleport',cd:11,description:'I 取消普攻或忍术并虚化，解锁 Q 突进与 E 坠落。短按攻击，长按虚化移动；瞬间躲避攻击可触发紫光。'}
    ],
    ultimate:{name:'通灵术·十尾',type:'summon',damage:510,description:'通灵十尾第二形态，以巨尾、咆哮和崩坏冲击轰炸战场。紫光子技能命中后，O 可改为魔像巨掌组合技。'},
    notes:'依据官方 2022-09-05 介绍独立实现六段普攻、木火联动、神威与短长按子技能、时空间收纳、紫光组合和十尾奥义。Q / E 为本版子技能键；动作、时间和伤害为本地重绘与调校。'
  },
  {
    id:'hashirama-xiayin',name:'千手柱间',variant:'侠隐江湖',rank:'A',
    color:'#d7ba75',hair:'#202522',coat:'#383d39',style:'xiayin',speed:265,
    portrait:'assets/hashirama-xiayin.png',portraitPosition:'49% 28%',source:'https://hyrz.qq.com/web202003/newsDetails.html?aid=18829018',
    skills:[
      {name:'金钟法相',type:'area',cd:11,description:'U 格挡，长按延长；黄条内再按 U 落钟。U 接 J 跳抓；钟禁锢敌人时可用 U 钟上吟唱。'},
      {name:'木龙之术',type:'wood',cd:10,description:'I 木龙出击，I 快接 J 乘龙俯冲；空中直接俯冲。敌人被钟禁锢时改为双龙绕钟。'}
    ],
    ultimate:{name:'六龙 · 苍天大树',type:'wood',damage:500,description:'双手合十，乘六龙席卷敌人，最终聚成苍天大树。'},
    notes:'依据官方 2026-08-03 爆料实现专属金钟、木龙、地空普攻、跳抓及两种秘卷。招式按钮采用描述性标签，时长、距离、残血阈值与伤害为本地调校；动画按官方动图重绘。'
  },
  {
    id:'madara-shenju', name:'宇智波斑', variant:'神驹佑将', rank:'S',
    color:'#ff7133', hair:'#151b22', coat:'#363b42', style:'shenju', speed:268,
    portrait:'assets/madara-shenju.webp', portraitPosition:'70% 30%', source:'https://hyrz.qq.com/web202003/newsDetails.html?aid=18728294&pageType=1',
    skills:[
      {name:'长戟 · 八式',type:'melee',cd:0,description:'U 火戟钻击；J 的第 1—4 段后接 U，分别派生陷阵、狂风、连环、乱舞。黄条内再按 U 追加二段。'},
      {name:'跃空 · 二段跳',type:'dash',cd:0,description:'I 跳跃，可取消普攻和忍术；空中再按 I 二段跳，摇杆控制落点。空中 J 挥戟 / 砸地，U 下戳。'}
    ],
    ultimate:{name:'无双 · 神驹佑将',type:'summon',damage:440,description:'最多 6 格奥义点；O 消耗 4 格进入无双，J 九段斩击，U 蓝色键发动须佐长戟终结。'},
    notes:'按官方 2026-01-26 介绍实现独立能量、四组双段派生、二段跳与两段奥义。特效按动图重新绘制；时长、伤害和判定为本地调校，非官方逐帧数据。'
  },
  {
    id:'naruto-kcm', name:'漩涡鸣人', variant:'九尾查克拉', rank:'A',
    color:'#ffbe3b', hair:'#ffd847', coat:'#ed9b27', style:'naruto', speed:282,
    portrait:'assets/naruto-kcm.png', source:'https://m.ali213.net/news/gl2007/458937.html',
    skills:[
      {name:'惑星螺旋丸',type:'dash',cd:9,damage:155,range:250,description:'向前突进，以旋转的查克拉球击飞对手。'},
      {name:'尾兽闪光弹',type:'teleport',cd:7,damage:120,range:300,description:'快速瞬身接近对手，以滑铲与查克拉攻击追击。'}
    ],
    ultimate:{name:'超大玉螺旋多连丸',type:'clone',damage:330,description:'影分身一同突击，以多枚大玉螺旋丸终结。'},
    notes:'原作空中技能、充能、组合技在本原型中简化。'
  },
  {
    id:'sasuke-susanoo', name:'宇智波佐助', variant:'须佐能乎', rank:'A',
    color:'#ae7ee8', hair:'#18202a', coat:'#e4e2e6', style:'sasuke', speed:260,
    portrait:'assets/sasuke-susanoo.jpg', source:'https://m.ali213.net/news/gl2107/647569.html',
    skills:[
      {name:'须佐能乎',type:'summon',cd:11,damage:145,range:210,description:'召唤紫色须佐骨架与手臂，在身前发动重击。'},
      {name:'炎遁·加具土命',type:'fire',cd:10,damage:160,range:500,description:'将黑炎凝成锐刺向前延伸，留下持续燃烧的区域。'}
    ],
    ultimate:{name:'须佐能乎·贯',type:'projectile',damage:335,description:'须佐能乎射出巨箭，引发黑炎爆破。'},
    notes:'原参考页奥义标题疑有错置，名称用萌娘百科对应条目交叉核对。原作护甲、控炎、组合技未完整模拟。'
  },
  {
    id:'kakashi-war', name:'旗木卡卡西', variant:'忍界大战', rank:'A',
    color:'#75c9ef', hair:'#d7e1ea', coat:'#52715b', style:'kakashi', speed:260,
    portrait:'assets/kakashi-war.jpg', source:'https://m.ali213.net/news/gl2012/531205.html',
    skills:[
      {name:'土遁·多重土流壁',type:'trap',cd:11,damage:135,range:300,description:'在前方立起土壁，并以雷分身从地底突袭。'},
      {name:'雷切',type:'lightning',cd:9,damage:165,range:350,description:'凝聚雷电向前突进，切割路径上的对手。'}
    ],
    ultimate:{name:'神威·裁决',type:'genjutsu',damage:325,description:'斩首大刀斩击接神威扭曲，最后从空中追击。'},
    notes:'短按、长按及雷分身与雷传派生简化为统一技能。'
  },
  {
    id:'itachi-edo', name:'宇智波鼬', variant:'秽土转生', rank:'S',
    color:'#e25356', hair:'#24202b', coat:'#8d303a', style:'itachi', speed:250,
    portrait:'assets/itachi-edo.jpg', source:'https://m.ali213.net/news/gl2201/763157.html',
    skills:[
      {name:'月读',type:'genjutsu',cd:11,damage:155,range:360,description:'以写轮眼捕捉前方目标，让幻术长剑连续攻击。'},
      {name:'乌鸦分身术',type:'clone',cd:10,damage:135,range:400,description:'化作乌鸦向前突击，在群鸦汇聚后重新现身。'}
    ],
    ultimate:{name:'须佐能乎·双神降临',type:'summon',damage:330,description:'与佐助的须佐能乎联合攻击，以勾玉和巨箭收尾。'},
    notes:'月读能量、反转攻击及专属秘卷伊邪那美未实现。'
  },
  {
    id:'madara-edo', name:'宇智波斑', variant:'秽土转生', rank:'S',
    color:'#4b9ee8', hair:'#25242e', coat:'#8d3844', style:'madara', speed:232,
    portrait:'assets/madara-edo.jpg', source:'https://m.ali213.net/news/gl2105/615537.html',
    skills:[
      {name:'须佐能乎',type:'projectile',cd:11,damage:160,range:590,description:'开启蓝色须佐能乎，向前投射多枚八尺琼勾玉。'},
      {name:'火遁·豪火灭却',type:'fire',cd:12,damage:180,range:560,description:'吐出大范围烈焰，在前方形成火海。'}
    ],
    ultimate:{name:'天碍震星',type:'area',damage:345,description:'召来天外陨石砸向战场，随后以更大的陨石追击。'},
    notes:'原作天碍震星需先进入树界降临状态；本原型直接提供终结奥义。'
  },
  {
    id:'tobirama-edo', name:'千手扉间', variant:'秽土转生', rank:'S',
    color:'#58d4ed', hair:'#e0edf4', coat:'#3a647e', style:'tobirama', speed:274,
    portrait:'assets/tobirama-edo.jpg', source:'https://m.ali213.net/news/gl2008/481559.html',
    skills:[
      {name:'影分身·飞雷神斩',type:'teleport',cd:9,damage:145,range:380,description:'带有飞雷神术式的影分身瞬身发动斩击。'},
      {name:'水遁·硬涡水刃',type:'water',cd:10,damage:160,range:550,description:'将水旋涡浓缩成标枪，向前投掷并爆发水流。'}
    ],
    ultimate:{name:'互乘起爆符',type:'trap',damage:330,description:'贴上起爆符，以连续通灵的起爆符引发连环爆炸。'}
  },
  {
    id:'minato-edo', name:'波风水门', variant:'秽土转生', rank:'S',
    color:'#ffe05d', hair:'#f2cc48', coat:'#f3e5c6', style:'minato', speed:295,
    portrait:'assets/minato-edo.jpg', source:'https://m.ali213.net/news/gl2001/401351.html',
    skills:[
      {name:'疾风超级闪光螺旋丸',type:'dash',cd:9,damage:160,range:340,description:'向前冲刺，近身释放螺旋丸。'},
      {name:'超时空闪光燕舞连段',type:'teleport',cd:10,damage:145,range:420,description:'投出飞雷神苦无，连续瞬移追击目标。'}
    ],
    ultimate:{name:'螺旋闪光飞轮舞吼四式',type:'clone',damage:325,description:'飞雷神苦无与闪光扰乱视线，本体和分身以螺旋丸合击。'},
    notes:'原作九尾查克拉模式、标记、技能刷新等特性未完整模拟。'
  },
  {
    id:'sakura-war', name:'春野樱', variant:'忍界大战', rank:'S',
    color:'#ff92ad', hair:'#e887a5', coat:'#b84263', style:'sakura', speed:248,
    portrait:'assets/sakura-war.jpg', source:'https://m.ali213.net/news/gl2309/1136269.html',
    skills:[
      {name:'百豪·樱花碎击',type:'area',cd:10,damage:170,range:230,description:'跃起后将查克拉重拳砸向地面，引发震荡。'},
      {name:'百豪·樱花裂冲',type:'dash',cd:10,damage:165,range:350,description:'蓄积查克拉向地面挥拳，以冲击波攻击前方。'}
    ],
    ultimate:{name:'百豪·极意樱花落',type:'melee',damage:340,description:'流星般跃向对手，以怪力重拳击碎巨石与地面。'},
    notes:'原作三档蓄力、白条回复及樱花坠组合技未完整模拟。'
  },
  {
    id:'lee-war', name:'李洛克', variant:'忍界大战', rank:'A',
    color:'#80d66e', hair:'#233128', coat:'#347548', style:'lee', speed:290,
    portrait:'assets/lee-war.jpg', source:'https://m.ali213.net/news/gl2411/1539675.html',
    skills:[
      {name:'无限乱舞',type:'melee',cd:8,damage:155,range:220,description:'突进拳击、百裂拳与绷带膝撞组成连续体术攻击。'},
      {name:'瞬风',type:'teleport',cd:6,damage:100,range:330,description:'快速瞬身移动，接近对手并衔接体术。'}
    ],
    ultimate:{name:'表莲华',type:'melee',damage:325,description:'踢起对手，用绷带缠绕后旋转俯冲砸向地面。'},
    notes:'原作还具有三技能木叶旋风与强化奥义里莲华；本原型仅实现两技能与表莲华的简化动作。'
  },
  {
    id:'hinata-last', name:'日向雏田', variant:'最终章', rank:'A',
    color:'#bca6ff', hair:'#30314e', coat:'#dbceee', style:'hinata', speed:255,
    portrait:'assets/hinata-last.jpg', source:'https://m.ali213.net/news/gl2408/1466013.html',
    skills:[
      {name:'守护八卦六十四掌',type:'area',cd:11,damage:155,range:205,description:'快速挥掌形成查克拉球，连续攻击周围敌人。'},
      {name:'柔步双拳',type:'dash',cd:9,damage:145,range:290,description:'向前冲刺，旋转追击后以双掌打出贯穿一击。'}
    ],
    ultimate:{name:'柔步螺旋双狮拳',type:'summon',damage:325,description:'与鸣人跃至高空，将双狮查克拉融入螺旋丸合击。'},
    notes:'原作需先进入双狮拳状态；本原型直接提供终结奥义。'
  },
  {
    id:'hashirama-edo', name:'千手柱间', variant:'秽土转生', rank:'S',
    color:'#78c180', hair:'#2b2b2c', coat:'#a04444', style:'hashirama', speed:232,
    portrait:'assets/hashirama-edo.jpg', source:'https://m.ali213.net/news/gl2205/840717.html',
    skills:[
      {name:'木遁·树界降临',type:'wood',cd:11,damage:155,range:460,description:'连绵树木从地面生长，缠绕并击飞前方目标。'},
      {name:'木遁·木人之术·金刚拳',type:'summon',cd:12,damage:180,range:340,description:'召唤巨大木人，以重拳轰击前方。'}
    ],
    ultimate:{name:'火之意志',type:'wood',damage:345,description:'历代火影联手攻击，巨型木人像以掌击引发地面爆破。'},
    notes:'原作奥义点强化、花粉状态与金刚拳派生未完整模拟。'
  },
  {
    id:'pain-battle', name:'佩恩·天道', variant:'百战', rank:'S',
    color:'#ef8950', hair:'#e77d40', coat:'#2a2632', style:'pain', speed:238,
    portrait:'assets/pain-battle.jpg', source:'https://m.ali213.net/news/gl2412/1567609.html',
    skills:[
      {name:'万象天引',type:'pull',cd:11,damage:135,range:550,description:'引力抓取前方对手，将其拉至身前。'},
      {name:'神罗天征',type:'area',cd:12,damage:170,range:320,description:'以自身为中心释放排斥冲击，将周围敌人震飞。'}
    ],
    ultimate:{name:'超神罗天征',type:'area',damage:345,description:'升到空中，释放覆盖战场的大规模排斥冲击。'},
    notes:'原作黑棒能量、三档神罗天征与地爆天星组合技未完整模拟。'
  },
  {
    id:'hashirama-founder', name:'千手柱间', variant:'木叶创立', rank:'S',
    color:'#65b576', hair:'#282929', coat:'#984444', style:'hashirama', speed:240,
    portrait:'assets/hashirama-founder.png', source:'https://m.ali213.net/news/gl2402/1317697.html',
    skills:[
      {name:'木遁·木龙之术',type:'wood',cd:11,damage:170,range:590,description:'操纵巨大的木龙向前方冲击。'},
      {name:'木遁·木分身之术',type:'clone',cd:10,damage:140,range:350,description:'移位并留下木分身，分身化为树木抓取目标。'}
    ],
    ultimate:{name:'木遁·仙法·真数千手顶上化佛',type:'wood',damage:350,description:'巨型木像伸展千手，连续掌击覆盖前方战场。'},
    notes:'原作人形、木人形态切换以及小奥义与专属秘卷未完整模拟。'
  },
  {
    id:'madara-founder', name:'宇智波斑', variant:'木叶创立', rank:'S',
    color:'#669ef0', hair:'#25232b', coat:'#9e3e49', style:'madara', speed:240,
    portrait:'assets/madara-founder.jpg', source:'https://m.ali213.net/news/gl2210/924749.html',
    skills:[
      {name:'八尺琼勾玉',type:'projectile',cd:10,damage:160,range:600,description:'开启须佐能乎并投出勾玉，远程轰击目标。'},
      {name:'火遁·龙炎放歌',type:'fire',cd:12,damage:170,range:510,description:'向后跃起，喷出三道龙炎并留下燃烧地面。'}
    ],
    ultimate:{name:'完全体须佐能乎',type:'summon',damage:340,description:'完全体须佐能乎挥动双刀，以巨大交叉剑气横扫战场。'},
    notes:'原作须佐强化、宇智波反弹及风火派生子技能未完整模拟。'
  },
  {
    id:'kabuto-sage', name:'药师兜', variant:'仙人模式', rank:'S',
    color:'#b9d0e5', hair:'#cbd0db', coat:'#e0d8cb', style:'kabuto', speed:246,
    portrait:'assets/kabuto-sage.jpg', source:'https://m.ali213.net/news/gl2109/684089.html',
    skills:[
      {name:'仙法·白激之术',type:'projectile',cd:11,damage:155,range:560,description:'吐出白龙飞向前方，以强光与震动攻击目标。'},
      {name:'左近·双魔之攻',type:'melee',cd:10,damage:165,range:280,description:'以君麻吕骨刺等能力展开多段变形攻击。'}
    ],
    ultimate:{name:'仙法·无机转生',type:'trap',damage:335,description:'赋予岩石生命，以尖刺固定对手后用巨蛇终结。'},
    notes:'原作黑夜模式与多套子技能分支未完整模拟。'
  },
  {
    id:'haku-edo', name:'白', variant:'秽土转生', rank:'A',
    color:'#8cddfa', hair:'#242b34', coat:'#c8e0e5', style:'haku', speed:268,
    portrait:'assets/haku-edo.gif', source:'https://m.ali213.net/news/gl2406/1430869.html',
    skills:[
      {name:'连携技·冰镜·鬼人斩',type:'teleport',cd:11,damage:155,range:360,description:'穿过冰镜抓取对手，再不斩现身追加重斩。'},
      {name:'秘术·千杀水翔·瞬',type:'water',cd:10,damage:145,range:510,description:'射出冰刺后瞬身追击，以旋转攻击延续连段。'}
    ],
    ultimate:{name:'魔镜冰牙破',type:'area',damage:325,description:'借白雾高速移动，最后召唤大量冰锥刺出地面。'},
    notes:'原作场上冰镜位置及两段技能的独立触发简化。'
  },
  {
    id:'ay-war', name:'艾', variant:'忍界大战', rank:'A',
    color:'#67c3ff', hair:'#e6d49f', coat:'#dce5e5', style:'ay', speed:280,
    portrait:'assets/ay-war.jpg', source:'https://m.ali213.net/news/gl2409/1490505.html',
    skills:[
      {name:'雷之爪',type:'lightning',cd:10,damage:165,range:290,description:'突进抓取敌人，凝聚雷电后重重砸向地面。'},
      {name:'重流暴',type:'dash',cd:9,damage:155,range:360,description:'短暂蹲伏后高速冲刺，以强力重击打起对手。'}
    ],
    ultimate:{name:'究·超躯须罗武',type:'lightning',damage:340,description:'雷铠强化下瞬间逼近，抓取对手并以雷霆重摔撕裂地面。'},
    notes:'原作雷铠状态、截击自动追身及长按招式未完整模拟。'
  },
  {
    id:'shisui-susanoo', name:'宇智波止水', variant:'须佐能乎', rank:'S',
    color:'#67da83', hair:'#202d2b', coat:'#354d49', style:'shisui', speed:284,
    portrait:'assets/shisui-susanoo.jpg', source:'https://m.ali213.net/news/gl2409/1511773.html',
    skills:[
      {name:'须佐能乎·半月斩',type:'summon',cd:11,damage:165,range:360,description:'开启半身须佐，持螺旋枪向前横扫。'},
      {name:'宇智波流·四方斩',type:'teleport',cd:9,damage:150,range:390,description:'突进斩击后瞬身至目标身旁追加三连斩。'}
    ],
    ultimate:{name:'完全体须佐能乎',type:'summon',damage:335,description:'分身连续斩击后，完全体须佐将目标挑向高空引发爆炸。'},
    notes:'原作三段技能、能量格与别天神控制忍者机制未完整模拟。'
  },
  {
    id:'konan-summer', name:'小南', variant:'夏日泳装', rank:'A',
    color:'#b4c8f3', hair:'#7579b8', coat:'#d9e5f2', style:'konan', speed:260,
    portrait:'assets/konan-summer.jpg', source:'https://m.ali213.net/news/gl2006/447715.html',
    skills:[
      {name:'式纸之舞',type:'paper',cd:10,damage:150,range:520,description:'创造向前移动的纸龙卷，命中后扩散为纸片风暴。'},
      {name:'式纸之舞·旋',type:'area',cd:11,damage:145,range:220,description:'身体化作纸片，旋转攻击周围对手。'}
    ],
    ultimate:{name:'神之纸者之术',type:'paper',damage:335,description:'以纸海与大量起爆符覆盖场地，连续引爆攻击。'},
    notes:'原作空中释放与纸片状态自由移动简化。'
  },
  {
    id:'orochimaru-battle', name:'大蛇丸', variant:'百战不灭', rank:'A',
    color:'#b591e3', hair:'#211d2e', coat:'#c2b6a3', style:'orochimaru', speed:250,
    portrait:'assets/orochimaru-battle.jpg', source:'https://m.ali213.net/news/gl2212/973017.html',
    skills:[
      {name:'大蛇流',type:'teleport',cd:10,damage:150,range:350,description:'变换蛇形钻入地面，从前方破土以口中剑突袭。'},
      {name:'蛇噬之毒',type:'dash',cd:11,damage:160,range:370,description:'伏地突进，以蛇手抓住敌人后砸向地面。'}
    ],
    ultimate:{name:'缚杀·蛇噬之毒',type:'summon',damage:330,description:'召唤八岐大蛇与群蛇缠绕对手，巨蛇咬击引发爆炸。'},
    notes:'原作半蛇、大蛇形态与受击变形未完整模拟。'
  }
];
window.NINJA_REFERENCE = {
  index:'https://m.ali213.net/hyrzsy/rwjs/',
  checked:'2026-10-20',
  status:'本地同人原型 · 20 个忍者形态开放 · 非官方版本',
  notice:'技能动作参考攻略；攻击数值、冷却、速度、范围、受击与动画均为原型估算，不是原版帧数据。'
};
