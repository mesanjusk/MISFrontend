import { useState } from 'react';
import { toast } from '../../Components';
import { parseApiError } from '../../utils/parseApiError';
import { buildTemplatePayload, whatsappCloudService } from '../../services/whatsappCloudService';
import TemplateSelector from './TemplateSelector';
import BulkSender from './BulkSender';

const initialForm = {
  to: '',
  body: '',
};

export default function SendMessagePanel() {
  const [form, setForm] = useState(initialForm);
  const [template, setTemplate] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSendText = async () => {
    if (!form.to.trim()) {
      toast.error('Recipient number is required.');
      return;
    }

    if (!form.body.trim()) {
      toast.error('Message body is required.');
      return;
    }

    try {
      setIsSending(true);
      await whatsappCloudService.sendTextMessage({
        to: form.to.trim(),
        body: form.body.trim(),
      });
      toast.success('Message sent successfully.');
      setForm((prev) => ({ ...prev, body: '' }));
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to send message.'));
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!form.to.trim()) {
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
          to: form.to.trim(),
          template: {
            name: template.name,
            language: template.language,
            parameters: template.parameters || [],
          },
        }),
      );
      toast.success('Template sent successfully.');
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to send template message.'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800">Send Approved Tempate</h3>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <label className="text-sm text-gray-700">
            Recipient Number
            <input
              value={form.to}
              onChange={(event) => handleChange('to', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="+14155552671"
            />
          </label>

          

          <TemplateSelector selectedTemplate={template} onTemplateChange={setTemplate} disabled={isSending} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          

          <button
            type="button"
            onClick={handleSendTemplate}
            disabled={isSending || !template}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 font-medium text-blue-700 disabled:opacity-60"
          >
            {isSending ? 'Sending...' : 'Send Template Message'}
          </button>
        </div>
      </section>

      <BulkSender />
    </div>
  );
}
