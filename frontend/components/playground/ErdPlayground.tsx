import { useState } from 'react';
import { ErdEditorPanel } from '@/components/editors/erd/ErdEditorPanel';

export default function ErdPlayground() {
  const defaultERDCode = `// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id integer [primary key]
  username varchar
  role varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  body text [note: 'Content of the post']
  user_id integer
  created_at timestamp
}

Ref: posts.user_id > users.id // many-to-one`;
  const [erdCode, setErdCode] = useState(defaultERDCode);

  return (
    <div className="h-full">
      <ErdEditorPanel
        code={erdCode}
        onChange={setErdCode}
        handleReset={() => setErdCode(defaultERDCode)}
      />
    </div>
  );
}
