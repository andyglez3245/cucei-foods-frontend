# Testing con Jest + jsdom

## Configuración completada

El proyecto está configurado con **Jest** y **jsdom** para testing JavaScript.

### Instalación

Las dependencias ya fueron instaladas:
```bash
npm install
```

### Ejecutar tests

**Ejecutar todos los tests:**
```bash
npm test
```

**Ejecutar tests en modo watch (reinicia al cambiar archivos):**
```bash
npm run test:watch
```

**Ejecutar tests con reporte de cobertura:**
```bash
npm run test:coverage
```

### Estructura de archivos

```
__tests__/              # Tests globales
app/js/                 # Código JavaScript de la app
  *.js                  # Archivos fuente
  *.spec.js             # Tests unitarios
login/js/               # Código JavaScript del login
  *.js                  # Archivos fuente
  *.spec.js             # Tests unitarios
jest.config.js          # Configuración de Jest
jest.setup.js           # Setup global para tests
package.json            # Dependencias y scripts
```

### Convenciones

1. **Nombrado de archivos de test:**
   - `nombreArchivo.spec.js` para tests
   - O en carpeta `__tests__/nombreArchivo.spec.js`

2. **Estructura básica de test:**
```javascript
describe('Nombre del módulo', () => {
  test('debería hacer algo', () => {
    expect(resultado).toBe(esperado);
  });
});
```

3. **Cobertura de tests:**
   - Mínimo requerido: 70% para branches, functions, lines, statements
   - Configurado en `jest.config.js`
   - Ver reporte: `npm run test:coverage` genera carpeta `coverage/`

### Mock de APIs del navegador

Disponibles en todos los tests:
- `localStorage` - Mock incluido
- `sessionStorage` - Mock incluido  
- `fetch()` - Mock incluido
- `document` y `window` - Proporcionados por jsdom

Ejemplo:
```javascript
test('guardar en localStorage', () => {
  localStorage.setItem('clave', 'valor');
  // localStorage es un mock jest.fn()
});
```

### Próximos pasos

1. ✅ TEST-001: Configurar entorno de tests
2. → TEST-002: Inventario y clasificación de archivos JS
3. → TEST-003: Tests unitarios — Módulos críticos
4. → TEST-004: Tests unitarios — Resto de módulos
5. → TEST-005: Tests de integración
6. → TEST-006: Revisar y corregir fallos
7. → TEST-007: Medir cobertura y generar reportes
8. → TEST-008: Integrar tests en CI
9. → TEST-009: Documentación final
