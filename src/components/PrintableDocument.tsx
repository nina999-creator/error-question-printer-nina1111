import React from 'react';
import { MistakeRecord } from '../types';
import { renderHighlightedText } from '../utils/highlight';

interface PrintableDocumentProps {
  records: MistakeRecord[];
  paperTitle?: string;
}

export const PrintableDocument: React.FC<PrintableDocumentProps> = ({
  records,
  paperTitle = '久久的闯关星球 · 错题举一反三突破特训卷',
}) => {
  if (records.length === 0) return null;

  return (
    <div id="printable-document" className="hidden print:block p-8 bg-white text-slate-900">
      {/* Paper Header */}
      <div className="text-center pb-4 mb-6 border-b-2 border-slate-900">
        <h1 className="text-2xl font-black text-slate-900 mb-1">{paperTitle}</h1>
        <p className="text-xs text-slate-500 font-medium">
          久久的闯关星球 · 全科错题提炼 · 举一反三针对性过关 · 易错点突破
        </p>

        <div className="flex items-center justify-center space-x-8 mt-4 pt-2 border-t border-dashed border-slate-300 text-xs text-slate-700">
          <span>姓名：____________</span>
          <span>班级：____________</span>
          <span>日期：____________</span>
          <span>得分：____________</span>
        </div>
      </div>

      {/* Mistake Entries List */}
      <div className="space-y-8">
        {records.map((record, rIdx) => (
          <div
            key={record.id}
            className="page-break-inside-avoid pb-6 border-b border-slate-300 last:border-b-0 space-y-4"
          >
            {/* Header Tag */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-xs font-black bg-slate-900 text-white">
                  【第 {rIdx + 1} 组错题突破】
                </span>
                <span className="font-bold text-sm text-slate-900">
                  {record.subject} · {record.knowledgePoint}
                </span>
              </div>
              <span className="text-xs text-slate-500">{record.gradeLevel}</span>
            </div>

            {record.knowledgeSummary && (
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium">
                💡 <strong>解题要领：</strong> {record.knowledgeSummary}
              </div>
            )}

            {/* Original Problem */}
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/20 space-y-2">
              <div className="font-bold text-xs text-rose-800">【原错题内容回顾】</div>
              <div className="text-sm text-slate-900 whitespace-pre-line leading-relaxed font-medium">
                {record.questionText}
              </div>

              {record.options && record.options.length > 0 && (
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 my-1">
                  {record.options.map((opt, oIdx) => (
                    <div key={oIdx}>{opt}</div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-rose-100 text-xs space-y-1">
                {record.userAnswer && (
                  <div className="text-rose-700">
                    ❌ <strong>原错因/原错答：</strong> {record.userAnswer}
                  </div>
                )}
                <div className="text-emerald-800 font-bold">
                  ✅ <strong>标准参考答案：</strong> {record.standardAnswer}
                </div>
                {record.explanation && (
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    <strong>解题思路：</strong> {record.explanation}
                  </div>
                )}
              </div>
            </div>

            {/* 3 Variant Practice Problems */}
            <div className="space-y-3.5 pl-2">
              <div className="text-xs font-black text-indigo-900 uppercase tracking-wide">
                ▼ 举一反三 · 变式题与易错点剖析
              </div>

              {record.variants.map((v, vIdx) => (
                <div
                  key={v.id || vIdx}
                  className="p-3 rounded-lg border border-slate-200 bg-white space-y-2 page-break-inside-avoid"
                >
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {v.level || `变式 ${vIdx + 1}`}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{v.title}</span>
                  </div>

                  <div className="text-sm text-slate-900 whitespace-pre-line leading-relaxed font-medium">
                    {v.questionText}
                  </div>

                  {v.options && v.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 my-1">
                      {v.options.map((opt, optIdx) => (
                        <div key={optIdx}>{opt}</div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                    <div className="text-emerald-800 font-bold">
                      <strong>参考答案：</strong> {v.standardAnswer}
                    </div>
                    <div className="text-slate-700 text-[11px] leading-relaxed">
                      <strong>解析步骤：</strong> {v.explanation}
                    </div>
                    {v.pitfallAnalysis && (
                      <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-950 text-[11px] leading-relaxed">
                        <span className="font-bold text-amber-900 block mb-0.5">
                          ⚠️【易错点深度避坑剖析】：
                        </span>
                        {renderHighlightedText(v.pitfallAnalysis, v.keywordsToHighlight)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
