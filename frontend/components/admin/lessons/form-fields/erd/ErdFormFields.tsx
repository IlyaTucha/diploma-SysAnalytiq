import { ValidationFormFields, BaseCheck, BaseValidationConfig } from '../ValidationFormFields';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { OperatorSelector } from '@/components/ui/operator-selector';

interface ErdFormFieldsProps {
  correctAnswer: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

type CheckType = 'table_count' | 'relationship_count' | 'table_exists' | 'column_exists' | 'column_type';

interface ErdCheck extends BaseCheck {
  type: CheckType;
  target?: string;
  value?: string;
  operator?: string;
}

interface ErdValidationConfig extends BaseValidationConfig {
  checks?: ErdCheck[];
  checkTableNames?: boolean;
  checkTableCount?: boolean;
  checkTableCountOperator?: string;
  checkColumnNames?: boolean;
  checkColumnCount?: boolean;
  checkColumnCountOperator?: string;
  checkColumnTypes?: boolean;
  checkRelationshipCount?: boolean;
  checkRelationshipCountOperator?: string;
}

export function ErdFormFields({ correctAnswer, onChange, hasError }: ErdFormFieldsProps) {
  const [config, setConfig] = useState<ErdValidationConfig>(() => {
    try {
      if (correctAnswer && correctAnswer.trim().startsWith('{')) {
        const parsed = JSON.parse(correctAnswer);
        return {
          mode: parsed.mode || 'code',
          code: parsed.code || '',
          checks: parsed.checks || [],
          checkTableNames: parsed.checkTableNames ?? false,
          checkTableCount: parsed.checkTableCount ?? false,
          checkTableCountOperator: parsed.checkTableCountOperator || '=',
          checkColumnNames: parsed.checkColumnNames ?? false,
          checkColumnCount: parsed.checkColumnCount ?? false,
          checkColumnCountOperator: parsed.checkColumnCountOperator || '=',
          checkColumnTypes: parsed.checkColumnTypes ?? false,
          checkRelationshipCount: parsed.checkRelationshipCount ?? false,
          checkRelationshipCountOperator: parsed.checkRelationshipCountOperator || '='
        };
      }
    } catch {
      // Ignore error
    }
    return {
      mode: 'code',
      code: correctAnswer || '',
      checks: [],
      checkTableNames: false,
      checkTableCount: false,
      checkTableCountOperator: '=',
      checkColumnNames: false,
      checkColumnCount: false,
      checkColumnCountOperator: '=',
      checkColumnTypes: false,
      checkRelationshipCount: false,
      checkRelationshipCountOperator: '='
    };
  });

  const handleConfigChange = (newConfig: ErdValidationConfig) => {
    setConfig(newConfig);
    onChange(JSON.stringify(newConfig));
  };

  const checkTypes = [
    { value: 'table_exists', label: 'Наличие таблицы' },
    { value: 'column_exists', label: 'Наличие атрибута' },
    { value: 'column_type', label: 'Тип атрибута' },
    { value: 'table_count', label: 'Количество таблиц' },
    { value: 'relationship_count', label: 'Количество связей' },
  ];

  const renderCheckFields = (check: ErdCheck, updateCheck: (updates: Partial<ErdCheck>) => void) => {
    const isCountCheck = ['table_count', 'relationship_count'].includes(check.type);
    
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
              placeholder="Например: 5"
              className={hasError && !check.value ? "border-destructive" : ""}
            />
          </div>
        </>
      );
    }

    if (check.type === 'column_type') {
      return (
        <>
          <div className="space-y-2">
            <Label className={hasError && !check.target ? "text-destructive" : ""}>
              Значение (Таблица.Атрибут) <span className="text-destructive">*</span>
            </Label>
            <Input 
              value={check.target || ''}
              onChange={(e) => updateCheck({ target: e.target.value })}
              placeholder="Например: users.email"
              className={hasError && !check.target ? "border-destructive" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Ожидаемый тип</Label>
            <Input 
              value={check.value || ''}
              onChange={(e) => updateCheck({ value: e.target.value })}
              placeholder="Например: varchar"
            />
          </div>
        </>
      );
    }

    return (
      <div className="space-y-2 col-span-2">
        <Label className={hasError && !check.target ? "text-destructive" : ""}>
          Значение <span className="text-destructive">*</span>
        </Label>
        <Input 
          value={check.target || ''}
          onChange={(e) => updateCheck({ target: e.target.value })}
          placeholder={check.type === 'column_exists' ? "Например: users.id" : "Например: users"}
          className={hasError && !check.target ? "border-destructive" : ""}
        />
      </div>
    );
  };

  const renderGlobalOptions = (cfg: ErdValidationConfig, updateCfg: (updates: Partial<ErdValidationConfig>) => void) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkTableCount" 
          checked={cfg.checkTableCount}
          onCheckedChange={(c) => updateCfg({ checkTableCount: c as boolean })}
        />
        <Label htmlFor="checkTableCount" className="font-normal cursor-pointer">
          Количество таблиц
        </Label>
        <OperatorSelector 
          value={cfg.checkTableCountOperator} 
          onChange={(op) => updateCfg({ checkTableCountOperator: op })}
          disabled={!cfg.checkTableCount}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkTableNames" 
          checked={cfg.checkTableNames}
          onCheckedChange={(c) => updateCfg({ checkTableNames: c as boolean })}
        />
        <Label htmlFor="checkTableNames" className="font-normal cursor-pointer">Названия таблиц</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkColumnCount" 
          checked={cfg.checkColumnCount}
          onCheckedChange={(c) => updateCfg({ checkColumnCount: c as boolean })}
        />
        <Label htmlFor="checkColumnCount" className="font-normal cursor-pointer">
          Количество атрибутов
        </Label>
        <OperatorSelector 
          value={cfg.checkColumnCountOperator} 
          onChange={(op) => updateCfg({ checkColumnCountOperator: op })}
          disabled={!cfg.checkColumnCount}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkColumnNames" 
          checked={cfg.checkColumnNames}
          onCheckedChange={(c) => updateCfg({ checkColumnNames: c as boolean })}
        />
        <Label htmlFor="checkColumnNames" className="font-normal cursor-pointer">Названия атрибутов</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkColumnTypes" 
          checked={cfg.checkColumnTypes}
          onCheckedChange={(c) => updateCfg({ checkColumnTypes: c as boolean })}
        />
        <Label htmlFor="checkColumnTypes" className="font-normal cursor-pointer">Типы атрибутов</Label>
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
    </div>
  );

  return (
    <ValidationFormFields<ErdCheck, ErdValidationConfig>
      config={config}
      onConfigChange={handleConfigChange}
      checkTypes={checkTypes}
      renderCheckFields={renderCheckFields}
      renderGlobalOptions={renderGlobalOptions}
      defaultCheck={{
        id: '',
        type: 'table_exists',
        target: '',
        value: '',
        operator: '='
      }}
      hasError={hasError}
      codePlaceholder={`// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id integer [primary key]
  username varchar
  email varchar
}

Table posts {
  id integer [primary key]
  title varchar
  user_id integer [ref: > users.id]
}`}
      codeHelperText="Опишите схему базы данных на языке DBML"
      codeLabel="DBML код"
    />
  );
}




