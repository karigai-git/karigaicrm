import React, { useMemo, useState } from 'react';
import { useCampaignManager } from '@/features/campaigns/hooks/useCampaignManager';
import { whatsappTemplates } from '@/data/whatsappTemplates';
import type { Contact } from '@/features/campaigns/types';
import { AdminLayout } from '@/components/layout/AdminLayout';

function parseCsv(content: string): Contact[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const out: Contact[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? '').trim();
    });
    if (row.phone) out.push(row as Contact);
  }
  return out;
}

const CampaignsPage: React.FC = () => {
  const mgr = useCampaignManager();
  const [csvName, setCsvName] = useState('');

  const progressLabel = useMemo(() => `${mgr.progress}% (${mgr.currentIndex}/${mgr.contacts.length})`, [mgr.progress, mgr.currentIndex, mgr.contacts.length]);

  return (
    <AdminLayout>
      {/* Sticky page header */}
      <div className="sticky top-0 z-30 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <h1 className="flex-1 truncate text-xl font-semibold sm:text-2xl">WhatsApp Campaigns</h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-4 space-y-4">

      <section className="grid gap-4 md:grid-cols-3">
        <div className="p-4 border rounded-md space-y-3">
          <h2 className="font-medium">1) Upload Contacts (CSV)</h2>
          <p className="text-sm text-muted-foreground">Required header: phone. Optional: name, orderId, status, total</p>
          <input
            type="file"
            accept=".csv"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const text = await f.text();
              setCsvName(f.name);
              const contacts = parseCsv(text);
              mgr.setContacts(contacts);
            }}
          />
          <div className="text-sm">Loaded: <b>{mgr.contacts.length}</b> {csvName && `from ${csvName}`}</div>
        </div>

        <div className="p-4 border rounded-md space-y-3">
          <h2 className="font-medium">2) Select Template</h2>
          <select
            className="border rounded px-2 py-1 w-full"
            value={mgr.template?.id || ''}
            onChange={(e) => {
              const t = whatsappTemplates.find(t => t.id === e.target.value) || null;
              mgr.setTemplate(t as any);
            }}
          >
            <option value="">-- Choose template --</option>
            {whatsappTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
            ))}
          </select>
          {mgr.template?.type === 'text' && (
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              <b>Text:</b> {mgr.template.text}
            </div>
          )}
          {mgr.template?.type === 'media' && (
            <div className="text-sm text-muted-foreground space-y-1">
              <div><b>Media:</b> {mgr.template.mediaUrl}</div>
              <div><b>Caption:</b> {mgr.template.caption}</div>
            </div>
          )}
        </div>

        <div className="p-4 border rounded-md space-y-3">
          <h2 className="font-medium">3) Settings</h2>
          <label className="text-sm block">Throttle (ms)</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            min={100}
            value={mgr.settings.throttleMs}
            onChange={(e) => mgr.setSettings({ ...mgr.settings, throttleMs: Number(e.target.value || 0) })}
          />
          <label className="text-sm block">Retries per number</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            min={0}
            value={mgr.settings.retries}
            onChange={(e) => mgr.setSettings({ ...mgr.settings, retries: Number(e.target.value || 0) })}
          />
          <div className="flex gap-2 pt-2">
            <button
              className="bg-green-600 hover:bg-green-700 text-white rounded px-3 py-1 disabled:opacity-50"
              onClick={mgr.start}
              disabled={!mgr.template || mgr.contacts.length === 0 || mgr.status === 'running'}
            >Start</button>
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-3 py-1 disabled:opacity-50"
              onClick={mgr.stop}
              disabled={mgr.status !== 'running'}
            >Stop</button>
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white rounded px-3 py-1"
              onClick={mgr.clear}
            >Clear</button>
          </div>
          <div className="text-sm">Status: <b>{mgr.status}</b></div>
          <div className="text-sm">Progress: <b>{progressLabel}</b></div>
          <div className="w-full h-2 bg-gray-200 rounded">
            <div className="h-2 bg-blue-600 rounded" style={{ width: `${mgr.progress}%` }} />
          </div>
        </div>
      </section>

      <section className="p-4 border rounded-md">
        <h2 className="font-medium mb-2">Logs</h2>
        <div className="max-h-[320px] overflow-auto text-sm">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1 pr-4">#</th>
                <th className="py-1 pr-4">Phone</th>
                <th className="py-1 pr-4">Name</th>
                <th className="py-1 pr-4">Status</th>
                <th className="py-1 pr-4">Attempt</th>
                <th className="py-1 pr-4">Message</th>
              </tr>
            </thead>
            <tbody>
              {mgr.logs.map((l, idx) => (
                <tr key={`${l.index}-${idx}`} className="border-b last:border-0">
                  <td className="py-1 pr-4">{l.index + 1}</td>
                  <td className="py-1 pr-4">{l.contact.phone}</td>
                  <td className="py-1 pr-4">{l.contact.name || ''}</td>
                  <td className="py-1 pr-4">{l.status}</td>
                  <td className="py-1 pr-4">{l.attempt}</td>
                  <td className="py-1 pr-4">{l.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="p-4 border rounded-md text-sm text-muted-foreground">
        <div><b>Notes</b></div>
        <ul className="list-disc ml-5 space-y-1">
          <li>Numbers should include country code or 10 digits (we add 91 by default in sender).</li>
          <li>Avoid sending too fast; increase throttle if you see timeouts.</li>
          <li>Templates support variables: {'{{name}}'}, {'{{orderId}}'}, {'{{status}}'}, {'{{total}}'}.</li>
        </ul>
      </section>
      </div>
    </AdminLayout>
  );
};

export default CampaignsPage;
