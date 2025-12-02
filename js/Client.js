class Client {
    constructor(backendUrl) {
        this.backendUrl = backendUrl;
    }

    async post(endpoint, formData) {
        return await fetch(`${this.backendUrl}${endpoint}`, { method: "POST", body: formData });
    }

    async get(endpoint) {
        return await fetch(`${this.backendUrl}${endpoint}`);
    }

    async put(endpoint, formData) {
        return await fetch(`${this.backendUrl}${endpoint}`, { method: "PUT", body: formData });
    }

    async delete(endpoint) {
        return await fetch(`${this.backendUrl}${endpoint}`, { method: "DELETE" });
    }
}

export { Client };