/* APLICA O TEMA GUARDADO IMEDIATAMENTE, ANTES DO MENU SER CARREGADO */
(function applySavedThemeEarly() {
  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem("nescio-theme") === "dark" ? "dark" : "light";
  } catch (error) {}

  const isDark = savedTheme === "dark";
  document.documentElement.classList.toggle("dark-mode", isDark);
  if (document.body) document.body.classList.toggle("dark-mode", isDark);
})();

fetch("menu.html", { cache: "no-store" })
  .then(response => {
    if (!response.ok) throw new Error("Não foi possível carregar o menu.");
    return response.text();
  })
  .then(data => {
    const container = document.getElementById("menu-container");
    if (!container) return;
    container.innerHTML = data;
    setupTheme();
    const menuToggle = document.getElementById("menuToggle");
    const sideMenu = document.getElementById("sideMenu");
    if (menuToggle && sideMenu) {
      menuToggle.addEventListener("click", event => {
        event.preventDefault(); event.stopPropagation();
        const isOpen = sideMenu.classList.toggle("open");
        menuToggle.textContent = isOpen ? "FECHAR" : "MENU";
        menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
      sideMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
        sideMenu.classList.remove("open"); menuToggle.textContent = "MENU"; menuToggle.setAttribute("aria-expanded", "false");
      }));
      sideMenu.querySelectorAll(".collapsible-title").forEach(title => {
        const toggleSection = () => {
          const section = title.closest(".collapsible-section");
          const content = section.querySelector(".menu-section-content");
          const isOpen = !section.classList.contains("expanded");

          if (isOpen) {
            section.classList.add("expanded");
            title.setAttribute("aria-expanded", "true");
            content.style.maxHeight = content.scrollHeight + "px";
          } else {
            content.style.maxHeight = content.scrollHeight + "px";
            requestAnimationFrame(() => {
              section.classList.remove("expanded");
              title.setAttribute("aria-expanded", "false");
              content.style.maxHeight = "0px";
            });
          }
        };
        title.addEventListener("click", toggleSection);
        title.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleSection(); } });
      });
      setupCategoryNavigation(sideMenu);
    }
    setupReadingProgress();
    setupReadingSpeedWarning();
    const backToTop = document.createElement("button");
    backToTop.className = "back-to-top"; backToTop.type = "button"; backToTop.setAttribute("aria-label", "Voltar ao topo"); backToTop.setAttribute("title", "Voltar ao topo"); backToTop.innerHTML = "↑";
    document.body.appendChild(backToTop);
    const updateBackToTop = () => backToTop.classList.toggle("visible", window.scrollY > 250);
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    updateBackToTop(); document.body.classList.add("page-enter");
  })
  .catch(error => console.error("Erro no menu:", error));

function setupTheme() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  const applyTheme = theme => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark-mode", isDark);
    document.body.classList.toggle("dark-mode", isDark);
    themeToggle.textContent = isDark ? "LIGHT MODE" : "DARK MODE";
    themeToggle.setAttribute("aria-label", isDark ? "Ativar modo claro" : "Ativar dark mode");
    themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  };

  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem("nescio-theme") === "dark" ? "dark" : "light";
  } catch (error) {}

  applyTheme(savedTheme);

  themeToggle.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    const nextTheme = document.documentElement.classList.contains("dark-mode") ? "light" : "dark";
    try { localStorage.setItem("nescio-theme", nextTheme); } catch (error) {}
    applyTheme(nextTheme);
  });
}

function setupReadingProgress() {
  if (window.location.pathname.split("/").pop() === "index.html" || window.location.pathname.endsWith("/")) return;
  if (document.querySelector(".reading-progress")) return;
  const progress = document.createElement("div"); progress.className = "reading-progress"; progress.setAttribute("aria-hidden", "true");
  const fill = document.createElement("div"); fill.className = "reading-progress-fill"; progress.appendChild(fill); document.body.appendChild(progress);
  let targetProgress = 0, displayedProgress = 0, animationFrame = null;
  const getProgress = () => { const scrollHeight = document.documentElement.scrollHeight - window.innerHeight; return scrollHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100)) : 0; };
  const animateProgress = () => { const difference = targetProgress - displayedProgress; displayedProgress += difference * 0.16; if (Math.abs(difference) < 0.05) { displayedProgress = targetProgress; animationFrame = null; } else animationFrame = window.requestAnimationFrame(animateProgress); fill.style.width = displayedProgress + "%"; };
  const updateProgress = () => { targetProgress = getProgress(); if (animationFrame === null) animationFrame = window.requestAnimationFrame(animateProgress); };
  window.addEventListener("scroll", updateProgress, { passive: true }); window.addEventListener("resize", updateProgress, { passive: true }); updateProgress();
}

function setupReadingSpeedWarning() {
  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  const isLanding = currentFile === "index.html" || window.location.pathname.endsWith("/");
  const article = document.querySelector("main article");

  if (isLanding || !article || document.getElementById("reading-speed-warning")) return;

  const storageKey = "nescio-reading-warning-last-shown";
  const cooldown = 15 * 60 * 1000;
  const threshold = 2.0;
  const sustainedFastTime = 220;
  let lastY = window.scrollY;
  let lastTime = performance.now();
  let fastSince = null;
  let triggered = false;

  const canShow = () => {
    try {
      const lastShown = Number(localStorage.getItem(storageKey));
      return !lastShown || Date.now() - lastShown >= cooldown;
    } catch (error) {
      return true;
    }
  };

  const rememberShown = () => {
    try { localStorage.setItem(storageKey, String(Date.now())); } catch (error) {}
  };

  const closeWarning = () => {
    const overlay = document.getElementById("reading-speed-warning");
    if (!overlay) return;
    overlay.classList.remove("is-visible");
    window.setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 260);
  };

  const showWarning = () => {
    if (triggered || !canShow()) return;
    triggered = true;
    rememberShown();

    const overlay = document.createElement("div");
    overlay.id = "reading-speed-warning";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-label", "Aviso de leitura");

    const message = document.createElement("div");
    message.className = "reading-speed-warning-message";
    message.textContent = "Tem calma. Aproveita a leitura.";

    const close = document.createElement("button");
    close.className = "reading-speed-warning-close";
    close.type = "button";
    close.setAttribute("aria-label", "Fechar aviso");
    close.textContent = "×";
    close.hidden = true;

    overlay.appendChild(message);
    overlay.appendChild(close);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add("is-visible"));

    const closeTimer = window.setTimeout(() => {
      close.hidden = false;
      requestAnimationFrame(() => close.classList.add("is-visible"));
    }, 2000);

    overlay.addEventListener("click", event => {
      if (event.target === close) return;
      window.clearTimeout(closeTimer);
      closeWarning();
    });

    close.addEventListener("click", event => {
      event.stopPropagation();
      window.clearTimeout(closeTimer);
      closeWarning();
    });
  };

  const handleScroll = () => {
    if (triggered || !canShow()) return;

    const now = performance.now();
    const y = window.scrollY;
    const deltaY = Math.abs(y - lastY);
    const deltaTime = now - lastTime;

    if (deltaTime <= 0) return;

    const speed = deltaY / deltaTime;

    if (deltaY >= 80 && speed >= threshold) {
      if (fastSince === null) fastSince = now;
      if (now - fastSince >= sustainedFastTime) showWarning();
    } else if (speed < threshold * 0.65) {
      fastSince = null;
    }

    lastY = y;
    lastTime = now;
  };

  if (!document.getElementById("reading-speed-warning-style")) {
    const style = document.createElement("style");
    style.id = "reading-speed-warning-style";
    style.textContent = `
      #reading-speed-warning {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background: rgba(250,250,250,.42);
        backdrop-filter: blur(11px);
        -webkit-backdrop-filter: blur(11px);
        opacity: 0;
        cursor: pointer;
        transition: opacity .26s ease;
      }
      #reading-speed-warning.is-visible { opacity: 1; }
      .reading-speed-warning-message {
        max-width: min(720px, 90vw);
        color: #C00000;
        font-family: "Cormorant Garamond", Georgia, "Times New Roman", serif;
        font-size: clamp(30px, 4vw, 54px);
        font-weight: 500;
        line-height: 1.15;
        text-align: center;
        letter-spacing: .01em;
        user-select: none;
        pointer-events: none;
      }
      .reading-speed-warning-close {
        position: absolute;
        top: 18px;
        right: 22px;
        width: 38px;
        height: 38px;
        border: 0;
        padding: 0;
        background: transparent;
        color: #C00000;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 30px;
        font-weight: 300;
        line-height: 38px;
        text-align: center;
        cursor: pointer;
        opacity: 0;
        transition: opacity .2s ease;
        appearance: none;
        -webkit-appearance: none;
      }
      .reading-speed-warning-close.is-visible { opacity: 1; }
      .reading-speed-warning-close:hover { opacity: .55; }
      html.dark-mode #reading-speed-warning { background: rgba(17,17,17,.48); }
      html.dark-mode .reading-speed-warning-message,
      html.dark-mode .reading-speed-warning-close { color: #E00000; }
      @media (max-width:700px) {
        #reading-speed-warning { padding: 30px 22px; }
        .reading-speed-warning-message { font-size: 32px; max-width: 88vw; }
        .reading-speed-warning-close { top: 14px; right: 14px; }
      }
      @media (prefers-reduced-motion: reduce) {
        #reading-speed-warning { transition: none; }
        .reading-speed-warning-close { transition: none; }
      }
    `;
    document.head.appendChild(style);
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
}

function setupCategoryNavigation(sideMenu) {
  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  if (currentFile === "cicatrizesdocomum.html") return;
  const sections = sideMenu.querySelectorAll(".menu-section");
  sections.forEach(section => {
    const links = Array.from(section.querySelectorAll(":scope > a, .menu-section-content > a")).filter(link => { const href = link.getAttribute("href"); return href && !href.startsWith("http") && !href.startsWith("#"); });
    if (!links.length) return;
    const currentIndex = links.findIndex(link => { const href = link.getAttribute("href"); return href && href.split("/").pop() === currentFile; });
    if (currentIndex === -1) return;
    const main = document.querySelector("main"), article = main && main.querySelector("article");
    if (!article || document.querySelector(".category-navigation")) return;
    const navigation = document.createElement("nav"); navigation.className = "category-navigation"; navigation.setAttribute("aria-label", "Navegação entre textos da categoria");
    const previous = document.createElement("a"); previous.className = "category-nav-link category-nav-previous"; previous.textContent = "← anterior";
    const indexButton = document.createElement("button"); indexButton.className = "category-nav-index"; indexButton.type = "button"; indexButton.textContent = "índice"; indexButton.setAttribute("aria-expanded", "false"); indexButton.setAttribute("aria-label", "Ver índice desta categoria");
    const next = document.createElement("a"); next.className = "category-nav-link category-nav-next"; const isLast = currentIndex === links.length - 1; next.textContent = isLast ? "Regressar" : "seguinte →";
    if (currentIndex > 0) previous.href = links[currentIndex - 1].getAttribute("href"); else { previous.classList.add("is-hidden"); previous.setAttribute("aria-hidden", "true"); previous.tabIndex = -1; }
    next.href = isLast ? "index.html" : links[currentIndex + 1].getAttribute("href");
    const indexPanel = document.createElement("div"); indexPanel.className = "category-index-panel"; indexPanel.hidden = true;
    const categoryTitle = document.createElement("div"); categoryTitle.className = "category-index-title"; categoryTitle.textContent = section.querySelector(".menu-title")?.textContent.trim() || "Categoria"; indexPanel.appendChild(categoryTitle);
    links.forEach((link, index) => { const item = document.createElement("a"); item.href = link.getAttribute("href"); item.textContent = link.textContent.trim(); item.className = "category-index-item"; if (index === currentIndex) { item.classList.add("current"); item.setAttribute("aria-current", "page"); } indexPanel.appendChild(item); });
    const closeIndex = () => { indexPanel.hidden = true; indexButton.setAttribute("aria-expanded", "false"); navigation.classList.remove("index-open"); };
    indexButton.addEventListener("click", event => { event.preventDefault(); const willOpen = indexPanel.hidden; indexPanel.hidden = !willOpen; indexButton.setAttribute("aria-expanded", willOpen ? "true" : "false"); navigation.classList.toggle("index-open", willOpen); });
    indexPanel.querySelectorAll("a").forEach(link => link.addEventListener("click", closeIndex)); navigation.appendChild(previous); navigation.appendChild(indexButton); navigation.appendChild(next); navigation.appendChild(indexPanel); article.insertAdjacentElement("afterend", navigation);
  });
}

document.addEventListener("click", event => {
  if (event.target.closest("#themeToggle")) return;
  const link = event.target.closest("a"); if (!link) return;
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank" || link.hasAttribute("download")) return;
  const href = link.getAttribute("href"); if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
  let destination; try { destination = new URL(href, window.location.href); } catch { return; }
  if (destination.origin !== window.location.origin || destination.href === window.location.href) return;
  event.preventDefault(); document.body.classList.add("page-exit"); window.setTimeout(() => { window.location.href = destination.href; }, 220);
});
