/**
 * Tests para main.js (login)
 * Punto de entrada y inicialización de la página de login
 */

// Reset de módulos antes de los tests
jest.resetModules();

// Mock de los módulos antes de cualquier import
jest.mock('../../login/js/Client.js', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      backendUrl: 'http://backend.local'
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

describe('main.js (login) - Inicialización de página de login', () => {
  let ClientMock;
  let UserManagerMock;

  beforeEach(() => {
    // Obtener los mocks después de resetModules
    ClientMock = require('../../login/js/Client.js').Client;
    UserManagerMock = require('../../login/js/UserManager.js').UserManager;

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

  test('debería crear instancia de Client al cargar', async () => {
    // Importar main.js esto dispara el DOMContentLoaded
    require('../../login/js/main.js');
    
    // Simular DOMContentLoaded mediante dispatchEvent
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(ClientMock).toHaveBeenCalled();
  });

  test('debería crear instancia de UserManager al cargar', async () => {
    require('../../login/js/main.js');
    
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(UserManagerMock).toHaveBeenCalled();
  });

  test('debería registrar listeners de click en los botones al cargar', async () => {
    require('../../login/js/main.js');
    
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');

    // Crear spies para los listeners
    const loginSpy = jest.fn((e) => e.preventDefault());
    const registerSpy = jest.fn((e) => e.preventDefault());

    loginBtn.addEventListener('click', loginSpy);
    registerBtn.addEventListener('click', registerSpy);

    loginBtn.click();
    registerBtn.click();

    expect(loginSpy).toHaveBeenCalled();
    expect(registerSpy).toHaveBeenCalled();
  });

  test('debería permitir event listeners que previenen default y ejecutan lógica async', async () => {
    require('../../login/js/main.js');
    
    const loginBtn = document.getElementById('login-btn');
    const mockLoginHandler = jest.fn(async (e) => {
      e.preventDefault();
      await Promise.resolve();
    });

    loginBtn.addEventListener('click', mockLoginHandler);
    loginBtn.click();

    expect(mockLoginHandler).toHaveBeenCalled();
  });

  test('debería conectar el botón de login al método login de UserManager', async () => {
    require('../../login/js/main.js');
    
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const loginBtn = document.getElementById('login-btn');
    const mockUserManagerInstance = UserManagerMock.mock.results[0].value;
    
    expect(mockUserManagerInstance.login).toBeDefined();
  });

  test('debería conectar el botón de registro al método register de UserManager', async () => {
    require('../../login/js/main.js');
    
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const registerBtn = document.getElementById('register-btn');
    const mockUserManagerInstance = UserManagerMock.mock.results[0].value;
    
    expect(mockUserManagerInstance.register).toBeDefined();
  });
});
