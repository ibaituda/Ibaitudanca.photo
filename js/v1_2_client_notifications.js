
(function(){
  "use strict";
  const SESSION_KEY="ibaiClientSession";
  const $=(s,r=document)=>r.querySelector(s);
  function sb(){if(!window.supabase||!window.IBAI_SUPABASE_URL||!window.IBAI_SUPABASE_ANON_KEY)return null;if(!window.IBAI_V12_CLIENT_NOTIFY)window.IBAI_V12_CLIENT_NOTIFY=window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY);return window.IBAI_V12_CLIENT_NOTIFY;}
  function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null")}catch{return null}}
  function lang(){return (localStorage.getItem("ibaiLanguage")||document.documentElement.lang||"es").toLowerCase().startsWith("en")?"en":"es"}
  function t(es,en){return lang()==="es"?es:en}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  async function loadRetouchDone(){
    const client=sb(); const s=session(); if(!client||!s?.id)return;
    const {data,error}=await client.from("retouch_requests")
      .select("id,message,status,updated_at,photos(filename,preview_url,large_url,original_url),galleries(title_es,title_en)")
      .eq("client_id",s.id)
      .eq("status","done")
      .order("updated_at",{ascending:false})
      .limit(5);
    if(error||!data||!data.length)return;
    if($("#v12-retouch-done-card"))return;
    const target=$(".galleries-section")||$(".client-dashboard")||$("main")||document.body;
    const card=document.createElement("section");
    card.className="license-box";
    card.id="v12-retouch-done-card";
    card.style.margin="22px auto";
    card.style.maxWidth="1480px";
    card.innerHTML=`
      <h3>${t("Retoques completados","Completed edits")}</h3>
      <p>${t("Estas solicitudes ya han sido revisadas y actualizadas por Ibai.","These requests have been reviewed and updated by Ibai.")}</p>
      <div class="summary-list" style="margin-top:14px">
        ${data.map(r=>{
          const photo=r.photos||{}; const gallery=r.galleries||{};
          return `<div class="summary-row"><span>${esc(gallery.title_es||gallery.title_en||t("Galería","Gallery"))}</span><strong>${esc(photo.filename||t("Foto retocada","Edited photo"))}</strong></div>`;
        }).join("")}
      </div>`;
    target.parentNode ? target.parentNode.insertBefore(card,target) : document.body.appendChild(card);
  }
  document.addEventListener("DOMContentLoaded",()=>setTimeout(loadRetouchDone,1200));
})();
