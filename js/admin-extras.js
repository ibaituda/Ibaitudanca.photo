(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function lang(){return document.body?.getAttribute('data-lang') || localStorage.getItem('ibaiLang') || 'es'}
  function t(es,en){return lang()==='es'?es:en}
  function getSb(){ if(!window.supabase||!window.IBAI_SUPABASE_URL||!window.IBAI_SUPABASE_ANON_KEY) return null; return window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY); }
  function fmtDate(value){ if(!value) return ''; try{return new Date(value).toLocaleString(lang()==='es'?'es-ES':'en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch{return value;} }
  function simpleDate(value){ if(!value) return ''; try{return new Date(value+'T12:00:00').toLocaleDateString(lang()==='es'?'es-ES':'en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch{return value;} }
  function localKey(date){ const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); const d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
  function statusDot(status){
    if(['completed','done'].includes(status)) return 'green';
    if(['confirmed'].includes(status)) return 'yellow';
    if(['covering','in_progress'].includes(status)) return 'blue';
    if(['cancelled','canceled'].includes(status)) return 'red';
    return 'yellow';
  }
  function statusText(status){return {pending:t('Pendiente','Pending'),confirmed:t('Confirmado','Confirmed'),covering:t('En cobertura','In coverage'),completed:t('Finalizado','Completed'),cancelled:t('Cancelado','Cancelled')}[status]||status;}

  async function loadDownloads(){
    const section=$('#downloads'); if(!section) return;
    let list=section.querySelector('.list');
    if(!list){ list=document.createElement('div'); list.className='list'; section.appendChild(list); }
    const sb=getSb();
    if(!sb){ list.innerHTML='<div class="list-row"><div><div class="row-title">Supabase not configured</div></div></div>'; return; }
    list.innerHTML=`<div class="list-row"><div><div class="row-title">${t('Cargando descargas...','Loading downloads...')}</div></div></div>`;
    const {data,error}=await sb.from('download_logs')
      .select('*, clients(name,username,profile_image_url), galleries(title_es,title_en), photos(filename,preview_url,large_url,original_url)')
      .order('created_at',{ascending:false})
      .limit(80);
    if(error){ list.innerHTML=`<div class="list-row"><div><div class="row-title">${t('No se pudieron cargar las descargas','Could not load downloads')}</div><div class="row-meta">${esc(error.message)}</div></div></div>`; return; }
    if(!data||!data.length){ list.innerHTML=`<div class="list-row"><div><div class="row-title">${t('Todavía no hay descargas registradas','No downloads logged yet')}</div><div class="row-meta">${t('Cuando un cliente descargue fotos, aparecerá aquí.','When a client downloads photos, they will appear here.')}</div></div></div>`; return; }
    const total=data.reduce((a,r)=>a+(Number(r.photos_count)||1),0);
    const hero=section.querySelector('.hero p'); if(hero) hero.textContent=t(`${data.length} descargas registradas · ${total} fotos descargadas`,`${data.length} downloads logged · ${total} photos downloaded`);
    list.innerHTML=data.map(r=>{
      const client=r.clients||{}; const gallery=r.galleries||{}; const photo=r.photos||{};
      const img=photo.preview_url||photo.large_url||photo.original_url||client.profile_image_url||'img/work_A.jpg';
      const galleryTitle=gallery.title_es||gallery.title_en||t('Galería privada','Private gallery');
      const typeLabel={individual:t('Individual','Individual'),single:t('Individual','Individual'),selected:t('Seleccionadas','Selected'),favourites:t('Favoritas','Favourites'),all:t('Galería completa','Full gallery')}[r.download_type]||r.download_type||t('Descarga','Download');
      return `<div class="list-row">
        <img class="avatar" src="${esc(img)}" alt="">
        <div>
          <div class="row-title">${esc(client.name||client.username||t('Cliente','Client'))} · ${Number(r.photos_count)||1} ${t('foto(s)','photo(s)')}</div>
          <div class="row-meta">${esc(galleryTitle)} · ${esc(typeLabel)} · ${esc(r.size_label||'')} · ${fmtDate(r.created_at)}</div>
        </div>
        <div class="pill"><span>${esc(typeLabel)}</span></div>
      </div>`;
    }).join('');
  }

  function monthLabel(date){return date.toLocaleDateString(lang()==='es'?'es-ES':'en-GB',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());}
  let calendarMonth=new Date(); calendarMonth.setDate(1);
  let cachedEvents=[];

  function renderCalendar(events){
    const section=$('#calendar'); if(!section) return;
    let wrap=section.querySelector('.calendar-wrap');
    if(!wrap){wrap=document.createElement('div');wrap.className='calendar-wrap';section.appendChild(wrap);}
    const year=calendarMonth.getFullYear(), month=calendarMonth.getMonth();
    const first=new Date(year,month,1); const last=new Date(year,month+1,0);
    const startOffset=(first.getDay()+6)%7; // Monday first
    const days=[]; for(let i=0;i<startOffset;i++)days.push(null); for(let d=1;d<=last.getDate();d++)days.push(new Date(year,month,d));
    while(days.length%7!==0)days.push(null);
    const today=new Date();
    const byDate=new Map(); events.forEach(ev=>{ if(!byDate.has(ev.event_date)) byDate.set(ev.event_date,[]); byDate.get(ev.event_date).push(ev); });
    wrap.innerHTML=`
      <div class="card pad">
        <div class="calendar-head"><h2>${monthLabel(calendarMonth)}</h2><div class="row-actions"><button class="btn" id="cal-prev">${t('Anterior','Previous')}</button><button class="btn" id="cal-next">${t('Siguiente','Next')}</button></div></div>
        <div class="calendar-grid">
          ${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((es,i)=>`<div class="day-name">${lang()==='es'?es:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</div>`).join('')}
          ${days.map(day=>{
            if(!day) return '<div class="day past"></div>';
            const key=localKey(day); const evs=byDate.get(key)||[];
            const past=day < new Date(today.getFullYear(),today.getMonth(),today.getDate()); const isToday=key===today.toISOString().slice(0,10);
            return `<div class="day ${past?'past':''} ${isToday?'today':''}"><span class="day-num">${day.getDate()}</span>${evs.slice(0,2).map(ev=>`<div class="event-chip ${statusDot(ev.status)}" data-edit-event="${esc(ev.id)}">${esc(ev.title)}${ev.event_time?' · '+esc(ev.event_time.slice(0,5)):''}</div>`).join('')}</div>`;
          }).join('')}
        </div>
      </div>
      <div class="card pad">
        <h2>${t('Crear / editar evento','Create / edit event')}</h2>
        <input type="hidden" id="cal-event-id">
        <div class="form-grid" style="grid-template-columns:1fr">
          <div class="field"><label>${t('Título del evento','Event title')}</label><input id="cal-title" placeholder="Athletic Club vs Real Sociedad"></div>
          <div class="field"><label>${t('Fecha','Date')}</label><input id="cal-date" type="date"></div>
          <div class="field"><label>${t('Hora','Time')}</label><input id="cal-time" type="time"></div>
          <div class="field"><label>${t('Lugar','Location')}</label><input id="cal-location" placeholder="San Mamés"></div>
          <div class="field"><label>${t('Fotógrafo','Photographer')}</label><input id="cal-photographer" placeholder="Ibai Tudanca" value="Ibai Tudanca"></div>
          <div class="field"><label>${t('Estado','Status')}</label><select id="cal-status"><option value="pending">${t('Pendiente','Pending')}</option><option value="confirmed">${t('Confirmado','Confirmed')}</option><option value="covering">${t('En cobertura','In coverage')}</option><option value="completed">${t('Finalizado','Completed')}</option><option value="cancelled">${t('Cancelado','Cancelled')}</option></select></div>
          <div class="field"><label>${t('Notas internas','Internal notes')}</label><textarea id="cal-notes"></textarea></div>
        </div><br>
        <div class="row-actions"><button class="btn primary" id="cal-save">${t('Guardar evento','Save event')}</button><button class="btn" id="cal-clear">${t('Limpiar','Clear')}</button></div>
        <p class="row-meta" id="cal-status-msg" style="margin-top:12px"></p>
        <div class="divider-line"></div><div class="status-legend" style="grid-template-columns:repeat(5,1fr);margin-bottom:14px">
          <div class="status-legend-card"><strong><span class="dot yellow"></span>${t('Pendiente','Pending')}</strong><p>${t('Evento creado, pendiente de confirmar o preparar.','Created, pending confirmation or preparation.')}</p></div>
          <div class="status-legend-card"><strong><span class="dot green"></span>${t('Confirmado','Confirmed')}</strong><p>${t('Evento confirmado y listo para cubrir.','Confirmed and ready to cover.')}</p></div>
          <div class="status-legend-card"><strong><span class="dot blue"></span>${t('En cobertura','In coverage')}</strong><p>${t('Trabajo activo: evento en curso o fotos en proceso.','Active work: event in progress or photos being processed.')}</p></div>
          <div class="status-legend-card"><strong><span class="dot green"></span>${t('Finalizado','Completed')}</strong><p>${t('Cobertura terminada y entregada.','Coverage completed and delivered.')}</p></div>
          <div class="status-legend-card"><strong><span class="dot red"></span>${t('Cancelado','Cancelled')}</strong><p>${t('Evento cancelado o descartado.','Cancelled or discarded event.')}</p></div>
        </div>
        <h3>${t('Próximos eventos','Upcoming events')}</h3>
        <div class="list" id="calendar-events-list" style="margin-top:12px"></div>
      </div>`;
    const upcoming=$('#calendar-events-list');
    const sorted=[...events].sort((a,b)=>(a.event_date+a.event_time||'').localeCompare(b.event_date+b.event_time||''));
    upcoming.innerHTML=sorted.slice(0,8).map(ev=>`<div class="list-row" style="grid-template-columns:1fr auto"><div><div class="row-title">${esc(ev.title)}</div><div class="row-meta">${simpleDate(ev.event_date)} ${ev.event_time?ev.event_time.slice(0,5):''} · ${esc(ev.location||'')} · ${esc(ev.assigned_photographer||'')}</div></div><div class="row-actions"><span class="pill"><span class="dot ${statusDot(ev.status)}"></span>${esc(statusText(ev.status))}</span><button class="btn" data-edit-event="${esc(ev.id)}">${t('Editar','Edit')}</button><button class="btn danger" data-delete-event="${esc(ev.id)}">${t('Borrar','Delete')}</button></div></div>`).join('') || `<div class="row-meta">${t('No hay eventos todavía.','No events yet.')}</div>`;
    $('#cal-prev')?.addEventListener('click',()=>{calendarMonth.setMonth(calendarMonth.getMonth()-1);renderCalendar(cachedEvents);});
    $('#cal-next')?.addEventListener('click',()=>{calendarMonth.setMonth(calendarMonth.getMonth()+1);renderCalendar(cachedEvents);});
    $('#cal-save')?.addEventListener('click',saveCalendarEvent);
    $('#cal-clear')?.addEventListener('click',clearCalendarForm);
    $$('[data-edit-event]',wrap).forEach(btn=>btn.addEventListener('click',()=>fillCalendarForm(btn.dataset.editEvent)));
    $$('[data-delete-event]',wrap).forEach(btn=>btn.addEventListener('click',async()=>{ if(!confirm(t('Enviar evento a la papelera?','Move event to trash?'))) return; const sb=getSb(); if(!sb) return; await sb.from('calendar_events').update({deleted_at:new Date().toISOString()}).eq('id',btn.dataset.deleteEvent); await loadCalendar(); }));
  }

  function clearCalendarForm(){ ['#cal-event-id','#cal-title','#cal-date','#cal-time','#cal-location','#cal-notes'].forEach(s=>{const el=$(s); if(el) el.value='';}); const ph=$('#cal-photographer'); if(ph) ph.value='Ibai Tudanca'; const st=$('#cal-status'); if(st) st.value='pending'; }
  function fillCalendarForm(id){ const ev=cachedEvents.find(e=>e.id===id); if(!ev) return; $('#cal-event-id').value=ev.id; $('#cal-title').value=ev.title||''; $('#cal-date').value=ev.event_date||''; $('#cal-time').value=ev.event_time?ev.event_time.slice(0,5):''; $('#cal-location').value=ev.location||''; $('#cal-photographer').value=ev.assigned_photographer||'Ibai Tudanca'; $('#cal-status').value=ev.status||'pending'; $('#cal-notes').value=ev.notes||''; $('#cal-title').scrollIntoView({behavior:'smooth',block:'center'}); }
  async function loadCalendar(){ const sb=getSb(); if(!sb) return; const {data,error}=await sb.from('calendar_events').select('*').is('deleted_at',null).order('event_date',{ascending:true}); if(error){console.warn(error); return;} cachedEvents=data||[]; renderCalendar(cachedEvents); }
  async function saveCalendarEvent(){
    const sb=getSb(); if(!sb)return; const title=$('#cal-title')?.value.trim(); const date=$('#cal-date')?.value;
    if(!title||!date){$('#cal-status-msg').textContent=t('Añade título y fecha.','Add title and date.');return;}
    const payload={title,event_date:date,event_time:$('#cal-time')?.value||null,location:$('#cal-location')?.value.trim()||null,assigned_photographer:$('#cal-photographer')?.value.trim()||'Ibai Tudanca',status:$('#cal-status')?.value||'pending',notes:$('#cal-notes')?.value.trim()||null};
    const id=$('#cal-event-id')?.value;
    const res=id? await sb.from('calendar_events').update(payload).eq('id',id) : await sb.from('calendar_events').insert(payload);
    if(res.error){$('#cal-status-msg').textContent=res.error.message;return;}
    $('#cal-status-msg').textContent=t('Evento guardado correctamente.','Event saved correctly.'); clearCalendarForm(); await loadCalendar();
  }

  const defaultSettings={
    download_sizes:'6000x4000, 3000x2000, 1600x1067',
    contact_email:'ibaituda1999@gmail.com',
    license_en:'Images are licensed only to the assigned client account. Third-party commercial use requires written permission.',
    license_es:'Las imágenes están licenciadas únicamente para la cuenta de cliente asignada. El uso comercial por terceros requiere autorización escrita.'
  };
  function renderSettingsForm(values={}){
    const section=$('#settings'); if(!section) return;
    let card=section.querySelector('.card.pad'); if(!card){card=document.createElement('div');card.className='card pad';section.appendChild(card);}
    const v={...defaultSettings,...values};
    card.innerHTML=`<div class="form-grid"><div class="field"><label>${t('Tamaños por defecto','Default sizes')}</label><input id="set-download-sizes" value="${esc(v.download_sizes)}"></div><div class="field"><label>${t('Email de contacto','Contact email')}</label><input id="set-contact-email" value="${esc(v.contact_email)}"></div><div class="field full"><label>Default license EN</label><textarea id="set-license-en">${esc(v.license_en)}</textarea></div><div class="field full"><label>Licencia por defecto ES</label><textarea id="set-license-es">${esc(v.license_es)}</textarea></div></div><br><button class="btn primary" id="settings-save">${t('Guardar ajustes','Save settings')}</button><p class="row-meta" id="settings-status" style="margin-top:12px"></p>`;
    $('#settings-save')?.addEventListener('click',saveSettings);
  }
  async function loadSettings(){ const sb=getSb(); if(!sb){renderSettingsForm();return;} const {data,error}=await sb.from('app_settings').select('key,value'); if(error){console.warn(error); renderSettingsForm(); return;} const values={}; (data||[]).forEach(r=>{values[r.key]=r.value}); renderSettingsForm(values); }
  async function saveSettings(){ const sb=getSb(); if(!sb)return; const rows=[
    {key:'download_sizes',value:$('#set-download-sizes')?.value.trim()||defaultSettings.download_sizes},
    {key:'contact_email',value:$('#set-contact-email')?.value.trim()||defaultSettings.contact_email},
    {key:'license_en',value:$('#set-license-en')?.value.trim()||defaultSettings.license_en},
    {key:'license_es',value:$('#set-license-es')?.value.trim()||defaultSettings.license_es}
  ]; const {error}=await sb.from('app_settings').upsert(rows,{onConflict:'key'}); $('#settings-status').textContent=error?error.message:t('Ajustes guardados.','Settings saved.'); }

  function refreshOnSection(section){ if(section==='downloads') setTimeout(loadDownloads,120); if(section==='calendar') setTimeout(loadCalendar,120); if(section==='settings') setTimeout(loadSettings,120); }
  document.addEventListener('click',e=>{ const btn=e.target.closest('[data-section],[data-section-link]'); if(btn) refreshOnSection(btn.dataset.section||btn.dataset.sectionLink); });
  document.addEventListener('DOMContentLoaded',()=>{ loadDownloads(); loadCalendar(); loadSettings(); });
})();
