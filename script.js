/* Galeria: reprodução automática lenta, swipe e controlo manual. */
(()=>{
 const track=document.getElementById('carousel-track');
 const viewport=document.getElementById('carousel-window');
 if(!track||!viewport)return;
 const slides=[...track.querySelectorAll('.slide')];
 const dots=[...document.querySelectorAll('.gallery-section .dots .dot')];
 const prev=document.querySelector('.gallery-section .carousel-btn.prev');
 const next=document.querySelector('.gallery-section .carousel-btn.next');
 const total=slides.length;
 if(total<2)return;
 const duplicate=slides[0].cloneNode(true);
 duplicate.setAttribute('aria-hidden','true');
 duplicate.querySelector('img')?.setAttribute('loading','lazy');
 duplicate.querySelector('figcaption')?.setAttribute('aria-hidden','true');
 track.appendChild(duplicate);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let idx=0,timer=null,moving=false,visible=!('IntersectionObserver' in window),touchX=null;
 const pause=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
 const setIndex=(animated=true)=>{
   track.style.transition=animated&&!reduced?'transform 1050ms cubic-bezier(.35,.05,.23,1)':'none';
   track.style.transform='translate3d('+(-idx*100)+'%,0,0)';
   const current=idx%total;
   dots.forEach((dot,n)=>{
     dot.classList.toggle('active',n===current);
     if(n===current)dot.setAttribute('aria-current','true');
     else dot.removeAttribute('aria-current');
   });
 };
 const shift=delta=>{
   if(moving)return;
   if(delta<0&&idx===0){
     idx=total;setIndex(false);
     requestAnimationFrame(()=>requestAnimationFrame(()=>{
       idx=total-1;moving=!reduced;setIndex(true);
     }));
     return;
   }
   idx+=delta;
   moving=!reduced;
   setIndex(true);
   if(reduced&&idx>=total){idx=0;setIndex(false);}
 };
 const autoplay=()=>{
   pause();
   if(!visible||document.hidden||reduced)return;
   timer=setInterval(()=>shift(1),7700);
 };
 track.addEventListener('transitionend',event=>{
   if(event.target!==track||event.propertyName!=='transform')return;
   moving=false;
   if(idx>=total){idx=0;setIndex(false);}
 });
 prev?.addEventListener('click',()=>{shift(-1);autoplay();});
 next?.addEventListener('click',()=>{shift(1);autoplay();});
 dots.forEach((dot,n)=>dot.addEventListener('click',()=>{
   if(moving||idx%total===n)return;
   idx=n;moving=!reduced;setIndex(true);autoplay();
 }));
 viewport.addEventListener('keydown',event=>{
   if(event.key==='ArrowLeft'){event.preventDefault();shift(-1);autoplay();}
   if(event.key==='ArrowRight'){event.preventDefault();shift(1);autoplay();}
 });
 viewport.addEventListener('touchstart',event=>{touchX=event.changedTouches[0].clientX;pause();},{passive:true});
 viewport.addEventListener('touchend',event=>{
   if(touchX===null)return;
   const delta=event.changedTouches[0].clientX-touchX;
   touchX=null;
   if(Math.abs(delta)>45)shift(delta<0?1:-1);
   autoplay();
 },{passive:true});
 viewport.addEventListener('touchcancel',()=>{touchX=null;autoplay();},{passive:true});
 document.addEventListener('visibilitychange',autoplay);
 if('IntersectionObserver' in window){
   new IntersectionObserver(entries=>{
     visible=entries.some(x=>x.isIntersecting);
     autoplay();
   },{threshold:0.12}).observe(viewport);
 }
 setIndex(false);autoplay();
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



/* Depoimentos completos: autoplay lento + swipe sem truncar as imagens. */
(()=>{
 const root=document.querySelector('[data-proof-carousel]');
 if(!root)return;
 const track=root.querySelector('[data-proof-track]');
 const viewport=root.querySelector('[data-proof-window]');
 const slides=[...root.querySelectorAll('[data-proof-slide]')];
 const dots=[...root.querySelectorAll('[data-proof-dot]')];
 const prev=root.querySelector('[data-proof-prev]');
 const next=root.querySelector('[data-proof-next]');
 const total=slides.length;
 if(total<2||!track||!viewport)return;
 for(const slide of slides.slice(0,2)){
   const clone=slide.cloneNode(true);
   clone.removeAttribute('data-proof-slide');
   clone.setAttribute('aria-hidden','true');
   clone.classList.add('proof-clone');
   clone.querySelector('img')?.setAttribute('loading','lazy');
   track.appendChild(clone);
 }
 const all=[...track.children];
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let idx=0,timer=null,moving=false,visible=!('IntersectionObserver' in window),touchX=null;
 const countVisible=()=>window.matchMedia('(max-width:720px)').matches?1:2;
 const stride=()=>slides[0].getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap||'0');
 const resize=()=>{
   const current=all.slice(idx,idx+countVisible());
   if(!current.length)return;
   const height=Math.max(...current.map(el=>el.getBoundingClientRect().height));
   if(height>0)viewport.style.height=Math.ceil(height+10)+'px';
 };
 const draw=(smooth=true)=>{
   track.style.transition=smooth&&!reduced?'transform 1100ms cubic-bezier(.35,.05,.23,1)':'none';
   track.style.transform='translate3d('+(-idx*stride())+'px,0,0)';
   const current=idx%total;
   dots.forEach((dot,n)=>{
     dot.classList.toggle('is-active',n===current);
     if(n===current)dot.setAttribute('aria-current','true');
     else dot.removeAttribute('aria-current');
   });
   resize();
 };
 const pause=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
 const shift=delta=>{
   if(moving)return;
   if(delta<0&&idx===0){
     idx=total;draw(false);
     requestAnimationFrame(()=>requestAnimationFrame(()=>{
       idx=total-1;moving=!reduced;draw(true);
     }));
     return;
   }
   idx+=delta;
   moving=!reduced;
   draw(true);
   if(reduced&&idx>=total){idx=0;draw(false);}
 };
 const autoplay=()=>{
   pause();
   if(!visible||document.hidden||reduced)return;
   timer=setInterval(()=>shift(1),8700);
 };
 track.addEventListener('transitionend',event=>{
   if(event.target!==track||event.propertyName!=='transform')return;
   moving=false;
   if(idx>=total){idx=0;draw(false);}
   resize();
 });
 prev?.addEventListener('click',()=>{shift(-1);autoplay();});
 next?.addEventListener('click',()=>{shift(1);autoplay();});
 dots.forEach((dot,n)=>dot.addEventListener('click',()=>{
   if(moving||idx%total===n)return;
   idx=n;moving=!reduced;draw(true);autoplay();
 }));
 viewport.addEventListener('touchstart',event=>{touchX=event.changedTouches[0].clientX;pause();},{passive:true});
 viewport.addEventListener('touchend',event=>{
   if(touchX===null)return;
   const delta=event.changedTouches[0].clientX-touchX;
   touchX=null;
   if(Math.abs(delta)>45)shift(delta<0?1:-1);
   autoplay();
 },{passive:true});
 viewport.addEventListener('touchcancel',()=>{touchX=null;autoplay();},{passive:true});
 all.forEach(slide=>slide.querySelector('img')?.addEventListener('load',resize,{once:true}));
 if('ResizeObserver' in window){
   const observer=new ResizeObserver(resize);
   slides.forEach(s=>observer.observe(s));
 }
 window.addEventListener('resize',()=>{draw(false);resize();},{passive:true});
 document.addEventListener('visibilitychange',autoplay);
 if('IntersectionObserver' in window){
   new IntersectionObserver(entries=>{
     visible=entries.some(x=>x.isIntersecting);
     autoplay();
   },{threshold:0.12}).observe(viewport);
 }
 draw(false);autoplay();
})();
