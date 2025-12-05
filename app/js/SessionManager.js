class SessionManager {

    constructor(client) {
        this.client = client;
        this.userID = sessionStorage.getItem('userID') || null;
        this.userName = sessionStorage.getItem('userName') || null;
    }

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