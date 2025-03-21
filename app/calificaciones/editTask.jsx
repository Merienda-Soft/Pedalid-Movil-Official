import { useState, useEffect, useMemo } from 'react';
import { Image, StyleSheet, Alert, View } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { InputType } from '../../components/InputType';
import { InputComboBox } from '../../components/InputComboBox';
import { ButtonLink } from '../../components/ButtonLink';
import { updateActivity } from '../../services/activity';
import { useGlobalState } from '../../services/UserContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

export default function EditTaskScreen() {
    const colorScheme = useColorScheme();
    const route = useRoute();
    const { globalState } = useGlobalState();
    const { cursoid, materiaid, teacherid, materiaName } = globalState;
    const navigation = useNavigation();

    const [selectedDate, setSelectedDate] = useState('');
    const [name, setName] = useState('');
    const [ponderacion, setPonderacion] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [selectedValue, setSelectedValue] = useState('1'); // Default value

    const { allTask } = route.params;

    const colors = useMemo(() => ({
        background: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
        text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        secondaryText: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    }), [colorScheme]);

    useEffect(() => {
        if (allTask) {
            setName(allTask.name);
            setPonderacion(allTask.ponderacion);
            setDescripcion(allTask.description);
            // Convert number to string for ComboBox
            setSelectedValue(allTask.tipo.toString());

            const formattedDate = new Date(allTask.fecha).toISOString().split('T')[0];
            setSelectedDate(formattedDate); 

        }

    }, [allTask]);

    const options = [
      { value: '1', text: 'Ser' },
      { value: '2', text: 'Saber' },
      { value: '3', text: 'Hacer' },
      { value: '4', text: 'Decidir' },
    ];

    

    const handleUpdateTask = async () => {
    if (!name || !selectedDate || !ponderacion || !descripcion) {
        Alert.alert("Error", "Por favor, completa todos los campos.");
        return;
    }
  
      const newTask = {
        id: allTask._id,
        name: name,
        description: descripcion,
        fecha: selectedDate,
        horario: "00:00", 
        ponderacion: `${ponderacion}`,
        cursoid: cursoid,  
        materiaid: materiaid,
        professorid: teacherid, 
        tipo: Number(selectedValue),
        fecha_fin: "2024-03-20", 
      };
  
      try {
        // Enviar los datos al servidor
        const response = await updateActivity(newTask);
        if(response.ok){
          Alert.alert("Tarea actualizada con éxito", 'La tarea se actualizo con exito');
          const management = globalState.management
          navigation.replace("curso", {screen: 'index', params: {
            materiaid: materiaid,
            cursoid: cursoid,
            teacherid: teacherid,
            management
          }})
        }else{
          Alert.alert("Error", 'La tarea no se actualizo');

        }
      } catch (error) {
        Alert.alert("Error", `Hubo un problema creando la tarea: ${error.message}`);
      }
    };

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: colors.background, dark: colors.background }}
      headerImage={
        <Image
          source={require('../../assets/images/newtask.jpg')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <View style={styles.titleSection}>
          <ThemedText type="title" style={{ color: colors.text }}>
            Editar Tarea
          </ThemedText>
          <View style={styles.subtitleRow}>
            <ThemedText type="default" style={[styles.materiaName, { color: colors.secondaryText }]}>
              {materiaName}
            </ThemedText>
            <ThemedText type="default" style={[styles.gestionText, { color: colors.secondaryText }]}>
              Gestión {globalState.management}
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      <InputType
        label="Nombre"
        value={name}
        onChangeText={setName}
        type="text"
        placeholder="Ej: Tarea 1"
        />

      <InputType
        label="Fecha"
        value={selectedDate}
        onChangeText={setSelectedDate}
        type="date"
        placeholder="Seleccionar fecha"
        />

      <InputType
        label="Ponderacion"
        value={ponderacion}
        onChangeText={setPonderacion}
        type="number"
        placeholder="Ingrese la ponderaciond de la tarea"
        />
      <InputComboBox
        label="Tipo de actividad"
        selectedValue={selectedValue}
        onValueChange={setSelectedValue}
        options={options}
        />

      <InputType
        label="Descripcion"
        value={descripcion}
        onChangeText={setDescripcion}
        type="textarea"
        placeholder="Seleccionar fecha"
        />

      <ButtonLink text="Actualizar tarea" modo='large' onPress={handleUpdateTask} color='primary'/>

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
    gap: 4,
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
  },
  reactLogo: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
});
