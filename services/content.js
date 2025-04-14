import { API_BASE_URL } from './apiConfig';

export const uploadContent = async (courseId, subjectId, managementId, fileData) => {
  try {
    const url = `${API_BASE_URL}/content/${courseId}/${subjectId}/${managementId}`;
    
    // Asegurarnos de que el body tenga exactamente la estructura requerida
    const requestBody = {
      file: {
        name: fileData.name,
        url: fileData.url
      }
    };

    console.log('Enviando petición:', {
      url,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('Respuesta del servidor (texto):', responseText);

    try {
      const data = JSON.parse(responseText);
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar el archivo');
      }
      return {
        ok: true,
        data
      };
    } catch (parseError) {
      console.error('Error al parsear respuesta:', responseText);
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (error) {
    console.error('Error en uploadContent:', error.message);
    return {
      ok: false,
      error: error.message
    };
  }
};

//get content
export const getContent = async (courseId, subjectId, managementId) => {
  const url = `${API_BASE_URL}/content/${courseId}/${subjectId}/${managementId}`;
  const response = await fetch(url);
  return response.json();
};

//delete content
export const deleteContent = async (id) => {
  try {
    const url = `${API_BASE_URL}/content/${id}`;
    const response = await fetch(url, { 
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    try {
      const data = JSON.parse(responseText);
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar el archivo');
      }
      return {
        ok: true,
        data
      };
    } catch (parseError) {
      console.error('Error al parsear respuesta:', responseText);
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (error) {
    console.error('Error en deleteContent:', error.message);
    return {
      ok: false,
      error: error.message
    };
  }
};

