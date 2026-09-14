fetch("menu.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("menu-container").innerHTML = data;

        const menuToggle = document.getElementById("menuToggle");
        const sideMenu = document.getElementById("sideMenu");

        menuToggle.addEventListener("click", () => {
            const isOpen = sideMenu.classList.toggle("open");

            menuToggle.textContent = isOpen ? "FECHAR" : "MENU";
            menuToggle.setAttribute("aria-expanded", isOpen);
        });

        sideMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                sideMenu.classList.remove("open");
                menuToggle.textContent = "MENU";
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    });
