import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import type { PostDocument } from '../../demo/types';

function canPreview(document: PostDocument): boolean {
  if (/\.pdf$/iu.test(document.name))
    return !document.mimeType || document.mimeType === 'application/pdf';
  if (/\.txt$/iu.test(document.name))
    return !document.mimeType || document.mimeType === 'text/plain';
  return false;
}

function formatSize(size: number): string {
  return size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function PostDocuments({
  documents,
  onRemove,
}: {
  documents: PostDocument[];
  onRemove?: (index: number) => void;
}) {
  const [selected, setSelected] = useState<PostDocument | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [selected]);

  if (!documents.length) return null;

  return (
    <>
      <div className="space-y-2">
        {documents.map((document, index) => (
          <div
            key={`${document.url}-${index}`}
            className="flex items-center gap-3 rounded-lg border border-fb-divider bg-fb-inset p-3"
          >
            <FileText className="h-6 w-6 shrink-0 text-fb-blue" />
            <button
              type="button"
              onClick={() => setSelected(document)}
              className="min-w-0 flex-1 text-left"
              aria-label={`Xem tài liệu ${document.name}`}
            >
              <span className="block truncate text-sm font-semibold text-fb-text hover:underline">
                {document.name}
              </span>
              <span className="text-xs text-fb-text-2">
                {formatSize(document.size)}
              </span>
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => {
                  if (selected?.url === document.url) setSelected(null);
                  onRemove(index);
                }}
                aria-label={`Gỡ tài liệu ${document.name}`}
                className="rounded-full p-1.5 text-fb-text-2 hover:bg-fb-btn-hover"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Tài liệu ${selected.name}`}
            className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-fb-card"
          >
            <div className="flex items-center gap-3 border-b border-fb-divider p-3">
              <FileText className="h-5 w-5 shrink-0 text-fb-blue" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fb-text">
                {selected.name}
              </span>
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mở tài liệu trong tab mới"
                className="rounded-full p-2 text-fb-text-2 hover:bg-fb-hover"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={selected.url}
                download={selected.name}
                aria-label="Tải tài liệu xuống"
                className="rounded-full p-2 text-fb-text-2 hover:bg-fb-hover"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Đóng tài liệu"
                className="rounded-full p-2 text-fb-text-2 hover:bg-fb-hover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {canPreview(selected) ? (
              <iframe
                title={selected.name}
                src={selected.url}
                className="min-h-0 w-full flex-1 bg-fb-card"
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <FileText className="h-12 w-12 text-fb-blue" />
                <p className="max-w-md text-sm text-fb-text-2">
                  Trình duyệt không xem trực tiếp định dạng này. Mở tệp trong
                  tab mới hoặc tải xuống để xem.
                </p>
                <a
                  href={selected.url}
                  download={selected.name}
                  className="rounded-lg bg-fb-blue px-4 py-2 text-sm font-semibold text-white hover:bg-fb-blue-hover"
                >
                  Tải tài liệu
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
