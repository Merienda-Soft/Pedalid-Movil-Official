import { API_BASE_URL } from "./apiConfig";

export const getActivities = async (materiaId, cursoId, techerId) => {
    const response = await fetch(`${API_BASE_URL}/activities/filter?materiaid=${materiaId}&cursoid=${cursoId}&teacherid=${techerId}`)

    if(!response.ok){
        throw new Error(`Error fetching activities: ${response.status}`);
    }

    return await response.json();
}

export const getActivityById = async (idActivity) => {
  const response = await fetch(`${API_BASE_URL}/activities/${idActivity}`, {
    method: "GET",
  });

  return await response.json();
}

export const createActivity = async (activityData) => {
    const response = await fetch(`${API_BASE_URL}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityData),
    });
  
    if (!response.ok) {
      throw new Error(`Error creating activity: ${response.status}`);
    }
  
    return await response.json();
  };

export const updateActivity = async (activityData) => {
  const response = await fetch(`${API_BASE_URL}/activities/${activityData.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(activityData),
  });

  return response.json();
}

export const deleteActivity = async (idActivity) => {
  const response = await fetch(`${API_BASE_URL}/activities/${idActivity}`, {
    method: "DELETE",
  });

  return await response.json();
}
