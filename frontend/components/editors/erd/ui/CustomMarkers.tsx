export const CustomMarkers = () => (
  <svg width={0} height={0} style={{ pointerEvents: 'none' }}>
    <defs>
      <marker
        id="erd-one-end"
        viewBox="0 0 12 12"
        refX="0"
        refY="6"
        markerWidth="10"
        markerHeight="10"
        orient="auto"
      >
        <path d="M10 0 L10 12" stroke="currentColor" strokeWidth="1.5" />
        <path d="M0 6 L10 6" stroke="currentColor" strokeWidth="1.5" />
      </marker>

      <marker
        id="erd-many-end"
        viewBox="0 0 12 12"
        refX="0"
        refY="6"
        markerWidth="10"
        markerHeight="10"
        orient="auto"
      >
        <path d="M0 6 L10 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M10 0 L0 6 L10 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </marker>
      
      <marker
        id="erd-one-start"
        viewBox="0 0 12 12"
        refX="12"
        refY="6"
        markerWidth="10"
        markerHeight="10"
        orient="auto"
      >
         <path d="M2 0 L2 12" stroke="currentColor" strokeWidth="1.5" />
         <path d="M2 6 L12 6" stroke="currentColor" strokeWidth="1.5" />
      </marker>

       <marker
        id="erd-many-start"
        viewBox="0 0 12 12"
        refX="12"
        refY="6"
        markerWidth="10"
        markerHeight="10"
        orient="auto"
      >
        <path d="M12 6 L2 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M2 0 L12 6 L2 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </marker>
    </defs>
  </svg>
);
