class CommentManager {
    constructor(client) {
        this.client = client;
        this.selectedRating = 0;

        // Modal elements
        this.starRatingContainer = document.getElementById("modal-star-rating");
        this.btnSubmitComment = document.getElementById("btn-submit-comment");
        this.commentList = document.getElementById("comments-list");

        // Initialize star rating listeners
        this._addEventListeners();
    }

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

    _highlightStars(amount, className) {
        this.starRatingContainer.querySelectorAll(".star").forEach(star => {
            star.classList.remove("hovered", "selected");
            if (parseInt(star.dataset.value) <= amount) {
                star.classList.add(className);
            }
        });
    }

    _renderCommentItem(comment, rating) {
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
                        <strong>Tú</strong>
                        <div class="text-warning small">${starsHTML}</div>
                    </div>

                    <p class="mt-2 mb-1">${comment}</p>
                </div>
            </div>
        `;

        this.commentList.prepend(item);
    }

    async addComment() {
        const input = document.getElementById("comment-input");
        const text = input.value.trim();
        if (!text) return;
        if (this.selectedRating === 0) return alert("Selecciona una calificación.");
        // Send to backend
        try {
            const placeId = document.getElementById("modal-comments").dataset.placeId;
            const formData = new FormData();
            formData.append("user_name", "Andrea");  // Placeholder user
            formData.append("user_image", "images/default_user.png");
            formData.append("text", text);
            formData.append("rating", this.selectedRating);
            const response = await this.client.post(`/api/places/${placeId}/comments`, formData);

            if (response.ok) {
                this._renderCommentItem(text, this.selectedRating);
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

    async listComments(placeId) {
        // Clear existing comments
        this.commentList.innerHTML = "";

        try {
            const resp = await this.client.get(`/api/places/${placeId}/comments`);
            const comments = await resp.json();

            // Populate comments in the modal
            comments.forEach(comment => {
                this._renderCommentItem(comment.text, comment.rating);
            });
        } catch (err) {
            console.error("Error fetching comments:", err);
        }
    }

}

export { CommentManager };