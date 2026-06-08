(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang=()=>document.body?.getAttribute('data-lang')||localStorage.getItem('ibaiLang')||'es';
  const t=(es,en)=>lang()==='es'?es:en;
  const sb=()=>window.supabase&&window.IBAI_SUPABASE_URL&&window.IBAI_SUPABASE_ANON_KEY?window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY):null;
  function fmtDate(v){try{return new Date(v).toLocaleString(lang()==='es'?'es-ES':'en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}catch{return v||''}}
  function dateOnly(v){try{return new Date(v+'T12:00:00').toLocaleDateString(lang()==='es'?'es-ES':'en-GB',{day:'2-digit',month:'short',year:'numeric'})}catch{return v||''}}
  function setStat(i,value){const el=$$('.stat-row .stat strong')[i]; if(el) el.textContent=value;}
  function statusLabel(s){
    const map={draft:t('Borrador','Draft'),published:t('Publicado','Published'),ready:t('Lista','Ready'),in_progress:t('En proceso','In progress'),created:t('Creada','Created'),archived:t('Archivada','Archived'),new:t('Nueva','New'),done:t('Completada','Done'),completed:t('Finalizado','Completed'),confirmed:t('Confirmado','Confirmed'),pending:t('Pendiente','Pending')};
    return map[s]||s||'';
  }
  async function tableCount(client,table,filter){
    let q=client.from(table).select('id',{count:'exact',head:true});
    if(filter) q=filter(q);
    const {count,error}=await q; if(error){console.warn(table,error);return 0;} return count||0;
  }
  async function loadOverview(){
    const client=sb(); if(!client) return;
    const [clients,galleries,pending,requests]=await Promise.all([
      tableCount(client,'clients',q=>q.eq('active',true)),
      tableCount(client,'galleries'),
      tableCount(client,'galleries',q=>q.neq('status','ready')),
      tableCount(client,'retouch_requests',q=>q.in('status',['new','in_progress']))
    ]);
    setStat(0,clients); setStat(1,galleries); setStat(2,pending); setStat(3,requests);
    await Promise.all([renderLatest(client),renderActivity(client),renderPublicationChecklist(client)]);
  }
  async function renderLatest(client){
    const {data:lastClient}=await client.from('clients').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle();
    const {data:lastGallery}=await client.from('galleries').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle();
    const {data:nextEvent}=await client.from('calendar_events').select('*').gte('event_date',new Date().toISOString().slice(0,10)).order('event_date',{ascending:true}).order('event_time',{ascending:true}).limit(1).maybeSingle();
    const cards=$$('.overview-grid .photo-card');
    if(cards[0]&&lastGallery){
      cards[0].style.setProperty('--img',`url('${lastGallery.cover_image_url||'img/work_A.jpg'}')`);
      const h=cards[0].querySelector('h3'); if(h) h.textContent=lastGallery.title_es||lastGallery.title_en||t('Galería sin título','Untitled gallery');
      const p=cards[0].querySelector('p'); if(p) p.innerHTML=`<span class="pill"><span class="dot ${lastGallery.publish_status==='published'?'green':'yellow'}"></span>${statusLabel(lastGallery.publish_status)} · ${statusLabel(lastGallery.status)}</span>`;
    }
    if(cards[1]&&lastClient){
      cards[1].style.setProperty('--img',`url('${lastClient.profile_image_url||lastClient.hero_image_url||'img/IMG_IBAI.jpg'}')`);
      const h=cards[1].querySelector('h3'); if(h) h.textContent=lastClient.name||lastClient.username;
      const p=cards[1].querySelector('p'); if(p) p.textContent=`${lastClient.client_type||'client'} · ${lastClient.club||lastClient.agency_type||lastClient.personal_relation||lastClient.username}`;
    }
    const nextCard=$$('.overview-grid .card.pad')[0];
    if(nextCard&&nextEvent){
      const p=nextCard.querySelector('p'); if(p) p.innerHTML=`<strong>${esc(nextEvent.location||nextEvent.title)} · ${esc((nextEvent.event_time||'').slice(0,5)||'')}</strong><br>${esc(nextEvent.assigned_photographer||'Ibai Tudanca')} · ${statusLabel(nextEvent.status)} · ${dateOnly(nextEvent.event_date)}`;
    }
  }
  async function renderActivity(client){
    const box=$('.activity-card'); if(!box) return;
    const [downloads,retouches,galleries]=await Promise.all([
      client.from('download_logs').select('*, clients(name,username,profile_image_url), galleries(title_es,title_en,cover_image_url)').order('created_at',{ascending:false}).limit(2),
      client.from('retouch_requests').select('*, clients(name,username,profile_image_url), galleries(title_es,title_en,cover_image_url)').order('created_at',{ascending:false}).limit(2),
      client.from('galleries').select('*').order('created_at',{ascending:false}).limit(2)
    ]);
    const rows=[];
    (downloads.data||[]).forEach(d=>rows.push({img:d.clients?.profile_image_url||d.galleries?.cover_image_url||'img/work_A.jpg',title:d.clients?.name||d.clients?.username||t('Cliente','Client'),text:t(`Descargó ${d.photos_count||1} foto(s)`,`Downloaded ${d.photos_count||1} photo(s)`)}));
    (retouches.data||[]).forEach(r=>rows.push({img:r.clients?.profile_image_url||r.galleries?.cover_image_url||'img/work_D.jpg',title:r.clients?.name||r.clients?.username||t('Cliente','Client'),text:t('Nueva solicitud de retoque','New retouch request')}));
    (galleries.data||[]).forEach(g=>rows.push({img:g.cover_image_url||'img/work_A.jpg',title:g.title_es||g.title_en||t('Galería','Gallery'),text:`${statusLabel(g.publish_status)} · ${statusLabel(g.status)}`}));
    box.innerHTML=`<h4>${t('Actividad útil','Useful activity')}</h4>${rows.slice(0,4).map(r=>`<div class="activity-row"><img src="${esc(r.img)}"><div><strong>${esc(r.title)}</strong><span>${esc(r.text)}</span></div></div>`).join('')||`<p>${t('Todavía no hay actividad.','No activity yet.')}</p>`}`;
  }
  async function renderPublicationChecklist(client){
    const panel=$('.compact-panel'); if(!panel) return;
    const {data:g}=await client.from('galleries').select('*, gallery_clients(client_id)').order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(!g) return;
    const {count:photos}=await client.from('photos').select('id',{count:'exact',head:true}).eq('gallery_id',g.id).eq('hidden',false);
    const checks=[
      {ok:(g.gallery_clients||[]).length>0, label:t('Cliente asignado','Client assigned')},
      {ok:!!g.cover_image_url, label:t('Portada subida','Cover uploaded')},
      {ok:(photos||0)>0, label:t(`${photos||0} fotos subidas`,`${photos||0} photos uploaded`)},
      {ok:!!(g.personal_note_es||g.personal_note_en), label:t('Nota personalizada escrita','Personal note written')},
      {ok:g.publish_status==='published', label:t('Publicado para cliente','Published for client')}
    ];
    panel.innerHTML=`<h4>${t('Checklist de publicación','Publication checklist')}</h4><ul>${checks.map(c=>`<li><span class="check-dot ${c.ok?'':'warn'}"></span>${esc(c.label)}</li>`).join('')}</ul>`;
  }
  function enhancePublishButtons(){
    document.addEventListener('click',async(e)=>{
      const btn=e.target.closest('[data-publish-client],[data-unpublish-client],[data-publish-gallery],[data-unpublish-gallery]');
      if(!btn) return; const client=sb(); if(!client) return;
      const table=btn.dataset.publishClient||btn.dataset.unpublishClient?'clients':'galleries';
      const id=btn.dataset.publishClient||btn.dataset.unpublishClient||btn.dataset.publishGallery||btn.dataset.unpublishGallery;
      const publish=!!(btn.dataset.publishClient||btn.dataset.publishGallery);
      btn.disabled=true; const old=btn.textContent; btn.textContent=publish?t('Publicando...','Publishing...'):t('Ocultando...','Unpublishing...');
      const {error}=await client.from(table).update({publish_status:publish?'published':'draft',updated_at:new Date().toISOString()}).eq('id',id);
      btn.disabled=false; btn.textContent=old;
      if(error) alert(error.message); else { await loadOverview(); if(window.loadClientsFromSupabase) window.loadClientsFromSupabase(); if(window.loadGalleriesFromSupabase) window.loadGalleriesFromSupabase(); }
    });
  }
  function ensureButtonsInRows(){
    // Adds unobtrusive publish buttons to rendered client/gallery rows when possible.
    setInterval(()=>{
      $$('#clients-list-render .list-row').forEach(row=>{
        if(row.dataset.govEnhanced) return; row.dataset.govEnhanced='1';
        const text=row.innerText; const id=(row.querySelector('[data-client-id]')||row.querySelector('[data-edit-client]'))?.dataset.clientId;
        if(!id) return;
        const actions=row.querySelector('.row-actions'); if(actions){actions.insertAdjacentHTML('beforeend',`<button class="btn" data-publish-client="${esc(id)}">${t('Publicar','Publish')}</button><button class="btn" data-unpublish-client="${esc(id)}">${t('Borrador','Draft')}</button>`)};
      });
      $$('#galleries-list-render .list-row').forEach(row=>{
        if(row.dataset.govEnhanced) return; row.dataset.govEnhanced='1';
        const id=(row.querySelector('[data-gallery-id]')||row.querySelector('[data-edit-gallery]'))?.dataset.galleryId;
        if(!id) return;
        const actions=row.querySelector('.row-actions'); if(actions){actions.insertAdjacentHTML('beforeend',`<button class="btn" data-publish-gallery="${esc(id)}">${t('Publicar','Publish')}</button><button class="btn" data-unpublish-gallery="${esc(id)}">${t('Borrador','Draft')}</button>`)};
      });
    },1800);
  }
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(loadOverview,600); enhancePublishButtons(); ensureButtonsInRows(); document.addEventListener('click',e=>{if(e.target.closest('[data-section="overview"],[data-section-link="overview"]')) setTimeout(loadOverview,300);});});
})();
