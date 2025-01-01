import { useState } from 'react';
import { Image, StyleSheet, Alert } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { InputType } from '@/components/InputType';
import { InputComboBox } from '@/components/InputComboBox';
import { ButtonLink } from '@/components/ButtonLink';
import { createActivity } from '@/services/activity';
import { useGlobalState } from '@/services/UserContext';
import { useNavigation } from '@react-navigation/native';
export default function newTaskScreen() {
  const { globalState } = useGlobalState();
  const {cursoid, materiaid, teacherid, materiaName, cursoName} = globalState
  const navigation = useNavigation();

    const [selectedDate, setSelectedDate] = useState('');
    const [name, setName] = useState('');
    const [ponderacion, setPonderacion] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [selectedValue, setSelectedValue] = useState('1');

    const options = [
        { value: '1', text: 'Tarea Normal' },
        { value: '2', text: 'Evaluacion' },
        { value: '3', text: 'Autoevaluacion' },
      ];

    const handleCreateTask = async () => {
      if (!name || !selectedDate || !ponderacion || !descripcion) {
        Alert.alert("Error", "Por favor, completa todos los campos.");
        return;
      }

  
      const newTask = {
        name: name,
        description: descripcion,
        fecha: selectedDate,
        horario: "00:00", 
        ponderacion: `${ponderacion}%`,
        cursoid: cursoid,  
        materiaid: materiaid,
        professorid: teacherid, 
        tipo: Number(selectedValue),
        fecha_fin: "2024-03-20", 
      };
  
      try {
        // Enviar los datos al servidor
        const response = await createActivity(newTask);
        Alert.alert("Tarea creada con éxito", 'La tarea se creo con exito');
        navigation.replace("curso", {screen: 'index', params: {
          materiaName: materiaName,
          cursoName: cursoName,
          materiaid: materiaid,
          cursoid: cursoid,
          teacherid: teacherid,
      }})
      } catch (error) {
        Alert.alert("Error", `Hubo un problema creando la tarea: ${error.message}`);
      }
    };

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/newtask.jpg')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Nueva Tarea</ThemedText>
        <ThemedText type="default">({materiaName})</ThemedText>
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

      <ButtonLink text="Crear tarea" modo='large' onPress={handleCreateTask} color='primary'/>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
});
