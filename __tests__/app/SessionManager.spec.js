/**
 * Tests para SessionManager.js
 * Maneja la sesión del usuario en el lado del cliente (sessionStorage).
 */

import { SessionManager } from '../../app/js/SessionManager.js';

describe('SessionManager - Gestión de sesión', () => {
  let sessionManager;
  let mockClient;

  beforeEach(() => {
    // Limpiar sessionStorage antes de cada test
    sessionStorage.clear();

    // Mock del Client
    mockClient = {
      post: jest.fn()
    };

    // Mock de funciones globales
    global.alert = jest.fn();
    delete window.location;
    window.location = { href: '' };

    sessionManager = new SessionManager(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Constructor', () => {
    it('debe inicializar con valores desde sessionStorage', () => {
      sessionStorage.setItem('userID', '123');
      sessionStorage.setItem('userName', 'John Doe');

      const session = new SessionManager(mockClient);

      expect(session.userID).toBe('123');
      expect(session.userName).toBe('John Doe');
    });

    it('debe inicializar con null si sessionStorage está vacío', () => {
      expect(sessionManager.userID).toBeNull();
      expect(sessionManager.userName).toBeNull();
    });

    it('debe guardar referencia al cliente', () => {
      expect(sessionManager.client).toBe(mockClient);
    });
  });

  describe('Logout exitoso', () => {
    it('debe limpiar sessionStorage cuando logout es exitoso', async () => {
      sessionStorage.setItem('userID', '123');
      sessionStorage.setItem('userName', 'John Doe');

      const mockResponse = { ok: true };
      mockClient.post.mockResolvedValue(mockResponse);

      await sessionManager.logout();

      expect(mockClient.post).toHaveBeenCalledWith('/api/logout');
      expect(sessionStorage.getItem('userID')).toBeNull();
      expect(sessionStorage.getItem('userName')).toBeNull();
    });

    it('debe redirigir a login después de logout exitoso', async () => {
      const mockResponse = { ok: true };
      mockClient.post.mockResolvedValue(mockResponse);

      await sessionManager.logout();

      expect(window.location.href).toBe('../login');
    });
  });

  describe('Logout fallido', () => {
    it('debe mostrar alerta cuando logout falla (response.ok = false)', async () => {
      const mockResponse = { ok: false };
      mockClient.post.mockResolvedValue(mockResponse);

      await sessionManager.logout();

      expect(global.alert).toHaveBeenCalledWith('Error al cerrar sesión. Por favor intente de nuevo.');
      expect(window.location.href).toBe('');
    });

    it('debe mostrar alerta en caso de error en la petición', async () => {
      mockClient.post.mockRejectedValue(new Error('Network error'));

      // Mock console.error para evitar output en tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await sessionManager.logout();

      expect(global.alert).toHaveBeenCalledWith('Un error ocurrió. Por favor intente más tarde.');
      expect(window.location.href).toBe('');

      consoleErrorSpy.mockRestore();
    });
  });
});
