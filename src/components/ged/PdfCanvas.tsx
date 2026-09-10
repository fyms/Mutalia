"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
export function PdfCanvas({
  url,
  page,
  zoom,
  onLoaded,
}: {
  url: string;
  page: number;
  zoom: number;
  onLoaded: (pages: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const loaded = useRef(onLoaded);
  useEffect(() => {
    loaded.current = onLoaded;
  }, [onLoaded]);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(480);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(150, entries[0].contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let active = true;
    let doc: PDFDocumentProxy | undefined;
    let loadingTask:
      ReturnType<(typeof import("pdfjs-dist"))["getDocument"]> | undefined;
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(url, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error("PDF indisponible ou session expirée.");
        const bytes = await response.arrayBuffer();
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        loadingTask = pdfjs.getDocument({ data: bytes });
        doc = await loadingTask.promise;
        if (active) {
          setPdf(doc);
          loaded.current(doc.numPages);
        }
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "PDF non lisible");
      }
    })();
    return () => {
      active = false;
      controller.abort();
      void loadingTask?.destroy();
    };
  }, [url]);
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let cancelled = false;
    let task:
      | ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>
      | undefined;
    (async () => {
      try {
        setReady(false);
        const p = await pdf.getPage(page);
        if (cancelled) return;
        const base = p.getViewport({ scale: 1 });
        const scale = (width / base.width) * (zoom / 100);
        const viewport = p.getViewport({ scale });
        const c = canvas.current!;
        c.width = viewport.width;
        c.height = viewport.height;
        task = p.render({ canvas: c, viewport });
        await task.promise;
        const content = await p.getTextContent();
        if (!cancelled) {
          setText(
            content.items
              .map((item) => ("str" in item ? item.str : ""))
              .join("\n"),
          );
          setReady(true);
        }
      } catch {
        if (!cancelled)
          setError("PDF non lisible. Utilisez le lien ouvrir / télécharger.");
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, page, zoom, width]);
  return (
    <div ref={host} className="m-pdf-host">
      {error ? (
        <p role="alert" className="m-error p-3">
          {error}
        </p>
      ) : (
        <>
          <p role="status" className="m-help">
            {ready ? `Page ${page} affichée` : "Chargement du document…"}
          </p>
          <div
            role="region"
            aria-label="Aperçu PDF"
            tabIndex={0}
            className="m-pdf-scroll"
          >
            <canvas
              ref={canvas}
              data-ready={ready}
              aria-label={`Document fictif, page ${page}`}
            />
          </div>
          <details>
            <summary>Texte du document</summary>
            <pre className="whitespace-pre-wrap text-sm">{text}</pre>
          </details>
        </>
      )}
    </div>
  );
}
