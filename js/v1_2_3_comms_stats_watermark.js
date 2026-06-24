(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang=()=>document.body?.getAttribute('data-lang')||localStorage.getItem('ibaiLang')||'es';
  const t=(es,en)=>lang()==='es'?es:en;
  function sb(){
    if(!window.supabase||!window.IBAI_SUPABASE_URL||!window.IBAI_SUPABASE_ANON_KEY) return null;
    if(!window.IBAI_V123_SB) window.IBAI_V123_SB=window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY);
    return window.IBAI_V123_SB;
  }
  function fmt(v){try{return new Date(v).toLocaleString(lang()==='es'?'es-ES':'en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch{return v||''}}
  function showSection(id){
    $$('.section').forEach(s=>s.classList.toggle('active',s.id===id));
    $$('.side-btn').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
    window.scrollTo({top:0,behavior:'smooth'});
    if(id==='emails') setTimeout(loadEmailCenter,80);
    if(id==='downloads') setTimeout(enhanceDownloadStats,180);
    if(id==='settings') setTimeout(renderWatermarkSettings,220);
  }
  function installStyles(){
    if($('#v123-style')) return;
    const st=document.createElement('style'); st.id='v123-style'; st.textContent=`
      .email-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;align-items:start}.email-card{border:1px solid var(--line);background:rgba(255,255,255,.035);padding:16px}.email-card h3{font-size:16px;margin-bottom:10px}.mail-status{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);padding:6px 10px;text-transform:uppercase;letter-spacing:.13em;font-size:10px;color:var(--muted)}.mail-dot{width:8px;height:8px;border-radius:50%;background:#f0d878}.mail-dot.sent{background:#59d98e}.mail-dot.cancelled{background:#ff6b6b}.mail-dot.error{background:#ff6b6b}.mail-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.stats-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.stats-card{border:1px solid var(--line);background:rgba(255,255,255,.035);padding:16px}.stats-card strong{display:block;font-size:30px;font-weight:500}.stats-card span{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--soft)}.top-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:18px}.top-box{border:1px solid var(--line);background:rgba(255,255,255,.028);padding:14px}.top-box h4{font-size:13px;margin-bottom:10px}.top-box div{font-size:12px;color:var(--muted);line-height:1.8}.watermark-preview{height:180px;border:1px solid var(--line);background:linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.02)),url('img/work_A.jpg') center/cover;position:relative;overflow:hidden}.watermark-preview span{position:absolute;color:white;text-shadow:0 2px 12px rgba(0,0,0,.8);font-size:18px;font-weight:500;letter-spacing:.08em}.wm-top-left{top:18px;left:18px}.wm-top-right{top:18px;right:18px}.wm-bottom-left{bottom:18px;left:18px}.wm-bottom-right{bottom:18px;right:18px}.wm-center{top:50%;left:50%;transform:translate(-50%,-50%)}@media(max-width:1100px){.email-grid,.top-grid{grid-template-columns:1fr}.stats-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `; document.head.appendChild(st);
  }
  function installNav(){
    const sidebar=$('.sidebar'); if(!sidebar) return;
    if(!$('.side-btn[data-section="emails"]',sidebar)){
      const btn=document.createElement('button'); btn.className='side-btn'; btn.dataset.section='emails'; btn.innerHTML=`<span data-en>Emails</span><span data-es>Emails</span><span class="side-dot"></span>`;
      const admins=$('.side-btn[data-section="admins"]',sidebar); sidebar.insertBefore(btn,admins||$('.side-btn[data-section="settings"]',sidebar));
      btn.addEventListener('click',()=>showSection('emails'));
    }
  }
  function installEmailSection(){
    if($('#emails')) return;
    const main=$('.main'); if(!main) return;
    const section=document.createElement('section'); section.className='section'; section.id='emails';
    section.innerHTML=`
      <div class="hero" style="--hero-img:url('img/work_P.jpg')"><div class="hero-inner"><div><div class="eyebrow"><span data-en>Communication</span><span data-es>Comunicación</span></div><h1><span data-en>Email <em>center</em></span><span data-es>Centro de <em>emails</em></span></h1><p><span data-en>Create email drafts, approve automatic messages and keep communication history under control.</span><span data-es>Crea emails, aprueba avisos automáticos y controla el historial de comunicación.</span></p></div><button class="btn primary" id="email-scan-automation"><span data-en>Generate pending alerts</span><span data-es>Generar avisos pendientes</span></button></div></div>
      <div class="email-grid">
        <div class="card pad"><h2><span data-en>Pending approval</span><span data-es>Pendientes de aprobación</span></h2><p class="row-meta"><span data-en>Nothing is sent automatically. Preview, send or cancel each email.</span><span data-es>Nada se envía automáticamente. Previsualiza, envía o cancela cada email.</span></p><br><div class="list" id="email-pending-list"><div class="list-row"><div><div class="row-title">Cargando emails...</div></div></div></div></div>
        <div class="card pad"><h2><span data-en>Manual campaign</span><span data-es>Email manual</span></h2><div class="form-grid"><div class="field full"><label><span data-en>Recipients</span><span data-es>Destinatarios</span></label><select id="email-recipient-mode"><option value="single">Manual email</option><option value="all">Todos los clientes con email</option><option value="active">Clientes activos con email</option></select></div><div class="field full" id="email-manual-recipient-wrap"><label>Email</label><input id="email-manual-recipient" placeholder="cliente@email.com"></div><div class="field full"><label><span data-en>Subject</span><span data-es>Asunto</span></label><input id="email-subject" placeholder="Nueva galería disponible"></div><div class="field full"><label><span data-en>Message</span><span data-es>Mensaje</span></label><textarea id="email-body" placeholder="Escribe aquí el mensaje..."></textarea></div></div><br><button class="btn primary" id="email-create-draft"><span data-en>Create draft</span><span data-es>Crear borrador</span></button><p class="row-meta" id="email-compose-status" style="margin-top:12px"></p></div>
      </div>
      <div class="section-title"><div><h2><span data-en>History</span><span data-es>Historial</span></h2><p><span data-en>Sent, cancelled and failed emails.</span><span data-es>Emails enviados, cancelados y con error.</span></p></div></div><div class="list" id="email-history-list"></div>
      <div class="section-title"><div><h2><span data-en>Internal notifications</span><span data-es>Notificaciones internas</span></h2><p><span data-en>Useful recent activity for you.</span><span data-es>Actividad reciente útil para ti.</span></p></div></div><div class="list" id="internal-notifications-list"></div>`;
    const settings=$('#settings'); main.insertBefore(section,settings||null);
    $('#email-scan-automation')?.addEventListener('click',generateAutomaticDrafts);
    $('#email-create-draft')?.addEventListener('click',createManualDraft);
  }
  async function upsertOutbox(rows){const client=sb(); if(!client) throw new Error('Supabase no configurado'); return client.from('email_outbox').insert(rows);}
  async function createManualDraft(){
    const client=sb(); if(!client) return;
    const status=$('#email-compose-status'); if(status) status.textContent=t('Creando borrador...','Creating draft...');
    const mode=$('#email-recipient-mode')?.value||'single'; const subject=$('#email-subject')?.value.trim(); const body=$('#email-body')?.value.trim();
    if(!subject||!body){if(status)status.textContent=t('Falta asunto o mensaje.','Subject or message is missing.');return;}
    let rows=[];
    if(mode==='single'){
      const recipient=$('#email-manual-recipient')?.value.trim(); if(!recipient){if(status)status.textContent=t('Falta destinatario.','Recipient is missing.');return;}
      rows=[{email_type:'manual',recipient,subject,body,status:'pending_approval'}];
    }else{
      const {data,error}=await client.from('clients').select('id,name,email,active').is('deleted_at',null);
      if(error){if(status)status.textContent=error.message;return;}
      rows=(data||[]).filter(c=>c.email && (mode!=='active'||c.active!==false)).map(c=>({email_type:'campaign',recipient:c.email,subject,body,status:'pending_approval',related_client_id:c.id}));
      if(!rows.length){if(status)status.textContent=t('No hay clientes con email.','There are no clients with email.');return;}
    }
    const {error}=await upsertOutbox(rows); if(status) status.textContent=error?error.message:t('Borrador creado. Revisa pendientes antes de enviar.','Draft created. Review pending emails before sending.');
    loadEmailCenter();
  }
  async function generateAutomaticDrafts(){
    const client=sb(); if(!client) return;
    const btn=$('#email-scan-automation'); if(btn) btn.disabled=true;
    try{
      const [gRes,rRes]=await Promise.all([
        client.from('galleries').select('id,title_es,title_en,status,publish_status,clients:gallery_clients(clients(id,name,email))').is('deleted_at',null).limit(50),
        client.from('retouch_requests').select('id,status,client_id,gallery_id,clients(name,email),galleries(title_es,title_en)').eq('status','completed').limit(50)
      ]);
      const rows=[];
      (gRes.data||[]).forEach(g=>{
        const ready=['ready','published'].includes(g.status)||['ready','published'].includes(g.publish_status);
        if(!ready) return;
        (g.clients||[]).forEach(gc=>{const c=gc.clients; if(c?.email) rows.push({email_type:'gallery_ready',recipient:c.email,subject:`Galería lista · ${g.title_es||g.title_en||'Galería'}`,body:`Hola ${c.name||''}, tu galería ${g.title_es||g.title_en||''} ya está lista en tu panel privado.`,status:'pending_approval',related_client_id:c.id,related_gallery_id:g.id});});
      });
      (rRes.data||[]).forEach(r=>{const c=r.clients; if(c?.email) rows.push({email_type:'retouch_completed',recipient:c.email,subject:`Retoque completado · ${(r.galleries&&r.galleries.title_es)||'Galería'}`,body:`Hola ${c.name||''}, hay un retoque completado disponible en tu panel privado.`,status:'pending_approval',related_client_id:r.client_id,related_gallery_id:r.gallery_id});});
      if(!rows.length){alert(t('No hay nuevos avisos automáticos con email disponible.','No new automatic alerts with available email.')); return;}
      const {error}=await client.from('email_outbox').insert(rows); if(error) alert(error.message); else alert(t(`${rows.length} borrador(es) creados.`,`Created ${rows.length} draft(s).`));
      loadEmailCenter();
    }finally{if(btn) btn.disabled=false;}
  }
  async function sendEmailRow(row){
    const client=sb();
    const payload={
      to:row.recipient,
      subject:row.subject||'',
      body:row.body||'',
      email_type:row.email_type||'manual',
      outbox_id:row.id||null
    };
    const res=await fetch('/api/send-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const out=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(out.error||'No se pudo enviar el email.');
    if(client && row.id){
      await client.from('email_outbox').update({status:'sent',sent_at:new Date().toISOString(),error_message:null}).eq('id',row.id);
    }
    alert(t('Email enviado correctamente.','Email sent successfully.'));
  }
  function rowHtml(r){
    const dot=r.status==='sent'?'sent':r.status==='cancelled'?'cancelled':r.status==='error'?'error':'';
    return `<div class="list-row" data-email-id="${esc(r.id)}"><div><div class="row-title">${esc(r.subject||'(sin asunto)')}</div><div class="row-meta">${esc(r.recipient||'')} · ${esc(r.email_type||'email')} · ${fmt(r.created_at)}</div><p style="margin-top:8px;color:var(--muted);font-size:12px;line-height:1.6">${esc((r.body||'').slice(0,180))}${(r.body||'').length>180?'...':''}</p></div><div class="mail-actions"><span class="mail-status"><span class="mail-dot ${dot}"></span>${esc(r.status||'pending')}</span>${r.status==='pending_approval'?`<button class="btn" data-preview-email="${esc(r.id)}">Previsualizar</button><button class="btn primary" data-send-email="${esc(r.id)}">Enviar</button><button class="btn" data-cancel-email="${esc(r.id)}">Cancelar</button>`:''}</div></div>`;
  }
  async function loadEmailCenter(){
    const client=sb(); if(!client) return;
    const {data,error}=await client.from('email_outbox').select('*').order('created_at',{ascending:false}).limit(100);
    const pending=(data||[]).filter(r=>r.status==='pending_approval'); const history=(data||[]).filter(r=>r.status!=='pending_approval');
    $('#email-pending-list') && ($('#email-pending-list').innerHTML=error?`<div class="list-row"><div><div class="row-title">${esc(error.message)}</div></div></div>`:(pending.length?pending.map(rowHtml).join(''):`<div class="list-row"><div><div class="row-title">${t('No hay emails pendientes','No pending emails')}</div><div class="row-meta">${t('Los nuevos avisos aparecerán aquí antes de enviarse.','New alerts will appear here before being sent.')}</div></div></div>`));
    $('#email-history-list') && ($('#email-history-list').innerHTML=history.length?history.map(rowHtml).join(''):`<div class="list-row"><div><div class="row-title">${t('Sin historial todavía','No history yet')}</div></div></div>`);
    document.querySelectorAll('[data-preview-email]').forEach(b=>b.onclick=()=>{const r=(data||[]).find(x=>x.id===b.dataset.previewEmail); if(r) alert(`${r.subject}\n\nPara: ${r.recipient}\n\n${r.body}`);});
    document.querySelectorAll('[data-cancel-email]').forEach(b=>b.onclick=async()=>{await client.from('email_outbox').update({status:'cancelled',cancelled_at:new Date().toISOString()}).eq('id',b.dataset.cancelEmail); loadEmailCenter();});
    document.querySelectorAll('[data-send-email]').forEach(b=>b.onclick=async()=>{const r=(data||[]).find(x=>x.id===b.dataset.sendEmail); if(!r) return; try{await sendEmailRow(r); loadEmailCenter();}catch(e){await client.from('email_outbox').update({status:'error',error_message:e.message}).eq('id',r.id); alert(e.message); loadEmailCenter();}});
    loadInternalNotifications();
  }
  async function loadInternalNotifications(){
    const client=sb(); if(!client||!$('#internal-notifications-list')) return;
    const [d,r,f]=await Promise.allSettled([
      client.from('download_logs').select('*,clients(name),galleries(title_es,title_en)').order('created_at',{ascending:false}).limit(4),
      client.from('retouch_requests').select('*,clients(name),galleries(title_es,title_en)').order('created_at',{ascending:false}).limit(4),
      client.from('favourites').select('*,clients(name),photos(filename),galleries(title_es,title_en)').order('created_at',{ascending:false}).limit(4)
    ]);
    const items=[];
    (d.value?.data||[]).forEach(x=>items.push({type:t('Descarga','Download'),title:x.clients?.name||t('Cliente','Client'),meta:`${x.galleries?.title_es||x.galleries?.title_en||''} · ${fmt(x.created_at)}`}));
    (r.value?.data||[]).forEach(x=>items.push({type:t('Retoque','Retouch'),title:x.clients?.name||t('Cliente','Client'),meta:`${x.status||''} · ${fmt(x.created_at)}`}));
    (f.value?.data||[]).forEach(x=>items.push({type:t('Favorito','Favourite'),title:x.clients?.name||t('Cliente','Client'),meta:`${x.photos?.filename||''} · ${fmt(x.created_at)}`}));
    $('#internal-notifications-list').innerHTML=items.length?items.slice(0,8).map(i=>`<div class="list-row"><div><div class="row-title">${esc(i.type)} · ${esc(i.title)}</div><div class="row-meta">${esc(i.meta)}</div></div></div>`).join(''):`<div class="list-row"><div><div class="row-title">${t('Sin notificaciones todavía','No notifications yet')}</div></div></div>`;
  }
  async function enhanceDownloadStats(){
    const section=$('#downloads'); if(!section||$('#v123-download-stats')) return;
    const list=$('#downloads-list')||section.querySelector('.list'); if(!list) return;
    const client=sb(); if(!client) return;
    const {data}=await client.from('download_logs').select('*,clients(name),galleries(title_es,title_en),photos(filename)').order('created_at',{ascending:false}).limit(500);
    const rows=data||[]; const totalPhotos=rows.reduce((a,r)=>a+(Number(r.photos_count)||1),0); const cutoff=Date.now()-30*24*3600*1000; const last30=rows.filter(r=>new Date(r.created_at).getTime()>=cutoff).length;
    const countBy=(fn)=>{const m=new Map(); rows.forEach(r=>{const k=fn(r); if(!k)return; m.set(k,(m.get(k)||0)+(Number(r.photos_count)||1));}); return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);};
    const topClients=countBy(r=>r.clients?.name); const topGalleries=countBy(r=>r.galleries?.title_es||r.galleries?.title_en); const topPhotos=countBy(r=>r.photos?.filename);
    const block=document.createElement('div'); block.id='v123-download-stats'; block.innerHTML=`<div class="stats-row"><div class="stats-card"><strong>${rows.length}</strong><span>${t('Descargas','Downloads')}</span></div><div class="stats-card"><strong>${totalPhotos}</strong><span>${t('Fotos descargadas','Photos downloaded')}</span></div><div class="stats-card"><strong>${last30}</strong><span>${t('Últimos 30 días','Last 30 days')}</span></div><div class="stats-card"><strong>${topClients[0]?.[0]||'—'}</strong><span>${t('Top cliente','Top client')}</span></div></div><div class="top-grid"><div class="top-box"><h4>${t('Top clientes','Top clients')}</h4>${topClients.map(([k,v])=>`<div>${esc(k)} · ${v}</div>`).join('')||'—'}</div><div class="top-box"><h4>${t('Top galerías','Top galleries')}</h4>${topGalleries.map(([k,v])=>`<div>${esc(k)} · ${v}</div>`).join('')||'—'}</div><div class="top-box"><h4>${t('Top fotos','Top photos')}</h4>${topPhotos.map(([k,v])=>`<div>${esc(k)} · ${v}</div>`).join('')||'—'}</div></div>`;
    list.parentNode.insertBefore(block,list);
  }
  async function renderWatermarkSettings(){
    const section=$('#settings'); if(!section) return;
    let card=section.querySelector('.card.pad'); if(!card) return;
    const client=sb(); let vals={};
    if(client){const {data}=await client.from('app_settings').select('key,value').in('key',['watermark_enabled','watermark_text','watermark_position','watermark_opacity','watermark_size','email_webhook_url']); (data||[]).forEach(r=>vals[r.key]=r.value);}
    if($('#watermark-settings-block')) return;
    const wrap=document.createElement('div'); wrap.id='watermark-settings-block'; wrap.innerHTML=`<div class="divider-line"></div><h2><span data-en>Watermark</span><span data-es>Marca de agua</span></h2><p class="row-meta"><span data-en>Applied to client downloads when enabled.</span><span data-es>Se aplica a las descargas del cliente cuando está activada.</span></p><br><div class="form-grid"><div class="field"><label>${t('Activar marca de agua','Enable watermark')}</label><select id="wm-enabled"><option value="false">No</option><option value="true">Sí / Yes</option></select></div><div class="field"><label>${t('Texto','Text')}</label><input id="wm-text" placeholder="© Ibai Tudanca Photo"></div><div class="field"><label>${t('Posición','Position')}</label><select id="wm-position"><option value="bottom-right">Abajo derecha</option><option value="bottom-left">Abajo izquierda</option><option value="top-right">Arriba derecha</option><option value="top-left">Arriba izquierda</option><option value="center">Centro</option></select></div><div class="field"><label>${t('Opacidad','Opacity')}</label><input id="wm-opacity" type="range" min="0.05" max="0.8" step="0.05"></div><div class="field"><label>${t('Tamaño','Size')}</label><input id="wm-size" type="range" min="12" max="80" step="2"></div><div class="field"><label>Email webhook / Resend Edge Function</label><input id="email-webhook-url" placeholder="https://.../functions/v1/send-email"></div></div><br><div class="watermark-preview"><span id="wm-preview-text">© Ibai Tudanca Photo</span></div><br><button class="btn primary" id="wm-save">${t('Guardar marca de agua','Save watermark')}</button><p class="row-meta" id="wm-status" style="margin-top:12px"></p>`;
    card.appendChild(wrap);
    $('#wm-enabled').value=vals.watermark_enabled||'false'; $('#wm-text').value=vals.watermark_text||'© Ibai Tudanca Photo'; $('#wm-position').value=vals.watermark_position||'bottom-right'; $('#wm-opacity').value=vals.watermark_opacity||'0.25'; $('#wm-size').value=vals.watermark_size||'26'; $('#email-webhook-url').value=vals.email_webhook_url||'';
    function upd(){const p=$('#wm-preview-text'); if(!p)return; p.textContent=$('#wm-text').value||'© Ibai Tudanca Photo'; p.className='wm-'+($('#wm-position').value||'bottom-right'); p.style.opacity=$('#wm-opacity').value||0.25; p.style.fontSize=($('#wm-size').value||26)+'px';}
    ['wm-text','wm-position','wm-opacity','wm-size'].forEach(id=>$('#'+id)?.addEventListener('input',upd)); upd();
    $('#wm-save')?.addEventListener('click',async()=>{const c=sb(); if(!c)return; const rows=[['watermark_enabled',$('#wm-enabled').value],['watermark_text',$('#wm-text').value],['watermark_position',$('#wm-position').value],['watermark_opacity',$('#wm-opacity').value],['watermark_size',$('#wm-size').value],['email_webhook_url',$('#email-webhook-url').value.trim()]].map(([key,value])=>({key,value})); const {error}=await c.from('app_settings').upsert(rows,{onConflict:'key'}); $('#wm-status').textContent=error?error.message:t('Marca de agua guardada.','Watermark saved.');});
  }
  function init(){installStyles();installNav();installEmailSection(); setTimeout(()=>{enhanceDownloadStats(); renderWatermarkSettings();},600);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();
})();
