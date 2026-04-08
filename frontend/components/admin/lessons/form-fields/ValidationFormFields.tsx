import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Code, ListChecks } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useEffect, useRef } from 'react';

export interface BaseCheck {
  id: string;
  type: string;
}

export interface BaseValidationConfig {
  mode: 'code' | 'manual';
  code?: string;
  checks?: BaseCheck[];
  [key: string]: any;
}

interface ValidationFormFieldsProps<TCheck extends BaseCheck, TConfig extends BaseValidationConfig> {
  config: TConfig;
  onConfigChange: (config: TConfig) => void;
  checkTypes: { value: string; label: string }[];
  renderCheckFields: (check: TCheck, updateCheck: (updates: Partial<TCheck>) => void) => React.ReactNode;
  renderGlobalOptions?: (config: TConfig, updateConfig: (updates: Partial<TConfig>) => void) => React.ReactNode;
  defaultCheck: TCheck;
  hasError?: boolean;
  codePlaceholder?: string;
  codeHelperText?: string;
  codeLabel?: string;
}

export function ValidationFormFields<TCheck extends BaseCheck, TConfig extends BaseValidationConfig>({
  config,
  onConfigChange,
  checkTypes,
  renderCheckFields,
  renderGlobalOptions,
  defaultCheck,
  hasError,
  codePlaceholder,
  codeHelperText,
  codeLabel
}: ValidationFormFieldsProps<TCheck, TConfig>) {

  const didNormalize = useRef(false);
  useEffect(() => {
    if (didNormalize.current) return;
    const checks = config.checks || [];
    const needsIds = checks.some(c => !c.id);
    if (needsIds) {
      didNormalize.current = true;
      const fixed = checks.map(c => c.id ? c : { ...c, id: crypto.randomUUID() });
      onConfigChange({ ...config, checks: fixed } as TConfig);
    }
  }, [config, onConfigChange]);

  const updateConfig = (updates: Partial<TConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const addCheck = () => {
    const newCheck = {
      ...defaultCheck,
      id: crypto.randomUUID()
    };
    updateConfig({
      checks: [...(config.checks || []), newCheck]
    } as Partial<TConfig>);
  };

  const removeCheck = (id: string) => {
    updateConfig({
      checks: (config.checks || []).filter(c => c.id !== id)
    } as Partial<TConfig>);
  };

  const updateCheck = (id: string, updates: Partial<TCheck>) => {
    updateConfig({
      checks: (config.checks || []).map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    } as Partial<TConfig>);
  };

  const isGlobalOptionsSelected = () => {
    if (!renderGlobalOptions) return true;
    return Object.entries(config).some(([key, value]) => 
      key.startsWith('check') && value === true
    );
  };

  const showGlobalOptionsError = hasError && !isGlobalOptionsSelected();

  return (
    <div className="space-y-4">
      <Tabs 
        value={config.mode} 
        onValueChange={(v) => updateConfig({ mode: v as 'code' | 'manual' } as Partial<TConfig>)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Код проверки
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Конструктор проверок
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="space-y-4">
          <div className="space-y-2">
            <Label className={hasError && !config.code ? "text-destructive" : ""}>
              {codeLabel || "JSON конфигурация / Эталонный код"} <span className="text-destructive">*</span>
            </Label>
            <Textarea 
              value={config.code || ''}
              onChange={(e) => updateConfig({ code: e.target.value } as Partial<TConfig>)}
              className={`font-mono min-h-[300px] ${hasError && !config.code ? 'border-destructive' : ''}`}
              placeholder={codePlaceholder || "Введите код или JSON конфигурацию..."}
            />
            <p className="text-sm text-muted-foreground">
              {codeHelperText || "Для автоматической проверки используйте JSON формат или код решения."}
            </p>
          </div>

          {renderGlobalOptions && (
            <Card className={`p-4 bg-muted/20 mt-0 gap-0 ${showGlobalOptionsError ? 'border-destructive' : ''}`}>
              <h4 className={`font-medium mb-2 ${showGlobalOptionsError ? 'text-destructive' : ''}`}>
                Параметры сравнения <span className="text-destructive">*</span>
              </h4>
              {renderGlobalOptions(config, updateConfig)}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className={hasError && (!config.checks || config.checks.length === 0) ? "text-destructive" : ""}>
                Список проверок <span className="text-destructive">*</span>
              </Label>
              <Button onClick={addCheck} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Добавить проверку
              </Button>
            </div>

            {(config.checks || []).length === 0 ? (
              <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
                Нет активных проверок. Добавьте первую проверку.
              </div>
            ) : (
              <div className="space-y-3">
                {(config.checks || []).map((check, idx) => (
                  <Card key={check.id || `check-${idx}`} className="p-4 relative group">
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
                          <div className="space-y-2">
                            <Label>Тип проверки</Label>
                            <Select 
                              value={check.type} 
                              onValueChange={(v) => updateCheck(check.id, { type: v } as Partial<TCheck>)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {checkTypes.map(t => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {renderCheckFields(check as TCheck, (updates) => updateCheck(check.id, updates))}

                          <div className="space-y-2">
                            <Label className="invisible block">Удалить</Label>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeCheck(check.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}




