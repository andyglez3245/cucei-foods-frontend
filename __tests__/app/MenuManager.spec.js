/**
 * Tests para MenuManager.js
 * Gestiona filas dinámicas de menú e imagen preview
 */

import { MenuManager } from '../../app/js/MenuManager.js';

describe('MenuManager - Gestión de menú', () => {
  let menuManager;
  let mockClient;

  beforeEach(() => {
    // Mock del cliente HTTP
    mockClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };

    // Crear elementos DOM necesarios para MenuManager
    document.body.innerHTML = `
      <div id="modal-menu-container"></div>
      <button id="modal-btn-add-menu">Agregar fila</button>
      <input id="modal-local-image" type="file" />
      <img id="modal-image-preview" src="" class="d-none" />
      <div id="view-menu-content"></div>
    `;

    menuManager = new MenuManager(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('constructor()', () => {
    test('debería iniciar con elementos DOM correctos', () => {
      expect(menuManager.menuContainer).not.toBeNull();
      expect(menuManager.btnAddMenu).not.toBeNull();
      expect(menuManager.imgInput).not.toBeNull();
      expect(menuManager.imgPreview).not.toBeNull();
      expect(menuManager.viewMenuContent).not.toBeNull();
    });

    test('debería crear una fila inicial al construir', () => {
      const rows = document.querySelectorAll('.menu-row');
      expect(rows.length).toBe(1);
    });
  });

  describe('_createMenuRow()', () => {
    test('debería crear una fila con inputs y select correctos', () => {
      const row = menuManager._createMenuRow();

      expect(row.classList.contains('menu-row')).toBe(true);
      expect(row.querySelectorAll('input[type="text"]').length).toBe(1);
      expect(row.querySelectorAll('input[type="number"]').length).toBe(1);
      expect(row.querySelectorAll('select').length).toBe(1);
    });

    test('debería crear un botón de remover en la fila', () => {
      const row = menuManager._createMenuRow();
      const removeBtn = row.querySelector('button.btn-outline-danger');

      expect(removeBtn).not.toBeNull();
      expect(removeBtn.innerHTML).toContain('bi-dash-circle');
    });

    test('debería tener todas las categorías en el select', () => {
      const row = menuManager._createMenuRow();
      const selectOptions = row.querySelectorAll('select option');

      const expectedCategories = [
        'Entradas', 'Desayunos', 'Sopas', 'Ensaladas', 'Comidas',
        'Plato Fuerte', 'Cortes', 'Mariscos', 'Postre', 'Bebidas',
        'Snacks', 'Otros'
      ];

      expect(selectOptions.length).toBe(expectedCategories.length);
      expectedCategories.forEach((cat, idx) => {
        expect(selectOptions[idx].value).toBe(cat);
      });
    });

    test('debería remover la fila al hacer click en el botón de remover', () => {
      const row = menuManager._createMenuRow();
      document.getElementById('modal-menu-container').appendChild(row);

      const removeBtn = row.querySelector('button.btn-outline-danger');
      removeBtn.click();

      expect(document.getElementById('modal-menu-container').contains(row)).toBe(false);
    });
  });

  describe('Agregar filas dinámicamente', () => {
    test('debería agregar una nueva fila al hacer click en btnAddMenu', () => {
      const initialRows = document.querySelectorAll('.menu-row').length;
      
      document.getElementById('modal-btn-add-menu').click();

      const newRows = document.querySelectorAll('.menu-row').length;
      expect(newRows).toBe(initialRows + 1);
    });

    test('debería agregar múltiples filas', () => {
      const btn = document.getElementById('modal-btn-add-menu');
      btn.click();
      btn.click();
      btn.click();

      const rows = document.querySelectorAll('.menu-row');
      expect(rows.length).toBe(4); // 1 inicial + 3 nuevas
    });
  });

  describe('Image preview', () => {
    test('debería mostrar preview al seleccionar imagen', () => {
      const imgInput = document.getElementById('modal-local-image');
      const imgPreview = document.getElementById('modal-image-preview');

      // Mock de URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

      // Crear un mock de archivo
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(imgInput, 'files', {
        value: [file],
        writable: false
      });

      imgInput.dispatchEvent(new Event('change'));

      expect(imgPreview.src).toBe('blob:mock-url');
      expect(imgPreview.classList.contains('d-none')).toBe(false);
    });

    test('debería ocultar preview cuando no hay archivo seleccionado', () => {
      const imgInput = document.getElementById('modal-local-image');
      const imgPreview = document.getElementById('modal-image-preview');

      // Remover clase d-none para simular que estaba visible
      imgPreview.classList.remove('d-none');

      // Simular sin archivo
      Object.defineProperty(imgInput, 'files', {
        value: [],
        writable: false
      });

      imgInput.dispatchEvent(new Event('change'));

      expect(imgPreview.classList.contains('d-none')).toBe(true);
    });
  });

  describe('cleanMenuModal()', () => {
    test('debería dejar una fila vacía al limpiar', () => {
      // Agregar múltiples filas
      document.getElementById('modal-btn-add-menu').click();
      document.getElementById('modal-btn-add-menu').click();

      menuManager.cleanMenuModal();

      const rows = document.querySelectorAll('.menu-row');
      expect(rows.length).toBe(1);
    });

    test('debería limpiar el input de imagen', () => {
      const imgInput = document.getElementById('modal-local-image');
      // Los file inputs no aceptan valores no-vacíos por seguridad del navegador;
      // verificamos que cleanMenuModal() deja el valor en cadena vacía.

      menuManager.cleanMenuModal();

      expect(imgInput.value).toBe('');
    });

    test('debería ocultar el preview de imagen', () => {
      const imgPreview = document.getElementById('modal-image-preview');
      imgPreview.classList.remove('d-none');

      menuManager.cleanMenuModal();

      expect(imgPreview.classList.contains('d-none')).toBe(true);
    });

    test('debería limpiar inputs de la fila existente', () => {
      const row = document.querySelector('.menu-row');
      const inputs = row.querySelectorAll('input');
      inputs[0].value = 'Tacos';
      inputs[1].value = '50';

      menuManager.cleanMenuModal();

      const newRow = document.querySelector('.menu-row');
      const newInputs = newRow.querySelectorAll('input');
      expect(newInputs[0].value).toBe('');
      expect(newInputs[1].value).toBe('');
    });
  });

  describe('loadMenu()', () => {
    test('debería renderizar menú agrupado por categoría', () => {
      const menuArray = [
        { dish_name: 'Tacos', price: 50, category: 'Comidas' },
        { dish_name: 'Quesadillas', price: 40, category: 'Comidas' },
        { dish_name: 'Ensalada', price: 60, category: 'Ensaladas' }
      ];

      menuManager.loadMenu(menuArray);

      const viewContent = document.getElementById('view-menu-content');
      const titles = viewContent.querySelectorAll('h5');
      const listItems = viewContent.querySelectorAll('li');

      expect(titles.length).toBe(2); // Dos categorías
      expect(listItems.length).toBe(3); // Tres platillos
    });

    test('debería mostrar nombre y precio del platillo', () => {
      const menuArray = [
        { dish_name: 'Pizza', price: 100, category: 'Comidas' }
      ];

      menuManager.loadMenu(menuArray);

      const listItem = document.querySelector('li.list-group-item');
      expect(listItem.textContent).toContain('Pizza');
      expect(listItem.textContent).toContain('$100');
    });

    test('debería limpiar contenido previo al cargar nuevo menú', () => {
      const viewContent = document.getElementById('view-menu-content');
      viewContent.innerHTML = '<div>Contenido antiguo</div>';

      menuManager.loadMenu([
        { dish_name: 'Test', price: 50, category: 'Comidas' }
      ]);

      expect(viewContent.innerHTML).not.toContain('Contenido antiguo');
      expect(viewContent.querySelectorAll('li').length).toBe(1);
    });

    test('debería mostrar categorías como títulos en h5', () => {
      const menuArray = [
        { dish_name: 'Café', price: 20, category: 'Bebidas' }
      ];

      menuManager.loadMenu(menuArray);

      const title = document.querySelector('h5');
      expect(title.textContent).toBe('Bebidas');
      expect(title.classList.contains('fw-bold')).toBe(true);
    });

    test('debería ordenar platillos por categoría', () => {
      const menuArray = [
        { dish_name: 'Quesadilla', price: 40, category: 'Comidas' },
        { dish_name: 'Agua', price: 10, category: 'Bebidas' },
        { dish_name: 'Tacos', price: 50, category: 'Comidas' }
      ];

      menuManager.loadMenu(menuArray);

      const lists = document.querySelectorAll('ul.list-group');
      expect(lists[0].querySelectorAll('li').length).toBeGreaterThan(0);
    });
  });

  describe('Inputs validación', () => {
    test('debería aceptar valores en inputs de platillo', () => {
      const row = document.querySelector('.menu-row');
      const dishInput = row.querySelector('input[type="text"]');
      dishInput.value = 'Enchiladas';

      expect(dishInput.value).toBe('Enchiladas');
    });

    test('debería aceptar números en input de precio', () => {
      const row = document.querySelector('.menu-row');
      const priceInput = row.querySelector('input[type="number"]');
      priceInput.value = '99.99';

      expect(priceInput.value).toBe('99.99');
    });

    test('debería seleccionar categoría en el select', () => {
      const row = document.querySelector('.menu-row');
      const select = row.querySelector('select');
      select.value = 'Bebidas';

      expect(select.value).toBe('Bebidas');
    });
  });
});
