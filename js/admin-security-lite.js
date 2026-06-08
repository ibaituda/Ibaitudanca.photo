(function(){
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function session(){try{return JSON.parse(localStorage.getItem('ibaiAdminSession')||'null')}catch{return null}}
  function isOwner(){return (session()?.role||'owner').toLowerCase()==='owner'}
  function applyRole(){
    const s=session(); if(!s)return;
    const role=(s.role||'owner').toUpperCase();
    const name=$('#admin-hero-name'); if(name && !name.dataset.roleEnhanced){name.textContent=(s.name||s.username||'Admin')+' · '+role; name.dataset.roleEnhanced='1';}
    if(!isOwner()){
      $$('[data-section-link="admins"], [data-section="admins"], [data-section-link="settings"], [data-section="settings"]').forEach(el=>{el.style.display='none';});
      $$('[data-change-client-password], #create-admin-submit, #save-edit-admin').forEach(el=>{el.disabled=true; el.title='Only owner can use this action';});
    }
  }
  document.addEventListener('DOMContentLoaded',applyRole);
  document.addEventListener('click',()=>setTimeout(applyRole,50),true);
})();
