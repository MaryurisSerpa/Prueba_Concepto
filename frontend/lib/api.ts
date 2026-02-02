/**
 * Cliente HTTP para comunicación con backends Flask y FastAPI.
 * 
 * Proporciona métodos para realizar peticiones HTTP con configuración común.
 * La baseURL es dinámica y puede cambiar entre Flask (5000) y FastAPI (8002).
 */

// API URL desde variables de entorno
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Cliente API reutilizable con métodos HTTP estándar.
 * 
 * @property {string} baseURL - URL base del backend actual (Flask o FastAPI)
 */
export const apiClient = {
  baseURL: API_URL,
  
  /**
   * Realiza una petición GET al backend.
   * 
   * @param endpoint - Ruta del endpoint (ej: '/api/cursos')
   * @returns Promise con la respuesta en formato JSON
   * @throws Error si la petición falla
   * 
   * @example
   * const cursos = await apiClient.get('/api/cursos');
   */
  async get(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Realiza una petición POST al backend.
   * 
   * @param endpoint - Ruta del endpoint (ej: '/api/mallas/MALLA001/cursos')
   * @param data - Datos a enviar en el body de la petición
   * @returns Promise con la respuesta en formato JSON
   * @throws Error si la petición falla o retorna error del servidor
   * 
   * @example
   * await apiClient.post('/api/mallas/MALLA001/cursos', {
   *   curso_id: 'PROG101',
   *   semestre: 1,
   *   posicion_x: 100,
   *   posicion_y: 200
   * });
   */
  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      const error: any = new Error(result.error || `API Error: ${response.statusText}`);
      error.data = result;
      throw error;
    }
    
    return result;
  },

  /**
   * Realiza una petición PUT al backend.
   * 
   * @param endpoint - Ruta del endpoint
   * @param data - Datos a actualizar
   * @returns Promise con la respuesta en formato JSON
   * @throws Error si la petición falla
   * 
   * @example
   * await apiClient.put('/api/mallas/MALLA001/cursos/MALLA_PROG101_0', {
   *   semestre: 2,
   *   posicion_x: 300
   * });
   */
  async put(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Realiza una petición DELETE al backend.
   * 
   * @param endpoint - Ruta del endpoint con ID del recurso a eliminar
   * @returns Promise con la respuesta en formato JSON
   * @throws Error si la petición falla
   * 
   * @example
   * await apiClient.delete('/api/mallas/MALLA001/cursos/MALLA_PROG101_0');
   */
  async delete(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }
};
