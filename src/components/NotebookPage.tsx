import React, { useState, useMemo } from 'react';
import {
  Printer,
  Trash2,
  CheckSquare,
  Square,
  Search,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  RotateCcw,
  PlusCircle,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { MistakeRecord, SubjectType } from '../types';

interface NotebookPageProps {
  records: MistakeRecord[];
  onDeleteRecord: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onResetSamples: () => void;
  onViewDetail: (record: MistakeRecord) => void;
  onOpenPrintPreview: (selectedRecords: MistakeRecord[]) => void;
  onNavigateToRecognize: () => void;
  onToggleMastery: (record: MistakeRecord) => void;
}

const ALL_SUBJECTS: SubjectType[] = [
  '全部',
  '数学',
  '物理',
  '化学',
  '英语',
  '语文',
  '生物',
  '历史',
  '地理',
];

export const NotebookPage: React.FC<NotebookPageProps> = ({
  records,
  onDeleteRecord,
  onDeleteMultiple,
  onResetSamples,
  onViewDetail,
  onOpenPrintPreview,
  onNavigateToRecognize,
  onToggleMastery,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('全部');
  const [filterMastery, setFilterMastery] = useState<'all' | 'learning' | 'mastered'>('all');

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Subject filter
      if (selectedSubject !== '全部' && r.subject !== selectedSubject) {
        return false;
      }
      // Mastery filter
      if (filterMastery === 'learning' && r.masteryStatus === 'mastered') {
        return false;
      }
      if (filterMastery === 'mastered' && r.masteryStatus !== 'mastered') {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inKp = r.knowledgePoint.toLowerCase().includes(query);
        const inStem = r.questionText.toLowerCase().includes(query);
        const inAnswer = (r.standardAnswer || '').toLowerCase().includes(query);
        const inUserAns = (r.userAnswer || '').toLowerCase().includes(query);
        if (!inKp && !inStem && !inAnswer && !inUserAns) {
          return false;
        }
      }
      return true;
    });
  }, [records, selectedSubject, filterMastery, searchQuery]);

  // Selection handlers
  const isAllSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.includes(r.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all in current view
      const currentViewIdSet = new Set(filteredRecords.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !currentViewIdSet.has(id)));
    } else {
      // Select all in current view
      const newIds = new Set([...selectedIds, ...filteredRecords.map((r) => r.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelectOne = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchPrint = () => {
    const selected = records.filter((r) => selectedIds.includes(r.id));
    if (selected.length === 0) {
      alert('请先勾选需要打印的错题记录');
      return;
    }
    onOpenPrintPreview(selected);
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要从错题本中删除选中的 ${selectedIds.length} 项记录吗？`)) {
      onDeleteMultiple(selectedIds);
      setSelectedIds([]);
    }
  };

  // Quick stats
  const totalVariantsCount = records.reduce((sum, r) => sum + (r.variants?.length || 0), 0);
  const masteredCount = records.filter((r) => r.masteryStatus === 'mastered').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Planet Stats Banner */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>历史错题本</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                共收录 {records.length} 组
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              每组错题均包含原题核心考点与 3 道梯级变式训练，支持一键多选排版为 A4 纸质/PDF
            </p>
          </div>
        </div>

        {/* Stats counters */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-[11px] text-slate-600 font-medium">累计变式题</div>
            <div className="text-base font-black text-indigo-600">{totalVariantsCount} 道</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-[11px] text-amber-700 font-medium">攻克星数</div>
            <div className="text-base font-black text-amber-700">★ {masteredCount}</div>
          </div>
          <button
            type="button"
            onClick={onNavigateToRecognize}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>新添错题</span>
          </button>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Subject Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ALL_SUBJECTS.map((sub) => {
            const count =
              sub === '全部'
                ? records.length
                : records.filter((r) => r.subject === sub).length;
            const isSelected = selectedSubject === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{sub}</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input + Mastery Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索题目、考点（如：判别式、欧姆定律）..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <select
              value={filterMastery}
              onChange={(e: any) => setFilterMastery(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="learning">待攻克</option>
              <option value="mastered">已攻克 ★</option>
            </select>
          </div>
        </div>
      </section>

      {/* Batch Actions Header (全选/多选/打印/删除) */}
      <section className="bg-slate-100/90 rounded-2xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{isAllSelected ? '取消全选' : '全选本页'}</span>
          </button>

          <span className="text-xs text-slate-600">
            已选中{' '}
            <strong className="text-indigo-700 font-bold">{selectedIds.length}</strong> /{' '}
            {filteredRecords.length} 项
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Print button */}
          <button
            type="button"
            onClick={handleBatchPrint}
            disabled={selectedIds.length === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs ${
              selectedIds.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印所选错题 (生成PDF)</span>
          </button>

          {/* Delete button */}
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除 ({selectedIds.length})</span>
            </button>
          )}

          {/* Restore sample data button */}
          <button
            type="button"
            onClick={() => {
              if (confirm('确定要重置并恢复初始示例错题吗？')) {
                onResetSamples();
              }
            }}
            title="恢复初始预设示例错题"
            className="p-2 rounded-xl bg-white hover:bg-slate-200/70 border border-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Card List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {records.length === 0 ? '错题本空空如也' : '未匹配到符合条件的错题'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {records.length === 0
              ? '您可以上传拍摄错题进行智能识别，或点击下方按钮恢复示例错题'
              : '尝试调整学科筛选或清空搜索关键词'}
          </p>
          <div className="pt-2 flex items-center justify-center space-x-3">
            {records.length === 0 ? (
              <>
                <button
                  type="button"
                  onClick={onResetSamples}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  恢复示例错题
                </button>
                <button
                  type="button"
                  onClick={onNavigateToRecognize}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                >
                  去上传错题
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedSubject('全部');
                  setSearchQuery('');
                  setFilterMastery('all');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold"
              >
                清空所有筛选
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((record) => {
            const isSelected = selectedIds.includes(record.id);
            const dateStr = new Date(record.createdAt).toLocaleDateString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
            });

            return (
              <div
                key={record.id}
                onClick={() => onViewDetail(record)}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group relative ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500/30'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div
                        onClick={(e) => handleToggleSelectOne(record.id, e)}
                        className="p-1 rounded hover:bg-slate-100"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-xs font-black bg-indigo-100 text-indigo-800">
                        {record.subject}
                      </span>
                      {record.gradeLevel && (
                        <span className="text-[11px] text-slate-500">{record.gradeLevel}</span>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Calendar className="w-3 h-3 mr-0.5" />
                        {dateStr}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {record.masteryStatus === 'mastered' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center">
                          ★ 已攻克
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          待突破
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Knowledge Point Tag */}
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition flex-1">
                      {record.knowledgePoint}
                    </h4>
                    {record.imageUrl && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 shrink-0">
                        📷 含图示
                      </span>
                    )}
                  </div>

                  {/* Thumbnail if present */}
                  {record.imageUrl && (
                    <div className="mb-2.5 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                      <img
                        src={record.imageUrl}
                        alt="错题图示缩略图"
                        className="h-full object-contain mx-auto"
                      />
                    </div>
                  )}

                  {/* Question Stem Excerpt */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3 font-medium">
                    {record.questionText}
                  </p>

                  {/* Student Original Error Preview */}
                  {record.userAnswer && (
                    <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100 text-[11px] text-rose-800 line-clamp-1 mb-3">
                      <span className="font-bold">❌ 原错答：</span>
                      {record.userAnswer}
                    </div>
                  )}
                </div>

                {/* Card Footer: Variants Count, Practice Rounds & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-700">
                    <span className="bg-indigo-50/80 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {record.practiceRounds && record.practiceRounds.length > 1
                          ? `${record.practiceRounds.length} 轮变式特训`
                          : '3道举一反三题'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700 flex items-center">
                      <span>✍️ 在线作答</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition" />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPrintPreview([record]);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="打印此题组"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('确定要删除这道错题吗？')) {
                          onDeleteRecord(record.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="删除错题"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition pl-1">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
