import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { ButtonLink } from "../../components/ButtonLink";
import ChecklistBuilder from "../../components/ChecklistBuilderNew";
import EvaluationToolSelector from "../../components/EvaluationToolSelector";
import { InputComboBox } from "../../components/InputComboBox";
import { InputType } from "../../components/InputType";
import ParallaxScrollView from "../../components/ParallaxScrollView";
import RubricBuilder from "../../components/RubricBuilderNew";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { createActivity } from "../../services/activity";
import { useGlobalState } from "../../services/UserContext";
import {
  createEmptyChecklist,
  createEmptyRubric,
  EvaluationToolType,
  validateChecklistData,
  validateRubricData,
} from "../../types/evaluation";

export default function NewTaskScreen() {
  const colorScheme = useColorScheme();
  const { globalState } = useGlobalState();
  const { cursoid, materiaid, teacherid, materiaName, cursoName } = globalState;
  const navigation = useNavigation();

  // Estados
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    ponderacion: "",
    descripcion: "",
    tipo: "1",
    type: 0, // 0 = tarea para entregar, 1 = tarea solo para calificar
  });

  // Estado para herramientas de evaluación
  const [evaluationTool, setEvaluationTool] = useState({
    type: null,
    data: null,
  });

  // Colores dinámicos basados en el tema
  const colors = useMemo(
    () => ({
      background: colorScheme === "dark" ? "#1D3D47" : "#A1CEDC",
      text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
      secondaryText: colorScheme === "dark" ? "#B0B0B0" : "#666666",
      error: "#FF6B6B",
      success: "#4CAF50",
    }),
    [colorScheme]
  );

  const options = [
    { value: "1", text: "Ser" },
    { value: "2", text: "Saber" },
    { value: "3", text: "Hacer" },
    { value: "4", text: "Decidir" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxToggle = () => {
    setFormData((prev) => ({
      ...prev,
      type: prev.type === 0 ? 1 : 0,
    }));
  };

  const handleEvaluationToolChange = (type) => {
    if (type === null) {
      setEvaluationTool({
        type: null,
        data: null,
      });
    } else if (type !== evaluationTool.type) {
      setEvaluationTool({
        type,
        data:
          type === EvaluationToolType.RUBRIC
            ? createEmptyRubric()
            : createEmptyChecklist(),
      });
    }
  };

  const handleEvaluationDataChange = (data) => {
    setEvaluationTool((prev) => ({
      ...prev,
      data,
    }));
  };

  const validateForm = () => {
    const { name, date, ponderacion, descripcion } = formData;
    if (!name || !date || !ponderacion || !descripcion) {
      Alert.alert(
        "Campos Incompletos",
        "Por favor, completa todos los campos requeridos.",
        [{ text: "Entendido" }]
      );
      return false;
    }

    const pondValue = Number(ponderacion);
    if (isNaN(pondValue) || pondValue <= 0 || pondValue > 100) {
      Alert.alert(
        "Ponderación Inválida",
        "La ponderación debe ser un número entre 1 y 100.",
        [{ text: "Entendido" }]
      );
      return false;
    }

    // Validar herramientas de evaluación solo si están configuradas
    if (evaluationTool.type && evaluationTool.data) {
      if (evaluationTool.type === EvaluationToolType.RUBRIC) {
        if (!validateRubricData(evaluationTool.data)) {
          Alert.alert(
            "Rúbrica Incompleta",
            "La rúbrica debe tener un título y al menos un criterio completo.",
            [{ text: "Entendido" }]
          );
          return false;
        }
      } else if (evaluationTool.type === EvaluationToolType.CHECKLIST) {
        if (!validateChecklistData(evaluationTool.data)) {
          Alert.alert(
            "Lista de Cotejo Incompleta",
            "La lista de cotejo debe tener un título y al menos un ítem.",
            [{ text: "Entendido" }]
          );
          return false;
        }
      }
    }

    return true;
  };
  const handleCreateTask = async () => {
    if (!validateForm()) return;

    // Obtener la fecha actual para start_date
    const today = new Date();
    const startDate = today.toISOString();

    // Convertir la fecha de entrega a formato ISO con hora final del día
    const endDate = new Date(formData.date);
    endDate.setHours(23, 59, 59, 999);
    const endDateISO = endDate.toISOString();

    const newTask = {
      task: {
        name: formData.name,
        description: formData.descripcion,
        dimension_id: Number(formData.tipo),
        management_id: globalState.management.id, // Asumiendo que management tiene id
        professor_id: teacherid,
        subject_id: materiaid,
        course_id: cursoid,
        weight: Number(formData.ponderacion),
        is_autoevaluation: 0,
        quarter: "Q1",
        type: formData.type,
        start_date: startDate,
        end_date: endDateISO,
      },
    };

    // Agregar herramienta de evaluación si está definida
    if (evaluationTool.type && evaluationTool.data) {
      newTask.tool = {
        type: evaluationTool.type,
        methodology: evaluationTool.data,
      };
    }

    try {
      await createActivity(newTask);
      const management = globalState.management;
      Alert.alert("Éxito", "La tarea se creó correctamente", [
        {
          text: "OK",
          onPress: () =>
            navigation.replace("curso", {
              screen: "index",
              params: {
                materiaName,
                cursoName,
                materiaid,
                cursoid,
                teacherid,
                management,
              },
            }),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo crear la tarea. Por favor, intenta nuevamente.",
        [{ text: "Entendido" }]
      );
      console.log(error);
    }
  };

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{
        light: colors.background,
        dark: colors.background,
      }}
      headerImage={
        <Image
          source={require("../../assets/images/newtask.jpg")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <View style={styles.titleSection}>
          <ThemedText type="title" style={{ color: colors.text }}>
            Nueva Tarea
          </ThemedText>
          <View style={styles.subtitleRow}>
            <ThemedText
              type="default"
              style={[styles.materiaName, { color: colors.secondaryText }]}
            >
              {materiaName}
            </ThemedText>
            <ThemedText
              type="default"
              style={[styles.gestionText, { color: colors.secondaryText }]}
            >
              Gestión {globalState.management.management}
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      <InputType
        label="Nombre de la Tarea"
        value={formData.name}
        onChangeText={(value) => handleInputChange("name", value)}
        type="text"
        placeholder="Ej: Tarea 1"
        required
      />

      <InputType
        label="Fecha de Entrega"
        value={formData.date}
        onChangeText={(value) => handleInputChange("date", value)}
        type="date"
        placeholder="Seleccionar fecha"
        required
      />

      <InputType
        label="Ponderación (%)"
        value={formData.ponderacion}
        onChangeText={(value) => handleInputChange("ponderacion", value)}
        type="number"
        placeholder="Ingrese un valor entre 1 y 100"
        keyboardType="numeric"
        required
      />

      <InputComboBox
        label="Área de Evaluación"
        selectedValue={formData.tipo}
        onValueChange={(value) => handleInputChange("tipo", value)}
        options={options}
      />

      <InputType
        label="Descripción"
        value={formData.descripcion}
        onChangeText={(value) => handleInputChange("descripcion", value)}
        type="textarea"
        placeholder="Describe los detalles de la tarea..."
        multiline
        required
      />

      {/* Herramientas de Evaluación - Siempre visibles */}
      <ThemedView style={styles.evaluationSection}>
        <ThemedText style={[styles.evaluationTitle, { color: colors.text }]}>
          Herramienta de Evaluación (Opcional)
        </ThemedText>

        <EvaluationToolSelector
          selectedType={evaluationTool.type}
          onChange={handleEvaluationToolChange}
        />

        {evaluationTool.type === EvaluationToolType.RUBRIC && (
          <ThemedView style={styles.builderContainer}>
            <RubricBuilder
              initialData={evaluationTool.data}
              onChange={handleEvaluationDataChange}
            />
          </ThemedView>
        )}

        {evaluationTool.type === EvaluationToolType.CHECKLIST && (
          <ThemedView style={styles.builderContainer}>
            <ChecklistBuilder
              initialData={evaluationTool.data}
              onChange={handleEvaluationDataChange}
            />
          </ThemedView>
        )}
      </ThemedView>

      <TouchableOpacity
        style={[
          styles.checkboxContainer,
          { borderColor: colors.secondaryText },
        ]}
        onPress={handleCheckboxToggle}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.secondaryText },
            formData.type === 1 && { backgroundColor: "#17A2B8" },
          ]}
        >
          {formData.type === 1 && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
        <ThemedText style={[styles.checkboxLabel, { color: colors.text }]}>
          Tarea solo para calificar (sin entrega de alumnos)
        </ThemedText>
      </TouchableOpacity>

      <ButtonLink
        text="Crear Tarea"
        modo="large"
        onPress={handleCreateTask}
        color="primary"
        style={styles.submitButton}
      />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  titleSection: {
    gap: 4,
  },
  subtitleRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  materiaName: {
    fontSize: 16,
  },
  gestionText: {
    fontSize: 16,
  },
  reactLogo: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  submitButton: {
    marginTop: 5,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 0,
    marginTop: 0,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
  },
  evaluationSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  builderContainer: {
    marginTop: 12,
  },
});
