/* Account-only chat; the service also protects history, images and writes. */
(() => {
  'use strict';
  const API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)?'http://127.0.0.1:5173':
    location.hostname.endsWith('.chatgpt.site')?location.origin:'https://nindao-duel-arena.blushcharm258.chatgpt.site';
  const $=id=>document.getElementById(id),store={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
  const auth=window.ArenaAuth;
  let identity=auth?.user||null,epoch=0,chatAfterLogin=false;
  const media=new Map(),imageLoaders=new WeakMap();
  let imageObserver;
  let pending=false,compressing=false,attachment=null,previewURL='',timer=null,controller=null,open=false,signature='',draftId=null,lastFocus=null;
  const reported=new Set(),inertRegions=new Map(),root=document.createElement('div');root.id='arenaChat';
  root.innerHTML=`<button id="chatToggle" class="chat-toggle" aria-label="打开玩家聊天" aria-expanded="false" aria-controls="chatPanel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 3V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h7"/></svg><span>玩家聊天</span></button>
    <section id="chatPanel" class="chat-panel" role="dialog" aria-modal="true" aria-labelledby="chatTitle" hidden>
      <header class="chat-heading"><div><small>DUEL COMMUNITY</small><h2 id="chatTitle">玩家聊天 <span id="chatConnection">连接中</span></h2></div><button id="chatClose" class="chat-small-button" aria-label="关闭聊天">✕</button></header>
      <div class="chat-notice">交流连招，分享对战截图 <span>· 登录玩家可见</span></div>
      <div id="chatMessages" class="chat-messages" role="log" aria-label="公共聊天记录" aria-live="polite" aria-relevant="additions"></div>
      <button id="chatLatest" class="chat-latest" hidden>查看新消息 ↓</button>
      <form id="chatForm" class="chat-compose">
        <label class="chat-nickname">昵称 <input id="chatNickname" maxlength="20" autocomplete="nickname" aria-label="聊天昵称"></label>
        <div id="chatAttachment" class="chat-attachment" hidden><img id="chatPreview" alt="待发送图片"><div><b>图片已准备</b><small id="chatImageInfo"></small></div><button type="button" id="chatRemoveImage" class="chat-small-button" aria-label="移除待发送图片">✕</button></div>
        <label class="chat-text-label" for="chatText">聊天内容</label><textarea id="chatText" maxlength="1000" rows="3" placeholder="聊聊忍者、连招，或附上一张图片…" aria-label="聊天内容"></textarea>
        <div class="chat-compose-actions"><button id="chatChooseImage" type="button" class="chat-image-button"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m4 18 6-6 4 4 3-3 4 5"/></svg>图片</button><small id="chatCounter">0 / 500</small><button id="chatSend" type="submit" class="chat-send">发送 ↑</button></div>
        <input id="chatFile" type="file" accept="image/jpeg,image/png,image/webp" hidden>
        <div id="chatStatus" class="chat-status" role="status" aria-live="polite"></div><small class="chat-retention">消息最多保留 7 天 · Enter 发送，Shift + Enter 换行</small>
      </form>
    </section>
    <div id="chatViewer" class="chat-viewer" role="dialog" aria-modal="true" aria-label="查看聊天图片" hidden><button id="chatViewerClose" class="chat-small-button" aria-label="关闭图片">✕</button><img id="chatFullImage" alt="玩家分享的图片"></div>`;
  document.body.append(root);
  document.addEventListener('fullscreenchange',()=>{(document.fullscreenElement||document.body).append(root);});
  function setGameInert(value){
    if(value){for(const region of document.querySelectorAll('.topbar,#selection,#hud,#modal,#keySettings,#arena,.footer')){inertRegions.set(region,region.inert);region.inert=true;}}
    else{for(const [region,inert]of inertRegions)region.inert=inert;inertRegions.clear();}
  }
  const nickname=store.get('arena-chat-nickname')||'忍者'+String(Math.floor(Math.random()*10000)).padStart(4,'0');
  $('chatNickname').value=nickname;
  const setStatus=(text,error=false)=>{$('chatStatus').textContent=text;$('chatStatus').classList.toggle('error',error);};
  const connection=(text,online=false)=>{$('chatConnection').textContent=text;$('chatConnection').classList.toggle('connected',online);};
  const countText=()=>[...$('chatText').value].length;
  function updateSend(){const count=countText();$('chatCounter').textContent=count+' / 500';$('chatCounter').classList.toggle('over-limit',count>500);$('chatSend').disabled=!auth?.user||pending||compressing||count>500||(!count&&!attachment);$('chatChooseImage').disabled=!auth?.user||pending||compressing;$('chatRemoveImage').disabled=pending;$('chatText').readOnly=pending;$('chatNickname').readOnly=pending;$('chatSend').textContent=pending?'发送中…':'发送 ↑';}
  function clearAttachment(){if(previewURL)URL.revokeObjectURL(previewURL);attachment=null;previewURL='';$('chatPreview').removeAttribute('src');$('chatAttachment').hidden=true;$('chatFile').value='';updateSend();}
  async function request(path,options={}){
    const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),12000),cancel=()=>abort.abort();
    options.signal?.addEventListener('abort',cancel,{once:true});if(options.signal?.aborted)cancel();
    try{
      if(!auth?.user){const error=Error('请先登录后再使用聊天。');error.status=401;throw error;}
      const response=await auth.fetch(path,{...options,signal:abort.signal});
      const data=await response.json();if(!response.ok){const error=new Error(data.error||'聊天服务暂时不可用。');error.status=response.status;throw error;}return data;
    }finally{clearTimeout(timeout);options.signal?.removeEventListener('abort',cancel);}
  }
  async function authenticated(path,options){
    return request(path,options);
  }
  if('IntersectionObserver' in window)imageObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){imageObserver.unobserve(entry.target);imageLoaders.get(entry.target)?.();}},{root:$('chatMessages'),rootMargin:'300px'});
  function disposeMedia(){imageObserver?.disconnect();for(const value of media.values()){value.controller.abort();if(value.url)URL.revokeObjectURL(value.url);}media.clear();}
  function protectedImage(message,nearBottom,list){
    const button=document.createElement('button');button.className='chat-picture';button.type='button';button.setAttribute('aria-label','放大查看'+(message.nickname||'玩家')+'的图片');
    const image=document.createElement('img');image.alt=(message.nickname||'玩家')+'分享的图片';button.append(image);const current=epoch;
    button.onclick=()=>{const source=media.get(message.id)?.url;if(source)viewer(source);};
    const load=async()=>{
      if(current!==epoch||!auth?.user)return;
      if(media.get(message.id)?.url){image.src=media.get(message.id).url;return;}
      const item={controller:new AbortController(),url:''};media.set(message.id,item);
      try{const response=await auth.fetch('/api/chat/images/'+message.id,{signal:item.controller.signal});if(!response.ok)throw Error();const blob=await response.blob();if(current!==epoch||media.get(message.id)!==item)return;item.url=URL.createObjectURL(blob);image.src=item.url;image.onload=()=>{if(nearBottom)list.scrollTop=list.scrollHeight;};}
      catch(error){if(current!==epoch||error.name==='AbortError')return;button.textContent='图片已撤回或暂时无法加载';button.disabled=true;}
    };
    imageLoaders.set(button,load);if(imageObserver)imageObserver.observe(button);else load();return button;
  }
  function viewer(source){$('chatFullImage').src=source;$('chatViewer').hidden=false;$('chatPanel').inert=true;$('chatViewerClose').focus();}
  function closeViewer(){$('chatViewer').hidden=true;$('chatFullImage').removeAttribute('src');$('chatPanel').inert=false;$('chatText').focus();}
  function render(messages){
    messages=messages.filter(m=>Number.isSafeInteger(m.id)&&m.id>0&&!reported.has(m.id));
    const imageIds=new Set(messages.filter(m=>m.image).map(m=>m.id));for(const [id,item]of media)if(!imageIds.has(id)){item.controller.abort();if(item.url)URL.revokeObjectURL(item.url);media.delete(id);}
    const nextSignature=JSON.stringify([identity?.id,messages]);if(nextSignature===signature)return;signature=nextSignature;
    const list=$('chatMessages'),nearBottom=list.scrollHeight-list.scrollTop-list.clientHeight<90,oldScroll=list.scrollTop,fragment=document.createDocumentFragment();
    if(!messages.length){const empty=document.createElement('div');empty.className='chat-empty';empty.innerHTML='<span>聊</span><b>还没有消息</b><p>分享一段连招心得，或发一张对战截图吧。</p>';fragment.append(empty);}
    for(const message of messages){
      const mine=message.authorId===identity?.id,row=document.createElement('article');row.className='chat-message'+(mine?' mine':'');row.dataset.messageId=String(message.id);
      const existing=list.querySelector(`[data-message-id="${message.id}"]`);
      if(existing&&existing.dataset.mine===String(mine)){fragment.append(existing);continue;}
      row.dataset.mine=String(mine);
      const avatar=document.createElement('span');avatar.className='chat-avatar';avatar.textContent=[...(message.nickname||'忍')][0];
      const body=document.createElement('div');body.className='chat-message-body';const heading=document.createElement('div');heading.className='chat-message-meta';
      const name=document.createElement('b');name.textContent=message.nickname||'忍者';const time=document.createElement('time');time.dateTime=new Date(message.createdAt).toISOString();time.textContent=new Date(message.createdAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});heading.append(name,time);body.append(heading);
      if(message.text){const text=document.createElement('p');text.className='chat-message-text';text.textContent=message.text;body.append(text);}
      if(message.image)body.append(protectedImage(message,nearBottom,list));
      const action=document.createElement('button');action.type='button';action.className='chat-message-action';action.textContent=mine?'撤回':'举报';action.setAttribute('aria-label',(mine?'撤回自己的消息':'举报这条消息')+'，'+message.id);
      action.onclick=async()=>{
        const current=epoch;
        action.disabled=true;
        try{await authenticated('/api/chat/messages/'+message.id+(mine?'':'/report'),{method:mine?'DELETE':'POST'});if(current!==epoch)return;if(!mine){reported.add(message.id);setStatus('已举报，并在本页隐藏这条消息。');}signature='';await refresh();}
        catch(error){if(current===epoch){setStatus(error.message,true);action.disabled=false;}}
      };
      body.append(action);row.append(avatar,body);fragment.append(row);
    }
    list.replaceChildren(fragment);
    if(nearBottom||!oldScroll){list.scrollTop=list.scrollHeight;$('chatLatest').hidden=true;}else{list.scrollTop=oldScroll;$('chatLatest').hidden=false;}
  }
  async function refresh(){
    if(!open||document.hidden)return;
    const current=epoch;
    controller?.abort();controller=new AbortController();
    try{const data=await request('/api/chat/messages',{signal:controller.signal});if(!open||current!==epoch)return;render(data.messages||[]);connection('已连接',true);}
    catch(error){if(!open||current!==epoch||error.name==='AbortError')return;connection('连接中断');if(!$('chatMessages').children.length){const empty=document.createElement('div');empty.className='chat-empty';const p=document.createElement('p');p.textContent='暂时无法连接聊天，正在重试。';const retry=document.createElement('button');retry.className='chat-small-button';retry.textContent='重新连接';retry.onclick=refresh;empty.append(p,retry);$('chatMessages').append(empty);}}
  }
  function close(){
    if(!$('chatViewer').hidden)closeViewer();open=false;clearInterval(timer);timer=null;controller?.abort();$('chatPanel').hidden=true;$('chatToggle').setAttribute('aria-expanded','false');setGameInert(false);window.dispatchEvent(new CustomEvent('arena-chat-close'));
    const focusTarget=!$('keySettings').hidden?$('keyGrid').querySelector('button'):!$('modal').hidden?$('modalActions').querySelector('button'):!$('hud').hidden?$('arena'):lastFocus||$('chatToggle');
    focusTarget?.focus();
  }
  function show(){
    if(!auth?.user){chatAfterLogin=true;auth?.open('登录后才能进入玩家聊天、发送文字和分享图片。');return;}
    if(open){close();return;}open=true;lastFocus=document.activeElement;$('chatPanel').hidden=false;$('chatToggle').setAttribute('aria-expanded','true');window.dispatchEvent(new CustomEvent('arena-chat-open'));setGameInert(true);$('chatText').focus();refresh();timer=setInterval(refresh,5000);
  }
  async function prepareImage(file){
    if(!auth?.user||!file||pending||compressing)return;const current=epoch;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setStatus('请选择 JPG、PNG 或 WebP 图片。',true);return;}
    if(file.size>12*1024*1024){setStatus('原图请小于 12 MB。',true);return;}
    compressing=true;updateSend();setStatus('正在压缩图片…');let objectURL='';
    try{
      objectURL=URL.createObjectURL(file);const image=new Image();image.src=objectURL;await image.decode();
      if(!image.naturalWidth||!image.naturalHeight)throw Error('图片无法读取，请换一张。');
      const scale=Math.min(1,1280/image.naturalWidth,1280/image.naturalHeight),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
      let blob;for(const quality of [.84,.7,.55,.4,.28]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=512*1024)break;}
      if(!blob||blob.size>512*1024)throw Error('这张图片压缩后仍然过大，请裁剪后再试。');
      if(current!==epoch||!auth?.user)return;clearAttachment();attachment=new File([blob],'arena-image.jpg',{type:'image/jpeg'});previewURL=URL.createObjectURL(attachment);$('chatPreview').src=previewURL;$('chatImageInfo').textContent=canvas.width+' × '+canvas.height+' · '+Math.ceil(attachment.size/1024)+' KB';$('chatAttachment').hidden=false;draftId=null;setStatus('图片已压缩，点击发送后分享。');
    }catch(error){if(current===epoch)setStatus(error.message||'图片处理失败，请重新选择。',true);}finally{if(objectURL)URL.revokeObjectURL(objectURL);if(current===epoch){compressing=false;updateSend();}}
  }
  $('chatToggle').onclick=show;$('chatClose').onclick=close;$('chatViewerClose').onclick=closeViewer;
  $('chatViewer').onclick=event=>{if(event.target===$('chatViewer'))closeViewer();};
  $('chatChooseImage').onclick=()=>$('chatFile').click();$('chatFile').onchange=()=>prepareImage($('chatFile').files[0]);$('chatRemoveImage').onclick=()=>{clearAttachment();draftId=null;};
  $('chatLatest').onclick=()=>{$('chatMessages').scrollTop=$('chatMessages').scrollHeight;$('chatLatest').hidden=true;};
  $('chatMessages').onscroll=()=>{const list=$('chatMessages');if(list.scrollHeight-list.scrollTop-list.clientHeight<90)$('chatLatest').hidden=true;};
  $('chatText').oninput=()=>{draftId=null;updateSend();};$('chatNickname').oninput=()=>{store.set('arena-chat-nickname',$('chatNickname').value);draftId=null;};
  $('chatText').addEventListener('paste',event=>{const image=[...event.clipboardData.items].find(item=>item.type.startsWith('image/'));if(image){event.preventDefault();prepareImage(image.getAsFile());}});
  $('chatText').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&event.keyCode!==229){event.preventDefault();if(!$('chatSend').disabled)$('chatForm').requestSubmit();}});
  root.addEventListener('keydown',event=>{
    if(!open){if(['Enter','Space'].includes(event.code))event.stopPropagation();return;}
    event.stopPropagation();if(event.code==='Escape'&&open){event.preventDefault();if(!$('chatViewer').hidden)closeViewer();else close();return;}
    if(event.code==='Tab'&&open){const area=$('chatViewer').hidden?$('chatPanel'):$('chatViewer'),items=[...area.querySelectorAll('button,input,textarea')].filter(item=>!item.disabled&&!item.hidden&&item.getClientRects().length),first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  });
  root.addEventListener('keyup',event=>{if(open)event.stopPropagation();});
  $('chatForm').onsubmit=async event=>{
    event.preventDefault();if(!auth?.user){show();return;}if(pending||compressing)return;const current=epoch,text=$('chatText').value.trim(),name=$('chatNickname').value.trim();
    if(!name){setStatus('先给自己起个昵称吧。',true);$('chatNickname').focus();return;}
    if([...name].length>20||[...text].length>500){setStatus('昵称最多 20 字，消息最多 500 字。',true);return;}
    if(!text&&!attachment)return;pending=true;updateSend();setStatus('正在发送…');
    const form=new FormData();draftId=draftId||crypto.randomUUID();form.set('nickname',name);form.set('text',text);form.set('clientId',draftId);if(attachment)form.set('image',attachment);
    try{await authenticated('/api/chat/messages',{method:'POST',body:form});if(current!==epoch)return;store.set('arena-chat-nickname',name);$('chatText').value='';clearAttachment();draftId=null;signature='';setStatus('');await refresh();$('chatMessages').scrollTop=$('chatMessages').scrollHeight;}
    catch(error){if(current===epoch)setStatus(error.name==='AbortError'?'连接超时，内容已保留，可以重试。':error.message,true);}
    finally{if(current===epoch){pending=false;updateSend();}}
  };
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&open)refresh();});
  window.addEventListener('online',()=>{if(open)refresh();});
  window.addEventListener('arena-before-auth-open',()=>{if(open)close();});
  window.addEventListener('arena-auth-close',event=>{const resume=chatAfterLogin&&event.detail?.authenticated;chatAfterLogin=false;if(resume)queueMicrotask(show);});
  window.addEventListener('arena-auth-change',()=>{
    epoch++;if(open)close();identity=auth?.user||null;controller?.abort();disposeMedia();signature='';reported.clear();$('chatMessages').replaceChildren();$('chatText').value='';pending=false;compressing=false;clearAttachment();draftId=null;setStatus('');
    $('chatNickname').value=identity?.username||nickname;$('chatToggle').setAttribute('aria-label',identity?'打开玩家聊天':'登录后使用玩家聊天');updateSend();
  });
  $('chatToggle').setAttribute('aria-label',identity?'打开玩家聊天':'登录后使用玩家聊天');
  updateSend();
})();
