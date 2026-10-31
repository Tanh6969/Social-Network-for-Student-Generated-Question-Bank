import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { X, FileSpreadsheet, Download, CheckCircle, FileText, Code2 } from 'lucide-react';

export const ExportQuestionsModal: React.FC = () => {
  const { isExportQuestionsOpen, setIsExportQuestionsOpen, showToast } = useApp();

  const [format, setFormat] = useState<'EXCEL' | 'WORD' | 'PDF' | 'JSON'>('EXCEL');
  const [subject, setSubject] = useState('Tất cả môn học');
  const [includeExplanation, setIncludeExplanation] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);

  if (!isExportQuestionsOpen) return null;

  const handleExport = () => {
    showToast(`Đã xuất và tải xuống ngân hàng câu hỏi định dạng ${format} thành công!`, 'success');
    setIsExportQuestionsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-lg w-full p-5 border border-fb-divider space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-fb-divider">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-fb-text">
                Xuất Dữ Liệu Ngân Hàng Câu Hỏi (EXPORT.01)
              </h3>
              <p className="text-[11px] text-gray-500">
                Tải về để in ấn, lưu trữ kho lưu trữ trường hoặc tích hợp LMS
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExportQuestionsOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div>
          <label className="block text-xs font-bold text-fb-text mb-2">
            Định dạng xuất file:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'EXCEL', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
              { id: 'WORD', label: 'Word (.docx)', icon: FileText },
              { id: 'PDF', label: 'PDF in ấn', icon: Download },
              { id: 'JSON', label: 'JSON API', icon: Code2 }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id as any)}
                className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition ${
                  format === f.id
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 font-bold ring-1 ring-emerald-600'
                    : 'border-fb-divider hover:bg-fb-hover'
                }`}
              >
                <f.icon className="w-5 h-5" />
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-fb-text mb-1">
            Môn học cần xuất:
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-fb-input"
          >
            <option value="Tất cả môn học">Tất cả môn học</option>
            <option value="Mạng máy tính">Mạng máy tính</option>
            <option value="Cấu trúc dữ liệu & Giải thuật">Cấu trúc dữ liệu & Giải thuật</option>
            <option value="Cơ sở dữ liệu">Cơ sở dữ liệu</option>
            <option value="Giải tích 1">Giải tích 1</option>
          </select>
        </div>

        <div className="space-y-2 text-xs text-fb-text pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeExplanation}
              onChange={(e) => setIncludeExplanation(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span>Bao gồm lời giải & giải thích chi tiết</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeStats}
              onChange={(e) => setIncludeStats(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span>Bao gồm số liệu thống kê (Tỉ lệ đúng %, Số lượt làm)</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-fb-divider">
          <button
            onClick={() => setIsExportQuestionsOpen(false)}
            className="px-4 py-2 border rounded-lg text-xs font-semibold"
          >
            Đóng
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Tải file về máy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
