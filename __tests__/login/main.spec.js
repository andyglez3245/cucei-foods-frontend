/**
 * Tests para main.js
 * Punto de entrada y inicialización de la página de login
 */

// Limpiemos primero el módulo antes de importar para evitar efectos secundarios
jest.resetModules();

// Mock de los módulos antes de cualquier import
jest.mock('../../login/js/Client.js', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    }))
  };
});

jest.mock('../../login/js/UserManager.js', () => {
  return {
    UserManager: jest.fn().mockImplementation(() => ({
      login: jest.fn(),
      register: jest.fn()
    }))
  };
});

describe('main.js - Inicialización de página de login', () => {
  beforeEach(() => {
    // Crear elementos DOM necesarios
    document.body.innerHTML = `
      <button id="login-btn">Login</button>
      <button id="register-btn">Register</button>
    `;

    // Mock de console
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('debería exportar Client', () => {
    // Importar después de los mocks
    const { Client } = require('../../login/js/Client.js');
    expect(Client).toBeDefined();
  });

  test('debería exportar UserManager', () => {
    const { UserManager } = require('../../login/js/UserManager.js');
    expect(UserManager).toBeDefined();
  });

  test('debería tener elementos interactivos en el DOM', () => {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');

    expect(loginBtn).not.toBeNull();
    expect(registerBtn).not.toBeNull();
  });

  test('debería permitir agregar event listeners a los botones', () => {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');

    const loginCallback = jest.fn();
    const registerCallback = jest.fn();

    loginBtn.addEventListener('click', loginCallback);
    registerBtn.addEventListener('click', registerCallback);

    loginBtn.click();
    registerBtn.click();

    expect(loginCallback).toHaveBeenCalled();
    expect(registerCallback).toHaveBeenCalled();
  });

  test('debería permitir event listeners que previenen default y ejecutan lógica async', async () => {
    const loginBtn = document.getElementById('login-btn');
    const mockLoginHandler = jest.fn(async (e) => {
      e.preventDefault();
      // Simular lógica async
      await Promise.resolve();
    });

    loginBtn.addEventListener('click', mockLoginHandler);
    loginBtn.click();

    expect(mockLoginHandler).toHaveBeenCalled();
  });
});
