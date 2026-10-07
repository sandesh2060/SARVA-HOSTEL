import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'google-identity-services';
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);

  return new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID);

    const handleLoad = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error('Google Identity Services did not initialize.'));
    };
    const handleError = () => reject(new Error('Could not load Google sign-in. Check your connection and try again.'));

    if (script) {
      if (window.google?.accounts?.id) return resolve(window.google);
      script.addEventListener('load', handleLoad, { once: true });
      script.addEventListener('error', handleError, { once: true });
      return;
    }

    script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);
  });
}

export default function GoogleSignIn({ onCredential, onError, disabled = false }) {
  const buttonRef = useRef(null);
  const credentialHandlerRef = useRef(onCredential);
  const errorHandlerRef = useRef(onError);
  const [ready, setReady] = useState(false);

  credentialHandlerRef.current = onCredential;
  errorHandlerRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

    if (!clientId) {
      setReady(false);
      errorHandlerRef.current?.('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID and restart the frontend.');
      return undefined;
    }

    loadGoogleIdentityServices()
      .then((google) => {
        if (cancelled || !buttonRef.current) return;

        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response?.credential) {
              errorHandlerRef.current?.('Google did not return a sign-in credential. Please try again.');
              return;
            }
            credentialHandlerRef.current?.(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        buttonRef.current.replaceChildren();
        google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.max(240, Math.min(400, Math.round(buttonRef.current.getBoundingClientRect().width || 360))),
        });
        setReady(true);
      })
      .catch((error) => {
        if (!cancelled) {
          setReady(false);
          errorHandlerRef.current?.(error.message || 'Could not initialize Google sign-in.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`sarva-google-wrap ${disabled ? 'is-disabled' : ''}`} aria-busy={!ready}>
      <div ref={buttonRef} className="sarva-google-button" />
      {!ready && <div className="sarva-google-unavailable">Loading Google sign-in…</div>}
    </div>
  );
}
