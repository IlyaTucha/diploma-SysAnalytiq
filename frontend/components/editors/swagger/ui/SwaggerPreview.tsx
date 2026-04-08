import { useRef, useEffect, useState, useReducer, useMemo } from 'react';
// @ts-ignore
import SwaggerUI from 'swagger-ui-react';
// @ts-ignore
import 'swagger-ui-react/swagger-ui.css';
import yaml from 'js-yaml';
import { useTheme } from '@/components/contexts/ThemeProvider';

interface SwaggerPreviewProps {
    code: string;
}

interface SpecState {
    spec: any;
    parseError: string | null;
}

function specReducer(state: SpecState, action: { type: 'success'; spec: any } | { type: 'error'; message: string }): SpecState {
    if (action.type === 'success') {
        return { spec: action.spec, parseError: null };
    }
    return { ...state, parseError: action.message };
}

function SwaggerUIWrapper({ spec }: { spec: any }) {
    // Use a stable key derived from spec to force clean remounts when spec changes
    const specKey = useMemo(() => JSON.stringify(spec), [spec]);
    // @ts-ignore
    return <SwaggerUI key={specKey} spec={spec} />;
}

export const SwaggerPreview = ({ code }: SwaggerPreviewProps) => {
    const { theme } = useTheme();
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Debounce code changes to avoid re-renders on every keystroke
    const [debouncedCode, setDebouncedCode] = useState(code);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedCode(code), 500);
        return () => clearTimeout(timer);
    }, [code]);

    // Parse YAML and track last valid spec + error
    const [{ spec, parseError }, dispatch] = useReducer(specReducer, { spec: null, parseError: null });

    useEffect(() => {
        try {
            const parsed = yaml.load(debouncedCode);
            if (parsed && typeof parsed === 'object') {
                dispatch({ type: 'success', spec: parsed });
            }
        } catch (e: any) {
            // Extract error message without stack trace
            const errorMsg = e.reason || e.message?.split('\n')[0] || 'Ошибка парсинга YAML';
            dispatch({ type: 'error', message: errorMsg });
        }
    }, [debouncedCode]);

    useEffect(() => {
        if (previewContainerRef.current) {
            previewContainerRef.current.scrollTop = 0;
        }
    }, [spec]);

    return (
        <div
            ref={previewContainerRef}
            className={`flex-1 overflow-auto bg-white ${theme === 'dark' ? 'invert hue-rotate-180' : ''}`}
            style={{ minHeight: 0 }}
        >
            {parseError && (
                <div className="bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400 font-mono">
                    YAML: {parseError}
                </div>
            )}
            {spec ? (
                <SwaggerUIWrapper spec={spec} />
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <span>Введите корректный OpenAPI YAML...</span>
                </div>
            )}
        </div>
    );
};
