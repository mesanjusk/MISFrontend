import { useState } from 'react';
import { toast } from '../../Components';
import { buildTemplatePayload, whatsappCloudService } from '../../services/whatsappCloudService';
import { parseApiError } from '../../utils/parseApiError';
import TemplateSelector from './TemplateSelector';

export default function TemplateMessageComposer({
  recipient,
  className = '',
  buttonLabel = 'Send Template Message',
  disabled = false,
  onSent,
}) {
  const [template, setTemplate] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const handleSendTemplate = async () => {
    if (!recipient?.trim()) {
      toast.error('Recipient number is required.');
      return;
    }

    if (!template?.name || !template?.language) {
      toast.error('Please select a template first.');
      return;
    }

    try {
      setIsSending(true);
      await whatsappCloudService.sendTemplateMessage(
        buildTemplatePayload({
          to: recipient.trim(),
          template: {
            name: template.name,
            language: template.language,
            parameters: template.parameters || [],
          },
        }),
      );
      toast.success('Template sent successfully.');
      setTemplate(null);
      onSent?.();
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to send template message.'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={className}>
      <TemplateSelector
        selectedTemplate={template}
        onTemplateChange={setTemplate}
        disabled={disabled || isSending}
      />
      <button
        type="button"
        onClick={handleSendTemplate}
        disabled={disabled || isSending || !template}
        className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSending ? 'Sending...' : buttonLabel}
      </button>
    </div>
  );
}
