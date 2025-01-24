import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Image, StyleSheet, View, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { InputFilter } from '../../components/InputFilter';
import { ButtonLink } from '../../components/ButtonLink';
import { useNavigation  } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useGlobalState } from '../../services/UserContext';
import { useFocusEffect } from '@react-navigation/native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { deleteActivity, getActivities } from '../../services/activity';
import { handleError } from '../../utils/errorHandler';

export default function TasksScreen() {

  const { showActionSheetWithOptions } = useActionSheet();

  const navigation = useNavigation();
  const route = useRoute();
  const [searchValue, setSearchValue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const { materiaid, cursoid, teacherid, materiaName } = route.params;
  const { clearGlobalState } = useGlobalState();

  const validateParams = () => {
    if (!materiaid || !cursoid || !teacherid) {
      handleError(new Error('Faltan parámetros para realizar la acción'));
      return false;
    }
    return true;
  };

  const fetchTasks = async () => {
    if (!validateParams()) return;

    setIsLoading(true);
    try {
      const taskData = await getActivities(materiaid, cursoid, teacherid);
      setTasks(taskData);
    } catch (error) {
      handleError(error, 'No hay tareas registradas para esta materia');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();

      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (e.data.action.type === 'GO_BACK') {
          clearGlobalState();
        }
      });

      return () => {
        unsubscribe();
        setTasks([]); // Clean up state on unmount
      };
    }, [materiaid, cursoid, teacherid])
  );

  useEffect(() => {
    fetchTasks();
  }, [materiaid, cursoid, teacherid]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Modificar el filtrado de tareas para que sea por mes
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.fecha);
    const matchesSearch = task.name.toLowerCase().includes(searchValue.toLowerCase());
    const matchesMonth = taskDate.getMonth() === currentDate.getMonth() && 
                        taskDate.getFullYear() === currentDate.getFullYear();
    return matchesSearch && matchesMonth;
  });

  const deleteTask = async (taskid) => {
    const response = await deleteActivity(taskid);
    if (!response.ok) {
      Alert.alert('Error', 'No se pudo eliminar la tarea.');
      return;
    }

    navigation.replace("curso", {screen: 'index', params: {
      materiaid: materiaid,
      cursoid: cursoid,
      teacherid: teacherid
    }});

    Alert.alert('Exito', 'Tarea eliminada con éxito');
  }

  const openActionSheet = (task) => {
    const options = ['Calificar', 'Editar', 'Eliminar'];
    const cancelButtonIndex = 3;
    const destructiveButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: `Opciones de "${task.name}"`,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          // Navegar a la pantalla de calificaciones
          navigation.navigate('calificaciones', { screen: 'index', params: { students: task.estudiantes, allTask: task } });
        } else if (buttonIndex === 1) {
          // Acción de Editar
          navigation.navigate('calificaciones', { screen: 'editTask', params: { allTask: task } });

        } else if (buttonIndex === 2) {
          Alert.alert(
            'Emilinacion',
            `¿Deseas eliminar "${task.name}"?`,
            [
              { text: 'No', style: 'cancel'},
              { text: 'Sí', onPress: () => {
                  deleteTask(task._id);
                  
              }},
            ]
          );
        }
      }
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTasks();
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('../../assets/images/task.jpg')}
          style={styles.reactLogo}
        />
      }
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Tareas</ThemedText>
        <ThemedText type="default">({materiaName})</ThemedText>
      </ThemedView>
      
      <InputFilter
        value={searchValue}
        onChangeText={setSearchValue}
        onPress={() => {}}
        type="search"
        placeholder="Buscar..."
      />

      {/* Nuevo componente de navegación por mes */}
      <View style={styles.monthNavigator}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <Ionicons name="chevron-back" size={24} color="#666" />
        </TouchableOpacity>
        
        <ThemedText type="subtitle">
          {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        </ThemedText>
        
        <TouchableOpacity onPress={handleNextMonth}>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

    {filteredTasks.map((task) => {
      const date = new Date(task.fecha);
      const formattedDate = `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')}`;

      return (
        <ButtonLink
          key={task._id}
          text={`${formattedDate}     ${task.name}     ponderacion ${task.ponderacion}%`}
          modo="large"
          onPress={() => openActionSheet(task)} 
          color="secondary"
          style={{ marginVertical: 0 }}
        />
      );
    })}


    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
});
