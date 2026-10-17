(()=>{
 const track=document.querySelector('#carousel-track'); const windowEl=document.querySelector('#carousel-window');
 const dots=[...document.querySelectorAll('.dots .dot')];let active=0,downX=null;
 const update=(i)=>{active=(i+dots.length)%dots.length;track.style.transform=`translateX(-${active*100}%)`;dots.forEach((d,n)=>{d.classList.toggle('active',n===active);if(n===active)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')})};
 document.querySelector('.carousel-btn.prev')?.addEventListener('click',()=>update(active-1));document.querySelector('.carousel-btn.next')?.addEventListener('click',()=>update(active+1));
 dots.forEach((d,n)=>d.addEventListener('click',()=>update(n)));
 windowEl?.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();update(active-1)}if(e.key==='ArrowRight'){e.preventDefault();update(active+1)}});
 windowEl?.addEventListener('touchstart',e=>{downX=e.touches[0].clientX},{passive:true});windowEl?.addEventListener('touchend',e=>{if(downX===null)return;const delta=e.changedTouches[0].clientX-downX;if(Math.abs(delta)>40)update(active+(delta<0?1:-1));downX=null},{passive:true});
})();

/* Data do dia no Brasil, actualizada à meia-noite de São Paulo. */
(()=>{
 const dateNode=document.getElementById('offer-current-date');
 if(!dateNode)return;
 const timeZone='America/Sao_Paulo';
 const monthFormatter=new Intl.DateTimeFormat('pt-BR',{timeZone,day:'numeric',month:'long'});
 const isoFormatter=new Intl.DateTimeFormat('pt-BR',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
 const refreshDate=()=>{
   const now=new Date();
   const label=monthFormatter.format(now);
   const pieces=Object.fromEntries(isoFormatter.formatToParts(now).filter(p=>p.type==='day'||p.type==='month'||p.type==='year').map(p=>[p.type,p.value]));
   dateNode.textContent=label;
   dateNode.dateTime=pieces.year+'-'+pieces.month+'-'+pieces.day;
 };
 refreshDate();
 setInterval(refreshDate,30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDate()});
 window.addEventListener('focus',refreshDate);
 window.addEventListener('pageshow',refreshDate);
})();


/* Carrega o vídeo apenas perto da secção; autoplay silencioso quando visível. */
(()=>{
 const video=document.getElementById('demo-video');
 const source=video?.querySelector('source[data-src]');
 if(!video||!source)return;
 let loaded=false;
 const loadVideo=()=>{
   if(loaded)return;
   loaded=true;
   source.src=source.dataset.src;
   video.load();
 };
 const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const saveData=navigator.connection?.saveData===true;
 if(!('IntersectionObserver' in window)){
   video.addEventListener('pointerdown',loadVideo,{once:true});
   video.addEventListener('focus',loadVideo,{once:true});
   return;
 }
 const prepare=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){
     loadVideo();
     prepare.disconnect();
   }
 },{rootMargin:'450px 0px',threshold:0});
 prepare.observe(video);
 const playback=new IntersectionObserver(entries=>{
   for(const entry of entries){
     if(entry.isIntersecting){
       loadVideo();
       if(!reducedMotion&&!saveData&&!video.ended){
         const task=video.play();
         task?.catch(()=>{/* Navegador pode impedir autoplay; controlos permanecem visíveis. */});
       }
     }else if(!video.paused){
       video.pause();
     }
   }
 },{threshold:0.45});
 playback.observe(video);
})();
