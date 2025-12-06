/**
 * Utilidades para la pantalla de login/registro.
 */
function showRegister() {
    /**
     * Muestra el formulario de registro y oculta el de login.
     */
    document.getElementById("login-form").classList.add("d-none");
    document.getElementById("register-form").classList.remove("d-none");
}

/**
 * Muestra el formulario de login y oculta el de registro.
 */
function showLogin() {
    document.getElementById("register-form").classList.add("d-none");
    document.getElementById("login-form").classList.remove("d-none");
}