export const customIdModule = {
  __init__: ['customIdInit'],
  customIdInit: ['type', ['bpmnFactory', function(bpmnFactory: any) {
    const originalEnsureId = bpmnFactory._ensureId;
    bpmnFactory._ensureId = function(element: any) {
      if (!element.id) {
        let prefix = (element.$type || '').replace(/^[^:]*:/g, '');
        prefix += '_';
        element.id = this._model.ids.nextPrefixed(prefix, element);
      } else {
        originalEnsureId.call(this, element);
      }
    };
  }]]
};
