(function(){
  'use strict';
  const CONTACT_EMAIL='hola@ibaitudancaphoto.com';
  const BRAND_DOMAIN='https://ibaitudancaphoto.com';
  const INSTAGRAM='@ibaitudancaphoto';
  const INSTAGRAM_URL='https://instagram.com/ibaitudancaphoto';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang=()=>document.body?.getAttribute('data-lang')||localStorage.getItem('ibaiLang')||'es';
  const t=(es,en)=>lang()==='es'?es:en;
  function sb(){
    if(!window.supabase||!window.IBAI_SUPABASE_URL||!window.IBAI_SUPABASE_ANON_KEY) return null;
    if(!window.IBAI_V124_SB) window.IBAI_V124_SB=window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY);
    return window.IBAI_V124_SB;
  }
  function gmailCompose({to,subject,body}){
    return 'https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(to||'')+'&su='+encodeURIComponent(subject||'')+'&body='+encodeURIComponent(body||'');
  }
  function mailto({to,subject,body}){
    return 'mailto:'+encodeURIComponent(to||CONTACT_EMAIL)+'?subject='+encodeURIComponent(subject||'')+'&body='+encodeURIComponent(body||'');
  }
  function installContactForm(){
    const form=$('#contact-form'); if(!form||form.dataset.v124Ready) return; form.dataset.v124Ready='1';
    const btn=$('#btn-submit'); const success=$('#form-success');
    form.addEventListener('submit',async(e)=>{
      e.preventDefault();
      if(btn){btn.disabled=true; btn.textContent=t('Preparando mensaje…','Preparing message…');}
      const fd=new FormData(form);
      const payload={
        name:String(fd.get('nombre')||'').trim(),
        club:String(fd.get('club')||'').trim(),
        email:String(fd.get('email')||'').trim(),
        message:String(fd.get('mensaje')||'').trim(),
        source:'index_contact',
        status:'new'
      };
      const subject='Nueva solicitud desde ibaitudancaphoto.com · '+(payload.name||'Contacto');
      const body=[
        'Nueva solicitud desde la web:',
        '',
        'Nombre: '+payload.name,
        'Club / Agencia: '+(payload.club||'—'),
        'Email: '+payload.email,
        '',
        'Mensaje:',
        payload.message,
        '',
        'Responder a: '+payload.email
      ].join('\n');
      let saved=false;
      try{
        const client=sb();
        if(client){
          const {error}=await client.from('contact_messages').insert(payload);
          if(!error) saved=true;
        }
      }catch(_){ }
      let sent=false;
      let sendError='';
      try{
        const res=await fetch('/api/contact',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(payload)
        });
        const out=await res.json().catch(()=>({}));
        if(!res.ok) throw new Error(out.error||'Email service error');
        sent=true;
      }catch(err){
        sendError=err?.message||String(err);
      }
      if(success){
        if(sent){
          success.innerHTML='<p style="font-size:28px; color:#fff;">✓</p><p>'+esc(t('Mensaje enviado correctamente. Responderé en menos de 24 horas.','Message sent successfully. I will reply within 24 hours.'))+'</p>'+(saved?'<p>'+esc(t('También queda registrado en el panel privado.','It has also been registered in the private panel.'))+'</p>':'');
          form.reset(); form.style.display='none'; success.style.display='block';
        }else{
          success.innerHTML='<p style="font-size:28px; color:#fff;">!</p><p>'+esc(t('El mensaje se ha guardado, pero el email no se ha podido enviar. Escríbeme directamente a hola@ibaitudancaphoto.com.','The message was saved, but the email could not be sent. Please email me directly at hola@ibaitudancaphoto.com.'))+'</p><p style="font-size:11px;color:var(--muted)">'+esc(sendError)+'</p>';
          success.style.display='block';
        }
      }
      if(btn){btn.disabled=false; btn.textContent=t('Enviar mensaje','Send message');}
    });
  }
  function updateBrandDetails(){
    document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{ if((a.textContent||'').includes('@')){ a.href='mailto:'+CONTACT_EMAIL; if(/ibaituda|hola@|info@|contacto@/.test(a.textContent)) a.textContent=CONTACT_EMAIL; }});
    document.querySelectorAll('a[href*="instagram.com"]').forEach(a=>{ a.href=INSTAGRAM_URL; if((a.textContent||'').includes('@')) a.textContent=INSTAGRAM; });
  }
  async function loadContactInbox(){
    const wrap=$('#v124-contact-inbox'); const client=sb(); if(!wrap||!client) return;
    const {data,error}=await client.from('contact_messages').select('*').order('created_at',{ascending:false}).limit(30);
    if(error){wrap.innerHTML='<div class="list-row"><div><div class="row-title">'+esc(error.message)+'</div></div></div>';return;}
    if(!data||!data.length){wrap.innerHTML='<div class="list-row"><div><div class="row-title">'+esc(t('Todavía no hay mensajes del formulario.','No contact form messages yet.'))+'</div><div class="row-meta">'+esc(t('Los mensajes del index aparecerán aquí.','Index form messages will appear here.'))+'</div></div></div>';return;}
    wrap.innerHTML=data.map(m=>`<div class="list-row"><div><div class="row-title">${esc(m.name||'Contacto')} ${m.club?`· ${esc(m.club)}`:''}</div><div class="row-meta">${esc(m.email||'')} · ${new Date(m.created_at).toLocaleString(lang()==='es'?'es-ES':'en-GB')}</div><p style="margin-top:8px;color:var(--muted);font-size:12px;line-height:1.6">${esc(m.message||'')}</p></div><div class="mail-actions"><a class="btn primary" target="_blank" rel="noopener" href="${gmailCompose({to:m.email,subject:'Re: tu mensaje en Ibai Tudanca Photo',body:'Hola '+(m.name||'')+',\n\n'})}">${esc(t('Responder','Reply'))}</a></div></div>`).join('');
  }
  function installAdminLaunchPanel(){
    const emails=$('#emails'); if(!emails||$('#v124-launch-panel')) return;
    const block=document.createElement('div'); block.id='v124-launch-panel';
    block.innerHTML=`<div class="section-title"><div><h2><span data-en>Website contact messages</span><span data-es>Mensajes del formulario</span></h2><p><span data-en>Messages sent from the portfolio contact section.</span><span data-es>Mensajes enviados desde el formulario del portfolio.</span></p></div><button class="btn" id="v124-refresh-contact">Actualizar</button></div><div class="list" id="v124-contact-inbox"><div class="list-row"><div><div class="row-title">Cargando mensajes...</div></div></div></div>`;
    emails.appendChild(block);
    $('#v124-refresh-contact')?.addEventListener('click',loadContactInbox);
    loadContactInbox();
  }
  function installSettingsContactCard(){
    const settings=$('#settings'); if(!settings||$('#v124-contact-settings')) return;
    const card=settings.querySelector('.card.pad'); if(!card) return;
    const div=document.createElement('div'); div.id='v124-contact-settings';
    div.innerHTML=`<div class="divider-line"></div><h2>Contacto público</h2><p class="row-meta">Email principal mostrado en la web y usado para formularios.</p><br><div class="form-grid"><div class="field"><label>Email público</label><input value="${CONTACT_EMAIL}" readonly></div><div class="field"><label>Instagram</label><input value="${INSTAGRAM}" readonly></div><div class="field full"><label>Dominio oficial</label><input value="${BRAND_DOMAIN}" readonly></div></div>`;
    card.appendChild(div);
  }
  function observeEmailsSection(){
    const main=$('.main')||document.body;
    const obs=new MutationObserver(()=>{installAdminLaunchPanel(); installSettingsContactCard();});
    obs.observe(main,{childList:true,subtree:true});
    setTimeout(()=>{installAdminLaunchPanel(); installSettingsContactCard();},800);
  }
  function init(){
    updateBrandDetails();
    installContactForm();
    observeEmailsSection();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
