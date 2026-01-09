import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Patient } from '../../types';

interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string;
  fileName: string;
  onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  imageUrl,
  fileName,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
        >
          ×
        </button>
        <img
          src={imageUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
        <div className="absolute bottom-4 left-4 right-4 text-white text-center bg-black bg-opacity-50 rounded-lg p-2">
          <p className="text-sm font-medium">{fileName}</p>
        </div>
      </div>
    </div>
  );
};

interface PatientAttachmentsProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  className?: string;
}

const PatientAttachments: React.FC<PatientAttachmentsProps> = ({
  patient,
  onUpdatePatient,
  className = '',
}) => {
  const { t } = useI18n();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  // Handle file upload - same as patient images
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(t('patient_attachments.upload_image_only'));
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(t('patient_attachments.file_too_large'));
          return;
        }

        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const updatedPatient = {
              ...patient,
              attachments: [...(patient.attachments || []), event.target!.result as string]
            };
            onUpdatePatient(updatedPatient);
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle attachment deletion
  const handleDeleteAttachment = (index: number) => {
    if (!confirm(t('patient_attachments.confirm_delete'))) {
      return;
    }

    const updatedPatient = {
      ...patient,
      attachments: patient.attachments?.filter((_, i) => i !== index) || []
    };
    onUpdatePatient(updatedPatient);
  };

  const attachments = patient.attachments || [];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <div className="space-y-4">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isUploading ? t('patient_attachments.uploading') : t('patient_attachments.choose_file')}
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          <p className="text-xs text-gray-500">
            {t('patient_attachments.upload_instructions')}
          </p>
        </div>
      </div>

      {/* Attachments Grid */}
      {attachments.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors">
                <img
                  src={attachment}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedImage({
                    url: attachment,
                    fileName: `Attachment ${index + 1}`,
                  })}
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    <button
                      onClick={() => setSelectedImage({
                        url: attachment,
                        fileName: `Attachment ${index + 1}`,
                      })}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 transition-colors"
                      title={t('patient_attachments.view')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDeleteAttachment(index)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors"
                      title={t('patient_attachments.delete')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="mt-2 text-xs text-gray-600">
                <p className="truncate font-medium">{`Attachment ${index + 1}`}</p>
                <p className="text-gray-400">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2">
            {t('patient_attachments.no_attachments')}
          </p>
          <p className="text-sm">
            {t('patient_attachments.upload_first')}
          </p>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={!!selectedImage}
        imageUrl={selectedImage?.url || ''}
        fileName={selectedImage?.fileName || ''}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};

export default PatientAttachments;
