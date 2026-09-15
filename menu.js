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

  })
  .catch(error => {
    console.error("Erro no menu:", error);
  });
