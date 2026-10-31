import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  FileCode,
  Plus,
  Download,
  Database,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ExamDetailResponse } from '../../../api';
import { ExamListView } from './exams/ExamListView';
import { ExamGenerateForm } from './exams/ExamGenerateForm';
import { QuestionBankExportView } from './exams/QuestionBankExportView';
import { ExamDetailView } from './exams/ExamDetailView';

export type ExamViewTab = 'LIST' | 'GENERATE' | 'EXPORT_BANK';

export const ExamsView: React.FC = () => {
  const { role, switchRole, setActiveTab, showToast } = useApp();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<ExamViewTab>('LIST');

  // Currently viewing exam detail (null = show tab views)
  const [viewingExamId, setViewingExamId] = useState<number | null>(null);
  const [newlyCreatedExam, setNewlyCreatedExam] = useState<ExamDetailResponse | null>(null);

  // If user is not LECTURER, prevent access and show helpful notice
  if (role !== 'LECTURER') {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-fb-text">
          Khu vực dành riêng cho Giảng viên
        </h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Chức năng Quản lý đề thi và Xuất ngân hàng câu hỏi chỉ khả dụng cho tài khoản Giảng viên để bảo mật ma trận đề thi và đáp án học thuật.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => switchRole('LECTURER')}
            className="px-4 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Chuyển sang vai trò Giảng viên</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className="px-4 py-2 bg-fb-input text-fb-text rounded-lg text-xs font-semibold hover:bg-gray-200 transition cursor-pointer"
          >
            Quay về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Handler when an exam is created from generator
  const handleExamCreated = (exam: ExamDetailResponse) => {
    if (exam.exam_id) {
      setNewlyCreatedExam(exam);
      setViewingExamId(exam.exam_id);
    } else {
      setActiveSubTab('LIST');
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 space-y-4">
      {/* Top Banner Header */}
      <div className="bg-fb-card rounded-lg shadow-fb-card p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2.5 rounded-lg bg-blue-600 text-white shadow-xs">
                <FileCode className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-fb-text tracking-tight">
                Quản lý Đề thi & Xuất dữ liệu
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Dành cho Giảng viên
              </span>
            </div>
            <p className="text-xs text-fb-text-2">
              Sinh đề thi tự động từ câu hỏi đã duyệt, quản lý danh sách đề thi đã tạo và xuất dữ liệu ra định dạng PDF / Excel.
            </p>
          </div>

          {/* Quick Header CTA */}
          {!viewingExamId && (
            <div className="flex items-center gap-2 flex-wrap">
              {activeSubTab !== 'GENERATE' && (
                <button
                  type="button"
                  onClick={() => {
                    setViewingExamId(null);
                    setActiveSubTab('GENERATE');
                  }}
                  className="px-4 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo đề thi mới</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3 Main Area Navigation Tabs (Only when not in exam detail view) */}
        {!viewingExamId && (
          <div className="flex items-center gap-2 border-t border-fb-divider pt-4 mt-4 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('LIST')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSubTab === 'LIST'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-fb-input text-fb-text hover:bg-fb-btn-hover'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Danh sách đề thi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('GENERATE')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSubTab === 'GENERATE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-fb-input text-fb-text hover:bg-fb-btn-hover'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo đề thi tự động</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('EXPORT_BANK')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSubTab === 'EXPORT_BANK'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-fb-input text-fb-text hover:bg-fb-btn-hover'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Xuất ngân hàng câu hỏi</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="w-full">
        {viewingExamId ? (
          <ExamDetailView
            examId={viewingExamId}
            initialData={newlyCreatedExam?.exam_id === viewingExamId ? newlyCreatedExam : null}
            onBack={() => {
              setViewingExamId(null);
              setNewlyCreatedExam(null);
            }}
            showToast={showToast}
          />
        ) : (
          <>
            {activeSubTab === 'LIST' && (
              <ExamListView
                onSelectExam={(id) => setViewingExamId(id)}
                onNavigateToGenerate={() => setActiveSubTab('GENERATE')}
                showToast={showToast}
              />
            )}

            {activeSubTab === 'GENERATE' && (
              <ExamGenerateForm
                onExamCreated={handleExamCreated}
                showToast={showToast}
              />
            )}

            {activeSubTab === 'EXPORT_BANK' && (
              <QuestionBankExportView showToast={showToast} />
            )}
          </>
        )}
      </main>
    </div>
  );
};
