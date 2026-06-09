(function(){
  const qs=new URLSearchParams(location.search);
  const clientParam=qs.get('client');
  const adminPreview=qs.get('adminPreview')==='1'||qs.get('preview')==='1';
  const SESSION_KEY='ibaiClientSession';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function getSb(){ if(!window.supabase||!window.IBAI_SUPABASE_URL||!window.IBAI_SUPABASE_ANON_KEY)return null; return window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY); }
  function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null}}
  function clearSession(){localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY);}
  function reveal(){document.body.classList.remove('dynamic-loading');document.body.classList.add('dynamic-ready');}
  function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(v||'');}
  function textByLang(obj, base, lang){ return (lang==='es'?(obj[base+'_es']||obj[base+'_en']):(obj[base+'_en']||obj[base+'_es'])) || ''; }
  function dateLabel(date,lang){ if(!date) return '—'; try{return new Date(date+'T12:00:00').toLocaleDateString(lang==='es'?'es-ES':'en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return date;} }
  function statusInfo(status){
    if(status==='ready') return {cls:'ready',en:'Ready',es:'Lista',copyEn:'All files available',copyEs:'Todos los archivos disponibles',button:false};
    if(status==='in_progress') return {cls:'progress',en:'In progress',es:'En proceso',copyEn:'More photos will be added',copyEs:'Se añadirán más fotos',button:false};
    return {cls:'created',en:'Created',es:'Creada',copyEn:'Gallery created, files coming soon',copyEs:'Galería creada, archivos próximamente',button:true};
  }
  async function countPhotos(sb,galleryId){ const {count}=await sb.from('photos').select('id',{count:'exact',head:true}).eq('gallery_id',galleryId).eq('hidden',false); return count||0; }

  async function load(){
    const sb=getSb(); if(!sb){reveal();return;}
    const s=session(); const effective=clientParam || s?.id;
    if(!effective){ location.href='clientes.html'; return; }
    if(!adminPreview && !clientParam && !s?.id){ location.href='clientes.html'; return; }
    const q=sb.from('clients').select('*').limit(1);
    if(isUuid(effective)) q.eq('id',effective); else q.eq('username',effective);
    const {data:client,error}=await q.maybeSingle();
    if(error||!client){ document.body.innerHTML='<main style="min-height:100vh;background:#080808;color:#fff;display:grid;place-items:center;font-family:Inter,sans-serif;padding:40px;text-align:center"><div><h1>Cliente no disponible</h1><p>No se pudo cargar el cliente.</p><p><a href="clientes.html" style="color:#fff;text-decoration:underline">Volver</a></p></div></main>'; reveal(); return; }
    if(!adminPreview && !clientParam && s?.id && s.id!==client.id){ location.href='clientes.html'; return; }

    const lang=localStorage.getItem('ibaiLanguage')||client.language_preference||'es'; document.documentElement.lang=lang;
    const name=client.name||client.username||'Cliente';
    const hero=client.hero_image_url||''; const profile=client.profile_image_url||hero||'';
    const heroEl=$('.hero');
    if(heroEl){
      heroEl.style.setProperty('--hero-image', hero?`url('${hero}')`:'none');
      heroEl.style.setProperty('--hero-position', `${Number(client.hero_position_x??50)}% ${Number(client.hero_position_y??28)}%`);
    }
    const avatar=$('.hero-avatar img'); if(avatar){ if(profile) avatar.src=profile; avatar.alt=name; avatar.style.objectPosition=`${Number(client.profile_position_x??50)}% ${Number(client.profile_position_y??34)}%`; }
    const prepared=$('.prepared'); if(prepared) prepared.textContent=(lang==='es'?'Preparado exclusivamente para ':'Prepared exclusively for ')+name;
    const eyebrow=$('.eyebrow'); if(eyebrow) eyebrow.textContent=client.client_type==='player'?(lang==='es'?'Experiencia privada para jugador':'Private player experience'):(lang==='es'?'Experiencia privada personalizada':'Private personalised experience');
    const title=textByLang(client,'welcome_title',lang);
    const h1=$('.hero h1'); if(h1) h1.innerHTML=title?esc(title):(lang==='es'?`Bienvenido,<br><em>${esc(name.split(' ')[0])}.</em>`:`Welcome,<br><em>${esc(name.split(' ')[0])}.</em>`);
    const welcome=textByLang(client,'welcome_message',lang);
    const heroP=$('.hero p'); if(heroP){ if(welcome){heroP.textContent=welcome; heroP.style.display='';} else {heroP.textContent=''; heroP.style.display='none';} }
    const mini=$$('.mini-card');
    if(mini[0]) mini[0].innerHTML=`<span>${lang==='es'?'Cliente':'Client'}</span><strong>${esc(name)}</strong>`;
    if(mini[1]) mini[1].innerHTML=`<span>${lang==='es'?'Perfil':'Profile'}</span><strong>${esc(client.client_type||'client')}</strong>`;
    const noteBox=$('.personal-note'); const note=$('.personal-note p');
    if(noteBox&&note){ if(welcome){note.textContent=welcome; noteBox.style.display='grid';} else {note.textContent=''; noteBox.style.display='none';} }

    const {data:links,error:linksErr}=await sb.from('gallery_clients').select('gallery_id').eq('client_id',client.id);
    if(linksErr) console.warn(linksErr);
    const ids=(links||[]).map(x=>x.gallery_id);
    let galleries=[];
    if(ids.length){
      const {data:gals,error:gerr}=await sb.from('galleries').select('*').in('id',ids).is('deleted_at',null).order('event_date',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
      if(gerr) console.warn(gerr); else galleries=(gals||[]).filter(g=>adminPreview || g.publish_status!=='draft');
    }
    const counts={}; await Promise.all(galleries.map(async g=>{counts[g.id]=await countPhotos(sb,g.id);}));
    if(mini[2]) mini[2].innerHTML=`<span>${lang==='es'?'Galerías':'Galleries'}</span><strong>${galleries.length} ${lang==='es'?'activas':'active'}</strong>`;
    renderFeatured(galleries,counts,lang); renderGalleries(galleries,counts,lang); renderTimeline(galleries,counts,lang); await renderCompletedRetouches(sb,client,lang);
    const license=$('.license-box p'); if(license){ const custom=textByLang(client,'license',lang); if(custom) license.textContent=custom; }
    const licensePills=$$('.license-pill'); if(licensePills[0]) licensePills[0].innerHTML=`<span>${lang==='es'?'Tipo de cliente':'Client type'}</span><strong>${esc(client.client_type||'client')}</strong>`;
    reveal();
  }

  function renderFeatured(galleries,counts,lang){
    const featured=$('.featured'); if(!featured) return;
    const g=galleries.find(x=>(counts[x.id]||0)>0) || galleries[0];
    if(!g){featured.style.display='none';return;}
    const st=statusInfo(g.status); const cover=g.cover_image_url||''; featured.style.display='grid'; if(cover) featured.style.setProperty('--featured-image',`url('${cover}')`);
    const img=$('.featured-cover img',featured); if(img&&cover){img.src=cover; img.style.objectPosition=`${Number(g.cover_position_x??50)}% ${Number(g.cover_position_y??50)}%`;}
    const h=$('h2',featured); if(h) h.textContent=textByLang(g,'title',lang)||'Galería';
    const meta=$('.featured-meta',featured); if(meta) meta.innerHTML=`<span class="status-pill"><i class="status-dot ${st.cls}"></i>${lang==='es'?st.es:st.en}</span><span class="tag">${counts[g.id]||0} ${lang==='es'?'fotos':'photos'}</span>`;
    const p=$('p',featured); const note=textByLang(g,'personal_note',lang); if(p){ if(note){p.textContent=note;p.style.display='';} else p.style.display='none'; }
    const a=$('.featured-action a',featured); if(a) a.href=`gallery-view.html?gallery=${encodeURIComponent(g.id)}`;
  }
  function renderGalleries(galleries,counts,lang){
    const grid=$('.gallery-grid'); if(!grid) return;
    if(!galleries.length){grid.innerHTML=`<article class="gallery-card"><div class="gallery-content"><h3>${lang==='es'?'Sin galerías todavía':'No galleries yet'}</h3><p>${lang==='es'?'Cuando Ibai publique una galería para este cliente aparecerá aquí.':'When Ibai publishes a gallery for this client it will appear here.'}</p></div></article>`;return;}
    grid.innerHTML=galleries.map(g=>{
      const st=statusInfo(g.status); const count=counts[g.id]||0; const cover=g.cover_image_url||''; const title=textByLang(g,'title',lang)||'Galería'; const note=textByLang(g,'personal_note',lang); const disabled=st.button?' btn-disabled':'';
      return `<article class="gallery-card"><div class="gallery-image">${cover?`<img src="${esc(cover)}" alt="${esc(title)} cover" style="object-position:${Number(g.cover_position_x??50)}% ${Number(g.cover_position_y??50)}%">`:''}<div class="gallery-status"><span class="status-pill"><i class="status-dot ${st.cls}"></i>${lang==='es'?st.es:st.en}</span></div></div><div class="gallery-content"><h3>${esc(title)}</h3><div class="status-copy">${lang==='es'?st.copyEs:st.copyEn}</div>${note?`<p>${esc(note)}</p>`:''}<div class="meta"><div><span>${lang==='es'?'Fotos':'Photos'}</span><strong>${count}</strong></div><div><span>${lang==='es'?'Fecha':'Date'}</span><strong>${dateLabel(g.event_date,lang)}</strong></div></div><div class="card-actions"><a class="btn btn-primary${disabled}" href="${st.button?'#':`gallery-view.html?gallery=${encodeURIComponent(g.id)}`}">${st.button?(lang==='es'?'Próximamente':'Coming soon'):(lang==='es'?'Abrir':'Open')}</a><a class="btn btn-ghost" href="gallery-view.html?gallery=${encodeURIComponent(g.id)}">${lang==='es'?'Detalles':'Details'}</a></div></div></article>`;
    }).join('');
  }
  function renderTimeline(galleries,counts,lang){
    const list=$('.timeline-list'); const timeline=$('.timeline'); if(!list||!timeline) return;
    const rows=galleries.slice(0,4).map(g=>`<div class="timeline-item"><span>${dateLabel(g.event_date,lang)}</span><strong>${esc(textByLang(g,'title',lang)||'Galería')} · ${counts[g.id]||0} ${lang==='es'?'fotos':'photos'}</strong></div>`);
    if(!rows.length){timeline.style.display='none';return;} timeline.style.display='grid'; list.innerHTML=rows.join('');
  }
  async function renderCompletedRetouches(sb,client,lang){
    try{
      const {data}=await sb.from('retouch_requests').select('*, photos(filename,preview_url,large_url,original_url), galleries(title_es,title_en)').eq('client_id',client.id).in('status',['done','completed']).order('updated_at',{ascending:false}).limit(8);
      const old=document.getElementById('completed-retouches-panel'); if(old) old.remove();
      if(!data||!data.length) return;
      const box=document.createElement('section'); box.id='completed-retouches-panel'; box.className='section personal-note';
      box.innerHTML=`<div class="quote-mark">✓</div><div><h3 style="margin-bottom:10px">${lang==='es'?'Retoques completados':'Completed retouches'}</h3>${data.map(r=>{const g=r.galleries||{};const p=r.photos||{};return `<p style="margin-bottom:8px"><strong>${esc(p.filename||'Foto')}</strong> · ${esc(textByLang(g,'title',lang)||'Galería')}<br><span>${esc(r.message||'')}</span></p>`}).join('')}</div>`;
      ($('.personal-note')||$('.hero')).insertAdjacentElement('afterend',box);
    }catch(e){console.warn('completed retouches',e);}
  }
  document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('a,button,.logout,[data-logout]').forEach(el=>{const label=(el.textContent||'').trim().toLowerCase(); if(label==='log out'||label==='cerrar sesión'||label==='salir'||el.matches('.logout,[data-logout]')) el.addEventListener('click',ev=>{ev.preventDefault();clearSession();location.href='clientes.html';});}); load();});
})();
