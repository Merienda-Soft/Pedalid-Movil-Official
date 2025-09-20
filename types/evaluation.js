// Enums para tipos de evaluación
export const EvaluationToolType = {
  RUBRIC: 1,
  CHECKLIST: 2,
  AUTO_EVALUATION: 3,
};

// Valores por defecto para rúbricas
export const DEFAULT_RUBRIC_LEVELS = [
  { description: "Excelente", score: 5 },
  { description: "Bueno", score: 3 },
  { description: "Regular", score: 1 },
];

// Funciones de validación
export const validateRubricData = (data) => {
  if (!data || !data.title || !data.criteria) return false;
  if (data.criteria.length === 0) return false;

  return data.criteria.every(
    (criterion) =>
      criterion.name &&
      criterion.weight > 0 &&
      criterion.levels &&
      criterion.levels.length > 0
  );
};

export const validateChecklistData = (data) => {
  if (!data || !data.title || !data.items) return false;
  if (data.items.length === 0) return false;

  return data.items.every((item) => item.description);
};

export const validateAutoEvaluationData = (data) => {
  if (!data || !data.title || !data.dimensions) return false;
  if (data.dimensions.length === 0) return false;

  return data.dimensions.every(
    (dimension) =>
      dimension.name &&
      dimension.criteria &&
      dimension.criteria.length > 0 &&
      dimension.criteria.every(
        (criterion) =>
          criterion.description &&
          criterion.levels &&
          criterion.levels.length > 0 &&
          criterion.levels.every((level) => level.name && level.value >= 0)
      )
  );
};

// Funciones auxiliares
export const createEmptyRubric = () => ({
  title: "Rúbrica de Evaluación",
  criteria: [],
});

export const createEmptyChecklist = () => ({
  title: "Lista de Cotejo",
  items: [],
});

export const createEmptyAutoEvaluation = () => ({
  title: "Autoevaluación",
  dimensions: [
    {
      name: "SER",
      criteria: [],
    },
    {
      name: "DECIDIR",
      criteria: [],
    },
  ],
});

export const createEmptyRubricCriterion = () => ({
  name: "",
  weight: 0,
  selected: 0,
  levels: [...DEFAULT_RUBRIC_LEVELS],
});

export const createEmptyChecklistItem = () => ({
  description: "",
  required: true,
  checked: false,
});

export const createEmptyAutoEvaluationCriterion = () => ({
  description: "",
  levels: [
    { name: "Si", value: 3, selected: false },
    { name: "A veces", value: 2, selected: false },
    { name: "No", value: 1, selected: false },
  ],
});

// Helper para calcular puntaje de autoevaluación
export const calculateAutoEvaluationScore = (data) => {
  let total = 0;
  
  for (const dimension of data.dimensions) {
    if (!dimension.criteria.length) continue;
    
    const dimensionWeight = 50; // Cada dimensión vale 50%
    const criterionWeight = dimensionWeight / dimension.criteria.length; // Dividir entre criterios
    
    for (const criterion of dimension.criteria) {
      const selectedLevel = criterion.levels.find(level => level.selected);
      if (selectedLevel) {
        // El valor del nivel se multiplica por el peso del criterio
        const maxValue = Math.max(...criterion.levels.map(l => l.value));
        const levelScore = (selectedLevel.value / maxValue) * criterionWeight;
        total += levelScore;
      }
    }
  }
  
  return Math.round(total);
};
