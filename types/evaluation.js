// Enums para tipos de evaluación
export const EvaluationToolType = {
  RUBRIC: 1,
  CHECKLIST: 2,
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

// Funciones auxiliares
export const createEmptyRubric = () => ({
  title: "Rúbrica de Evaluación",
  criteria: [],
});

export const createEmptyChecklist = () => ({
  title: "Lista de Cotejo",
  items: [],
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
