import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ZenthraEmbed } from '@/components/zenthra/ZenthraEmbed';

const ZenthraPlugins: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plugins</h1>
          <p className="text-muted-foreground">Manage plugins inside Zenthra</p>
        </div>
        <ZenthraEmbed path="/admin/plugins?embed=1" title="Zenthra Plugins" iframeId="zenthra-plugins" />
      </div>
    </AdminLayout>
  );
};

export default ZenthraPlugins;
