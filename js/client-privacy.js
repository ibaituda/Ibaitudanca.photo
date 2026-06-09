(function(){
  const SESSION_KEY='ibaiClientSession';
  const ADMIN_KEY='ibaiAdminSession';
  const qs=new URLSearchParams(location.search);
  const adminPreview=qs.get('preview')==='1'||qs.get('adminPreview')==='1';
  function sb(){return window.supabase&&window.IBAI_SUPABASE_URL&&window.IBAI_SUPABASE_ANON_KEY?window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY):null;}
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
  function clientSession(){return read(SESSION_KEY)}
  function adminSession(){return read(ADMIN_KEY)}
  function goLogin(){localStorage.removeItem(SESSION_KEY); location.replace('clientes.html');}
  async function validAdminPreview(){
    if(!adminPreview) return false;
    const a=adminSession(); if(!a?.username) return false;
    const client=sb(); if(!client) return false;
    const {data,error}=await client.from('admin_users').select('id,active').eq('username',a.username).maybeSingle();
    return !error && data && data.active!==false;
  }
  async function guardDashboard(){
    if(await validAdminPreview()) return;
    const client=sb(); const s=clientSession(); if(!client||!s?.id){goLogin();return;}
    const {data,error}=await client.from('clients').select('id,active,deleted_at').eq('id',s.id).maybeSingle();
    if(error||!data||data.active===false||data.deleted_at){goLogin();return;}
    const requested=qs.get('client');
    if(requested && requested!==s.id && requested!==s.username){goLogin();return;}
  }
  async function guardGallery(){
    if(await validAdminPreview()) return;
    const gid=qs.get('gallery'); const client=sb(); const s=clientSession(); if(!client||!s?.id||!gid){goLogin();return;}
    const {data:g,error:gerr}=await client.from('galleries').select('id,publish_status,deleted_at').eq('id',gid).maybeSingle();
    if(gerr||!g||g.deleted_at||g.publish_status==='draft'){goLogin();return;}
    const {data:link,error:lerr}=await client.from('gallery_clients').select('id').eq('gallery_id',gid).eq('client_id',s.id).maybeSingle();
    if(lerr||!link){goLogin();return;}
  }
  document.addEventListener('DOMContentLoaded',()=>{if(location.pathname.includes('client-dashboard')) guardDashboard(); if(location.pathname.includes('gallery-view')) guardGallery();});
})();
