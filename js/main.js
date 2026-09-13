// Nav scroll state
  const nav = document.getElementById('siteNav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    updateTapeCounter();
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  // Mobile nav toggle
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  // Tape counter — stylised readout of scroll position, ties to the voice-memo motif
  const counter = document.getElementById('tapeCounter');
  function updateTapeCounter(){
    if(!counter) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const totalSeconds = Math.round(pct * 599); // stylised 09:59 max
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2,'0');
    const ss = String(totalSeconds % 60).padStart(2,'0');
    counter.textContent = mm + ':' + ss;
  }

  // Scroll reveal
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!prefersReduced && 'IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          e.target.classList.add('reveal');
          io.unobserve(e.target);
        }
      });
    }, { threshold:.2 });
    document.querySelectorAll('.reveal-init').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal-init').forEach(el => el.classList.add('reveal'));
  }
