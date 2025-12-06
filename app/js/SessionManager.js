/**
 * Maneja la sesión del usuario en el lado del cliente (sessionStorage).
 */
class SessionManager {

    /**
     * @param {Client} client - Instancia del cliente HTTP para llamadas relacionadas.
     */
    constructor(client) {
        this.client = client;
        this.userID = sessionStorage.getItem('userID') || null;
        this.userName = sessionStorage.getItem('userName') || null;
    }

    /**
     * Cierra la sesión llamando al endpoint `/api/logout` y limpiando sessionStorage.
     */
    async logout() {
        try {
            const response = await this.client.post('/api/logout');
            if (response.ok) {
                sessionStorage.clear();
                window.location.href = '../login';
            } else {
                alert('Error al cerrar sesión. Por favor intente de nuevo.');
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Un error ocurrió. Por favor intente más tarde.');
        } 
    }
}

export { SessionManager };