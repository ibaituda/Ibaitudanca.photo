(function(){
  "use strict";
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
  const slugify = (value)=>String(value||"").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48) || 'item';
  const nowIso = () => new Date().toISOString();

  function supabaseClient(){
    if(!window.supabase || !window.IBAI_SUPABASE_URL || !window.IBAI_SUPABASE_ANON_KEY) return null;
    if(!window.IBAI_PRODUCTIVITY_CLIENT){
      window.IBAI_PRODUCTIVITY_CLIENT = window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);
    }
    return window.IBAI_PRODUCTIVITY_CLIENT;
  }

  function injectStyles(){
    if($('#ibai-productivity-style')) return;
    const style=document.createElement('style');
    style.id='ibai-productivity-style';
    style.textContent=`
      .task-board{display:grid;grid-template-columns:1fr 360px;gap:18px}.task-form{display:grid;gap:12px}.task-row{display:grid;grid-template-columns:34px 1fr auto;gap:12px;align-items:center;border:1px solid var(--line);background:rgba(255,255,255,.03);padding:12px}.task-dot{width:14px;height:14px;border-radius:999px}.task-dot.pending{background:var(--red)}.task-dot.in_progress{background:var(--yellow)}.task-dot.done{background:var(--green)}.task-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.task-actions .btn{padding:8px 10px}.ibai-global-search{position:relative;display:flex;align-items:center}.ibai-global-search input{width:210px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);color:#fff;padding:10px 12px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;outline:none}.ibai-search-results{position:absolute;right:0;top:46px;width:320px;max-height:360px;overflow:auto;border:1px solid var(--line);background:rgba(8,8,8,.96);backdrop-filter:blur(18px);z-index:100;display:none}.ibai-search-results.active{display:block}.ibai-search-result{padding:12px;border-bottom:1px solid var(--line);cursor:pointer}.ibai-search-result:hover{background:rgba(255,255,255,.07)}.trash-grid{display:grid;gap:10px}.trash-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;border:1px solid var(--line);background:rgba(255,255,255,.03);padding:12px}.empty-state{border:1px solid var(--line);padding:24px;color:var(--muted);background:rgba(255,255,255,.025)}
      @media(max-width:900px){.task-board{grid-template-columns:1fr}.ibai-global-search input{width:150px}.ibai-search-results{right:auto;left:0;width:280px}}
    `;
    document.head.appendChild(style);
  }

  function makeSideButton(id, es, en){
    const btn=document.createElement('button');
    btn.className='side-btn';
    btn.dataset.section=id;
    btn.innerHTML=`<span data-en>${en}</span><span data-es>${es}</span><span class="side-dot"></span>`;
    btn.addEventListener('click',()=>showProductivitySection(id));
    return btn;
  }

  function showProductivitySection(id){
    $$('.section').forEach(s=>s.classList.toggle('active',s.id===id));
    $$('.side-btn').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
    window.scrollTo({top:0,behavior:'smooth'});
    if(id==='tasks') loadTasks();
    if(id==='trash') loadTrash();
  }

  function injectSections(){
    const main=$('.main');
    const sidebar=$('.sidebar');
    if(!main || !sidebar) return;
    if(!$('#tasks')){
      const tasks=document.createElement('section');
      tasks.className='section';
      tasks.id='tasks';
      tasks.innerHTML=`
        <div class="hero" style="--hero-img:url('img/work_N.JPG')"><div class="hero-inner"><div><div class="eyebrow"><span data-en>Tasks</span><span data-es>Tareas pendientes</span></div><h1><span data-en>Work <em>board</em></span><span data-es>Panel de <em>tareas</em></span></h1><p><span data-en>Create your own operational tasks and mark them pending, in progress or completed.</span><span data-es>Crea tus propias tareas de trabajo y márcalas como pendientes, en proceso o finalizadas.</span></p></div><div class="hero-actions"><button class="btn primary" id="new-task-focus"><span data-en>New task</span><span data-es>Nueva tarea</span></button></div></div></div>
        <div class="task-board"><div class="card pad"><div class="section-title"><div><h2><span data-en>Task list</span><span data-es>Lista de tareas</span></h2><p><span data-en>Red pending, yellow in progress, green completed.</span><span data-es>Rojo pendiente, amarillo en proceso, verde finalizado.</span></p></div></div><div class="list" id="tasks-list"><div class="empty-state">Loading tasks...</div></div></div>
        <div class="card pad"><h2><span data-en>Create task</span><span data-es>Crear tarea</span></h2><div class="task-form"><div class="field"><label>Tarea</label><input id="task-title" placeholder="Subir fotos Alavés vs Rayo"></div><div class="field"><label>Estado</label><select id="task-status"><option value="pending">Rojo · Pendiente</option><option value="in_progress">Amarillo · En proceso</option><option value="done">Verde · Finalizado</option></select></div><div class="field"><label>Fecha límite</label><input id="task-due-date" type="date"></div><div class="field"><label>Cliente</label><select id="task-client"><option value="">Sin cliente</option></select></div><div class="field"><label>Galería</label><select id="task-gallery"><option value="">Sin galería</option></select></div><div class="field"><label>Notas</label><textarea id="task-notes" placeholder="Notas internas de trabajo"></textarea></div><button class="btn primary" id="create-task-submit">Crear tarea</button><p class="row-meta" id="task-status-msg"></p></div></div></div>`;
      main.appendChild(tasks);
    }
    if(!$('#trash')){
      const trash=document.createElement('section');
      trash.className='section';
      trash.id='trash';
      trash.innerHTML=`<div class="hero" style="--hero-img:url('img/work_R.jpg')"><div class="hero-inner"><div><div class="eyebrow"><span data-en>Trash</span><span data-es>Papelera</span></div><h1><span data-en>Recovery <em>area</em></span><span data-es>Zona de <em>recuperación</em></span></h1><p><span data-en>Recover clients, galleries and photos moved to trash.</span><span data-es>Recupera clientes, galerías y fotos movidas a la papelera.</span></p></div></div></div><div class="card pad"><h2>Papelera</h2><div id="trash-list" class="trash-grid"><div class="empty-state">Loading trash...</div></div></div>`;
      main.appendChild(trash);
    }
    if(!$('.side-btn[data-section="tasks"]')){
      const overview=$('.side-btn[data-section="overview"]');
      overview?.insertAdjacentElement('afterend', makeSideButton('tasks','Tareas','Tasks'));
    }
    if(!$('.side-btn[data-section="trash"]')){
      const settings=$('.side-btn[data-section="settings"]');
      settings?.insertAdjacentElement('beforebegin', makeSideButton('trash','Papelera','Trash'));
    }
  }

  async function populateTaskSelects(){
    const sb=supabaseClient(); if(!sb) return;
    const [clientsRes, galleriesRes]=await Promise.all([
      sb.from('clients').select('id,name,username').order('created_at',{ascending:false}).limit(200),
      sb.from('galleries').select('id,title_es,title_en').order('created_at',{ascending:false}).limit(200)
    ]);
    const csel=$('#task-client');
    if(csel && !clientsRes.error){
      csel.innerHTML='<option value="">Sin cliente</option>' + (clientsRes.data||[]).map(c=>`<option value="${c.id}">${escapeHtml(c.name||c.username||'Cliente')}</option>`).join('');
    }
    const gsel=$('#task-gallery');
    if(gsel && !galleriesRes.error){
      gsel.innerHTML='<option value="">Sin galería</option>' + (galleriesRes.data||[]).map(g=>`<option value="${g.id}">${escapeHtml(g.title_es||g.title_en||'Galería')}</option>`).join('');
    }
  }

  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
  function setMsg(sel,msg){const el=$(sel); if(el) el.textContent=msg||'';}

  async function loadTasks(){
    const sb=supabaseClient(); const list=$('#tasks-list'); if(!list) return;
    if(!sb){list.innerHTML='<div class="empty-state">Supabase config missing.</div>';return;}
    setMsg('#task-status-msg','');
    const {data,error}=await sb.from('app_tasks').select('*, clients(name, username), galleries(title_es,title_en)').order('created_at',{ascending:false}).limit(200);
    if(error){list.innerHTML=`<div class="empty-state">No se pudieron cargar tareas: ${escapeHtml(error.message)}</div>`;return;}
    if(!data || !data.length){list.innerHTML='<div class="empty-state">No hay tareas todavía. Crea la primera tarea a la derecha.</div>';return;}
    list.innerHTML=data.map(t=>{
      const status=t.status||'pending';
      const label=status==='done'?'Finalizado':status==='in_progress'?'En proceso':'Pendiente';
      const client=t.clients?.name||t.clients?.username||'Sin cliente';
      const gallery=t.galleries?.title_es||t.galleries?.title_en||'Sin galería';
      return `<div class="task-row" data-task-id="${t.id}"><span class="task-dot ${status}"></span><div><div class="row-title">${escapeHtml(t.title||'Tarea')}</div><div class="row-meta">${label} · ${escapeHtml(client)} · ${escapeHtml(gallery)}${t.due_date?' · '+escapeHtml(t.due_date):''}</div>${t.notes?`<div class="row-meta">${escapeHtml(t.notes)}</div>`:''}</div><div class="task-actions"><button class="btn" data-task-status="pending">Rojo</button><button class="btn" data-task-status="in_progress">Amarillo</button><button class="btn" data-task-status="done">Verde</button><button class="btn danger" data-task-delete>Eliminar</button></div></div>`;
    }).join('');
  }

  async function createTask(){
    const sb=supabaseClient(); if(!sb) return setMsg('#task-status-msg','Supabase no está configurado.');
    const title=$('#task-title')?.value.trim();
    if(!title) return setMsg('#task-status-msg','Escribe una tarea.');
    const payload={title,status:$('#task-status')?.value||'pending',due_date:$('#task-due-date')?.value||null,client_id:$('#task-client')?.value||null,gallery_id:$('#task-gallery')?.value||null,notes:$('#task-notes')?.value.trim()||null,created_at:nowIso(),updated_at:nowIso()};
    setMsg('#task-status-msg','Guardando tarea...');
    const {error}=await sb.from('app_tasks').insert(payload);
    if(error) return setMsg('#task-status-msg','No se pudo crear: '+error.message);
    ['#task-title','#task-due-date','#task-notes'].forEach(s=>{const el=$(s); if(el) el.value='';});
    setMsg('#task-status-msg','Tarea creada.');
    loadTasks(); logActivity('task_created','Tarea creada',title);
  }

  async function updateTaskStatus(taskId,status){
    const sb=supabaseClient(); if(!sb) return;
    await sb.from('app_tasks').update({status,updated_at:nowIso()}).eq('id',taskId);
    loadTasks();
  }
  async function deleteTask(taskId){
    const sb=supabaseClient(); if(!sb) return;
    if(!confirm('¿Eliminar esta tarea?')) return;
    await sb.from('app_tasks').delete().eq('id',taskId);
    loadTasks();
  }

  async function duplicateClient(clientId){
    const sb=supabaseClient(); if(!sb || !clientId) return;
    const cache=window.IBAI_CLIENTS_CACHE||[];
    let source=cache.find(c=>c.id===clientId);
    if(!source){ const r=await sb.from('clients').select('*').eq('id',clientId).single(); source=r.data; }
    if(!source) return alert('No se encontró el cliente original.');
    const username=prompt('Nuevo usuario para el cliente duplicado:', `${slugify(source.username||source.name)}-copy`);
    if(!username) return;
    const payload={...source};
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    payload.username=username.trim();
    payload.name=`${source.name||source.username} · copia`;
    payload.password_hash=null;
    payload.publish_status='draft';
    payload.created_at=nowIso(); payload.updated_at=nowIso();
    const {error}=await sb.from('clients').insert(payload);
    if(error) return alert('No se pudo duplicar cliente: '+error.message);
    alert('Cliente duplicado. Añade una contraseña nueva antes de publicarlo.');
    window.IBAI_LOAD_CLIENTS?.(); logActivity('client_duplicated','Cliente duplicado',payload.name);
  }

  async function duplicateGallery(galleryId){
    const sb=supabaseClient(); if(!sb || !galleryId) return;
    let source=(window.IBAI_GALLERIES_CACHE||[]).find(g=>g.id===galleryId);
    if(!source){ const r=await sb.from('galleries').select('*, gallery_clients(client_id)').eq('id',galleryId).single(); source=r.data; }
    if(!source) return alert('No se encontró la galería original.');
    const newTitle=prompt('Título de la galería duplicada:', `${source.title_es||source.title_en||'Galería'} · copia`);
    if(!newTitle) return;
    const payload={...source};
    const linked=(source.gallery_clients||[]).map(x=>x.client_id||x.clients?.id).filter(Boolean);
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.gallery_clients;
    payload.title_es=newTitle.trim(); payload.title_en=source.title_en ? `${source.title_en} copy` : newTitle.trim();
    payload.publish_status='draft'; payload.status='created'; payload.created_at=nowIso(); payload.updated_at=nowIso();
    const {data,error}=await sb.from('galleries').insert(payload).select('id').single();
    if(error) return alert('No se pudo duplicar galería: '+error.message);
    if(linked.length){ await sb.from('gallery_clients').insert(linked.map(client_id=>({gallery_id:data.id,client_id}))); }
    alert('Galería duplicada como borrador.');
    window.IBAI_LOAD_GALLERIES?.(); logActivity('gallery_duplicated','Galería duplicada',payload.title_es);
  }

  async function loadTrash(){
    const sb=supabaseClient(); const list=$('#trash-list'); if(!list) return;
    if(!sb){list.innerHTML='<div class="empty-state">Supabase config missing.</div>';return;}
    const items=[];
    for(const table of ['clients','galleries','photos','calendar_events','tasks']){
      const {data,error}=await sb.from(table).select('*').not('deleted_at','is',null).order('deleted_at',{ascending:false}).limit(50);
      if(!error && data){ data.forEach(row=>items.push({table,row})); }
    }
    if(!items.length){list.innerHTML='<div class="empty-state">La papelera está vacía.</div>';return;}
    list.innerHTML=items.map(({table,row})=>`<div class="trash-row" data-trash-table="${table}" data-trash-id="${row.id}"><div><div class="row-title">${escapeHtml(row.name||row.title_es||row.filename||row.username||'Elemento')}</div><div class="row-meta">${table} · ${escapeHtml(row.deleted_at||'')}</div></div><button class="btn primary" data-restore>Restaurar</button><button class="btn danger" data-delete-forever>Borrar definitivamente</button></div>`).join('');
  }
  async function deleteForever(table,id){
    if(!table||!id||!confirm('Borrar definitivamente de Supabase? Esta acción no se puede deshacer.')) return;
    const sb=supabaseClient();
    await sb.from(table).delete().eq('id',id);
    loadTrash(); logActivity('trash_deleted','Elemento borrado definitivamente',table);
  }
  async function restoreTrash(table,id){
    const sb=supabaseClient(); if(!sb) return;
    await sb.from(table).update({deleted_at:null,updated_at:nowIso()}).eq('id',id);
    loadTrash(); logActivity('trash_restored','Elemento restaurado',table);
  }

  async function logActivity(type,title,details){
    const sb=supabaseClient(); if(!sb) return;
    try{ await sb.from('activity_log').insert({type,title,details:details||null,created_at:nowIso()}); }catch(e){}
  }

  function wireEvents(){
    document.addEventListener('click',(e)=>{
      const t=e.target.closest('[data-task-status]'); if(t){ const row=t.closest('[data-task-id]'); updateTaskStatus(row?.dataset.taskId,t.dataset.taskStatus); }
      const del=e.target.closest('[data-task-delete]'); if(del){ const row=del.closest('[data-task-id]'); deleteTask(row?.dataset.taskId); }
      const rest=e.target.closest('[data-restore]'); if(rest){ const row=rest.closest('[data-trash-id]'); restoreTrash(row?.dataset.trashTable,row?.dataset.trashId); }
      const del=e.target.closest('[data-delete-forever]'); if(del){ const row=del.closest('[data-trash-id]'); deleteForever(row?.dataset.trashTable,row?.dataset.trashId); }
      const btn=e.target.closest('button');
      if(btn && /duplicar|duplicate/i.test(btn.innerText||'') && !btn.dataset.ibaiDuplicateBound){
        const clientRow=btn.closest('[data-client-id]'); const galleryRow=btn.closest('[data-gallery-id]');
        if(clientRow){ e.preventDefault(); duplicateClient(clientRow.dataset.clientId); }
        else if(galleryRow){ e.preventDefault(); duplicateGallery(galleryRow.dataset.galleryId); }
      }
    });
    $('#create-task-submit')?.addEventListener('click',createTask);
    $('#new-task-focus')?.addEventListener('click',()=>$('#task-title')?.focus());
  }

  async function init(){
    injectStyles(); injectSections(); wireEvents();
    await sleep(400);
    populateTaskSelects();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
