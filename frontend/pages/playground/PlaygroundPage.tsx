import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Database, GitBranch, Workflow, FileCode, Code } from 'lucide-react';
import { useTheme } from '@/components/contexts/ThemeProvider';
import SqlPlayground from '@/components/playground/SqlPlayground';
import ErdPlayground from '@/components/playground/ErdPlayground';
import BpmnPlayground from '@/components/playground/BpmnPlayground';
import PlantUmlPlayground from '@/components/playground/PlantUmlPlayground';
import SwaggerPlayground from '@/components/playground/SwaggerPlayground';

export default function PlaygroundPage() {
  const { getThemeColor } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <div className="bg-card border-b border-border p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Code className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
              <h1>Песочница</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 h-full overflow-hidden">
          <div className="w-full mx-auto h-full">
            <Tabs defaultValue="sql" className="w-full h-full flex flex-col">
              <TabsList className="mb-6 flex-shrink-0 dark:bg-zinc-900 dark:text-zinc-400">
                <TabsTrigger value="sql" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  SQL Playground
                </TabsTrigger>
                <TabsTrigger value="erd" className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  ERD Editor
                </TabsTrigger>
                <TabsTrigger value="bpmn" className="flex items-center gap-2">
                  <Workflow className="w-4 h-4" />
                  BPMN Editor
                </TabsTrigger>
                <TabsTrigger value="plantuml" className="flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  PlantUML Editor
                </TabsTrigger>
                <TabsTrigger value="swagger" className="flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Swagger Editor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sql" className="flex-1 h-full">
                <SqlPlayground />
              </TabsContent>

              <TabsContent value="erd" className="space-y-6">
                <ErdPlayground />
              </TabsContent>

              <TabsContent value="bpmn" className="space-y-6">
                <BpmnPlayground />
              </TabsContent>

              <TabsContent value="plantuml" className="space-y-6">
                <PlantUmlPlayground />
              </TabsContent>

              <TabsContent value="swagger" className="space-y-6">
                <SwaggerPlayground />
              </TabsContent>
            </Tabs>
          </div>
        </div>
    </div>
  );
}





