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
