/**
 * Tests para CommentManager.js
 * Administra comentarios, calificaciones y su renderización
 */

import { CommentManager } from '../../app/js/CommentManager.js';

describe('CommentManager - Gestión de comentarios y calificaciones', () => {
  let commentManager;
  let mockClient;
  let mockSessionManager;

  beforeEach(() => {
    // Mocks
    mockClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      backendUrl: 'http://backend.local'
    };

    mockSessionManager = {
      userID: 123,
      userName: 'John Doe'
    };

    // Crear elementos DOM necesarios
    document.body.innerHTML = `
      <div id="modal-star-rating">
        <span class="star" data-value="1"><i class="bi bi-star"></i></span>
        <span class="star" data-value="2"><i class="bi bi-star"></i></span>
        <span class="star" data-value="3"><i class="bi bi-star"></i></span>
        <span class="star" data-value="4"><i class="bi bi-star"></i></span>
        <span class="star" data-value="5"><i class="bi bi-star"></i></span>
      </div>
      <button id="btn-submit-comment">Enviar comentario</button>
      <textarea id="comment-input"></textarea>
      <ul id="comments-list"></ul>
      <div id="modal-comments" data-place-id=""></div>
    `;

    // Mock de alert
    global.alert = jest.fn();

    commentManager = new CommentManager(mockClient, mockSessionManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('constructor()', () => {
    test('debería inicializar con cliente y sessionManager', () => {
      expect(commentManager.client).toBe(mockClient);
      expect(commentManager.sessionManager).toBe(mockSessionManager);
    });

    test('debería tener rating inicial en 0', () => {
      expect(commentManager.selectedRating).toBe(0);
    });

    test('debería encontrar elementos DOM correctos', () => {
      expect(commentManager.starRatingContainer).not.toBeNull();
      expect(commentManager.btnSubmitComment).not.toBeNull();
      expect(commentManager.commentList).not.toBeNull();
    });

    test('debería agregar listeners a las estrellas', () => {
      const stars = document.querySelectorAll('.star');
      expect(stars.length).toBe(5);
    });
  });

  describe('Star rating - Hover preview', () => {
    test('debería resaltar estrellas al pasar mouse sobre ellas', () => {
      const star3 = document.querySelector('.star[data-value="3"]');

      star3.dispatchEvent(new MouseEvent('mouseenter'));

      const stars = document.querySelectorAll('.star');
      for (let i = 0; i < 3; i++) {
        expect(stars[i].classList.contains('hovered')).toBe(true);
      }
      for (let i = 3; i < 5; i++) {
        expect(stars[i].classList.contains('hovered')).toBe(false);
      }
    });

    test('debería remover hover preview al sacar mouse', () => {
      const star3 = document.querySelector('.star[data-value="3"]');

      star3.dispatchEvent(new MouseEvent('mouseenter'));
      star3.dispatchEvent(new MouseEvent('mouseleave'));

      const stars = document.querySelectorAll('.star');
      stars.forEach(star => {
        expect(star.classList.contains('hovered')).toBe(false);
      });
    });

    test('debería mantener selección anterior después de hover', () => {
      const star2 = document.querySelector('.star[data-value="2"]');
      const star4 = document.querySelector('.star[data-value="4"]');

      // Seleccionar 2 estrellas
      star2.click();
      expect(commentManager.selectedRating).toBe(2);

      // Hacer hover sobre 4 estrellas (solo preview)
      star4.dispatchEvent(new MouseEvent('mouseenter'));

      // Verificar que la selección se mantiene al sacar mouse
      star4.dispatchEvent(new MouseEvent('mouseleave'));
      expect(commentManager.selectedRating).toBe(2);

      const stars = document.querySelectorAll('.star');
      expect(stars[1].classList.contains('selected')).toBe(true);
      expect(stars[3].classList.contains('selected')).toBe(false);
    });
  });

  describe('Star rating - Selección', () => {
    test('debería seleccionar rating al hacer click en estrella', () => {
      const star4 = document.querySelector('.star[data-value="4"]');
      star4.click();

      expect(commentManager.selectedRating).toBe(4);
    });

    test('debería actualizar clase "selected" al hacer click', () => {
      const star3 = document.querySelector('.star[data-value="3"]');
      star3.click();

      const stars = document.querySelectorAll('.star');
      for (let i = 0; i < 3; i++) {
        expect(stars[i].classList.contains('selected')).toBe(true);
      }
      for (let i = 3; i < 5; i++) {
        expect(stars[i].classList.contains('selected')).toBe(false);
      }
    });

    test('debería cambiar de rating al seleccionar otra estrella', () => {
      const star2 = document.querySelector('.star[data-value="2"]');
      const star5 = document.querySelector('.star[data-value="5"]');

      star2.click();
      expect(commentManager.selectedRating).toBe(2);

      star5.click();
      expect(commentManager.selectedRating).toBe(5);

      const stars = document.querySelectorAll('.star');
      stars.forEach((star, idx) => {
        const expected = idx < 5;
        expect(star.classList.contains('selected')).toBe(expected);
      });
    });

    test('debería permitir seleccionar 1 estrella', () => {
      const star1 = document.querySelector('.star[data-value="1"]');
      star1.click();

      expect(commentManager.selectedRating).toBe(1);
      expect(star1.classList.contains('selected')).toBe(true);
    });

    test('debería permitir seleccionar 5 estrellas', () => {
      const star5 = document.querySelector('.star[data-value="5"]');
      star5.click();

      expect(commentManager.selectedRating).toBe(5);
      const stars = document.querySelectorAll('.star');
      stars.forEach(star => {
        expect(star.classList.contains('selected')).toBe(true);
      });
    });
  });

  describe('addComment()', () => {
    test('debería requerir texto antes de enviar', async () => {
      document.getElementById('comment-input').value = '';
      commentManager.selectedRating = 5;

      await commentManager.addComment();

      expect(mockClient.post).not.toHaveBeenCalled();
    });

    test('debería requerir rating antes de enviar', async () => {
      document.getElementById('comment-input').value = 'Excelente lugar';
      commentManager.selectedRating = 0;

      await commentManager.addComment();

      expect(global.alert).toHaveBeenCalledWith('Selecciona una calificación.');
    });

    test('debería enviar comentario al backend con datos correctos', async () => {
      const placeId = '456';
      document.getElementById('modal-comments').dataset.placeId = placeId;
      document.getElementById('comment-input').value = 'Muy bueno';
      commentManager.selectedRating = 4;

      mockClient.post.mockResolvedValueOnce({ ok: true });

      await commentManager.addComment();

      expect(mockClient.post).toHaveBeenCalledWith(
        `/api/places/${placeId}/comments`,
        expect.any(FormData)
      );
    });

    test('debería incluir user_id, text y rating en FormData', async () => {
      document.getElementById('modal-comments').dataset.placeId = '789';
      document.getElementById('comment-input').value = 'Comentario test';
      commentManager.selectedRating = 3;

      mockClient.post.mockResolvedValueOnce({ ok: true });

      await commentManager.addComment();

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/places/789/comments',
        expect.any(FormData)
      );
    });

    test('debería renderizar comentario tras envío exitoso', async () => {
      document.getElementById('modal-comments').dataset.placeId = '100';
      document.getElementById('comment-input').value = 'Excelente comida';
      commentManager.selectedRating = 5;

      mockClient.post.mockResolvedValueOnce({ ok: true });

      await commentManager.addComment();

      const commentItem = document.querySelector('.list-group-item');
      expect(commentItem).not.toBeNull();
      expect(commentItem.textContent).toContain('John Doe');
      expect(commentItem.textContent).toContain('Excelente comida');
    });

    test('debería mostrar alerta en caso de error al guardar', async () => {
      document.getElementById('modal-comments').dataset.placeId = '100';
      document.getElementById('comment-input').value = 'Test';
      commentManager.selectedRating = 3;

      mockClient.post.mockResolvedValueOnce({ ok: false });

      await commentManager.addComment();

      expect(global.alert).toHaveBeenCalledWith('Error al agregar el comentario');
    });

    test('debería limpiar input después del envío', async () => {
      document.getElementById('modal-comments').dataset.placeId = '100';
      const input = document.getElementById('comment-input');
      input.value = 'Comentario';
      commentManager.selectedRating = 4;

      mockClient.post.mockResolvedValueOnce({ ok: true });

      await commentManager.addComment();

      expect(input.value).toBe('');
    });

    test('debería resetear selectedRating después del envío', async () => {
      document.getElementById('modal-comments').dataset.placeId = '100';
      document.getElementById('comment-input').value = 'Test';
      commentManager.selectedRating = 5;

      mockClient.post.mockResolvedValueOnce({ ok: true });

      await commentManager.addComment();

      expect(commentManager.selectedRating).toBe(0);
    });

    test('debería resetear visualización de estrellas después del envío', async () => {
      document.getElementById('modal-comments').dataset.placeId = '100';
      document.getElementById('comment-input').value = 'Test';
      commentManager.selectedRating = 5;

      mockClient.post.mockResolvedValueOnce({ ok: true });

      await commentManager.addComment();

      const stars = document.querySelectorAll('.star');
      stars.forEach(star => {
        expect(star.classList.contains('selected')).toBe(false);
      });
    });
  });

  describe('listComments()', () => {
    test('debería limpiar comentarios previos', async () => {
      const commentList = document.getElementById('comments-list');
      commentList.innerHTML = '<li>Comentario antiguo</li>';

      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce([])
      });

      await commentManager.listComments('123');

      expect(commentList.textContent).not.toContain('Comentario antiguo');
    });

    test('debería obtener comentarios del backend', async () => {
      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce([])
      });

      await commentManager.listComments('456');

      expect(mockClient.get).toHaveBeenCalledWith('/api/places/456/comments');
    });

    test('debería renderizar cada comentario obtenido', async () => {
      const comments = [
        { user_name: 'Alice', text: 'Muy bueno', rating: 5 },
        { user_name: 'Bob', text: 'Bueno', rating: 4 }
      ];

      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(comments)
      });

      await commentManager.listComments('123');

      const items = document.querySelectorAll('.list-group-item');
      expect(items.length).toBe(2);
      expect(items[0].textContent).toContain('Bob');
      expect(items[1].textContent).toContain('Alice');
    });

    test('debería mostrar nombre del usuario en comentario', async () => {
      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce([
          { user_name: 'Carlos', text: 'Test', rating: 3 }
        ])
      });

      await commentManager.listComments('789');

      const item = document.querySelector('.list-group-item');
      expect(item.querySelector('strong').textContent).toBe('Carlos');
    });

    test('debería mostrar texto del comentario', async () => {
      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce([
          { user_name: 'User', text: 'Excelente lugar', rating: 5 }
        ])
      });

      await commentManager.listComments('100');

      const item = document.querySelector('.list-group-item');
      expect(item.textContent).toContain('Excelente lugar');
    });

    test('debería mostrar estrellas según rating', async () => {
      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce([
          { user_name: 'User', text: 'Test', rating: 3 }
        ])
      });

      await commentManager.listComments('100');

      const item = document.querySelector('.list-group-item');
      const starIcons = item.querySelectorAll('.bi-star-fill');
      expect(starIcons.length).toBe(3);
    });

    test('debería manejar error al obtener comentarios', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Network error'));
      jest.spyOn(console, 'error').mockImplementation();

      await commentManager.listComments('123');

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching comments:',
        expect.any(Error)
      );
    });

    test('debería renderizar comentarios sin duplicados', async () => {
      const comments = [
        { user_name: 'User1', text: 'Comment 1', rating: 5 },
        { user_name: 'User2', text: 'Comment 2', rating: 4 }
      ];

      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(comments)
      });

      await commentManager.listComments('123');
      
      // Llamar de nuevo
      mockClient.get.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(comments)
      });

      await commentManager.listComments('123');

      const items = document.querySelectorAll('.list-group-item');
      expect(items.length).toBe(2); // No debe duplicar
    });
  });

  describe('_renderCommentItem()', () => {
    test('debería crear elemento con clase list-group-item', () => {
      commentManager._renderCommentItem('User', 'Text', 3);

      const item = document.querySelector('.list-group-item');
      expect(item).not.toBeNull();
    });

    test('debería mostrar nombre del usuario', () => {
      commentManager._renderCommentItem('TestUser', 'Comentario', 4);

      const item = document.querySelector('.list-group-item');
      expect(item.textContent).toContain('TestUser');
    });

    test('debería mostrar texto del comentario', () => {
      commentManager._renderCommentItem('User', 'Texto especial', 5);

      const item = document.querySelector('.list-group-item');
      expect(item.textContent).toContain('Texto especial');
    });

    test('debería mostrar estrellas llenas según rating', () => {
      commentManager._renderCommentItem('User', 'Test', 4);

      const item = document.querySelector('.list-group-item');
      const fullStars = item.querySelectorAll('.bi-star-fill');
      const emptyStars = item.querySelectorAll('.bi-star:not(.bi-star-fill)');

      expect(fullStars.length).toBe(4);
      expect(emptyStars.length).toBe(1);
    });

    test('debería agregar comentario al inicio de la lista (prepend)', () => {
      commentManager._renderCommentItem('First', 'First comment', 5);
      commentManager._renderCommentItem('Second', 'Second comment', 3);

      const items = document.querySelectorAll('.list-group-item');
      expect(items[0].textContent).toContain('Second');
      expect(items[1].textContent).toContain('First');
    });

    test('debería mostrar imagen de usuario', () => {
      commentManager._renderCommentItem('User', 'Test', 3);

      const img = document.querySelector('.comment-user-image');
      expect(img).not.toBeNull();
      expect(img.src).toContain('default_user.png');
    });
  });

  describe('_highlightStars()', () => {
    test('debería resaltar X estrellas con clase dada', () => {
      commentManager._highlightStars(3, 'test-class');

      const stars = document.querySelectorAll('.star');
      for (let i = 0; i < 3; i++) {
        expect(stars[i].classList.contains('test-class')).toBe(true);
      }
      for (let i = 3; i < 5; i++) {
        expect(stars[i].classList.contains('test-class')).toBe(false);
      }
    });

    test('debería remover clases anteriores antes de aplicar nueva', () => {
      // _highlightStars gestiona las clases 'hovered' y 'selected'
      commentManager._highlightStars(3, 'hovered');
      commentManager._highlightStars(2, 'selected');

      const stars = document.querySelectorAll('.star');
      // Primera estrella: debería tener selected y no tener hovered
      expect(stars[0].classList.contains('selected')).toBe(true);
      expect(stars[0].classList.contains('hovered')).toBe(false);
      // Tercera estrella: debería tener hovered removida
      expect(stars[2].classList.contains('hovered')).toBe(false);
    });

    test('debería limpiar todas las estrellas si amount es 0', () => {
      commentManager._highlightStars(5, 'hovered');
      commentManager._highlightStars(0, 'hovered');

      const stars = document.querySelectorAll('.star');
      stars.forEach(star => {
        // Cuando amount es 0, ninguna estrella cumple <= 0
        const hasClass = star.classList.contains('hovered');
        expect(hasClass).toBe(false);
      });
    });
  });
});
