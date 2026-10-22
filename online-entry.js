/* GitHub Pages opens the host's full game; game credentials stay on their own server. */
(() => {
  'use strict';
  const entry=document.getElementById('onlinePortalEntry');if(!entry)return;
  const key='arena-online-host',inert=new Map();let opener=null;
  const root=document.createElement('div');root.id='onlinePortal';root.hidden=true;
  root.innerHTML=`<section class="portal-card" role="dialog" aria-modal="true" aria-labelledby="portalTitle" tabindex="-1">
    <button id="portalClose" class="portal-close" type="button" aria-label="关闭联机窗口">×</button>
    <p class="portal-eyebrow">ONLINE DUEL · 好友切磋</p><h2 id="portalTitle">联机对战</h2>
    <p class="portal-intro">双方加入同一个 Radmin VPN 网络，连接房主的电脑，开启真人 3V3 对决。</p>
    <form id="portalForm"><label for="portalAddress">房主地址</label><input id="portalAddress" class="portal-address" type="text" inputmode="url" autocomplete="off" spellcheck="false" maxlength="240" placeholder="26.x.x.x:3000 或服务器网址" required aria-describedby="portalExample portalStatus"><p id="portalExample" class="portal-example">填写房主启动窗口显示的地址。未填写端口时，Radmin 地址默认使用 3000。</p><button class="portal-go" type="submit">连接并进入联机游戏 →</button><p id="portalStatus" class="portal-status" role="status" aria-live="polite"></p></form>
    <div class="portal-steps"><b>第一次联机</b><ol><li>房主<a href="https://github.com/hankgao15888/nindao-duel-arena/tree/main/online" target="_blank" rel="noopener">下载 Radmin 联机包</a>，解压后运行“启动Radmin联机.bat”。</li><li>好友加入相同的 Radmin VPN 网络，填写房主地址。</li><li>进入后各自登录，一人创建房间，一人输入房间码，双方准备后开战。</li></ol></div>
    <p class="portal-note">房主需保持电脑、Radmin VPN 和启动窗口开启。联机服务器使用独立账号，首次进入需注册。网络延迟以双方实际连接为准。</p>
  </section>`;document.body.append(root);
  const address=document.getElementById('portalAddress'),status=document.getElementById('portalStatus');
  function parse(value){
    const raw=value.trim();if(!raw||raw.length>240||/\s/.test(raw))throw Error('请输入房主显示的 IPv4 地址或完整服务器网址。');
    const explicit=/^https?:\/\//i.test(raw),plain=/^(\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?\/?$/.test(raw);
    if(!explicit&&!plain)throw Error('Radmin 地址示例：26.1.2.3:3000；服务器域名请带上 https://。');
    if(plain){const parts=raw.replace(/\/$/,'').split(':')[0].split('.');if(parts.some(part=>Number(part)>255||String(Number(part))!==part))throw Error('IPv4 地址不正确，请复制房主启动窗口中的地址。');}
    let target;try{target=new URL(explicit?raw:'http://'+raw);}catch{throw Error('地址格式不正确，请检查 IP、网址和端口。');}
    if(!['http:','https:'].includes(target.protocol)||target.username||target.password||target.pathname!=='/'||target.search||target.hash)throw Error('请只填写服务器地址和端口，不要填写账号、密码或其他页面路径。');
    if(target.hostname==='0.0.0.0')throw Error('请填写房主真实的 Radmin VPN 地址，不能填写 0.0.0.0。');
    if(target.protocol==='http:'&&/^26\./.test(target.hostname)&&!target.port)target.port='3000';
    target.searchParams.set('online','1');return target;
  }
  function close(){if(root.hidden)return;root.hidden=true;for(const [region,value]of inert)region.inert=value;inert.clear();opener?.focus();}
  function open(){if(!root.hidden)return;opener=document.activeElement;window.dispatchEvent(new CustomEvent('arena-before-online-open'));for(const region of document.querySelectorAll('.topbar,.footer,#arena,#selection,#hud,#modal,#keySettings,#arenaAuth,#arenaChat')){inert.set(region,region.inert);region.inert=true;}(document.fullscreenElement||document.body).append(root);status.textContent='';try{address.value=localStorage.getItem(key)||'';}catch{}root.hidden=false;address.focus();}
  entry.onclick=open;document.getElementById('portalClose').onclick=close;
  document.getElementById('portalForm').onsubmit=event=>{event.preventDefault();try{const target=parse(address.value);try{localStorage.setItem(key,target.origin);}catch{}status.textContent='正在进入房主的联机服务器…';location.assign(target.href);}catch(error){status.textContent=error.message;address.focus();}};
  root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key==='Tab'){const fields=[...root.querySelectorAll('button,input,a')].filter(el=>!el.disabled&&el.getClientRects().length),first=fields[0],last=fields.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
  root.addEventListener('keyup',event=>event.stopPropagation());root.addEventListener('click',event=>{if(event.target===root)close();});
  document.addEventListener('fullscreenchange',()=>{if(!root.hidden)(document.fullscreenElement||document.body).append(root);});
})();
