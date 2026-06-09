(function(){
  const $=(s,r=document)=>r.querySelector(s);
  function sb(){return window.supabase&&window.IBAI_SUPABASE_URL&&window.IBAI_SUPABASE_ANON_KEY?window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY):null;}
  function addButtons(){
    document.querySelectorAll('[data-client-id]').forEach(row=>{ if(row.querySelector('[data-trash-client]')) return; const actions=row.querySelector('.row-actions'); if(actions){const id=row.dataset.clientId; const b=document.createElement('button');b.className='btn danger';b.dataset.trashClient=id;b.innerHTML='<span data-en>Delete</span><span data-es>Borrar</span>';actions.appendChild(b);} });
    document.querySelectorAll('[data-gallery-id]').forEach(row=>{ if(row.querySelector('[data-trash-gallery]')) return; const actions=row.querySelector('.row-actions'); if(actions){const id=row.dataset.galleryId; const b=document.createElement('button');b.className='btn danger';b.dataset.trashGallery=id;b.innerHTML='<span data-en>Delete</span><span data-es>Borrar</span>';actions.appendChild(b);} });
  }
  async function trash(table,id){const client=sb(); if(!client||!id)return; const label=table==='clients'?'cliente':table==='galleries'?'galería':'elemento'; if(!confirm(`Enviar ${label} a la papelera?`))return; await client.from(table).update({deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id); location.reload();}
  function logout(){localStorage.removeItem('ibaiAdminSession');localStorage.removeItem('ibaiClientSession');sessionStorage.clear();location.href='admin-login.html';}
  document.addEventListener('click',e=>{const c=e.target.closest('[data-trash-client]'); if(c){trash('clients',c.dataset.trashClient);return;} const g=e.target.closest('[data-trash-gallery]'); if(g){trash('galleries',g.dataset.trashGallery);return;} const out=e.target.closest('#admin-logout,.logout,[data-admin-logout]'); if(out && location.pathname.includes('admin-panel')){e.preventDefault();logout();}});
  const mo=new MutationObserver(addButtons); document.addEventListener('DOMContentLoaded',()=>{addButtons(); mo.observe(document.body,{childList:true,subtree:true});});
})();
