import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useColorScheme, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useRoute } from '@react-navigation/native';
import { getTaskByIdwithassignments, submitTaskFiles, cancelSubmitTaskFiles } from '../../services/activity';
import { handleError } from '../../utils/errorHandler';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import * as DocumentPicker from 'expo-document-picker';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function TaskDetailScreen() {
  const colorScheme = useColorScheme();
  const route = useRoute();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { studentId, taskId } = route.params;

  // Definir colores basados en el tema
  const theme = {
    background: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    surface: colorScheme === 'dark' ? '#121212' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    subtext: colorScheme === 'dark' ? '#8E8E93' : '#666666',
    border: colorScheme === 'dark' ? '#2C2C2E' : 'rgba(0,0,0,0.05)',
    primary: '#17A2B8',
    error: '#FF5252',
    success: '#4CAF50',
  };

  useEffect(() => {
    fetchTaskDetails();
  }, []);

  const fetchTaskDetails = async () => {
    try {
      const response = await getTaskByIdwithassignments(taskId, studentId);
      console.log("aqui",response);
      if (response.ok && response.data) {
        setTask(response.data);
      } else {
        handleError(new Error('No se pudo cargar la tarea'));
      }
    } catch (error) {
      handleError(error, 'Error al cargar los detalles de la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Todos los tipos de archivo
        multiple: true // Permite selección múltiple
      });

      if (result.canceled) {
        return;
      }

      // En las nuevas versiones de Expo, los archivos vienen en result.assets
      setSelectedFiles(prevFiles => [...prevFiles, ...result.assets]);
    } catch (error) {
      handleError(error, 'Error al seleccionar el archivo');
    }
  };

  const handleRemoveFile = (uri) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.uri !== uri));
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return 'document-attach-outline';
    if (mimeType.includes('image')) return 'image-outline';
    if (mimeType.includes('pdf')) return 'document-text-outline';
    if (mimeType.includes('word')) return 'document-outline';
    if (mimeType.includes('sheet')) return 'grid-outline';
    return 'document-attach-outline';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const uploadFileToFirebase = async (file) => {
    try {
      // Crear una referencia única para el archivo
      const fileName = `tasks/${taskId}/${studentId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // Obtener el blob del archivo
      const response = await fetch(file.uri);
      const blob = await response.blob();

      // Subir el archivo
      await uploadBytes(storageRef, blob);

      // Obtener la URL de descarga
      const downloadURL = await getDownloadURL(storageRef);

      return {
        name: file.name,
        url: downloadURL
      };
    } catch (error) {
      throw new Error(`Error al subir archivo: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // 1. Subir archivos a Firebase
      const totalFiles = selectedFiles.length;
      const uploadedFiles = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const uploadedFile = await uploadFileToFirebase(file);
        uploadedFiles.push(uploadedFile);
        
        // Actualizar progreso
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      // 2. Enviar información a tu API
      const response = await submitTaskFiles(taskId, studentId, uploadedFiles);
      
      if (response.ok) {
        // 3. Actualizar el estado de la tarea
        await fetchTaskDetails();
        
        // 4. Limpiar el estado
        setSelectedFiles([]);
        setUploadProgress(0);
      } else {
        throw new Error('Error al enviar la tarea');
      }

    } catch (error) {
      handleError(error, 'Error al enviar la tarea');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelSubmit = async () => {
    try {
      const response = await cancelSubmitTaskFiles(taskId, studentId);
      if (response.ok) {
        // Actualizar el estado de la tarea después de cancelar el envío
        await fetchTaskDetails();
      } else {
        throw new Error('Error al cancelar el envío de la tarea');
      }
    } catch (error) {
      handleError(error, 'Error al cancelar el envío de la tarea');
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.surface }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  const assignment = task?.assignments?.[0];
  const qualification = assignment?.qualification?.trim() || '-';
  const isSubmitted = assignment?.status === 1;
  const isLate = new Date(task?.end_date) < new Date();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* ParallaxScrollView para la imagen */}
      <View style={styles.headerParallax}>
        <ParallaxScrollView
          modo={2}
          headerBackgroundColor={{ light: '#A1CEDC', dark: '#000000' }}
          headerImage={
            <Image
              source={require('../../assets/images/task.jpg')}
              style={styles.headerImage}
            />
          }
          scrollEnabled={false}
          headerHeight={150}
        >
          <View style={{ height: 1 }} />
        </ParallaxScrollView>
      </View>

      {/* Contenido principal */}
      <View style={styles.mainContent}>
        <ScrollView style={styles.scrollContent}>
          {/* Encabezado de la tarea */}
          <View style={[styles.headerFixed, { backgroundColor: theme.surface }]}>
            <View style={styles.header}>
              <ThemedText style={styles.title}>{task?.name}</ThemedText>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { 
                  backgroundColor: isLate ? theme.error : theme.success 
                }]} />
                <ThemedText style={[styles.statusText, { 
                  color: isLate ? theme.error : theme.success 
                }]}>
                  {isLate ? 'Vencida' : 'En tiempo'}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Contenido scrolleable */}
          <View style={styles.contentContainer}>
            {/* Detalles de la tarea */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardSection}>
                <ThemedText style={styles.sectionTitle}>Descripción</ThemedText>
                <ThemedText style={[styles.description, { color: theme.subtext }]}>
                  {task?.description}
                </ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.cardSection}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
                  <ThemedText style={[styles.detailText, { color: theme.subtext }]}>
                    Fecha límite: {new Date(task?.end_date).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="star-outline" size={20} color={theme.subtext} />
                  <ThemedText style={[styles.detailText, { color: theme.subtext }]}>
                    Calificación: {qualification}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Sección de entrega */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <ThemedText style={styles.sectionTitle}>Entrega de tarea</ThemedText>
              
              {isSubmitted ? (
                <View style={styles.submittedContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                  <ThemedText style={[styles.submittedText, { color: theme.success }]}>
                    Tarea entregada
                  </ThemedText>
                  <TouchableOpacity 
                    style={[styles.cancelButton, { backgroundColor: theme.error }]}
                    onPress={handleCancelSubmit}
                  >
                    <ThemedText style={styles.cancelButtonText}>
                      Cancelar Envío
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity 
                    style={[styles.fileButton, { borderColor: theme.border }]}
                    onPress={handleSelectFile}
                  >
                    <Ionicons 
                      name="cloud-upload-outline" 
                      size={24} 
                      color={theme.primary} 
                    />
                    <ThemedText style={[styles.fileButtonText, { color: theme.primary }]}>
                      Seleccionar archivos
                    </ThemedText>
                  </TouchableOpacity>

                  {selectedFiles.length > 0 && (
                    <View style={styles.filesList}>
                      {selectedFiles.map((file, index) => (
                        <View 
                          key={file.uri} 
                          style={[styles.fileItem, { backgroundColor: theme.surface }]}
                        >
                          <View style={styles.fileInfo}>
                            <Ionicons 
                              name={getFileIcon(file.mimeType)}
                              size={24} 
                              color={theme.primary} 
                            />
                            <View style={styles.fileDetails}>
                              <ThemedText 
                                style={[styles.fileName, { color: theme.text }]} 
                                numberOfLines={1}
                              >
                                {file.name}
                              </ThemedText>
                              <ThemedText style={[styles.fileSize, { color: theme.subtext }]}>
                                {formatFileSize(file.size)}
                              </ThemedText>
                            </View>
                          </View>
                          <TouchableOpacity 
                            onPress={() => handleRemoveFile(file.uri)}
                            style={styles.removeButton}
                          >
                            <Ionicons 
                              name="close-circle" 
                              size={24} 
                              color={theme.error} 
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity 
                    style={[
                      styles.submitButton, 
                      { 
                        backgroundColor: selectedFiles.length > 0 ? theme.primary : theme.border,
                        opacity: isUploading ? 0.7 : selectedFiles.length > 0 ? 1 : 0.5 
                      }
                    ]}
                    onPress={handleSubmit}
                    disabled={selectedFiles.length === 0 || isUploading}
                  >
                    {isUploading ? (
                      <View style={styles.uploadingContainer}>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <ThemedText style={styles.submitButtonText}>
                          Subiendo... {Math.round(uploadProgress)}%
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={styles.submitButtonText}>
                        Enviar tarea
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerParallax: {
    height: 110,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  mainContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerFixed: {
    width: '100%',
    zIndex: 2,
    marginTop: 110, // Mismo valor que headerParallax height
    padding: 16,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cardSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 16,
  },
  fileButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submittedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  submittedText: {
    fontSize: 16,
    fontWeight: '500',
  },
  filesList: {
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 