import { API_BASE_URL } from "./apiConfig";

/**
 * Obtiene todos los registros de gestión
 * @param {string} email - Email del usuario (opcional)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getManagements = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/managements/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Si tienes un sistema de autenticación, aquí irían los headers necesarios
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            data
        };
    } catch (error) {
        console.error('Error en getManagement:', error);
        return {
            success: false,
            error: 'Error al obtener los datos de gestiónes'
        };
    }
};

