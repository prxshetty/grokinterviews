'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './dialog';
import { Resource } from '@/types/resources.types';

interface PdfViewerProps {
  resource: Resource;
  isOpen: boolean;
  onClose: () => void;
}

export function PdfViewer({ resource, isOpen, onClose }: PdfViewerProps) {
  if (!resource.url) {
    return null;
  }

  // Use directPdfUrl if available (from PDF metadata), otherwise fall back to url
  const pdfUrl = resource.directPdfUrl || resource.url;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full h-[90vh] p-0 sm:max-w-4xl" showCloseButton={false}>
        <DialogTitle className="sr-only">
          {resource.title || 'PDF Document'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          PDF viewer for {resource.title || 'document'}. Use keyboard navigation or screen reader to interact with the PDF content.
        </DialogDescription>
        <div className="w-full h-full overflow-hidden relative">
          <iframe
            src={pdfUrl}
            title={resource.title || 'PDF Document'}
            className="w-full h-full border-0 absolute inset-0"
            loading="lazy"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}