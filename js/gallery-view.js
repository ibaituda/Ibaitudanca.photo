(function(){
  const qs=new URLSearchParams(location.search);
  const galleryId=qs.get('gallery');
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let realPhotos=[]; let selected=new Set(); let favs=new Set(); let reviewed=new Set(); let current=0; let lang=localStorage.getItem('ibaiLanguage')||'es';
  function getClient(){if(!window.supabase||!window.IBAI_SUPABASE_URL||!window.IBAI_SUPABASE_ANON_KEY)return null; return window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);}
  function statusLabel(s){return s==='ready'?(lang==='es'?'Lista':'Ready'):s==='in_progress'?(lang==='es'?'En proceso':'In progress'):(lang==='es'?'Creada':'Created');}
  function dateLabel(date){if(!date)return ''; try{return new Date(date+'T12:00:00').toLocaleDateString(lang==='es'?'es-ES':'en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return date;}}
  function photoSrc(p){return p.preview_url||p.large_url||p.original_url||'';}
  function downloadSrc(p){const size=$('#globalSize')?.value||document.querySelector('.download-option.active')?.dataset.size||'original'; return size==='preview'?(p.preview_url||p.large_url||p.original_url):size==='large'?(p.large_url||p.original_url||p.preview_url):(p.original_url||p.large_url||p.preview_url);}
  async function load(){
    if(!galleryId) return;
    const sb=getClient(); if(!sb) return;
    const {data:g,error}=await sb.from('galleries').select('*').eq('id',galleryId).maybeSingle();
    if(error||!g){console.warn('Gallery load error',error);return;}
    const {data:photos,error:perr}=await sb.from('photos').select('*').eq('gallery_id',galleryId).eq('hidden',false).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
    if(perr) console.warn(perr);
    realPhotos=(photos||[]).map((p,i)=>({
      ...p, id:p.filename||`IT-${String(i+1).padStart(3,'0')}`, src:photoSrc(p), file:p.filename||`photo-${i+1}.jpg`,
      event:g.event_name||g.title_es||g.title_en||'Private gallery', date:g.event_date, location:g.location||'', city:g.city||'', gallery:g.title_es||g.title_en||'', photographer:'Ibai Tudanca', usage:'Client licensed use', res:p.orientation==='vertical'?'Vertical file':'Horizontal file'
    })).filter(p=>p.src);
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
    if(summary[0]) summary[0].querySelector('strong').textContent=statusLabel(g.status);
    if(summary[1]) summary[1].querySelector('strong').textContent=`${realPhotos.length} ${lang==='es'?'fotos':'photos'}`;
    const panelTitle=$('.panel-title p'); if(panelTitle) panelTitle.textContent=title;
  }
  function renderRealGallery(){
    const gallery=$('#gallery'); if(!gallery) return;
    if(!realPhotos.length){gallery.innerHTML=`<div class="photo-card" style="padding:24px;color:#aaa">${lang==='es'?'Esta galería todavía no tiene fotos subidas.':'This gallery has no uploaded photos yet.'}</div>`; return;}
    gallery.innerHTML='';
    realPhotos.forEach((p,i)=>{
      const card=document.createElement('article'); card.className='photo-card'; card.dataset.index=i; card.dataset.orientation=p.orientation||'horizontal';
      card.innerHTML=`<span class="photo-id">${esc(p.id)}</span><img src="${esc(p.src)}" alt="${esc(p.id)}"><div class="photo-tools"><button class="icon-btn fav" aria-label="Favourite">♡</button><div class="tool-group"><button class="icon-btn sel" aria-label="Select">✓</button><button class="icon-btn dl" aria-label="Download">↓</button><button class="icon-btn open" aria-label="Open">↗</button></div></div><span class="fav-mark">♥</span><span class="selected-mark">✓</span><span class="reviewed-mark"></span>`;
      gallery.appendChild(card);
    });
    updateCounts(); applyFilter();
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
    $('#lightImg').src=p.src; $('#lightTitle').textContent=p.id; const ptitle=$('.panel-title p'); if(ptitle) ptitle.textContent=p.gallery;
    $('#lightFav').textContent=favs.has(i)?(lang==='es'?'Quitar favorita':'Remove favourite'):(lang==='es'?'Favorita':'Favourite'); $('#lightSel').textContent=selected.has(i)?(lang==='es'?'Quitar selección':'Remove selection'):(lang==='es'?'Seleccionar':'Select');
    $('#exifList').innerHTML=`<div class="exif-row"><span>${lang==='es'?'Evento':'Event'}</span><strong>${esc(p.event)}</strong></div><div class="exif-row"><span>${lang==='es'?'Fecha':'Date'}</span><strong>${esc(dateLabel(p.date))}</strong></div><div class="exif-row"><span>${lang==='es'?'Lugar':'Location'}</span><strong>${esc(p.location)}</strong></div><div class="exif-row"><span>${lang==='es'?'Galería':'Gallery'}</span><strong>${esc(p.gallery)}</strong></div><div class="exif-row"><span>${lang==='es'?'Fotógrafo':'Photographer'}</span><strong>Ibai Tudanca</strong></div><div class="exif-row"><span>${lang==='es'?'Archivo':'File'}</span><strong>${esc(p.file)}</strong></div>`;
    $('#lightbox').classList.add('open'); $('#lightbox').setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; updateCounts();
  }
  function closeLightbox(){ $('#lightbox').classList.remove('open'); $('#lightbox').setAttribute('aria-hidden','true'); document.body.style.overflow='';}
  function downloadPhoto(i){const p=realPhotos[i]; if(!p)return; const a=document.createElement('a'); a.href=downloadSrc(p); a.download=p.file||'photo.jpg'; document.body.appendChild(a); a.click(); a.remove(); reviewed.add(i); updateCounts();}
  document.addEventListener('DOMContentLoaded',()=>{
    if(!galleryId) return;
    document.addEventListener('click',(e)=>{
      const card=e.target.closest('.photo-card'); if(card&&card.dataset.index){const i=+card.dataset.index; if(e.target.closest('.fav')){favs.has(i)?favs.delete(i):favs.add(i); applyFilter(); updateCounts(); return;} if(e.target.closest('.sel')){selected.has(i)?selected.delete(i):selected.add(i); applyFilter(); updateCounts(); return;} if(e.target.closest('.dl')){downloadPhoto(i);return;} openLightbox(i);}
      if(e.target.closest('.filter')){document.querySelectorAll('.filter').forEach(b=>b.classList.remove('is-active')); e.target.closest('.filter').classList.add('is-active'); applyFilter();}
    },true);
    $('#closeLight')?.addEventListener('click',closeLight); $('#prevImg')?.addEventListener('click',()=>openLightbox((current-1+realPhotos.length)%realPhotos.length)); $('#nextImg')?.addEventListener('click',()=>openLightbox((current+1)%realPhotos.length));
    $('#lightFav')?.addEventListener('click',()=>{favs.has(current)?favs.delete(current):favs.add(current); openLightbox(current); applyFilter();}); $('#lightSel')?.addEventListener('click',()=>{selected.has(current)?selected.delete(current):selected.add(current); openLightbox(current); applyFilter();}); $('#downloadCurrent')?.addEventListener('click',()=>downloadPhoto(current));
    $('#requestEdit')?.addEventListener('click',()=>alert(lang==='es'?'Solicitud de retoque preparada. En el siguiente paso la guardaremos en el admin panel.':'Edit request prepared. In the next step it will be saved in the admin panel.'));
    load();
  });
})();
