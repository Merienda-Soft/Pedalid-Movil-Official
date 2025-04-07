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

  // Actualizar el objeto de colores para que coincida con el tema de studentTasks
  const theme = {
    background: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    surface: colorScheme === 'dark' ? '#121212' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    subtext: colorScheme === 'dark' ? '#8E8E93' : '#666666',
    border: colorScheme === 'dark' ? '#2C2C2E' : 'rgba(0,0,0,0.05)',
    primary: '#17A2B8',
  };

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
          <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
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
  }, [filteredTasks, handleActionSheet, theme.subtext]);

  // Renderizado principal
  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* ParallaxScrollView solo para la imagen */}
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
          headerHeight={110}
        >
          <View style={{ height: 1 }} />
        </ParallaxScrollView>
      </View>

      {/* Contenido principal */}
      <View style={styles.mainContent}>
        {/* Header fijo con filtros */}
        <View style={[styles.headerFixed, { backgroundColor: theme.surface }]}>
          <ThemedView style={[styles.titleContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.titleRow}>
              <ThemedText type="title" style={{ color: theme.text }}>Tareas</ThemedText>
              <ThemedText type="default" style={{ color: theme.subtext }}>
                Gestión {management.management}
              </ThemedText>
            </View>
            <ThemedText type="default" style={[styles.subtitleText, { color: theme.subtext }]}>
              {materiaName}
            </ThemedText>
          </ThemedView>

          <View style={[styles.filtersContainer, { backgroundColor: theme.surface }]}>
            <InputFilter
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Buscar tarea..."
              style={[styles.searchInput, { backgroundColor: theme.card }]}
            />
          </View>

          <View style={[styles.monthNavigator, { backgroundColor: theme.card }]}>
            <TouchableOpacity onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={24} color={theme.subtext} />
            </TouchableOpacity>
            <ThemedText style={[styles.monthText, { color: theme.text }]}>
              {monthNames[currentDate.getMonth()]}
            </ThemedText>
            <TouchableOpacity onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={24} color={theme.subtext} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido scrolleable */}
        <ScrollView 
          style={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={theme.text}
              colors={[theme.primary]}
            />
          }
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
          ) : filteredTasks.length === 0 ? (
            <ThemedView style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
              <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
                No hay tareas para este mes
              </ThemedText>
            </ThemedView>
          ) : (
            <View style={[styles.tasksContainer, { backgroundColor: theme.surface }]}>
              {filteredTasks.map((task) => (
                <TouchableOpacity 
                  key={task.id}
                  style={[styles.taskCard, { backgroundColor: theme.card }]}
                  onPress={() => handleActionSheet(task)}
                >
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <View style={styles.taskTitleContainer}>
                        <ThemedText style={[styles.taskName, { color: theme.text }]}>
                          {task.name}
                        </ThemedText>
                        <ThemedText style={[styles.taskDate, { color: theme.subtext }]}>
                          {task.createDate.toLocaleDateString()}
                        </ThemedText>
                      </View>
                      <View style={styles.weightBadge}>
                        <ThemedText style={styles.weightText}>
                          {task.weight}%
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View style={[styles.taskDetails, { borderTopColor: theme.border }]}>
                      <View style={styles.detailItem}>
                        <Ionicons name="school-outline" size={16} color={theme.subtext} />
                        <ThemedText style={[styles.detailText, { color: theme.subtext }]}>
                          {task.dimension.dimension}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    marginTop: 110,
  },
  titleContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  titleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  subtitleText: {
    marginTop: 4,
  },
  filtersContainer: {
    padding: 16,
    paddingTop: 8,
  },
  scrollContent: {
    flex: 1,
  },
  searchInput: {
    marginBottom: 0,
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tasksContainer: {
    padding: 16,
    gap: 12,
  },
  taskCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  taskContent: {
    padding: 16,
    gap: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitleContainer: {
    flex: 1,
    gap: 4,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskDate: {
    fontSize: 12,
  },
  weightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#17A2B8',
  },
  weightText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  taskDetails: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  taskButton: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
});
