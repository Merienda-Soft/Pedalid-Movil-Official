import { API_BASE_URL } from './apiConfig';  // Asegúrate de tener un archivo de configuración con tu URL base de la API

// Obtener estudiantes por curso y materia
export const getStudentsByCourseAndSubject = async (courseid, materiaid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/registration/inscripciones?courseid=${courseid}&materiaid=${materiaid}`);
    
    if (!response.ok) {
      throw new Error(`Error al obtener estudiantes: ${response.status}`);
    }

    const students = await response.json();
    return students;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

// Guardar asistencia
export const saveAttendance = async (attendanceData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/attendances/attendances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attendanceData),
    });

    if (!response.ok) {
      throw new Error(`Error al guardar asistencia: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error saving attendance:", error);
    throw error;
  }
};

export const getAttendanceByCourseAndDate = async (courseid, materiaid, date) => {
    const response = await fetch(`${API_BASE_URL}/attendances//attendances/search?courseid=${courseid}&materiaid=${materiaid}&date=${date}`);
    
    if (!response.ok) {
      throw new Error(`Error al buscar asistencia: ${response.status}`);
    }
    
    return await response.json();
  };
