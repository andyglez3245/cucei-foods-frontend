// PlaceManager.js
/**
 * Gestor principal de locales. Se encarga de listar, crear, editar,
 * eliminar locales y administrar la UI asociada (favoritos, horarios,
 * menú y comentarios).
 */
class PlaceManager {
    /**
     * @param {Client} client - Cliente HTTP para comunicarse con el backend.
     * @param {MenuManager} menuManager - Gestor de menús para manejar el modal de menú.
     * @param {CommentManager} commentManager - Gestor de comentarios.
     */
    constructor(client, menuManager, commentManager, sessionManager) {
        this.client = client;
        this.menuManager = menuManager;
        this.commentManager = commentManager;
        this.sessionManager = sessionManager;

        // Elementos del modal
        this.modalForm = document.getElementById("modal-form-add-local");
        this.modalInstance = new bootstrap.Modal(document.getElementById("modal-pull-right-add"));

        // Contenedor para renderizar locales
        this.placesContainer = document.getElementById("places-list");
        this.currentPlaces = [];

        // Favoritos
        this.favorites = []; // guarda objetos place
        this.favoritesContainer = document.querySelector("#favorites-list");

        // Search input
        this.searchInput = document.getElementById("search-input");
        this._searchTimeout = null;

        // Inicializar listeners de navegación y formulario
        this._initPlacesListeners();
    }

    /**
     * Determina si un local está abierto con base en su `schedule`.
     * El schedule esperado es un objeto por día con `open` y `close` en formato "HH:MM".
     * Soporta cierres que abarquen la medianoche.
     * @param {Object|string} schedule - Objeto de horario o JSON-string.
     * @returns {boolean} true si está abierto ahora, false en caso contrario.
     * @private
     */
    _isPlaceOpen(schedule) {
        // schedule expected like:
        // { monday: { open: "08:00", close: "18:00" }, ... }
        if (!schedule) return false;

        // Normalize schedule keys to lowercase for robustness
        const normSchedule = {};
        Object.keys(schedule).forEach(k => {
            try {
                normSchedule[String(k).toLowerCase()] = schedule[k];
            } catch (e) {}
        });

        // day names where getDay() 0 => sunday
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const now = new Date();
        const todayKey = dayNames[now.getDay()];

        // get today's schedule (tolerate missing)
        const todaySchedule = normSchedule[todayKey];
        if (!todaySchedule || !todaySchedule.open || !todaySchedule.close) return false;

        // parse "HH:MM" (returns {h, m} or null)
        const parseTime = (str) => {
            if (!str || typeof str !== "string") return null;
            const parts = str.split(":").map(s => parseInt(s, 10));
            if (parts.length < 1 || Number.isNaN(parts[0])) return null;
            return { h: parts[0], m: parts[1] || 0 };
        };

        const o = parseTime(todaySchedule.open);
        const c = parseTime(todaySchedule.close);
        if (!o || !c) return false;

        // build Date objects for comparison
        const openTime = new Date(now);
        openTime.setHours(o.h, o.m, 0, 0);

        const closeTime = new Date(now);
        closeTime.setHours(c.h, c.m, 0, 0);

        // If closeTime is <= openTime it means it closes next day (overnight)
        if (closeTime.getTime() <= openTime.getTime()) {
            // Case overnight: openTime ... 23:59 and 00:00 ... closeTime (next day)
            // If now >= openTime (same day after opening) => open
            if (now.getTime() >= openTime.getTime()) return true;
            // Otherwise, consider closeTime as next day
            const closeNextDay = new Date(closeTime);
            closeNextDay.setDate(closeNextDay.getDate() + 1);
            return now.getTime() <= closeNextDay.getTime();
        }

        // Normal case (same-day close)
        return now.getTime() >= openTime.getTime() && now.getTime() <= closeTime.getTime();
    }


    // -----------------------------
    // Collect menu rows
    // -----------------------------
    /**
     * Recorre las filas de menú dentro del modal y construye el array de items.
     * Cada item tiene: { dish_name, price, category }.
     * @returns {Array<Object>} Arreglo de platillos válidos.
     * @private
     */
    _collectMenuItems() {
        const menuRows = document.querySelectorAll("#modal-menu-container .menu-row");
        const menu = [];

        menuRows.forEach(row => {
            const dishInput = row.querySelector('input[type="text"]');
            const priceInput = row.querySelector('input[type="number"]');
            const categorySelect = row.querySelector('select');

            if (dishInput && priceInput && categorySelect) {
                const dishName = dishInput.value.trim();
                const price = parseFloat(priceInput.value);
                const category = categorySelect.value;

                if (dishName && !isNaN(price) && category) {
                    menu.push({ dish_name: dishName, price, category });
                }
            }
        });

        return menu;
    }

    // -----------------------------
    // Collect schedule inputs
    // -----------------------------
    /**
     * Recolecta los inputs de horario del modal y los devuelve como objeto.
     * @returns {Object} schedule - Ej: { monday: { open, close }, ... }
     * @private
     */
    _collectSchedule() {
        const openInputs = document.querySelectorAll(".schedule-open");
        const schedule = {};

        openInputs.forEach(input => {
            const day = input.dataset.day;
            const open = input.value;
            const closeEl = document.querySelector(`.schedule-close[data-day="${day}"]`);
            const close = closeEl ? closeEl.value : "";
            schedule[day] = { open, close };
        });

        return schedule;
    }

    // -----------------------------
    // Toggle favorite (UI + memory)
    // -----------------------------
    /**
     * Agrega o remueve un local de la lista local de favoritos y actualiza UI.
     * @param {string|number} placeId - ID del local.
     * @private
     */
    async _toggleFavorite(placeId) {
        // ensure same type comparison
        const pid = String(placeId);
        const place = this.currentPlaces.find(p => String(p.id) === pid);
        if (!place) return;

        const index = this.favorites.findIndex(p => String(p.id) === pid);
        const btnIcon = this.placesContainer.querySelector(`.btn-favorite[data-id="${pid}"] i`);

        // Determine action: add if not present, remove if present
        const adding = index === -1;

        // Optimistic UI: reflect change immediately, but keep a copy to rollback
        const prevFavorites = [...this.favorites];
        if (adding) {
            this.favorites.push(place);
            if (btnIcon) {
                btnIcon.classList.remove("bi-star");
                btnIcon.classList.add("bi-star-fill", "text-warning");
            }
        } else {
            this.favorites.splice(index, 1);
            if (btnIcon) {
                btnIcon.classList.remove("bi-star-fill", "text-warning");
                btnIcon.classList.add("bi-star");
            }
        }
        this._renderFavorites();

        // Persist to backend
        const userId = (this.sessionManager && this.sessionManager.userID) ? this.sessionManager.userID : null;
        if (!userId) return; // not logged in, nothing to persist

        try {
            if (adding) {
                // Prefer sending JSON; some backends expect application/json
                let resp = null;
                try {
                    resp = await this.client.postJson(`/api/places/${pid}/favorite`, { user_id: userId, place_id: pid });
                } catch (e) {
                    // fallback to FormData if network-level error
                    console.warn('postJson failed, falling back to FormData', e);
                    const fd = new FormData();
                    fd.append('user_id', userId);
                    resp = await this.client.post(`/api/places/${pid}/favorite`, fd);
                }

                if (!resp || !resp.ok) {
                    // log body for debugging
                    try {
                        const text = resp ? await resp.text() : 'no-response';
                        console.error('Favorite add failed', resp ? resp.status : 'no-resp', text);
                    } catch (e) { console.error('Error reading failed response body', e); }
                    // rollback
                    this.favorites = prevFavorites;
                    this._renderPlaces(this.currentPlaces);
                    alert('Error al marcar favorito');
                } else {
                    // optional: update favorites with returned object
                    try {
                        const body = await resp.json();
                        // if backend returned the saved place or favorite object, ensure it's in favorites
                        if (body && (body.place || body.place_id || body.id)) {
                            // noop - keeping optimistic UI
                        }
                    } catch (e) { /* ignore non-json */ }
                }
            } else {
                // delete using JSON body to avoid Unsupported Media Type issues
                let resp = null;
                try {
                    resp = await this.client.deleteJson(`/api/places/${pid}/favorite`, { user_id: userId, place_id: pid });
                } catch (e) {
                    console.warn('deleteJson failed, falling back to query param', e);
                    resp = await this.client.delete(`/api/places/${pid}/favorite?user_id=${encodeURIComponent(userId)}`);
                }

                if (!resp || !resp.ok) {
                    try {
                        const text = resp ? await resp.text() : 'no-response';
                        console.error('Favorite remove failed', resp ? resp.status : 'no-resp', text);
                    } catch (e) { console.error('Error reading failed response body', e); }
                    this.favorites = prevFavorites;
                    this._renderPlaces(this.currentPlaces);
                    alert('Error al remover favorito');
                }
            }
        } catch (err) {
            console.error('Error persisting favorite:', err);
            this.favorites = prevFavorites;
            this._renderPlaces(this.currentPlaces);
            alert('Error de red al actualizar favorito');
        }
    }

    // -----------------------------
    // Render helpers
    // -----------------------------
    /**
     * Devuelve HTML con iconos de estrellas según la calificación.
     * @param {number} rating - Valor numérico de rating (puede ser decimal).
     * @returns {string} HTML con iconos.
     * @private
     */
    _renderStars(rating = 0) {
        const fullStars = Math.floor(rating || 0);
        const halfStar = (rating % 1) >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) starsHTML += '<i class="bi bi-star-fill text-warning"></i>';
        if (halfStar) starsHTML += '<i class="bi bi-star-half text-warning"></i>';
        for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="bi bi-star text-warning"></i>';
        return starsHTML;
    }

    _formatSchedule(schedule) {
        if (!schedule) return "";
        // If schedule is a JSON string, parse it
        if (typeof schedule === "string") {
            try { schedule = JSON.parse(schedule); }
            catch (e) { return ""; }
        }

        const dayLabels = {
            monday: "Lun",
            tuesday: "Mar",
            wednesday: "Mié",
            thursday: "Jue",
            friday: "Vie",
            saturday: "Sáb",
            sunday: "Dom"
        };

        let html = `<div class="schedule-block mt-2"><small class="text-muted">🕒 Horario:</small><br>`;
        for (const key of Object.keys(dayLabels)) {
            const d = schedule[key];
            if (!d || !d.open || !d.close) {
                html += `<small>${dayLabels[key]}: Cerrado</small><br>`;
            } else {
                html += `<small>${dayLabels[key]}: ${d.open} – ${d.close}</small><br>`;
            }
        }
        html += `</div>`;
        return html;
    }

    // -----------------------------
    // Render favorites list
    // -----------------------------
    /**
     * Renderiza la lista de favoritos en la columna lateral.
     * @private
     */
    _renderFavorites() {
        if (!this.favoritesContainer) return;
        this.favoritesContainer.innerHTML = "";

        this.favorites.forEach(place => {
            const a = document.createElement("a");
            a.href = "#";
            a.classList.add("list-group-item", "list-group-item-action", "mb-2");

            // build image url
            const imgSrc = place.image_url ? `${this.client.backendUrl}${place.image_url}` : 'images/default_restaurant.jpg';

            a.innerHTML = `
                <div class="d-flex align-items-center">
                    <img class="rounded-circle me-3" width="40" height="40" style="object-fit:cover" src="${imgSrc}">
                    <div>
                        <h6 class="mb-0">${place.name}</h6>
                        <small>${place.category}</small>
                    </div>
                </div>
            `;
            // optional: clicking favorite item could open place details — you can add listener here
            this.favoritesContainer.appendChild(a);
        });
    }

    // -----------------------------
    // Render places list (card)
    // -----------------------------
    /**
     * Renderiza la colección de `places` en la UI principal.
     * @param {Array<Object>} places - Array de objetos con la info de cada local.
     * @private
     */
    _renderPlaces(places) {
        if (!this.placesContainer) return;
        this.placesContainer.innerHTML = "";

        places.forEach(place => {
            // ensure place.schedule is object if possible
            if (typeof place.schedule === "string") {
                try { place.schedule = JSON.parse(place.schedule); } catch {}
            }

            // build full image URL using client backendUrl
            const imgSrc = place.image_url ? `${this.client.backendUrl}${place.image_url}` : 'images/default_restaurant.jpg';

            // schedule HTML
            const scheduleHtml = this._formatSchedule(place.schedule);

            // latest comment (backend returns latest_comment)
            const commentText = place.latest_comment || "";

            // favorite active
            const isFav = this.favorites.some(f => String(f.id) === String(place.id));
            const starClass = isFav ? "bi-star-fill text-warning" : "bi-star";

            const div = document.createElement("div");
            div.classList.add("local-list-item", "list-group-item", "list-group-item-action", "mb-2");

            div.innerHTML = `
                <div class="row align-items-center">
                    <div class="col-auto">
                        <img class="local-avatar" src="${imgSrc}">
                    </div>

                    <div class="col">
                        <h6 class="mb-1 mt-2">${place.name}</h6>
                        <small class="text-muted d-block mt-3">
                            Categoría: <b>${place.category}</b>
                        </small>

                        <small class="d-block mt-1">
                            ${
                                this._isPlaceOpen(place.schedule)
                                    ? '<span class="text-success">🟢 Abierto ahora</span>'
                                    : '<span class="text-danger">🔴 Cerrado ahora</span>'
                            }
                        </small>

                        ${scheduleHtml}

                        <div class="rating d-flex align-items-center gap-1 mt-2">
                            ${this._renderStars(place.rating)}
                            <small class="text-muted ms-2">(${(place.rating || 0).toFixed(1)})</small>
                        </div>

                        <div class="comments mt-2">
                            <small class="text-muted">“${commentText}”</small>
                        </div>

                        <div class="mt-3 d-flex gap-2 flex-wrap">
                            <button class="btn btn-sm btn-outline-primary btn-view-menu" 
                                    data-bs-toggle="modal" data-bs-target="#modal-view-menu" 
                                    data-id="${place.id}">
                                Ver menú
                            </button>

                            <button class="btn btn-sm btn-outline-secondary btn-view-comments" 
                                    data-bs-toggle="modal" data-bs-target="#modal-comments"
                                    data-id="${place.id}">
                                Ver comentarios
                            </button>
                        </div>
                    </div>

                    <div class="col-auto d-flex flex-row align-items-center gap-2">
                        <button class="btn btn-sm btn-outline-secondary btn-favorite" title="Favoritos" data-id="${place.id}">
                            <i class="bi ${starClass}"></i>
                        </button>

                        <button class="btn btn-sm btn-outline-secondary btn-edit" title="Editar" data-id="${place.id}">
                            <i class="bi bi-pencil-square"></i>
                        </button>

                        <button class="btn btn-sm btn-outline-danger btn-delete" title="Eliminar" data-id="${place.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            this.placesContainer.appendChild(div);
            // attach listeners for this place block
            this._attachEventListeners(div, place);
        });
    }

    // -----------------------------
    // Attach event listeners for a single place div
    // -----------------------------
    /**
     * Añade listeners a los botones dentro de la tarjeta de un local.
     * @param {HTMLElement} placeDiv - Elemento root del local.
     * @param {Object} placeInfo - Objeto de datos del local.
     * @private
     */
    _attachEventListeners(placeDiv, placeInfo) {
        // delete
        placeDiv.querySelectorAll(".btn-delete").forEach(btn =>
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.id;
                await this.deletePlace(id);
            })
        );

        // view menu
        placeDiv.querySelectorAll(".btn-view-menu").forEach(btn =>
            btn.addEventListener("click", (e) => {
                // use menuManager to populate modal
                this.menuManager.loadMenu(placeInfo.menu || []);
            })
        );

        // edit
        placeDiv.querySelectorAll(".btn-edit").forEach(btn =>
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                this.editPlace(id);
            })
        );

        // comments
        placeDiv.querySelectorAll(".btn-view-comments").forEach(btn =>
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                document.getElementById("modal-comments").dataset.placeId = id;
                this.viewComments(id);
            })
        );

        // favorite toggle
        placeDiv.querySelectorAll(".btn-favorite").forEach(btn =>
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.id;
                await this._toggleFavorite(id);
            })
        );
    }

    // -----------------
    // Places listeners 
    // -----------------
    async _initPlacesListeners() {
        // Nav links for filtering
        const navLinks = document.querySelectorAll("#nav-list-locals .nav-link");
        navLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove("active"));
                link.classList.add("active");
                this.listPlaces();
            });
        });

        // Event listener for save local button
        const btnSave = document.getElementById("modal-btn-save");
        btnSave.addEventListener("click", async () => {
            await this.createPlace();
        });

        // Search input listener (debounced) + Enter key and search button
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                const q = e.target.value;
                if (this._searchTimeout) clearTimeout(this._searchTimeout);
                this._searchTimeout = setTimeout(() => {
                    this.searchPlaces(q);
                }, 250);
            });

            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (this._searchTimeout) { clearTimeout(this._searchTimeout); this._searchTimeout = null; }
                    this.searchPlaces(e.target.value);
                }
            });
        }

        // Add New Local button: ensure modal is in "create" state
        const btnAdd = document.querySelector('.btn-add-new-contact');
        if (btnAdd) {
            btnAdd.addEventListener('click', (e) => {
                // reset modal title and form
                const modalTitle = document.querySelector('#modal-pull-right-add .modal-title');
                if (modalTitle) modalTitle.textContent = 'Agregar nuevo local';
                if (this.modalForm) {
                    delete this.modalForm.dataset.editId;
                    this.modalForm.reset();
                }
                try { this.menuManager.cleanMenuModal(); } catch (err) {}
                const imgPreview = document.getElementById('modal-image-preview');
                if (imgPreview) imgPreview.classList.add('d-none');
            });
        }
    }

    /**
     * Busca locales por texto. Si no hay texto muestra todos los locales.
     * Realiza filtrado cliente sobre `this.currentPlaces` si ya están cargados,
     * de lo contrario solicita la lista al backend y filtra.
     * @param {string} query
     */
    async searchPlaces(query) {
        const q = (query || "").trim().toLowerCase();

        if (!q) {
            // If we already have places, re-render them; otherwise fetch
            if (this.currentPlaces && this.currentPlaces.length > 0) {
                this._renderPlaces(this.currentPlaces);
            } else {
                await this.listPlaces();
            }
            return;
        }

        // Ensure we have places to filter
        if (!this.currentPlaces || this.currentPlaces.length === 0) {
            await this.listPlaces();
        }

        const filtered = (this.currentPlaces || []).filter(p => {
            const name = (p.name || "").toString().toLowerCase();
            const category = (p.category || "").toString().toLowerCase();
            return name.includes(q) || category.includes(q);
        });

        this._renderPlaces(filtered);
    }

    // -----------------------------
    // Update nav counts from backend
    // -----------------------------
    /**
     * Actualiza los contadores de la barra lateral consultando al backend.
     */
    async updateNavCounts() {
        try {
            const response = await this.client.get("/api/places/counts");
            const counts = await response.json();

            document.getElementById("nav-locals-all").textContent = counts.all || 0;
            document.getElementById("nav-locals-breakfast").textContent = counts["Desayunos y Comidas"] || 0;
            document.getElementById("nav-locals-coffe").textContent = counts["Bebidas y Cafetería"] || 0;
            document.getElementById("nav-locals-snacks").textContent = counts["Snacks"] || 0;
        } catch (err) {
            console.error("Error fetching nav counts:", err);
        }
    }

    // -------------
    // Create place
    // -------------
    /**
     * Crea un nuevo local tomando los datos del modal y enviándolos al backend.
     */
    async createPlace() {
        const name = document.getElementById("modal-local-name").value.trim();
        const categorySelect = document.getElementById("modal-local-category");
        const imageInput = document.getElementById("modal-local-image");

        const menu = this._collectMenuItems();
        const schedule = this._collectSchedule();

        if (!name || !categorySelect.value || menu.length === 0) {
            alert("Completa todos los campos y agrega al menos un platillo");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("category", categorySelect.value);
        if (imageInput.files[0]) formData.append("image", imageInput.files[0]);
        formData.append("menu", JSON.stringify(menu));
        formData.append("schedule", JSON.stringify(schedule));

        try {
            // If form has data-edit-id then this is an update
            const editId = this.modalForm ? this.modalForm.dataset.editId : null;
            if (editId) {
                await this.updatePlace(editId, formData);
                // clear edit mode
                delete this.modalForm.dataset.editId;
                this.menuManager.cleanMenuModal();
                this.modalForm.reset();
                try { this.modalInstance.hide(); } catch (e) {}
                return;
            }

            const response = await this.client.post("/api/places", formData);
            const data = await response.json();
            if (response.ok) {
                this.menuManager.cleanMenuModal();
                this.modalForm.reset();
                this.modalInstance.hide();
                alert("Local agregado correctamente!");
                this.listPlaces();
            } else {
                alert(data.error || "Error al agregar local");
            }
        } catch (err) {
            console.error(err);
            alert("Error de red al agregar local");
        }
    }

    // -----------------------------
    // List places (with category filter)
    // -----------------------------
    /**
     * Consulta y lista locales aplicando el filtro de categoría activo.
     */
    async listPlaces() {
        try {
            await this.updateNavCounts();

            const activeNav = document.querySelector("#nav-list-locals .nav-link.active");
            const category = activeNav ? activeNav.dataset.category : "all";

            const url = category === "all" ? "/api/places" : `/api/places?category=${encodeURIComponent(category)}`;
            const response = await this.client.get(url);
            const places = await response.json();
            this.currentPlaces = places;
            // Load user's favorites from backend (if logged in) before rendering
            try { await this._loadFavorites(); } catch (e) { /* ignore */ }
            this._renderPlaces(places);
        } catch (err) {
            console.error("Error fetching places:", err);
        }
    }

    /**
     * Carga la lista de favoritos del usuario desde el backend y mapea a `this.favorites`.
     * Intenta endpoints comunes: `/api/users/:id/favorites` y `/api/favorites?user_id=`.
     * @private
     */
    async _loadFavorites() {
        // require session info
        const userId = (this.sessionManager && this.sessionManager.userID) ? this.sessionManager.userID : null;
        if (!userId) return;

        let favs = null;
        try {
            const resp = await this.client.get(`/api/users/${userId}/favorites`);
            if (!resp || !resp.ok) {
                console.warn('No se pudo cargar favoritos');
            };
            favs = await resp.json();
        } catch (e) {
            console.error('Error cargando favoritos', e);
        }

        if (!favs) return;

        // favs can be array of ids or array of place objects
        const favIds = favs.map(f => (typeof f === 'object' ? (f.id || f.place_id || f.placeId) : f)).filter(Boolean).map(String);

        // Map to place objects from currentPlaces when possible
        this.favorites = (this.currentPlaces || []).filter(p => favIds.includes(String(p.id)));
        // If none matched but favs are full place objects, use them
        if (this.favorites.length === 0 && favs.length > 0 && typeof favs[0] === 'object') {
            this.favorites = favs;
        }

        this._renderFavorites();
    }

    // -----------------------------
    // Delete place
    // -----------------------------
    /**
     * Elimina un local tras confirmación y refresca la lista.
     * @param {string|number} placeId - ID del local a eliminar.
     */
    async deletePlace(placeId) {
        if (!confirm("¿Seguro que deseas eliminar este local?")) return;
        try {
            const response = await this.client.delete(`/api/places/${placeId}`);
            if (response.ok) {
                alert("Local eliminado");
                this.listPlaces();
            } else {
                const data = await response.json();
                alert(data.error || "Error al eliminar");
            }
        } catch (err) {
            console.error(err);
        }
    }

    // -----------------------------
    // Update place (PUT)
    // -----------------------------
    async updatePlace(placeId, formData) {
        try {
            // If formData includes a file under 'image', send multipart/form-data
            let resp = null;
            const maybeImage = formData instanceof FormData ? formData.get('image') : null;
            if (formData instanceof FormData) {
                // always prefer sending FormData with PUT when caller provided it
                resp = await this.client.put(`/api/places/${placeId}`, formData);
            } else if (maybeImage && maybeImage.size) {
                resp = await this.client.put(`/api/places/${placeId}`, formData);
            } else {
                // fallback: convert plain object/FormData-like to JSON
                const obj = {};
                if (formData && typeof formData.entries === 'function') {
                    for (const [k, v] of formData.entries()) {
                        if (k === 'menu' || k === 'schedule') {
                            try { obj[k] = JSON.parse(v); } catch (e) { obj[k] = v; }
                        } else if (k === 'price' || k === 'cost') {
                            obj[k] = Number(v);
                        } else {
                            obj[k] = v;
                        }
                    }
                } else if (formData && typeof formData === 'object') {
                    Object.assign(obj, formData);
                }

                resp = await this.client.putJson(`/api/places/${placeId}`, obj);
            }

            if (!resp) throw new Error('No response from server');
            let data = null;
            try { data = await resp.json(); } catch (e) { data = null; }
            if (resp.ok) {
                alert('Local actualizado');
                // cleanup modal and refresh
                try { delete this.modalForm.dataset.editId; } catch (e) {}
                try { this.menuManager.cleanMenuModal(); } catch (e) {}
                try { this.modalForm.reset(); } catch (e) {}
                try { this.modalInstance.hide(); } catch (e) {}
                this.listPlaces();
            } else {
                alert((data && data.error) || 'Error al actualizar');
            }
        } catch (err) {
            console.error('Error updating place', err);
            alert('Error de red al actualizar local');
        }
    }

    // -----------------------------
    // Edit place (open modal and populate) - placeholder
    // -----------------------------
        /**
         * Abre el modal de edición y debería popular los campos con los datos
         * del local. Actualmente es un placeholder que imprime en consola.
         * @param {string|number} placeId - ID del local a editar.
         */
    editPlace(placeId) {
        const place = this.currentPlaces.find(p => String(p.id) === String(placeId));
        if (!place) return;
        console.log('Editar lugar:', place);
        // populate modal fields with place data for editing
        const modalTitle = document.querySelector('#modal-pull-right-add .modal-title');
        if (modalTitle) modalTitle.textContent = 'Editar local';

        // set form values
        if (this.modalForm) {
            this.modalForm.dataset.editId = String(place.id);
            const nameEl = document.getElementById('modal-local-name');
            if (nameEl) nameEl.value = place.name || '';

            const categoryEl = document.getElementById('modal-local-category');
            if (categoryEl) {
                try { categoryEl.value = place.category || categoryEl.options[0].value; } catch (e) {}
            }

            // schedule: fill inputs by data-day
            try {
                const schedule = (typeof place.schedule === 'string') ? JSON.parse(place.schedule) : (place.schedule || {});
                document.querySelectorAll('.schedule-open').forEach(inp => {
                    const day = inp.dataset.day;
                    if (schedule && schedule[day] && schedule[day].open) inp.value = schedule[day].open;
                });
                document.querySelectorAll('.schedule-close').forEach(inp => {
                    const day = inp.dataset.day;
                    if (schedule && schedule[day] && schedule[day].close) inp.value = schedule[day].close;
                });
            } catch (e) { console.warn('Error parsing schedule for edit', e); }

            // menu: use menuManager to populate modal rows
            try {
                if (this.menuManager && typeof this.menuManager.populateMenuModal === 'function') {
                    this.menuManager.populateMenuModal(place.menu || []);
                } else {
                    console.error('menuManager.populateMenuModal is not a function', {
                        menuManager: this.menuManager,
                        proto: this.menuManager ? Object.getPrototypeOf(this.menuManager) : null
                    });
                    // fallback: clear menu container
                    const menuContainer = document.getElementById('modal-menu-container');
                    if (menuContainer) menuContainer.innerHTML = '';
                }
            } catch (e) { console.error('Error populating menu modal', e); }

            // image preview (can't set file input programmatically)
            try {
                const imgPreview = document.getElementById('modal-image-preview');
                if (imgPreview) {
                    const src = place.image_url ? `${this.client.backendUrl}${place.image_url}` : '';
                    if (src) {
                        imgPreview.src = src;
                        imgPreview.classList.remove('d-none');
                    } else {
                        imgPreview.src = '';
                        imgPreview.classList.add('d-none');
                    }
                }
            } catch (e) {}
        }

        // show modal
        try { this.modalInstance.show(); } catch (e) { console.warn('Could not show modal', e); }
    }

    // -----------------------------
    // View comments (open modal and fetch comments)
    // -----------------------------
        /**
         * Abre el modal de comentarios y solicita la lista al CommentManager.
         * @param {string|number} placeId - ID del local.
         */
    async viewComments(placeId) {
        this.commentManager.listComments(placeId);
    }
}

export { PlaceManager };
