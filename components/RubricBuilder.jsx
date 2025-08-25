import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createEmptyRubric,
  createEmptyRubricCriterion,
  DEFAULT_RUBRIC_LEVELS,
} from "../types/evaluation";
import { InputType } from "./InputType";
import { ThemedText } from "./ThemedText";

export default function RubricBuilder({ initialData, onChange, colors = {} }) {
  const defaultColors = {
    text: "#000000",
    secondaryText: "#666666",
    primary: "#17A2B8",
    background: "#FFFFFF",
    border: "#E0E0E0",
    error: "#FF6B6B",
    success: "#4CAF50",
    ...colors,
  };

  const [rubric, setRubric] = useState(() => {
    if (initialData) {
      return {
        title: initialData.title || "",
        criteria:
          initialData.criteria?.map((criterion) => ({
            name: criterion.name || "",
            weight: criterion.weight || 0,
            selected: criterion.selected || 0,
            levels: criterion.levels?.map((level) => ({
              description: level.description || "",
              score: level.score || 0,
            })) || [...DEFAULT_RUBRIC_LEVELS],
          })) || [],
      };
    }
    return createEmptyRubric();
  });

  const updateRubric = (updates) => {
    const updated = { ...rubric, ...updates };
    setRubric(updated);
    onChange(updated);
  };

  const handleAddCriterion = () => {
    const newCriterion = createEmptyRubricCriterion();
    updateRubric({
      criteria: [...rubric.criteria, newCriterion],
    });
  };

  const handleRemoveCriterion = (index) => {
    Alert.alert(
      "Eliminar Criterio",
      "¿Estás seguro de que quieres eliminar este criterio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            const updatedCriteria = [...rubric.criteria];
            updatedCriteria.splice(index, 1);
            updateRubric({ criteria: updatedCriteria });
          },
        },
      ]
    );
  };

  const updateCriterion = (index, field, value) => {
    const updatedCriteria = [...rubric.criteria];
    updatedCriteria[index] = {
      ...updatedCriteria[index],
      [field]: value,
    };
    updateRubric({ criteria: updatedCriteria });
  };

  const updateLevel = (criterionIndex, levelIndex, field, value) => {
    const updatedCriteria = [...rubric.criteria];
    updatedCriteria[criterionIndex].levels[levelIndex] = {
      ...updatedCriteria[criterionIndex].levels[levelIndex],
      [field]: value,
    };
    updateRubric({ criteria: updatedCriteria });
  };

  return (
    <ScrollView style={styles.container} nestedScrollEnabled={true}>
      <View
        style={[styles.section, { backgroundColor: defaultColors.background }]}
      >
        <ThemedText
          style={[styles.sectionTitle, { color: defaultColors.text }]}
        >
          Configuración de Rúbrica
        </ThemedText>

        <InputType
          label="Título de la Rúbrica"
          value={rubric.title}
          onChangeText={(value) => updateRubric({ title: value })}
          type="text"
          placeholder="Ej: Rúbrica de Evaluación del Proyecto"
          required
        />

        <View style={styles.criteriaSection}>
          <View style={styles.criteriaHeader}>
            <ThemedText
              style={[styles.criteriaTitle, { color: defaultColors.text }]}
            >
              Criterios de Evaluación
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: defaultColors.success },
              ]}
              onPress={handleAddCriterion}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>
                Agregar Criterio
              </ThemedText>
            </TouchableOpacity>
          </View>

          {rubric.criteria.map((criterion, criterionIndex) => (
            <View
              key={criterionIndex}
              style={[
                styles.criterionCard,
                { borderColor: defaultColors.border },
              ]}
            >
              <View style={styles.criterionHeader}>
                <ThemedText
                  style={[
                    styles.criterionNumber,
                    { color: defaultColors.primary },
                  ]}
                >
                  Criterio {criterionIndex + 1}
                </ThemedText>
                <TouchableOpacity
                  style={[
                    styles.removeButton,
                    { backgroundColor: defaultColors.error },
                  ]}
                  onPress={() => handleRemoveCriterion(criterionIndex)}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <InputType
                label="Nombre del Criterio"
                value={criterion.name}
                onChangeText={(value) =>
                  updateCriterion(criterionIndex, "name", value)
                }
                type="text"
                placeholder="Ej: Contenido y Organización"
                required
              />

              <InputType
                label="Peso (%)"
                value={criterion.weight.toString()}
                onChangeText={(value) => {
                  const numValue = Number(value);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                    updateCriterion(criterionIndex, "weight", numValue);
                  }
                }}
                type="number"
                placeholder="0-100"
                keyboardType="numeric"
                required
              />

              <ThemedText
                style={[styles.levelsTitle, { color: defaultColors.text }]}
              >
                Niveles de Desempeño:
              </ThemedText>

              {criterion.levels.map((level, levelIndex) => (
                <View
                  key={levelIndex}
                  style={[
                    styles.levelCard,
                    {
                      backgroundColor: defaultColors.background,
                      borderColor: defaultColors.border,
                    },
                  ]}
                >
                  <View style={styles.levelRow}>
                    <View style={styles.levelInputs}>
                      <InputType
                        label={`Descripción ${levelIndex + 1}`}
                        value={level.description}
                        onChangeText={(value) =>
                          updateLevel(
                            criterionIndex,
                            levelIndex,
                            "description",
                            value
                          )
                        }
                        type="text"
                        placeholder="Descripción del nivel"
                        required
                      />
                      <InputType
                        label="Puntuación"
                        value={level.score.toString()}
                        onChangeText={(value) => {
                          const numValue = Number(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            updateLevel(
                              criterionIndex,
                              levelIndex,
                              "score",
                              numValue
                            );
                          }
                        }}
                        type="number"
                        placeholder="0"
                        keyboardType="numeric"
                        required
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {rubric.criteria.length === 0 && (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: defaultColors.background,
                  borderColor: defaultColors.border,
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={48}
                color={defaultColors.secondaryText}
              />
              <ThemedText
                style={[
                  styles.emptyText,
                  { color: defaultColors.secondaryText },
                ]}
              >
                No hay criterios definidos
              </ThemedText>
              <ThemedText
                style={[
                  styles.emptySubtext,
                  { color: defaultColors.secondaryText },
                ]}
              >
                Agrega criterios para evaluar el desempeño
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  criteriaSection: {
    marginTop: 16,
  },
  criteriaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  criterionCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  criterionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  criterionNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    padding: 6,
    borderRadius: 4,
  },
  levelsTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 8,
  },
  levelCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  levelRow: {
    gap: 8,
  },
  levelInputs: {
    gap: 8,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
});
