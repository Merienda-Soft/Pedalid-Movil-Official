import { API_BASE_URL } from './apiConfig';  // Asegúrate de tener un archivo de configuración con tu URL base de la API

export const getStudentsByCourse = async (courseId) => {
    const response = await fetch(`${API_BASE_URL}/students/course/${courseId}`);
    return response.json();
};

// Registrar asistencia para un curso completo
export const registerAttendance = async (attendanceData, recordsData) => {
    const response = await fetch(`${API_BASE_URL}/attendance/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            attendance: attendanceData,
            records: recordsData
        })
    });
    return response.json();
};

// Obtener asistencia por curso, materia y fecha
export const getAttendanceByCourseSubjectDate = async (courseId, subjectId, date) => {
    const response = await fetch(`${API_BASE_URL}/attendance/course/${courseId}/subject/${subjectId}/date/${date}`);
    return response.json();
};

// Obtener asistencia por curso y fecha
export const getAttendanceByCourseDate = async (courseId, date) => {
    const response = await fetch(`${API_BASE_URL}/attendance/course/${courseId}/date/${date}`);
    return response.json();
};

// Actualizar estado de asistencia de un estudiante
export const updateAttendanceRecord = async (updateData) => {
    const response = await fetch(`${API_BASE_URL}/attendance/attendance/batch-update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    return response.json();
};
