import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RecognitionPage } from './components/RecognitionPage';
import { NotebookPage } from './components/NotebookPage';
import { MistakeDetailModal } from './components/MistakeDetailModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { PrintableDocument } from './components/PrintableDocument';
import { MistakeRecord } from './types';
import {
  getStoredMistakes,
  addMistakeRecord,
  deleteMistakeRecord,
  deleteMultipleMistakes,
  resetToSampleMistakes,
  updateMistakeRecord,
} from './utils/storage';
import { Rocket, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'recognize' | 'notebook'>('recognize');
  const [records, setRecords] = useState<MistakeRecord[]>([]);

  // Modals state
  const [detailModalRecord, setDetailModalRecord] = useState<MistakeRecord | null>(null);
  const [printPreviewRecords, setPrintPreviewRecords] = useState<MistakeRecord[] | null>(null);

  // Load records from local storage on mount
  useEffect(() => {
    const stored = getStoredMistakes();
    setRecords(stored);
  }, []);

  const handleSaveToNotebook = (newRecord: MistakeRecord) => {
    const updated = addMistakeRecord(newRecord);
    setRecords(updated);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = deleteMistakeRecord(id);
    setRecords(updated);
  };

  const handleDeleteMultiple = (ids: string[]) => {
    const updated = deleteMultipleMistakes(ids);
    setRecords(updated);
  };

  const handleResetSamples = () => {
    const samples = resetToSampleMistakes();
    setRecords(samples);
  };

  const handleToggleMastery = (record: MistakeRecord) => {
    const updatedRecord: MistakeRecord = {
      ...record,
      masteryStatus: record.masteryStatus === 'mastered' ? 'learning' : 'mastered',
    };
    const updatedList = updateMistakeRecord(updatedRecord);
    setRecords(updatedList);
    if (detailModalRecord && detailModalRecord.id === record.id) {
      setDetailModalRecord(updatedRecord);
    }
  };

  const handleUpdateRecord = (updatedRecord: MistakeRecord) => {
    const updatedList = updateMistakeRecord(updatedRecord);
    setRecords(updatedList);
    if (detailModalRecord && detailModalRecord.id === updatedRecord.id) {
      setDetailModalRecord(updatedRecord);
    }
  };

  const handleOpenPrintPreview = (selected: MistakeRecord[]) => {
    setPrintPreviewRecords(selected);
  };

  const handleClosePrintPreview = () => {
    setPrintPreviewRecords(null);
  };

  // Mastered counts
  const masteredCount = records.filter((r) => r.masteryStatus === 'mastered').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={records.length}
        masteredCount={masteredCount}
      />

      {/* Main Content Area: Keep both tabs mounted to preserve in-progress recognition state */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
        <div className={activeTab === 'recognize' ? 'block' : 'hidden'}>
          <RecognitionPage
            onSaveToNotebook={handleSaveToNotebook}
            onQuickPrint={(record) => handleOpenPrintPreview([record])}
            onNavigateToNotebook={() => setActiveTab('notebook')}
          />
        </div>
        <div className={activeTab === 'notebook' ? 'block' : 'hidden'}>
          <NotebookPage
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onDeleteMultiple={handleDeleteMultiple}
            onResetSamples={handleResetSamples}
            onViewDetail={(record) => setDetailModalRecord(record)}
            onOpenPrintPreview={handleOpenPrintPreview}
            onNavigateToRecognize={() => setActiveTab('recognize')}
            onToggleMastery={handleToggleMastery}
          />
        </div>
      </main>

      {/* Two-page Layout: Mobile/Tablet Bottom Navigation Bar */}
      <nav className="no-print sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2 shadow-lg flex items-center justify-around">
        <button
          type="button"
          onClick={() => setActiveTab('recognize')}
          className={`flex flex-col items-center py-1 px-4 rounded-xl transition ${
            activeTab === 'recognize'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Rocket className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">错题识别</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notebook')}
          className={`flex flex-col items-center py-1 px-4 rounded-xl transition relative ${
            activeTab === 'notebook'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">错题本</span>
          {records.length > 0 && (
            <span className="absolute top-0 right-2 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-bold">
              {records.length}
            </span>
          )}
        </button>
      </nav>

      {/* Modals */}
      {detailModalRecord && (
        <MistakeDetailModal
          record={detailModalRecord}
          onClose={() => setDetailModalRecord(null)}
          onPrint={(rec) => {
            setDetailModalRecord(null);
            handleOpenPrintPreview([rec]);
          }}
          onToggleMastery={handleToggleMastery}
          onUpdateRecord={handleUpdateRecord}
        />
      )}

      {printPreviewRecords && (
        <PrintPreviewModal
          records={printPreviewRecords}
          onClose={handleClosePrintPreview}
        />
      )}

      {/* Printable container for native browser print / save to PDF */}
      <PrintableDocument records={printPreviewRecords || records} />
    </div>
  );
}
