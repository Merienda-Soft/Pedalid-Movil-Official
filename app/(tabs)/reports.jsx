import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Image, Platform, Alert, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { ButtonLink } from '../../components/ButtonLink';
import { useGlobalState } from '../../services/UserContext';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../services/AuthProvider'; // Add this
import { getReportsByCurso } from '../../services/reports';
import { handleError } from '../../utils/errorHandler';

export default function TabTwoScreen() {

  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
  const { authuser } = useAuth(); // Add this
  const { globalState, setGlobalState } = useGlobalState();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setGlobalState(prev => ({
        ...prev,
        assigned: authuser?.asignaciones || []
      }));
    } finally {
      setRefreshing(false);
    }
  }, [authuser, setGlobalState]);

  // Add auth check
  useEffect(() => {
    if (!authuser) {
      navigation.replace('auth');
      return;
    }
    
  }, [authuser, navigation]);

  // Add check for globalState.assigned
  const openActionSheet = useCallback(() => {
    if (!globalState?.assigned) {
      Alert.alert('Error', 'No hay materias asignadas');
      return;
    }
    
    const options = [];
    const indexMap = {};

    globalState.assigned.forEach((curso) => {
      curso.materias.forEach((materia) => {
        const formattedOption = `(${curso.curso.name}) ${materia.name}`;
        options.push(formattedOption); 
        indexMap[options.length - 1] = { cursoid: curso.curso._id, materiaid: materia._id, teacherid: curso.professor, materiaName: materia.name, cursoName: curso.curso.name };
      });
    });

  
    const cancelButtonIndex = options.length; 
  
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: `Opciones de reportes`,
      },
      (buttonIndex) => {
        if (indexMap[buttonIndex]) {
          const { cursoid, materiaid, teacherid, materiaName } = indexMap[buttonIndex];
          setGlobalState({
            materiaName: materiaName
          })
          navigation.navigate("reportes", {screen: 'index', params: {
            materiaid,
            cursoid,
            teacherid
        }});
        }
      }
    );
  }, [globalState.assigned, showActionSheetWithOptions, navigation, setGlobalState]);

  const openReportTypeSheet = useCallback(() => {
    if (!globalState?.assigned) {
      Alert.alert('Error', 'No hay cursos asignados');
      return;
    }

    const options = [];
    const indexMap = {};

    globalState.assigned.forEach((curso, index) => {
      options.push(curso.curso.name);
      indexMap[index] = {
        cursoid: curso.curso._id,
        cursoName: curso.curso.name,
        teacherid: curso.professor
      };
    });

    const cancelButtonIndex = options.length;
    options.push('Cancelar');

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: 'Seleccione un curso',
      },
      async (buttonIndex) => {
        if (indexMap[buttonIndex]) {
          const { cursoid, cursoName, teacherid } = indexMap[buttonIndex];
          setIsLoading(true);
          try {
            await getReportsByCurso(teacherid, cursoid);
            Alert.alert('Éxito', `El reporte del curso ${cursoName} ha sido descargado`);
          } catch (error) {
            handleError(error);
          } finally {
            setIsLoading(false);
          }
        }
      }
    );
  }, [globalState?.assigned, showActionSheetWithOptions, navigation]);

  // Add loading modal component
  const LoadingModal = () => (
    <Modal transparent visible={isLoading}>
      <ThemedView style={styles.modalContainer}>
        <ThemedView style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>
            Generando reporte...
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Modal>
  );

  return (
    <>
      <ParallaxScrollView
        modo={2}
        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
        headerImage={
          <Image
            source={require('../../assets/images/reportes.jpg')}
            style={styles.headerImage}
          />
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
          />
        }>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Reportes</ThemedText>
          <ThemedText type="default">
          Gestión {globalState.management}
        </ThemedText>
        </ThemedView>

        <ButtonLink text="Registro" modo='large' onPress={() => openActionSheet()}  color='info' style={{marginVertical: 0}}/>
        <ButtonLink text="Generar Informe Trimestral" modo='large' onPress={() => openReportTypeSheet()} color='info' style={{marginVertical: 0}} disabled={isLoading}/>
        {/* <ButtonLink text="Imprimir" modo='large' color='info' style={{marginVertical: 0}}/> */}
     
      </ParallaxScrollView>
      <LoadingModal />
    </>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: '100%',
    height: '100%'
  },
  titleContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingBox: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
  },
});
