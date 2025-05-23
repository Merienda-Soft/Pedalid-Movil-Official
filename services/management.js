import { API_BASE_URL } from "./apiConfig";

export const getManagements = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/managements`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en getManagement:', error);
        throw error;
    }
};


export const getManagementActive = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/managements/active`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en getManagementActive:', error);
        throw error;
    }
};

