// PlaceManager.js
class PlaceManager {
    constructor(client, menuManager, commentManager) {
        this.client = client;
        this.menuManager = menuManager;
        this.commentManager = commentManager;

        // Modal elements
        this.modalForm = document.getElementById("modal-form-add-local");
        this.modalInstance = new bootstrap.Modal(document.getElementById("modal-pull-right-add"));

        // Container to render places
        this.placesContainer = document.getElementById("places-list");
        this.currentPlaces = [];

        // Favorites
        this.favorites = []; // store favorite places (array of place objects)
        this.favoritesContainer = document.querySelector("#favorites-list");

        // Initialize nav click listeners
        this._initPlacesListeners();
    }

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
    _toggleFavorite(placeId) {
        // ensure same type comparison
        const pid = String(placeId);
        const place = this.currentPlaces.find(p => String(p.id) === pid);
        if (!place) return;

        const index = this.favorites.findIndex(p => String(p.id) === pid);
        const btnIcon = this.placesContainer.querySelector(`.btn-favorite[data-id="${pid}"] i`);

        if (index === -1) {
            // add
            this.favorites.push(place);
            if (btnIcon) {
                btnIcon.classList.remove("bi-star");
                btnIcon.classList.add("bi-star-fill", "text-warning");
            }
        } else {
            // remove
            this.favorites.splice(index, 1);
            if (btnIcon) {
                btnIcon.classList.remove("bi-star-fill", "text-warning");
                btnIcon.classList.add("bi-star");
            }
        }

        this._renderFavorites();
    }

    // -----------------------------
    // Render helpers
    // -----------------------------
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
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                this._toggleFavorite(id);
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
    }

    // -----------------------------
    // Update nav counts from backend
    // -----------------------------
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
    async listPlaces() {
        try {
            await this.updateNavCounts();

            const activeNav = document.querySelector("#nav-list-locals .nav-link.active");
            const category = activeNav ? activeNav.dataset.category : "all";

            const url = category === "all" ? "/api/places" : `/api/places?category=${encodeURIComponent(category)}`;
            const response = await this.client.get(url);
            const places = await response.json();
            this.currentPlaces = places;
            this._renderPlaces(places);
        } catch (err) {
            console.error("Error fetching places:", err);
        }
    }

    // -----------------------------
    // Delete place
    // -----------------------------
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
            const response = await this.client.put(`/api/places/${placeId}`, formData);
            const data = await response.json();
            if (response.ok) {
                alert("Local actualizado");
                this.listPlaces();
            } else {
                alert(data.error || "Error al actualizar");
            }
        } catch (err) {
            console.error(err);
        }
    }

    // -----------------------------
    // Edit place (open modal and populate) - placeholder
    // -----------------------------
    editPlace(placeId) {
        const place = this.currentPlaces.find(p => String(p.id) === String(placeId));
        if (!place) return;
        // TODO: populate modal fields with place data for editing
        console.log("Editar lugar:", place);
    }

    // -----------------------------
    // View comments (open modal and fetch comments)
    // -----------------------------
    async viewComments(placeId) {
        this.commentManager.listComments(placeId);
    }
}

export { PlaceManager };
