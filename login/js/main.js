/**
 * Punto de entrada para la página de login. Inicializa el `Client` y el
 * `UserManager`, y conecta los botones de login/registro a sus handlers.
 */
import { Client } from './Client.js';
import { UserManager } from './UserManager.js';

document.addEventListener('DOMContentLoaded', () => {
    //const backendUrl = "http://localhost:5000";
    const backendUrl = "https://parapodial-floatingly-chong.ngrok-free.dev";
    const client = new Client(backendUrl);
    const userManager = new UserManager(client)

    const loginBtn = document.getElementById("login-btn");
    loginBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await userManager.login();
    });

    const registerBtn = document.getElementById("register-btn");
    registerBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await userManager.register();
    });
});