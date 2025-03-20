import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Image, StyleSheet, Alert, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Collapsible } from '../../components/Collapsible';
import { CollapsibleOptions } from '../../components/CollapsibleOptions';
import { InputComboBox } from '../../components/InputComboBox';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../services/UserContext';
import { useGlobalState } from '../../services/UserContext';
import { useAuth } from '../../services/AuthProvider';
import { getTeacherByEmail } from '../../services/teacher';
import { getManagements } from '../../services/management';
import { handleError } from '../../utils/errorHandler';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { authuser } = useAuth();
  const { globalState, setGlobalState } = useGlobalState();
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [managements, setManagements] = useState([]);
  const [selectedManagement, setSelectedManagement] = useState(null);

  // Función para cargar las gestiones
  const fetchManagements = useCallback(async () => {
    try {
      const response = await getManagements();
      if (response.success && response.data) {
        setManagements(response.data);
        // Encontrar y establecer la gestión activa por defecto
        const activeManagement = response.data.find(m => m.status === 1);
        if (activeManagement) {
          setSelectedManagement(activeManagement.year);
        }
      }
    } catch (error) {
      handleError(error, 'Error al cargar las gestiones');
    }
  }, []);

  // Función para cargar datos del usuario
  const fetchUserData = useCallback(async () => {
    if (!authuser?.email || !selectedManagement) return;

    try {
      setIsLoading(true);

      const userData = await getTeacherByEmail(authuser.email, selectedManagement);

      if (userData) {
        setUser(userData);
        setGlobalState({ assigned: userData.asignaciones, management: selectedManagement });
      }
    } catch (err) {
      handleError(err, 'Error al cargar los datos');
      Alert.alert('Error', 'No se pudieron cargar las materias asignadas');
    } finally {
      setIsLoading(false);
    }
  }, [authuser?.email, selectedManagement, setUser, setGlobalState]);

  // Cargar gestiones al inicio
  useEffect(() => {
    fetchManagements();
  }, [fetchManagements]);

  // Verificación de autenticación
  useEffect(() => {
    if (!authuser?.email) {
      navigation.replace('auth');
    }
  }, [authuser, navigation]);

  // Cargar datos cuando cambie la gestión seleccionada
  useEffect(() => {
    if (selectedManagement) {
      fetchUserData();
    }
  }, [selectedManagement, fetchUserData]);

  // Opciones para el combobox de gestiones
  const managementOptions = useMemo(() => {
    return managements.map(management => ({
      value: management._id,
      text: `Gestión ${management.year}`,
    }));
  }, [managements]);

  // Función para manejar el cambio de gestión
  const handleManagementChange = useCallback((value) => {
    setSelectedManagement(value);
  }, []);

  // Función para manejar el refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserData]);

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

  // Renderizado de la lista de cursos
  const renderCursos = useMemo(() => {
    if (!user?.asignaciones?.length) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            No tienes cursos asignados
          </ThemedText>
        </ThemedView>
      );
    }

    return user.asignaciones.map((curso) => (
      <Collapsible 
        key={curso.curso._id} 
        title={curso.curso.name} 
        color="info"
      >
        {curso.materias.map((materia) => (
          <CollapsibleOptions
            key={materia._id}
            title={materia.name}
            color="info"
            onPress={() => handleMateriaSelect(curso.curso, materia)}
          />
        ))}
      </Collapsible>
    ));
  }, [user?.asignaciones, handleMateriaSelect]);

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
        <ThemedText type="title">Cursos</ThemedText>
        <ThemedText type="default">
          Gestión {globalState.management}
        </ThemedText>
      </ThemedView>

      <ThemedView>
        <InputComboBox
          label="Gestión Académica"
          selectedValue={selectedManagement}
          onValueChange={handleManagementChange}
          options={managementOptions}
          style={styles.managementSelect}
        />
      </ThemedView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#17A2B8" />
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
    color: '#666',
    textAlign: 'center',
  },
  titleContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 0,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
  managementSelect: {
    marginBottom: 8,
  },
});
