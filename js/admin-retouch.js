(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function getSb(){
    if(!window.supabase || !window.IBAI_SUPABASE_URL || !window.IBAI_SUPABASE_ANON_KEY) return null;
    return window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);
  }

  function lang(){return document.body?.getAttribute('data-lang') || localStorage.getItem('ibaiLang') || 'es'}
  function t(es,en){return lang()==='es'?es:en}
  function statusText(status){
    if(status==='done') return t('Completado','Done');
    if(status==='in_progress') return t('En proceso','In progress');
    return t('Nuevo','New');
  }
  function statusClass(status){return status==='done'?'green':status==='in_progress'?'yellow':'red'}

  async function fetchByIds(sb, table, ids, columns='*'){
    const unique=[...new Set((ids||[]).filter(Boolean))];
    if(!unique.length) return new Map();
    const {data,error}=await sb.from(table).select(columns).in('id',unique);
    if(error){console.warn(table,error); return new Map();}
    return new Map((data||[]).map(row=>[row.id,row]));
  }

  async function loadRetouchRequests(){
    const section=$('#requests');
    if(!section) return;
    const list=section.querySelector('.list');
    if(!list) return;
    const sb=getSb();
    if(!sb){list.innerHTML='<div class="list-row"><div><div class="row-title">Supabase not configured</div></div></div>'; return;}

    list.innerHTML=`<div class="list-row"><div><div class="row-title">${t('Cargando solicitudes de retoque...','Loading edit requests...')}</div></div></div>`;
    const {data:reqs,error}=await sb.from('retouch_requests').select('*').order('created_at',{ascending:false});
    if(error){list.innerHTML=`<div class="list-row"><div><div class="row-title">${t('No se pudieron cargar las solicitudes','Could not load requests')}</div><div class="row-meta">${esc(error.message)}</div></div></div>`;return;}
    if(!reqs || !reqs.length){list.innerHTML=`<div class="list-row"><div><div class="row-title">${t('No hay retoques pendientes','No edit requests yet')}</div><div class="row-meta">${t('Cuando un cliente solicite un retoque desde una galería, aparecerá aquí.','When a client requests an edit from a gallery, it will appear here.')}</div></div></div>`;return;}
    reqs.sort((a,b)=>{
      const rank=(r)=>r.status==='done'||r.status==='completed'?2:r.status==='in_progress'?1:0;
      return rank(a)-rank(b) || String(b.created_at||'').localeCompare(String(a.created_at||''));
    });

    const clients=await fetchByIds(sb,'clients',reqs.map(r=>r.client_id),'id,name,username,profile_image_url');
    const galleries=await fetchByIds(sb,'galleries',reqs.map(r=>r.gallery_id),'id,title_es,title_en,event_name');
    const photos=await fetchByIds(sb,'photos',reqs.map(r=>r.photo_id),'id,filename,preview_url,large_url,original_url');

    list.innerHTML=reqs.map(r=>{
      const c=clients.get(r.client_id)||{};
      const g=galleries.get(r.gallery_id)||{};
      const p=photos.get(r.photo_id)||{};
      const img=p.preview_url||p.large_url||p.original_url||c.profile_image_url||'img/work_A.jpg';
      const title=`${p.filename||'Photo'} · ${c.name||c.username||'Client'}`;
      const galleryTitle=g.title_es||g.title_en||g.event_name||'Private gallery';
      return `<div class="list-row" data-retouch-id="${esc(r.id)}">
        <img class="thumb" src="${esc(img)}" alt="">
        <div>
          <div class="row-title">${esc(title)}</div>
          <div class="row-meta">${esc(galleryTitle)} · ${esc(r.message||'')} · ${new Date(r.created_at).toLocaleDateString(lang()==='es'?'es-ES':'en-GB')}</div>
        </div>
        <div class="row-actions">
          <span class="pill"><span class="dot ${statusClass(r.status)}"></span>${statusText(r.status)}</span>
          <button class="btn" data-status="in_progress" data-retouch="${esc(r.id)}">${t('En proceso','In progress')}</button>
          <button class="btn primary" data-status="done" data-retouch="${esc(r.id)}">${t('Completar','Complete')}</button>
        </div>
      </div>`;
    }).join('');
  }

  async function updateRetouchStatus(id,status){
    const sb=getSb(); if(!sb) return;
    const {error}=await sb.from('retouch_requests').update({status,updated_at:new Date().toISOString()}).eq('id',id);
    if(error){alert(error.message);return;}
    await loadRetouchRequests();
  }

  document.addEventListener('click',(e)=>{
    const btn=e.target.closest('[data-retouch][data-status]');
    if(btn) updateRetouchStatus(btn.dataset.retouch,btn.dataset.status);
    const sectionBtn=e.target.closest('[data-section="requests"]');
    if(sectionBtn) setTimeout(loadRetouchRequests,120);
  });

  document.addEventListener('DOMContentLoaded',()=>{
    loadRetouchRequests();
  });
})();
