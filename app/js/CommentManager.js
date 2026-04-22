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
        this.userHasComment = false;
        this.userCommentId = null;
        this.currentPlaceId = null;

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
    _renderCommentItem(user, comment, rating, meta = {}) {
        // Build stars
        let starsHTML = "";
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<i class="bi ${i <= rating ? "bi-star-fill" : "bi-star"} text-warning"></i>`;
        }

        // Create item root
        const item = document.createElement("div");
        item.className = "list-group-item";

        // If meta contains ownership info and it's the current user, render action buttons
        const isOwner = meta.userId && (meta.userId === this.sessionManager.userID);

        // Final comment HTML (include buttons for owner)
        item.innerHTML = `
            <div class="d-flex">
                <img src="images/default_user.png" class="comment-user-image">

                <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2">
                        <strong>${user}</strong>
                        <div class="text-warning small">${starsHTML}</div>
                    </div>

                    <p class="mt-2 mb-1 comment-text">${comment}</p>
                </div>
            </div>
        `;

        // If the comment belongs to the current user, add Edit/Delete buttons
        if (isOwner && meta.commentId) {
            const actions = document.createElement('div');
            actions.className = 'mt-2 d-flex gap-2';

            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn btn-sm btn-outline-primary btn-edit-comment';
            btnEdit.textContent = 'Editar';
            btnEdit.dataset.commentId = meta.commentId;
            btnEdit.dataset.userId = meta.userId;

            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn btn-sm btn-outline-danger btn-delete-comment';
            btnDelete.textContent = 'Eliminar';
            btnDelete.dataset.commentId = meta.commentId;
            btnDelete.dataset.userId = meta.userId;

            actions.appendChild(btnEdit);
            actions.appendChild(btnDelete);

            // Append actions under the comment text
            item.querySelector('.flex-grow-1').appendChild(actions);

            // Attach listeners
            btnEdit.addEventListener('click', async (e) => {
                e.preventDefault();
                const commentId = btnEdit.dataset.commentId;
                const currentTextEl = item.querySelector('.comment-text');
                const currentText = currentTextEl.textContent.trim();

                const newText = prompt('Edita tu comentario:', currentText);
                if (newText === null) return; // user cancelled
                const newRatingStr = prompt('Nueva calificación (1-5):', String(rating));
                const newRating = parseInt(newRatingStr);
                if (!newText.trim()) return alert('El comentario no puede estar vacío');
                if (!(newRating >=1 && newRating <=5)) return alert('Rating inválido');

                try {
                    const payload = {
                        user_id: this.sessionManager.userID,
                        text: newText.trim(),
                        rating: newRating
                    };

                    const resp = await this.client.putJson(`/api/comments/${commentId}`, payload);
                    if (resp && resp.ok) {
                        // update DOM: text and stars
                        currentTextEl.textContent = newText.trim();
                        const starsContainer = item.querySelector('.text-warning.small');
                        let newStars = '';
                        for (let i = 1; i <= 5; i++) {
                            newStars += `<i class="bi ${i <= newRating ? 'bi-star-fill' : 'bi-star'} text-warning"></i>`;
                        }
                        starsContainer.innerHTML = newStars;
                        alert('Comentario actualizado');
                    } else {
                        alert('Error al actualizar el comentario');
                    }
                } catch (err) {
                    console.error('Error updating comment:', err);
                    alert('Error al actualizar el comentario');
                }
            });

            btnDelete.addEventListener('click', async (e) => {
                e.preventDefault();
                if (!confirm('¿Eliminar este comentario?')) return;
                const commentId = btnDelete.dataset.commentId;
                    try {
                    const resp = await this.client.deleteJson(`/api/comments/${commentId}`, { user_id: this.sessionManager.userID });
                    if (resp && resp.ok) {
                        item.remove();
                        // Allow user to post again
                        if (this.userCommentId && String(this.userCommentId) === String(commentId)) {
                            this.userHasComment = false;
                            this.userCommentId = null;
                            if (this.btnSubmitComment) this.btnSubmitComment.disabled = false;
                        }
                        alert('Comentario eliminado');
                    } else {
                        alert('Error al eliminar comentario');
                    }
                } catch (err) {
                    console.error('Error deleting comment:', err);
                    alert('Error al eliminar comentario');
                }
            });
        }

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
        if (this.userHasComment) return alert('Solo puedes dejar un comentario por local.');
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
                // Try to extract created comment id if backend returns it
                let created = null;
                if (response && typeof response.json === 'function') {
                    try { created = await response.json(); } catch (e) { /* ignore */ }
                }
                const createdId = created && (created.id || created.comment_id) ? (created.id || created.comment_id) : null;
                // Mark that user now has a comment for this place
                if (createdId) {
                    this.userHasComment = true;
                    this.userCommentId = createdId;
                    this.currentPlaceId = placeId;
                    if (this.btnSubmitComment) this.btnSubmitComment.disabled = true;
                }

                this._renderCommentItem(userName, text, this.selectedRating, { commentId: createdId, userId: this.sessionManager.userID });
                alert("Comentario agregado correctamente!");
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
        this.currentPlaceId = placeId;
        this.userHasComment = false;
        this.userCommentId = null;

        try {
            const resp = await this.client.get(`/api/places/${placeId}/comments`);
            const comments = await resp.json();

            // Populate comments in the modal
            comments.forEach(comment => {
                // comment may contain id or comment_id and user_id
                const commentId = comment.id || comment.comment_id || null;
                const userId = comment.user_id || comment.userId || null;
                // If this comment is by current user, track it and disable submit
                if (userId && String(userId) === String(this.sessionManager.userID)) {
                    this.userHasComment = true;
                    this.userCommentId = commentId;
                    if (this.btnSubmitComment) this.btnSubmitComment.disabled = true;
                }

                this._renderCommentItem(comment.user_name, comment.text, comment.rating, { commentId: commentId, userId: userId });
            });
        } catch (err) {
            console.error("Error fetching comments:", err);
        }
    }

}

export { CommentManager };