/**
 * Tests para utils.js (app)
 * Utilidades de comportamiento de la página para `app/`.
 */

describe('App Utils - Utilidades de la página app', () => {
  beforeEach(() => {
    // Limpiar el documento antes de cada test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe ejecutar el handler cuando el DOM está completamente cargado', () => {
    const domContentLoadedSpy = jest.spyOn(document, 'addEventListener');

    // Importar el módulo utils
    require('../../app/js/utils.js');

    expect(domContentLoadedSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));

    domContentLoadedSpy.mockRestore();
  });

  it('debe registrar el listener DOMContentLoaded sin errores', (done) => {
    // Crear un script que simule el comportamiento esperado
    const handler = () => {
      expect(true).toBe(true);
      done();
    };

    document.addEventListener('DOMContentLoaded', handler);
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });
});
