import { Client } from './Client.js';
import { UserManager } from './UserManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = "https://cucei-foods-api-rigo.onrender.com";
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