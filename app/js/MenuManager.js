/**
 * Gestiona la UI relacionada con menús: filas dinámicas en el modal de creación
 * y la visualización del menú en el modal de consulta.
 */
class MenuManager {
    /**
     * @param {Client} client - Cliente HTTP para posibles peticiones (no usado actualmente).
     */
    constructor(client) {
        this.client = client;

        // Elementos del modal de menú
        this.menuContainer = document.getElementById("modal-menu-container");
        this.btnAddMenu = document.getElementById("modal-btn-add-menu");

        this.imgInput = document.getElementById("modal-local-image");
        this.imgPreview = document.getElementById("modal-image-preview");

        // Elementos del modal de visualización de menú
        this.viewMenuContent = document.getElementById("view-menu-content");

        // Inicializar controladores y añadir una fila inicial
        this._initMenuModalListeners();
        this.menuContainer.appendChild(this._createMenuRow());
    }

    /**
     * Inicializa listeners para agregar filas y previsualizar imagen.
     * @private
     */
    _initMenuModalListeners() {
        // Añadir fila de menú
        this.btnAddMenu.addEventListener("click", () => {
            this.menuContainer.appendChild(this._createMenuRow());
        });

        // Previsualización de imagen al seleccionar archivo
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

    /**
     * Limpia el modal de menú dejándolo con una fila vacía y sin imagen.
     */
    cleanMenuModal() {
        this.menuContainer.innerHTML = "";
        this.menuContainer.appendChild(this._createMenuRow());
        this.imgInput.value = "";
        this.imgPreview.classList.add("d-none");
    }

    /**
     * Crea y devuelve una fila DOM para capturar un platillo, precio y categoría.
     * @returns {HTMLDivElement} Elemento `.menu-row`.
     * @private
     */
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

        // Botón para remover la fila
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

    /**
     * Renderiza un arreglo de objetos `menuArray` agrupando por categoría
     * y creando una lista legible en `#view-menu-content`.
     * @param {Array<Object>} menuArray - Array con items { dish_name, price, category }.
     */
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