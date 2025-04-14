import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Image, StyleSheet, Alert, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { View as AnimatedView } from 'react-native-animatable';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Collapsible } from '../../components/Collapsible';
import { CollapsibleOptions } from '../../components/CollapsibleOptions';
import { InputComboBox } from '../../components/InputComboBox';
import { useFocusEffect, useNavigation, useNavigationState } from '@react-navigation/native';
import { useUser } from '../../services/UserContext';
import { useGlobalState } from '../../services/UserContext';
import { useAuth } from '../../services/AuthProvider';
import { getTeacherByEmail } from '../../services/teacher';
import { getManagements } from '../../services/management';
import { handleError } from '../../utils/errorHandler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColorScheme } from 'react-native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { authuser, logout } = useAuth();
  const { globalState, setGlobalState } = useGlobalState();
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [managements, setManagements] = useState([]);
  const [selectedManagement, setSelectedManagement] = useState(null);
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const colorScheme = useColorScheme();
  const navigationState = useNavigationState(state => state);

  const theme = {
    background: colorScheme === 'dark' ? '#1D3D47' : '#F5F5F5',
    surface: colorScheme === 'dark' ? 'transparent' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#2A4A54' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    subtext: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    border: colorScheme === 'dark' ? '#3A5A64' : '#E0E0E0',
    primary: '#17A2B8',
    success: '#4CAF50',
    error: '#FF5252',
    warning: '#FFC107',
  };

  // Función para cargar las gestiones
  const fetchManagements = useCallback(async () => {
    try {
      const response = await getManagements();
      if (response.success && response.managements) {
        setManagements(response.managements);
        const activeManagement = response.managements.find(m => m.status === 1);
        if (activeManagement && (!selectedManagement || selectedManagement.id !== activeManagement.id)) {
          setSelectedManagement({
            id: activeManagement.id,
            management: activeManagement.management
          });
          setGlobalState(prev => ({
            ...prev,
            management: {
              id: activeManagement.id,
              management: activeManagement.management
            }
          }));
        }
      }
    } catch (error) {
      handleError(error, 'Error al cargar las gestiones');
    }
  }, [selectedManagement, setGlobalState]);

  // Función para cargar datos del usuario
  const fetchUserData = useCallback(async () => {
    if (!authuser?.email || !selectedManagement) return;

    try {
      setIsLoading(true);
      const response = await getTeacherByEmail(authuser.email);

      if (response.success && response.professor) {
        const cursosMaterias = response.professor.assignments.reduce((acc, assignment) => {
          const cursoId = assignment.course.id;
          if (!acc[cursoId]) {
            acc[cursoId] = {
              curso: {
                _id: assignment.course.id,
                name: assignment.course.course,
                parallel: assignment.course.parallel.trim(),
              },
              professor: assignment.professor_id,
              materias: []
            };
          }
          acc[cursoId].materias.push({
            _id: assignment.subject.id,
            name: assignment.subject.subject,
          });
          return acc;
        }, {});

        const transformedData = {
          _id: response.professor.id,
          name: response.professor.person.name,
          lastname: response.professor.person.lastname,
          email: response.professor.person.email,
          asignaciones: Object.values(cursosMaterias)
        };

        setUser(prevUser => {
          if (!prevUser || JSON.stringify(prevUser.asignaciones) !== JSON.stringify(transformedData.asignaciones)) {
            return transformedData;
          }
          return prevUser;
        });

        setGlobalState(prev => {
          if (!prev.assigned || JSON.stringify(prev.assigned) !== JSON.stringify(transformedData.asignaciones)) {
            return {
              ...prev,
              assigned: transformedData.asignaciones,
              management: selectedManagement
            };
          }
          return prev;
        });
      }
    } catch (err) {
      handleError(err, 'Error al cargar los datos');
      Alert.alert('Error', 'No se pudieron cargar las materias asignadas');
    } finally {
      setIsLoading(false);
    }
  }, [authuser?.email, selectedManagement, setUser, setGlobalState]);

  // Función para cargar todos los datos
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchManagements();
      if (selectedManagement) {
        await fetchUserData();
      }
    } catch (error) {
      handleError(error, 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  }, [fetchManagements, fetchUserData, selectedManagement]);

  // Cargar datos al inicio
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Verificación de autenticación
  useEffect(() => {
    if (!authuser?.email) {
      navigation.replace('auth');
    }
  }, [authuser, navigation]);

  // Modificar el useFocusEffect para recargar todo
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  // Función para manejar el refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setRefreshing(false);
    }
  }, [loadAllData]);

  // Función para manejar el cambio de gestión
  const handleManagementChange = useCallback((value) => {
    const selectedMgmt = managements.find(m => m.management === value);
    if (selectedMgmt && (selectedManagement?.id !== selectedMgmt.id)) {
      setSelectedManagement({
        id: selectedMgmt.id,
        management: selectedMgmt.management
      });
      setGlobalState(prev => ({
        ...prev,
        management: {
          id: selectedMgmt.id,
          management: selectedMgmt.management
        }
      }));
    }
  }, [selectedManagement, managements, setGlobalState]);

  // Opciones para el combobox de gestiones
  const managementOptions = useMemo(() => {
    return managements.map(management => ({
      value: management.management,
      text: `Gestión ${management.management}`,
    }));
  }, [managements]);

  // Función para manejar la selección de materia
  const handleMateriaSelect = useCallback((curso, materia) => {
    if (!materia._id || !curso._id || !user._id) {
      Alert.alert('Error', 'Datos incompletos para acceder al curso');
      return;
    }
    
    setGlobalState(prevState => ({
      ...prevState,
      materiaid: materia._id,
      cursoid: curso._id,
      teacherid: user._id,
      materiaName: materia.name,
      cursoName: curso.name,
      management: selectedManagement
    }));

    navigation.navigate("curso", {
      screen: 'index',
      params: {
        materiaName: materia.name,
        cursoName: curso.name,
        materiaid: materia._id,
        cursoid: curso._id,
        teacherid: user._id,
        management: selectedManagement
      }
    });
  }, [user, setGlobalState, navigation, selectedManagement]);

  // Función para manejar el logout
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sí, cerrar sesión',
          onPress: async () => {
            await logout();
            // Limpiar todos los estados
            setUser(null);
            setGlobalState({});
            setSelectedManagement(null);
            setManagements([]);
            // Redirigir al login
            navigation.reset({
              index: 0,
              routes: [{ name: 'auth' }],
            });
          }
        }
      ]
    );
  };

  // Reemplazar el useEffect del backHandler por useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        Alert.alert(
          'Salir',
          '¿Deseas salir de la aplicación?',
          [
            { 
              text: 'No', 
              style: 'cancel'
            },
            { 
              text: 'Sí',
              style: 'destructive',
              onPress: () => BackHandler.exitApp()
            }
          ]
        );
        return true;
      };

      // Solo agregar el listener cuando esta pantalla está enfocada
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      // Limpiar el listener cuando la pantalla pierde el foco
      return () => {
        backHandler.remove();
      };
    }, [])
  );

  // Renderizado de la lista de cursos
  const renderCursos = useMemo(() => {
    if (!user?.asignaciones?.length) {
    return (
        <ThemedView style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
          <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
            No tienes cursos asignados
          </ThemedText>
        </ThemedView>
    );
  }
  
  return (
      <View style={[styles.coursesContainer, { backgroundColor: theme.surface }]}>
        {user.asignaciones.map((curso) => {
          const isExpanded = expandedCourseId === curso.curso._id;
          
          return (
            <AnimatedView 
              key={curso.curso._id} 
              style={styles.courseWrapper}
              animation={isExpanded ? "zoomIn" : "fadeIn"}
              duration={300}
            >
              <TouchableOpacity 
                onPress={() => setExpandedCourseId(isExpanded ? null : curso.curso._id)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={
                    colorScheme === 'dark' 
                      ? isExpanded 
                        ? ['#1D3D47', '#162D35']  // Colores más oscuros para modo dark cuando está expandido
                        : ['#234751', '#1D3D47']  // Colores más oscuros para modo dark cuando no está expandido
                      : isExpanded 
                        ? ['#149AAF', '#0D7A8C']  // Mantener colores originales para modo light cuando está expandido
                        : ['#17A2B8', '#1590A3']  // Mantener colores originales para modo light cuando no está expandido
                  }
                  style={[styles.courseCard, isExpanded && styles.courseCardExpanded]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.courseHeader}>
                    <View style={styles.courseMainInfo}>
                      <View style={styles.courseIconWrapper}>
                        <Ionicons name="school" size={24} color="#FFFFFF" /> 
                      </View>
                      <View style={styles.courseTitleContainer}>
                        <ThemedText style={styles.courseTitle}>
                          {curso.curso.name}
                        </ThemedText>
                      </View>
                      <View style={styles.statBadge}>
                        <ThemedText style={styles.statNumber}>{curso.materias.length}</ThemedText>
                        <ThemedText style={styles.statLabel}>Materias</ThemedText>
                      </View>
                      <AnimatedView
                        animation={isExpanded ? "rotate" : undefined}
                        style={styles.expandIcon}
                      >
                        <Ionicons 
                          name={isExpanded ? "chevron-up-circle" : "chevron-down-circle"} 
                          size={28} 
                          color="#FFFFFF" 
                        />
                      </AnimatedView>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {isExpanded && (
                <AnimatedView 
                  animation="fadeInDown"
                  duration={300}
                  style={[styles.materiasContainer, { backgroundColor: theme.card }]}
                >
                  {curso.materias.map((materia, index) => (
                    <TouchableOpacity 
                      key={materia._id}
                      style={styles.materiaCard}
                      onPress={() => handleMateriaSelect(curso.curso, materia)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={[theme.card, theme.background]}
                        style={styles.materiaContent}
                      >
                        <View style={[styles.materiaIconWrapper, { backgroundColor: colorScheme === 'dark' ? 'rgba(23, 162, 184, 0.2)' : 'rgba(23, 162, 184, 0.1)' }]}>
                          <Ionicons name="book" size={22} color={theme.primary} />
                        </View>
                        <ThemedText style={[styles.materiaName, { color: theme.text }]}>
                          {materia.name}
                        </ThemedText>
                        <View style={styles.materiaArrow}>
                          <Ionicons 
                            name="arrow-forward-circle" 
                            size={24} 
                            color={theme.primary} 
                          />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </AnimatedView>
              )}
            </AnimatedView>
          );
        })}
      </View>
    );
  }, [user?.asignaciones, expandedCourseId, handleMateriaSelect]);

  return (
      <ParallaxScrollView
        modo={2}
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('../../assets/images/cursos.jpg')}
            style={styles.reactLogo}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <View>
            <ThemedText type="title">Cursos</ThemedText>
            <ThemedText type="default">
              Gestión {globalState.management?.management}
            </ThemedText>
          </View>
          <TouchableOpacity 
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <View style={styles.logoutButtonContent}>
              <Ionicons name="log-out-outline" size={24} color={theme.error} />
              <ThemedText style={[styles.logoutText, { color: theme.error }]}>
                Cerrar Sesión
              </ThemedText>
            </View>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView>
          <InputComboBox
            label="Gestión Académica"
            selectedValue={selectedManagement?.management}
            onValueChange={handleManagementChange}
            options={managementOptions}
            style={styles.managementSelect}
          />
        </ThemedView>

        {isLoading ? (
          <View style={[styles.loadingContainer, { backgroundColor: theme.surface }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          renderCursos
        )}
      </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  titleContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 8,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
  managementSelect: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  coursesContainer: {
    padding: 5,
    gap: 16,
  },
  courseWrapper: {
    marginBottom: 16,
  },
  courseCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  courseCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  courseHeader: {
    padding: 16,
  },
  courseMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courseIconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 12,
    elevation: 2,
  },
  courseTitleContainer: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  expandIcon: {
    transform: [{ rotate: '0deg' }],
  },
  materiasContainer: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 12,
    gap: 8,
  },
  materiaCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  materiaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  materiaIconWrapper: {
    backgroundColor: 'rgba(23, 162, 184, 0.1)',
    padding: 10,
    borderRadius: 12,
  },
  materiaName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  materiaArrow: {
    opacity: 0.8,
  },
  tableContainer: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF5252',
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
