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
    const response = await fetch(`${API_BASE_URL}/teachers/email/${email}`);
    
    if(!response.ok){
        throw new Error(`Error fetching teacher: ${response.status}`);
    }
    
    return await response.json();
};


