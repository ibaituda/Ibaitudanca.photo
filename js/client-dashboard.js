(function(){
  const qs=new URLSearchParams(location.search);
  const clientParam=qs.get('client');
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function getClient(){
    if(!window.supabase||!window.IBAI_SUPABASE_URL||!window.IBAI_SUPABASE_ANON_KEY){return null;}
    return window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);
  }
  function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v||'');}
  function statusInfo(status){
    if(status==='ready') return {cls:'ready',en:'Ready',es:'Lista',copyEn:'All files available',copyEs:'Todos los archivos disponibles',button:false};
    if(status==='in_progress') return {cls:'progress',en:'In progress',es:'En proceso',copyEn:'More photos will be added',copyEs:'Se añadirán más fotos',button:false};
    return {cls:'created',en:'Created',es:'Creada',copyEn:'Gallery created, files coming soon',copyEs:'Galería creada, archivos próximamente',button:true};
  }
  function dateLabel(date){
    if(!date) return 'No date';
    try{return new Date(date+'T12:00:00').toLocaleDateString(document.documentElement.lang==='es'?'es-ES':'en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return date;}
  }
  async function countPhotos(sb,galleryId){
    const {count}=await sb.from('photos').select('id',{count:'exact',head:true}).eq('gallery_id',galleryId).eq('hidden',false);
    return count||0;
  }
  async function load(){
    if(!clientParam) return;
    const sb=getClient(); if(!sb) return;
    const q=sb.from('clients').select('*').limit(1);
    if(isUuid(clientParam)) q.eq('id',clientParam); else q.eq('username',clientParam);
    const {data, error}=await q.maybeSingle();
    if(error||!data){console.warn('Client dashboard load error',error);return;}
    const client=data;
    const lang=localStorage.getItem('ibaiLanguage')||client.language_preference||'es';
    document.documentElement.lang=lang;
    const name=client.name||client.username;
    const first=(name||'Client').split(' ')[0];
    const hero=client.hero_image_url||'img/work_O.jpg';
    const profile=client.profile_image_url||hero;
    $('.hero')?.style.setProperty('--hero-image',`url('${hero}')`);
    const avatar=$('.hero-avatar img'); if(avatar){avatar.src=profile; avatar.alt=name;}
    const prepared=$('.prepared'); if(prepared) prepared.textContent=(lang==='es'?'Preparado exclusivamente para ':'Prepared exclusively for ')+name;
    const eyebrow=$('.eyebrow'); if(eyebrow) eyebrow.textContent=client.client_type==='player'?(lang==='es'?'Experiencia privada para jugador':'Private player experience'):(lang==='es'?'Experiencia privada personalizada':'Private personalised experience');
    const h1=$('.hero h1'); if(h1) h1.innerHTML=(lang==='es'?'Bienvenido de nuevo,':'Welcome back,')+'<br><em>'+esc(first)+'.</em>';
    const p=$('.hero p'); if(p) p.textContent=(lang==='es'?(client.welcome_message_es||client.welcome_message_en):(client.welcome_message_en||client.welcome_message_es))||p.textContent;
    const mini=$$('.mini-card');
    if(mini[0]) mini[0].innerHTML=`<span>${lang==='es'?'Cliente':'Client'}</span><strong>${esc(name)}</strong>`;
    if(mini[1]) mini[1].innerHTML=`<span>${lang==='es'?'Perfil':'Profile'}</span><strong>${esc(client.client_type||'client')}</strong>`;
    const note=$('.personal-note p'); if(note) note.textContent=(lang==='es'?(client.welcome_message_es||client.welcome_message_en):(client.welcome_message_en||client.welcome_message_es))||note.textContent;

    const {data:links,error:linksErr}=await sb.from('gallery_clients').select('gallery_id').eq('client_id',client.id);
    if(linksErr){console.warn(linksErr); return;}
    const ids=(links||[]).map(x=>x.gallery_id);
    let galleries=[];
    if(ids.length){
      const {data:gals,error:gerr}=await sb.from('galleries').select('*').in('id',ids).order('event_date',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
      if(gerr) console.warn(gerr); else galleries=gals||[];
    }
    const photoCounts={};
    await Promise.all(galleries.map(async g=>{photoCounts[g.id]=await countPhotos(sb,g.id);}));
    if(mini[2]) mini[2].innerHTML=`<span>${lang==='es'?'Galerías':'Galleries'}</span><strong>${galleries.length} ${lang==='es'?'activas':'active'}</strong>`;
    renderFeatured(galleries,photoCounts,lang);
    renderGalleries(galleries,photoCounts,lang);
    const license=$('.license-box p'); if(license){const custom=lang==='es'?(client.license_es||client.license_en):(client.license_en||client.license_es); if(custom) license.textContent=custom;}
    const licensePills=$$('.license-pill');
    if(licensePills[0]) licensePills[0].innerHTML=`<span>${lang==='es'?'Tipo de cliente':'Client type'}</span><strong>${esc(client.client_type||'client')}</strong>`;
  }
  function renderFeatured(galleries,counts,lang){
    const featured=$('.featured'); if(!featured) return;
    const g=galleries.find(x=>x.status==='ready'||x.status==='in_progress');
    if(!g){featured.style.display='none';return;}
    const st=statusInfo(g.status);
    const cover=g.cover_image_url||'img/work_O.jpg';
    featured.style.display='grid'; featured.style.setProperty('--featured-image',`url('${cover}')`);
    const img=$('.featured-cover img',featured); if(img) img.src=cover;
    const h=$('h2',featured); if(h) h.textContent=(lang==='es'?g.title_es:g.title_en)||g.title_es||g.title_en||'Untitled gallery';
    const meta=$('.featured-meta',featured); if(meta) meta.innerHTML=`<span class="status-pill"><i class="status-dot ${st.cls}"></i>${lang==='es'?st.es:st.en}</span><span class="tag new">${lang==='es'?'Nueva':'New'}</span><span class="tag">${counts[g.id]||0} ${lang==='es'?'fotos':'photos'}</span>`;
    const a=$('.featured-action a',featured); if(a) a.href=`gallery-view.html?gallery=${encodeURIComponent(g.id)}`;
  }
  function renderGalleries(galleries,counts,lang){
    const grid=$('.gallery-grid'); if(!grid) return;
    if(!galleries.length){grid.innerHTML=`<article class="gallery-card"><div class="gallery-content"><h3>${lang==='es'?'Sin galerías todavía':'No galleries yet'}</h3><p>${lang==='es'?'Cuando Ibai publique una galería para este cliente aparecerá aquí.':'When Ibai publishes a gallery for this client it will appear here.'}</p></div></article>`;return;}
    grid.innerHTML=galleries.map(g=>{
      const st=statusInfo(g.status); const count=counts[g.id]||0; const cover=g.cover_image_url||'img/work_O.jpg';
      const title=(lang==='es'?g.title_es:g.title_en)||g.title_es||g.title_en||'Untitled gallery';
      const note=(lang==='es'?g.personal_note_es:g.personal_note_en)||g.personal_note_es||g.personal_note_en||'';
      const disabled=st.button?' btn-disabled':'';
      return `<article class="gallery-card"><div class="gallery-image"><img src="${esc(cover)}" alt="${esc(title)} cover" style="object-position:${g.cover_position_x||50}% ${g.cover_position_y||50}%"><div class="gallery-status"><span class="status-pill"><i class="status-dot ${st.cls}"></i>${lang==='es'?st.es:st.en}</span></div></div><div class="gallery-content"><h3>${esc(title)}</h3><div class="status-copy">${lang==='es'?st.copyEs:st.copyEn}</div><p>${esc(note)}</p><div class="meta"><div><span>${lang==='es'?'Fotos':'Photos'}</span><strong>${count}</strong></div><div><span>${lang==='es'?'Fecha':'Date'}</span><strong>${dateLabel(g.event_date)}</strong></div><div><span>${lang==='es'?'Caducidad':'Expiry'}</span><strong>${lang==='es'?'Sin caducidad':'No expiry'}</strong></div></div><div class="quality-row"><span class="quality">Original</span><span class="quality">Large</span><span class="quality">Preview</span></div><div class="card-actions"><a class="btn btn-primary${disabled}" href="${st.button?'#':`gallery-view.html?gallery=${encodeURIComponent(g.id)}`}">${st.button?(lang==='es'?'Próximamente':'Coming soon'):(lang==='es'?'Abrir':'Open')}</a><a class="btn btn-ghost" href="gallery-view.html?gallery=${encodeURIComponent(g.id)}">${lang==='es'?'Detalles':'Details'}</a></div></div></article>`;
    }).join('');
  }
  document.addEventListener('DOMContentLoaded',load);
})();
