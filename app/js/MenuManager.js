class MenuManager {
    constructor(client) {
        this.client = client;

        // Menu modal elements
        this.menuContainer = document.getElementById("modal-menu-container");
        this.btnAddMenu = document.getElementById("modal-btn-add-menu");

        this.imgInput = document.getElementById("modal-local-image");
        this.imgPreview = document.getElementById("modal-image-preview");

        // View menu modal elements
        this.viewMenuContent = document.getElementById("view-menu-content");

        // Initialize with one menu row
        this._initMenuModalListeners();
        this.menuContainer.appendChild(this._createMenuRow());
    }

    _initMenuModalListeners() {
        // Add menu row
        this.btnAddMenu.addEventListener("click", () => {
            this.menuContainer.appendChild(this._createMenuRow());
        });

        // Image preview
        this.imgInput.addEventListener("change", () => {
            const file = this.imgInput.files[0];
            if (!file) {
                this.imgPreview.classList.add("d-none");
                return;
            }

            this.imgPreview.src = URL.createObjectURL(file);
            this.imgPreview.classList.remove("d-none");
        });
    }

    cleanMenuModal() {
        this.menuContainer.innerHTML = "";
        this.menuContainer.appendChild(this._createMenuRow());
        this.imgInput.value = "";
        this.imgPreview.classList.add("d-none");
    }

    _createMenuRow() {
        const row = document.createElement("div");
        row.classList.add("d-flex", "gap-2", "align-items-center", "menu-row");

        // Input: Platillo
        const inputDish = document.createElement("input");
        inputDish.type = "text";
        inputDish.classList.add("form-control");
        inputDish.placeholder = "Platillo";

        // Input: Precio
        const inputPrice = document.createElement("input");
        inputPrice.type = "number";
        inputPrice.classList.add("form-control");
        inputPrice.placeholder = "Precio";

        // Select: Categoría
        const selectCategory = document.createElement("select");
        selectCategory.classList.add("form-select");

        const categories = [
            "Entradas",
            "Desayunos",
            "Sopas",
            "Ensaladas",
            "Comidas",
            "Plato Fuerte",
            "Cortes",
            "Mariscos",
            "Postre",
            "Bebidas",
            "Snacks",
            "Otros"
        ];

        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            selectCategory.appendChild(option);
        });

        // Remove button
        const btnRemove = document.createElement("button");
        btnRemove.type = "button";
        btnRemove.classList.add("btn", "btn-sm", "btn-outline-danger");
        btnRemove.innerHTML = `<i class="bi bi-dash-circle"></i>`;
        btnRemove.addEventListener("click", () => row.remove());

        // Append children
        row.appendChild(inputDish);
        row.appendChild(inputPrice);
        row.appendChild(selectCategory);
        row.appendChild(btnRemove);

        return row;
    }

    loadMenu(menuArray) {
        this.viewMenuContent.innerHTML = ""; // clear old data

        // Group dishes by category
        const categories = {};
        menuArray.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });

        // Build Bootstrap layout
        for (const category in categories) {

            // Category Title
            const title = document.createElement("h5");
            title.classList.add("mt-3", "mb-2", "fw-bold", "border-bottom", "pb-1");
            title.textContent = category;
            this.viewMenuContent.appendChild(title);

            // List group
            const list = document.createElement("ul");
            list.classList.add("list-group", "mb-3");

            categories[category].forEach(item => {
                const li = document.createElement("li");
                li.classList.add("list-group-item", "d-flex", "justify-content-between");

                li.innerHTML = `
                    <span>${item.dish_name}</span>
                    <span class="fw-bold">$${item.price}</span>
                `;

                list.appendChild(li);
            });

            this.viewMenuContent.appendChild(list);
        }
    }
}

export { MenuManager };