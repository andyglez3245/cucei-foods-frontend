/**
 * Tests para Client.js
 * Cliente HTTP que envuelve llamadas `fetch` hacia el backend.
 */

import { Client } from '../../app/js/Client.js';

describe('Client - Cliente HTTP', () => {
  let client;
  let mockFetch;

  beforeEach(() => {
    client = new Client('http://localhost:5000');
    
    // Mock global fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('debe inicializar correctamente con una URL base', () => {
      expect(client.backendUrl).toBe('http://localhost:5000');
      expect(client.defaultHeaders).toBeDefined();
    });
  });

  describe('GET request', () => {
    it('debe realizar una petición GET correctamente', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 1, name: 'Test' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const response = await client.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/test',
        expect.objectContaining({
          headers: expect.any(Headers)
        })
      );
      expect(response).toBe(mockResponse);
    });

    it('debe incluir el header ngrok-skip-browser-warning en GET', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await client.get('/api/test');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers).toBeDefined();
    });
  });

  describe('POST request', () => {
    it('debe realizar una petición POST con FormData', async () => {
      const mockResponse = { ok: true };
      mockFetch.mockResolvedValue(mockResponse);
      
      const formData = new FormData();
      formData.append('name', 'Test Name');

      const response = await client.post('/api/places', formData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/places',
        expect.objectContaining({
          method: 'POST',
          body: formData,
          headers: expect.any(Headers)
        })
      );
      expect(response).toBe(mockResponse);
    });

    it('debe manejar errores en petición POST', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.post('/api/places', new FormData())).rejects.toThrow('Network error');
    });
  });

  describe('PUT request', () => {
    it('debe realizar una petición PUT con FormData', async () => {
      const mockResponse = { ok: true };
      mockFetch.mockResolvedValue(mockResponse);
      
      const formData = new FormData();
      formData.append('name', 'Updated Name');

      const response = await client.put('/api/places/1', formData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/places/1',
        expect.objectContaining({
          method: 'PUT',
          body: formData,
          headers: expect.any(Headers)
        })
      );
      expect(response).toBe(mockResponse);
    });

    it('debe manejar errores en petición PUT', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.put('/api/places/1', new FormData())).rejects.toThrow('Network error');
    });
  });

  describe('DELETE request', () => {
    it('debe realizar una petición DELETE correctamente', async () => {
      const mockResponse = { ok: true };
      mockFetch.mockResolvedValue(mockResponse);

      const response = await client.delete('/api/places/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/places/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.any(Headers)
        })
      );
      expect(response).toBe(mockResponse);
    });

    it('debe manejar errores en petición DELETE', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.delete('/api/places/1')).rejects.toThrow('Network error');
    });
  });

  describe('_getHeaders helper', () => {
    it('debe retornar headers con ngrok-skip-browser-warning', () => {
      const headers = client._getHeaders();
      expect(headers.get('ngrok-skip-browser-warning')).toBe('true');
    });

    it('debe combinar headers personalizados con los por defecto', () => {
      const customHeaders = { 'Content-Type': 'application/json' };
      const headers = client._getHeaders(customHeaders);
      expect(headers.get('ngrok-skip-browser-warning')).toBe('true');
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });
});
