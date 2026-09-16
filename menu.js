fetch("menu.html")
  .then(response => {
    if (!response.ok) {
      throw new Error("Não foi possível carregar o menu.");
    }
    return response.text();
  })
  .then(data => {

    const container = document.getElementById("menu-container");

    if (!container) {
      return;
    }

    container.innerHTML = data;

    const menuToggle = document.getElementById("menuToggle");
    const sideMenu = document.getElementById("sideMenu");

    if (menuToggle && sideMenu) {
      menuToggle.addEventListener("click", () => {

        const isOpen = sideMenu.classList.toggle("open");

        menuToggle.textContent = isOpen ? "FECHAR" : "MENU";

        menuToggle.setAttribute(
          "aria-expanded",
          isOpen ? "true" : "false"
        );

      });

      sideMenu.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

          sideMenu.classList.remove("open");

          menuToggle.textContent = "MENU";

          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );

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
    }

    const backToTop = document.createElement("button");
    backToTop.className = "back-to-top";
    backToTop.type = "button";
    backToTop.setAttribute("aria-label", "Voltar ao topo");
    backToTop.setAttribute("title", "Voltar ao topo");
    backToTop.innerHTML = "↑";
    document.body.appendChild(backToTop);

    const updateBackToTop = () => {
      backToTop.classList.toggle("visible", window.scrollY > 250);
    };

    window.addEventListener("scroll", updateBackToTop, { passive: true });

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });

    updateBackToTop();

    document.body.classList.add("page-enter");

  })
  .catch(error => {
    console.error("Erro no menu:", error);
  });

function setupCategoryNavigation(sideMenu) {
  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  const sections = sideMenu.querySelectorAll(".menu-section");

  sections.forEach(section => {
    const links = Array.from(section.querySelectorAll(":scope > a, .menu-section-content > a"))
      .filter(link => {
        const href = link.getAttribute("href");
        return href && !href.startsWith("http") && !href.startsWith("#");
      });

    if (!links.length) {
      return;
    }

    const currentIndex = links.findIndex(link => {
      const href = link.getAttribute("href");
      return href && href.split("/").pop() === currentFile;
    });

    if (currentIndex === -1) {
      return;
    }

    const main = document.querySelector("main");
    const article = main && main.querySelector("article");

    if (!article || document.querySelector(".category-navigation")) {
      return;
    }

    const navigation = document.createElement("nav");
    navigation.className = "category-navigation";
    navigation.setAttribute("aria-label", "Navegação entre textos da categoria");

    const previous = document.createElement("a");
    previous.className = "category-nav-link category-nav-previous";
    previous.textContent = "anterior";

    const indexButton = document.createElement("button");
    indexButton.className = "category-nav-index";
    indexButton.type = "button";
    indexButton.textContent = "O";
    indexButton.setAttribute("aria-expanded", "false");
    indexButton.setAttribute("aria-label", "Ver outros textos desta categoria");

    const next = document.createElement("a");
    next.className = "category-nav-link category-nav-next";
    next.textContent = currentIndex === links.length - 1 ? "Regressar" : "seguinte";

    if (currentIndex > 0) {
      previous.href = links[currentIndex - 1].getAttribute("href");
    } else {
      previous.classList.add("is-hidden");
      previous.setAttribute("aria-hidden", "true");
      previous.tabIndex = -1;
    }

    if (currentIndex < links.length - 1) {
      next.href = links[currentIndex + 1].getAttribute("href");
    } else {
      next.href = "#";
      next.classList.add("category-nav-return");
    }

    const indexPanel = document.createElement("div");
    indexPanel.className = "category-index-panel";
    indexPanel.hidden = true;

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

    indexPanel.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeIndex);
    });

    if (currentIndex === links.length - 1) {
      next.addEventListener("click", event => {
        event.preventDefault();

        if (menuToggleAndSectionOpen(sideMenu, section)) {
          closeIndex();
        }
      });
    }

    navigation.appendChild(previous);
    navigation.appendChild(indexButton);
    navigation.appendChild(next);
    navigation.appendChild(indexPanel);

    article.insertAdjacentElement("afterend", navigation);
  });
}

function menuToggleAndSectionOpen(sideMenu, section) {
  const menuToggle = document.getElementById("menuToggle");
  const title = section.querySelector(".collapsible-title");

  if (title && !section.classList.contains("expanded")) {
    section.classList.add("expanded");
    title.setAttribute("aria-expanded", "true");
  }

  if (sideMenu && !sideMenu.classList.contains("open")) {
    sideMenu.classList.add("open");

    if (menuToggle) {
      menuToggle.textContent = "FECHAR";
      menuToggle.setAttribute("aria-expanded", "true");
    }
  }

  return true;
}

// TRANSIÇÃO SUAVE ENTRE PÁGINAS
// Interceta apenas links internos do próprio site, sem alterar o comportamento
// de links externos, âncoras, downloads ou abertura de novas janelas.
document.addEventListener("click", event => {
  const link = event.target.closest("a");

  if (!link) {
    return;
  }

  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    link.target === "_blank" ||
    link.hasAttribute("download")
  ) {
    return;
  }

  const href = link.getAttribute("href");

  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return;
  }

  let destination;

  try {
    destination = new URL(href, window.location.href);
  } catch {
    return;
  }

  if (destination.origin !== window.location.origin) {
    return;
  }

  if (destination.href === window.location.href) {
    return;
  }

  event.preventDefault();
  document.body.classList.add("page-exit");

  window.setTimeout(() => {
    window.location.href = destination.href;
  }, 220);
});
