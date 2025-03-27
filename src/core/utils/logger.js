// src/core/utils/logger.js

// Configuración para habilitar o deshabilitar logs
const ENABLE_LOGS = false;

/**
 * Función para logs de información
 * @param {...any} args - Argumentos para el log
 */
export const logInfo = (...args) => {
  if (ENABLE_LOGS) {
    console.log(...args);
  }
};

/**
 * Función para logs de error
 * @param {...any} args - Argumentos para el log
 */
export const logError = (...args) => {
  if (ENABLE_LOGS) {
    console.error(...args);
  }
};

/**
 * Función para logs de advertencia
 * @param {...any} args - Argumentos para el log
 */
export const logWarn = (...args) => {
  if (ENABLE_LOGS) {
    console.warn(...args);
  }
};

/**
 * Función para logs de depuración
 * @param {...any} args - Argumentos para el log
 */
export const logDebug = (...args) => {
  if (ENABLE_LOGS) {
    console.debug(...args);
  }
};

export default {
  logInfo,
  logError,
  logWarn,
  logDebug
}; 