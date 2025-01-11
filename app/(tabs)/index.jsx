import React, { useEffect, useState, useCallback } from 'react';
import { Image, StyleSheet, Alert, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Collapsible } from '@/components/Collapsible';
import { CollapsibleOptions } from '@/components/CollapsibleOptions';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/services/UserContext';
import { useGlobalState } from '@/services/UserContext';
import { useAuth } from '@/services/AuthProvider';
import { getTeacherByEmail } from '@/services/teacher';
import { handleError } from '../../utils/errorHandler';

export default function HomeScreen() {

  const navigation = useNavigation();
  const { authuser } = useAuth();
  const { globalState, setGlobalState, clearGlobalState } = useGlobalState();
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  useEffect(() => {
    if (!authuser || !authuser.email) {
      navigation.navigate('index'); // Redirige al login si authuser es nulo
      return;
    }
    fetchUserData();
  }, [authuser.email, setUser, authuser, navigation]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const userData = await getTeacherByEmail(authuser.email);
      if (userData) {
        setUser(userData);
        setGlobalState({ assigned: userData.asignaciones })
      }
    } catch (err) {
      handleError(err, 'Error al cargar los datos');
      Alert.alert('Error', 'Aun no tienes materias asignadas?');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserData();
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ParallaxScrollView
        modo={2}
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/cursos.jpg')}
            style={styles.reactLogo}
          />
        }>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Cursos</ThemedText>
        </ThemedView>

        {user?.asignaciones.map((curso) => (
          <Collapsible key={curso.curso._id} title={curso.curso.name} color="info">
            {curso.materias.map((materia) => (
              <CollapsibleOptions
                key={materia._id}
                title={materia.name}
                color="info"
                onPress={() => {
                  setGlobalState({
                    materiaid: materia._id,
                    cursoid: curso.curso._id,
                    teacherid: user._id,
                    materiaName: materia.name,
                    cursoName: curso.curso.name,
                  })
                  if (materia._id, curso._id, user._id) {
                    navigation.navigate("curso", {
                      screen: 'index', params: {
                        materiaName: materia.name,
                        cursoName: curso.curso.name,
                        materiaid: materia._id,
                        cursoid: curso.curso._id,
                        teacherid: user._id,
                      }
                    })
                  }
                }}
              />
            ))}
          </Collapsible>
        ))}
      </ParallaxScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
});
