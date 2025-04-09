import { useState, useEffect, useMemo, useCallback } from 'react';
import { Image, StyleSheet, Alert, TouchableOpacity, useColorScheme, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { InputRate } from '../../components/InputRate';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGlobalState } from '../../services/UserContext';
import { API_BASE_URL } from "../../services/apiConfig";
import { getActivityByIdwithassignments, updateActivity } from '../../services/activity';

const StudentListItem = ({ student, taskId, colorScheme, navigateToTaskDetail }) => {
  const colors = {
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    subtext: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    background: colorScheme === 'dark' ? '#1E1E1E' : '#F5F5F5',
    border: colorScheme === 'dark' ? '#2C2C2E' : '#E0E0E0',
    icon: colorScheme === 'dark' ? '#FFFFFF' : '#17A2B8',
    success: '#4CAF50',
    pending: '#FF9800'
  };

  // Determinar si ha entregado la tarea
  const hasSubmitted = student.status === 1;

  return (
    <ThemedView style={[
      styles.studentListItem,
      hasSubmitted ? styles.submittedItem : styles.pendingItem
    ]}>
      <View style={styles.studentInfo}>
        <View style={styles.nameRow}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: hasSubmitted ? colors.success : colors.pending }
          ]} />
          <ThemedText style={styles.studentName}>{student.nombre}</ThemedText>
        </View>
        <ThemedText style={[
          styles.submissionStatus, 
          { color: hasSubmitted ? colors.success : colors.pending }
        ]}>
          {hasSubmitted ? 'Entregada' : 'Pendiente'}
        </ThemedText>
      </View>
      <TouchableOpacity 
        onPress={() => navigateToTaskDetail(student.id, taskId)}
        style={styles.iconButton}
      >
        <Ionicons 
          name={hasSubmitted ? "document-text" : "document-text-outline"} 
          size={24} 
          color={colors.icon} 
        />
      </TouchableOpacity>
    </ThemedView>
  );
};

export default function TasksScreenCalification() {
  const colorScheme = useColorScheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { idTask } = route.params;
  
  const [taskData, setTaskData] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [changeCount, setChangeCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { globalState } = useGlobalState();
  const { materiaName } = globalState;

  // Colores dinámicos basados en el tema
  const colors = useMemo(() => ({
    background: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    secondaryText: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    boxBackground: colorScheme === 'dark' ? '#2A4A54' : '#17A2B8',
    saveIcon: colorScheme === 'dark' ? '#FFFFFF' : '#007AFF',
    border: colorScheme === 'dark' ? '#3A5A64' : '#E0E0E0',
    loading: colorScheme === 'dark' ? '#FFFFFF' : '#007AFF',
  }), [colorScheme]);

  const options = useMemo(() => ({
    '1': 'Ser',
    '2': 'Saber',
    '3': 'Hacer',
    '4': 'Decidir'
  }), []);

  // Cargar datos de la tarea y estudiantes
  useEffect(() => {
    const loadTaskData = async () => {
      try {
        setIsLoading(true);
        const response = await getActivityByIdwithassignments(idTask);
        
        if (response.ok && response.task) {
          setTaskData(response.task);
          
          // Transformar los assignments a el formato de estudiantes
          const estudiantesTransformados = response.task.assignments.map(assignment => ({
            id: assignment.student_id,
            nombre: `${assignment.student.person.name} ${assignment.student.person.lastname} ${assignment.student.person.second_lastname || ''}`,
            calificacion: (assignment.qualification || "0").trim(),
            rude: assignment.student.rude,
            status: assignment.status
          }));
          
          setEstudiantes(estudiantesTransformados);
        } else {
          Alert.alert('Error', 'No se pudo cargar la información de la tarea');
        }
      } catch (error) {
        console.error('Error al cargar la tarea:', error);
        Alert.alert('Error', 'Ocurrió un error al cargar la información');
      } finally {
        setIsLoading(false);
      }
    };

    loadTaskData();
  }, [idTask]);

  const handleGradeChange = useCallback((index, newGrade) => {
    setEstudiantes(prevEstudiantes => {
      const updatedEstudiantes = [...prevEstudiantes];
      updatedEstudiantes[index].calificacion = newGrade.trim();
      return updatedEstudiantes;
    });
    setChangeCount(prev => prev + 1);
  }, []);

  const saveCalificaciones = async () => {
    setIsSaving(true);
    try {
      // Transformar el array de estudiantes al formato requerido
      const studentsData = estudiantes.map(estudiante => ({
        student_id: estudiante.id,
        qualification: estudiante.calificacion
      }));

      
      const response = await updateActivity(idTask, studentsData);
      console.log(response);
      if (!response.ok) throw new Error('Error al guardar'); 
      
      setChangeCount(0);
      return true;
    } catch (error) {
      console.error('Error al guardar calificaciones:', error);
      Alert.alert(
        'Error',
        'No se pudieron guardar las calificaciones. ¿Deseas intentar nuevamente?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reintentar', onPress: saveCalificaciones }
        ]
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (await saveCalificaciones()) {
      Alert.alert('Éxito', 'Calificaciones actualizadas correctamente');
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (changeCount > 0) {
        e.preventDefault();
        Alert.alert(
          'Cambios sin guardar',
          '¿Deseas guardar los cambios antes de salir?',
          [
            { 
              text: 'Descartar',
              style: 'destructive',
              onPress: () => navigation.dispatch(e.data.action)
            },
            { 
              text: 'Guardar',
              style: 'default',
              onPress: async () => {
                if (await saveCalificaciones()) {
                  navigation.dispatch(e.data.action);
                }
              }
            },
            {
              text: 'Cancelar',
              style: 'cancel'
            }
          ]
        );
      }
    });
    return unsubscribe;
  }, [changeCount, navigation]);

  const navigateToTaskDetail = (studentId, taskId) => {
    navigation.navigate('taskDetailProf', { studentId, taskId });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.loading} />
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: colors.background, dark: colors.background }}
      headerImage={
        <Image
          source={require('../../assets/images/calificaciones.jpg')}
          style={styles.reactLogo}
        />
      }>
      <View style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <View style={styles.titleSection}>
            <ThemedText type="title" style={{ color: colors.text }}>
              Calificaciones
            </ThemedText>
            <View style={styles.subtitleRow}>
              <ThemedText type="default" style={[styles.materiaName, { color: colors.secondaryText }]}>
                {materiaName}
              </ThemedText>
              <ThemedText type="default" style={[styles.gestionText, { color: colors.secondaryText }]}>
                Gestión {globalState.management.management}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity 
            onPress={handleSave}
            style={[styles.saveButton, { opacity: isSaving ? 0.6 : 1 }]}
            disabled={isSaving || changeCount === 0}
          >
            <Ionicons 
              name={isSaving ? "hourglass-outline" : "save-outline"} 
              size={24} 
              color={colors.saveIcon}
            />
          </TouchableOpacity>
        </ThemedView>

        {taskData && (
          <ThemedView style={[styles.box, { backgroundColor: colors.boxBackground }]}>
            <ThemedText type="default" style={styles.description}>
              {taskData.description}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.tipo}>
              Tipo: {options[taskData.dimension_id]}
            </ThemedText>
          </ThemedView>
        )}

        <View style={styles.studentsList}>
          {taskData && taskData.type === 0 ? (
            estudiantes.map((estudiante) => (
              <StudentListItem
                key={estudiante.id}
                student={estudiante}
                taskId={idTask}
                colorScheme={colorScheme}
                navigateToTaskDetail={navigateToTaskDetail}
              />
            ))
          ) : (
            estudiantes.map((estudiante, index) => (
              <InputRate
                key={estudiante.id}
                name={estudiante.nombre}
                grade={estudiante.calificacion}
                onGradeChange={(newGrade) => handleGradeChange(index, newGrade)}
                style={styles.studentItem}
                theme={colorScheme}
              />
            ))
          )}
        </View>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  titleSection: {
    gap: 4,
  },
  subtitleRow: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  materiaName: {
    fontSize: 16,
  },
  gestionText: {
    fontSize: 16,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  box: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  description: {
    marginBottom: 8,
    lineHeight: 20,
  },
  tipo: {
    fontWeight: '600',
  },
  saveButton: {
    padding: 0,
  },
  studentsList: {
    gap: 12,
  },
  studentItem: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  studentRude: {
    fontSize: 12,
    marginTop: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  submittedItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  pendingItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  submissionStatus: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  }
});
