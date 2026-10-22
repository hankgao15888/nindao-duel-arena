/* Account sessions are validated by the shared service; passwords are never saved here. */
(() => {
  'use strict';
  const API=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?'http://127.0.0.1:5173':
    location.hostname.endsWith('.chatgpt.site')?location.origin:'https://nindao-duel-arena.blushcharm258.chatgpt.site';
  // Explicit guest list: a newly added ninja requires login by default.
  const guests=new Set(['hashirama-xiayin','madara-shenju','naruto-kcm','sasuke-susanoo','kakashi-war','itachi-edo','madara-edo','tobirama-edo','minato-edo','sakura-war','lee-war','hinata-last','hashirama-edo','pain-battle','hashirama-founder','madara-founder','kabuto-sage','haku-edo','ay-war','shisui-susanoo','konan-summer','orochimaru-battle']);
  const key='arena-account-session', $=id=>document.getElementById(id),inertRegions=new Map();
  const read=(storage)=>{try{const data=JSON.parse(storage.getItem(key)||'null');return data&&/^[a-f0-9]{64}$/.test(data.token||'')&&data.expiresAt>Date.now()?data:null;}catch{return null;}};
  let session=null,user=null,mode='login',pending=false,opener=null,expiryTimer,lastVerified=0,verification=null;
  try{session=read(sessionStorage)||read(localStorage);}catch{}
  const root=document.createElement('div');root.id='arenaAuth';root.hidden=true;
  root.innerHTML=`<section class="account-dialog" role="dialog" aria-modal="true" aria-labelledby="accountTitle" aria-describedby="accountReason" tabindex="-1">
    <button id="accountClose" class="account-close" type="button" aria-label="关闭登录窗口">✕</button>
    <div class="account-mark" aria-hidden="true">忍</div><p class="account-eyebrow">DUEL ARENA · 忍者账号</p>
    <h2 id="accountTitle">登录决斗场</h2><p id="accountReason" class="account-reason">登录后解锁宇智波带土、新忍者和玩家聊天。</p>
    <div id="accountTabs" class="account-tabs" role="tablist" aria-label="账号操作"><button id="accountLoginTab" type="button" role="tab" aria-selected="true" aria-controls="accountForm">登录</button><button id="accountRegisterTab" type="button" role="tab" aria-selected="false" aria-controls="accountForm">注册账号</button></div>
    <form id="accountForm" class="account-form" aria-label="账号登录">
      <label for="accountUsername">用户名</label><input id="accountUsername" name="username" autocomplete="username" maxlength="20" required placeholder="输入你的用户名" aria-describedby="accountUsernameHint"><small id="accountUsernameHint">2—20 个字母、数字或下划线，支持中文</small>
      <label for="accountPassword">密码</label><div class="account-password"><input id="accountPassword" name="password" type="password" autocomplete="current-password" minlength="12" maxlength="128" required placeholder="输入密码（至少 12 个字符）" aria-describedby="accountPasswordHint"><button id="accountReveal" type="button" aria-pressed="false" aria-label="显示密码">显示</button></div><small id="accountPasswordHint">12—128 个字符；密码区分大小写</small>
      <div id="accountConfirmRow" class="account-confirm" hidden><label for="accountConfirm">确认密码</label><input id="accountConfirm" name="confirmPassword" type="password" autocomplete="new-password" maxlength="128" placeholder="再次输入密码"></div>
      <label class="account-remember"><input id="accountRemember" type="checkbox">保持登录（7 天）</label>
      <button id="accountSubmit" class="account-submit" type="submit">登录并解锁</button>
    </form>
    <div id="accountProfile" class="account-profile" hidden><p>当前账号</p><strong id="accountName"></strong><p>已解锁全部忍者和玩家聊天</p><button id="accountLogout" class="account-submit" type="button">退出登录</button></div>
    <div id="accountStatus" class="account-status" role="status" aria-live="polite"></div>
    <button id="accountGuest" class="account-guest" type="button">先以游客试玩 · 22 位忍者</button>
    <p class="account-note">本站独立账号，请自行设置密码。<br>游客可试玩其他忍者；带土、新忍者及聊天需要登录。</p>
  </section>`;
  document.body.append(root);
  const entry=document.createElement('button');entry.id='accountEntry';entry.type='button';entry.className='account-entry';entry.textContent='登录 / 注册';document.querySelector('.brand p').append(entry);
  const status=(message,error=false)=>{$('accountStatus').textContent=message;$('accountStatus').classList.toggle('error',error);};
  function paint(){
    entry.textContent=user?user.username:'登录 / 注册';entry.title=user?'查看账号或退出登录':'登录或注册忍者账号';
    entry.setAttribute('aria-label',user?'当前账号：'+user.username+'，查看账号':'登录或注册账号');
    $('accountTitle').textContent=user?'我的忍者账号':mode==='register'?'注册忍者账号':'登录决斗场';
    $('accountTabs').hidden=!!user;$('accountForm').hidden=!!user;$('accountProfile').hidden=!user;
    $('accountName').textContent=user?.username||'';$('accountGuest').textContent=user?'返回决斗场':'先以游客试玩 · 22 位忍者';
    $('accountLoginTab').setAttribute('aria-selected',String(mode==='login'));$('accountRegisterTab').setAttribute('aria-selected',String(mode==='register'));
    $('accountLoginTab').tabIndex=mode==='login'?0:-1;$('accountRegisterTab').tabIndex=mode==='register'?0:-1;
    $('accountForm').setAttribute('aria-label',mode==='register'?'注册账号':'账号登录');
    $('accountConfirmRow').hidden=mode!=='register';$('accountConfirm').required=mode==='register';
    $('accountPassword').autocomplete=mode==='register'?'new-password':'current-password';
    $('accountSubmit').textContent=pending?'请稍候…':mode==='register'?'注册并登录':'登录并解锁';
    for(const field of root.querySelectorAll('input,button'))field.disabled=pending;
  }
  function saveSession(){
    try{sessionStorage.removeItem(key);localStorage.removeItem(key);if(session)(session.persistent?localStorage:sessionStorage).setItem(key,JSON.stringify(session));}catch{}
  }
  function armExpiry(){
    clearTimeout(expiryTimer);if(user&&session)expiryTimer=setTimeout(()=>{user=null;session=null;saveSession();paint();changed();},Math.max(1,session.expiresAt-Date.now()));
  }
  function changed(){
    armExpiry();
    window.dispatchEvent(new CustomEvent('arena-auth-change',{detail:{user}}));
  }
  function clearLogin(message='登录已过期，请重新登录。'){
    session=null;user=null;mode='login';saveSession();paint();changed();if(!root.hidden)status(message,true);
  }
  async function raw(path,options={},token){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000),cancel=()=>controller.abort();
    options.signal?.addEventListener('abort',cancel,{once:true});if(options.signal?.aborted)cancel();
    try{return await fetch(API+path,{...options,headers:{...options.headers,...(token?{Authorization:'Bearer '+token}:{})},credentials:'omit',cache:'no-store',signal:controller.signal});}
    finally{clearTimeout(timeout);options.signal?.removeEventListener('abort',cancel);}
  }
  async function json(path,options={},token){
    const response=await raw(path,options,token),data=await response.json();
    if(!response.ok){const error=Error(data.error||'账号服务暂时不可用。');error.status=response.status;throw error;}return data;
  }
  async function authorized(path,options={}){
    const token=user&&session?.token;
    if(!token){const error=Error('请先登录。');error.status=401;throw error;}
    const response=await raw(path,options,token);
    if(response.status===401&&token===session?.token)clearLogin();
    return response;
  }
  async function verify(){
    if(verification)return verification;
    const token=session?.token;if(!token)return;
    verification=(async()=>{
      try{const result=await json('/api/chat/auth/me',{},token);if(session?.token!==token)return;const previous=user?.id;user=result.user;session={...session,user,expiresAt:result.expiresAt};lastVerified=Date.now();paint();if(previous!==user?.id)changed();else armExpiry();}
      catch(error){if(session?.token!==token)return;if(error.status===401)clearLogin();else if(!user)status('暂时无法验证登录，可以稍后重试或先游客试玩。',true);}
      finally{verification=null;}
    })();return verification;
  }
  function open(reason='登录后解锁宇智波带土、新忍者和玩家聊天。'){
    $('accountReason').textContent=reason;status('');
    if(!root.hidden){paint();return;}
    opener=document.activeElement;window.dispatchEvent(new CustomEvent('arena-before-auth-open'));
    window.dispatchEvent(new CustomEvent('arena-auth-open'));
    for(const region of document.querySelectorAll('.game-shell,#arenaChat')){inertRegions.set(region,region.inert);region.inert=true;}
    (document.fullscreenElement||document.body).append(root);root.hidden=false;paint();
    (user?$('accountLogout'):$('accountUsername')).focus();
  }
  function close(){
    if(pending)return;
    root.hidden=true;$('accountPassword').value='';$('accountConfirm').value='';$('accountPassword').type='password';$('accountReveal').textContent='显示';$('accountReveal').setAttribute('aria-pressed','false');
    for(const [region,wasInert]of inertRegions)region.inert=wasInert;inertRegions.clear();
    window.dispatchEvent(new CustomEvent('arena-auth-close',{detail:{authenticated:!!user}}));
    (opener?.isConnected?opener:entry).focus();
  }
  function setMode(next){mode=next;$('accountPassword').value='';$('accountConfirm').value='';status('');paint();$('accountUsername').focus();}
  entry.onclick=()=>open();$('accountClose').onclick=close;$('accountGuest').onclick=close;
  $('accountLoginTab').onclick=()=>setMode('login');$('accountRegisterTab').onclick=()=>setMode('register');
  $('accountTabs').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();setMode(event.key==='Home'?'login':event.key==='End'?'register':mode==='login'?'register':'login');(mode==='login'?$('accountLoginTab'):$('accountRegisterTab')).focus();}});
  $('accountReveal').onclick=()=>{const reveal=$('accountPassword').type==='password';$('accountPassword').type=reveal?'text':'password';$('accountReveal').textContent=reveal?'隐藏':'显示';$('accountReveal').setAttribute('aria-pressed',String(reveal));$('accountReveal').setAttribute('aria-label',reveal?'隐藏密码':'显示密码');};
  $('accountForm').onsubmit=async event=>{
    event.preventDefault();if(pending)return;
    const username=$('accountUsername').value.normalize('NFKC').trim(),password=$('accountPassword').value;
    if(!/^[\p{L}\p{N}_]{2,20}$/u.test(username)){status('用户名需为 2—20 个字母、数字或下划线，支持中文。',true);return;}
    if([...password].length<12||[...password].length>128){status('密码需为 12—128 个字符。',true);return;}
    if(mode==='register'&&password!==$('accountConfirm').value){status('两次输入的密码不一致。',true);$('accountConfirm').focus();return;}
    pending=true;status('正在'+(mode==='register'?'创建账号…':'登录…'));paint();
    try{
      const result=await json('/api/chat/auth/'+(mode==='register'?'register':'login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
      session={...result,persistent:$('accountRemember').checked};user=result.user;mode='login';lastVerified=Date.now();saveSession();pending=false;paint();changed();close();
    }catch(error){status(error.name==='AbortError'?'连接超时，请重试。':error.message,true);}
    finally{pending=false;paint();}
  };
  $('accountLogout').onclick=async()=>{
    if(pending)return;pending=true;paint();status('正在退出…');
    try{await json('/api/chat/auth/logout',{method:'POST'},session?.token);clearLogin('');pending=false;close();}
    catch{status('暂时无法连接服务器，请恢复网络后重试退出。',true);}
    finally{pending=false;paint();}
  };
  root.addEventListener('keydown',event=>{
    if(root.hidden)return;event.stopPropagation();
    if(event.key==='Escape'){event.preventDefault();close();return;}
    if(event.key==='Tab'){
      const fields=[...root.querySelectorAll('button,input')].filter(item=>!item.disabled&&item.getClientRects().length),first=fields[0],last=fields[fields.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  root.addEventListener('keyup',event=>{if(!root.hidden)event.stopPropagation();});
  document.addEventListener('fullscreenchange',()=>{if(!root.hidden)(document.fullscreenElement||document.body).append(root);});
  addEventListener('storage',event=>{if(event.key!==key||session&&!session.persistent)return;try{session=read(localStorage);}catch{}user=null;paint();changed();verify();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastVerified>60000)verify();});
  addEventListener('online',verify);
  const ready=Promise.resolve().then(verify).finally(()=>{paint();const welcome=()=>{if(!user&&root.hidden)open();};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',welcome,{once:true});else welcome();});
  window.ArenaAuth={API,ready,open,close,fetch:authorized,get user(){return user;},get token(){return user?session?.token:null;},isLocked(ninja){return !user&&!guests.has(typeof ninja==='string'?ninja:ninja?.id);}};
  paint();
})();
