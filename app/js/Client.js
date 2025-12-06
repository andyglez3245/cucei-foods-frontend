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
        const headers = this.defaultHeaders;
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
