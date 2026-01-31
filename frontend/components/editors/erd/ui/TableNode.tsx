import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const TableNode = memo(({ data }: any) => {
  return (
    <div className="bg-card text-card-foreground border rounded-md min-w-[200px] shadow-sm group">
      <div className="bg-muted p-2 border-b font-bold text-center text-sm rounded-t-md">
        {data.label}
      </div>
      <div className="p-2 space-y-1">
        {data.columns.map((col: any, i: number) => (
          <div key={i} className="relative flex justify-between items-center text-xs py-1 px-2 hover:bg-muted/50 rounded group/row">
            {/* Left Handles */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${col.name}-left-target`}
              className={`!w-[80px] !h-full !bg-transparent !rounded-none !border-none group/handle`}
              style={{ left: -20, top: 0, transform: 'none' }}
              isConnectable={true} 
            />
            <Handle
              type="source"
              position={Position.Left}
              id={`${col.name}-left-source`}
              className={`!w-[80px] !h-full !bg-transparent !rounded-none !border-none group/handle`}
              style={{ left: -20, top: 0, transform: 'none' }}
              isConnectable={true} 
            />
            
            <div className="flex items-center gap-2">
               {col.key === 'PK' && <span className="text-yellow-500 font-bold text-[10px]">PK</span>}
               {col.key === 'FK' && <span className="text-blue-500 font-bold text-[10px]">FK</span>}
               <span className="font-medium">{col.name}</span>
            </div>
            <span className="text-muted-foreground ml-4">{col.type}</span>

            {/* Right Handles */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${col.name}-right-source`}
              className={`!w-[80px] !h-full !bg-transparent !rounded-none !border-none group/handle`}
              style={{ right: -20, top: 0, transform: 'none' }}
              isConnectable={true}
            />
            <Handle
              type="target"
              position={Position.Right}
              id={`${col.name}-right-target`}
              className={`!w-[80px] !h-full !bg-transparent !rounded-none !border-none group/handle`}
              style={{ right: -20, top: 0, transform: 'none' }}
              isConnectable={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
