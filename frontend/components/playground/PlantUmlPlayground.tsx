import { useState } from 'react';
import { PlantUmlEditorPanel } from '@/components/editors/plantuml/PlantUmlEditorPanel';

export default function PlantUmlPlayground() {
  const defaultPlantUMLCode = `@startuml
actor Пользователь
participant "Веб-приложение" as App
participant "База данных" as DB

Пользователь -> App: Запрос данных
App -> DB: SELECT запрос
DB --> App: Результат
App --> Пользователь: Отобразить данные
@enduml`;
  const [plantUMLCode, setPlantUMLCode] = useState(defaultPlantUMLCode);

  return (
    <div className="h-full">
      <PlantUmlEditorPanel
        code={plantUMLCode}
        onChange={setPlantUMLCode}
        handleReset={() => setPlantUMLCode(defaultPlantUMLCode)}
      />
    </div>
  );
}
