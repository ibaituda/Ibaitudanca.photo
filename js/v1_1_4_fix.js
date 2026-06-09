(function(){
  "use strict";
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function cleanupAdmin(){
    $$('.admin-search,.ibai-global-search,.ibai-search-results').forEach(el=>el.remove());
    // Ensure trash menu is readable if productivity script inserts it late.
    $$('.side-btn[data-section="trash"]').forEach(btn=>{
      const es=btn.querySelector('[data-es]'); const en=btn.querySelector('[data-en]');
      if(es) es.textContent='Papelera'; if(en) en.textContent='Trash';
      btn.style.minHeight='39px'; btn.style.padding='10px 12px';
    });
    const side=$('.sidebar'); if(side){side.style.maxHeight='calc(100vh - 120px)'; side.style.overflowY='auto';}
    // Convert any old one-line calendar legend into a visual legend if admin-extras did not rerender yet.
    const cal=$('#calendar');
    if(cal && !cal.querySelector('.calendar-legend-v114')){
      const old=cal.querySelector('.status-legend');
      if(old){
        old.outerHTML=`<div class="calendar-legend-v114"><div class="legend-row"><i class="legend-dot yellow"></i><div><strong>Pendiente</strong><span>Evento creado, pendiente de confirmar o preparar.</span></div></div><div class="legend-row"><i class="legend-dot green"></i><div><strong>Confirmado</strong><span>Evento confirmado y listo para cubrir.</span></div></div><div class="legend-row"><i class="legend-dot blue"></i><div><strong>En cobertura</strong><span>Trabajo activo: evento en curso o fotos en proceso.</span></div></div><div class="legend-row"><i class="legend-dot green"></i><div><strong>Finalizado</strong><span>Cobertura terminada y entregada.</span></div></div><div class="legend-row"><i class="legend-dot red"></i><div><strong>Cancelado</strong><span>Evento cancelado o descartado.</span></div></div></div>`;
      }
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{cleanupAdmin(); setTimeout(cleanupAdmin,400); setTimeout(cleanupAdmin,1200);});
  document.addEventListener('click',()=>setTimeout(cleanupAdmin,80),true);
})();
