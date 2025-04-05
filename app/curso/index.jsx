import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Image, StyleSheet, View, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { InputFilter } from '../../components/InputFilter';
import { ButtonLink } from '../../components/ButtonLink';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useGlobalState } from '../../services/UserContext';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { deleteActivity, getActivities } from '../../services/activity';
import { handleError } from '../../utils/errorHandler';

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const navigation = useNavigation();
  const route = useRoute();
  const { clearGlobalState } = useGlobalState();

  // Estados
  const [searchValue, setSearchValue] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Parámetros de ruta
  const { materiaid, cursoid, teacherid, materiaName, management } = route.params
  
  const [currentDate, setCurrentDate] = useState(() => {
    const currentMonth = new Date().getMonth();
    return new Date(management.management, currentMonth, 1);
  });
  
  // Constantes
  const monthNames = useMemo(() => [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ], []);

  // Colores dinámicos basados en el tema
  const colors = useMemo(() => ({
    background: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    secondaryText: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    border: colorScheme === 'dark' ? '#2A4A54' : '#E0E0E0',
    button: colorScheme === 'dark' ? '#2A4A54' : '#FFFFFF',
    icon: colorScheme === 'dark' ? '#FFFFFF' : '#666666',
    loading: colorScheme === 'dark' ? '#FFFFFF' : '#17A2B8',
  }), [colorScheme]);

  // Validación de parámetros
  const validateParams = useCallback(() => {
    if (!materiaid || !cursoid || !teacherid) {
      handleError(new Error('Faltan parámetros para realizar la acción'));
      return false;
    }
    return true;
  }, [materiaid, cursoid, teacherid]);

  // Carga de tareas
  const fetchTasks = useCallback(async () => {
    if (!validateParams()) return;

    setIsLoading(true);
    try {
      const taskData = await getActivities(materiaid, cursoid, teacherid, management.id);
      // Transformar los datos de las tareas al formato necesario
      const transformedTasks = taskData.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        weight: task.weight,
        createDate: new Date(task.create_date),
        subject: task.subject.subject,
        dimension: task.dimension.dimension,
        assignments: task.assignments,
      }));
      setTasks(transformedTasks);
    } catch (error) {
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [materiaid, cursoid, teacherid, validateParams, management.id]);

  // Efectos
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleClearGlobalState = useCallback(() => {
    clearGlobalState(prevState => ({
      management: prevState.management
    }));
  }, [clearGlobalState]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();

      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (e.data.action.type === 'GO_BACK') {
          handleClearGlobalState();
        }
      });

      return () => {
        unsubscribe();
        setTasks([]);
      };
    }, [fetchTasks, navigation, handleClearGlobalState])
  );

  // Manejadores de eventos
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (newDate.getMonth() === 0) {
        // Si estamos en enero, ir a diciembre del mismo año de gestión
        newDate.setMonth(11);
      } else {
        newDate.setMonth(prev.getMonth() - 1);
      }
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (newDate.getMonth() === 11) {
        // Si estamos en diciembre, ir a enero del mismo año de gestión
        newDate.setMonth(0);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  const handleDeleteTask = useCallback(async (taskid) => {
    try {
      const response = await deleteActivity(taskid);
      if (!response.ok) {
        Alert.alert('Error', 'No se pudo eliminar la tarea.');
        return;
      }

      navigation.replace("curso", {
        screen: 'index',
        params: { materiaid, cursoid, teacherid, management }
      });

      Alert.alert('Éxito', 'Tarea eliminada con éxito');
    } catch (error) {
      handleError(error, 'Error al eliminar la tarea');
    }
  }, [materiaid, cursoid, teacherid, navigation]);

  const handleActionSheet = useCallback((task) => {
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
        switch (buttonIndex) {
          case 0:
            navigation.navigate('calificaciones', {
              screen: 'index',
              params: { idTask: task.id }
            });
            break;
          case 1:
            navigation.navigate('calificaciones', {
              screen: 'editTask',
              params: { idTask: task.id }
            });
            break;
          case 2:
            Alert.alert(
              'Eliminación',
              `¿Deseas eliminar "${task.name}"?`,
              [
                { text: 'No', style: 'cancel' },
                { text: 'Sí', onPress: () => handleDeleteTask(task.id) },
              ]
            );
            break;
        }
      }
    );
  }, [navigation, handleDeleteTask]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTasks();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTasks]);

  // Filtrado de tareas
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskCreateDate = new Date(task.createDate);
      const matchesSearch = task.name.toLowerCase().includes(searchValue.toLowerCase());
      const matchesMonth = taskCreateDate.getMonth() === currentDate.getMonth() && 
                           taskCreateDate.getFullYear() === currentDate.getFullYear();
      return matchesSearch && matchesMonth;
    });
  }, [tasks, searchValue, currentDate]);

  // Renderizado de tareas
  const renderTasks = useMemo(() => {
    if (filteredTasks.length === 0) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: colors.secondaryText }]}>
            No hay tareas para este mes
          </ThemedText>
        </ThemedView>
      );
    }

    return filteredTasks.map((task) => {
      const formattedCreateDate = `${task.createDate.getUTCFullYear()}/${String(task.createDate.getUTCMonth() + 1).padStart(2, '0')}/${String(task.createDate.getUTCDate()).padStart(2, '0')}`;

      return (
        <ButtonLink
          key={task.id}
          text={`${formattedCreateDate}     ${task.name}     ponderación ${task.weight}%`}
          modo="large"
          onPress={() => handleActionSheet(task)}
          color="secondary"
          style={styles.taskButton}
        />
      );
    });
  }, [filteredTasks, handleActionSheet, colors.secondaryText]);

  // Renderizado principal
  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: colors.background, dark: colors.background }}
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
          tintColor={colors.text}
          colors={[colors.loading]}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <View style={styles.titleSection}>
          <ThemedText type="title" style={{ color: colors.text }}>
            Tareas
          </ThemedText>
          <View style={styles.subtitleRow}>
            <ThemedText type="default" style={[styles.materiaName, { color: colors.secondaryText }]}>
              {materiaName}
            </ThemedText>
            <ThemedText type="default" style={[styles.gestionText, { color: colors.secondaryText }]}>
              Gestión {management.management}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
      
      <InputFilter
        value={searchValue}
        onChangeText={setSearchValue}
        onPress={() => {}}
        type="search"
        placeholder="Buscar tarea..."
        style={styles.searchInput}
        placeholderTextColor={colors.secondaryText}
      />

      <View style={[styles.monthNavigator, { backgroundColor: colors.border }]}>
        <TouchableOpacity 
          onPress={handlePrevMonth} 
          style={[styles.monthButton, { backgroundColor: colors.button }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        
        <ThemedText type="subtitle" style={[styles.monthText, { color: colors.text }]}>
          {monthNames[currentDate.getMonth()]}
        </ThemedText>
        
        <TouchableOpacity 
          onPress={handleNextMonth} 
          style={[styles.monthButton, { backgroundColor: colors.button }]}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.loading} />
        </View>
      ) : (
        renderTasks
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  titleSection: {
  },
  subtitleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  materiaName: {
    fontSize: 16,
  },
  gestionText: {
    fontSize: 16,
    marginLeft: 8,
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 8,
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  taskButton: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
});
