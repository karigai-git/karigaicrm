import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ZenthraEmbed } from '@/components/zenthra/ZenthraEmbed';

const ZenthraPagesManager: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pages Manager</h1>
          <p className="text-muted-foreground">Manage pages inside Zenthra</p>
        </div>
        <ZenthraEmbed path="/admin/pages?embed=1" title="Zenthra Pages Manager" iframeId="zenthra-pages" />
      </div>
    </AdminLayout>
  );
};

export default ZenthraPagesManager;
