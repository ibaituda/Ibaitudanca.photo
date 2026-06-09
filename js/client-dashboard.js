(function(){
  const qs=new URLSearchParams(location.search);
  const clientParam=qs.get('client');
  const adminPreview=qs.get('adminPreview')==='1'||qs.get('preview')==='1';
  const SESSION_KEY='ibaiClientSession';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const clean=(v)=>{const s=String(v??'').trim(); return s && !/Antonio Blanco|Personalised message for the client dashboard|Mensaje personalizado para el dashboard/i.test(s) ? s : '';};
  function getSupabase(){return window.supabase&&window.IBAI_SUPABASE_URL&&window.IBAI_SUPABASE_ANON_KEY?window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY):null;}
  function readSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null}}
  function clearSession(){localStorage.removeItem(SESSION_KEY);sessionStorage.clear();}
  function reveal(){document.body.classList.remove('dynamic-loading');document.body.classList.add('dynamic-ready');}
  function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v||'');}
  function fail(msg='No se pudo cargar el cliente.'){document.body.innerHTML=`<main style="min-height:100vh;background:#080808;color:#fff;display:grid;place-items:center;font-family:Inter,sans-serif;padding:40px;text-align:center"><div><h1>Cliente no disponible</h1><p>${esc(msg)}</p><p><a href="clientes.html" style="color:#fff;text-decoration:underline">Volver</a></p></div></main>`;reveal();}
  function statusInfo(status){
    if(status==='ready'||status==='published') return {cls:'ready',en:'Ready',es:'Lista',copyEn:'All files available',copyEs:'Todos los archivos disponibles',button:false};
    if(status==='in_progress') return {cls:'progress',en:'In progress',es:'En proceso',copyEn:'More photos may be added',copyEs:'Pueden añadirse más fotos',button:false};
    return {cls:'created',en:'Created',es:'Creada',copyEn:'Gallery created',copyEs:'Galería creada',button:false};
  }
  function dateLabel(date,lang='es'){if(!date)return '—'; try{return new Date(date+'T12:00:00').toLocaleDateString(lang==='es'?'es-ES':'en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return date||'—';}}
  async function findClient(sb, wanted, session){
    const attempts=[];
    if(wanted) attempts.push(wanted);
    if(session?.id) attempts.push(session.id);
    if(session?.username) attempts.push(session.username);
    for(const value of [...new Set(attempts.filter(Boolean))]){
      let q=sb.from('clients').select('*').limit(1);
      q=isUuid(value)?q.eq('id',value):q.eq('username',value);
      const {data,error}=await q.maybeSingle();
      if(error) console.warn('client lookup error',error);
      if(data) return data;
    }
    return null;
  }
  async function countPhotos(sb,galleryId){
    let q=sb.from('photos').select('id',{count:'exact',head:true}).eq('gallery_id',galleryId);
    try{q=q.eq('hidden',false)}catch(e){}
    const {count,error}=await q;
    if(error) console.warn('count photos error',error);
    return count||0;
  }
  function setHeroPosition(client){
    if(!document.getElementById('client-dynamic-position-style')){
      const style=document.createElement('style'); style.id='client-dynamic-position-style';
      style.textContent='.hero::before{background-position:var(--hero-pos-x,50%) var(--hero-pos-y,28%) !important}.hero-avatar img{object-position:var(--profile-pos-x,50%) var(--profile-pos-y,34%) !important}.featured-cover img,.gallery-image img{object-position:var(--cover-pos-x,50%) var(--cover-pos-y,35%) !important}';
      document.head.appendChild(style);
    }
    const hero=$('.hero');
    if(hero){hero.style.setProperty('--hero-pos-x',(client.hero_position_x??50)+'%');hero.style.setProperty('--hero-pos-y',(client.hero_position_y??28)+'%');}
  }
  function applyClientToHero(client,lang){
    const name=client.name||client.username||'Cliente';
    const first=name.split(' ')[0]||name;
    const heroUrl=client.hero_image_url||'';
    const profileUrl=client.profile_image_url||heroUrl||'';
    setHeroPosition(client);
    if(heroUrl) $('.hero')?.style.setProperty('--hero-image',`url('${heroUrl}')`);
    const avatar=$('.hero-avatar img'); if(avatar&&profileUrl){avatar.src=profileUrl;avatar.alt=name;}
    const prepared=$('.prepared'); if(prepared) prepared.textContent=(lang==='es'?'Experiencia privada personalizada':'Private personalised experience');
    const eyebrow=$('.eyebrow'); if(eyebrow) eyebrow.textContent=client.client_type==='player'?(lang==='es'?'Experiencia privada para jugador':'Private player experience'):(lang==='es'?'Experiencia privada personalizada':'Private personalised experience');
    const customTitle=clean(lang==='es'?(client.welcome_title_es||client.welcome_title_en):(client.welcome_title_en||client.welcome_title_es));
    const h1=$('.hero h1'); if(h1) h1.innerHTML=customTitle?esc(customTitle):(lang==='es'?`Hola,<br><em>${esc(first)}.</em>`:`Welcome,<br><em>${esc(first)}.</em>`);
    const customMessage=clean(lang==='es'?(client.welcome_message_es||client.welcome_message_en):(client.welcome_message_en||client.welcome_message_es));
    const p=$('.hero p'); if(p){ if(customMessage){p.textContent=customMessage;p.style.display='';} else {p.textContent='';p.style.display='none';}}
    const noteBox=$('.personal-note'); const note=$('.personal-note p');
    if(noteBox&&note){ if(customMessage){note.textContent=customMessage;noteBox.style.display='';} else {noteBox.style.display='none';}}
    const mini=$$('.mini-card');
    if(mini[0]) mini[0].innerHTML=`<span>${lang==='es'?'Cliente':'Client'}</span><strong>${esc(name)}</strong>`;
    if(mini[1]) mini[1].innerHTML=`<span>${lang==='es'?'Perfil':'Profile'}</span><strong>${esc(client.client_type||'client')}</strong>`;
  }
  function renderFeatured(galleries,counts,lang){
    const featured=$('.featured'); if(!featured) return;
    const g=galleries[0];
    if(!g){featured.style.display='none';return;}
    const st=statusInfo(g.status||g.publish_status);
    const cover=g.cover_image_url||'';
    featured.style.display='grid'; if(cover) featured.style.setProperty('--featured-image',`url('${cover}')`);
    featured.style.setProperty('--cover-pos-x',(g.cover_position_x??50)+'%'); featured.style.setProperty('--cover-pos-y',(g.cover_position_y??35)+'%');
    const img=$('.featured-cover img',featured); if(img&&cover) img.src=cover;
    const title=(lang==='es'?g.title_es:g.title_en)||g.title_es||g.title_en||'Galería';
    const h=$('h2',featured); if(h) h.textContent=title;
    const meta=$('.featured-meta',featured); if(meta) meta.innerHTML=`<span class="status-pill"><i class="status-dot ${st.cls}"></i>${lang==='es'?st.es:st.en}</span><span class="tag">${counts[g.id]||0} ${lang==='es'?'fotos':'photos'}</span>`;
    const a=$('.featured-action a',featured); if(a) a.href=`gallery-view.html?gallery=${encodeURIComponent(g.id)}`;
  }
  function renderGalleries(galleries,counts,lang){
    const grid=$('.gallery-grid'); if(!grid) return;
    if(!galleries.length){grid.innerHTML=`<article class="gallery-card"><div class="gallery-content"><h3>${lang==='es'?'Sin galerías todavía':'No galleries yet'}</h3><p>${lang==='es'?'Cuando haya una galería publicada para este cliente aparecerá aquí.':'When a gallery is published for this client, it will appear here.'}</p></div></article>`;return;}
    grid.innerHTML=galleries.map(g=>{
      const st=statusInfo(g.status||g.publish_status); const count=counts[g.id]||0; const cover=g.cover_image_url||'';
      const title=(lang==='es'?g.title_es:g.title_en)||g.title_es||g.title_en||'Galería';
      const note=clean((lang==='es'?g.personal_note_es:g.personal_note_en)||g.personal_note_es||g.personal_note_en);
      return `<article class="gallery-card"><div class="gallery-image" style="--cover-pos-x:${g.cover_position_x??50}%;--cover-pos-y:${g.cover_position_y??35}%">${cover?`<img src="${esc(cover)}" alt="${esc(title)} cover">`:''}<div class="gallery-status"><span class="status-pill"><i class="status-dot ${st.cls}"></i>${lang==='es'?st.es:st.en}</span></div></div><div class="gallery-content"><h3>${esc(title)}</h3><div class="status-copy">${lang==='es'?st.copyEs:st.copyEn}</div>${note?`<p>${esc(note)}</p>`:''}<div class="meta"><div><span>${lang==='es'?'Fotos':'Photos'}</span><strong>${count}</strong></div><div><span>${lang==='es'?'Fecha':'Date'}</span><strong>${dateLabel(g.event_date,lang)}</strong></div><div><span>${lang==='es'?'Acceso':'Access'}</span><strong>${g.publish_status==='draft'?(lang==='es'?'Borrador':'Draft'):(lang==='es'?'Publicado':'Published')}</strong></div></div><div class="card-actions"><a class="btn btn-primary" href="gallery-view.html?gallery=${encodeURIComponent(g.id)}">${lang==='es'?'Abrir':'Open'}</a><a class="btn btn-ghost" href="gallery-view.html?gallery=${encodeURIComponent(g.id)}">${lang==='es'?'Detalles':'Details'}</a></div></div></article>`;
    }).join('');
  }
  function renderTimeline(galleries,lang){
    const list=$('.timeline-list'); const section=$('.timeline'); if(!list||!section) return;
    const items=galleries.slice(0,4);
    if(!items.length){section.style.display='none';return;}
    section.style.display='grid';
    list.innerHTML=items.map(g=>`<div class="timeline-item"><span>${esc(dateLabel(g.event_date,lang))}</span><strong>${esc((lang==='es'?g.title_es:g.title_en)||g.title_es||g.title_en||'Galería')}</strong></div>`).join('');
  }
  async function renderRetouchNotice(sb,client,lang){
    try{
      const {data,error}=await sb.from('retouch_requests').select('*').eq('client_id',client.id).in('status',['completed','done','finalizado']).order('updated_at',{ascending:false}).limit(4);
      if(error||!data?.length) return;
      const box=document.createElement('section'); box.className='section';
      box.innerHTML=`<div class="panel"><h3>${lang==='es'?'Retoques completados':'Completed retouches'}</h3><p>${lang==='es'?'Estas solicitudes ya han sido completadas.':'These edit requests have been completed.'}</p><div class="download-options">${data.map(r=>`<div class="download-row"><span>${esc(r.message||r.notes||'Retoque completado')}</span><strong>${esc(r.status)}</strong></div>`).join('')}</div></div>`;
      const featured=$('.featured'); if(featured) featured.insertAdjacentElement('afterend',box);
    }catch(e){console.warn('retouch notice error',e)}
  }
  async function load(){
    const sb=getSupabase(); if(!sb){reveal();return;}
    const session=readSession();
    if(!adminPreview && !session?.id && !clientParam){location.href='clientes.html';return;}
    const client=await findClient(sb,clientParam,session);
    if(!client){fail();return;}
    if(!adminPreview && session?.id && client.id!==session.id){location.href='clientes.html';return;}
    const lang=localStorage.getItem('ibaiLanguage')||client.language_preference||'es'; document.documentElement.lang=lang;
    applyClientToHero(client,lang);
    const {data:links,error:linksErr}=await sb.from('gallery_clients').select('gallery_id').eq('client_id',client.id);
    if(linksErr) console.warn('gallery links error',linksErr);
    const ids=(links||[]).map(x=>x.gallery_id).filter(Boolean);
    let galleries=[];
    if(ids.length){
      const {data:gals,error:gerr}=await sb.from('galleries').select('*').in('id',ids).order('event_date',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
      if(gerr) console.warn('galleries error',gerr); else galleries=(gals||[]).filter(g=>!g.deleted_at && (adminPreview || g.publish_status!=='draft'));
    }
    const counts={}; await Promise.all(galleries.map(async g=>{counts[g.id]=await countPhotos(sb,g.id)}));
    const mini=$$('.mini-card'); if(mini[2]) mini[2].innerHTML=`<span>${lang==='es'?'Galerías':'Galleries'}</span><strong>${galleries.length} ${lang==='es'?'activas':'active'}</strong>`;
    renderFeatured(galleries,counts,lang); renderGalleries(galleries,counts,lang); renderTimeline(galleries,lang); await renderRetouchNotice(sb,client,lang);
    const customLicense=clean(lang==='es'?(client.license_es||client.license_en):(client.license_en||client.license_es));
    const license=$('.license-box p'); if(license&&customLicense) license.textContent=customLicense;
    const licensePills=$$('.license-pill'); if(licensePills[0]) licensePills[0].innerHTML=`<span>${lang==='es'?'Tipo de cliente':'Client type'}</span><strong>${esc(client.client_type||'client')}</strong>`;
    reveal();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('a,button,.logout,[data-logout]').forEach(el=>{
      const label=(el.textContent||'').trim().toLowerCase();
      if(el.matches('.logout,[data-logout]')||['log out','logout','cerrar sesión','salir'].includes(label)){
        el.addEventListener('click',(ev)=>{ev.preventDefault();clearSession();location.href='clientes.html';});
      }
    });
    load();
  });
})();
