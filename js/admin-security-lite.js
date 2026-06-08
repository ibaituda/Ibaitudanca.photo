(function(){
  const OWNER_USERNAMES=['ibai-admin','ibaituda','owner'];
  function session(){try{return JSON.parse(localStorage.getItem('ibaiAdminSession')||'null')}catch{return null}}
  function isOwner(s){return s && (s.role==='owner' || OWNER_USERNAMES.includes((s.username||'').toLowerCase()))}
  function apply(){
    const s=session(); if(!s) return;
    const owner=isOwner(s);
    document.body.dataset.adminRole=owner?'owner':(s.role||'editor');
    const roleEl=document.getElementById('admin-session-status');
    if(roleEl) roleEl.textContent=`${s.name||s.username} · ${owner?'OWNER':(s.role||'EDITOR').toUpperCase()}`;
    if(!owner){
      document.querySelectorAll('[data-section="admins"],[data-section="settings"]').forEach(el=>{el.style.display='none'});
      document.querySelectorAll('#admins,#settings').forEach(el=>{el.dataset.locked='true'});
    }
    document.querySelectorAll('[data-edit-admin]').forEach(btn=>{ if(!owner) btn.disabled=true; });
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,500));
  document.addEventListener('click',e=>{
    const s=session(); if(!s || isOwner(s)) return;
    if(e.target.closest('[data-section="admins"], [data-section="settings"], #create-admin-submit, #save-edit-admin')){
      e.preventDefault(); e.stopPropagation(); alert('Solo el Owner puede modificar administradores o ajustes críticos.');
    }
  },true);
})();
