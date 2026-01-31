import plantumlEncoder from 'plantuml-encoder';

export const downloadPlantUml = async (code: string) => {
  try {
    const encoded = plantumlEncoder.encode(code);
    const url = `https://www.plantuml.com/plantuml/png/${encoded}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка загрузки PNG');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'PlantUMLDiagram.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    alert('Ошибка экспорта PNG');
  }
};
