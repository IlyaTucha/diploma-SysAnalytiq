import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ColumnDef, IndexDef, CheckDef } from '../internal/ErdGraphUtils';

interface TableNodeData {
  label: string;
  columns: ColumnDef[];
  indexes?: IndexDef[];
  checks?: CheckDef[];
}

export const TableNode = memo(({ data }: { data: TableNodeData }) => {
  const hasIndexes = data.indexes && data.indexes.length > 0;
  const hasChecks = data.checks && data.checks.length > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="bg-card text-card-foreground border rounded-md min-w-[200px] shadow-sm group">
        <div className="bg-muted p-2 border-b font-bold text-center text-sm rounded-t-md">
          {data.label}
        </div>
        <div className="p-2 space-y-1">
          {data.columns.map((col: ColumnDef, i: number) => (
            <div key={i} className="relative flex justify-between items-center text-xs py-1 px-2 hover:bg-muted/50 rounded group/row">
              {/* Left Handles */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${col.name}-left-target`}
                className={`!w-[80px] !h-full !bg-transparent !rounded-none !border-none group/handle !pointer-events-none !z-0`}
                style={{ left: -20, top: 0, transform: 'none' }}
                isConnectable={false}
              />
              <Handle
                type="source"
                position={Position.Left}
                id={`${col.name}-left-source`}
                className={`!w-[80px] !h-full !bg-transparent !rounded-none !border-none group/handle !pointer-events-none !z-0`}
                style={{ left: -20, top: 0, transform: 'none' }}
                isConnectable={false}
              />

              <div className="flex items-center gap-1.5 relative z-10">
                {col.key === 'PK' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-yellow-500 font-bold text-[10px] cursor-default">PK</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Primary Key</TooltipContent>
                  </Tooltip>
                )}
                {col.key === 'FK' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-blue-500 font-bold text-[10px] cursor-default">FK</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Foreign Key</TooltipContent>
                  </Tooltip>
                )}
                {col.unique && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-purple-500 font-bold text-[10px] cursor-default">UQ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Unique</TooltipContent>
                  </Tooltip>
                )}
                {col.notNull && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-red-400 font-bold text-[10px] cursor-default">NN</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Not Null</TooltipContent>
                  </Tooltip>
                )}
                {col.increment && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-green-500 font-bold text-[10px] cursor-default">AI</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Auto Increment</TooltipContent>
                  </Tooltip>
                )}
                <span className="font-medium">{col.name}</span>
                {col.note && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-gray-400 cursor-help hover:text-gray-600" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-[200px]">{col.note}</TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="flex items-center gap-1 relative z-10">
                <span className="text-muted-foreground ml-4 font-mono text-[11px]">{col.type}</span>
                {col.defaultValue && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-cyan-500 text-[10px] cursor-default">DEF</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Default: {col.defaultValue}</TooltipContent>
                  </Tooltip>
                )}
                {col.check && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-orange-500 text-[10px] cursor-default">CHK</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-mono">{col.check}</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Right Handles */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${col.name}-right-source`}
                className={`!w-[80px] !h-full !bg-transparent !rounded-none !border-none group/handle !pointer-events-none !z-0`}
                style={{ right: -20, top: 0, transform: 'none' }}
                isConnectable={false}
              />
              <Handle
                type="target"
                position={Position.Right}
                id={`${col.name}-right-target`}
                className={`!w-[80px] !h-full !bg-transparent !rounded-none !border-none group/handle !pointer-events-none !z-0`}
                style={{ right: -20, top: 0, transform: 'none' }}
                isConnectable={false}
              />
            </div>
          ))}
        </div>

        
        {/* Indexes section */}
        {hasIndexes && (
          <div className="border-t p-2">
            <div className="text-[10px] text-muted-foreground font-semibold mb-1">Indexes</div>
            {data.indexes!.map((idx, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 cursor-default hover:bg-muted/50 rounded px-1">
                    {idx.isPk && <span className="text-yellow-500 font-bold">PK</span>}
                    {idx.isUnique && <span className="text-purple-500 font-bold">UQ</span>}
                    <span className="font-mono truncate">
                      {idx.columns.length > 1 ? `(${idx.columns.join(', ')})` : idx.columns[0]}
                    </span>
                    {idx.type && <span className="text-blue-400">[{idx.type}]</span>}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {idx.name && <div>Name: {idx.name}</div>}
                  {idx.note && <div>Note: {idx.note}</div>}
                  {idx.type && <div>Type: {idx.type}</div>}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Checks section */}
        {hasChecks && (
          <div className="border-t p-2">
            <div className="text-[10px] text-muted-foreground font-semibold mb-1">Checks</div>
            {data.checks!.map((chk, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className="text-[10px] text-orange-500 font-mono truncate cursor-default hover:bg-muted/50 rounded px-1">
                    {chk.expression}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  <div className="font-mono">{chk.expression}</div>
                  {chk.name && <div>Name: {chk.name}</div>}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});
