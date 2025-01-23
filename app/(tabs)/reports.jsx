import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Image, Platform, Alert } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ButtonLink } from '@/components/ButtonLink';
import { useGlobalState } from '@/services/UserContext';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from 'expo-router';
import { useAuth } from '@/services/AuthProvider'; // Add this

export default function TabTwoScreen() {

  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
  const { authuser } = useAuth(); // Add this
  const { globalState, setGlobalState } = useGlobalState();

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
    const options = ['Trimestral', 'Mensual', 'Anual', 'Cancelar'];
    const cancelButtonIndex = 3;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: 'Seleccione tipo de informe',
      },
      (buttonIndex) => {
        if (buttonIndex !== cancelButtonIndex) {
          const reportType = options[buttonIndex];
          navigation.navigate("reportes", {
            screen: 'index', 
            params: {
              type: reportType.toLowerCase()
            }
          });
        }
      }
    );
  }, [showActionSheetWithOptions, navigation]);
 
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
        <ThemedText type="title">Reportes</ThemedText>
      </ThemedView>

      <ButtonLink text="Registro" modo='large' onPress={() => openActionSheet()}  color='info' style={{marginVertical: 0}}/>
      <ButtonLink text="Generar Informe Trimestral" modo='large' onPress={() => openReportTypeSheet()} color='info' style={{marginVertical: 0}}/>
      <ButtonLink text="Imprimir" modo='large' color='info' style={{marginVertical: 0}}/>
   
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: '100%',
    height: '100%'
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
