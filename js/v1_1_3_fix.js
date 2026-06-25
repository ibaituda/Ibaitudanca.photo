
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function sb(){return window.supabase&&window.IBAI_SUPABASE_URL&&window.IBAI_SUPABASE_ANON_KEY?window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY):null;}
  function lang(){return document.body?.getAttribute('data-lang')||localStorage.getItem('ibaiLang')||'es'}
  function t(es,en){return lang()==='es'?es:en}
  function now(){return new Date().toISOString()}
  function ensureNoSearch(){ $$('.ibai-global-search,.admin-search,#ibai-global-search-input,#ibai-search-results').forEach(e=>e.remove()); }
  function ensureTrash(){
    const sidebar=$('.sidebar');
    if(sidebar && !$('.side-btn[data-section="trash"]')){
      const settings=$('.side-btn[data-section="settings"]');
      const btn=document.createElement('button'); btn.className='side-btn'; btn.dataset.section='trash'; btn.innerHTML='<span data-en>Trash</span><span data-es>Papelera</span><span class="side-dot"></span>';
      settings?settings.insertAdjacentElement('beforebegin',btn):sidebar.appendChild(btn);
      btn.addEventListener('click',()=>showSectionSafe('trash'));
    }
    const main=$('.main');
    if(main && !$('#trash')){
      const sec=document.createElement('section'); sec.className='section'; sec.id='trash';
      sec.innerHTML=`<div class="hero" style="--hero-img:url('img/work_R.jpg')"><div class="hero-inner"><div><div class="eyebrow"><span data-en>Trash</span><span data-es>Papelera</span></div><h1><span data-en>Recovery <em>area</em></span><span data-es>Zona de <em>recuperación</em></span></h1><p><span data-en>Restore deleted items or remove them permanently from Supabase.</span><span data-es>Restaura elementos borrados o elimínalos definitivamente de Supabase.</span></p></div></div></div><div class="card pad"><h2>Papelera</h2><p class="row-meta">${t('Al borrar definitivamente se elimina de Supabase y deja de ocupar espacio en base de datos.','Permanent delete removes the item from Supabase.')}</p><br><div id="trash-list" class="trash-grid"><div class="empty-state">${t('Cargando papelera real...','Loading trash...')}</div></div></div>`;
      const settings=$('#settings'); settings?settings.insertAdjacentElement('beforebegin',sec):main.appendChild(sec);
    }
  }
  function showSectionSafe(id){
    $$('.section').forEach(s=>s.classList.toggle('active',s.id===id));
    $$('.side-btn').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
    if(id==='trash') setTimeout(loadTrash,50);
    if(id==='calendar') setTimeout(addCalendarLegend,300);
    window.scrollTo({top:0,behavior:'smooth'});
  }
  async function loadTrash(){
    const list=$('#trash-list'); if(!list) return;
    const client=sb(); if(!client){list.innerHTML='<div class="empty-state">Supabase no configurado.</div>';return;}
    const tables=['clients','galleries','photos','calendar_events','app_tasks'];
    const items=[];
    for(const table of tables){
      try{const {data,error}=await client.from(table).select('*').not('deleted_at','is',null).order('deleted_at',{ascending:false}).limit(50); if(!error && data) data.forEach(row=>items.push({table,row}));}catch(e){}
    }
    if(!items.length){list.innerHTML=`<div class="empty-state">${t('La papelera está vacía.','Trash is empty.')}</div>`;return;}
    list.innerHTML=items.map(({table,row})=>`<div class="trash-row" data-trash-table="${esc(table)}" data-trash-id="${esc(row.id)}"><div><div class="row-title">${esc(row.name||row.title_es||row.title||row.filename||row.username||'Elemento')}</div><div class="row-meta">${esc(table)} · ${esc(row.deleted_at||'')}</div></div><div class="row-actions"><button class="btn primary" data-restore-trash>${t('Restaurar','Restore')}</button><button class="btn danger" data-delete-forever>${t('Borrar definitivamente','Delete forever')}</button></div></div>`).join('');
  }
  async function restore(table,id){const client=sb(); if(!client) return; await client.from(table).update({deleted_at:null,updated_at:now()}).eq('id',id); loadTrash(); window.IBAI_LOAD_CLIENTS?.(); window.IBAI_LOAD_GALLERIES?.();}
  async function deleteForever(table,id){const client=sb(); if(!client||!confirm(t('Borrar definitivamente de Supabase? Esta acción no se puede deshacer.','Delete forever from Supabase?'))) return; await client.from(table).delete().eq('id',id); loadTrash(); window.IBAI_LOAD_CLIENTS?.(); window.IBAI_LOAD_GALLERIES?.();}
  function addCalendarLegend(){
    const sec=$('#calendar'); if(!sec) return;
    if(sec.querySelector('#calendar-color-legend')) return;
    const card=sec.querySelector('.calendar-wrap .card.pad:last-child')||sec.querySelector('.calendar-wrap'); if(!card) return;
    const legend=document.createElement('div'); legend.id='calendar-color-legend'; legend.className='status-legend'; legend.style.marginTop='14px';
    legend.innerHTML=`<div class="status-legend-card"><strong><span class="dot red"></span>${t('Pendiente / Cancelado','Pending / Cancelled')}</strong><p>${t('Todavía no está confirmado o no se realizará.','Not confirmed or cancelled.')}</p></div><div class="status-legend-card"><strong><span class="dot yellow"></span>${t('Confirmado / En cobertura','Confirmed / Covering')}</strong><p>${t('Evento confirmado o en realización.','Confirmed or being covered.')}</p></div><div class="status-legend-card"><strong><span class="dot green"></span>${t('Finalizado','Completed')}</strong><p>${t('Cobertura terminada.','Coverage finished.')}</p></div>`;
    card.appendChild(legend);
  }
  function cleanupDecorative(){
    ensureNoSearch();
    // Remove useless client checklist panels outside overview.
    $$('.compact-panel').forEach(panel=>{ const txt=(panel.textContent||'').toLowerCase(); if(txt.includes('client publication checklist')||txt.includes('checklist de publicación del cliente')) panel.remove(); });
    // Remove any inactive/empty checklist inside create gallery.
    const create=$('#gallery-create'); if(create){ $$('.compact-panel',create).forEach(p=>{if((p.textContent||'').toLowerCase().includes('checklist')) p.remove();}); }
    // Remove old three-size labels in admin upload area.
    $$('.quality-row,.quality').forEach(el=>el.remove());
    const uploadBox=$('#upload-gallery .upload-box strong'); if(uploadBox) uploadBox.textContent=t('Archivo optimizado de entrega','Optimized delivery file');
  }
  function wire(){
    document.addEventListener('click',e=>{
      const sec=e.target.closest('[data-section],[data-section-link]'); if(sec){ const id=sec.dataset.section||sec.dataset.sectionLink; if(id) setTimeout(()=>{ if(id==='trash') loadTrash(); if(id==='calendar') addCalendarLegend(); cleanupDecorative(); },100); }
      const r=e.target.closest('[data-restore-trash]'); if(r){const row=r.closest('[data-trash-table]'); restore(row?.dataset.trashTable,row?.dataset.trashId);}
      const d=e.target.closest('[data-delete-forever]'); if(d){const row=d.closest('[data-trash-table]'); deleteForever(row?.dataset.trashTable,row?.dataset.trashId);}
      const logout=e.target.closest('#admin-logout,.logout,[data-admin-logout]'); if(logout && location.pathname.includes('admin-panel')){e.preventDefault();localStorage.removeItem('ibaiAdminSession');sessionStorage.clear();location.href='/admin-login';}
    },true);
  }
  document.addEventListener('DOMContentLoaded',()=>{ensureTrash(); cleanupDecorative(); wire(); setTimeout(()=>{cleanupDecorative(); addCalendarLegend();},800);});
})();
