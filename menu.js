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

let menuNewPublicationHighlighted = false;
let menuCategoriesRevealShown = false;

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
    if (sideMenu) setupMenuOrganization(sideMenu);
    if (menuToggle && sideMenu) {
      menuToggle.addEventListener("click", event => {
        event.preventDefault(); event.stopPropagation();
        const isOpen = sideMenu.classList.toggle("open");
        const shouldRevealCategories = isOpen && !menuCategoriesRevealShown;
        sideMenu.classList.toggle("menu-focus-open", shouldRevealCategories);
        document.body.classList.toggle("menu-open", isOpen);
        menuToggle.textContent = isOpen ? "FECHAR" : "MENU";
        menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

        if (shouldRevealCategories) {
          menuCategoriesRevealShown = true;
        }

        if (isOpen && !menuNewPublicationHighlighted) {
          const highlightedPublications = sideMenu.querySelectorAll(".menu-new-publication");
          menuNewPublicationHighlighted = true;

          if (highlightedPublications.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            highlightedPublications.forEach(publication => {
              publication.classList.remove("menu-new-publication-animate");
              void publication.offsetWidth;
            });

            requestAnimationFrame(() => {
              highlightedPublications.forEach(publication => {
                publication.classList.add("menu-new-publication-animate");
                publication.addEventListener("animationend", () => {
                  publication.classList.remove("menu-new-publication-animate");
                }, { once: true });
              });
            });
          }
        }
      });
      sideMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
        sideMenu.classList.remove("open", "menu-focus-open"); menuToggle.textContent = "MENU"; menuToggle.setAttribute("aria-expanded", "false");
      }));
      sideMenu.querySelectorAll(".collapsible-title").forEach(title => {
        const toggleSection = () => {
          const section = title.closest(".collapsible-section");
          if (!section) return;

          // Só o conteúdo imediatamente pertencente a esta secção é controlado.
          // Isto é importante para as subcategorias da MISCELÂNEA:
          // ao abrir MISCELÂNEA, TEXTOS AVULSOS e REISSUE continuam fechados.
          const content = Array.from(section.children).find(
            child => child.classList && child.classList.contains("menu-section-content")
          );
          if (!content) return;

          const isOpen = !section.classList.contains("expanded");
          const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

          // A animação é feita a partir da altura real do conteúdo.
          // Ao contrário do antigo sistema baseado em tempos fixos, os pais
          // são actualizados continuamente enquanto uma subcategoria cresce
          // ou encolhe. Isto evita saltos, cortes e "empurrões" no menu.
          const updateOpenParents = () => {
            let parent = section.parentElement;

            while (parent) {
              if (parent.classList && parent.classList.contains("menu-section-content")) {
                const parentSection = parent.parentElement;

                if (parentSection && parentSection.classList.contains("expanded")) {
                  parent.style.maxHeight = parent.scrollHeight + "px";
                }
              }

              parent = parent.parentElement;
            }
          };

          const targetHeight = isOpen ? content.scrollHeight : 0;
          const currentHeight = content.getBoundingClientRect().height;

          // A velocidade é proporcional à distância percorrida, com limites
          // suficientes para textos curtos e listas longas.
          const distance = Math.abs(targetHeight - currentHeight);
          const duration = reduceMotion ? 0 : Math.min(520, Math.max(220, distance * 0.32));

          content.style.transitionDuration = duration + "ms";

          if (isOpen) {
            section.classList.add("expanded");
            title.setAttribute("aria-expanded", "true");
          } else {
            section.classList.remove("expanded");
            title.setAttribute("aria-expanded", "false");
          }

          // Começamos sempre na altura actualmente visível e só depois
          // mudamos para a altura final. Isto elimina o salto inicial.
          content.style.maxHeight = Math.max(0, currentHeight) + "px";

          requestAnimationFrame(() => {
            content.style.maxHeight = targetHeight + "px";
            updateOpenParents();

            if (!reduceMotion && duration > 0) {
              const start = performance.now();

              const keepParentsInSync = now => {
                updateOpenParents();

                if (now - start < duration + 40) {
                  requestAnimationFrame(keepParentsInSync);
                } else {
                  // Depois da animação, limpa apenas a altura dos pais que
                  // continuam abertos para que o conteúdo possa crescer
                  // naturalmente sem ficar preso a um valor antigo.
                  updateOpenParents();
                }
              };

              requestAnimationFrame(keepParentsInSync);
            }
          });
        };

        title.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          toggleSection();
        });

        title.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            toggleSection();
          }
        });
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
    updateBackToTop();
  })
  .catch(error => console.error("Erro no menu:", error));

/* LIMPA O ESTADO VISUAL AO VOLTAR/AVANÇAR NO BROWSER (BFCache) */
window.addEventListener("pageshow", () => {
  document.body.classList.remove("menu-open", "index-open", "page-exit");

  const sideMenu = document.getElementById("sideMenu");
  const menuToggle = document.getElementById("menuToggle");
  if (sideMenu) sideMenu.classList.remove("open", "menu-focus-open");
  if (menuToggle) {
    menuToggle.textContent = "MENU";
    menuToggle.setAttribute("aria-expanded", "false");
  }

  document.querySelectorAll(".category-navigation").forEach(navigation => {
    navigation.classList.remove("index-open", "featured-open");
    const indexPanel = navigation.querySelector(".category-index-panel");
    const featuredPanel = navigation.querySelector(".category-featured-panel");
    const indexButton = navigation.querySelector(".category-nav-index");
    if (indexPanel) indexPanel.hidden = true;
    if (featuredPanel) {
      featuredPanel.hidden = true;
      featuredPanel.style.bottom = "";
    }
    if (indexButton) indexButton.setAttribute("aria-expanded", "false");
  });
});

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


function setupMenuOrganization(sideMenu) {
  const switcher = sideMenu.querySelector(".menu-view-switch");
  const projectButton = switcher && switcher.querySelector('[data-menu-view="project"]');
  const dateButton = switcher && switcher.querySelector('[data-menu-view="date"]');
  const futureButton = switcher && switcher.querySelector('[data-menu-view="future"]');
  const chronologySection = sideMenu.querySelector("[data-menu-chronology]");
  const futureSection = sideMenu.querySelector("[data-menu-future-section]");
  const chronologyList = chronologySection && chronologySection.querySelector(".menu-chronology-list");

  if (!switcher || !projectButton || !dateButton || !futureButton || !chronologySection || !chronologyList || !futureSection) return;

  const storageKey = "nescio-menu-organization";
  let chronologyBuilt = false;
  let buildPromise = null;

  const getFileName = href => {
    try {
      return new URL(href, window.location.href).pathname.split("/").pop() || "";
    } catch (error) {
      return href.split("/").pop() || "";
    }
  };

  const getTextMeta = async (href, fallbackTitle, order) => {
    try {
      const response = await fetch(href, { cache: "no-store" });
      if (!response.ok) throw new Error("Página não disponível");
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const dateElement = doc.querySelector("time.text-date");
      const headings = Array.from(doc.querySelectorAll("h1"));
      const titleElement = headings.find(h => !h.classList.contains("verao-gate-title")) || headings[0];

      if (!dateElement || !dateElement.getAttribute("datetime")) return null;

      return {
        href,
        title: (titleElement?.textContent || fallbackTitle || "").trim(),
        date: dateElement.textContent.trim(),
        dateISO: dateElement.getAttribute("datetime"),
        order
      };
    } catch (error) {
      console.warn("NESCIO: não foi possível ler a data de", href, error);
      return null;
    }
  };

  const getCicatrizesMeta = async orderStart => {
    try {
      const url = new URL("cicatrizesdocomum.html", window.location.href).href;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Página de Cicatrizes não disponível");
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      return Array.from(doc.querySelectorAll(".cicatriz-entry")).map((entry, index) => {
        const dateElement = entry.querySelector("time.text-date");
        const titleElement = entry.querySelector("h2");
        if (!dateElement || !dateElement.getAttribute("datetime") || !titleElement) return null;

        return {
          href: `cicatrizesdocomum.html#${entry.id}`,
          title: titleElement.textContent.trim(),
          date: dateElement.textContent.trim(),
          dateISO: dateElement.getAttribute("datetime"),
          order: orderStart + index
        };
      }).filter(Boolean);
    } catch (error) {
      console.warn("NESCIO: não foi possível ler as datas de Cicatrizes.", error);
      return [];
    }
  };

  const buildChronology = async () => {
    if (chronologyBuilt) return;
    if (buildPromise) return buildPromise;

    chronologyList.innerHTML = "";
    const loading = document.createElement("div");
    loading.className = "menu-chronology-loading";
    loading.textContent = "A organizar por data…";
    chronologyList.appendChild(loading);

    buildPromise = (async () => {
      const excludedFiles = new Set([
        "almeida.html",
        "cicatrizesdocomum.html",
        "galeriacicatrizes.html"
      ]);

      const rawLinks = Array.from(sideMenu.querySelectorAll('a[href]'))
        .map((link, order) => ({
          href: link.href,
          file: getFileName(link.href),
          fallbackTitle: link.textContent.trim(),
          order
        }))
        .filter(item => item.file.endsWith(".html"))
        .filter(item => !excludedFiles.has(item.file));

      // EM DESTAQUE é independente das categorias e deve aparecer sempre
      // também na cronologia quando o link aponta para um texto.
      const featuredSection = sideMenu.querySelector('[data-menu-fixed="featured"]');
      const featuredLinks = featuredSection
        ? Array.from(featuredSection.querySelectorAll(':scope > a[href]'))
            .map((link, index) => ({
              href: link.href,
              file: getFileName(link.href),
              fallbackTitle: link.textContent.trim(),
              order: index - 1000
            }))
            .filter(item => item.file.endsWith(".html"))
            .filter(item => !excludedFiles.has(item.file))
        : [];

      const unique = [];
      const seen = new Set();

      [...featuredLinks, ...rawLinks].forEach(item => {
        if (seen.has(item.file)) return;
        seen.add(item.file);
        unique.push(item);
      });

      const pageMeta = await Promise.all(
        unique.map(item => getTextMeta(item.href, item.fallbackTitle, item.order))
      );

      const cicatrizesMeta = await getCicatrizesMeta(unique.length + 1000);

      const items = [...pageMeta.filter(Boolean), ...cicatrizesMeta].sort((a, b) => {
        const byDate = b.dateISO.localeCompare(a.dateISO);
        return byDate !== 0 ? byDate : a.order - b.order;
      });

      const fragment = document.createDocumentFragment();

      items.forEach(item => {
        const link = document.createElement("a");
        link.className = "menu-chronology-item";
        link.href = item.href;

        const date = document.createElement("time");
        date.className = "menu-chronology-date";
        date.dateTime = item.dateISO;
        date.textContent = item.date;

        const title = document.createElement("span");
        title.className = "menu-chronology-title";
        title.textContent = item.title;

        link.append(date, title);
        link.addEventListener("click", () => {
          sideMenu.classList.remove("open", "menu-focus-open");
          document.body.classList.remove("menu-open");
          const menuToggle = document.getElementById("menuToggle");
          if (menuToggle) {
            menuToggle.textContent = "MENU";
            menuToggle.setAttribute("aria-expanded", "false");
          }
        });
        fragment.appendChild(link);
      });

      chronologyList.innerHTML = "";
      chronologyList.appendChild(fragment);
      chronologyBuilt = true;
    })();

    try {
      await buildPromise;
    } finally {
      buildPromise = null;
    }
  };

  const applyView = view => {
    const isDateView = view === "date";
    const isFutureView = view === "future";

    sideMenu.classList.toggle("menu-date-view", isDateView);
    sideMenu.classList.toggle("menu-future-view", isFutureView);
    projectButton.classList.toggle("is-active", !isDateView && !isFutureView);
    dateButton.classList.toggle("is-active", isDateView);
    futureButton.classList.toggle("is-active", isFutureView);

    projectButton.setAttribute("aria-selected", isDateView || isFutureView ? "false" : "true");
    dateButton.setAttribute("aria-selected", isDateView ? "true" : "false");
    futureButton.setAttribute("aria-selected", isFutureView ? "true" : "false");

    chronologySection.hidden = !isDateView;
    futureSection.hidden = !isFutureView;
    chronologySection.style.display = isDateView ? "" : "none";
    futureSection.style.display = isFutureView ? "" : "block";

    if (isDateView) buildChronology();

    try {
      localStorage.setItem(storageKey, isFutureView ? "future" : (isDateView ? "date" : "project"));
    } catch (error) {}
  };

  projectButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    applyView("project");
  });

  dateButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    applyView("date");
  });

  futureButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    applyView("future");
  });

  let savedView = "project";
  try {
    const storedView = localStorage.getItem(storageKey);
    savedView = storedView === "date" || storedView === "future" ? storedView : "project";
  } catch (error) {}

  applyView(savedView);
}

function setupReadingProgress() {
  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  if (currentFile === "index.html" || window.location.pathname.endsWith("/") || currentFile === "calendario.html") return;
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
    // O índice pertence apenas a esta secção. Não recolhe links de subcategorias.
    // Ex.: MISCELÂNEA não deve misturar TEXTOS AVULSOS com REISSUE.
    const directContent = Array.from(section.children).find(
      child => child.classList && child.classList.contains("menu-section-content")
    );
    if (!directContent) return;
    const links = Array.from(directContent.children)
      .filter(child => child.tagName === "A")
      .filter(link => {
        const href = link.getAttribute("href");
        return href && !href.startsWith("http") && !href.startsWith("#");
      });
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
    links.forEach((link, index) => { const item = document.createElement("a"); item.href = link.getAttribute("href"); item.textContent = link.textContent.trim(); item.className = "category-index-item"; if (index === currentIndex) { item.classList.add("current"); item.setAttribute("aria-current", "page"); const marker = document.createElement("span"); marker.className = "category-index-current-marker"; marker.setAttribute("aria-hidden", "true"); item.prepend(marker); } indexPanel.appendChild(item); });
    // Índice especial "EM DESTAQUE": usa sempre a secção EM DESTAQUE
    // do menu principal, independentemente da categoria/subcategoria atual.
    const featuredSection = sideMenu.querySelector('[data-menu-fixed="featured"]');
    const featuredLinks = featuredSection
      ? Array.from(featuredSection.children).filter(child => child.tagName === "A").filter(link => {
          const href = link.getAttribute("href");
          return href && !href.startsWith("http") && !href.startsWith("#");
        })
      : [];

    const featuredPanel = document.createElement("div");
    featuredPanel.className = "category-index-panel category-featured-panel";
    featuredPanel.hidden = true;

    const featuredTitle = document.createElement("div");
    featuredTitle.className = "category-index-title";
    featuredTitle.textContent = "EM DESTAQUE";
    featuredPanel.appendChild(featuredTitle);

    featuredLinks.forEach(link => {
      const item = document.createElement("a");
      item.href = link.getAttribute("href");
      item.textContent = link.textContent.trim();
      item.className = "category-index-item";
      featuredPanel.appendChild(item);
    });

    const closeIndex = () => {
      indexPanel.hidden = true;
      featuredPanel.hidden = true;
      indexButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("index-open", "featured-open");
      document.body.classList.remove("index-open");
    };

    indexButton.addEventListener("click", event => {
      event.preventDefault();
      const willOpen = indexPanel.hidden;

      if (!willOpen) {
        closeIndex();
        return;
      }

      indexPanel.hidden = false;
      featuredPanel.hidden = true;
      indexButton.setAttribute("aria-expanded", "true");
      navigation.classList.add("index-open");
      navigation.classList.remove("featured-open");
      document.body.classList.add("index-open");

      // Surge 1 segundo depois do índice, mantendo exatamente a mesma estrutura visual.
      window.setTimeout(() => {
        if (!indexPanel.hidden && indexButton.getAttribute("aria-expanded") === "true") {
          // Coloca o segundo pop-up acima do primeiro, sem sobreposição.
          featuredPanel.hidden = false;
          featuredPanel.style.bottom = `calc(100% + ${indexPanel.offsetHeight + 36}px)`;
          navigation.classList.add("featured-open");
        }
      }, 1000);
    });

    indexPanel.querySelectorAll("a").forEach(link => link.addEventListener("click", closeIndex));
    featuredPanel.querySelectorAll("a").forEach(link => link.addEventListener("click", closeIndex));

    navigation.appendChild(previous);
    navigation.appendChild(indexButton);
    navigation.appendChild(next);
    navigation.appendChild(featuredPanel);
    navigation.appendChild(indexPanel);
    article.insertAdjacentElement("afterend", navigation);
  });
}

/* LOGO: em qualquer página, clicar no logótipo regressa à landing page. */
document.addEventListener("click", event => {
  const logo = event.target.closest('img[src$="LOGO.png"]');
  if (!logo) return;
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  window.location.href = "index.html";
});

document.addEventListener("click", event => {
  const menu = document.getElementById("sideMenu");
  const menuToggle = document.getElementById("menuToggle");
  const categoryNavigation = document.querySelector(".category-navigation");
  const indexPanel = document.querySelector(".category-index-panel");

  if (document.body.classList.contains("menu-open") &&
      menu && !menu.contains(event.target) &&
      menuToggle && !menuToggle.contains(event.target)) {
    menu.classList.remove("open");
    document.body.classList.remove("menu-open");
    menuToggle.textContent = "MENU";
    menuToggle.setAttribute("aria-expanded", "false");
  }

  if (document.body.classList.contains("index-open") &&
      categoryNavigation && !categoryNavigation.contains(event.target)) {
    if (indexPanel) indexPanel.hidden = true;
    const featuredPanel = categoryNavigation.querySelector(".category-featured-panel");
    if (featuredPanel) {
      featuredPanel.hidden = true;
      featuredPanel.style.bottom = "";
    }
    categoryNavigation.classList.remove("index-open", "featured-open");
    document.body.classList.remove("index-open");
    const indexButton = categoryNavigation.querySelector(".category-nav-index");
    if (indexButton) indexButton.setAttribute("aria-expanded", "false");
  }


  if (event.target.closest("#themeToggle")) return;
  const link = event.target.closest("a"); if (!link) return;
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank" || link.hasAttribute("download")) return;
  const href = link.getAttribute("href"); if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
  let destination; try { destination = new URL(href, window.location.href); } catch { return; }
  if (destination.origin !== window.location.origin || destination.href === window.location.href) return;

  if (destination.pathname.endsWith("/almeida.html")) {
    try { sessionStorage.setItem("nescio-almeida-arrival", "1"); } catch (error) {}
  }
  /*
   * Deixamos a navegação normal acontecer para que o View Transition API
   * consiga capturar a página anterior e a seguinte como uma única transição.
   * Em browsers sem suporte, a página mantém a navegação normal sem quebrar.
   */
});
