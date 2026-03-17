"use client";

import { useRef, useEffect } from "react";

interface HtmlPreviewProps {
  html: string;
  className?: string;
}

export function HtmlPreview({ html, className = "" }: HtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      className={`w-full rounded-lg border border-border bg-white ${className}`}
      title="Email preview"
    />
  );
}
