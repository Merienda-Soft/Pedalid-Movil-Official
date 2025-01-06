import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Image, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRoute } from '@react-navigation/native';
import { getActivities } from '@/services/activity';
import { useNavigation } from 'expo-router';

export default function reportsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { materiaid, cursoid, teacherid, materiaName, cursoName } = route.params;
  const [actividades, setActividades] = useState([]);

  const fetchTasks = async () => {
    if (!materiaid || !cursoid || !teacherid) {
      Alert.alert('Error', 'Faltan parámetros para realizar la acción.');
      return;
    }
    try {
      const taskData = await getActivities(materiaid, cursoid, teacherid);
      setActividades(taskData);
    } catch (error) {
      Alert.alert('Aviso', 'No tienes creada ninguna tarea para esta materia');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [materiaid, cursoid, teacherid]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );
  
  const color = useThemeColor({}, 'text');

  const estudiantesUnicos = {};
  actividades.forEach(tarea => {
    tarea.estudiantes.forEach(est => {
      if (!estudiantesUnicos[est.estudianteId.name]) {
        estudiantesUnicos[est.estudianteId.name] = {};
      }
      estudiantesUnicos[est.estudianteId.name][tarea._id] = est.calificacion;
    });
  });

  const estudiantes = Object.keys(estudiantesUnicos);
  const tareas = actividades.map(tarea => tarea);

  
  const handleTareaPress = (tarea) => {
    const options = { '1': 'Ser', '2': 'Saber', '3': 'Hacer', '4': 'Decidir' };
    Alert.alert(
      `Detalles de ${tarea.name}`,
      `Descripción: ${tarea.description}\nPonderación: ${tarea.ponderacion}\nTipo: ${options[tarea.tipo]}`,
      [
        {
          text: "Cerrar",
          style: "cancel",
        },
        {
          text: "Ir",
          onPress: () => navigation.navigate("calificaciones", 
            { screen: 'index', 
              params: { students: tarea.estudiantes, allTask: tarea } 
            }),
        },
      ]
    );
  };

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <Image
          source={require('@/assets/images/reportes.jpg')}
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Registro</ThemedText>
      </ThemedView>

      <ScrollView horizontal>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.title, { color }]}>Estudiantes</Text>
            {tareas.map((tarea, index) => (
              <TouchableOpacity key={index} onPress={() => handleTareaPress(tarea)}>
                <Text style={[styles.headerButton, { color }]}>{tarea.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {estudiantes.map((nombre, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              <Text style={[styles.name, { color }]}>{nombre}</Text>
              {tareas.map((tarea, colIndex) => (
                <Text key={colIndex} style={[styles.cell, { color }]}>
                  {estudiantesUnicos[nombre][tarea._id] ?? ''}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  table: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerButton: {
    fontWeight: 'bold',
    fontSize: 16,
    width: 100,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  cell: {
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  name: {
    fontSize: 16,
    width: 100,
    textAlign: 'start',
  },
});
