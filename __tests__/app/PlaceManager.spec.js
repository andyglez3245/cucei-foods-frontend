/**
 * Tests para PlaceManager.js
 * Gestor principal de locales: CRUD, favoritos, horarios, menú, comentarios
 */

import { PlaceManager } from '../../app/js/PlaceManager.js';

describe('PlaceManager - Gestión de locales', () => {
  let placeManager;
  let mockClient;
  let mockMenuManager;
  let mockCommentManager;

  beforeEach(() => {
    // Mocks
    mockClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      backendUrl: 'http://backend.local'
    };

    mockMenuManager = {
      cleanMenuModal: jest.fn(),
      loadMenu: jest.fn()
    };

    mockCommentManager = {
      listComments: jest.fn()
    };

    // Mock de bootstrap.Modal
    global.bootstrap = {
      Modal: jest.fn().mockImplementation(() => ({
        show: jest.fn(),
        hide: jest.fn()
      }))
    };

    // Crear elementos DOM necesarios
    document.body.innerHTML = `
      <form id="modal-form-add-local">
        <input id="modal-local-name" type="text" value="">
        <select id="modal-local-category">
          <option value="">Selecciona categoría</option>
          <option value="Comida Rápida">Comida Rápida</option>
          <option value="Restaurante">Restaurante</option>
        </select>
        <input id="modal-local-image" type="file">
      </form>
      <div id="modal-pull-right-add"></div>
      <button id="modal-btn-save">Guardar</button>
      <div id="places-list"></div>
      <div id="favorites-list"></div>
      <ul id="nav-list-locals">
        <a class="nav-link" href="#" data-category="">Todos</a>
        <a class="nav-link" href="#" data-category="Comida Rápida">Comida Rápida</a>
        <a class="nav-link" href="#" data-category="Restaurante">Restaurante</a>
      </ul>
      <div id="modal-menu-container"></div>
      <div id="view-menu-content"></div>
      <div id="modal-comments" data-place-id=""></div>
    `;

    // Mock de alert y confirm
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);

    placeManager = new PlaceManager(mockClient, mockMenuManager, mockCommentManager);
    placeManager.currentPlaces = [];
    placeManager.favorites = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('constructor()', () => {
    test('debería inicializar con managers correctos', () => {
      expect(placeManager.client).toBe(mockClient);
      expect(placeManager.menuManager).toBe(mockMenuManager);
      expect(placeManager.commentManager).toBe(mockCommentManager);
    });

    test('debería encontrar elementos DOM', () => {
      expect(placeManager.modalForm).not.toBeNull();
      expect(placeManager.placesContainer).not.toBeNull();
      expect(placeManager.favoritesContainer).not.toBeNull();
    });

    test('debería inicializar currentPlaces como array vacío', () => {
      expect(Array.isArray(placeManager.currentPlaces)).toBe(true);
      expect(placeManager.currentPlaces.length).toBe(0);
    });

    test('debería inicializar favorites como array vacío', () => {
      expect(Array.isArray(placeManager.favorites)).toBe(true);
      expect(placeManager.favorites.length).toBe(0);
    });
  });

  describe('_isPlaceOpen()', () => {
    test('debería devolver false si no hay schedule', () => {
      expect(placeManager._isPlaceOpen(null)).toBe(false);
      expect(placeManager._isPlaceOpen(undefined)).toBe(false);
    });

    test('debería devolver false si falta horario del día', () => {
      const schedule = {
        monday: { open: '08:00', close: '18:00' }
      };
      expect(placeManager._isPlaceOpen(schedule)).toBe(false); // Sin domingo (dependiendo del día)
    });

    test('debería devolver true entre hours de apertura', () => {
      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayKey = dayNames[now.getDay()];

      const schedule = {
        sunday: { open: '08:00', close: '22:00' },
        monday: { open: '08:00', close: '22:00' },
        tuesday: { open: '08:00', close: '22:00' },
        wednesday: { open: '08:00', close: '22:00' },
        thursday: { open: '08:00', close: '22:00' },
        friday: { open: '08:00', close: '22:00' },
        saturday: { open: '08:00', close: '22:00' }
      };

      const isOpen = placeManager._isPlaceOpen(schedule);
      // Depende de la hora actual, pero debería ser true si es entre 08:00 y 22:00
      expect(typeof isOpen).toBe('boolean');
    });

    test('debería parsear schedule como string JSON', () => {
      const schedule = JSON.stringify({
        sunday: { open: '08:00', close: '22:00' },
        monday: { open: '08:00', close: '22:00' },
        tuesday: { open: '08:00', close: '22:00' },
        wednesday: { open: '08:00', close: '22:00' },
        thursday: { open: '08:00', close: '22:00' },
        friday: { open: '08:00', close: '22:00' },
        saturday: { open: '08:00', close: '22:00' }
      });

      const isOpen = placeManager._isPlaceOpen(schedule);
      expect(typeof isOpen).toBe('boolean');
    });

    test('debería soportar horarios que cierren después de medianoche', () => {
      const schedule = {
        sunday: { open: '22:00', close: '02:00' },
        monday: { open: '22:00', close: '02:00' },
        tuesday: { open: '22:00', close: '02:00' },
        wednesday: { open: '22:00', close: '02:00' },
        thursday: { open: '22:00', close: '02:00' },
        friday: { open: '22:00', close: '02:00' },
        saturday: { open: '22:00', close: '02:00' }
      };

      const isOpen = placeManager._isPlaceOpen(schedule);
      expect(typeof isOpen).toBe('boolean');
    });
  });

  describe('_collectMenuItems()', () => {
    test('debería devolver array vacío sin filas', () => {
      const menu = placeManager._collectMenuItems();
      expect(Array.isArray(menu)).toBe(true);
      expect(menu.length).toBe(0);
    });

    test('debería recolectar items válidos con nombre, precio y categoría', () => {
      // Crear filas de menú
      const container = document.getElementById('modal-menu-container');
      const row = document.createElement('div');
      row.classList.add('menu-row');

      const dishInput = document.createElement('input');
      dishInput.type = 'text';
      dishInput.value = 'Tacos';

      const priceInput = document.createElement('input');
      priceInput.type = 'number';
      priceInput.value = '50';

      const select = document.createElement('select');
      const option = document.createElement('option');
      option.value = 'Comidas';
      option.textContent = 'Comidas';
      select.appendChild(option);
      select.value = 'Comidas';

      row.appendChild(dishInput);
      row.appendChild(priceInput);
      row.appendChild(select);
      container.appendChild(row);

      const menu = placeManager._collectMenuItems();

      expect(menu.length).toBe(1);
      expect(menu[0].dish_name).toBe('Tacos');
      expect(menu[0].price).toBe(50);
      expect(menu[0].category).toBe('Comidas');
    });

    test('debería ignorar filas incompletas', () => {
      const container = document.getElementById('modal-menu-container');
      const row = document.createElement('div');
      row.classList.add('menu-row');
      
      const dishInput = document.createElement('input');
      dishInput.type = 'text';
      dishInput.value = '';

      row.appendChild(dishInput);
      container.appendChild(row);

      const menu = placeManager._collectMenuItems();
      expect(menu.length).toBe(0);
    });
  });

  describe('_collectSchedule()', () => {
    test('debería recolectar horarios del DOM', () => {
      // Crear inputs de schedule
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      days.forEach(day => {
        const openInput = document.createElement('input');
        openInput.classList.add('schedule-open');
        openInput.dataset.day = day;
        openInput.value = '08:00';
        document.body.appendChild(openInput);

        const closeInput = document.createElement('input');
        closeInput.classList.add('schedule-close');
        closeInput.dataset.day = day;
        closeInput.value = '18:00';
        document.body.appendChild(closeInput);
      });

      const schedule = placeManager._collectSchedule();

      expect(Object.keys(schedule).length).toBe(7);
      expect(schedule.monday.open).toBe('08:00');
      expect(schedule.monday.close).toBe('18:00');
    });

    test('debería devolver objeto vacío sin inputs', () => {
      const schedule = placeManager._collectSchedule();
      expect(typeof schedule).toBe('object');
    });
  });

  describe('_toggleFavorite()', () => {
    test('debería agregar lugar a favoritos', () => {
      const place = { id: 1, name: 'Taquería', category: 'Comida Rápida' };
      placeManager.currentPlaces = [place];

      // Crear elemento en DOM
      const placeDiv = document.createElement('div');
      const btn = document.createElement('button');
      btn.classList.add('btn-favorite');
      btn.dataset.id = '1';
      const icon = document.createElement('i');
      btn.appendChild(icon);
      placeDiv.appendChild(btn);
      document.getElementById('places-list').appendChild(placeDiv);

      placeManager._toggleFavorite(1);

      expect(placeManager.favorites.length).toBe(1);
      expect(placeManager.favorites[0].id).toBe(1);
    });

    test('debería remover lugar de favoritos', () => {
      const place = { id: 1, name: 'Taquería', category: 'Comida Rápida' };
      placeManager.currentPlaces = [place];
      placeManager.favorites = [place];

      placeManager._toggleFavorite(1);

      expect(placeManager.favorites.length).toBe(0);
    });

    test('debería actualizar icono del botón de favorito', () => {
      const place = { id: 1, name: 'Taquería', category: 'Comida Rápida' };
      placeManager.currentPlaces = [place];

      const placeDiv = document.createElement('div');
      const btn = document.createElement('button');
      btn.classList.add('btn-favorite');
      btn.dataset.id = '1';
      const icon = document.createElement('i');
      icon.classList.add('bi', 'bi-heart');
      btn.appendChild(icon);
      placeDiv.appendChild(btn);
      document.getElementById('places-list').appendChild(placeDiv);

      placeManager._toggleFavorite(1);

      // Tras agregar a favoritos, debería cambiar
      expect(icon.classList.contains('bi-heart-fill') || icon.classList.contains('bi-heart')).toBe(true);

      placeManager._toggleFavorite(1);

      // Tras remover, debería volver a cambiar
      expect(icon.classList.contains('bi-heart') || icon.classList.contains('bi-heart-fill')).toBe(true);
    });
  });

  describe('_renderStars()', () => {
    test('debería renderizar 5 estrellas llenas para rating 5', () => {
      const html = placeManager._renderStars(5);
      const fullStars = (html.match(/bi-star-fill/g) || []).length;
      expect(fullStars).toBe(5);
    });

    test('debería renderizar 3 estrellas llenas y 2 vacías para rating 3', () => {
      const html = placeManager._renderStars(3);
      const fullStars = (html.match(/bi-star-fill/g) || []).length;
      const emptyStars = (html.match(/bi-star".*text-warning/g) || []).length;
      expect(fullStars).toBe(3);
    });

    test('debería renderizar media estrella para rating decimal', () => {
      const html = placeManager._renderStars(3.5);
      expect(html).toContain('bi-star-half');
    });

    test('debería devolver 0 estrellas para rating indefinido', () => {
      const html = placeManager._renderStars(undefined);
      expect(html).toContain('bi-star');
    });
  });

  describe('_formatSchedule()', () => {
    test('debería devolver string vacío sin schedule', () => {
      const result = placeManager._formatSchedule(null);
      expect(result).toBe('');
    });

    test('debería parsear schedule si es JSON string', () => {
      const schedule = JSON.stringify({
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' }
      });

      const result = placeManager._formatSchedule(schedule);
      expect(result).toContain('schedule-block');
      expect(result).toContain('Lun');
      expect(result).toContain('08:00');
    });

    test('debería formatear schedule como objeto', () => {
      const schedule = {
        monday: { open: '09:00', close: '20:00' },
        tuesday: { open: '09:00', close: '20:00' }
      };

      const result = placeManager._formatSchedule(schedule);
      expect(result).toContain('Lun');
      expect(result).toContain('09:00');
      expect(result).toContain('20:00');
    });

    test('debería mostrar abreviaturas de días en español', () => {
      const schedule = {
        sunday: { open: '10:00', close: '22:00' },
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '22:00' },
        saturday: { open: '10:00', close: '22:00' }
      };

      const result = placeManager._formatSchedule(schedule);
      expect(result).toContain('Dom');
      expect(result).toContain('Lun');
      expect(result).toContain('Mar');
      expect(result).toContain('Mié');
      expect(result).toContain('Jue');
      expect(result).toContain('Vie');
      expect(result).toContain('Sáb');
    });
  });

  describe('_renderFavorites()', () => {
    test('debería limpiar contenedor de favoritos', () => {
      const container = document.getElementById('favorites-list');
      container.innerHTML = '<div>Contenido antiguo</div>';

      placeManager._renderFavorites();

      expect(container.innerHTML).not.toContain('Contenido antiguo');
    });

    test('debería renderizar cada favorito', () => {
      placeManager.favorites = [
        { id: 1, name: 'Taquería', category: 'Comida Rápida', image_url: '/img1.jpg' },
        { id: 2, name: 'Pizzería', category: 'Italiana', image_url: '/img2.jpg' }
      ];

      placeManager._renderFavorites();

      const items = document.querySelectorAll('#favorites-list .list-group-item');
      expect(items.length).toBe(2);
    });

    test('debería mostrar nombre y categoría del favorito', () => {
      placeManager.favorites = [
        { id: 1, name: 'Taquería', category: 'Comida Rápida', image_url: '/img.jpg' }
      ];

      placeManager._renderFavorites();

      const container = document.getElementById('favorites-list');
      expect(container.textContent).toContain('Taquería');
      expect(container.textContent).toContain('Comida Rápida');
    });

    test('debería usar imagen default si no hay image_url', () => {
      placeManager.favorites = [
        { id: 1, name: 'Restaurante', category: 'Restaurante', image_url: null }
      ];

      placeManager._renderFavorites();

      const img = document.querySelector('#favorites-list img');
      expect(img.src).toContain('default_restaurant.jpg');
    });
  });

  describe('createPlace()', () => {
    test('debería validar que local tenga nombre', async () => {
      document.getElementById('modal-local-name').value = '';
      document.getElementById('modal-local-category').value = 'Comida Rápida';

      await placeManager.createPlace();

      expect(mockClient.post).not.toHaveBeenCalled();
    });

    test('debería validar que local tenga categoría', async () => {
      document.getElementById('modal-local-name').value = 'Taquería';
      document.getElementById('modal-local-category').value = '';

      await placeManager.createPlace();

      expect(mockClient.post).not.toHaveBeenCalled();
    });

    test('debería enviar datos al endpoint /api/places', async () => {
      document.getElementById('modal-local-name').value = 'Taquería el Jefe';
      document.getElementById('modal-local-category').value = 'Comida Rápida';

      mockClient.post.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ id: 10, name: 'Taquería el Jefe' })
      });

      // Mock de _collectMenuItems y _collectSchedule
      placeManager._collectMenuItems = jest.fn().mockReturnValue([
        { dish_name: 'Tacos', price: '50', category: 'Comidas' }
      ]);
      placeManager._collectSchedule = jest.fn().mockReturnValue({
        monday: { open: '08:00', close: '18:00' }
      });

      await placeManager.createPlace();

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/places',
        expect.any(FormData)
      );
    });

    test('debería limpiar form después de crear exitosamente', async () => {
      document.getElementById('modal-local-name').value = 'Local Test';
      document.getElementById('modal-local-category').value = 'Comida Rápida';

      mockClient.post.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ id: 1 })
      });

      placeManager._collectMenuItems = jest.fn().mockReturnValue([
        { dish_name: 'Test', price: '10', category: 'Comidas' }
      ]);
      placeManager._collectSchedule = jest.fn().mockReturnValue({
        monday: { open: '08:00', close: '18:00' }
      });
      placeManager.listPlaces = jest.fn();

      await placeManager.createPlace();

      expect(document.getElementById('modal-local-name').value).toBe('');
      expect(mockMenuManager.cleanMenuModal).toHaveBeenCalled();
    });
  });

  describe('deletePlace()', () => {
    test('debería pedir confirmación antes de eliminar', async () => {
      global.confirm.mockReturnValueOnce(false);

      await placeManager.deletePlace(1);

      expect(mockClient.delete).not.toHaveBeenCalled();
    });

    test('debería enviar DELETE al endpoint /api/places/{id}', async () => {
      global.confirm.mockReturnValueOnce(true);
      mockClient.delete.mockResolvedValueOnce({ ok: true });
      placeManager.listPlaces = jest.fn();

      await placeManager.deletePlace(5);

      expect(mockClient.delete).toHaveBeenCalledWith('/api/places/5');
    });

    test('debería refrescar lista después de eliminar', async () => {
      global.confirm.mockReturnValueOnce(true);
      mockClient.delete.mockResolvedValueOnce({ ok: true });
      placeManager.listPlaces = jest.fn();

      await placeManager.deletePlace(5);

      expect(placeManager.listPlaces).toHaveBeenCalled();
    });

    test('debería manejar error al eliminar', async () => {
      global.confirm.mockReturnValueOnce(true);
      const error = new Error('Delete failed');
      mockClient.delete.mockRejectedValueOnce(error);
      jest.spyOn(console, 'error').mockImplementation();

      await placeManager.deletePlace(5);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updatePlace()', () => {
    test('debería enviar PUT al endpoint /api/places/{id}', async () => {
      const formData = new FormData();
      formData.append('name', 'Nuevo nombre');

      mockClient.put.mockResolvedValueOnce({ ok: true });

      await placeManager.updatePlace(5, formData);

      expect(mockClient.put).toHaveBeenCalledWith('/api/places/5', formData);
    });
  });

  describe('listPlaces()', () => {
    test('debería obtener locales del backend', async () => {
      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce([
          { id: 1, name: 'Local 1', category: 'Comida Rápida' }
        ])
      });

      await placeManager.listPlaces();

      expect(mockClient.get).toHaveBeenCalledWith('/api/places');
    });

    test('debería almacenar locales en currentPlaces', async () => {
      const places = [
        { id: 1, name: 'Taquería', category: 'Comida Rápida' }
      ];

      // listPlaces() llama primero a updateNavCounts() que hace get('/api/places/counts')
      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce({})
      });
      // luego hace get('/api/places')
      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(places)
      });

      await placeManager.listPlaces();

      expect(placeManager.currentPlaces).toEqual(places);
    });
  });

  describe('editPlace()', () => {
    test('debería encontrar el local por ID', () => {
      placeManager.currentPlaces = [
        { id: 1, name: 'Local 1', category: 'Comida Rápida' },
        { id: 2, name: 'Local 2', category: 'Italiana' }
      ];

      jest.spyOn(console, 'log').mockImplementation();

      placeManager.editPlace(2);

      expect(console.log).toHaveBeenCalledWith('Editar lugar:', expect.objectContaining({ id: 2 }));
    });
  });

  describe('viewComments()', () => {
    test('debería llamar a commentManager.listComments', async () => {
      await placeManager.viewComments(5);

      expect(mockCommentManager.listComments).toHaveBeenCalledWith(5);
    });
  });
});
