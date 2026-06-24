(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const STORAGE_BUCKET='portfolio-images';
  let currentPhotos=[];

  function client(){
    if(!window.supabase || !window.IBAI_SUPABASE_URL || !window.IBAI_SUPABASE_ANON_KEY) return null;
    return window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);
  }
  function setText(id,msg){const el=$(id); if(el) el.textContent=msg||'';}
  function slugify(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'gallery';}
  function ext(file){return (file?.name?.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';}
  function bestUrl(p){return p.retouched_url||p.preview_url||p.large_url||p.original_url||'';}
  function galleryId(){return $('#edit-gallery-id')?.value || $('#upload-gallery-id')?.value || null;}

  async function uploadFile(file, folder){
    const sb=client(); if(!sb||!file) return null;
    const path=`${folder}/${Date.now()}-${Math.random().toString(36).slice(2,9)}.${ext(file)}`;
    const {error}=await sb.storage.from(STORAGE_BUCKET).upload(path,file,{cacheControl:'3600',upsert:true});
    if(error) throw error;
    const {data}=sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function loadPhotos(id=galleryId()){
    const sb=client(); const box=$('#edit-gallery-photo-order');
    if(!sb || !id || !box) return [];
    box.innerHTML='<p class="row-meta">Cargando fotos de la galería...</p>';
    const {data,error}=await sb.from('photos').select('*').eq('gallery_id',id).is('deleted_at', null).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
    if(error){box.innerHTML=`<p class="row-meta">No se pudieron cargar las fotos: ${esc(error.message)}</p>`; return []}
    currentPhotos=data||[]; render(data||[]); return data||[];
  }

  function render(photos){
    const box=$('#edit-gallery-photo-order'); if(!box) return;
    if(!photos.length){box.innerHTML='<p class="row-meta">No hay fotos registradas todavía. Sube fotos desde “Subir fotos”.</p>';return;}
    box.classList.add('photo-manager-grid');
    box.innerHTML=photos.map((p,i)=>`
      <article class="photo-manager-card ${p.hidden?'is-hidden':''}" data-photo-id="${esc(p.id)}">
        <div class="pm-image-wrap"><img src="${esc(bestUrl(p))}" alt="${esc(p.filename)}"><span class="pm-index">${String(i+1).padStart(2,'0')}</span>${p.hidden?'<span class="pm-badge">Oculta</span>':''}</div>
        <div class="pm-body">
          <strong>${esc(p.filename||'Foto')}</strong>
          <span>${esc(p.orientation||'')} ${p.is_cover?'· Portada':''}</span>
          <input class="pm-caption-es" placeholder="Caption ES" value="${esc(p.caption_es||'')}">
          <input class="pm-caption-en" placeholder="Caption EN" value="${esc(p.caption_en||'')}">
          <input class="pm-replace" type="file" accept="image/*" style="display:none">
          <div class="pm-actions">
            <button class="btn" data-pm="up">↑</button><button class="btn" data-pm="down">↓</button>
            <button class="btn" data-pm="cover">Portada</button>
            <button class="btn" data-pm="hide">${p.hidden?'Mostrar':'Ocultar'}</button>
            <button class="btn" data-pm="replace">Reemplazar</button>
            <button class="btn" data-pm="save">Guardar</button>
            <button class="btn" data-pm="delete">Eliminar</button>
          </div>
        </div>
      </article>`).join('');
  }

  async function swapOrder(photo, direction){
    const sb=client(); if(!sb) return;
    const idx=currentPhotos.findIndex(p=>p.id===photo.id);
    const other=currentPhotos[idx+direction]; if(!other) return;
    const a=photo.sort_order ?? idx; const b=other.sort_order ?? (idx+direction);
    await sb.from('photos').update({sort_order:b,updated_at:new Date().toISOString()}).eq('id',photo.id);
    await sb.from('photos').update({sort_order:a,updated_at:new Date().toISOString()}).eq('id',other.id);
    await loadPhotos(photo.gallery_id);
  }

  async function setCover(photo){
    const sb=client(); if(!sb) return;
    await sb.from('photos').update({is_cover:false}).eq('gallery_id',photo.gallery_id);
    await sb.from('photos').update({is_cover:true,hidden:false,updated_at:new Date().toISOString()}).eq('id',photo.id);
    await sb.from('galleries').update({cover_image_url:bestUrl(photo),updated_at:new Date().toISOString()}).eq('id',photo.gallery_id);
    setText('#edit-gallery-status-msg','Portada actualizada con la foto seleccionada.');
    await loadPhotos(photo.gallery_id);
  }

  async function deletePhoto(photo){
    if(!confirm('¿Mover esta foto a la papelera? Se podrá restaurar o borrar definitivamente después.')) return;
    const sb=client(); if(!sb) return;
    const {error}=await sb.from('photos').update({
      deleted_at:new Date().toISOString(),
      hidden:true,
      updated_at:new Date().toISOString()
    }).eq('id',photo.id);
    if(error){setText('#edit-gallery-status-msg','No se pudo mover a papelera: '+error.message); return;}
    setText('#edit-gallery-status-msg','Foto movida a la papelera. Para liberar espacio, bórrala definitivamente desde Papelera.');
    await loadPhotos(photo.gallery_id);
  }

  async function replacePhoto(photo,input){
    const file=input.files?.[0]; if(!file) return;
    const sb=client(); if(!sb) return;
    setText('#edit-gallery-status-msg','Subiendo reemplazo/retocada...');
    try{
      const url=await uploadFile(file,`galleries/${photo.gallery_id}/retouched`);
      const {error}=await sb.from('photos').update({retouched_url:url,preview_url:url,large_url:url,updated_at:new Date().toISOString()}).eq('id',photo.id);
      if(error) throw error;
      setText('#edit-gallery-status-msg','Foto reemplazada correctamente.');
      await loadPhotos(photo.gallery_id);
    }catch(e){setText('#edit-gallery-status-msg','No se pudo reemplazar la foto: '+e.message);}
  }

  async function savePhoto(photo,card){
    const sb=client(); if(!sb) return;
    const payload={caption_es:card.querySelector('.pm-caption-es')?.value.trim()||null,caption_en:card.querySelector('.pm-caption-en')?.value.trim()||null,updated_at:new Date().toISOString()};
    const {error}=await sb.from('photos').update(payload).eq('id',photo.id);
    setText('#edit-gallery-status-msg', error?'No se pudo guardar la foto: '+error.message:'Datos de foto guardados.');
  }

  document.addEventListener('click',async(e)=>{
    const btn=e.target.closest('[data-pm]'); if(!btn) return;
    const card=btn.closest('[data-photo-id]'); const photo=currentPhotos.find(p=>p.id===card?.dataset.photoId); if(!photo) return;
    const action=btn.dataset.pm; const sb=client(); if(!sb) return;
    if(action==='up') return swapOrder(photo,-1);
    if(action==='down') return swapOrder(photo,1);
    if(action==='cover') return setCover(photo);
    if(action==='hide') {await sb.from('photos').update({hidden:!photo.hidden,updated_at:new Date().toISOString()}).eq('id',photo.id); return loadPhotos(photo.gallery_id);}
    if(action==='delete') return deletePhoto(photo);
    if(action==='save') return savePhoto(photo,card);
    if(action==='replace') {const input=card.querySelector('.pm-replace'); input.click(); input.onchange=()=>replacePhoto(photo,input);}
  });

  document.addEventListener('DOMContentLoaded',()=>{
    const style=document.createElement('style');
    style.textContent=`.photo-manager-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.photo-manager-card{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.03)}.pm-image-wrap{height:180px;position:relative;overflow:hidden;background:#111}.pm-image-wrap img{width:100%;height:100%;object-fit:cover}.pm-index,.pm-badge{position:absolute;top:8px;left:8px;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.2);padding:4px 7px;font-size:10px;letter-spacing:.08em;text-transform:uppercase}.pm-badge{left:auto;right:8px}.photo-manager-card.is-hidden{opacity:.48}.pm-body{padding:12px;display:grid;gap:8px}.pm-body strong{font-weight:500}.pm-body span{font-size:12px;color:rgba(255,255,255,.55)}.pm-body input{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.14);color:#fff;padding:10px}.pm-actions{display:flex;flex-wrap:wrap;gap:6px}.pm-actions .btn{padding:9px 10px;font-size:10px}@media(max-width:800px){.photo-manager-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
    document.querySelectorAll('[data-edit-gallery]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>loadPhotos(b.dataset.editGallery),500)));
    const save=$('#save-edit-gallery'); if(save) save.addEventListener('click',()=>setTimeout(()=>loadPhotos(),1000));
    const upload=$('#upload-gallery-photos-submit'); if(upload) upload.addEventListener('click',()=>setTimeout(()=>{const id=$('#upload-gallery-id')?.value; if(id) loadPhotos(id)},2500));
    const target=$('#edit-gallery-photo-order'); if(target){new MutationObserver(()=>{if(galleryId() && !target.dataset.pmRefreshing){target.dataset.pmRefreshing='1'; setTimeout(()=>{delete target.dataset.pmRefreshing; if(!target.querySelector('.photo-manager-card')) loadPhotos();},600)}}).observe(target,{childList:true});}
  });
})();
