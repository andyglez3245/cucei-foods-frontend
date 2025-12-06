/**
 * Punto de entrada de la aplicación `app/`.
 * Inicializa el cliente HTTP, gestores (places, menu, comments, session)
 * y arranca la carga inicial de locales.
 */
import { Client } from "./Client.js";
import { PlaceManager } from "./PlaceManager.js";
import { MenuManager } from "./MenuManager.js";
import { CommentManager } from "./CommentManager.js";
import { SessionManager } from "./SessionManager.js";


const backendUrl = "https://parapodial-floatingly-chong.ngrok-free.dev"; // On server
//const backendUrl = "http://localhost:5000"; // On local
const client = new Client(backendUrl);

const sessionManager = new SessionManager(client);
const menuManager = new MenuManager(client);
const commentManager = new CommentManager(client, sessionManager);
const placeManager = new PlaceManager(client, menuManager, commentManager);


// Wait for the DOM to load before attaching event listeners
document.addEventListener("DOMContentLoaded", async () => {
    // Load and display places on page load
    await placeManager.listPlaces();

    // Attach logout event listener
    const logoutBtn = document.getElementById("btn-logout");
    logoutBtn.addEventListener("click", async () => {
        if (confirm("¿Deseas cerrar sesión?")) {
            await sessionManager.logout();
        }
    });
});
