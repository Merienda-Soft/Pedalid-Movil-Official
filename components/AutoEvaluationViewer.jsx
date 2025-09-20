import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import { calculateAutoEvaluationScore } from '../types/evaluation';

const AutoEvaluationViewer = ({ 
  methodology, 
  onEvaluationChange,
  onScoreChange,
  onCompletionChange,
  disabled = false 
}) => {
  const colorScheme = useColorScheme();
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
    success: '#10B981',
    warning: '#F59E0B',
    selected: colorScheme === 'dark' ? '#1E40AF' : '#3B82F6',
    selectedBorder: colorScheme === 'dark' ? '#1D4ED8' : '#2563EB',
    hover: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
    progress: '#3B82F6',
    progressBg: colorScheme === 'dark' ? '#374151' : '#D1D5DB',
  };

  const [autoEvaluationState, setAutoEvaluationState] = useState(methodology);
  const [expandedDimensions, setExpandedDimensions] = useState([]);

  // Inicialización cuando cambia methodology
  useEffect(() => {
    if (methodology) {
      setAutoEvaluationState(methodology);
      setExpandedDimensions(methodology.dimensions.map(() => false));
    }
  }, [methodology]);

  // Calcular score y enviar cambios cuando cambia el estado
  useEffect(() => {
    if (!autoEvaluationState) return;
    
    const score = calculateAutoEvaluationScore(autoEvaluationState);
    const completed = isCompleted();
    
    if (onScoreChange) {
      onScoreChange(score);
    }

    if (onCompletionChange) {
      onCompletionChange(completed);
    }

    if (onEvaluationChange) {
      onEvaluationChange(autoEvaluationState, score);
    }
  }, [autoEvaluationState, onEvaluationChange, onScoreChange, onCompletionChange]);

  const toggleDimensionExpansion = useCallback((dimensionIndex) => {
    setExpandedDimensions(prev => {
      const newExpanded = [...prev];
      newExpanded[dimensionIndex] = !newExpanded[dimensionIndex];
      return newExpanded;
    });
  }, []);

  const handleLevelSelect = useCallback((dimensionIndex, criterionIndex, levelIndex) => {
    if (disabled) return;

    setAutoEvaluationState(prevState => {
      const updatedState = { ...prevState };
      const dimension = { ...updatedState.dimensions[dimensionIndex] };
      const criterion = { ...dimension.criteria[criterionIndex] };
      
      // Crear nueva copia de los niveles
      const newLevels = criterion.levels.map((level, idx) => ({
        ...level,
        selected: idx === levelIndex
      }));
      
      // Actualizar el criterio con los nuevos niveles
      const newCriterion = { ...criterion, levels: newLevels };
      
      // Actualizar la dimensión con el nuevo criterio
      const newCriteria = [...dimension.criteria];
      newCriteria[criterionIndex] = newCriterion;
      const newDimension = { ...dimension, criteria: newCriteria };
      
      // Actualizar las dimensiones
      const newDimensions = [...updatedState.dimensions];
      newDimensions[dimensionIndex] = newDimension;
      
      return { ...updatedState, dimensions: newDimensions };
    });
  }, [disabled]);

  const getDimensionScore = (dimensionIndex) => {
    const dimension = autoEvaluationState.dimensions[dimensionIndex];
    if (!dimension.criteria.length) return 0;
    
    const criterionWeight = 50 / dimension.criteria.length; // 50% dividido entre criterios
    let dimensionTotal = 0;
    
    for (const criterion of dimension.criteria) {
      const selectedLevel = criterion.levels.find(level => level.selected);
      if (selectedLevel) {
        const maxValue = Math.max(...criterion.levels.map(l => l.value));
        const levelScore = (selectedLevel.value / maxValue) * criterionWeight;
        dimensionTotal += levelScore;
      }
    }
    
    return Math.round(dimensionTotal);
  };

  const getTotalScore = () => {
    return calculateAutoEvaluationScore(autoEvaluationState);
  };

  const isCompleted = () => {
    return autoEvaluationState.dimensions.every(dimension =>
      dimension.criteria.every(criterion =>
        criterion.levels.some(level => level.selected)
      )
    );
  };

  const getDimensionProgress = (dimensionIndex) => {
    const dimension = autoEvaluationState.dimensions[dimensionIndex];
    if (!dimension.criteria.length) return 0;
    
    const completedCriteria = dimension.criteria.filter(criterion =>
      criterion.levels.some(level => level.selected)
    ).length;
    
    return (completedCriteria / dimension.criteria.length) * 100;
  };

  if (!autoEvaluationState) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
          No hay autoevaluación disponible
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Instrucciones */}
      {!disabled && (
        <View style={[styles.instructionsCard, { 
          backgroundColor: theme.card,
          borderColor: theme.border 
        }]}>
          <ThemedText style={[styles.instructionsText, { color: theme.subtext }]}>
            <ThemedText style={styles.instructionsBold}>Instrucciones:</ThemedText> Evalúa cada criterio seleccionando el nivel que mejor describa tu desempeño.
          </ThemedText>
        </View>
      )}

      {/* Título y puntaje total */}
      <View style={[styles.headerCard, { 
        backgroundColor: theme.surface,
        borderColor: theme.border 
      }]}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          {autoEvaluationState.title}
        </ThemedText>
        <View style={styles.scoreContainer}>
          <ThemedText style={[styles.scoreLabel, { color: theme.subtext }]}>
            Puntaje Total:
          </ThemedText>
          <ThemedText style={[styles.scoreValue, { color: theme.primary }]}>
            {getTotalScore()}/100
          </ThemedText>
        </View>
      </View>

      {/* Dimensiones */}
      <View style={styles.dimensionsContainer}>
        {autoEvaluationState.dimensions.map((dimension, dimensionIndex) => (
          <View key={dimension.name} style={[styles.dimensionCard, {
            backgroundColor: theme.surface,
            borderColor: theme.border
          }]}>
            {/* Header clickeable de la dimensión */}
            <TouchableOpacity
              style={[styles.dimensionHeader, { 
                backgroundColor: theme.card 
              }]}
              onPress={() => toggleDimensionExpansion(dimensionIndex)}
              activeOpacity={0.7}
            >
              <View style={styles.dimensionHeaderContent}>
                <ThemedText style={[styles.dimensionTitle, { color: theme.text }]}>
                  {dimension.name}
                </ThemedText>
                <ThemedText style={[styles.dimensionScore, { color: theme.primary }]}>
                  ({getDimensionScore(dimensionIndex)}/50)
                </ThemedText>
              </View>
              <View style={styles.dimensionHeaderRight}>
                <Ionicons 
                  name={expandedDimensions[dimensionIndex] ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.subtext} 
                />
              </View>
            </TouchableOpacity>
            
            {/* Indicador de progreso cuando está colapsado */}
            {!expandedDimensions[dimensionIndex] && (
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <View style={[styles.progressBar, { backgroundColor: theme.progressBg }]}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          backgroundColor: theme.progress,
                          width: `${Math.min(100, getDimensionProgress(dimensionIndex))}%`
                        }
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.progressText, { color: theme.subtext }]}>
                    {dimension.criteria.filter(c => c.levels.some(l => l.selected)).length}/{dimension.criteria.length}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Contenido expandible */}
            {expandedDimensions[dimensionIndex] && (
              <View style={styles.dimensionContent}>
                {dimension.criteria.map((criterion, criterionIndex) => (
                  <View key={criterionIndex} style={[styles.criterionCard, {
                    backgroundColor: theme.card,
                    borderColor: theme.border
                  }]}>
                    <ThemedText style={[styles.criterionTitle, { color: theme.text }]}>
                      {criterion.description}
                    </ThemedText>
                    
                    {/* Niveles del criterio */}
                    <View style={styles.levelsContainer}>
                      {criterion.levels.map((level, levelIndex) => {
                        const isSelected = level.selected;
                        return (
                          <TouchableOpacity
                            key={levelIndex}
                            style={[
                              styles.levelOption,
                              {
                                backgroundColor: isSelected ? theme.selected : theme.surface,
                                borderColor: isSelected ? theme.selectedBorder : theme.border,
                              }
                            ]}
                            onPress={() => handleLevelSelect(dimensionIndex, criterionIndex, levelIndex)}
                            disabled={disabled}
                            activeOpacity={0.7}
                          >
                            <View style={styles.levelContent}>
                              <View style={[
                                styles.radioButton,
                                {
                                  borderColor: isSelected ? theme.selectedBorder : theme.border,
                                  backgroundColor: isSelected ? theme.selectedBorder : 'transparent'
                                }
                              ]}>
                                {isSelected && (
                                  <View style={styles.radioInner} />
                                )}
                              </View>
                              <View style={styles.levelTextContainer}>
                                <ThemedText style={[
                                  styles.levelName,
                                  { 
                                    color: isSelected ? '#FFFFFF' : theme.text,
                                    fontWeight: isSelected ? '600' : '400'
                                  }
                                ]}>
                                  {level.name}
                                </ThemedText>
                                <ThemedText style={[
                                  styles.levelValue,
                                  { 
                                    color: isSelected ? '#E5E7EB' : theme.subtext,
                                    fontSize: 12
                                  }
                                ]}>
                                  Valor: {level.value}
                                </ThemedText>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Estado de completitud */}
      <View style={[styles.statusCard, { 
        backgroundColor: isCompleted() ? '#F0FDF4' : '#FEF3C7',
        borderColor: isCompleted() ? '#10B981' : '#F59E0B'
      }]}>
        <View style={styles.statusContent}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: isCompleted() ? theme.success : theme.warning }
          ]} />
          <ThemedText style={[
            styles.statusText,
            { color: isCompleted() ? '#065F46' : '#92400E' }
          ]}>
            {isCompleted() 
              ? 'Autoevaluación completada' 
              : 'Faltan criterios por evaluar'}
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  instructionsCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  instructionsBold: {
    fontWeight: '600',
  },
  headerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 14,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  dimensionsContainer: {
    gap: 16,
  },
  dimensionCard: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  dimensionHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimensionHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dimensionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dimensionScore: {
    fontSize: 16,
    fontWeight: '500',
  },
  dimensionHeaderRight: {
    marginLeft: 12,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    minWidth: 40,
    textAlign: 'right',
  },
  dimensionContent: {
    padding: 16,
    gap: 16,
  },
  criterionCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  criterionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  levelsContainer: {
    gap: 8,
  },
  levelOption: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  levelTextContainer: {
    flex: 1,
  },
  levelName: {
    fontSize: 14,
    fontWeight: '500',
  },
  levelValue: {
    fontSize: 12,
    marginTop: 2,
  },
  statusCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AutoEvaluationViewer;