(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const BUCKET='portfolio-images';
  const lang=()=>localStorage.getItem('ibaiLanguage')||document.body?.dataset?.lang||'es';
  const t=(es,en)=>lang()==='es'?es:en;
  function sb(){
    if(!window.supabase||!window.IBAI_SUPABASE_URL||!window.IBAI_SUPABASE_ANON_KEY) return null;
    return window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY);
  }
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function slug(v){return String(v||'uploads').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'uploads';}
  function photoUrl(p){return p.preview_url||p.large_url||p.original_url||'';}
  function setText(sel,val){const el=$(sel); if(el) el.textContent=val;}
  function status(sel,msg){setText(sel,msg);}
  function injectStyles(){
    if($('#photo-management-styles')) return;
    const st=document.createElement('style'); st.id='photo-management-styles';
    st.textContent=`
      .photo-manager-wrap{display:grid;gap:14px;width:100%}.photo-manager-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin:10px 0 2px}.photo-manager-head p{margin:0;color:var(--muted);font-size:12px;line-height:1.6}.photo-manager-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.managed-photo{border:1px solid var(--line);background:rgba(255,255,255,.025);overflow:hidden}.managed-photo.hidden-photo{opacity:.45}.managed-photo-img{height:150px;background:#080808;position:relative}.managed-photo-img img{width:100%;height:100%;object-fit:cover;display:block}.managed-photo-img .badge{position:absolute;left:8px;top:8px;background:rgba(0,0,0,.68);border:1px solid rgba(255,255,255,.2);padding:4px 7px;font-size:10px;letter-spacing:.1em;text-transform:uppercase}.managed-photo-body{padding:10px}.managed-photo-title{font-size:12px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.managed-photo-meta{font-size:10px;color:var(--soft);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.managed-photo-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:10px}.managed-photo-actions button{min-height:34px;padding:8px;font-size:9px}.publish-checklist{border:1px solid var(--line);background:rgba(255,255,255,.025);padding:16px;margin:16px 0;display:grid;gap:10px}.publish-checklist ul{list-style:none;padding:0;margin:0;display:grid;gap:7px}.publish-checklist li{font-size:12px;color:var(--muted)}.publish-checklist li.ok:before{content:'●';color:var(--green);margin-right:8px}.publish-checklist li.missing:before{content:'●';color:var(--yellow);margin-right:8px}.publication-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between}.publication-row strong{font-size:13px;letter-spacing:.08em;text-transform:uppercase}.photo-empty-state{border:1px solid var(--line);padding:18px;color:var(--muted);font-size:13px}.photo-toolbar{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:980px){.photo-manager-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.photo-manager-grid{grid-template-columns:1fr}.photo-manager-head{display:block}.managed-photo-actions{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(st);
  }
  async function uploadFile(supabase,file,pathPrefix){
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const path=`${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2,9)}.${ext}`;
    const {error}=await supabase.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:true});
    if(error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  async function loadGalleryPhotosForManagement(galleryId){
    const client=sb(); if(!client||!galleryId) return [];
    const {data,error}=await client.from('photos').select('*').eq('gallery_id',galleryId).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
    if(error){console.warn(error); return [];} return data||[];
  }
  async function renderManager(galleryId){
    injectStyles();
    const target=$('#edit-gallery-photo-order'); if(!target||!galleryId) return;
    target.innerHTML=`<div class="photo-empty-state">${t('Cargando fotos de la galería...','Loading gallery photos...')}</div>`;
    const photos=await loadGalleryPhotosForManagement(galleryId);
    window.IBAI_MANAGED_PHOTOS=photos;
    if(!photos.length){
      target.innerHTML=`<div class="photo-empty-state">${t('Esta galería todavía no tiene fotos. Sube fotos desde el bloque “Subir fotos”.','This gallery has no photos yet. Upload photos from the “Upload photos” block.')}</div>`;
      return;
    }
    target.innerHTML=`
      <div class="photo-manager-wrap">
        <div class="photo-manager-head">
          <p>${t('Gestiona el orden, portada, visibilidad y reemplazos sin salir de la galería.','Manage order, cover, visibility and replacements without leaving the gallery.')}</p>
          <div class="photo-toolbar"><button class="btn" id="refresh-managed-photos">${t('Recargar fotos','Refresh photos')}</button></div>
        </div>
        <div class="photo-manager-grid">
          ${photos.map((p,i)=>card(p,i)).join('')}
        </div>
      </div>`;
    $('#refresh-managed-photos')?.addEventListener('click',()=>renderManager(galleryId));
  }
  function card(p,i){
    const img=photoUrl(p)||'img/work_A.jpg';
    return `<article class="managed-photo ${p.hidden?'hidden-photo':''}" data-photo-id="${esc(p.id)}" data-index="${i}">
      <div class="managed-photo-img"><img src="${esc(img)}" alt=""><span class="badge">${String(i+1).padStart(2,'0')}</span></div>
      <div class="managed-photo-body">
        <div class="managed-photo-title">${esc(p.filename||'Photo')}</div>
        <div class="managed-photo-meta">${esc(p.location||'')} ${p.hidden?'· '+t('Oculta','Hidden'):''}</div>
        <div class="managed-photo-actions">
          <button class="btn" data-photo-action="up">↑ ${t('Subir','Up')}</button>
          <button class="btn" data-photo-action="down">↓ ${t('Bajar','Down')}</button>
          <button class="btn" data-photo-action="cover">${t('Portada','Cover')}</button>
          <button class="btn" data-photo-action="toggle">${p.hidden?t('Mostrar','Show'):t('Ocultar','Hide')}</button>
          <button class="btn" data-photo-action="metadata">${t('Datos','Meta')}</button>
          <button class="btn" data-photo-action="replace">${t('Reemplazar','Replace')}</button>
          <button class="btn" data-photo-action="delete">${t('Eliminar','Delete')}</button>
        </div>
      </div>
    </article>`;
  }
  async function updateOrder(photoId,dir){
    const client=sb(); const list=window.IBAI_MANAGED_PHOTOS||[]; const index=list.findIndex(p=>p.id===photoId); if(!client||index<0)return;
    const otherIndex=dir==='up'?index-1:index+1; if(otherIndex<0||otherIndex>=list.length)return;
    const a=list[index], b=list[otherIndex];
    const aOrder=Number.isFinite(+a.sort_order)?+a.sort_order:index*10;
    const bOrder=Number.isFinite(+b.sort_order)?+b.sort_order:otherIndex*10;
    await client.from('photos').update({sort_order:bOrder}).eq('id',a.id);
    await client.from('photos').update({sort_order:aOrder}).eq('id',b.id);
    await renderManager($('#edit-gallery-id')?.value);
  }
  async function setCover(photoId){
    const client=sb(); const galleryId=$('#edit-gallery-id')?.value; const p=(window.IBAI_MANAGED_PHOTOS||[]).find(x=>x.id===photoId); if(!client||!galleryId||!p)return;
    const url=photoUrl(p); const {error}=await client.from('galleries').update({cover_image_url:url,updated_at:new Date().toISOString()}).eq('id',galleryId);
    if(error){alert(error.message);return;}
    const prev=$('#edit-gallery-cover-preview'); if(prev) prev.style.setProperty('--crop-img',`url('${url}')`);
    const cur=$('#edit-gallery-current-cover-url'); if(cur) cur.value=url;
    status('#edit-gallery-status-msg',t('Portada actualizada con la foto seleccionada.','Cover updated with selected photo.'));
  }
  async function toggleHidden(photoId){
    const client=sb(); const p=(window.IBAI_MANAGED_PHOTOS||[]).find(x=>x.id===photoId); if(!client||!p)return;
    const {error}=await client.from('photos').update({hidden:!p.hidden}).eq('id',photoId);
    if(error){alert(error.message);return;} await renderManager($('#edit-gallery-id')?.value);
  }
  async function deletePhoto(photoId){
    if(!confirm(t('¿Eliminar esta foto de la galería? El archivo puede quedar en Storage, pero dejará de aparecer.','Delete this photo from the gallery? The file may remain in Storage, but will no longer appear.'))) return;
    const client=sb(); if(!client)return; const {error}=await client.from('photos').delete().eq('id',photoId);
    if(error){alert(error.message);return;} await renderManager($('#edit-gallery-id')?.value);
  }
  async function editMetadata(photoId){
    const client=sb(); const p=(window.IBAI_MANAGED_PHOTOS||[]).find(x=>x.id===photoId); if(!client||!p)return;
    const caption=prompt(t('Caption ES / nota editorial','Caption ES / editorial note'),p.caption_es||''); if(caption===null)return;
    const location=prompt(t('Lugar de la foto','Photo location'),p.location||''); if(location===null)return;
    const eventDate=prompt(t('Fecha YYYY-MM-DD','Date YYYY-MM-DD'),p.event_date||''); if(eventDate===null)return;
    const {error}=await client.from('photos').update({caption_es:caption||null,location:location||null,event_date:eventDate||null}).eq('id',photoId);
    if(error){alert(error.message);return;} await renderManager($('#edit-gallery-id')?.value);
  }
  function replacePhoto(photoId){
    const input=document.createElement('input'); input.type='file'; input.accept='image/*';
    input.addEventListener('change',async()=>{
      const file=input.files?.[0]; if(!file)return;
      const client=sb(); const galleryId=$('#edit-gallery-id')?.value; if(!client||!galleryId)return;
      try{
        status('#edit-gallery-status-msg',t('Subiendo reemplazo...','Uploading replacement...'));
        const url=await uploadFile(client,file,`galleries/${slug(galleryId)}/photos/replaced`);
        const {error}=await client.from('photos').update({filename:file.name,original_url:url,large_url:url,preview_url:url,hidden:false}).eq('id',photoId);
        if(error) throw error;
        status('#edit-gallery-status-msg',t('Foto reemplazada correctamente.','Photo replaced successfully.'));
        await renderManager(galleryId);
      }catch(err){alert(err.message||err);}
    });
    input.click();
  }
  async function publishChecklist(galleryId){
    const client=sb(); const box=$('#gallery-publish-checklist')||document.createElement('div'); if(!client||!galleryId)return;
    box.id='gallery-publish-checklist'; box.className='publish-checklist';
    const [gRes, linkRes, photoRes]=await Promise.all([
      client.from('galleries').select('*').eq('id',galleryId).maybeSingle(),
      client.from('gallery_clients').select('id').eq('gallery_id',galleryId),
      client.from('photos').select('id').eq('gallery_id',galleryId).eq('hidden',false)
    ]);
    const g=gRes.data||{}; const okTitle=!!(g.title_es||g.title_en), okCover=!!g.cover_image_url, okClients=(linkRes.data||[]).length>0, okPhotos=(photoRes.data||[]).length>0;
    const canPublish=okTitle&&okCover&&okClients&&okPhotos;
    box.innerHTML=`<div class="publication-row"><strong>${t('Checklist de publicación','Publication checklist')}</strong><button class="btn primary" id="quick-publish-gallery">${g.publish_status==='published'?t('Despublicar','Unpublish'):t('Publicar galería','Publish gallery')}</button></div>
      <ul><li class="${okTitle?'ok':'missing'}">${t('Título de galería','Gallery title')}</li><li class="${okClients?'ok':'missing'}">${t('Cliente asignado','Assigned client')}</li><li class="${okCover?'ok':'missing'}">${t('Portada subida','Cover uploaded')}</li><li class="${okPhotos?'ok':'missing'}">${t('Fotos visibles subidas','Visible photos uploaded')}</li></ul>`;
    const parent=$('#edit-gallery'); if(parent && !$('#gallery-publish-checklist')) parent.insertBefore(box,parent.querySelector('.divider-line')||parent.firstChild);
    $('#quick-publish-gallery')?.addEventListener('click',async()=>{
      if(g.publish_status!=='published'&&!canPublish&&!confirm(t('Faltan elementos del checklist. ¿Publicar igualmente?','Checklist has missing items. Publish anyway?'))) return;
      const next=g.publish_status==='published'?'draft':'published';
      const {error}=await client.from('galleries').update({publish_status:next,updated_at:new Date().toISOString()}).eq('id',galleryId);
      if(error){alert(error.message);return;}
      const sel=$('#edit-gallery-publish-status'); if(sel) sel.value=next;
      await publishChecklist(galleryId);
      status('#edit-gallery-status-msg',next==='published'?t('Galería publicada.','Gallery published.'):t('Galería pasada a borrador.','Gallery moved to draft.'));
    });
  }
  function onEditGalleryOpened(galleryId){
    if(!galleryId) return;
    setTimeout(()=>{renderManager(galleryId); publishChecklist(galleryId);},500);
  }
  document.addEventListener('click',(e)=>{
    const edit=e.target.closest('[data-edit-gallery]'); if(edit) onEditGalleryOpened(edit.dataset.editGallery);
    const act=e.target.closest('[data-photo-action]'); if(act){
      e.preventDefault(); const card=act.closest('[data-photo-id]'); const id=card?.dataset.photoId; if(!id)return;
      const a=act.dataset.photoAction;
      if(a==='up') updateOrder(id,'up'); if(a==='down') updateOrder(id,'down'); if(a==='cover') setCover(id); if(a==='toggle') toggleHidden(id); if(a==='delete') deletePhoto(id); if(a==='metadata') editMetadata(id); if(a==='replace') replacePhoto(id);
    }
  },true);
  document.addEventListener('DOMContentLoaded',()=>{
    injectStyles();
    $('#save-edit-gallery')?.addEventListener('click',()=>setTimeout(()=>{const id=$('#edit-gallery-id')?.value; if(id){renderManager(id); publishChecklist(id);}},900));
    $('#upload-gallery-photos-submit')?.addEventListener('click',()=>setTimeout(()=>{const id=$('#upload-gallery-id')?.value||$('#edit-gallery-id')?.value; if(id){renderManager(id); publishChecklist(id);}},1600));
    const existing=$('#edit-gallery-id')?.value; if(existing) onEditGalleryOpened(existing);
  });
})();
