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

// para obtener los detalles de la actividad
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

export const createActivity = async (activityData, createdBy) => {
    const dataWithAudit = {
      ...activityData,
      created_by: createdBy
    };

    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataWithAudit),
    });
  
    if (!response.ok) {
      throw new Error(`Error creating activity: ${response.status}`);
    }
  
    return await response.json();
  };

export const updateActivity = async (activityId, studentsData, updatedBy) => {
  const dataWithAudit = {
    students: studentsData,
    updated_by: updatedBy
  };

  const response = await fetch(`${API_BASE_URL}/tasks/${activityId}/grade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataWithAudit),
  });

  return response;
};

export const updateTask = async (taskData, updatedBy) => {
  const dataWithAudit = {
    ...taskData,
    updated_by: updatedBy
  };

  const response = await fetch(`${API_BASE_URL}/tasks/${taskData.task.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataWithAudit),
  });

  if (!response.ok) {
    throw new Error(`Error updating task: ${response.status}`);
  }

  return await response.json();
};

export const deleteActivity = async (idActivity, deletedBy) => {
  const response = await fetch(`${API_BASE_URL}/tasks/delete/${idActivity}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ deleted_by: deletedBy }),
  });

  return await response.json();
}

export const submitTaskFiles = async (taskId, studentId, files, updatedBy, evaluationMethodology = null) => {
  const body = {
    taskId,
    studentId,
    files,
    updated_by: updatedBy
  };

  // Si se proporciona evaluationMethodology, es una autoevaluación
  if (evaluationMethodology) {
    body.evaluation_methodology = evaluationMethodology;
  }

  const response = await fetch(`${API_BASE_URL}/tasks/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Error submitting task: ${response.status}`);
  }

  return await response.json();
};

export const cancelSubmitTaskFiles = async (taskId, studentId, updatedBy) => { 
  const response = await fetch(`${API_BASE_URL}/tasks/cancel-submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      taskId,
      studentId,
      updated_by: updatedBy
    })
  });
    

  return await response.json();
}

// Obtener pesos por dimensión para control de ponderaciones
export const getWeightsByDimension = async (professorId, courseId, subjectId, managementId, date) => {
  try {
    const currentDate = date || new Date().toISOString().split('T')[0];
    const response = await fetch(
      `${API_BASE_URL}/tasks/weight/professor/${professorId}/course/${courseId}/subject/${subjectId}/management/${managementId}?date=${currentDate}`
    );
    
    if (!response.ok) {
      throw new Error(`Error al obtener los pesos por dimensión: ${response.status}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error || 'Error al obtener los pesos por dimensión');
    }

    return data.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

