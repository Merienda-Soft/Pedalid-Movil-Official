import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import { EvaluationToolType } from "../types/evaluation";
import { ThemedText } from "./ThemedText";
import { useThemeColor } from "../hooks/useThemeColor";

export default function EvaluationToolSelector({
  selectedType,
  selectedDimension,
  onChange,
  colors = {},
}) {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  const theme = {
    background: backgroundColor,
    text: textColor,
    button: colorScheme === 'dark' ? '#2A2A2A' : '#F8F9FA',
    buttonBorder: colorScheme === 'dark' ? '#404040' : '#E0E0E0',
    buttonText: colorScheme === 'dark' ? '#FFFFFF' : '#333333',
    primary: '#17A2B8',
    clear: colorScheme === 'dark' ? '#FF6B6B' : '#FF5252',
  };

  // Determinar si es autoevaluación
  const isAutoEvaluation = selectedDimension === '5';

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Tipo de Evaluación</ThemedText>
      <View style={styles.buttonContainer}>
        {/* Para autoevaluación, solo mostrar opción de autoevaluación */}
        {isAutoEvaluation ? (
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: selectedType === EvaluationToolType.AUTO_EVALUATION ? theme.primary : theme.button,
                borderColor: selectedType === EvaluationToolType.AUTO_EVALUATION ? theme.primary : theme.buttonBorder,
              }
            ]}
            onPress={() => onChange(EvaluationToolType.AUTO_EVALUATION)}
          >
            <ThemedText
              style={[
                styles.buttonText,
                {
                  color: selectedType === EvaluationToolType.AUTO_EVALUATION ? '#FFFFFF' : theme.buttonText,
                }
              ]}
            >
              Autoevaluación
            </ThemedText>
          </TouchableOpacity>
        ) : (
          // Para otras dimensiones, mostrar rúbrica y lista de cotejo
          <>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: selectedType === EvaluationToolType.RUBRIC ? theme.primary : theme.button,
                  borderColor: selectedType === EvaluationToolType.RUBRIC ? theme.primary : theme.buttonBorder,
                }
              ]}
              onPress={() => onChange(EvaluationToolType.RUBRIC)}
            >
              <ThemedText
                style={[
                  styles.buttonText,
                  {
                    color: selectedType === EvaluationToolType.RUBRIC ? '#FFFFFF' : theme.buttonText,
                  }
                ]}
              >
                Rúbrica
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: selectedType === EvaluationToolType.CHECKLIST ? theme.primary : theme.button,
                  borderColor: selectedType === EvaluationToolType.CHECKLIST ? theme.primary : theme.buttonBorder,
                }
              ]}
              onPress={() => onChange(EvaluationToolType.CHECKLIST)}
            >
              <ThemedText
                style={[
                  styles.buttonText,
                  {
                    color: selectedType === EvaluationToolType.CHECKLIST ? '#FFFFFF' : theme.buttonText,
                  }
                ]}
              >
                Lista de Cotejo
              </ThemedText>
            </TouchableOpacity>
          </>
        )}

        {selectedType && (
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: theme.clear }]}
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
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});
