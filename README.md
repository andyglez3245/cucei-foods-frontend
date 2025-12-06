# cucei-foods-frontend

## Resumen

CUCEI Foods es una aplicación web estática (HTML/CSS/JS) para listar y gestionar locales de comida dentro del campus. Proporciona vistas para usuarios autenticados, permite agregar locales, gestionar menús, ver comentarios y calificaciones, y marcar favoritos.

## Características principales

- Listado de locales por categoría (Desayunos y Comidas, Bebidas y Cafetería, Snacks).
- Búsqueda y filtrado de locales.
- Añadir/editar locales (nombre, horario por día, categoría, menú, imagen).
- Sistema de favoritos.
- Comentarios y calificaciones (estrellas) por local.
- Modales para ver menú y listar comentarios.
- Autenticación básica mediante `sessionStorage` (cliente).

## Tecnologías

- HTML5
- CSS (Bootstrap 5.3.8 + estilos personalizados)
- JavaScript (módulos ES6)
- Estructura preparada para desplegar en Apache Tomcat (static webapp)

## Requisitos

- Java (JRE/JDK) instalado para correr Apache Tomcat.
- Apache Tomcat (en este repositorio está bajo `C:\Tomcat\apache-tomcat-10.1.20` según el workspace).
- Navegador moderno con soporte ES6 modules.

## Instalación y despliegue (Windows / PowerShell)

1. Asegúrate de tener Java y Tomcat instalados.
2. Copia la carpeta `cucei-foods-frontend` dentro de la carpeta `webapps` de Tomcat (si aún no está ahí).
3. Inicia Tomcat (desde PowerShell):

```powershell
cd 'C:\Tomcat\apache-tomcat-10.1.20\bin'
.\startup.bat
# o para ver logs en la consola
.\catalina.bat run
```

4. Abre la aplicación en el navegador:

- Página principal (requiere sesión): `http://localhost:8080/cucei-foods-frontend/app/index.html`
- Página de login: `http://localhost:8080/cucei-foods-frontend/login/index.html`

Nota: la app usa `sessionStorage` para la sesión; si no hay `userID` guardado redirige a la página de login.

## Estructura del proyecto

- `index.html` — Página raíz (posible landing).
- `README.md` — Información principal del repo.

- `app/`
  - `index.html` — Interfaz principal de la app (listas, modal para agregar local, modales de comentarios y menú).
  - `images/` — Iconos e imágenes usadas por la app.
  - `js/` — Lógica front-end (módulos):
    - `Client.js`
    - `CommentManager.js`
    - `main.js` — Punto de entrada (cargado como `type="module"`).
    - `MenuManager.js`
    - `PlaceManager.js`
    - `SessionManager.js`
    - `utils.js`
  - `style/` — Estilos específicos (p. ej. `main-page.css`).

- `login/`
  - `index.html` — Formulario de inicio de sesión.
  - `js/` — JS para login (`Client.js`, `main.js`, `UserManager.js`, `utils.js`).
  - `style/` — Estilos de la página de login (`login.css`).

- `style/` — Dependencias de estilo (Bootstrap 5.3.8 y Bootstrap Icons).
  - `bootstrap-5.3.8/` — CSS y JS de Bootstrap.
  - `bootstrap-icons-1.13.1/` — Iconos.

## Flujo de la aplicación (uso)

1. Login:
   - El usuario entra a `login/index.html` y hace autenticación (manejada en cliente). Al iniciar, se guarda `userID` en `sessionStorage`.
2. Acceso a la app:
   - `app/index.html` comprueba `sessionStorage` y redirige a login si no hay sesión.
3. Interfaz principal:
   - Barra lateral con categorías y contador de locales.
   - Lista principal con resultados; cada local puede mostrar menú, comentarios y permitir marcar favorito.
   - Botón para agregar nuevo local abre el modal `#modal-pull-right-add` donde se captura nombre, horario por día, categoría, menú e imagen.
4. Comentarios y calificaciones:
   - Modal `#modal-comments` permite puntuar con estrellas y publicar comentarios.
5. Menú:
   - Modal `#modal-view-menu` muestra el menú del local agrupado por categorías/dishes.

## Desarrollo

- Edición: simplemente editar los archivos en `app/` y `login/`.
- `main.js` (en `app/js`) es el punto de entrada; revisar `utils.js` para funciones utilitarias.
- Para ver cambios: reinicia Tomcat o recarga la página; el navegador puede cachear recursos estáticos (usa Ctrl+F5 para forzar recarga).

### Comandos útiles (PowerShell)

```powershell
# Reiniciar Tomcat
cd 'C:\Tomcat\apache-tomcat-10.1.20\bin'
.\shutdown.bat ; .\startup.bat

# Ver archivos del proyecto (ejemplo)
Get-ChildItem -Recurse -Directory 'C:\Tomcat\apache-tomcat-10.1.20\webapps\cucei-foods-frontend' | Select-Object FullName
```

## Pruebas y verificación rápida

- Asegúrate de que `app/index.html` redirige a `login/index.html` si `sessionStorage.getItem('userID')` es `null`.
- Probar añadir un local desde el modal y verificar que el UI inserta correctamente la entrada en `#places-list` (esto depende de la implementación JS en `main.js` / `PlaceManager.js`).
- Probar que la subida de imagen muestra vista previa (`#modal-image-preview`).

## Seguridad y límites

- Actualmente la autenticación y la persistencia parecen manejarse en el cliente (sessionStorage/local data). Para producción se recomienda integrar un backend con autenticación segura y almacenamiento persistente (base de datos).
- Validar y sanitizar entradas del usuario antes de enviarlas a cualquier backend.

## Cómo contribuir

- Fork / clon del repo.
- Crear branch descriptivo (`feature/agregar-filtro` o `fix/validacion-imagen`).
- Hacer cambios, probar localmente en Tomcat.
- PR contra `main` con descripción y pasos para reproducir.