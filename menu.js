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

    if (!menuToggle || !sideMenu) {
      return;
    }

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

  })
  .catch(error => {
    console.error("Erro no menu:", error);
  });
