import { useState } from 'react';
import { toast } from '../../Components';
import { parseApiError } from '../../utils/parseApiError';
import { whatsappCloudService } from '../../services/whatsappCloudService';

const initialForm = {
  to: '',
  body: '',
};

export default function SendMessagePanel() {
  const [form, setForm] = useState(initialForm);
  const [isSending, setIsSending] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSend = async () => {
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

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800">Send Message</h3>

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

        <label className="text-sm text-gray-700">
          Message
          <textarea
            rows={4}
            value={form.body}
            onChange={(event) => handleChange('body', event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Type your message"
          />
        </label>
      </div>

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
