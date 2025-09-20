import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import { createEmptyAutoEvaluationCriterion } from '../types/evaluation';

const AutoEvaluationBuilder = ({ initialData, onChange }) => {
  const colorScheme = useColorScheme();
  
  // Definir colores según el tema
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  const theme = {
    background: backgroundColor,
    text: textColor,
    card: colorScheme === 'dark' ? '#2A2A2A' : '#FAFAFA',
    border: colorScheme === 'dark' ? '#404040' : '#E0E0E0',
    surface: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    subtext: colorScheme === 'dark' ? '#A0A0A0' : '#6C757D',
    primary: '#17A2B8',
    danger: '#FF6B6B',
    success: '#10B981',
    empty: colorScheme === 'dark' ? '#2A2A2A' : '#F8F9FA',
    inputBg: colorScheme === 'dark' ? '#2A2A2A' : '#FFFFFF',
    inputBorder: colorScheme === 'dark' ? '#404040' : '#D1D5DB',
    inputText: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
  };

  const [autoEvaluation, setAutoEvaluation] = useState(() => {
    if (initialData) {
      return {
        title: initialData.title || 'Autoevaluación',
        dimensions: initialData.dimensions || [
          { name: 'SER', criteria: [] },
          { name: 'DECIDIR', criteria: [] }
        ]
      };
    }
    return {
      title: 'Autoevaluación',
      dimensions: [
        { name: 'SER', criteria: [] },
        { name: 'DECIDIR', criteria: [] }
      ]
    };
  });

  const updateAutoEvaluation = (updates) => {
    const updated = { ...autoEvaluation, ...updates };
    setAutoEvaluation(updated);
    onChange(updated);
  };

  const handleAddCriterion = (dimensionIndex) => {
    const newCriterion = createEmptyAutoEvaluationCriterion();
    const updatedDimensions = [...autoEvaluation.dimensions];
    updatedDimensions[dimensionIndex].criteria.push(newCriterion);
    updateAutoEvaluation({ dimensions: updatedDimensions });
  };

  const handleRemoveCriterion = (dimensionIndex, criterionIndex) => {
    Alert.alert(
      "Eliminar Criterio",
      "¿Estás seguro de que quieres eliminar este criterio?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            const updatedDimensions = [...autoEvaluation.dimensions];
            updatedDimensions[dimensionIndex].criteria.splice(criterionIndex, 1);
            updateAutoEvaluation({ dimensions: updatedDimensions });
          }
        }
      ]
    );
  };

  const handleCriterionChange = (dimensionIndex, criterionIndex, description) => {
    const updatedDimensions = [...autoEvaluation.dimensions];
    updatedDimensions[dimensionIndex].criteria[criterionIndex].description = description;
    updateAutoEvaluation({ dimensions: updatedDimensions });
  };

  const handleLevelChange = (dimensionIndex, criterionIndex, levelIndex, field, value) => {
    const updatedDimensions = [...autoEvaluation.dimensions];
    const level = updatedDimensions[dimensionIndex].criteria[criterionIndex].levels[levelIndex];
    
    if (field === 'name') {
      level.name = value;
    } else if (field === 'value') {
      level.value = parseInt(value) || 0;
    }
    
    updateAutoEvaluation({ dimensions: updatedDimensions });
  };

  const handleAddLevel = (dimensionIndex, criterionIndex) => {
    const updatedDimensions = [...autoEvaluation.dimensions];
    const newLevel = { name: '', value: 0, selected: false };
    updatedDimensions[dimensionIndex].criteria[criterionIndex].levels.push(newLevel);
    updateAutoEvaluation({ dimensions: updatedDimensions });
  };

  const handleRemoveLevel = (dimensionIndex, criterionIndex, levelIndex) => {
    const updatedDimensions = [...autoEvaluation.dimensions];
    if (updatedDimensions[dimensionIndex].criteria[criterionIndex].levels.length > 1) {
      updatedDimensions[dimensionIndex].criteria[criterionIndex].levels.splice(levelIndex, 1);
      updateAutoEvaluation({ dimensions: updatedDimensions });
    } else {
      Alert.alert("Error", "Debe haber al menos un nivel por criterio");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.titleSection}>
        <ThemedText style={styles.titleLabel}>Título de la Autoevaluación</ThemedText>
        <TextInput
          style={[styles.titleInput, {
            backgroundColor: theme.inputBg,
            borderColor: theme.inputBorder,
            color: theme.inputText
          }]}
          placeholder="Título de la autoevaluación"
          placeholderTextColor={theme.subtext}
          value={autoEvaluation.title}
          onChangeText={(text) => updateAutoEvaluation({ title: text })}
          multiline
        />
      </View>

      {autoEvaluation.dimensions.map((dimension, dimensionIndex) => (
        <View key={dimension.name} style={[styles.dimensionContainer, {
          backgroundColor: theme.card,
          borderColor: theme.border
        }]}>
          <View style={styles.dimensionHeader}>
            <ThemedText style={styles.dimensionTitle}>
              {dimension.name}
            </ThemedText>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => handleAddCriterion(dimensionIndex)}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Añadir Criterio</Text>
            </TouchableOpacity>
          </View>

          {dimension.criteria.map((criterion, criterionIndex) => (
            <View key={criterionIndex} style={[styles.criterionContainer, {
              backgroundColor: theme.surface,
              borderColor: theme.border
            }]}>
              <View style={styles.criterionHeader}>
                <TextInput
                  style={[styles.criterionInput, {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText
                  }]}
                  placeholder="Descripción del criterio"
                  placeholderTextColor={theme.subtext}
                  value={criterion.description}
                  onChangeText={(text) => handleCriterionChange(dimensionIndex, criterionIndex, text)}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: '#FEF2F2' }]}
                  onPress={() => handleRemoveCriterion(dimensionIndex, criterionIndex)}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                </TouchableOpacity>
              </View>

              <View style={styles.levelsSection}>
                <ThemedText style={styles.levelsLabel}>Niveles:</ThemedText>
                {criterion.levels.map((level, levelIndex) => (
                  <View key={levelIndex} style={[styles.levelRow, {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder
                  }]}>
                    <TextInput
                      style={[styles.levelNameInput, {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                        color: theme.inputText
                      }]}
                      placeholder="Nivel"
                      placeholderTextColor={theme.subtext}
                      value={level.name}
                      onChangeText={(text) => handleLevelChange(dimensionIndex, criterionIndex, levelIndex, 'name', text)}
                    />
                    <TextInput
                      style={[styles.levelValueInput, {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                        color: theme.inputText
                      }]}
                      placeholder="Valor"
                      placeholderTextColor={theme.subtext}
                      value={level.value.toString()}
                      onChangeText={(text) => handleLevelChange(dimensionIndex, criterionIndex, levelIndex, 'value', text)}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={[styles.addLevelButton, { backgroundColor: '#F0FDF4' }]}
                      onPress={() => handleAddLevel(dimensionIndex, criterionIndex)}
                    >
                      <Ionicons name="add" size={16} color={theme.success} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.removeLevelButton, { backgroundColor: '#FEF2F2' }]}
                      onPress={() => handleRemoveLevel(dimensionIndex, criterionIndex, levelIndex)}
                    >
                      <Ionicons name="remove" size={16} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {dimension.criteria.length === 0 && (
            <View style={[styles.emptyState, {
              backgroundColor: theme.empty,
              borderColor: theme.border
            }]}>
              <ThemedText style={[styles.emptyStateText, { color: theme.subtext }]}>
                No hay criterios agregados para {dimension.name}
              </ThemedText>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 50,
  },
  dimensionContainer: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dimensionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  criterionContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  criterionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    marginRight: 8,
    minHeight: 40,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
  },
  levelsSection: {
    marginTop: 8,
  },
  levelsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  levelNameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    marginRight: 8,
  },
  levelValueInput: {
    width: 60,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    marginRight: 8,
  },
  addLevelButton: {
    padding: 6,
    borderRadius: 4,
    marginRight: 4,
  },
  removeLevelButton: {
    padding: 6,
    borderRadius: 4,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AutoEvaluationBuilder;