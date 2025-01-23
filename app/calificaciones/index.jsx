import { useState, useEffect } from 'react';
import { Image, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { InputRate } from '@/components/InputRate';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGlobalState } from '@/services/UserContext';

import { API_BASE_URL } from "@/services/apiConfig";

export default function TasksScreenCalification() {
  const route = useRoute();
  const navigation = useNavigation();
  const { students , allTask } = route.params;
  const [estudiantes, setStudents] = useState(students);
  const [changeCount, setChangeCount] = useState(0);


  const { globalState } = useGlobalState();
  const {materiaName} = globalState

  const handleGradeChange = (index, newGrade) => {
    const updatedStudents = [...estudiantes];
    updatedStudents[index].calificacion = newGrade;
    setStudents(updatedStudents);

    // Buscar el estudiante en allTask y actualizar la calificación
    const updatedTask = {...allTask};  // asume que tienes acceso a "allTask"
    const estudianteId = updatedStudents[index].estudianteId._id;
    
    const estudianteEnTarea = updatedTask.estudiantes.find(est => est.estudianteId.toString() === estudianteId);
    if (estudianteEnTarea) {
      estudianteEnTarea.calificacion = newGrade;  // Actualizamos la calificación en allTask
    }
    
    setChangeCount((prevCount) => prevCount + 1);  // Incrementar contador de cambios
};


  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (changeCount > 0) {  // Solo si se han hecho cambios
        e.preventDefault();
        Alert.alert(
          'Cambios sin guardar',
          '¿Deseas guardar los cambios antes de salir?',
          [
            { text: 'No', style: 'cancel', onPress: () => navigation.dispatch(e.data.action) },
            { text: 'Sí', onPress: () => handleSaveAndGoBack(e) },
          ]
        );
      }
    });
    return unsubscribe;
  }, [changeCount, navigation]);

  const handleSaveAndGoBack = async (e) => {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${allTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...allTask,  // Enviamos todo el objeto allTask actualizado
          estudiantes: estudiantes,  // Enviamos la lista de estudiantes con las nuevas calificaciones
        }),
      });
      
      if (response.ok) {
        Alert.alert('Éxito', 'Calificaciones actualizadas.');
        navigation.dispatch(e.data.action);  // Navegamos hacia atrás
      } else {
        Alert.alert('Error', 'Error al guardar las calificaciones');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar las calificaciones.');
    }
  };
  
  const handleSave = async () => {
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
      
      if (response.ok) {
        Alert.alert('Éxito', 'Calificaciones actualizadas.');
        setChangeCount(0); // Reset changes counter
      } else {
        Alert.alert('Error', 'Error al guardar las calificaciones');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar las calificaciones.');
    }
  };

  const options = { '1': 'Ser', '2': 'Saber', '3': 'Hacer', '4': 'Decidir' };

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/calificaciones.jpg')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Calificaciones</ThemedText>
        <TouchableOpacity 
          onPress={handleSave}
          style={styles.saveButton}
        >
          <Ionicons name="save-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </ThemedView>
      <ThemedText type="default">({materiaName})</ThemedText>

      <ThemedView style={styles.box}>
        <ThemedText type="default">
          { allTask.description }
        </ThemedText>
        <ThemedText type="default">
          Tipo: { options[allTask.tipo] }
        </ThemedText>
      </ThemedView>

      {estudiantes.map((student, index) => (
        <InputRate
          key={index}
          name={student.estudianteId.name}
          grade={student.calificacion.toString()}
          onGradeChange={(newGrade) => handleGradeChange(index, newGrade)}
        />
      ))}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
  box: {
    backgroundColor: '#17A2B8',
    padding: 16,
    borderRadius: 10,
  },
  saveButton: {
    padding: 8,
  },
});
