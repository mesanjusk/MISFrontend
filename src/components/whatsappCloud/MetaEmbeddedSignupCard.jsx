import { useState } from 'react';
import { toast } from '../../Components';
import { useMetaEmbeddedSignupSdk } from '../../hooks/useMetaEmbeddedSignup';
import { whatsappCloudService } from '../../services/whatsappCloudService';
import { parseApiError } from '../../utils/parseApiError';

export default function MetaEmbeddedSignupCard({ onConnected }) {
  const { isReady, sdkError } = useMetaEmbeddedSignupSdk();
  const [isConnecting, setIsConnecting] = useState(false);

  const startEmbeddedSignup = async () => {
    if (!window.FB || !isReady) {
      toast.error('Facebook SDK is not ready yet.');
      return;
    }

    const configId = import.meta.env.VITE_META_EMBEDDED_CONFIG_ID;
    if (!configId) {
      toast.error('Missing VITE_META_EMBEDDED_CONFIG_ID in environment.');
      return;
    }

    setIsConnecting(true);

    window.FB.login(
      async (response) => {
        try {
          const code = response?.authResponse?.code;
          if (!code) throw new Error('Meta did not return an authorization code.');

          await whatsappCloudService.exchangeEmbeddedSignupCode({ code });
          toast.success('WhatsApp account connected successfully.');
          onConnected?.();
        } catch (error) {
          toast.error(parseApiError(error, 'Unable to complete Meta signup.'));
        } finally {
          setIsConnecting(false);
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          feature: 'whatsapp_embedded_signup',
          sessionInfoVersion: 3,
        },
      },
    );
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800">Meta Embedded Signup</h2>
      <p className="text-sm text-gray-600 mt-1">
        Securely connect WhatsApp Business accounts. Only temporary authorization code is handled in frontend.
      </p>

      {sdkError ? <p className="text-red-600 text-sm mt-3">{sdkError}</p> : null}

      <button
        type="button"
        onClick={startEmbeddedSignup}
        disabled={!isReady || isConnecting}
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2.5 font-medium disabled:opacity-60"
      >
        {isConnecting ? 'Connecting...' : 'Connect WhatsApp'}
      </button>
    </section>
  );
}
