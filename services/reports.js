import { API_BASE_URL } from "./apiConfig";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const getReportsByCurso = async (professorId, cursoId, managementId, quarter) => {
  try {
    console.log('Iniciando descarga de reporte con parámetros:', {
      professorId,
      cursoId,
      managementId,
      quarter
    });

    const url = `${API_BASE_URL}/tasks/course/${cursoId}/professor/${professorId}/management/${managementId}`;

    const response = await fetch(url);

    console.log('Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      throw new Error(`Error al obtener el reporte: ${response.status}`);
    }

    const data = await response.json();
    console.log('Datos recibidos:', data);

    if (!data.ok) {
      throw new Error(data.error || 'Error al obtener el reporte');
    }

    const { reports } = data.data;
    if (!reports || !Array.isArray(reports)) {
      throw new Error('No se recibieron los reportes correctamente');
    }

    // Si es un trimestre específico
    if (quarter) {
      const quarterReport = reports.find(r => r.quarter === Number(quarter));
      if (!quarterReport) {
        throw new Error(`No se encontró el reporte para el trimestre ${quarter}`);
      }

      // Descargar el archivo usando expo-file-system
      const filepath = `${FileSystem.documentDirectory}${quarterReport.fileName}`;
      const downloadResult = await FileSystem.downloadAsync(quarterReport.url, filepath);

      if (Platform.OS === 'android') {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Descargar Reporte',
        });
      } else {
        await Sharing.shareAsync(downloadResult.uri);
      }

      return { ok: true };
    }

    // Si son todos los trimestres
    for (const report of reports) {
      if (report.url) {
        const filepath = `${FileSystem.documentDirectory}${report.fileName}`;
        const downloadResult = await FileSystem.downloadAsync(report.url, filepath);

        if (Platform.OS === 'android') {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Descargar Reporte',
          });
        } else {
          await Sharing.shareAsync(downloadResult.uri);
        }
      }
    }

    return { ok: true };
  } catch (error) {
    console.error('Error en getReportsByCurso:', error);
    throw error;
  }
};