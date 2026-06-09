(function(){
  const SESSION_KEY='ibaiClientSession';
  const $=(s,r=document)=>r.querySelector(s);
  function sb(){return window.supabase&&window.IBAI_SUPABASE_URL&&window.IBAI_SUPABASE_ANON_KEY?window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY):null;}
  function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
  async function sha256(value){const data=new TextEncoder().encode(value||'');const hash=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');}
  function inject(){
    if($('#client-password-card')) return;
    const license=$('#license')||document.querySelector('.license'); if(!license) return;
    const card=document.createElement('div'); card.className='license-box'; card.id='client-password-card';
    card.innerHTML='<h3>Cambiar contraseña</h3><p style="margin-bottom:12px">Puedes cambiar tu contraseña de acceso privado. El administrador podrá resetearla si la pierdes.</p><div style="display:grid;gap:10px"><input id="client-current-password" type="password" placeholder="Contraseña actual" style="background:#111;border:1px solid rgba(255,255,255,.14);color:#fff;padding:12px"><input id="client-new-password" type="password" placeholder="Nueva contraseña" style="background:#111;border:1px solid rgba(255,255,255,.14);color:#fff;padding:12px"><button class="btn btn-primary" id="client-change-password" type="button">Guardar contraseña</button><p class="row-meta" id="client-password-status"></p></div>';
    license.appendChild(card);
    $('#client-change-password')?.addEventListener('click',changePassword);
  }
  async function changePassword(){
    const supa=sb(); const s=session(); const status=$('#client-password-status');
    if(!supa||!s?.id){ if(status)status.textContent='Sesión no disponible.'; return; }
    const current=$('#client-current-password')?.value||''; const next=$('#client-new-password')?.value||'';
    if(next.length<6){ if(status)status.textContent='La nueva contraseña debe tener al menos 6 caracteres.'; return; }
    const {data,error}=await supa.from('clients').select('password_hash').eq('id',s.id).maybeSingle();
    if(error||!data){ if(status)status.textContent='No se pudo comprobar la contraseña.'; return; }
    const currentHash=await sha256(current);
    if(data.password_hash && data.password_hash!==currentHash){ if(status)status.textContent='La contraseña actual no es correcta.'; return; }
    const newHash=await sha256(next);
    const {error:updateError}=await supa.from('clients').update({password_hash:newHash,updated_at:new Date().toISOString()}).eq('id',s.id);
    if(status) status.textContent=updateError?updateError.message:'Contraseña actualizada correctamente.';
    if(!updateError){ $('#client-current-password').value=''; $('#client-new-password').value=''; }
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(inject,800));
})();
