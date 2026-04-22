/**
 * Cliente HTTP simple que envuelve llamadas `fetch` hacia el backend.
 * Provee métodos `get`, `post`, `put` y `delete` para simplificar peticiones.
 */
class Client {
    /**
     * Construye un cliente apuntando a la URL base del backend.
     * @param {string} backendUrl - URL base del servidor (por ejemplo "http://localhost:5000" o "https://your-ngrok-url.ngrok-free.dev").
     */
    constructor(backendUrl) {
        this.backendUrl = backendUrl;
        // Definimos los headers por defecto que incluyen el necesario para ngrok
        this.defaultHeaders = new Headers({
            // Este header es crucial para saltarse la advertencia ERR_NGROK_6024
            "ngrok-skip-browser-warning": "true", 
            // Puedes añadir otros headers comunes aquí si los necesitas, ej:
            // "Content-Type": "application/json", 
        });
    }

    /**
     * Helper para combinar headers con los headers por defecto.
     * @param {object} customHeaders - Headers adicionales para una petición específica.
     * @returns {Headers} - Objeto Headers combinado.
     */
    _getHeaders(customHeaders = {}) {
        // Clone default headers to avoid mutating the shared Headers instance
        const headers = new Headers();
        try {
            for (const [k, v] of this.defaultHeaders.entries()) {
                headers.append(k, v);
            }
        } catch (e) {
            // If defaultHeaders is not iterable for some reason, ignore
        }
        for (const key in customHeaders) {
            headers.append(key, customHeaders[key]);
        }
        return headers;
    }

    /**
     * Realiza una petición POST con `FormData`.
     * Nota: FormData gestiona su propio Content-Type (multipart/form-data), 
     * por lo que fetch lo manejará automáticamente sin necesidad de especificar Content-Type aquí.
     * @param {string} endpoint - Ruta del endpoint (ej. `/api/places`).
     * @param {FormData} formData - Datos a enviar como cuerpo de la petición.
     * @returns {Promise<Response>} - Objeto Response de fetch.
     */
    async post(endpoint, formData) {
        return await fetch(`${this.backendUrl}${endpoint}`, { 
            method: "POST", 
            headers: this._getHeaders(), // Añadimos solo el header de ngrok
            body: formData 
        });
    }

    /**
     * Realiza una petición GET.
     * @param {string} endpoint - Ruta del endpoint.
     * @returns {Promise<Response>} - Objeto Response de fetch.
     */
    async get(endpoint) {
        return await fetch(`${this.backendUrl}${endpoint}`, {
            headers: this._getHeaders(), // Añadimos el header a los GET
        });
    }

    /**
     * Realiza una petición PUT con `FormData`.
     * @param {string} endpoint - Ruta del endpoint.
     * @param {FormData} formData - Datos a enviar.
     * @returns {Promise<Response>} - Objeto Response de fetch.
     */
    async put(endpoint, formData) {
        return await fetch(`${this.backendUrl}${endpoint}`, { 
            method: "PUT", 
            headers: this._getHeaders(), // Añadimos el header a los PUT
            body: formData 
        });
    }

    /**
     * Realiza una petición PUT enviando JSON con `application/json`.
     * @param {string} endpoint
     * @param {object} obj
     * @returns {Promise<Response>}
     */
    async putJson(endpoint, obj) {
        return await fetch(`${this.backendUrl}${endpoint}`, {
            method: 'PUT',
            headers: this._getHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(obj)
        });
    }

    /**
     * Realiza una petición POST enviando JSON con `application/json`.
     * @param {string} endpoint
     * @param {object} obj
     * @returns {Promise<Response>}
     */
    async postJson(endpoint, obj) {
        return await fetch(`${this.backendUrl}${endpoint}`, {
            method: 'POST',
            headers: this._getHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(obj)
        });
    }

    /**
     * Realiza una petición DELETE enviando JSON en el cuerpo con `application/json`.
     * Algunos backends requieren el body para verificar usuario/credenciales.
     * @param {string} endpoint
     * @param {object} obj
     * @returns {Promise<Response>}
     */
    async deleteJson(endpoint, obj) {
        return await fetch(`${this.backendUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this._getHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(obj)
        });
    }

    /**
     * Realiza una petición DELETE.
     * @param {string} endpoint - Ruta del endpoint.
     * @returns {Promise<Response>} - Objeto Response de fetch.
     */
    async delete(endpoint) {
        return await fetch(`${this.backendUrl}${endpoint}`, { 
            method: "DELETE",
            headers: this._getHeaders(), // Añadimos el header a los DELETE
        });
    }
}

export { Client };
