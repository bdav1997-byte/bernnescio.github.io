fetch("menu.html")
  .then(response => {
    if (!response.ok) throw new Error("Não foi possível carregar o menu.");
    return response.text();
  })
  .then(data => {
    const container = document.getElementById("menu-container");
    if (!container) return;
    container.innerHTML = data;

    const menuToggle = document.getElementById("menuToggle");
    const sideMenu = document.getElementById("sideMenu");

    if (menuToggle && sideMenu) {
      menuToggle.addEventListener("click", () => {
        const isOpen = sideMenu.classList.toggle("open");
        menuToggle.textContent = isOpen ? "FECHAR" : "MENU";
        menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      sideMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
          sideMenu.classList.remove("open");
          menuToggle.textContent = "MENU";
          menuToggle.setAttribute("aria-expanded", "false");
        });
      });

      sideMenu.querySelectorAll(".collapsible-title").forEach(title => {
        const toggleSection = () => {
          const section = title.closest(".collapsible-section");
          const isOpen = section.classList.toggle("expanded");
          title.setAttribute("aria-expanded", isOpen ? "true" : "false");
        };
        title.addEventListener("click", toggleSection);
        title.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleSection();
          }
        });
      });

      setupCategoryNavigation(sideMenu);
      setupMenuSearch(sideMenu);
    }

    setupReadingProgress();

    const backToTop = document.createElement("button");
    backToTop.className = "back-to-top";
    backToTop.type = "button";
    backToTop.setAttribute("aria-label", "Voltar ao topo");
    backToTop.setAttribute("title", "Voltar ao topo");
    backToTop.innerHTML = "↑";
    document.body.appendChild(backToTop);

    const updateBackToTop = () => backToTop.classList.toggle("visible", window.scrollY > 250);
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    updateBackToTop();
    document.body.classList.add("page-enter");
  })
  .catch(error => console.error("Erro no menu:", error));

function setupMenuSearch(sideMenu) {
  const trigger = sideMenu.querySelector("#menuSearchTrigger");
  const box = sideMenu.querySelector("#menuSearchBox");
  const input = sideMenu.querySelector("#menuSearchInput");
  const results = sideMenu.querySelector("#menuSearchResults");
  if (!trigger || !box || !input || !results) return;

  const entries = Array.from(sideMenu.querySelectorAll(".menu-section a"))
    .filter(link => {
      const href = link.getAttribute("href");
      return href && !href.startsWith("http") && !href.startsWith("#");
    })
    .map(link => ({
      title: link.textContent.trim(),
      href: link.getAttribute("href")
    }));

  let indexPromise = null;

  const normalise = text => text
    .toLocaleLowerCase("pt-PT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const getSearchIndex = () => {
    if (indexPromise) return indexPromise;

    indexPromise = Promise.all(entries.map(entry =>
      fetch(entry.href)
        .then(response => response.ok ? response.text() : "")
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const article = doc.querySelector("article");
          const text = article ? article.innerText.replace(/\s+/g, " ").trim() : "";
          const title = doc.querySelector("article h1")?.textContent.trim() || entry.title;
          const section = Array.from(sideMenu.querySelectorAll(".menu-section")).find(section =>
            section.contains(Array.from(section.querySelectorAll("a")).find(link => link.getAttribute("href") === entry.href))
          );
          const category = section?.querySelector(".menu-title")?.textContent.trim() || "";
          return { ...entry, title, category, text, normalizedText: normalise(text), normalizedTitle: normalise(title) };
        })
        .catch(() => ({ ...entry, title: entry.title, category: "", text: "", normalizedText: "", normalizedTitle: normalise(entry.title) }))
    ));

    return indexPromise;
  };

  const makeSnippet = (text, query) => {
    const normalizedQuery = normalise(query);
    const normalizedText = normalise(text);
    const position = normalizedText.indexOf(normalizedQuery);
    if (position === -1) return "";

    const start = Math.max(0, position - 48);
    const end = Math.min(text.length, position + query.length + 72);
    const prefix = start > 0 ? "…" : "";
    const suffix = end < text.length ? "…" : "";
    return prefix + text.slice(start, end).trim() + suffix;
  };

  const renderResults = (query, indexedEntries) => {
    results.innerHTML = "";
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    const normalizedQuery = normalise(cleanQuery);
    const matches = indexedEntries.filter(entry =>
      entry.normalizedText.includes(normalizedQuery) || entry.normalizedTitle.includes(normalizedQuery)
    );

    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "menu-search-empty";
      empty.textContent = "Nenhum texto encontrado.";
      results.appendChild(empty);
      return;
    }

    const count = document.createElement("div");
    count.className = "menu-search-count";
    count.textContent = `${matches.length} ${matches.length === 1 ? "RESULTADO" : "RESULTADOS"}`;
    results.appendChild(count);

    matches.forEach(entry => {
      const link = document.createElement("a");
      link.className = "menu-search-result";
      link.href = entry.href;

      const title = document.createElement("span");
      title.className = "menu-search-result-title";
      title.textContent = entry.title;
      link.appendChild(title);

      if (entry.category) {
        const category = document.createElement("span");
        category.className = "menu-search-result-category";
        category.textContent = entry.category;
        link.appendChild(category);
      }

      const snippet = makeSnippet(entry.text, cleanQuery);
      if (snippet) {
        const excerpt = document.createElement("span");
        excerpt.className = "menu-search-result-snippet";
        excerpt.textContent = snippet;
        link.appendChild(excerpt);
      }

      results.appendChild(link);
    });
  };

  const openSearch = () => {
    const willOpen = box.hidden;
    box.hidden = !willOpen;
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
    sideMenu.classList.toggle("search-open", willOpen);
    if (willOpen) {
      window.setTimeout(() => input.focus(), 50);
    } else {
      input.value = "";
      results.innerHTML = "";
    }
  };

  trigger.addEventListener("click", event => {
    event.preventDefault();
    openSearch();
  });

  input.addEventListener("input", () => {
    const query = input.value.trim();
    if (!query) {
      results.innerHTML = "";
      return;
    }

    results.innerHTML = "";
    const loading = document.createElement("div");
    loading.className = "menu-search-empty";
    loading.textContent = "A procurar…";
    results.appendChild(loading);

    getSearchIndex().then(indexedEntries => renderResults(query, indexedEntries));
  });
}

function setupReadingProgress() {
  if (window.location.pathname.split("/").pop() === "index.html" || window.location.pathname.endsWith("/")) return;
  if (document.querySelector(".reading-progress")) return;

  const progress = document.createElement("div");
  progress.className = "reading-progress";
  progress.setAttribute("aria-hidden", "true");

  const fill = document.createElement("div");
  fill.className = "reading-progress-fill";
  progress.appendChild(fill);
  document.body.appendChild(progress);

  let targetProgress = 0;
  let displayedProgress = 0;
  let animationFrame = null;

  const getProgress = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    return scrollHeight > 0
      ? Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100))
      : 0;
  };

  const animateProgress = () => {
    const difference = targetProgress - displayedProgress;
    displayedProgress += difference * 0.16;

    if (Math.abs(difference) < 0.05) {
      displayedProgress = targetProgress;
      animationFrame = null;
    } else {
      animationFrame = window.requestAnimationFrame(animateProgress);
    }

    fill.style.width = displayedProgress + "%";
  };

  const updateProgress = () => {
    targetProgress = getProgress();
    if (animationFrame === null) {
      animationFrame = window.requestAnimationFrame(animateProgress);
    }
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();
}

function setupCategoryNavigation(sideMenu) {
  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  const sections = sideMenu.querySelectorAll(".menu-section");

  sections.forEach(section => {
    const links = Array.from(section.querySelectorAll(":scope > a, .menu-section-content > a"))
      .filter(link => {
        const href = link.getAttribute("href");
        return href && !href.startsWith("http") && !href.startsWith("#");
      });

    if (!links.length) return;

    const currentIndex = links.findIndex(link => {
      const href = link.getAttribute("href");
      return href && href.split("/").pop() === currentFile;
    });

    if (currentIndex === -1) return;

    const main = document.querySelector("main");
    const article = main && main.querySelector("article");
    if (!article || document.querySelector(".category-navigation")) return;

    const navigation = document.createElement("nav");
    navigation.className = "category-navigation";
    navigation.setAttribute("aria-label", "Navegação entre textos da categoria");

    const previous = document.createElement("a");
    previous.className = "category-nav-link category-nav-previous";
    previous.textContent = "← anterior";

    const indexButton = document.createElement("button");
    indexButton.className = "category-nav-index";
    indexButton.type = "button";
    indexButton.textContent = "índice";
    indexButton.setAttribute("aria-expanded", "false");
    indexButton.setAttribute("aria-label", "Ver índice desta categoria");

    const next = document.createElement("a");
    next.className = "category-nav-link category-nav-next";
    const isLast = currentIndex === links.length - 1;
    next.textContent = isLast ? "Regressar →" : "seguinte →";

    if (currentIndex > 0) {
      previous.href = links[currentIndex - 1].getAttribute("href");
    } else {
      previous.classList.add("is-hidden");
      previous.setAttribute("aria-hidden", "true");
      previous.tabIndex = -1;
    }

    if (!isLast) {
      next.href = links[currentIndex + 1].getAttribute("href");
    } else {
      next.href = "index.html";
    }

    const indexPanel = document.createElement("div");
    indexPanel.className = "category-index-panel";
    indexPanel.hidden = true;

    const categoryTitle = document.createElement("div");
    categoryTitle.className = "category-index-title";
    categoryTitle.textContent = section.querySelector(".menu-title")?.textContent.trim() || "Categoria";
    indexPanel.appendChild(categoryTitle);

    links.forEach((link, index) => {
      const item = document.createElement("a");
      item.href = link.getAttribute("href");
      item.textContent = link.textContent.trim();
      item.className = "category-index-item";
      if (index === currentIndex) {
        item.classList.add("current");
        item.setAttribute("aria-current", "page");
      }
      indexPanel.appendChild(item);
    });

    const closeIndex = () => {
      indexPanel.hidden = true;
      indexButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("index-open");
    };

    indexButton.addEventListener("click", event => {
      event.preventDefault();
      const willOpen = indexPanel.hidden;
      indexPanel.hidden = !willOpen;
      indexButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
      navigation.classList.toggle("index-open", willOpen);
    });

    indexPanel.querySelectorAll("a").forEach(link => link.addEventListener("click", closeIndex));

    navigation.appendChild(previous);
    navigation.appendChild(indexButton);
    navigation.appendChild(next);
    navigation.appendChild(indexPanel);
    article.insertAdjacentElement("afterend", navigation);
  });
}

document.addEventListener("click", event => {
  const link = event.target.closest("a");
  if (!link) return;

  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank" || link.hasAttribute("download")) return;

  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

  let destination;
  try { destination = new URL(href, window.location.href); } catch { return; }
  if (destination.origin !== window.location.origin || destination.href === window.location.href) return;

  event.preventDefault();
  document.body.classList.add("page-exit");
  window.setTimeout(() => { window.location.href = destination.href; }, 220);
});