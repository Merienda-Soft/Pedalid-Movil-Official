import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useColorScheme, TouchableOpacity, ActivityIndicator, Image, ScrollView, Linking, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useRoute } from '@react-navigation/native';
import { getTaskByIdwithassignments, updateActivity } from '../../services/activity';
import { handleError } from '../../utils/errorHandler';
import ParallaxScrollView from '../../components/ParallaxScrollView';

export default function TaskDetailProf() {
  const colorScheme = useColorScheme();
  const route = useRoute();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qualification, setQualification] = useState('');
  const [saving, setSaving] = useState(false);
  const [submittedFiles, setSubmittedFiles] = useState([]);
  
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
    evaluated: '#9C27B0',
  };

  useEffect(() => {
    fetchTaskDetails();
  }, []);

  const fetchTaskDetails = async () => {
    try {
      const response = await getTaskByIdwithassignments(taskId, studentId);
      if (response.ok && response.data) {
        setTask(response.data);
        const assignment = response.data.assignments?.[0];
        if (assignment) {
          setQualification(assignment.qualification || '');
          if (assignment.files) {
            setSubmittedFiles(assignment.files);
          }
        }
      } else {
        handleError(new Error('No se pudo cargar la tarea'));
      }
    } catch (error) {
      handleError(error, 'Error al cargar los detalles de la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFile = async (fileUrl) => {
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        handleError(new Error(`No se puede abrir la URL: ${fileUrl}`));
      }
    } catch (error) {
      handleError(error, 'Error al abrir el archivo');
    }
  };

  const handleSaveQualification = async () => {
    // Si está evaluada (status 2), mostrar confirmación primero
    if (assignment?.status === 2) {
      Alert.alert(
        'Reevaluar Tarea',
        '¿Desea reevaluar la nota de esta tarea?',
        [
          { 
            text: 'No', 
            style: 'cancel'
          },
          {
            text: 'Sí',
            onPress: async () => {
              await saveQualification();
            }
          }
        ]
      );
    } else {
      // Si no está evaluada, guardar directamente
      await saveQualification();
    }
  };

  const saveQualification = async () => {
    try {
      setSaving(true);
      
      const studentsData = [
        {
          student_id: studentId,
          qualification: qualification
        }
      ];
      
      const response = await updateActivity(taskId, studentsData);
      
      if (response.ok) {
        Alert.alert('Éxito', 'Calificación guardada correctamente');
      } else {
        throw new Error('Error al guardar la calificación');
      }
    } catch (error) {
      handleError(error, 'Error al guardar la calificación');
    } finally {
      setSaving(false);
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
  const isSubmitted = assignment?.status === 1;
  const isLate = new Date(task?.end_date) < new Date();
  const studentName = assignment?.student?.person 
    ? `${assignment.student.person.name} ${assignment.student.person.lastname} ${assignment.student.person.second_lastname || ''}` 
    : 'Estudiante';

  const getSubmissionStatus = (status) => {
    switch (status) {
      case 2:
        return {
          text: 'Evaluada',
          color: theme.evaluated || '#9C27B0'
        };
      case 1:
        return {
          text: 'Entregada',
          color: theme.success
        };
      default:
        return {
          text: 'No entregada',
          color: theme.error
        };
    }
  };

  const status = getSubmissionStatus(assignment?.status);

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
            {/* Información del estudiante */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <ThemedText style={styles.sectionTitle}>Información del Estudiante</ThemedText>
              <ThemedText style={[styles.studentName, { color: theme.text }]}>
                {studentName}
              </ThemedText>
              <ThemedText style={[styles.submissionStatus, { 
                color: status.color,
                marginTop: 8 
              }]}>
                Estado: {status.text}
              </ThemedText>
            </View>

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
              </View>
            </View>

            {/* Sección de calificación */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <ThemedText style={styles.sectionTitle}>Calificación</ThemedText>
              
              <View style={styles.qualificationContainer}>
                <TextInput
                  style={[styles.qualificationInput, { 
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#F5F5F5'
                  }]}
                  value={qualification}
                  onChangeText={setQualification}
                  placeholder="Ingrese calificación"
                  placeholderTextColor={theme.subtext}
                  keyboardType="numeric"
                  maxLength={3}
                />
                
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: theme.primary }]}
                  onPress={handleSaveQualification}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <ThemedText style={styles.saveButtonText}>
                      {assignment?.status === 2 ? 'Reevaluar' : 'Guardar'}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Archivos entregados (si hay) */}
            {(assignment?.status === 1 || assignment?.status === 2) && submittedFiles.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <ThemedText style={styles.sectionTitle}>Archivos Entregados</ThemedText>
                
                <View style={[styles.filesListContainer, { 
                  backgroundColor: theme.surface === '#121212' ? '#1A1A1A' : '#F5F5F5',
                  borderWidth: 1,
                  borderColor: theme.border,
                  marginTop: 8,
                  borderRadius: 8,
                  padding: 8
                }]}>
                  {submittedFiles.map((file, index) => (
                    <TouchableOpacity 
                      key={file.url} 
                      style={[styles.fileItem, { 
                        backgroundColor: theme.surface === '#121212' ? '#2C2C2E' : '#FFFFFF',
                        marginBottom: 8,
                        borderRadius: 8
                      }]}
                      onPress={() => handleOpenFile(file.url)}
                    >
                      <View style={styles.fileInfo}>
                        <Ionicons 
                          name="document-outline"
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
                        </View>
                      </View>
                      <Ionicons 
                        name="open-outline" 
                        size={20} 
                        color={theme.primary} 
                        style={{ marginRight: 8 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
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
    marginBottom: 12,
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
  studentName: {
    fontSize: 18,
    fontWeight: '500',
  },
  submissionStatus: {
    fontSize: 16,
    fontWeight: '500',
  },
  qualificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qualificationInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filesListContainer: {
    width: '100%',
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
});
