
(function(){
  "use strict";
  const SESSION_KEY = "ibaiClientSession";
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function lang(){return (localStorage.getItem("ibaiLanguage")||document.documentElement.lang||"es").toLowerCase().startsWith("en")?"en":"es";}
  function t(es,en){return lang()==="es"?es:en;}
  function sb(){
    if(!window.supabase || !window.IBAI_SUPABASE_URL || !window.IBAI_SUPABASE_ANON_KEY) return null;
    if(!window.IBAI_V12_GALLERY_CLIENT){
      window.IBAI_V12_GALLERY_CLIENT=window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY);
    }
    return window.IBAI_V12_GALLERY_CLIENT;
  }
  function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null")}catch{return null}}
  function galleryId(){return new URLSearchParams(location.search).get("gallery");}
  function safeFilename(value, fallback="photo"){
    return String(value||fallback).replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g," ").trim().slice(0,90) || fallback;
  }
  function cards(kind="all"){
    let list=$$(".photo-card").filter(c=>c.style.display!=="none");
    if(kind==="selected") list=list.filter(c=>c.classList.contains("is-selected"));
    if(kind==="favourites") list=list.filter(c=>c.classList.contains("is-fav"));
    return list;
  }
  function cardInfo(card,index){
    const img=card.querySelector("img");
    const id=card.querySelector(".photo-id")?.textContent?.trim() || `photo-${index+1}`;
    return {url:img?.src, name:safeFilename(id)+".jpg"};
  }
  async function logZip(kind,count){
    const client=sb(); const s=session(); const gid=galleryId();
    if(!client||!s?.id||!gid) return;
    try{await client.from("download_logs").insert({client_id:s.id,gallery_id:gid,download_type:kind,size_label:"optimized",photos_count:count,created_at:new Date().toISOString()});}catch(e){}
  }
  async function downloadZip(kind="all"){
    if(!window.JSZip){alert(t("El módulo ZIP todavía no ha cargado. Espera un segundo y vuelve a intentarlo.","ZIP module is still loading. Wait a second and try again."));return;}
    const selectedCards=cards(kind);
    if(!selectedCards.length){alert(t("No hay fotos para descargar.","There are no photos to download."));return;}
    const btn=document.querySelector(`[data-v12-zip="${kind}"]`);
    const old=btn?.textContent;
    if(btn){btn.disabled=true;btn.textContent=t("Preparando ZIP...","Preparing ZIP...");}
    try{
      const zip=new JSZip();
      let added=0;
      for(let i=0;i<selectedCards.length;i++){
        const info=cardInfo(selectedCards[i],i);
        if(!info.url) continue;
        const res=await fetch(info.url,{mode:"cors"});
        if(!res.ok) continue;
        const blob=await res.blob();
        zip.file(info.name,blob);
        added++;
      }
      if(!added){alert(t("No se pudieron descargar las fotos para crear el ZIP.","Could not fetch photos to create the ZIP."));return;}
      const blob=await zip.generateAsync({type:"blob"});
      const objectUrl=URL.createObjectURL(blob);
      const a=document.createElement("a");
      const title=document.querySelector(".hero h1")?.textContent?.trim() || "galeria";
      a.href=objectUrl;
      a.download=safeFilename(title)+"-"+kind+".zip";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(objectUrl),2000);
      await logZip(kind,added);
    }catch(err){
      alert(t("No se pudo crear el ZIP: ","Could not create ZIP: ")+(err?.message||err));
    }finally{
      if(btn){btn.disabled=false;btn.textContent=old;}
    }
  }
  function injectZipButtons(){
    const toolbar=$(".toolbar-right");
    if(!toolbar || toolbar.querySelector("[data-v12-zip]")) return;
    const all=document.createElement("button");
    all.className="btn btn-primary";
    all.type="button";
    all.dataset.v12Zip="all";
    all.textContent=t("Descargar galería ZIP","Download gallery ZIP");
    toolbar.appendChild(all);

    const selected=document.createElement("button");
    selected.className="btn";
    selected.type="button";
    selected.dataset.v12Zip="selected";
    selected.textContent=t("ZIP seleccionadas","Selected ZIP");
    toolbar.appendChild(selected);

    const fav=document.createElement("button");
    fav.className="btn";
    fav.type="button";
    fav.dataset.v12Zip="favourites";
    fav.textContent=t("ZIP favoritas","Favourites ZIP");
    toolbar.appendChild(fav);
  }
  function hookButtons(){
    document.addEventListener("click",(e)=>{
      const btn=e.target.closest("[data-v12-zip]");
      if(!btn) return;
      e.preventDefault();
      downloadZip(btn.dataset.v12Zip||"all");
    });
    // Convert legacy Download all button to full ZIP to avoid opening many browser tabs.
    document.addEventListener("click",(e)=>{
      const btn=e.target.closest('[data-i18n="Download all"]');
      if(!btn || btn.dataset.v12Zip) return;
      e.preventDefault();
      e.stopPropagation();
      downloadZip("all");
    },true);
  }
  document.addEventListener("DOMContentLoaded",()=>{setTimeout(injectZipButtons,900);hookButtons();});
})();
