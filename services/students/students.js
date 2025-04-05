import { API_BASE_URL } from "../apiConfig";

export const getStudents = async (id, role, managementId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/tutor-student/${id}/${role}/courses-subjects?managementId=${managementId}`, {
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
        console.error('Error en getStudents:', error);
        throw error;
    }
}

