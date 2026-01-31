import { ValidationFormFields, BaseCheck, BaseValidationConfig } from '../ValidationFormFields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { OperatorSelector } from '@/components/ui/operator-selector';

interface PlantUMLFormFieldsProps {
  correctAnswer: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

interface PlantUMLCheck extends BaseCheck {
  type: string;
  target?: string;
  value?: string;
  operator?: string;
}

interface PlantUMLValidationConfig extends BaseValidationConfig {
  checks?: PlantUMLCheck[];
  checkClassCount?: boolean;
  checkClassCountOperator?: string;
  checkInterfaceCount?: boolean;
  checkInterfaceCountOperator?: string;
  checkParticipantCount?: boolean;
  checkParticipantCountOperator?: string;
  checkRelationshipCount?: boolean;
  checkRelationshipCountOperator?: string;
  checkLoopCount?: boolean;
  checkLoopCountOperator?: string;
  checkAltCount?: boolean;
  checkAltCountOperator?: string;
}

export function PlantUMLFormFields({ correctAnswer, onChange, hasError }: PlantUMLFormFieldsProps) {
  const [config, setConfig] = useState<PlantUMLValidationConfig>(() => {
    try {
      if (correctAnswer && correctAnswer.trim().startsWith('{')) {
        const parsed = JSON.parse(correctAnswer);
        return {
          mode: parsed.mode || 'code',
          code: parsed.code || '',
          checks: parsed.checks || [],
          checkClassCount: parsed.checkClassCount ?? false,
          checkClassCountOperator: parsed.checkClassCountOperator || '=',
          checkInterfaceCount: parsed.checkInterfaceCount ?? false,
          checkInterfaceCountOperator: parsed.checkInterfaceCountOperator || '=',
          checkParticipantCount: parsed.checkParticipantCount ?? false,
          checkParticipantCountOperator: parsed.checkParticipantCountOperator || '=',
          checkRelationshipCount: parsed.checkRelationshipCount ?? false,
          checkRelationshipCountOperator: parsed.checkRelationshipCountOperator || '=',
          checkLoopCount: parsed.checkLoopCount ?? false,
          checkLoopCountOperator: parsed.checkLoopCountOperator || '=',
          checkAltCount: parsed.checkAltCount ?? false,
          checkAltCountOperator: parsed.checkAltCountOperator || '='
        };
      }
    } catch {
      // Ignore error
    }
    return {
      mode: 'code',
      code: correctAnswer || '',
      checks: [],
      checkClassCount: false,
      checkClassCountOperator: '=',
      checkInterfaceCount: false,
      checkInterfaceCountOperator: '=',
      checkParticipantCount: false,
      checkParticipantCountOperator: '=',
      checkRelationshipCount: false,
      checkRelationshipCountOperator: '=',
      checkLoopCount: false,
      checkLoopCountOperator: '=',
      checkAltCount: false,
      checkAltCountOperator: '='
    };
  });

  const handleConfigChange = (newConfig: PlantUMLValidationConfig) => {
    setConfig(newConfig);
    onChange(JSON.stringify(newConfig));
  };

  const checkTypes = [
    { value: 'class_count', label: 'Количество классов' },
    { value: 'interface_count', label: 'Количество интерфейсов' },
    { value: 'participant_count', label: 'Количество участников' },
    { value: 'relationship_count', label: 'Количество связей' },
    { value: 'loop_count', label: 'Количество циклов' },
    { value: 'alt_count', label: 'Количество альтернатив' },
    { value: 'element_exists', label: 'Наличие участника/элемента' },
  ];

  const renderCheckFields = (check: PlantUMLCheck, updateCheck: (updates: Partial<PlantUMLCheck>) => void) => {
    const isCountCheck = check.type !== 'element_exists';

    if (isCountCheck) {
      return (
        <>
          <div className="space-y-2">
            <Label>Оператор</Label>
            <OperatorSelector 
              value={check.operator || '='}
              onChange={(v) => updateCheck({ operator: v })}
            />
          </div>
          <div className="space-y-2">
            <Label className={hasError && !check.value ? "text-destructive" : ""}>
              Значение <span className="text-destructive">*</span>
            </Label>
            <Input 
              type="number"
              value={check.value || ''}
              onChange={(e) => updateCheck({ value: e.target.value })}
              placeholder="Например: 1"
              className={hasError && !check.value ? "border-destructive" : ""}
            />
          </div>
        </>
      );
    }

    return (
      <div className="space-y-2 col-span-2">
        <Label className={hasError && !check.target ? "text-destructive" : ""}>
          Имя участника/элемента <span className="text-destructive">*</span>
        </Label>
        <Input 
          value={check.target || ''}
          onChange={(e) => updateCheck({ target: e.target.value })}
          placeholder="Например: User, OrderController"
          className={hasError && !check.target ? "border-destructive" : ""}
        />
      </div>
    );
  };

  const renderGlobalOptions = (cfg: PlantUMLValidationConfig, updateCfg: (updates: Partial<PlantUMLValidationConfig>) => void) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkParticipantCount" 
          checked={cfg.checkParticipantCount}
          onCheckedChange={(c) => updateCfg({ checkParticipantCount: c as boolean })}
        />
        <Label htmlFor="checkParticipantCount" className="font-normal cursor-pointer">
          Количество участников
        </Label>
        <OperatorSelector 
          value={cfg.checkParticipantCountOperator} 
          onChange={(op) => updateCfg({ checkParticipantCountOperator: op })}
          disabled={!cfg.checkParticipantCount}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkRelationshipCount" 
          checked={cfg.checkRelationshipCount}
          onCheckedChange={(c) => updateCfg({ checkRelationshipCount: c as boolean })}
        />
        <Label htmlFor="checkRelationshipCount" className="font-normal cursor-pointer">
          Количество связей
        </Label>
        <OperatorSelector 
          value={cfg.checkRelationshipCountOperator} 
          onChange={(op) => updateCfg({ checkRelationshipCountOperator: op })}
          disabled={!cfg.checkRelationshipCount}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkLoopCount" 
          checked={cfg.checkLoopCount}
          onCheckedChange={(c) => updateCfg({ checkLoopCount: c as boolean })}
        />
        <Label htmlFor="checkLoopCount" className="font-normal cursor-pointer">
          Количество циклов
        </Label>
        <OperatorSelector 
          value={cfg.checkLoopCountOperator} 
          onChange={(op) => updateCfg({ checkLoopCountOperator: op })}
          disabled={!cfg.checkLoopCount}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkAltCount" 
          checked={cfg.checkAltCount}
          onCheckedChange={(c) => updateCfg({ checkAltCount: c as boolean })}
        />
        <Label htmlFor="checkAltCount" className="font-normal cursor-pointer">
          Количество альтернатив
        </Label>
        <OperatorSelector 
          value={cfg.checkAltCountOperator} 
          onChange={(op) => updateCfg({ checkAltCountOperator: op })}
          disabled={!cfg.checkAltCount}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkClassCount" 
          checked={cfg.checkClassCount}
          onCheckedChange={(c) => updateCfg({ checkClassCount: c as boolean })}
        />
        <Label htmlFor="checkClassCount" className="font-normal cursor-pointer">
          Количество классов
        </Label>
        <OperatorSelector 
          value={cfg.checkClassCountOperator} 
          onChange={(op) => updateCfg({ checkClassCountOperator: op })}
          disabled={!cfg.checkClassCount}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkInterfaceCount" 
          checked={cfg.checkInterfaceCount}
          onCheckedChange={(c) => updateCfg({ checkInterfaceCount: c as boolean })}
        />
        <Label htmlFor="checkInterfaceCount" className="font-normal cursor-pointer">
          Количество интерфейсов
        </Label>
        <OperatorSelector 
          value={cfg.checkInterfaceCountOperator} 
          onChange={(op) => updateCfg({ checkInterfaceCountOperator: op })}
          disabled={!cfg.checkInterfaceCount}
        />
      </div>
    </div>
  );

  return (
    <ValidationFormFields<PlantUMLCheck, PlantUMLValidationConfig>
      config={config}
      onConfigChange={handleConfigChange}
      checkTypes={checkTypes}
      renderCheckFields={renderCheckFields}
      renderGlobalOptions={renderGlobalOptions}
      defaultCheck={{
        id: '',
        type: 'class_count',
        value: '',
        operator: '='
      }}
      hasError={hasError}
      codePlaceholder={`@startuml
actor Пользователь as User
participant "Сервис заказов" as Order
database "База данных" as DB

User -> Order : Создать заказ
activate Order

Order -> DB : Сохранить заказ
activate DB
DB --> Order : Заказ сохранен
deactivate DB

Order --> User : Заказ создан
deactivate Order
@enduml
`}
      codeHelperText="Вставьте код PlantUML диаграммы (Например, Sequence Diagram)"
      codeLabel="PlantUML код"
    />
  );
}




