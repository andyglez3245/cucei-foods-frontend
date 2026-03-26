/**
 * Tests para utils.js
 * Funciones de utilidad para mostrar/ocultar formularios de login/registro
 */

// Importar las funciones a testear
import { showRegister, showLogin } from '../../login/js/utils.js';

describe('Login Utils - Funciones de visibilidad de formularios', () => {
  // Setup antes de cada test
  beforeEach(() => {
    // Crear elementos DOM simulados
    document.body.innerHTML = `
      <form id="login-form" class="d-none"></form>
      <form id="register-form"></form>
    `;
  });

  // Limpiar después de cada test
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('showRegister()', () => {
    test('debería ocultar el formulario de login', () => {
      const loginForm = document.getElementById('login-form');
      loginForm.classList.remove('d-none'); // Asegurar que esté visible
      
      showRegister();
      
      expect(loginForm.classList.contains('d-none')).toBe(true);
    });

    test('debería mostrar el formulario de registro', () => {
      const registerForm = document.getElementById('register-form');
      registerForm.classList.add('d-none'); // Asegurar que esté oculto
      
      showRegister();
      
      expect(registerForm.classList.contains('d-none')).toBe(false);
    });

    test('debería aplicar ambos cambios de visibilidad', () => {
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      
      loginForm.classList.remove('d-none');
      registerForm.classList.add('d-none');
      
      showRegister();
      
      expect(loginForm.classList.contains('d-none')).toBe(true);
      expect(registerForm.classList.contains('d-none')).toBe(false);
    });
  });

  describe('showLogin()', () => {
    test('debería mostrar el formulario de login', () => {
      const loginForm = document.getElementById('login-form');
      loginForm.classList.add('d-none'); // Asegurar que esté oculto
      
      showLogin();
      
      expect(loginForm.classList.contains('d-none')).toBe(false);
    });

    test('debería ocultar el formulario de registro', () => {
      const registerForm = document.getElementById('register-form');
      registerForm.classList.remove('d-none'); // Asegurar que esté visible
      
      showLogin();
      
      expect(registerForm.classList.contains('d-none')).toBe(true);
    });

    test('debería aplicar ambos cambios de visibilidad', () => {
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      
      loginForm.classList.add('d-none');
      registerForm.classList.remove('d-none');
      
      showLogin();
      
      expect(loginForm.classList.contains('d-none')).toBe(false);
      expect(registerForm.classList.contains('d-none')).toBe(true);
    });
  });
});
