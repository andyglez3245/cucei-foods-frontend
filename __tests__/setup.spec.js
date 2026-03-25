/**
 * Test de ejemplo para verificar que Jest está configurado correctamente
 */

describe('Setup de Jest', () => {
  test('Jest está funcionando correctamente', () => {
    expect(true).toBe(true);
  });

  test('El ambiente jsdom está disponible', () => {
    // Verificar que document está disponible (propiedad de jsdom)
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });

  test('localStorage mock está disponible', () => {
    expect(typeof localStorage).toBe('object');
    expect(typeof localStorage.setItem).toBe('function');
    expect(typeof localStorage.getItem).toBe('function');
  });

  test('Aritmética básica funciona', () => {
    expect(2 + 2).toBe(4);
    expect(5 - 3).toBe(2);
  });
});
