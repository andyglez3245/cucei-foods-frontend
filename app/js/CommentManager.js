/**
 * Administra la lógica de comentarios y calificaciones dentro del modal.
 * Se encarga de: escuchar eventos de estrellas, enviar comentarios al backend
 * y renderear los comentarios en el modal.
 */
class CommentManager {
    /**
     * @param {Client} client - Instancia del cliente HTTP del proyecto.
     * @param {SessionManager} sessionManager - Maneja sesión y datos de usuario.
     */
    constructor(client, sessionManager) {
        this.client = client;
        this.sessionManager = sessionManager;
        this.selectedRating = 0;

        // Elementos del modal
        this.starRatingContainer = document.getElementById("modal-star-rating");
        this.btnSubmitComment = document.getElementById("btn-submit-comment");
        this.commentList = document.getElementById("comments-list");

        // Inicializar listeners de estrellas y botón
        this._addEventListeners();
    }

    /**
     * Añade listeners a las estrellas y al botón de publicar comentario.
     * @private
     */
    _addEventListeners() {
        // STAR RATING INSIDE MODAL
        this.starRatingContainer.querySelectorAll(".star").forEach(star => {

            // Hover preview
            star.addEventListener("mouseenter", () => {
                const value = parseInt(star.dataset.value);
                this._highlightStars(value, "hovered");
            });

            // Remove hover preview
            star.addEventListener("mouseleave", () => {
                this._highlightStars(this.selectedRating, "selected");
            });

            // Click to select
            star.addEventListener("click", () => {
                this.selectedRating = parseInt(star.dataset.value);
                this._highlightStars(this.selectedRating, "selected");
            });
        });

        this.btnSubmitComment.addEventListener("click", async () => {
            await this.addComment();
        });
    }

    /**
     * Resalta las estrellas hasta `amount` con la clase indicada.
     * @param {number} amount - Cantidad de estrellas a resaltar.
     * @param {string} className - Clase CSS a aplicar (`hovered` o `selected`).
     * @private
     */
    _highlightStars(amount, className) {
        this.starRatingContainer.querySelectorAll(".star").forEach(star => {
            star.classList.remove("hovered", "selected");
            if (parseInt(star.dataset.value) <= amount) {
                star.classList.add(className);
            }
        });
    }

    /**
     * Renderiza un elemento de comentario en el DOM del modal.
     * @param {string} user - Nombre del usuario que comenta.
     * @param {string} comment - Texto del comentario.
     * @param {number} rating - Calificación (1-5).
     * @private
     */
    _renderCommentItem(user, comment, rating) {
        // Build stars
        let starsHTML = "";
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<i class="bi ${i <= rating ? "bi-star-fill" : "bi-star"} text-warning"></i>`;
        }

        // Create item root
        const item = document.createElement("div");
        item.className = "list-group-item";

        // Final comment HTML
        item.innerHTML = `
            <div class="d-flex">
                <img src="images/default_user.png" class="comment-user-image">

                <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2">
                        <strong>${user}</strong>
                        <div class="text-warning small">${starsHTML}</div>
                    </div>

                    <p class="mt-2 mb-1">${comment}</p>
                </div>
            </div>
        `;

        this.commentList.prepend(item);
    }

    /**
     * Recoge el comentario del textarea y lo envía al backend; luego lo renderiza.
     * Valida que exista texto y una calificación.
     */
    async addComment() {
        const input = document.getElementById("comment-input");
        const text = input.value.trim();
        if (!text) return;
        if (this.selectedRating === 0) return alert("Selecciona una calificación.");
        // Send to backend
        try {
            const placeId = document.getElementById("modal-comments").dataset.placeId;
            const formData = new FormData();
            formData.append("user_id", this.sessionManager.userID);
            formData.append("text", text);
            formData.append("rating", this.selectedRating);

            const response = await this.client.post(`/api/places/${placeId}/comments`, formData);
            const userName = this.sessionManager.userName;
            if (response.ok) {
                this._renderCommentItem(userName, text, this.selectedRating);
                alert("Commentario agregado correctamente!");
            } else {
                alert("Error al agregar el comentario");
            }
        } catch (err) {
            console.error("Error submitting comment:", err);
            alert("Error al agregar un comentario al local");
        }
        
        // Reset
        input.value = "";
        this.selectedRating = 0;
        this._highlightStars(0, "selected");
    }

    /**
     * Obtiene los comentarios del backend para un `placeId` y los muestra en el modal.
     * @param {string|number} placeId - Identificador del local.
     */
    async listComments(placeId) {
        // Clear existing comments
        this.commentList.innerHTML = "";

        try {
            const resp = await this.client.get(`/api/places/${placeId}/comments`);
            const comments = await resp.json();

            // Populate comments in the modal
            comments.forEach(comment => {
                this._renderCommentItem(comment.user_name, comment.text, comment.rating);
            });
        } catch (err) {
            console.error("Error fetching comments:", err);
        }
    }

}

export { CommentManager };