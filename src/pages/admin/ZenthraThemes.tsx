import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ZenthraEmbed } from '@/components/zenthra/ZenthraEmbed';

const ZenthraThemes: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Theme Editor</h1>
          <p className="text-muted-foreground">Customize your storefront theme</p>
        </div>
        <ZenthraEmbed path="/admin/themes?embed=1" title="Zenthra Theme Editor" iframeId="zenthra-themes" />
      </div>
    </AdminLayout>
  );
};

export default ZenthraThemes;
