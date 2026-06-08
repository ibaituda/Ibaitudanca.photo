(function(){
  const qs=new URLSearchParams(location.search);
  const galleryId=qs.get('gallery');
  const SESSION_KEY='ibaiClientSession';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let realPhotos=[]; let selected=new Set(); let favs=new Set(); let reviewed=new Set(); let current=0; let lang=localStorage.getItem('ibaiLanguage')||'es'; let activeClient=null; let activeGallery=null;

  function getClient(){if(!window.supabase||!window.IBAI_SUPABASE_URL||!window.IBAI_SUPABASE_ANON_KEY)return null; return window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);}
  function getClientSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null}}
  function statusLabel(s){return s==='ready'?(lang==='es'?'Lista':'Ready'):s==='in_progress'?(lang==='es'?'En proceso':'In progress'):(lang==='es'?'Creada':'Created');}
  function dateLabel(date){if(!date)return ''; try{return new Date(date+'T12:00:00').toLocaleDateString(lang==='es'?'es-ES':'en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return date;}}
  function photoSrc(p){return p.retouched_url||p.preview_url||p.large_url||p.original_url||'';}
  function downloadSrc(p){const size=$('#globalSize')?.value||document.querySelector('.download-option.active')?.dataset.size||'original'; return size==='preview'?(p.retouched_url||p.preview_url||p.large_url||p.original_url):size==='large'?(p.retouched_url||p.large_url||p.original_url||p.preview_url):(p.retouched_url||p.original_url||p.large_url||p.preview_url);}
  function photoDbId(index){return realPhotos[index]?.db_id;}
  async function logDownload(kind, index=null, count=1){
    const sb=getClient(); if(!sb||!activeClient?.id||!galleryId) return;
    const photoId=index!==null?photoDbId(index):null;
    const size=$('#globalSize')?.value||document.querySelector('.download-option.active')?.dataset.size||'original';
    await sb.from('download_logs').insert({client_id:activeClient.id,gallery_id:galleryId,photo_id:photoId,download_type:kind,size_label:size,photos_count:count});
  }

  async function loadSavedState(sb){
    if(!activeClient?.id || !realPhotos.length) return;
    const ids=realPhotos.map(p=>p.db_id).filter(Boolean);
    if(!ids.length) return;
    const [{data:favRows,error:favErr},{data:selRows,error:selErr}]=await Promise.all([
      sb.from('favourites').select('photo_id').eq('client_id',activeClient.id).in('photo_id',ids),
      sb.from('selections').select('photo_id').eq('client_id',activeClient.id).in('photo_id',ids)
    ]);
    if(favErr) console.warn('favourites load error',favErr);
    if(selErr) console.warn('selections load error',selErr);
    const favIds=new Set((favRows||[]).map(r=>r.photo_id));
    const selIds=new Set((selRows||[]).map(r=>r.photo_id));
    favs=new Set(); selected=new Set();
    realPhotos.forEach((p,i)=>{ if(favIds.has(p.db_id)) favs.add(i); if(selIds.has(p.db_id)) selected.add(i); });
  }

  async function persistToggle(table,index,set){
    const sb=getClient(); const photoId=photoDbId(index);
    if(!sb || !activeClient?.id || !photoId) return;
    if(set.has(index)){
      const {error}=await sb.from(table).upsert({client_id:activeClient.id, photo_id:photoId},{onConflict:'client_id,photo_id'});
      if(error) console.warn(table+' insert error',error);
    }else{
      const {error}=await sb.from(table).delete().eq('client_id',activeClient.id).eq('photo_id',photoId);
      if(error) console.warn(table+' delete error',error);
    }
  }

  async function load(){
    if(!galleryId) return;
    const sb=getClient(); if(!sb) return;
    activeClient=getClientSession();

    const {data:g,error}=await sb.from('galleries').select('*').eq('id',galleryId).maybeSingle();
    if(error||!g){console.warn('Gallery load error',error);return;}
    activeGallery=g;

    // If a client is logged in, check that this gallery belongs to that client.
    if(activeClient?.id){
      const {data:link,error:linkErr}=await sb.from('gallery_clients').select('id').eq('gallery_id',galleryId).eq('client_id',activeClient.id).maybeSingle();
      if(linkErr) console.warn('gallery client check',linkErr);
      if(!link){
        document.body.innerHTML='<main style="min-height:100vh;background:#080808;color:#fff;display:grid;place-items:center;font-family:Inter,sans-serif;padding:40px;text-align:center"><div><h1>Gallery not available</h1><p>This gallery is not assigned to your client account.</p><p><a href="clientes.html" style="color:#fff;text-decoration:underline">Return to client access</a></p></div></main>';
        return;
      }
    }

    const {data:photos,error:perr}=await sb.from('photos').select('*').eq('gallery_id',galleryId).eq('hidden',false).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
    if(perr) console.warn(perr);
    realPhotos=(photos||[]).map((p,i)=>({
      ...p,
      db_id:p.id,
      display_id:p.filename||`IT-${String(i+1).padStart(3,'0')}`,
      src:photoSrc(p),
      file:p.filename||`photo-${i+1}.jpg`,
      event:g.event_name||g.title_es||g.title_en||'Private gallery',
      date:g.event_date,
      location:g.location||'',
      city:g.city||'',
      gallery:g.title_es||g.title_en||'',
      photographer:'Ibai Tudanca',
      usage:'Client licensed use',
      res:p.orientation==='vertical'?'Vertical file':'Horizontal file'
    })).filter(p=>p.src);

    await loadSavedState(sb);
    updateHeader(g);
    renderRealGallery();
  }

  function updateHeader(g){
    const title=g.title_es||g.title_en||'Private gallery';
    const hero=$('.hero'); if(hero){const img=g.cover_image_url||'img/work_A.jpg'; hero.style.setProperty('--gallery-image',`url('${img}')`); hero.style.backgroundImage=`linear-gradient(90deg,rgba(8,8,8,.86),rgba(8,8,8,.36)),url('${img}')`;}
    const h=$('.hero h1'); if(h) h.innerHTML=esc(title).replace(' vs ',' vs<br><em>')+(title.includes(' vs ')?'.</em>':'');
    const p=$('.hero p'); if(p) p.textContent=(lang==='es'?g.personal_note_es:g.personal_note_en)||g.personal_note_es||g.personal_note_en||p.textContent;
    const chips=$$('.hero .tag, .hero .status-pill');
    chips.forEach(ch=>{ if(ch.textContent.match(/Ready|Lista|Created|Creada|In progress|En proceso/)) ch.innerHTML=statusLabel(g.status); });
    const summary=$$('.summary-row');
    if(summary[0]&&summary[0].querySelector('strong')) summary[0].querySelector('strong').textContent=statusLabel(g.status);
    if(summary[1]&&summary[1].querySelector('strong')) summary[1].querySelector('strong').textContent=`${realPhotos.length} ${lang==='es'?'fotos':'photos'}`;
    const panelTitle=$('.panel-title p'); if(panelTitle) panelTitle.textContent=title;
  }

  function renderRealGallery(){
    const gallery=$('#gallery'); if(!gallery) return;
    if(!realPhotos.length){gallery.innerHTML=`<div class="photo-card" style="padding:24px;color:#aaa">${lang==='es'?'Esta galería todavía no tiene fotos subidas.':'This gallery has no uploaded photos yet.'}</div>`; updateCounts(); return;}
    gallery.innerHTML='';
    realPhotos.forEach((p,i)=>{
      const card=document.createElement('article'); card.className='photo-card'; card.dataset.index=i; card.dataset.orientation=p.orientation||'horizontal';
      card.innerHTML=`<span class="photo-id">${esc(p.display_id)}</span><img src="${esc(p.src)}" alt="${esc(p.display_id)}"><div class="photo-tools"><button class="icon-btn fav" aria-label="Favourite">♡</button><div class="tool-group"><button class="icon-btn sel" aria-label="Select">✓</button><button class="icon-btn dl" aria-label="Download">↓</button><button class="icon-btn open" aria-label="Open">↗</button></div></div><span class="fav-mark">♥</span><span class="selected-mark">✓</span><span class="reviewed-mark"></span>`;
      gallery.appendChild(card);
    });
    applyFilter(); updateCounts();
  }

  function updateCounts(){
    const setText=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
    setText('selectedCount',selected.size); setText('favCount',favs.size); setText('favPill',favs.size); setText('floatingCount',selected.size); setText('reviewedCount',reviewed.size); setText('totalCount',realPhotos.length);
    const pct=realPhotos.length?Math.round((reviewed.size/realPhotos.length)*100):0; const fill=$('#progressFill'); if(fill) fill.style.width=pct+'%'; setText('progressText',pct+'%');
    $('#selectionBar')?.classList.toggle('visible',selected.size>0); if($('#downloadSelectedTop')) $('#downloadSelectedTop').disabled=selected.size===0; if($('#downloadFavTop')) $('#downloadFavTop').disabled=favs.size===0;
  }

  function applyFilter(){
    const filter=document.querySelector('.filter.is-active')?.dataset.filter||'all';
    $$('.photo-card').forEach(card=>{
      const i=+card.dataset.index; let show=true;
      if(filter==='favourites') show=favs.has(i); if(filter==='selected') show=selected.has(i); if(filter==='horizontal') show=card.dataset.orientation==='horizontal'; if(filter==='vertical') show=card.dataset.orientation==='vertical'; if(filter==='unreviewed') show=!reviewed.has(i);
      card.style.display=show?'':'none'; card.classList.toggle('is-fav',favs.has(i)); card.classList.toggle('is-selected',selected.has(i)); card.classList.toggle('is-reviewed',reviewed.has(i));
      const fav=card.querySelector('.fav'); if(fav) fav.textContent=favs.has(i)?'♥':'♡';
    });
  }

  function openLightbox(i){
    current=i; reviewed.add(i); const p=realPhotos[i]; if(!p) return;
    $('#lightImg').src=p.src; $('#lightTitle').textContent=p.display_id; const ptitle=$('.panel-title p'); if(ptitle) ptitle.textContent=p.gallery;
    $('#lightFav').textContent=favs.has(i)?(lang==='es'?'Quitar favorita':'Remove favourite'):(lang==='es'?'Favorita':'Favourite'); $('#lightSel').textContent=selected.has(i)?(lang==='es'?'Quitar selección':'Remove selection'):(lang==='es'?'Seleccionar':'Select');
    $('#exifList').innerHTML=`<div class="exif-row"><span>${lang==='es'?'Evento':'Event'}</span><strong>${esc(p.event)}</strong></div><div class="exif-row"><span>${lang==='es'?'Fecha':'Date'}</span><strong>${esc(dateLabel(p.date))}</strong></div><div class="exif-row"><span>${lang==='es'?'Lugar':'Location'}</span><strong>${esc(p.location)}</strong></div><div class="exif-row"><span>${lang==='es'?'Galería':'Gallery'}</span><strong>${esc(p.gallery)}</strong></div><div class="exif-row"><span>${lang==='es'?'Fotógrafo':'Photographer'}</span><strong>Ibai Tudanca</strong></div><div class="exif-row"><span>${lang==='es'?'Archivo':'File'}</span><strong>${esc(p.file)}</strong></div>`;
    $('#lightbox').classList.add('open'); $('#lightbox').setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; updateCounts(); applyFilter();
  }
  function closeLightbox(){ $('#lightbox').classList.remove('open'); $('#lightbox').setAttribute('aria-hidden','true'); document.body.style.overflow='';}
  async function downloadPhoto(i){const p=realPhotos[i]; if(!p)return; const a=document.createElement('a'); a.href=downloadSrc(p); a.download=p.file||'photo.jpg'; document.body.appendChild(a); a.click(); a.remove(); reviewed.add(i); updateCounts(); await logDownload('single',i,1);}
  async function downloadSet(set){const items=Array.from(set); for(const i of items){await downloadPhoto(i);} await logDownload('set',null,items.length);}

  document.addEventListener('DOMContentLoaded',()=>{
    if(!galleryId) return;
    document.addEventListener('click',async(e)=>{
      const card=e.target.closest('.photo-card'); if(card&&card.dataset.index){const i=+card.dataset.index; if(e.target.closest('.fav')){favs.has(i)?favs.delete(i):favs.add(i); reviewed.add(i); applyFilter(); updateCounts(); await persistToggle('favourites',i,favs); return;} if(e.target.closest('.sel')){selected.has(i)?selected.delete(i):selected.add(i); reviewed.add(i); applyFilter(); updateCounts(); await persistToggle('selections',i,selected); return;} if(e.target.closest('.dl')){downloadPhoto(i);return;} openLightbox(i);}
      if(e.target.closest('.filter')){document.querySelectorAll('.filter').forEach(b=>b.classList.remove('is-active')); e.target.closest('.filter').classList.add('is-active'); applyFilter();}
    },true);
    $('#closeLight')?.addEventListener('click',closeLightbox); $('#prevImg')?.addEventListener('click',()=>openLightbox((current-1+realPhotos.length)%realPhotos.length)); $('#nextImg')?.addEventListener('click',()=>openLightbox((current+1)%realPhotos.length));
    $('#lightFav')?.addEventListener('click',async()=>{favs.has(current)?favs.delete(current):favs.add(current); reviewed.add(current); await persistToggle('favourites',current,favs); openLightbox(current); applyFilter();});
    $('#lightSel')?.addEventListener('click',async()=>{selected.has(current)?selected.delete(current):selected.add(current); reviewed.add(current); await persistToggle('selections',current,selected); openLightbox(current); applyFilter();});
    $('#downloadCurrent')?.addEventListener('click',()=>downloadPhoto(current));
    $('#downloadSelectedTop')?.addEventListener('click',()=>downloadSet(selected)); $('#downloadFavTop')?.addEventListener('click',()=>downloadSet(favs)); $('.selection-bar .btn-primary')?.addEventListener('click',()=>downloadSet(selected));
    
    const requestBtn = $('#requestEdit');
    if (requestBtn) {
      const cleanBtn = requestBtn.cloneNode(true);
      requestBtn.parentNode.replaceChild(cleanBtn, requestBtn);
      cleanBtn.addEventListener('click', async () => {
        const sb = getClient();
        const photo = realPhotos[current];
        if (!sb || !photo?.db_id || !galleryId) {
          alert(lang === 'es' ? 'No se ha podido preparar la solicitud de retoque.' : 'Could not prepare the edit request.');
          return;
        }
        if (!activeClient?.id) {
          alert(lang === 'es' ? 'Inicia sesión como cliente para solicitar retoques.' : 'Log in as a client to request edits.');
          return;
        }
        const defaultMessage = lang === 'es' ? 'Indica aquí qué retoque necesitas para esta foto.' : 'Write here the edit you need for this photo.';
        const message = window.prompt(lang === 'es' ? 'Solicitud de retoque' : 'Edit request', defaultMessage);
        if (message === null) return;
        const cleanMessage = (message || '').trim() || (lang === 'es' ? 'Solicitud de retoque sin mensaje adicional.' : 'Edit request without additional message.');
        cleanBtn.disabled = true;
        cleanBtn.textContent = lang === 'es' ? 'Enviando...' : 'Sending...';
        const { error } = await sb.from('retouch_requests').insert({
          client_id: activeClient.id,
          gallery_id: galleryId,
          photo_id: photo.db_id,
          message: cleanMessage,
          status: 'new'
        });
        cleanBtn.disabled = false;
        cleanBtn.textContent = lang === 'es' ? 'Solicitar retoque' : 'Request edit';
        if (error) {
          console.warn('retouch request error', error);
          alert((lang === 'es' ? 'No se pudo enviar la solicitud: ' : 'Could not send request: ') + error.message);
          return;
        }
        alert(lang === 'es' ? 'Solicitud de retoque enviada al panel de administración.' : 'Edit request sent to the admin panel.');
      });
    }

    document.addEventListener('keydown',e=>{if(!$('#lightbox')?.classList.contains('open'))return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')openLightbox((current-1+realPhotos.length)%realPhotos.length);if(e.key==='ArrowRight')openLightbox((current+1)%realPhotos.length);if(e.key.toLowerCase()==='f'){$('#lightFav')?.click();}if(e.key.toLowerCase()==='s'){$('#lightSel')?.click();}});
    load();
  });
})();
