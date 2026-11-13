import React, { useState } from 'react';
import {
  X,
  Printer,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  Award,
  RefreshCw,
  Image as ImageIcon,
  ZoomIn,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MistakeRecord, VariantProblem, PracticeRound } from '../types';
import { renderHighlightedText } from '../utils/highlight';
import { InteractiveAnswerBox } from './InteractiveAnswerBox';

interface MistakeDetailModalProps {
  record: MistakeRecord | null;
  onClose: () => void;
  onPrint: (record: MistakeRecord) => void;
  onToggleMastery?: (record: MistakeRecord) => void;
  onUpdateRecord?: (record: MistakeRecord) => void;
}

export const MistakeDetailModal: React.FC<MistakeDetailModalProps> = ({
  record: initialRecord,
  onClose,
  onPrint,
  onToggleMastery,
  onUpdateRecord,
}) => {
  if (!initialRecord) return null;

  const [record, setRecord] = useState<MistakeRecord>(initialRecord);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);
  const [isGeneratingNextRound, setIsGeneratingNextRound] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);

  // Maintain revealed answers per variant ID
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({
    original: true,
  });

  // Calculate practice rounds: if record has practiceRounds use them; otherwise construct Round 1 from record.variants
  const practiceRounds: PracticeRound[] =
    record.practiceRounds && record.practiceRounds.length > 0
      ? record.practiceRounds
      : [
          {
            round: 1,
            generatedAt: record.createdAt,
            title: '第 1 轮母题特训 (基础巩固)',
            variants: record.variants,
          },
        ];

  // Active variants for current selected round tab
  const activeRound = practiceRounds[selectedRoundIndex] || practiceRounds[0];
  const activeVariants = activeRound?.variants || [];

  const toggleReveal = (key: string) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleMastery = () => {
    if (onToggleMastery) {
      onToggleMastery(record);
      const nextStatus: 'learning' | 'mastered' =
        record.masteryStatus === 'mastered' ? 'learning' : 'mastered';
      const updated: MistakeRecord = { ...record, masteryStatus: nextStatus };
      setRecord(updated);

      if (nextStatus === 'mastered') {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // Submit answer for interactive practice under a variant
  const handleAnswerSubmit = (problemId: string, answer: string, isCorrect: boolean) => {
    const updatedVariants = activeVariants.map((v) => {
      if (v.id === problemId) {
        return {
          ...v,
          childAnswer: answer,
          isCorrect,
          hasChecked: true,
          answeredAt: Date.now(),
        };
      }
      return v;
    });

    const updatedRounds = practiceRounds.map((r, idx) => {
      if (idx === selectedRoundIndex) {
        return { ...r, variants: updatedVariants };
      }
      return r;
    });

    const updatedRecord: MistakeRecord = {
      ...record,
      variants: selectedRoundIndex === 0 ? updatedVariants : record.variants,
      practiceRounds: updatedRounds,
    };

    setRecord(updatedRecord);
    if (onUpdateRecord) {
      onUpdateRecord(updatedRecord);
    }
  };

  // Request next round of 3 variants when student is still struggling ("做完还是不会，再来一组！")
  const handleGenerateNextRound = async () => {
    setIsGeneratingNextRound(true);
    setGenerateError(null);

    const nextRoundNumber = practiceRounds.length + 1;

    try {
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: record.questionText,
          knowledgePoint: record.knowledgePoint,
          subject: record.subject,
          gradeLevel: record.gradeLevel || '小学三年级',
          standardAnswer: record.standardAnswer,
          userAnswer: record.userAnswer,
          round: nextRoundNumber,
          diagramDescription: record.diagramDescription,
        }),
      });

      const resText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(resText);
      } catch {
        throw new Error('解析生成数据失败，请重试');
      }

      if (!res.ok || json.error) {
        throw new Error(json.error || '生成新一轮变式题失败，请重试');
      }

      const rawVariants: VariantProblem[] = json.data?.variants || [];
      if (rawVariants.length === 0) {
        throw new Error('未获取到变式题目，请点击重试');
      }

      const newVariants: VariantProblem[] = rawVariants.map((v, vIdx) => ({
        ...v,
        id: `var-r${nextRoundNumber}-${Date.now()}-${vIdx}-${Math.random().toString(36).slice(2, 6)}`,
        childAnswer: '',
        hasChecked: false,
        isCorrect: null,
      }));

      // Append new round
      const newRound: PracticeRound = {
        round: nextRoundNumber,
        generatedAt: Date.now(),
        title: `第 ${nextRoundNumber} 轮定向强化 (换3道新题)`,
        variants: newVariants,
      };

      const updatedRounds = [...practiceRounds, newRound];
      const updatedRecord: MistakeRecord = {
        ...record,
        practiceRounds: updatedRounds,
      };

      setRecord(updatedRecord);
      setSelectedRoundIndex(updatedRounds.length - 1);

      if (onUpdateRecord) {
        onUpdateRecord(updatedRecord);
      }

      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      console.error(err);
      setGenerateError(err?.message || '生成新一轮题目失败，请检查网络');
    } finally {
      setIsGeneratingNextRound(false);
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
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">
                {record.gradeLevel}
              </span>
            )}
            {practiceRounds.length > 1 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center">
                <Layers className="w-3 h-3 mr-1" /> 已练 {practiceRounds.length} 轮
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
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
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
                  💡 <span className="font-bold">解题口诀：</span>
                  {record.knowledgeSummary}
                </p>
              )}
            </div>

            {onToggleMastery && (
              <button
                type="button"
                onClick={handleToggleMastery}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0 cursor-pointer ${
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

          {/* 1. Original Problem Card with Diagram / Picture Preview */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-black">
                【原错题内容回顾】
              </span>
              <button
                type="button"
                onClick={() => toggleReveal('original')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <span>{revealedAnswers['original'] ? '收起答案' : '查看原题答案'}</span>
                {revealedAnswers['original'] ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Attached Photo / Graphic Diagram Section */}
            {record.imageUrl && (
              <div className="my-3 rounded-xl border border-indigo-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center">
                    <ImageIcon className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                    <span>原题图示 / 题干附图（做题请参考）：</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsImageZoomed(!isImageZoomed)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-0.5"
                  >
                    <ZoomIn className="w-3 h-3 mr-0.5" />
                    <span>{isImageZoomed ? '恢复小图' : '点击放大查看图表'}</span>
                  </button>
                </div>
                <div
                  className={`overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center transition-all ${
                    isImageZoomed ? 'max-h-[480px] p-2' : 'max-h-56 p-2'
                  }`}
                >
                  <img
                    src={record.imageUrl}
                    alt="错题图示"
                    className="max-h-full object-contain mx-auto rounded shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Diagram Description / Clues if available */}
            {record.diagramDescription && (
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 leading-relaxed">
                <span className="font-bold text-blue-900 block mb-0.5">
                  📐【图示信息解析与图例对照】：
                </span>
                {record.diagramDescription}
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
                <div className="text-xs bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-emerald-800 mr-1.5">✅ 标准答案：</span>
                    <span className="font-bold">{record.standardAnswer}</span>
                  </div>
                  {onUpdateRecord && (
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-emerald-700 font-medium">更正选项:</span>
                      {['A', 'B', 'C', 'D'].map((letter) => (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => {
                            const updated = { ...record, standardAnswer: letter };
                            setRecord(updated);
                            onUpdateRecord(updated);
                          }}
                          className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center transition cursor-pointer ${
                            record.standardAnswer?.trim().toUpperCase() === letter
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  )}
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

          {/* 2. Multi-Round Variant Practice Problems (举一反三特训区) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h4 className="text-base font-black text-slate-900">
                  举一反三变式训练（支持题目下方直接在线作答与即时批改）
                </h4>
              </div>

              {/* Continuous Generation Button */}
              <button
                type="button"
                disabled={isGeneratingNextRound}
                onClick={handleGenerateNextRound}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-amber-200 hover:shadow-lg transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingNextRound ? 'animate-spin' : ''}`} />
                <span>
                  {isGeneratingNextRound
                    ? '正在生成下一轮新题...'
                    : '🔄 还没掌握？换3道新变式题'}
                </span>
              </button>
            </div>

            {generateError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{generateError}</span>
              </div>
            )}

            {/* Practice Round Tabs */}
            {practiceRounds.length > 1 && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                {practiceRounds.map((r, rIdx) => (
                  <button
                    key={r.round || rIdx}
                    type="button"
                    onClick={() => setSelectedRoundIndex(rIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedRoundIndex === rIdx
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    第 {r.round || rIdx + 1} 轮特训 ({r.variants.length}题)
                  </button>
                ))}
              </div>
            )}

            {/* Variant Cards */}
            {activeVariants.length > 0 ? (
              activeVariants.map((v, idx) => {
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

                      <div className="flex items-center space-x-2">
                        {v.hasChecked && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center ${
                              v.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {v.isCorrect ? '已答对 ★' : '需巩固'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Stem */}
                    <div className="text-slate-800 text-sm font-medium leading-relaxed whitespace-pre-line">
                      {v.questionText}
                    </div>

                    {/* Interactive Answer Box right under the problem */}
                    <InteractiveAnswerBox
                      problem={v}
                      onAnswerSubmit={handleAnswerSubmit}
                      isRevealed={isRevealed}
                      onToggleReveal={() => toggleReveal(v.id || String(idx))}
                    />

                    {/* Revealed Answer & Pitfall Analysis */}
                    {isRevealed && (
                      <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-200">
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
            久久的闯关星球 · 针对错题在线互动练习与多轮强化
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            完成查看
          </button>
        </div>
      </div>
    </div>
  );
};
