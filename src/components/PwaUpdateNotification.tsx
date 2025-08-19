import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

function PwaUpdateNotification() {
  const { toast } = useToast();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error:', error);
    },
  });

  React.useEffect(() => {
    if (offlineReady) {
      toast({
        title: 'App is ready to work offline.',
      });
      setOfflineReady(false); // Prevent toast from re-appearing
    }
  }, [offlineReady, setOfflineReady, toast]);

  React.useEffect(() => {
    if (needRefresh) {
      const { dismiss } = toast({
        title: 'New version available!',
        description: 'A new version of the app is available. Reload to update.',
        action: (
          <Button
            onClick={() => {
              updateServiceWorker(true);
              dismiss();
            }}
          >
            Reload
          </Button>
        ),
        duration: Infinity, // Keep the toast open until the user interacts with it
      });

      // Optional: auto-dismiss after a while if you don't want it to be permanent
      return () => dismiss();
    }
  }, [needRefresh, toast, updateServiceWorker]);

  return null; // This component only renders toasts, it does not have its own UI
}

export default PwaUpdateNotification;
