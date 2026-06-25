
(function(){
  "use strict";
  const BUCKET = "portfolio-images";
  const SESSION_ADMIN_KEY = "ibaiAdminSession";
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function sb(){
    if(!window.supabase || !window.IBAI_SUPABASE_URL || !window.IBAI_SUPABASE_ANON_KEY) return null;
    if(!window.IBAI_V12_ADMIN_CLIENT){
      window.IBAI_V12_ADMIN_CLIENT = window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);
    }
    return window.IBAI_V12_ADMIN_CLIENT;
  }
  function lang(){ return document.body?.getAttribute("data-lang") || localStorage.getItem("ibaiLang") || "es"; }
  function t(es,en){ return lang()==="es" ? es : en; }
  function nowIso(){ return new Date().toISOString(); }

  function parseStoragePath(url){
    if(!url || typeof url !== "string") return null;
    try{
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const idx = url.indexOf(marker);
      if(idx >= 0) return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
      // fallback for object/sign URLs
      const marker2 = `/${BUCKET}/`;
      const idx2 = url.indexOf(marker2);
      if(idx2 >= 0) return decodeURIComponent(url.slice(idx2 + marker2.length).split("?")[0]);
    }catch(e){}
    return null;
  }
  function storagePathsFromRow(row){
    if(!row) return [];
    const keys = ["original_url","large_url","preview_url","retouched_url","cover_image_url","hero_image_url","profile_image_url"];
    return [...new Set(keys.map(k=>parseStoragePath(row[k])).filter(Boolean))];
  }
  async function removeStoragePaths(client, paths){
    const unique=[...new Set((paths||[]).filter(Boolean))];
    if(!unique.length) return {removed:0,error:null};
    const {error} = await client.storage.from(BUCKET).remove(unique);
    return {removed:error?0:unique.length,error};
  }
  async function logActivity(type,title,details){
    const client=sb(); if(!client) return;
    try{ await client.from("activity_log").insert({type,title,details,created_at:nowIso()}); }catch(e){}
  }

  async function cleanupPhoto(client, photoId){
    const {data:photo,error:loadError}=await client.from("photos").select("*").eq("id",photoId).maybeSingle();
    if(loadError) throw loadError;
    if(photo){
      await removeStoragePaths(client, storagePathsFromRow(photo));
      await client.from("favourites").delete().eq("photo_id",photoId);
      await client.from("selections").delete().eq("photo_id",photoId);
      await client.from("retouch_requests").delete().eq("photo_id",photoId);
      await client.from("download_logs").delete().eq("photo_id",photoId);
    }
    const {error}=await client.from("photos").delete().eq("id",photoId);
    if(error) throw error;
  }

  async function cleanupGallery(client, galleryId){
    const {data:gallery}=await client.from("galleries").select("*").eq("id",galleryId).maybeSingle();
    const {data:photos,error:photoError}=await client.from("photos").select("*").eq("gallery_id",galleryId);
    if(photoError) throw photoError;
    const photoIds=(photos||[]).map(p=>p.id);
    const storagePaths=[
      ...storagePathsFromRow(gallery),
      ...(photos||[]).flatMap(storagePathsFromRow)
    ];
    await removeStoragePaths(client, storagePaths);
    if(photoIds.length){
      await client.from("favourites").delete().in("photo_id",photoIds);
      await client.from("selections").delete().in("photo_id",photoIds);
    }
    await client.from("retouch_requests").delete().eq("gallery_id",galleryId);
    await client.from("download_logs").delete().eq("gallery_id",galleryId);
    await client.from("photos").delete().eq("gallery_id",galleryId);
    await client.from("gallery_clients").delete().eq("gallery_id",galleryId);
    const {error}=await client.from("galleries").delete().eq("id",galleryId);
    if(error) throw error;
  }

  async function cleanupClient(client, clientId){
    const {data:clientRow}=await client.from("clients").select("*").eq("id",clientId).maybeSingle();
    await removeStoragePaths(client, storagePathsFromRow(clientRow));
    await client.from("favourites").delete().eq("client_id",clientId);
    await client.from("selections").delete().eq("client_id",clientId);
    await client.from("retouch_requests").delete().eq("client_id",clientId);
    await client.from("download_logs").delete().eq("client_id",clientId);
    await client.from("gallery_clients").delete().eq("client_id",clientId);
    await client.from("app_tasks").delete().eq("client_id",clientId);
    const {error}=await client.from("clients").delete().eq("id",clientId);
    if(error) throw error;
  }

  async function cleanupRow(table,id){
    const client=sb(); if(!client) throw new Error("Supabase no configurado.");
    if(table==="photos") return cleanupPhoto(client,id);
    if(table==="galleries") return cleanupGallery(client,id);
    if(table==="clients") return cleanupClient(client,id);
    if(table==="calendar_events" || table==="app_tasks" || table==="admin_users"){
      const {error}=await client.from(table).delete().eq("id",id);
      if(error) throw error;
      return;
    }
    const {error}=await client.from(table).delete().eq("id",id);
    if(error) throw error;
  }

  async function restoreRow(table,id){
    const client=sb(); if(!client) throw new Error("Supabase no configurado.");
    const {error}=await client.from(table).update({deleted_at:null,updated_at:nowIso()}).eq("id",id);
    if(error) throw error;
  }

  function patchTrashButtons(){
    // Capture phase: override older deleteForever handlers so permanent delete also removes Storage objects.
    document.addEventListener("click", async (event)=>{
      const deleteBtn = event.target.closest("[data-delete-forever]");
      const restoreBtn = event.target.closest("[data-restore]");
      if(!deleteBtn && !restoreBtn) return;
      const row = event.target.closest("[data-trash-table][data-trash-id]");
      if(!row) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const table=row.dataset.trashTable;
      const id=row.dataset.trashId;
      try{
        if(restoreBtn){
          await restoreRow(table,id);
          row.remove();
          await logActivity("trash_restored","Elemento restaurado",`${table} · ${id}`);
        }else{
          const ok=confirm(t("Borrar definitivamente? También se eliminarán archivos asociados en Storage cuando corresponda.","Delete forever? Related Storage files will also be removed when possible."));
          if(!ok) return;
          deleteBtn.disabled=true;
          deleteBtn.textContent=t("Borrando...","Deleting...");
          await cleanupRow(table,id);
          row.remove();
          await logActivity("trash_deleted","Elemento borrado definitivamente",`${table} · ${id}`);
        }
        if(window.IBAI_REFRESH_OVERVIEW) window.IBAI_REFRESH_OVERVIEW();
      }catch(err){
        alert(t("No se pudo completar la acción: ","Could not complete action: ")+(err?.message||err));
        if(deleteBtn){deleteBtn.disabled=false; deleteBtn.textContent=t("Borrar definitivamente","Delete forever");}
      }
    }, true);
  }

  function enhanceLogout(){
    document.addEventListener("click",(event)=>{
      const btn=event.target.closest(".logout,[data-logout],#admin-logout,#logout-btn");
      if(!btn) return;
      event.preventDefault();
      try{
        localStorage.removeItem(SESSION_ADMIN_KEY);
        localStorage.removeItem("ibaiAdminUser");
        sessionStorage.clear();
      }catch(e){}
      location.href="/admin-login";
    }, true);
  }

  function addClientFilters(){
    // Lightweight filters for admin sections. Does not replace existing lists, only adds a helper for quick filtering by visible text.
    ["clients","galleries","downloads"].forEach(sectionId=>{
      const section=document.getElementById(sectionId);
      if(!section || section.querySelector(".v12-local-filter")) return;
      const host=section.querySelector(".tabs") || section.querySelector(".hero");
      if(!host) return;
      const wrap=document.createElement("div");
      wrap.className="v12-local-filter";
      wrap.style.cssText="margin:14px 0;display:flex;gap:10px;align-items:center";
      wrap.innerHTML=`<input type="search" placeholder="${t("Filtrar esta sección","Filter this section")}" style="background:#101010;border:1px solid rgba(255,255,255,.14);color:#fff;padding:11px 12px;width:min(320px,100%);font-size:12px"><span class="row-meta">${t("Filtro local rápido","Quick local filter")}</span>`;
      host.insertAdjacentElement("afterend",wrap);
      const input=wrap.querySelector("input");
      input.addEventListener("input",()=>{
        const q=input.value.trim().toLowerCase();
        section.querySelectorAll(".list-row,.trash-row").forEach(row=>{
          row.style.display= !q || row.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    });
  }

  function init(){
    patchTrashButtons();
    enhanceLogout();
    setTimeout(addClientFilters,1000);
  }
  document.addEventListener("DOMContentLoaded",init);
})();
