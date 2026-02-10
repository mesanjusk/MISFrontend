import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from '../../Components';
import { whatsappCloudService } from '../../services/whatsappCloudService';
import { parseApiError } from '../../utils/parseApiError';

const defaultForm = {
  recipient: '',
  messageType: 'text',
  text: '',
  mediaUrl: '',
  mediaType: 'image',
  templateVariables: {},
  isWithin24HourWindow: true,
};

export default function SendMessagePanel({ selectedAccountId, selectedTemplateName, templateVariables, onMessageSent }) {
  const [form, setForm] = useState(defaultForm);
  const [isSending, setIsSending] = useState(false);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    setForm((prev) => ({ ...defaultForm, recipient: prev.recipient }));
  }, [selectedAccountId]);

  const validateBeforeSend = () => {
    if (!selectedAccountId) return 'Select an account before sending.';
    if (!form.recipient) return 'Recipient number is required.';

    if (!form.isWithin24HourWindow && form.messageType !== 'template') {
      return 'Outside 24-hour service window: only approved template messages are allowed.';
    }

    if (form.messageType === 'template' && !selectedTemplateName) {
      return 'Select an approved template.';
    }

    if (form.messageType === 'text' && !form.text.trim()) return 'Text message body is required.';
    if (form.messageType === 'media' && !form.mediaUrl.trim()) return 'Media URL is required.';

    return '';
  };

  const handleSend = async () => {
    const validationError = validateBeforeSend();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = {
      accountId: selectedAccountId,
      to: form.recipient,
      type: form.messageType,
      isWithin24HourWindow: form.isWithin24HourWindow,
    };

    if (form.messageType === 'text') payload.text = form.text;
    if (form.messageType === 'template') {
      payload.template = {
        name: selectedTemplateName,
        variables: templateVariables,
      };
    }
    if (form.messageType === 'media') {
      payload.media = {
        type: form.mediaType,
        url: form.mediaUrl,
      };
    }

    try {
      setIsSending(true);
      const response = await whatsappCloudService.sendMessage(payload);
      toast.success('Message sent successfully.');
      onMessageSent?.(response.data?.data || response.data);
      setForm((prev) => ({ ...defaultForm, recipient: prev.recipient }));
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to send message.'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800">Send Message</h3>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm text-gray-700">
          Recipient Number
          <input
            value={form.recipient}
            onChange={(event) => updateField('recipient', event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="+14155552671"
          />
        </label>

        <label className="text-sm text-gray-700">
          Message Type
          <select
            value={form.messageType}
            onChange={(event) => updateField('messageType', event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="text">Text</option>
            <option value="template">Template</option>
            <option value="media">Media</option>
          </select>
        </label>
      </div>

      <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.isWithin24HourWindow}
          onChange={(event) => updateField('isWithin24HourWindow', event.target.checked)}
        />
        Recipient has active 24-hour customer care window
      </label>

      {form.messageType === 'text' ? (
        <label className="block mt-4 text-sm text-gray-700">
          Text Message
          <textarea
            rows={4}
            value={form.text}
            onChange={(event) => updateField('text', event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
      ) : null}

      {form.messageType === 'template' ? (
        <p className="mt-4 text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
          Template mode enabled. Template and variables are selected from the Templates panel.
        </p>
      ) : null}

      {form.messageType === 'media' ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-gray-700">
            Media Type
            <select
              value={form.mediaType}
              onChange={(event) => updateField('mediaType', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
          </label>

          <label className="text-sm text-gray-700">
            Media URL
            <input
              value={form.mediaUrl}
              onChange={(event) => updateField('mediaUrl', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="https://example.com/file.jpg"
            />
          </label>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSend}
        disabled={isSending}
        className="mt-5 rounded-lg bg-green-600 text-white px-4 py-2.5 font-medium disabled:opacity-60"
      >
        {isSending ? 'Sending...' : 'Send WhatsApp Message'}
      </button>
    </section>
  );
}

SendMessagePanel.propTypes = {
  selectedAccountId: PropTypes.string,
  selectedTemplateName: PropTypes.string,
  templateVariables: PropTypes.object,
  onMessageSent: PropTypes.func,
};
