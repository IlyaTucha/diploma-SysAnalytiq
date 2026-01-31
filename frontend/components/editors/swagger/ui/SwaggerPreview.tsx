import { useRef, useEffect } from 'react';
// @ts-ignore
import SwaggerUI from 'swagger-ui-react';
// @ts-ignore
import 'swagger-ui-react/swagger-ui.css';
import { useTheme } from '@/components/contexts/ThemeProvider';

interface SwaggerPreviewProps {
    code: string;
}

export const SwaggerPreview = ({ code }: SwaggerPreviewProps) => {
    const { theme } = useTheme();
    const previewContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (previewContainerRef.current) {
            previewContainerRef.current.scrollTop = 0;
            previewContainerRef.current.style.minHeight = '200px';
            previewContainerRef.current.style.maxHeight = '600px';
        }
    }, [code]);

    return (
        <div
            ref={previewContainerRef}
            className={`flex-1 overflow-auto bg-white ${theme === 'dark' ? 'invert hue-rotate-180' : ''}`}
            style={{ minHeight: 0 }}
        >
            {/* @ts-ignore */}
            <SwaggerUI spec={code} key={code} />
        </div>
    );
};
