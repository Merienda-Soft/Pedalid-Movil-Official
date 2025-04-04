import { API_BASE_URL } from "./apiConfig";

export const authUser = async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
    
    if(!response.ok){
        throw new Error(`Error fetching user: ${response.status}`);
    }

    const data = await response.json();

    return data;

};

export const getTeacherByEmail = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/professors/${email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en getTeacherByEmail:', error);
    throw error;
  }
};


