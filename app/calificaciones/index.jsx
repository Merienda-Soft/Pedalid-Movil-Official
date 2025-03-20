import { useState, useEffect, useMemo, useCallback } from 'react';
import { Image, StyleSheet, Alert, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { InputRate } from '../../components/InputRate';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGlobalState } from '../../services/UserContext';
import { API_BASE_URL } from "../../services/apiConfig";

export default function TasksScreenCalification() {
  const colorScheme = useColorScheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { students, allTask } = route.params;
  const [estudiantes, setStudents] = useState(students);
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
  }), [colorScheme]);

  const options = useMemo(() => ({
    '1': 'Ser',
    '2': 'Saber',
    '3': 'Hacer',
    '4': 'Decidir'
  }), []);

  const handleGradeChange = useCallback((index, newGrade) => {
    setStudents(prevStudents => {
      const updatedStudents = [...prevStudents];
      updatedStudents[index].calificacion = newGrade;
      
      // Actualizar en allTask
      const estudianteId = updatedStudents[index].estudianteId._id;
      const estudianteEnTarea = allTask.estudiantes.find(
        est => est.estudianteId.toString() === estudianteId
      );
      if (estudianteEnTarea) {
        estudianteEnTarea.calificacion = newGrade;
      }
      
      return updatedStudents;
    });
    setChangeCount(prev => prev + 1);
  }, [allTask.estudiantes]);

  const saveCalificaciones = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${allTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...allTask,
          estudiantes: estudiantes,
        }),
      });
      
      if (!response.ok) throw new Error('Error al guardar');
      
      setChangeCount(0);
      return true;
    } catch (error) {
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
                Gestión {globalState.management}
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

        <ThemedView style={[styles.box, { backgroundColor: colors.boxBackground }]}>
          <ThemedText type="default" style={styles.description}>
            {allTask.description}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.tipo}>
            Tipo: {options[allTask.tipo]}
          </ThemedText>
        </ThemedView>

        <View style={styles.studentsList}>
          {estudiantes.map((student, index) => (
            <InputRate
              key={student.estudianteId._id}
              name={student.estudianteId.name}
              grade={student.calificacion.toString()}
              onGradeChange={(newGrade) => handleGradeChange(index, newGrade)}
              style={styles.studentItem}
              theme={colorScheme}
            />
          ))}
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
  }
});
