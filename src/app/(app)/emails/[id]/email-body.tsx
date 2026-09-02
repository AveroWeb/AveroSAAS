"use client";

import { useRef, useState } from "react";

/** Renders untrusted HTML email content in a sandboxed, script-less iframe. */
export function EmailBody({ html, text }: { html: string | null; text: string | null }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);

  if (html) {
    return (
      <iframe
        ref={iframeRef}
        title="Contenu de l'email"
        sandbox=""
        srcDoc={html}
        className="w-full rounded-md border"
        style={{ height }}
        onLoad={() => {
          const doc = iframeRef.current?.contentWindow?.document;
          if (doc) setHeight(Math.min(doc.documentElement.scrollHeight + 24, 2000));
        }}
      />
    );
  }

  return (
    <pre className="whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-4 text-sm font-sans">
      {text || "(email vide)"}
    </pre>
  );
}
