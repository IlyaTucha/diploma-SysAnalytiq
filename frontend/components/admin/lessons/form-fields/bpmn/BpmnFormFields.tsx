import { ValidationFormFields, BaseCheck, BaseValidationConfig } from '../ValidationFormFields';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { OperatorSelector } from '@/components/ui/operator-selector';

interface BpmnFormFieldsProps {
  correctAnswer: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

type CheckType = 'node_count' | 'edge_count' | 'node_exists' | 'edge_exists' | 'lane_count' | 'gateway_count';

interface BpmnCheck extends BaseCheck {
  type: CheckType;
  target?: string;
  value?: string;
  operator?: string;
}

interface BpmnValidationConfig extends BaseValidationConfig {
  checks?: BpmnCheck[];
  checkNodeNames?: boolean;
  checkNodeCount?: boolean;
  checkNodeCountOperator?: string;
  checkEdgeCount?: boolean;
  checkEdgeCountOperator?: string;
  checkLaneCount?: boolean;
  checkLaneCountOperator?: string;
  checkGatewayCount?: boolean;
  checkGatewayCountOperator?: string;
}

export function BpmnFormFields({ correctAnswer, onChange, hasError }: BpmnFormFieldsProps) {
  const [config, setConfig] = useState<BpmnValidationConfig>(() => {
    try {
      if (correctAnswer && correctAnswer.trim().startsWith('{')) {
        const parsed = JSON.parse(correctAnswer);
        return {
          mode: parsed.mode || 'code',
          code: parsed.code || '',
          checks: parsed.checks || [],
          checkNodeNames: parsed.checkNodeNames ?? false,
          checkNodeCount: parsed.checkNodeCount ?? false,
          checkNodeCountOperator: parsed.checkNodeCountOperator || '=',
          checkEdgeCount: parsed.checkEdgeCount ?? false,
          checkEdgeCountOperator: parsed.checkEdgeCountOperator || '=',
          checkLaneCount: parsed.checkLaneCount ?? false,
          checkLaneCountOperator: parsed.checkLaneCountOperator || '=',
          checkGatewayCount: parsed.checkGatewayCount ?? false,
          checkGatewayCountOperator: parsed.checkGatewayCountOperator || '='
        };
      }
    } catch {
      // Ignore error
    }
    return {
      mode: 'code',
      code: correctAnswer || '',
      checks: [],
      checkNodeNames: false,
      checkNodeCount: false,
      checkNodeCountOperator: '=',
      checkEdgeCount: false,
      checkEdgeCountOperator: '=',
      checkLaneCount: false,
      checkLaneCountOperator: '=',
      checkGatewayCount: false,
      checkGatewayCountOperator: '='
    };
  });

  const handleConfigChange = (newConfig: BpmnValidationConfig) => {
    setConfig(newConfig);
    onChange(JSON.stringify(newConfig));
  };

  const checkTypes = [
    { value: 'node_exists', label: 'Наличие элемента' },
    { value: 'node_count', label: 'Количество элементов' },
    { value: 'edge_count', label: 'Количество связей' },
    { value: 'lane_count', label: 'Количество дорожек' },
    { value: 'gateway_count', label: 'Количество шлюзов' },
  ];

  const renderCheckFields = (check: BpmnCheck, updateCheck: (updates: Partial<BpmnCheck>) => void) => {
    if (check.type === 'node_exists') {
      return (
        <div className="space-y-2 col-span-2">
          <Label className={hasError && !check.target ? "text-destructive" : ""}>
            Значение <span className="text-destructive">*</span>
          </Label>
          <Input 
            value={check.target || ''}
            onChange={(e) => updateCheck({ target: e.target.value })}
            placeholder="Имя элемента (например: Start Event)"
            className={hasError && !check.target ? "border-destructive" : ""}
          />
        </div>
      );
    }

    return (
      <>
        <div className="space-y-2">
          <Label>Оператор</Label>
          <OperatorSelector 
            value={check.operator || '='}
            onChange={(v: string) => updateCheck({ operator: v })}
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
  };

  const renderGlobalOptions = (cfg: BpmnValidationConfig, updateCfg: (updates: Partial<BpmnValidationConfig>) => void) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkNodeCount" 
          checked={cfg.checkNodeCount}
          onCheckedChange={(c) => updateCfg({ checkNodeCount: c as boolean })}
        />
        <Label htmlFor="checkNodeCount" className="font-normal cursor-pointer">
          Количество элементов
        </Label>
        <OperatorSelector 
          value={cfg.checkNodeCountOperator} 
          onChange={(op: string) => updateCfg({ checkNodeCountOperator: op })}
          disabled={!cfg.checkNodeCount}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkNodeNames" 
          checked={cfg.checkNodeNames}
          onCheckedChange={(c) => updateCfg({ checkNodeNames: c as boolean })}
        />
        <Label htmlFor="checkNodeNames" className="font-normal cursor-pointer">Названия элементов</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkEdgeCount" 
          checked={cfg.checkEdgeCount}
          onCheckedChange={(c) => updateCfg({ checkEdgeCount: c as boolean })}
        />
        <Label htmlFor="checkEdgeCount" className="font-normal cursor-pointer">
          Количество связей
        </Label>
        <OperatorSelector 
          value={cfg.checkEdgeCountOperator} 
          onChange={(op: string) => updateCfg({ checkEdgeCountOperator: op })}
          disabled={!cfg.checkEdgeCount}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkLaneCount" 
          checked={cfg.checkLaneCount}
          onCheckedChange={(c) => updateCfg({ checkLaneCount: c as boolean })}
        />
        <Label htmlFor="checkLaneCount" className="font-normal cursor-pointer">
          Количество дорожек
        </Label>
        <OperatorSelector 
          value={cfg.checkLaneCountOperator} 
          onChange={(op: string) => updateCfg({ checkLaneCountOperator: op })}
          disabled={!cfg.checkLaneCount}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="checkGatewayCount" 
          checked={cfg.checkGatewayCount}
          onCheckedChange={(c) => updateCfg({ checkGatewayCount: c as boolean })}
        />
        <Label htmlFor="checkGatewayCount" className="font-normal cursor-pointer">
          Количество шлюзов
        </Label>
        <OperatorSelector 
          value={cfg.checkGatewayCountOperator} 
          onChange={(op: string) => updateCfg({ checkGatewayCountOperator: op })}
          disabled={!cfg.checkGatewayCount}
        />
      </div>
    </div>
  );

  return (
    <ValidationFormFields<BpmnCheck, BpmnValidationConfig>
      config={config}
      onConfigChange={handleConfigChange}
      checkTypes={checkTypes}
      renderCheckFields={renderCheckFields}
      renderGlobalOptions={renderGlobalOptions}
      defaultCheck={{
        id: '',
        type: 'node_exists',
        target: '',
        value: '',
        operator: '='
      }}
      hasError={hasError}
      codePlaceholder={`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions ...>
  <bpmn:process id="Process_1">
    <bpmn:startEvent id="StartEvent_1" name="Start" />
    <bpmn:task id="Task_1" name="Do something" />
    <bpmn:endEvent id="EndEvent_1" name="End" />
  </bpmn:process>
</bpmn:definitions>`}
      codeHelperText="Вставьте XML код BPMN диаграммы"
      codeLabel="XML код"
    />
  );
}




