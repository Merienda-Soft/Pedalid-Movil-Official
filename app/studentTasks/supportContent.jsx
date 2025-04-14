import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Image, useColorScheme, TouchableOpacity, ActivityIndicator, ScrollView, Linking, RefreshControl, Alert } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { useGlobalState } from '../../services/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { getContent } from '../../services/content';
import { useRoute } from "@react-navigation/native";

export default function SupportContentScreen() {
  const colorScheme = useColorScheme();
  const { globalState } = useGlobalState();
  const route = useRoute();
  const [allFiles, setAllFiles] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Obtener parámetros de la ruta
  const { courseId, subjectId, managementId, materiaName } = route.params;

  // Definir colores basados en el tema
  const theme = {
    background: colorScheme === 'dark' ? '#1D3D47' : '#F5F5F5',
    surface: colorScheme === 'dark' ? '#1D3D47' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#2A4A54' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    subtext: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    border: colorScheme === 'dark' ? '#3A5A64' : '#E0E0E0',
    primary: '#17A2B8',
  };

  // Cargar archivos
  const loadContent = async () => {
    try {
      setIsLoading(true);
      console.log('Cargando archivos con:', {
        courseId,
        subjectId,
        managementId
      });

      const response = await getContent(
        courseId,
        subjectId,
        managementId
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

  // Función para refrescar la lista
  const handleRefresh = async () => {
    console.log('Refrescando lista de archivos...');
    await loadContent();
  };

  useEffect(() => {
    if (courseId && subjectId && managementId) {
      loadContent();
    }
  }, [courseId, subjectId, managementId]);

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
              {materiaName}
            </ThemedText>
            <ThemedText style={styles.managementText}>
              Gestión {route.params.managementYear}
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

        {/* Lista de archivos */}
        <View style={[styles.filesContainer, { backgroundColor: theme.card }]}>
          <ThemedText style={styles.sectionTitle}>Archivos Disponibles</ThemedText>
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
