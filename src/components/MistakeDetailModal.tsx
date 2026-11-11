import React, { useState } from 'react';
import {
  X,
  Printer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  Award,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MistakeRecord } from '../types';
import { renderHighlightedText } from '../utils/highlight';

interface MistakeDetailModalProps {
  record: MistakeRecord | null;
  onClose: () => void;
  onPrint: (record: MistakeRecord) => void;
  onToggleMastery?: (record: MistakeRecord) => void;
}

export const MistakeDetailModal: React.FC<MistakeDetailModalProps> = ({
  record,
  onClose,
  onPrint,
  onToggleMastery,
}) => {
  if (!record) return null;

  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({
    original: true,
  });

  const toggleReveal = (key: string) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleMastery = () => {
    if (onToggleMastery) {
      onToggleMastery(record);
      if (record.masteryStatus !== 'mastered') {
        try {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }
      }
    }
  };

  const formattedDate = new Date(record.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs">
              {record.subject}
            </span>
            <span className="text-xs text-slate-500 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              {formattedDate}
            </span>
            {record.gradeLevel && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                {record.gradeLevel}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onPrint(record)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>排版打印本题组</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Knowledge Point Tag Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-amber-800 flex items-center mb-1">
                <Tag className="w-3.5 h-3.5 mr-1 text-amber-600" />
                <span>核心知识点：</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                {record.knowledgePoint}
              </h3>
              {record.knowledgeSummary && (
                <p className="mt-1.5 text-xs text-amber-900 font-medium">
                  💡 <span className="font-bold">秒杀口诀：</span>
                  {record.knowledgeSummary}
                </p>
              )}
            </div>

            {onToggleMastery && (
              <button
                type="button"
                onClick={handleToggleMastery}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0 ${
                  record.masteryStatus === 'mastered'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-slate-300'
                }`}
              >
                <Award
                  className={`w-4 h-4 ${
                    record.masteryStatus === 'mastered' ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span>
                  {record.masteryStatus === 'mastered' ? '已攻克 · 星星+1' : '标为已攻克'}
                </span>
              </button>
            )}
          </div>

          {/* 1. Original Problem Card */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-black">
                【原错题内容】
              </span>
              <button
                type="button"
                onClick={() => toggleReveal('original')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
              >
                <span>{revealedAnswers['original'] ? '收起答案' : '查看原题答案'}</span>
                {revealedAnswers['original'] ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Attached Photo if any */}
            {record.imageUrl && (
              <div className="my-3 max-h-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                <img
                  src={record.imageUrl}
                  alt="原题拍照记录"
                  className="max-h-48 object-contain mx-auto"
                />
              </div>
            )}

            <div className="text-slate-800 text-sm font-medium leading-relaxed whitespace-pre-line">
              {record.questionText}
            </div>

            {/* Options */}
            {record.options && record.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {record.options.map((opt, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium"
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}

            {/* Student's Error vs Standard Answer */}
            {revealedAnswers['original'] && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                {record.userAnswer && (
                  <div className="text-xs bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 text-rose-900">
                    <span className="font-bold text-rose-800 mr-1.5">❌ 学生原错答：</span>
                    {record.userAnswer}
                  </div>
                )}
                <div className="text-xs bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-emerald-950">
                  <span className="font-bold text-emerald-800 mr-1.5">✅ 标准答案：</span>
                  {record.standardAnswer}
                </div>
                {record.explanation && (
                  <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                    <span className="font-bold text-slate-800 mr-1">解题思路：</span>
                    {record.explanation}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Variant Practice Problems (举一反三) */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h4 className="text-base font-black text-slate-900">
                举一反三变式训练 (共 3 题)
              </h4>
            </div>

            {record.variants && record.variants.length > 0 ? (
              record.variants.map((v, idx) => {
                const isRevealed = !!revealedAnswers[v.id || idx];
                return (
                  <div
                    key={v.id || idx}
                    className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            idx === 0
                              ? 'bg-blue-100 text-blue-800'
                              : idx === 1
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {v.level || `变式 ${idx + 1}`}
                        </span>
                        <h5 className="font-bold text-slate-800 text-sm">{v.title}</h5>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleReveal(v.id || String(idx))}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                      >
                        <span>{isRevealed ? '隐藏解析' : '自测后揭晓解析'}</span>
                        {isRevealed ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Question Stem */}
                    <div className="text-slate-800 text-sm font-medium leading-relaxed whitespace-pre-line">
                      {v.questionText}
                    </div>

                    {/* Options */}
                    {v.options && v.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {v.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Revealed Answer & Pitfall Analysis */}
                    {isRevealed && (
                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-start space-x-2 text-xs">
                          <span className="font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100 shrink-0">
                            标准答案
                          </span>
                          <span className="font-bold text-emerald-950 text-sm leading-normal">
                            {v.standardAnswer}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-800 block mb-0.5">
                            【完整步骤】：
                          </span>
                          <div className="whitespace-pre-line">{v.explanation}</div>
                        </div>

                        {/* Pitfall Alert Box */}
                        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300">
                          <div className="flex items-center space-x-1.5 text-amber-900 font-black text-xs mb-1">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>【易错点深度避坑剖析】：</span>
                          </div>
                          <div className="text-xs text-amber-950 leading-relaxed">
                            {renderHighlightedText(v.pitfallAnalysis, v.keywordsToHighlight)}
                          </div>
                          {v.keywordsToHighlight && v.keywordsToHighlight.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {v.keywordsToHighlight.map((kw, kwIdx) => (
                                <span
                                  key={kwIdx}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900"
                                >
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center p-6 text-slate-400 text-xs bg-slate-50 rounded-xl">
                暂未生成变式题目
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            久久的闯关星球 · 掌握一道错题，攻克一个模块
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition"
          >
            完成查看
          </button>
        </div>
      </div>
    </div>
  );
};
