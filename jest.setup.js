// Jest setup file
// Aquí se configura el entorno global para todos los tests

// Mock de las APIs del navegador si es necesario
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

// Mock de sessionStorage
global.sessionStorage = localStorageMock;

// Mock de fetch si es necesario
global.fetch = jest.fn();

// Silenciar advertencias de console en tests (opcional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
