(function(){
  const SESSION_KEY='ibaiClientSession';
  const qs=new URLSearchParams(location.search);
  const isPreview=qs.get('preview')==='1'||qs.get('adminPreview')==='1';
  function sb(){return window.supabase&&window.IBAI_SUPABASE_URL&&window.IBAI_SUPABASE_ANON_KEY?window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY):null;}
  function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
  function goLogin(){location.replace('clientes.html');}
  function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v||'')}
  async function guardDashboard(){
    if(isPreview) return;
    const client=sb(); const s=session(); if(!client||!s?.id){goLogin();return;}
    const {data,error}=await client.from('clients').select('id,active,publish_status').eq('id',s.id).maybeSingle();
    if(error||!data||data.active===false||data.publish_status!=='published'){localStorage.removeItem(SESSION_KEY);goLogin();return;}
  }
  async function guardGallery(){
    if(isPreview) return;
    const gid=qs.get('gallery'); const client=sb(); const s=session(); if(!client||!s?.id||!gid){goLogin();return;}
    const {data:g,error:gerr}=await client.from('galleries').select('id,publish_status,status').eq('id',gid).maybeSingle();
    if(gerr||!g||g.publish_status!=='published'){goLogin();return;}
    const {data:link,error:lerr}=await client.from('gallery_clients').select('id').eq('gallery_id',gid).eq('client_id',s.id).maybeSingle();
    if(lerr||!link){goLogin();return;}
  }
  document.addEventListener('DOMContentLoaded',()=>{if(location.pathname.includes('client-dashboard')) guardDashboard(); if(location.pathname.includes('gallery-view')) guardGallery();});
})();
