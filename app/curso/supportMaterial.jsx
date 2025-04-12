import React, { useState } from 'react';
import { View, StyleSheet, Image, useColorScheme, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { useGlobalState } from '../../services/UserContext';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export default function SupportMaterialScreen() {
  const colorScheme = useColorScheme();
  const { globalState } = useGlobalState();
  const [uploadedFiles, setUploadedFiles] = useState([]);

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

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Todos los tipos de archivo
        copyToCacheDirectory: true,
        multiple: true
      });

      if (result.canceled) {
        return;
      }

      // Aquí iría la lógica para subir el archivo al servidor
      console.log('Archivos seleccionados:', result.assets);
      Alert.alert('Éxito', 'Archivo(s) seleccionado(s) correctamente');
      
      // Agregar los nuevos archivos a la lista
      setUploadedFiles(prev => [...prev, ...result.assets]);

    } catch (error) {
      console.error('Error al seleccionar archivo:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
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
    >
      <ThemedView style={styles.container}>
        {/* Cabecera */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <ThemedText type="title" style={styles.title}>Material de Apoyo</ThemedText>
            <ThemedText type="default" style={styles.managementText}>
              Gestión {globalState.management?.management}
            </ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            {globalState.materiaName}
          </ThemedText>
        </View>

        {/* Botón de subida */}
        <TouchableOpacity 
          style={[styles.uploadButton, { backgroundColor: theme.primary }]}
          onPress={handleUploadFile}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="white" />
          <ThemedText style={styles.uploadButtonText}>Subir Material</ThemedText>
        </TouchableOpacity>

        {/* Lista de archivos */}
        <View style={[styles.filesContainer, { backgroundColor: theme.card }]}>
          <ThemedText style={styles.sectionTitle}>Archivos Subidos</ThemedText>
          {uploadedFiles.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
              No hay archivos subidos
            </ThemedText>
          ) : (
            uploadedFiles.map((file, index) => (
              <View 
                key={index} 
                style={[styles.fileItem, { borderColor: theme.border }]}
              >
                <View style={styles.fileInfo}>
                  <Ionicons name="document-outline" size={24} color={theme.primary} />
                  <ThemedText style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </ThemedText>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => {
                    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  titleContainer: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  managementText: {
    fontSize: 14,
    opacity: 0.7,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
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
  },
});
