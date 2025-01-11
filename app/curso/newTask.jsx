import { useState } from 'react';
import { Image, StyleSheet, ActivityIndicator } from 'react-native';
import { handleError } from '@/utils/errorHandler';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { InputType } from '@/components/InputType';
import { InputComboBox } from '@/components/InputComboBox';
import { ButtonLink } from '@/components/ButtonLink';
import { createActivity } from '@/services/activity';
import { useGlobalState } from '@/services/UserContext';
import { useNavigation } from '@react-navigation/native';

export default function NewTaskScreen() {
  const { globalState } = useGlobalState();
  const { cursoid, materiaid, teacherid, materiaName, cursoName } = globalState;
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    selectedDate: '',
    name: '',
    ponderacion: '',
    descripcion: '',
    selectedValue: '1'
  });

  const options = [
    { value: '1', text: 'Ser' },
    { value: '2', text: 'Saber' },
    { value: '3', text: 'Hacer' },
    { value: '4', text: 'Decidir' },
  ];

  const validateForm = () => {
    if (!formData.name.trim()) {
      handleError(new Error('El nombre de la tarea es requerido'));
      return false;
    }
    if (!formData.ponderacion || isNaN(formData.ponderacion)) {
      handleError(new Error('La ponderación debe ser un número válido'));
      return false;
    }
    if (!formData.selectedDate) {
      handleError(new Error('La fecha es requerida'));
      return false;
    }
    if (!formData.descripcion.trim()) {
      handleError(new Error('La descripción es requerida'));
      return false;
    }
    return true;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateTask = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const taskData = {
        name: formData.name.trim(),
        description: formData.descripcion.trim(),
        fecha: formData.selectedDate,
        ponderacion: Number(formData.ponderacion),
        type: Number(formData.selectedValue),
        materiaid,
        cursoid,
        teacherid
      };

      await createActivity(taskData);
      navigation.goBack();
    } catch (error) {
      handleError(error, 'Error al crear la tarea');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView>
      <ThemedView style={styles.container}>
        <InputType
          label="Nombre de la tarea"
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
        />
        <InputType
          label="Ponderación"
          value={formData.ponderacion}
          onChangeText={(value) => handleChange('ponderacion', value)}
          keyboardType="numeric"
        />
        <InputType
          label="Fecha"
          value={formData.selectedDate}
          onChangeText={(value) => handleChange('selectedDate', value)}
        />
        <InputComboBox
          options={options}
          selectedValue={formData.selectedValue}
          onValueChange={(value) => handleChange('selectedValue', value)}
        />
        <InputType
          label="Descripción"
          value={formData.descripcion}
          onChangeText={(value) => handleChange('descripcion', value)}
          multiline
        />
        <ButtonLink 
          title="Crear Tarea"
          onPress={handleCreateTask}
          disabled={isLoading}
        />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
