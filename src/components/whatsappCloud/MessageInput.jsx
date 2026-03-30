import { useEffect, useState } from 'react';
import { toast } from '../../Components';
import { buildTemplatePayload, whatsappCloudService } from '../../services/whatsappCloudService';
import { parseApiError } from '../../utils/parseApiError';
import AttachmentUpload from './AttachmentUpload';
import TemplateSelector from './TemplateSelector';

const isImageFile = (file) => file && file.type.startsWith('image/');

export default function MessageInput({
  disabled,
  onSend,
  onSendAttachment,
  canSendTemplateOnly,
  recipient,
}) {
  const [value, setValue] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState('document');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [template, setTemplate] = useState(null);
  const [isSendingTemplate, setIsSendingTemplate] = useState(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  useEffect(() => {
    if (!isImageFile(selectedFile)) {
      setImagePreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!canSendTemplateOnly) return;
    setSelectedFile(null);
    setValue('');
  }, [canSendTemplateOnly]);

  const submit = async () => {
    const body = value.trim();
    if (!body || disabled) return;

    const didSend = await onSend(body);
    if (didSend) setValue('');
  };

  const submitAttachment = async () => {
    if (!selectedFile || disabled) return;

    try {
      setIsUploadingAttachment(true);
      const didSend = await onSendAttachment?.({
        file: selectedFile,
        type: selectedType,
        caption: value.trim(),
      });

      if (didSend) {
        setSelectedFile(null);
        setValue('');
      }
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const sendTemplateMessage = async () => {
    if (!recipient?.trim()) {
      toast.error('Recipient number is required.');
      return;
    }

    if (!template?.name || !template?.language) {
      toast.error('Please select a template first.');
      return;
    }

    try {
      setIsSendingTemplate(true);
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
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to send template message.'));
    } finally {
      setIsSendingTemplate(false);
    }
  };

  return (
    <div className="sticky bottom-0 border-t border-gray-200 bg-white p-3">
      {canSendTemplateOnly ? (
        <>
          <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            You are outside the 24-hour window. Only template messages can be sent.
          </p>
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <TemplateSelector
              selectedTemplate={template}
              onTemplateChange={setTemplate}
              disabled={isSendingTemplate}
            />
            <button
              type="button"
              onClick={sendTemplateMessage}
              disabled={isSendingTemplate || !template}
              className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSendingTemplate ? 'Sending...' : 'Send Template Message'}
            </button>
          </div>
        </>
      ) : null}

      {selectedFile ? (
        <div className="mb-2 rounded-xl border border-gray-200 bg-gray-50 p-2 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-800">{selectedFile.name}</p>
              <p className="text-[11px] text-gray-500">{selectedType.toUpperCase()} · {(selectedFile.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
              onClick={() => setSelectedFile(null)}
            >
              Remove
            </button>
          </div>

          {imagePreviewUrl ? (
            <img src={imagePreviewUrl} alt="Image preview" className="mt-2 max-h-40 rounded-lg object-cover" />
          ) : null}

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={submitAttachment}
              disabled={disabled || isUploadingAttachment}
              className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploadingAttachment ? 'Uploading...' : 'Send Attachment'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 shadow-sm">
        {!canSendTemplateOnly ? (
          <AttachmentUpload
            disabled={disabled}
            onSelectFile={(file, type) => {
              setSelectedFile(file);
              setSelectedType(type || 'document');
            }}
          />
        ) : null}

        <textarea
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={disabled ? 'Text input disabled outside 24h window' : 'Type a message'}
          className="max-h-28 min-h-[40px] flex-1 resize-y border-0 bg-transparent px-2 py-1 text-sm text-gray-900 outline-none"
          disabled={disabled}
          title={disabled ? 'Free-form messages are not allowed outside 24 hours' : undefined}
        />

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          title={disabled ? 'Free-form messages are not allowed outside 24 hours' : undefined}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
