import { ValidationFormFields, BaseCheck, BaseValidationConfig } from '../ValidationFormFields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { OperatorSelector } from '@/components/ui/operator-selector';
import { Checkbox } from '@/components/ui/checkbox';

interface SwaggerFormFieldsProps {
  correctAnswer: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

interface SwaggerCheck extends BaseCheck {
  type: string;
  target?: string;
  value?: string;
  operator?: string;
}

interface SwaggerValidationConfig extends BaseValidationConfig {
  checks?: SwaggerCheck[];
  checkPathCount?: boolean;
  checkPathCountOperator?: string;
  checkSchemaCount?: boolean;
  checkSchemaCountOperator?: string;
  checkEndpointCount?: boolean;
  checkEndpointCountOperator?: string;
  checkPathNames?: boolean;
  checkOperationNames?: boolean;
}

export function SwaggerFormFields({ correctAnswer, onChange, hasError }: SwaggerFormFieldsProps) {
  const [config, setConfig] = useState<SwaggerValidationConfig>(() => {
    try {
      if (correctAnswer && correctAnswer.trim().startsWith('{')) {
        const parsed = JSON.parse(correctAnswer);
        return {
          mode: parsed.mode || 'code',
          code: parsed.code || '',
          checks: parsed.checks || [],
          checkPathCount: parsed.checkPathCount ?? false,
          checkPathCountOperator: parsed.checkPathCountOperator || '=',
          checkSchemaCount: parsed.checkSchemaCount ?? false,
          checkSchemaCountOperator: parsed.checkSchemaCountOperator || '=',
          checkEndpointCount: parsed.checkEndpointCount ?? false,
          checkEndpointCountOperator: parsed.checkEndpointCountOperator || '=',
          checkPathNames: parsed.checkPathNames ?? false,
          checkOperationNames: parsed.checkOperationNames ?? false,
        };
      }
    } catch {
      // Ignore error
    }
    return {
      mode: 'code',
      code: correctAnswer || '',
      checks: [],
      checkPathCount: false,
      checkPathCountOperator: '=',
      checkSchemaCount: false,
      checkSchemaCountOperator: '=',
      checkEndpointCount: false,
      checkEndpointCountOperator: '=',
      checkPathNames: false,
      checkOperationNames: false,
    };
  });

  const handleConfigChange = (newConfig: SwaggerValidationConfig) => {
    setConfig(newConfig);
    onChange(JSON.stringify(newConfig));
  };

  const checkTypes = [
    { value: 'path_count', label: 'Количество путей (paths)' },
    { value: 'schema_count', label: 'Количество схем (components)' },
    { value: 'endpoint_count', label: 'Количество эндпоинтов (GET, POST...)' },
    { value: 'path_exists', label: 'Наличие пути' },
    { value: 'operation_exists', label: 'Наличие операции (Метод Путь)' },
  ];

  const renderCheckFields = (check: SwaggerCheck, updateCheck: (updates: Partial<SwaggerCheck>) => void) => {
    const isCountCheck = ['path_count', 'schema_count', 'endpoint_count'].includes(check.type);

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

    return (
      <div className="space-y-2 col-span-2">
        <Label className={hasError && !check.target ? "text-destructive" : ""}>
          Значение <span className="text-destructive">*</span>
        </Label>
        <Input 
          value={check.target || ''}
          onChange={(e) => updateCheck({ target: e.target.value })}
          placeholder={check.type === 'operation_exists' ? "Например: GET /users" : "Например: /users"}
          className={hasError && !check.target ? "border-destructive" : ""}
        />
      </div>
    );
  };

  const renderGlobalOptions = (cfg: SwaggerValidationConfig, updateCfg: (updates: Partial<SwaggerValidationConfig>) => void) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkPathCount" 
          checked={cfg.checkPathCount}
          onCheckedChange={(c) => updateCfg({ checkPathCount: c as boolean })}
        />
        <Label htmlFor="checkPathCount" className="font-normal cursor-pointer">
          Количество путей
        </Label>
        <OperatorSelector 
          value={cfg.checkPathCountOperator} 
          onChange={(op) => updateCfg({ checkPathCountOperator: op })}
          disabled={!cfg.checkPathCount}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkSchemaCount" 
          checked={cfg.checkSchemaCount}
          onCheckedChange={(c) => updateCfg({ checkSchemaCount: c as boolean })}
        />
        <Label htmlFor="checkSchemaCount" className="font-normal cursor-pointer">
          Количество схем
        </Label>
        <OperatorSelector 
          value={cfg.checkSchemaCountOperator} 
          onChange={(op) => updateCfg({ checkSchemaCountOperator: op })}
          disabled={!cfg.checkSchemaCount}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkEndpointCount" 
          checked={cfg.checkEndpointCount}
          onCheckedChange={(c) => updateCfg({ checkEndpointCount: c as boolean })}
        />
        <Label htmlFor="checkEndpointCount" className="font-normal cursor-pointer">
          Количество эндпоинтов
        </Label>
        <OperatorSelector 
          value={cfg.checkEndpointCountOperator} 
          onChange={(op) => updateCfg({ checkEndpointCountOperator: op })}
          disabled={!cfg.checkEndpointCount}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkPathNames" 
          checked={cfg.checkPathNames}
          onCheckedChange={(c) => updateCfg({ checkPathNames: c as boolean })}
        />
        <Label htmlFor="checkPathNames" className="font-normal cursor-pointer">
          Совпадение путей
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkOperationNames" 
          checked={cfg.checkOperationNames}
          onCheckedChange={(c) => updateCfg({ checkOperationNames: c as boolean })}
        />
        <Label htmlFor="checkOperationNames" className="font-normal cursor-pointer">
          Совпадение операций
        </Label>
      </div>
    </div>
  );

  return (
    <ValidationFormFields<SwaggerCheck, SwaggerValidationConfig>
      config={config}
      onConfigChange={handleConfigChange}
      checkTypes={checkTypes}
      renderCheckFields={renderCheckFields}
      renderGlobalOptions={renderGlobalOptions}
      defaultCheck={{ id: '', type: 'path_count', operator: '=' }}
      hasError={hasError}
      codePlaceholder={`openapi: 3.0.0
info:
  title: Sample API
  version: 0.1.0
paths:
  /users:
    get:
      summary: Returns a list of users.
      responses:
        '200':
          description: A JSON array of user names`}
      codeHelperText="Вставьте спецификацию OpenAPI (YAML или JSON)"
      codeLabel="OpenAPI спецификация"
    />
  );
}




