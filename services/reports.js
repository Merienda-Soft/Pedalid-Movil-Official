import { API_BASE_URL } from "./apiConfig";
import { createError, ERROR_TYPES } from "../utils/errorHandler";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const getReportsByCurso = async (professorId, cursoId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/reports?professorId=${professorId}&cursoId=${cursoId}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw createError(ERROR_TYPES.SERVER, 'Error al obtener el reporte');
    }

    const filename = `reportes_${cursoId}_${new Date().getFullYear()}.zip`;
    const fileUri = FileSystem.documentDirectory + filename;

    const downloadResumable = FileSystem.createDownloadResumable(
      response.url,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        // You can use this progress value to show download progress
      }
    );

    const { uri } = await downloadResumable.downloadAsync();
    
    if (Platform.OS === 'android') {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        await Sharing.shareAsync(uri);
      }
    } else {
      await Sharing.shareAsync(uri);
    }

    return { ok: true, message: 'Reporte descargado exitosamente' };
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
};