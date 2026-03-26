/**
 * Tests para UserManager.js
 * Manejo de login y registro
 */

import { UserManager } from '../../login/js/UserManager.js';

describe('UserManager - Iniciación de sesión y registro', () => {
  let userManager;
  let mockClient;

  beforeEach(() => {
    // Mock del cliente HTTP
    mockClient = {
      post: jest.fn()
    };

    userManager = new UserManager(mockClient);

    // Crear elementos DOM necesarios
    document.body.innerHTML = `
      <input id="login-email" type="email" value="" />
      <input id="login-password" type="password" value="" />
      <input id="register-name" type="text" value="" />
      <input id="register-email" type="email" value="" />
      <input id="register-password" type="password" value="" />
      <input id="register-confirm" type="password" value="" />
    `;

    // Mock de alert
    global.alert = jest.fn();

    // Mock de window.location
    delete window.location;
    window.location = { href: '', reload: jest.fn() };

    // Mock de sessionStorage
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('constructor()', () => {
    test('debería recibir un cliente HTTP', () => {
      expect(userManager.client).toBe(mockClient);
    });
  });

  describe('login()', () => {
    test('debería enviar credenciales al endpoint /api/login', async () => {
      document.getElementById('login-email').value = 'test@example.com';
      document.getElementById('login-password').value = 'password123';

      mockClient.post.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ user_id: 1, user_name: 'Test User' })
      });

      await userManager.login();

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/login',
        expect.any(FormData)
      );
    });

    test('debería guardar userID y userName en sessionStorage al login exitoso', async () => {
      document.getElementById('login-email').value = 'test@example.com';
      document.getElementById('login-password').value = 'password123';

      mockClient.post.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ user_id: 42, user_name: 'John Doe' })
      });

      await userManager.login();

      expect(sessionStorage.getItem('userID')).toBe('42');
      expect(sessionStorage.getItem('userName')).toBe('John Doe');
    });

    test('debería redirigir a ../app/ al login exitoso', async () => {
      document.getElementById('login-email').value = 'test@example.com';
      document.getElementById('login-password').value = 'password123';

      mockClient.post.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ user_id: 1, user_name: 'Test User' })
      });

      await userManager.login();

      expect(window.location.href).toBe('../app/');
    });

    test('debería mostrar alerta de error si la respuesta no es ok', async () => {
      document.getElementById('login-email').value = 'wrong@example.com';
      document.getElementById('login-password').value = 'wrongpass';

      mockClient.post.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ message: 'Invalid credentials' })
      });

      await userManager.login();

      expect(global.alert).toHaveBeenCalledWith('Error al iniciar sesión: Invalid credentials');
      expect(sessionStorage.getItem('userID')).toBeNull();
    });

    test('debería manejar errores de red en login', async () => {
      document.getElementById('login-email').value = 'test@example.com';
      document.getElementById('login-password').value = 'password123';

      mockClient.post.mockRejectedValueOnce(new Error('Network error'));

      await userManager.login();

      expect(global.alert).toHaveBeenCalledWith('Un error ocurrió. Por favor intente más tarde.');
      expect(sessionStorage.getItem('userID')).toBeNull();
    });

    test('debería leer los valores correctos del formulario de login', async () => {
      const email = 'john@example.com';
      const password = 'securepass456';

      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = password;

      mockClient.post.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ user_id: 1, user_name: 'John' })
      });

      await userManager.login();

      // Verificar que los datos fueron incluidos en la petición
      const callArgs = mockClient.post.mock.calls[0][1];
      expect(callArgs.get('email')).toBe(email);
      expect(callArgs.get('password')).toBe(password);
    });
  });

  describe('register()', () => {
    test('debería validar que las contraseñas coincidan', async () => {
      document.getElementById('register-name').value = 'New User';
      document.getElementById('register-email').value = 'newuser@example.com';
      document.getElementById('register-password').value = 'password123';
      document.getElementById('register-confirm').value = 'password456'; // No coincide

      await userManager.register();

      expect(global.alert).toHaveBeenCalledWith('Las contraseñas no coinciden!');
      expect(mockClient.post).not.toHaveBeenCalled();
    });

    test('debería enviar datos al endpoint /api/register si las contraseñas coinciden', async () => {
      document.getElementById('register-name').value = 'New User';
      document.getElementById('register-email').value = 'newuser@example.com';
      document.getElementById('register-password').value = 'password123';
      document.getElementById('register-confirm').value = 'password123';

      mockClient.post.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ message: 'User created' })
      });

      await userManager.register();

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/register',
        expect.any(FormData)
      );
    });

    test('debería incluir nombre, email y contraseña en la petición de registro', async () => {
      const name = 'Alice Smith';
      const email = 'alice@example.com';
      const password = 'securepass123';

      document.getElementById('register-name').value = name;
      document.getElementById('register-email').value = email;
      document.getElementById('register-password').value = password;
      document.getElementById('register-confirm').value = password;

      mockClient.post.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ message: 'Success' })
      });

      await userManager.register();

      const callArgs = mockClient.post.mock.calls[0][1];
      expect(callArgs.get('name')).toBe(name);
      expect(callArgs.get('email')).toBe(email);
      expect(callArgs.get('password')).toBe(password);
    });

    test('debería recargar la página al registro exitoso', async () => {
      document.getElementById('register-name').value = 'New User';
      document.getElementById('register-email').value = 'newuser@example.com';
      document.getElementById('register-password').value = 'password123';
      document.getElementById('register-confirm').value = 'password123';

      mockClient.post.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ message: 'User created' })
      });

      await userManager.register();

      expect(global.alert).toHaveBeenCalledWith('Registro exitoso! Por favor inicie sesión.');
      expect(window.location.reload).toHaveBeenCalled();
    });

    test('debería mostrar alerta de error si el registro falla', async () => {
      document.getElementById('register-name').value = 'New User';
      document.getElementById('register-email').value = 'newuser@example.com';
      document.getElementById('register-password').value = 'password123';
      document.getElementById('register-confirm').value = 'password123';

      mockClient.post.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ message: 'Email already exists' })
      });

      await userManager.register();

      expect(global.alert).toHaveBeenCalledWith('Error durante el registro: Email already exists');
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    test('debería manejar errores de red en registro', async () => {
      document.getElementById('register-name').value = 'New User';
      document.getElementById('register-email').value = 'newuser@example.com';
      document.getElementById('register-password').value = 'password123';
      document.getElementById('register-confirm').value = 'password123';

      mockClient.post.mockRejectedValueOnce(new Error('Connection failed'));

      await userManager.register();

      expect(global.alert).toHaveBeenCalledWith('Un error ocurrió. Por favor intente más tarde.');
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    test('debería NO enviar datos si las contraseñas no coinciden', async () => {
      document.getElementById('register-password').value = 'pass1';
      document.getElementById('register-confirm').value = 'pass2';

      await userManager.register();

      expect(mockClient.post).not.toHaveBeenCalled();
    });
  });

  describe('Integración de errores', () => {
    test('debería loguear errores en consola durante login (sin detener ejecución)', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      document.getElementById('login-email').value = 'test@example.com';
      document.getElementById('login-password').value = 'password';

      mockClient.post.mockRejectedValueOnce(new Error('Server error'));

      await userManager.login();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al iniciar sesión:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });

    test('debería loguear errores en consola durante registro (sin detener ejecución)', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      document.getElementById('register-name').value = 'User';
      document.getElementById('register-email').value = 'user@example.com';
      document.getElementById('register-password').value = 'pass';
      document.getElementById('register-confirm').value = 'pass';

      mockClient.post.mockRejectedValueOnce(new Error('Server error'));

      await userManager.register();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error durante el registro:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });
});
