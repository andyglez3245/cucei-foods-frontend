/**
 * Tests para Client.js
 * Cliente HTTP que envuelve llamadas fetch
 */

import { Client } from '../../login/js/Client.js';

describe('Client - Cliente HTTP para peticiones al backend', () => {
  let client;
  const backendUrl = 'http://localhost:5000';

  beforeEach(() => {
    // Crear instancia de Client antes de cada test
    client = new Client(backendUrl);
    // Mockear fetch globalmente
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor()', () => {
    test('debería establecer la URL base del backend', () => {
      expect(client.backendUrl).toBe(backendUrl);
    });

    test('debería crear headers por defecto con ngrok-skip-browser-warning', () => {
      const headers = client.defaultHeaders;
      expect(headers).toBeDefined();
      expect(headers.get('ngrok-skip-browser-warning')).toBe('true');
    });

    test('debería aceptar diferentes URLs de backend', () => {
      const client2 = new Client('https://example.com');
      expect(client2.backendUrl).toBe('https://example.com');
    });
  });

  describe('_getHeaders()', () => {
    test('debería retornar un objeto Headers', () => {
      const headers = client._getHeaders();
      expect(headers instanceof Headers).toBe(true);
    });

    test('debería incluir header ngrok-skip-browser-warning', () => {
      const headers = client._getHeaders();
      expect(headers.get('ngrok-skip-browser-warning')).toBe('true');
    });

    test('debería combinar headers por defecto con headers personalizados', () => {
      const customHeaders = { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' };
      const headers = client._getHeaders(customHeaders);
      
      expect(headers.get('ngrok-skip-browser-warning')).toBe('true');
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBe('Bearer token');
    });

    test('debería retornar nuevas instancias de Headers en cada llamada', () => {
      const headers1 = client._getHeaders();
      const headers2 = client._getHeaders();
      expect(headers1).not.toBe(headers2);
    });
  });

  describe('post()', () => {
    test('debería hacer una petición POST correcta', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, status: 200 });
      const formData = new FormData();
      formData.append('test', 'data');

      await client.post('/api/test', formData);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        `${backendUrl}/api/test`,
        expect.objectContaining({
          method: 'POST',
          body: formData
        })
      );
    });

    test('debería incluir headers en la petición POST', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });
      const formData = new FormData();

      await client.post('/api/test', formData);

      const callArgs = global.fetch.mock.calls[0][1];
      expect(callArgs.headers).toBeDefined();
      expect(callArgs.headers.get('ngrok-skip-browser-warning')).toBe('true');
    });

    test('debería retornar la respuesta de fetch', async () => {
      const mockResponse = { ok: true, status: 201, json: jest.fn() };
      global.fetch.mockResolvedValueOnce(mockResponse);
      const formData = new FormData();

      const response = await client.post('/api/test', formData);

      expect(response).toBe(mockResponse);
    });
  });

  describe('get()', () => {
    test('debería hacer una petición GET correcta', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await client.get('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        `${backendUrl}/api/test`,
        expect.objectContaining({
          headers: expect.any(Object)
        })
      );
    });

    test('debería incluir headers en la petición GET', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });

      await client.get('/api/test');

      const callArgs = global.fetch.mock.calls[0][1];
      expect(callArgs.headers).toBeDefined();
      expect(callArgs.headers.get('ngrok-skip-browser-warning')).toBe('true');
    });

    test('debería retornar la respuesta de fetch', async () => {
      const mockResponse = { ok: true, status: 200, json: jest.fn() };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const response = await client.get('/api/test');

      expect(response).toBe(mockResponse);
    });

    test('debería construir la URL correctamente', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });

      await client.get('/api/places/123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${backendUrl}/api/places/123`,
        expect.any(Object)
      );
    });
  });

  describe('put()', () => {
    test('debería hacer una petición PUT correcta', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, status: 200 });
      const formData = new FormData();

      await client.put('/api/test/1', formData);

      expect(global.fetch).toHaveBeenCalledWith(
        `${backendUrl}/api/test/1`,
        expect.objectContaining({
          method: 'PUT',
          body: formData
        })
      );
    });

    test('debería incluir headers en la petición PUT', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });
      const formData = new FormData();

      await client.put('/api/test', formData);

      const callArgs = global.fetch.mock.calls[0][1];
      expect(callArgs.headers.get('ngrok-skip-browser-warning')).toBe('true');
    });
  });

  describe('delete()', () => {
    test('debería hacer una petición DELETE correcta', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await client.delete('/api/test/1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${backendUrl}/api/test/1`,
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    test('debería incluir headers en la petición DELETE', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });

      await client.delete('/api/test/1');

      const callArgs = global.fetch.mock.calls[0][1];
      expect(callArgs.headers.get('ngrok-skip-browser-warning')).toBe('true');
    });

    test('debería construir la URL correctamente para DELETE', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });

      await client.delete('/api/places/456');

      expect(global.fetch).toHaveBeenCalledWith(
        `${backendUrl}/api/places/456`,
        expect.any(Object)
      );
    });
  });

  describe('Manejo de errores', () => {
    test('debería propagar errores de fetch en POST', async () => {
      const error = new Error('Network error');
      global.fetch.mockRejectedValueOnce(error);
      const formData = new FormData();

      await expect(client.post('/api/test', formData)).rejects.toThrow('Network error');
    });

    test('debería propagar errores de fetch en GET', async () => {
      const error = new Error('Connection timeout');
      global.fetch.mockRejectedValueOnce(error);

      await expect(client.get('/api/test')).rejects.toThrow('Connection timeout');
    });

    test('debería manejar respuestas de error HTTP', async () => {
      const mockResponse = { ok: false, status: 500, statusText: 'Internal Server Error' };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const response = await client.get('/api/test');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });
});
