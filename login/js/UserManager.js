class UserManager {
    constructor(client) {
        this.client = client;
    }

    async login() {
        const formData = new FormData();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        formData.append("email", email);
        formData.append("password", password);

        try {
            const response = await this.client.post('/api/login', formData);
            const data = await response.json();
            if (response.ok) {
                sessionStorage.setItem('userID', data.user_id);
                sessionStorage.setItem('userName', data.user_name);
                window.location.href = '../app';
            } else {
                alert('Error al iniciar sesión: ' + data.message);
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            alert('Un error ocurrió. Por favor intente más tarde.');
        }  
    }

    async register() {
        const formData = new FormData();

        const name = document.getElementById("register-name").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById("register-confirm").value;

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden!');
            return;
        }

        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);

        try {
            const response = await this.client.post('/api/register', formData);
            const data = await response.json();
            if (response.ok) {
                alert('Registro exitoso! Por favor inicie sesión.');
                window.location.reload();
            } else {
                alert('Error durante el registro: ' + data.message);
            }
        } catch (error) {
            console.error('Error durante el registro:', error);
            alert('Un error ocurrió. Por favor intente más tarde.');
        }
    }
}

export { UserManager };