import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface ShareMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export const ShareMapModal: React.FC<ShareMapModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
}) => {
  const [copied, setCopied] = useState(false);

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Share Map View
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors duration-150"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-sm mb-4">
            Share this link with your customers to show them the current filtered distributor map view.
          </p>

          {/* URL Display Box */}
          <div className="relative">
            <div className="flex items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-gray-700 text-sm outline-none select-all"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyToClipboard}
              className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Info Message */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> This URL includes all current filters (category, distributors, search) and will display the exact view you're sharing.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-150"
          >
            Close
          </button>
          <button
            onClick={handleCopyToClipboard}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {copied ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Copied to Clipboard
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Copy Link
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
