import React from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ZenthraEmbed } from '@/components/zenthra/ZenthraEmbed';

const ZenthraPageEditor: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const path = pageId ? `/admin/pages/${pageId}/edit?embed=1` : '/admin/pages?embed=1';

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Page Editor</h1>
          <p className="text-muted-foreground">Edit page {pageId}</p>
        </div>
        <ZenthraEmbed path={path} title={`Zenthra Page Editor ${pageId || ''}`} iframeId="zenthra-editor" />
      </div>
    </AdminLayout>
  );
};

export default ZenthraPageEditor;
