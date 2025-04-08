import { API_BASE_URL } from "./apiConfig";

export const getActivities = async (materiaId, cursoId, teacherId, managementId) => {
    const response = await fetch(`${API_BASE_URL}/tasks/professor/${teacherId}/course/${cursoId}/subject/${materiaId}/management/${managementId}`);

    if (response.status === 404) {
        throw new Error('NO_TASKS');
    }

    if (!response.ok) {
        throw new Error(`Error fetching activities: ${response.status}`);
    }

    return await response.json();
}

export const getActivityById = async (idActivity) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${idActivity}`, {
    method: "GET",
  });

  return await response.json();
}

export const getActivityByIdwithassignments = async (idActivity) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${idActivity}/assignments`, {
    method: "GET",
  });

  return await response.json();
}

// get tasks by student id
export const getTasksByStudentId = async (studentId, courseId, subjectId, managementId) => {
  const response = await fetch(`${API_BASE_URL}/tasks/student/${studentId}/course/${courseId}/subject/${subjectId}/management/${managementId}`, {
    method: "GET",
  });

  return await response.json();
}

export const getTaskByIdwithassignments = async (taskId, studentId) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/student/${studentId}`, {
    method: "GET",
  });

  return await response.json();
}

export const createActivity = async (activityData) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
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

export const updateActivity = async (activityId, studentsData) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${activityId}/grade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ students: studentsData }),
  });

  return response;
};

export const deleteActivity = async (idActivity) => {
  const response = await fetch(`${API_BASE_URL}/tasks/delete/${idActivity}`, {
    method: "POST",
  });

  return await response.json();
}

export const submitTaskFiles = async (taskId, studentId, files) => {
  const response = await fetch(`${API_BASE_URL}/tasks/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      taskId,
      studentId,
      files
    }),
  });

  if (!response.ok) {
    throw new Error(`Error submitting task: ${response.status}`);
  }

  return await response.json();
};

export const cancelSubmitTaskFiles = async (taskId, studentId) => { 
  const response = await fetch(`${API_BASE_URL}/tasks/cancel-submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      taskId,
      studentId
    })
  });
    

  return await response.json();
}

