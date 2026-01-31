import { MODULE_SLUGS } from '@/const';

export const validateLessonForm = (lessonFormData: any, moduleType: string) => {
  const newErrors: Record<string, boolean> = {};
  if (!lessonFormData.title.trim()) newErrors.title = true;
  if (!lessonFormData.content.trim()) newErrors.content = true;
  
  if (lessonFormData.type === 'practice') {
    if (moduleType === MODULE_SLUGS.ERD) {
      try {
        const config = JSON.parse(lessonFormData.correctAnswer || '{}');
        if (config.mode === 'manual') {
          if (!config.checks || config.checks.length === 0) {
            newErrors.correctAnswer = true;
          } else {
            const hasIncompleteChecks = config.checks.some((c: any) => {
              if (c.type === 'table_exists') return !c.target;
              if (c.type === 'table_count') return !c.value;
              if (c.type === 'relationship_count') return !c.value;
              if (c.type === 'column_exists') return !c.target;
              if (c.type === 'column_type') return !c.target || !c.value;
              return false;
            });
            if (hasIncompleteChecks) {
              newErrors.correctAnswer = true;
            }
          }
        } else {
          // Code mode
          if (!config.code || !config.code.trim()) {
            newErrors.correctAnswer = true;
          }
          const isAnySelected = config.checkTableNames || config.checkTableCount || config.checkColumnNames || config.checkColumnCount || config.checkRelationshipCount;
          if (!isAnySelected) {
            newErrors.correctAnswer = true;
          }
        }
      } catch {
        // If not valid JSON or empty
        if (!lessonFormData.correctAnswer.trim()) {
          newErrors.correctAnswer = true;
        }
      }
    } else if (moduleType === MODULE_SLUGS.BPMN) {
      try {
        const config = JSON.parse(lessonFormData.correctAnswer || '{}');
        if (config.mode === 'manual') {
          if (!config.checks || config.checks.length === 0) {
            newErrors.correctAnswer = true;
          } else {
            const hasIncompleteChecks = config.checks.some((c: any) => {
              if (c.type === 'node_exists') return !c.target;
              if (c.type === 'node_count') return !c.value;
              if (c.type === 'edge_count') return !c.value;
              return false;
            });
            if (hasIncompleteChecks) {
              newErrors.correctAnswer = true;
            }
          }
        } else {
          // Code mode
          if (!config.code || !config.code.trim()) {
            newErrors.correctAnswer = true;
          }
          const isAnySelected = config.checkNodeNames || config.checkNodeCount || config.checkEdgeCount;
          if (!isAnySelected) {
            newErrors.correctAnswer = true;
          }
        }
      } catch {
        if (!lessonFormData.correctAnswer.trim()) {
          newErrors.correctAnswer = true;
        }
      }
    } else if (moduleType === MODULE_SLUGS.PLANTUML) {
      try {
        const config = JSON.parse(lessonFormData.correctAnswer || '{}');
        if (config.mode === 'manual') {
          if (!config.checks || config.checks.length === 0) {
            newErrors.correctAnswer = true;
          } else {
            const hasIncompleteChecks = config.checks.some((c: any) => {
              if (c.type === 'element_exists') return !c.target;
              return !c.value;
            });
            if (hasIncompleteChecks) {
              newErrors.correctAnswer = true;
            }
          }
        } else {
          // Code mode
          if (!config.code || !config.code.trim()) {
            newErrors.correctAnswer = true;
          }
          const isAnySelected = config.checkClassCount || config.checkInterfaceCount || config.checkParticipantCount || config.checkRelationshipCount || config.checkLoopCount || config.checkAltCount;
          if (!isAnySelected) {
            newErrors.correctAnswer = true;
          }
        }
      } catch {
        if (!lessonFormData.correctAnswer.trim()) {
          newErrors.correctAnswer = true;
        }
      }
    } else if (moduleType === MODULE_SLUGS.SWAGGER) {
      try {
        const config = JSON.parse(lessonFormData.correctAnswer || '{}');
        if (config.mode === 'manual') {
          if (!config.checks || config.checks.length === 0) {
            newErrors.correctAnswer = true;
          } else {
            const hasIncompleteChecks = config.checks.some((c: any) => {
              if (c.type === 'path_exists' || c.type === 'operation_exists') return !c.target;
              return !c.value;
            });
            if (hasIncompleteChecks) {
              newErrors.correctAnswer = true;
            }
          }
        } else {
          // Code mode
          if (!config.code || !config.code.trim()) {
            newErrors.correctAnswer = true;
          }
          const isAnySelected = config.checkPathCount || config.checkSchemaCount || config.checkEndpointCount || config.checkPathNames || config.checkOperationNames;
          if (!isAnySelected) {
            newErrors.correctAnswer = true;
          }
        }
      } catch {
        if (!lessonFormData.correctAnswer.trim()) {
          newErrors.correctAnswer = true;
        }
      }
    } else if (!lessonFormData.correctAnswer.trim()) {
      newErrors.correctAnswer = true;
    }
  }
  
  return newErrors;
};
