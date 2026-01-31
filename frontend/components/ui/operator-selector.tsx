import { Select, SelectContent, SelectItem, SelectTrigger } from "./select";

export const checkValue = (actual: number, expected: number, operator: string = '='): boolean => {
  switch (operator) {
    case '>': return actual > expected;
    case '<': return actual < expected;
    case '>=': return actual >= expected;
    case '<=': return actual <= expected;
    case '=':
    default: return actual === expected;
  }
};

export const getOperatorText = (operator: string = '='): string => {
  switch (operator) {
    case '>': return '>';
    case '<': return '<';
    case '>=': return '>=';
    case '<=': return '<=';
    case '=':
    default: return '=';
  }
};

interface OperatorSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OperatorSelector({ value = '=', onChange, disabled }: OperatorSelectorProps) {
  return (
    <Select 
      value={value} 
      onValueChange={onChange} 
      disabled={disabled}
    >
      <SelectTrigger className="h-8 w-[70px]">
        <div className="flex items-center justify-center w-full font-mono font-bold">
          {value}
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="=">Равно (=)</SelectItem>
        <SelectItem value=">">Больше (&gt;)</SelectItem>
        <SelectItem value="<">Меньше (&lt;)</SelectItem>
        <SelectItem value=">=">Больше или равно (&ge;)</SelectItem>
        <SelectItem value="<=">Меньше или равно (&le;)</SelectItem>
      </SelectContent>
    </Select>
  );
}
