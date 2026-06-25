(function(){
  const SESSION_KEY='ibaiClientSession';
  const qs=new URLSearchParams(location.search);
  const adminPreview=qs.get('preview')==='1'||qs.get('adminPreview')==='1';
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
  function goLogin(){localStorage.removeItem(SESSION_KEY); location.replace('/client-access');}
  document.addEventListener('DOMContentLoaded',()=>{
    const path=location.pathname;
    if(adminPreview) return;
    if(path.includes('client-dashboard')){
      const session=read(SESSION_KEY);
      const requested=qs.get('client');
      if(!session?.id && !requested){goLogin();}
    }
    if(path.includes('gallery-view')){
      const session=read(SESSION_KEY);
      if(!session?.id && !qs.get('gallery')){goLogin();}
    }
  });
})();
