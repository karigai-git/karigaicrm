import React, { useEffect, useMemo, useRef } from 'react';
import { pb } from '@/lib/pocketbase';

interface ZenthraEmbedProps {
  path: string;
  title?: string;
  iframeId?: string;
}

const joinUrl = (base: string, path: string) => {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
};

export const ZenthraEmbed: React.FC<ZenthraEmbedProps> = ({ path, title, iframeId }) => {
  const base = (import.meta.env.VITE_ZENTHRA_FRONTEND_URL as string) || 'https://zenthra.shop';
  const src = useMemo(() => joinUrl(base, path), [base, path]);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const d: any = e.data || {};
      if (!frameRef.current) return;

      if (d.type === 'ZENTHRA_EMBED_SIZE' && typeof d.height === 'number') {
        const height = Math.min(Math.max(d.height, 400), 3000);
        frameRef.current.style.height = `${height}px`;
      }

      if (d.type === 'ZENTHRA_EMBED_READY') {
        const token = pb.authStore.token;
        const model = pb.authStore.model;
        frameRef.current?.contentWindow?.postMessage({ type: 'ZENTHRA_EMBED_AUTH', token, model }, '*');
      }

      if (d.type === 'ZENTHRA_EMBED_AUTH_OK') {
        // no-op
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="w-full">
      <iframe
        ref={frameRef}
        id={iframeId || 'zenthra-embed'}
        src={src}
        title={title || 'Zenthra'}
        style={{ width: '100%', border: 0, height: '700px' }}
      />
    </div>
  );
};

export default ZenthraEmbed;
