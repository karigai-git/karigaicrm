import { useCallback, useMemo, useRef, useState } from 'react';
import { CampaignSettings, CampaignTemplate, Contact, SendLogItem } from '../types';
import { renderTemplateText } from '@/data/whatsappTemplates';
import { sendWhatsAppMediaMessage, sendWhatsAppMessage } from '@/lib/evolution';

export type CampaignStatus = 'idle' | 'running' | 'stopped' | 'completed';

export function useCampaignManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [template, setTemplate] = useState<CampaignTemplate | null>(null);
  const [settings, setSettings] = useState<CampaignSettings>({ throttleMs: 1200, retries: 1 });
  const [logs, setLogs] = useState<SendLogItem[]>([]);
  const [status, setStatus] = useState<CampaignStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);

  const stopRef = useRef(false);

  const progress = useMemo(() => {
    if (contacts.length === 0) return 0;
    return Math.round((currentIndex / contacts.length) * 100);
  }, [contacts.length, currentIndex]);

  const appendLog = useCallback((entry: SendLogItem) => {
    setLogs(prev => [...prev, entry]);
  }, []);

  const clear = useCallback(() => {
    setLogs([]);
    setCurrentIndex(0);
    setStatus('idle');
    stopRef.current = false;
  }, []);

  const start = useCallback(async () => {
    if (!template) return;
    setStatus('running');
    stopRef.current = false;
    setLogs([]);

    for (let i = 0; i < contacts.length; i++) {
      if (stopRef.current) {
        setStatus('stopped');
        break;
      }
      const contact = contacts[i];
      setCurrentIndex(i + 1);

      const vars: Record<string, string> = {
        name: contact.name || '',
        orderId: contact.orderId || contact.order_id || '',
        status: contact.status || '',
        total: contact.total?.toString?.() || '',
        phone: contact.phone || '',
      };

      let attempt = 0;
      let lastError: any = null;

      while (attempt <= (settings.retries ?? 0)) {
        attempt++;
        try {
          if (template.type === 'text') {
            const text = renderTemplateText(template.text || '', vars);
            await sendWhatsAppMessage({ phone: contact.phone, message: text, orderId: vars.orderId, templateName: template.name });
          } else {
            const caption = renderTemplateText(template.caption || '', vars);
            await sendWhatsAppMediaMessage({ phone: contact.phone, mediaUrl: template.mediaUrl || '', caption, mediaType: template.mediaType || 'image', fileName: template.fileName || 'file' });
          }

          appendLog({ index: i, contact, status: 'success', attempt, message: 'Sent', response: undefined });
          break; // success, exit retry loop
        } catch (err: any) {
          lastError = err;
          appendLog({ index: i, contact, status: 'error', attempt, message: err?.message || 'Failed' });
          // backoff between retries
          await new Promise(r => setTimeout(r, Math.max(400, settings.throttleMs)));
        }
      }

      // throttle between contacts on success
      if (!lastError) {
        await new Promise(r => setTimeout(r, Math.max(100, settings.throttleMs)));
      }
    }

    if (!stopRef.current) setStatus('completed');
  }, [appendLog, contacts, settings, template]);

  const stop = useCallback(() => {
    stopRef.current = true;
  }, []);

  return {
    // state
    contacts, setContacts,
    template, setTemplate,
    settings, setSettings,
    logs, status, currentIndex, progress,

    // actions
    start, stop, clear,
  };
}
