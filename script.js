document.addEventListener('DOMContentLoaded',()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const root=document.documentElement;
  $('#year').textContent=new Date().getFullYear();

  // Theme: remembers the user's choice and follows device preference on first visit.
  const saved=localStorage.getItem('aw-theme');
  function setTheme(t){root.dataset.theme=t;$('#themeToggle').textContent=t==='light'?'☾':'☼';$('#themeToggle').setAttribute('aria-label',t==='light'?'Switch to night mode':'Switch to day mode');document.querySelector('meta[name="theme-color"]').content=t==='light'?'#f4f8fc':'#07111f'}
  setTheme(saved||(matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'));
  $('#themeToggle').onclick=()=>{const t=root.dataset.theme==='light'?'dark':'light';localStorage.setItem('aw-theme',t);setTheme(t)};

  // Mobile navigation.
  const menu=$('#menuToggle'),nav=$('#navLinks');
  function closeNav(){nav.classList.remove('open');menu.classList.remove('open');menu.setAttribute('aria-expanded','false')}
  menu.onclick=()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.classList.toggle('open',open);menu.setAttribute('aria-expanded',open)};
  // Navigation: place the selected section cleanly below the fixed navbar.
  // This prevents headings from landing underneath the navbar and gives every
  // section a consistent, polished landing position on desktop and mobile.
  function scrollToSection(id){
    const target=document.querySelector(id);
    if(!target)return;
    const navHeight=navbar?.getBoundingClientRect().height||62;
    const extra=window.innerWidth<=780?16:20;
    const top=target.getBoundingClientRect().top+window.scrollY-navHeight-extra;
    window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
  }
  $$('a[href^="#"]').forEach(a=>{
    const href=a.getAttribute('href');
    if(!href||href==='#'||!document.querySelector(href))return;
    a.addEventListener('click',e=>{
      e.preventDefault();
      closeNav();
      scrollToSection(href);
      history.replaceState(null,'',href);
    });
  });

  $$('#navLinks a').forEach(a=>a.addEventListener('click',closeNav));

  // Active section.
  const navLinks=$$('#navLinks a');
  const sectionObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}),{rootMargin:'-35% 0px -55% 0px'});
  $$('main section[id]').forEach(s=>sectionObserver.observe(s));

  // Scroll effects.
  const progress=$('.scroll-progress span'),back=$('#backTopFloat'),navbar=$('#navbar');
  function onScroll(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max?scrollY/max*100:0)+'%';navbar.classList.toggle('scrolled',scrollY>20);back.classList.toggle('show',scrollY>500)}
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  $('#footerTop').onclick=()=>scrollTo({top:0,behavior:'smooth'});back.onclick=()=>scrollTo({top:0,behavior:'smooth'});

  // Reveal animations.
  const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');reveal.unobserve(e.target)}}),{threshold:.1});$$('.reveal').forEach(el=>reveal.observe(el));

  // Photo gallery: buttons, swipe and pointer drag.
  const photos=['assets/images/about-1.jpg','assets/images/about-2.jpg','assets/images/about-3.jpg','assets/images/profile.jpg'];let gi=0;
  const mainImg=$('#galleryMain'),counter=$('#galleryCounter');
  function galleryTo(i){gi=(i+photos.length)%photos.length;mainImg.style.opacity='.15';setTimeout(()=>{mainImg.src=photos[gi];mainImg.style.opacity='1'},90);counter.textContent=String(gi+1).padStart(2,'0')+' / 04';$$('.thumb').forEach((b,n)=>b.classList.toggle('active',n===gi))}
  $('#galleryPrev').onclick=()=>galleryTo(gi-1);$('#galleryNext').onclick=()=>galleryTo(gi+1);$$('.thumb').forEach(b=>b.onclick=()=>galleryTo(+b.dataset.index));
  let sx=0;const gw=$('#galleryMainWrap');gw.addEventListener('touchstart',e=>sx=e.changedTouches[0].clientX,{passive:true});gw.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>45)galleryTo(gi+(dx<0?1:-1))},{passive:true});

  // Search overlay: global search + Ctrl/Cmd K. Results scroll to matching sections/cards.
  const overlay=$('#searchOverlay'),input=$('#globalSearch'),results=$('#searchResults');
  const targets=[...$$('main section[id]'),...$$('.service-card'),...$$('.project-card')];
  function openSearch(){overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');setTimeout(()=>input.focus(),80);renderSearch('')}
  function closeSearch(){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')}
  $('#searchOpen').onclick=openSearch;$('#serviceSearchOpen').onclick=openSearch;$('#projectSearchOpen').onclick=openSearch;$('#searchClose').onclick=closeSearch;overlay.addEventListener('click',e=>{if(e.target===overlay)closeSearch});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch()}if(e.key==='Escape'){closeSearch();closeShare()}});
  function renderSearch(q){const term=q.trim().toLowerCase();const items=[];targets.forEach(el=>{const text=(el.innerText||'').replace(/\s+/g,' ').trim();if(!term||text.toLowerCase().includes(term)){const id=el.id||el.querySelector('h3')?.textContent||'item';let label=el.querySelector('h2,h3')?.textContent||id;let type=el.id?'Section':'Project / Service';if(items.length<8)items.push({label,type,el})}});results.innerHTML=items.length?items.map((x,i)=>`<button class="search-result" data-i="${i}"><b>${x.label}</b><span>${x.type} →</span></button>`).join(''):'<div class="search-result"><b>No result</b><span>Try another word</span></div>';$$('.search-result[data-i]').forEach(b=>b.onclick=()=>{items[+b.dataset.i].el.scrollIntoView({behavior:'smooth',block:'start'});closeSearch()})}
  input.addEventListener('input',()=>renderSearch(input.value));

  // Services search from the same modern menu.
  function filterServices(q){const term=q.trim().toLowerCase();let count=0;$$('.service-card').forEach(c=>{const ok=!term||c.dataset.search.includes(term)||c.innerText.toLowerCase().includes(term);c.style.display=ok?'':'none';if(ok)count++});$('#emptySearch').classList.toggle('show',count===0)}
  // Project slider with responsive visible count, dots, drag and auto-play.
  const slider=$('#projectSlider'),cards=$$('.project-card'),dots=$('#sliderDots');let pi=0,dragX=0,paused=false;
  function perView(){return innerWidth<=780?1:innerWidth<=1100?2:3}
  function maxIndex(){return Math.max(0,cards.length-perView())}
  function renderDots(){dots.innerHTML='';for(let i=0;i<=maxIndex();i++){const b=document.createElement('button');b.className=i===pi?'active':'';b.setAttribute('aria-label','Project slide '+(i+1));b.onclick=()=>{pi=i;move()};dots.appendChild(b)}}
  function move(){pi=Math.max(0,Math.min(maxIndex(),pi));const width=cards[0]?.getBoundingClientRect().width||0;slider.style.transform=`translateX(-${pi*(width+16)}px)`;$$('#sliderDots button').forEach((b,i)=>b.classList.toggle('active',i===pi))}
  $('#projectPrev').onclick=()=>{pi--;move()};$('#projectNext').onclick=()=>{pi++;move()};renderDots();move();addEventListener('resize',()=>{renderDots();move()});
  slider.addEventListener('pointerdown',e=>{dragX=e.clientX;paused=true;slider.setPointerCapture?.(e.pointerId)});slider.addEventListener('pointerup',e=>{const dx=e.clientX-dragX;if(Math.abs(dx)>45)pi+=dx<0?1:-1;move();paused=false});slider.addEventListener('mouseenter',()=>paused=true);slider.addEventListener('mouseleave',()=>paused=false);setInterval(()=>{if(!paused&&innerWidth>780&&maxIndex()){pi=pi>=maxIndex()?0:pi+1;move()}},4500);

  // Share menu: native share on mobile where available, otherwise a rich menu.
  const shareMenu=$('#shareMenu');
  function openShare(){shareMenu.classList.add('open');shareMenu.setAttribute('aria-hidden','false')};function closeShare(){shareMenu.classList.remove('open');shareMenu.setAttribute('aria-hidden','true')}
  async function share(){if(navigator.share){try{await navigator.share({title:'Abdul Wahab | Portfolio',text:'Check out Abdul Wahab\'s professional portfolio.',url:location.href});return}catch(e){}}openShare()}
  $('#shareBtn').onclick=share;$('#contactShare').onclick=share;$('#dockShare').onclick=share;$('#shareClose').onclick=closeShare;shareMenu.addEventListener('click',e=>{if(e.target===shareMenu)closeShare()});
  $$('.share-option').forEach(btn=>btn.onclick=async()=>{const url=location.href,text='Check out Abdul Wahab\'s professional portfolio.',kind=btn.dataset.share;if(kind==='copy'){try{await navigator.clipboard.writeText(url);$('#copyLabel').textContent='Link copied ✓';showToast('Portfolio link copied');setTimeout(()=>$('#copyLabel').textContent='Copy portfolio URL',1800)}catch{prompt('Copy this portfolio URL:',url)}closeShare();return}if(kind==='whatsapp')window.open('https://wa.me/?text='+encodeURIComponent(text+' '+url),'_blank');if(kind==='facebook')window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),'_blank','width=760,height=600');if(kind==='linkedin')window.open('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(url),'_blank','width=760,height=600');if(kind==='x')window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text)+'&url='+encodeURIComponent(url),'_blank','width=760,height=600');if(kind==='email')location.href='mailto:?subject='+encodeURIComponent('Abdul Wahab | Portfolio')+'&body='+encodeURIComponent(text+'\n\n'+url);closeShare()});

  // Contact form with spinner feedback.
  const form=$('#contactForm'),message=$('#formMessage'),submit=form.querySelector('.submit-btn');
  form.addEventListener('submit',async e=>{e.preventDefault();submit.classList.add('loading');submit.disabled=true;message.textContent='Sending...';try{const r=await fetch(form.action,{method:'POST',body:new FormData(form)});const data=await r.json();message.textContent=data.message||'Done.';message.style.color=data.success?'var(--accent2)':'var(--danger)';if(data.success){form.reset();showToast('Message sent successfully')}}catch(err){message.textContent='Network error. Please check your connection and try again.';message.style.color='var(--danger)'}finally{submit.classList.remove('loading');submit.disabled=false}});

  // Desktop custom cursor + magnetic buttons. Disabled on touch devices.
  if(matchMedia('(pointer:fine)').matches){const dot=$('.cursor-dot'),ring=$('.cursor-ring');let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px'});(function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop)})();$$('a,button,input,textarea,.service-card,.skill-card,.project-card').forEach(el=>{el.addEventListener('mouseenter',()=>ring.classList.add('hover'));el.addEventListener('mouseleave',()=>ring.classList.remove('hover'))});$$('.magnetic').forEach(el=>el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect();const x=(e.clientX-(r.left+r.width/2))*.12,y=(e.clientY-(r.top+r.height/2))*.12;el.style.transform=`translate(${x}px,${y}px)`}).addEventListener('mouseleave',()=>el.style.transform=''));
    const card=$('.tilt-card');if(card){card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(900px) rotateY(${x*6}deg) rotateX(${-y*6}deg)`});card.addEventListener('mouseleave',()=>card.style.transform='')}
  }

  function showToast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),2200)}
  if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
});
