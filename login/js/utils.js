// Utility functions for toggling between login and register forms
function showRegister() {
    document.getElementById("login-form").classList.add("d-none");
    document.getElementById("register-form").classList.remove("d-none");
}

function showLogin() {
    document.getElementById("register-form").classList.add("d-none");
    document.getElementById("login-form").classList.remove("d-none");
}