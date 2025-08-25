import { StyleSheet, TouchableOpacity, View } from "react-native";
import { EvaluationToolType } from "../types/evaluation";
import { ThemedText } from "./ThemedText";

export default function EvaluationToolSelector({
  selectedType,
  onChange,
  colors = {},
}) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Tipo de Evaluación</ThemedText>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            selectedType === EvaluationToolType.RUBRIC && styles.buttonSelected,
          ]}
          onPress={() => onChange(EvaluationToolType.RUBRIC)}
        >
          <ThemedText
            style={[
              styles.buttonText,
              selectedType === EvaluationToolType.RUBRIC &&
                styles.buttonTextSelected,
            ]}
          >
            Rúbrica
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            selectedType === EvaluationToolType.CHECKLIST &&
              styles.buttonSelected,
          ]}
          onPress={() => onChange(EvaluationToolType.CHECKLIST)}
        >
          <ThemedText
            style={[
              styles.buttonText,
              selectedType === EvaluationToolType.CHECKLIST &&
                styles.buttonTextSelected,
            ]}
          >
            Lista de Cotejo
          </ThemedText>
        </TouchableOpacity>

        {selectedType && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onChange(null)}
          >
            <ThemedText style={styles.clearButtonText}>Limpiar</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F8F9FA",
  },
  buttonSelected: {
    backgroundColor: "#17A2B8",
    borderColor: "#17A2B8",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  buttonTextSelected: {
    color: "#FFFFFF",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  clearButtonText: {
    fontSize: 12,
    color: "#6C757D",
  },
});
