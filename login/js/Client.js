class Client {
    constructor(backendUrl) {
        this.backendUrl = backendUrl;
    }

    async post(endpoint, formData) {
        return await fetch(`${this.backendUrl}${endpoint}`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });
    }

    async get(endpoint) {
        return await fetch(`${this.backendUrl}${endpoint}`, {
            method: "GET",
            credentials: "include"
        });
    }

    async put(endpoint, formData) {
        return await fetch(`${this.backendUrl}${endpoint}`, {
            method: "PUT",
            body: formData,
            credentials: "include"
        });
    }

    async delete(endpoint) {
        return await fetch(`${this.backendUrl}${endpoint}`, {
            method: "DELETE",
            credentials: "include"
        });
    }
}

export { Client };
