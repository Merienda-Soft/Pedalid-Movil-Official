import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Image, useColorScheme, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Linking, RefreshControl } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { useGlobalState } from '../../services/UserContext';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { uploadContent, getContent, deleteContent } from '../../services/content';

export default function SupportMaterialScreen() {
  const colorScheme = useColorScheme();
  const { globalState } = useGlobalState();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allFiles, setAllFiles] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Definir colores basados en el tema
  const theme = {
    background: colorScheme === 'dark' ? '#1D3D47' : '#F5F5F5',
    surface: colorScheme === 'dark' ? '#1D3D47' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#2A4A54' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    subtext: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    border: colorScheme === 'dark' ? '#3A5A64' : '#E0E0E0',
    primary: '#17A2B8',
    error: '#FF3B30',
  };

  const uploadFileToFirebase = async (file) => {
    try {
      // Crear una referencia única para el archivo en Firebase
      const fileName = `courses/${globalState.cursoid}/subjects/${globalState.materiaid}/${Date.now()}_${file.name}`;
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

  // Función para refrescar la lista
  const handleRefresh = async () => {
    console.log('Refrescando lista de archivos...');
    await loadContent();
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true
      });

      if (result.canceled) {
        return;
      }

      console.log('Archivos seleccionados:', result.assets);

      setIsUploading(true);
      setUploadProgress(0);

      const totalFiles = result.assets.length;
      const successfulUploads = [];
      const failedUploads = [];

      // Subir cada archivo a Firebase y registrarlo en el endpoint
      for (let i = 0; i < result.assets.length; i++) {
        try {
          const file = result.assets[i];
          console.log(`Procesando archivo ${i + 1}/${totalFiles}:`, file.name);
          
          // 1. Subir a Firebase
          console.log('Iniciando subida a Firebase...');
          const uploadedFile = await uploadFileToFirebase(file);
          console.log('Archivo subido a Firebase:', uploadedFile);
          
          // Verificar que tenemos todos los datos necesarios
          if (!globalState.cursoid || !globalState.materiaid || !globalState.management?.id) {
            console.error('Datos faltantes:', { 
              cursoid: globalState.cursoid, 
              materiaid: globalState.materiaid, 
              managementId: globalState.management?.id 
            });
            throw new Error('Faltan datos necesarios para subir el archivo');
          }
          
          // 2. Registrar en el endpoint individualmente
          console.log('Datos a enviar al endpoint:', {
            courseId: globalState.cursoid,
            subjectId: globalState.materiaid,
            managementId: globalState.management.id,
            file: {
              name: uploadedFile.name,
              url: uploadedFile.url
            }
          });

          const response = await uploadContent(
            Number(globalState.cursoid),
            Number(globalState.materiaid),
            Number(globalState.management.id),
            uploadedFile
          );

          console.log('Respuesta del endpoint:', response);

          if (response.ok) {
            console.log('Archivo registrado exitosamente:', response.data);
            successfulUploads.push({
              ...uploadedFile,
              id: response.data.id
            });
          } else {
            console.error('Error al registrar archivo:', response.error);
            failedUploads.push({
              name: file.name,
              error: response.error
            });
          }

          setUploadProgress(((i + 1) / totalFiles) * 100);

        } catch (error) {
          console.error(`Error al procesar archivo ${result.assets[i].name}:`, error);
          failedUploads.push({
            name: result.assets[i].name,
            error: error.message
          });
        }
      }

      console.log('Resumen de subida:', {
        exitosos: successfulUploads,
        fallidos: failedUploads
      });

      // Actualizar la lista de archivos con los que se subieron exitosamente
      if (successfulUploads.length > 0) {
        setUploadedFiles(prev => [...prev, ...successfulUploads]);
      }

      // Mostrar mensaje apropiado según el resultado
      if (failedUploads.length === 0) {
        Alert.alert('Éxito', 'Todos los archivos fueron subidos correctamente');
        // Refrescar la lista después de subir exitosamente
        await handleRefresh();
      } else if (successfulUploads.length === 0) {
        Alert.alert('Error', `No se pudo subir ningún archivo\n\nDetalles:\n${failedUploads.map(f => `${f.name}: ${f.error}`).join('\n')}`);
      } else {
        Alert.alert(
          'Advertencia',
          `Se subieron ${successfulUploads.length} archivos correctamente.\n\nFallaron ${failedUploads.length} archivos:\n${failedUploads.map(f => `${f.name}: ${f.error}`).join('\n')}`,
          [
            { 
              text: 'OK',
              onPress: () => handleRefresh() // Refrescar la lista incluso con subidas parciales
            }
          ]
        );
      }

    } catch (error) {
      console.error('Error general al subir archivos:', error);
      Alert.alert('Error', `Ocurrió un error al procesar los archivos: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Función para obtener el nombre del archivo desde la URL
  const getFileNameFromUrl = (url) => {
    try {
      // Limpiar la URL de comillas y espacios
      const cleanUrl = url.replace(/['"{}]/g, '').trim();
      const urlParts = cleanUrl.split('/');
      return urlParts[urlParts.length - 1] || 'Archivo sin nombre';
    } catch (error) {
      console.error('Error al obtener nombre del archivo:', error);
      return 'Archivo sin nombre';
    } 
  };

  // Función para parsear las URLs del campo file
  const parseFileUrls = (fileString) => {
    try {
      // Limpiar el string y dividir por comas
      const urls = fileString
        .split(',')
        .map(url => url.replace(/['"{}]/g, '').trim())
        .filter(url => url.length > 0);

      return urls.map(url => ({
        url: url,
        name: getFileNameFromUrl(url)
      }));
    } catch (error) {
      console.error('Error al parsear URLs:', error);
      return [];
    }
  };

  // Cargar archivos
  const loadContent = async () => {
    try {
      setIsLoading(true);
      const response = await getContent(
        globalState.cursoid,
        globalState.materiaid,
        globalState.management.id
      );
      
      if (response.ok && response.data) {
        // Ordenar por fecha de subida (más reciente primero)
        const sortedFiles = response.data.sort((a, b) => 
          new Date(b.submitted_at) - new Date(a.submitted_at)
        );
        
        console.log('Archivos cargados:', sortedFiles);
        setAllFiles(sortedFiles);
      }
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      Alert.alert('Error', 'No se pudieron cargar los archivos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [globalState.cursoid, globalState.materiaid, globalState.management.id]);

  // Obtener extensiones únicas disponibles
  const availableFilters = useMemo(() => {
    const extensions = new Set(['all']);
    allFiles.forEach(fileData => {
      const ext = fileData.file.name.split('.').pop()?.toLowerCase();
      if (ext) extensions.add(ext);
    });
    return Array.from(extensions);
  }, [allFiles]);

  // Filtrar archivos por extensión
  const filteredFiles = useMemo(() => {
    if (selectedFilter === 'all') return allFiles;
    return allFiles.filter(fileData => {
      const ext = fileData.file.name.split('.').pop()?.toLowerCase();
      return ext === selectedFilter;
    });
  }, [allFiles, selectedFilter]);

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para eliminar archivo de Firebase
  const deleteFileFromFirebase = async (fileUrl) => {
    try {
      // Obtener la ruta del archivo desde la URL
      const fileRef = ref(storage, decodeURIComponent(fileUrl.split('/o/')[1].split('?')[0]));
      await deleteObject(fileRef);
      console.log('Archivo eliminado de Firebase');
      return true;
    } catch (error) {
      console.error('Error al eliminar archivo de Firebase:', error);
      throw error;
    }
  };

  // Función para manejar la eliminación de archivos
  const handleDeleteFile = async (fileData) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este archivo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);

              // 1. Primero intentamos eliminar de Firebase
              try {
                await deleteFileFromFirebase(fileData.file.url);
              } catch (firebaseError) {
                console.error('Error al eliminar de Firebase:', firebaseError);
                // Continuamos con la eliminación del backend incluso si falla Firebase
              }

              // 2. Eliminar del backend
              const response = await deleteContent(fileData.id);
              
              if (response.ok) {
                // Actualizar la lista de archivos
                await handleRefresh();
                Alert.alert('Éxito', 'Archivo eliminado correctamente');
              } else {
                throw new Error(response.error || 'Error al eliminar el archivo');
              }
            } catch (error) {
              console.error('Error al eliminar archivo:', error);
              Alert.alert('Error', 'No se pudo eliminar el archivo completamente');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('../../assets/images/material.png')}
          style={styles.headerImage}
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
    >
      <ThemedView style={styles.container}>
        {/* Cabecera */}
        <View style={styles.titleContainer}>
          {/* Primera fila: solo el título */}
          <ThemedText type="title" style={styles.title}>
            Material de Apoyo
          </ThemedText>
          
          {/* Segunda fila: materia y gestión */}
          <View style={styles.subtitleRow}>
            <ThemedText style={styles.subtitle}>
              {globalState.materiaName}
            </ThemedText>
            <ThemedText style={styles.managementText}>
              Gestión {globalState.management?.management}
            </ThemedText>
          </View>
        </View>

        {/* Filtros */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {availableFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: selectedFilter === filter ? theme.primary : 'transparent',
                  borderColor: theme.primary
                }
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <ThemedText style={[
                styles.filterText,
                { color: selectedFilter === filter ? '#FFFFFF' : theme.primary }
              ]}>
                {filter === 'all' ? 'Todos' : `.${filter}`}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Botón de subida */}
        <TouchableOpacity 
          style={[styles.uploadButton, { 
            backgroundColor: theme.primary,
            opacity: isUploading ? 0.7 : 1 
          }]}
          onPress={handleUploadFile}
          disabled={isUploading}
        >
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <ThemedText style={styles.uploadButtonText}>
                Subiendo... {Math.round(uploadProgress)}%
              </ThemedText>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={24} color="white" />
              <ThemedText style={styles.uploadButtonText}>Subir Material</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Lista de archivos */}
        <View style={[styles.filesContainer, { backgroundColor: theme.card }]}>
          <ThemedText style={styles.sectionTitle}>Archivos Subidos</ThemedText>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : filteredFiles.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
              No hay archivos {selectedFilter !== 'all' ? `de tipo .${selectedFilter}` : ''}
            </ThemedText>
          ) : (
            filteredFiles.map((fileData) => (
              <View 
                key={fileData.id}
                style={[styles.fileItem, { borderColor: theme.border }]}
              >
                <TouchableOpacity 
                  style={styles.fileInfo}
                  onPress={() => Linking.openURL(fileData.file.url)}
                >
                  <Ionicons 
                    name={getFileIcon(fileData.file.name)} 
                    size={24} 
                    color={theme.primary} 
                  />
                  <View style={styles.fileDetails}>
                    <ThemedText style={styles.fileName} numberOfLines={1}>
                      {fileData.file.name}
                    </ThemedText>
                    <ThemedText style={[styles.fileDate, { color: theme.subtext }]}>
                      {formatDate(fileData.submitted_at)}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteFile(fileData)}
                >
                  <Ionicons 
                    name="trash-outline" 
                    size={20} 
                    color={theme.error}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

// Función auxiliar para obtener el icono según el tipo de archivo
const getFileIcon = (fileName) => {
  if (!fileName) return 'document-attach-outline';
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'document-text-outline';
    case 'mp4':
    case 'mov':
    case 'avi':
      return 'videocam-outline';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'image-outline';
    case 'doc':
    case 'docx':
      return 'document-outline';
    case 'xls':
    case 'xlsx':
      return 'grid-outline';
    default:
      return 'document-attach-outline';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  titleContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    flex: 1,
  },
  managementText: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filesContainer: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileName: {
    fontSize: 14,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileDetails: {
    flex: 1,
    gap: 4,
  },
  fileDate: {
    fontSize: 12,
  },
});
