import { useState } from 'react';
import { SwaggerEditorPanel } from '@/components/editors/swagger/SwaggerEditorPanel';

export default function SwaggerPlayground() {
  const defaultSwaggerCode = `openapi: 3.0.0
info:
  title: Sample API
  description: A sample API to illustrate OpenAPI concepts
  version: 1.0.0
paths:
  /users:
    get:
      summary: Returns a list of users.
      responses:
        '200':
          description: A JSON array of user names
          content:
            application/json:
              schema: 
                type: array
                items: 
                  type: string`;
  const [swaggerCode, setSwaggerCode] = useState(defaultSwaggerCode);

  return (
    <div className="h-full">
      <SwaggerEditorPanel
        code={swaggerCode}
        onChange={setSwaggerCode}
        handleReset={() => setSwaggerCode(defaultSwaggerCode)}
      />
    </div>
  );
}
