import { Alert } from 'react-native';

const ERROR_TYPES = {
  AUTH: 'AUTH',
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
  NO_TASKS: 'NO_TASKS'  // Add new error type
};

const ERROR_MESSAGES = {
  [ERROR_TYPES.AUTH]: 'Error de autenticación. Por favor inicie sesión nuevamente.',
  [ERROR_TYPES.NETWORK]: 'Error de conexión. Verifique su conexión a internet.',
  [ERROR_TYPES.VALIDATION]: 'Por favor verifique los datos ingresados.',
  [ERROR_TYPES.SERVER]: 'Error en el servidor. Intente más tarde.',
  [ERROR_TYPES.UNKNOWN]: 'Ha ocurrido un error inesperado.',
  [ERROR_TYPES.NO_TASKS]: 'No hay tareas registradas para esta materia.' // Add message
};

export class AppError extends Error {
  constructor(type, message, originalError = null) {
    super(message || ERROR_MESSAGES[type]);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
  }
}

export const handleError = (error, customMessage = null) => {
  
  let customError;

  if (error instanceof AppError) {
    customError = error;
  } else if (error.message === 'NO_TASKS') {
    customError = new AppError(ERROR_TYPES.NO_TASKS, customMessage, error);
  } else if (error.message?.includes('Network')) {
    customError = new AppError(ERROR_TYPES.NETWORK, null, error);
  } else if (error.response?.status === 401) {
    customError = new AppError(ERROR_TYPES.AUTH, null, error);
  } else if (error.response?.status >= 500) {
    customError = new AppError(ERROR_TYPES.SERVER, null, error);
  } else {
    customError = new AppError(ERROR_TYPES.UNKNOWN, null, error);
  }

  Alert.alert('Aviso', customMessage || customError.message);
  return customError;
};

export const createError = (type, message) => {
  return new AppError(type, message);
};

export const isNetworkError = (error) => {
  return error?.message?.includes('Network') || 
         error?.type === ERROR_TYPES.NETWORK;
};

export { ERROR_TYPES };