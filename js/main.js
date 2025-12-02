import { Client } from "./Client.js";
import { PlaceManager } from "./PlaceManager.js";
import { MenuManager } from "./MenuManager.js";
import { CommentManager } from "./CommentManager.js";

const backendUrl = "http://localhost:5000";
const client = new Client(backendUrl);
const menuManager = new MenuManager(client);
const commentManager = new CommentManager(client);
const placeManager = new PlaceManager(client, menuManager, commentManager);


// Wait for the DOM to load before attaching event listeners
document.addEventListener("DOMContentLoaded", async () => {
    // Load and display places on page load
    await placeManager.listPlaces();
});

