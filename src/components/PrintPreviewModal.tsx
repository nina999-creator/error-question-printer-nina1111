import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { MistakeRecord } from '../types';
import { renderHighlightedText } from '../utils/highlight';

interface PrintPreviewModalProps {
  records: MistakeRecord[];
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ records, onClose }) => {
  // Settings for the printed paper
  const [paperTitle, setPaperTitle] = useState<string>('久久的闯关星球 · 错题举一反三突破特训卷');
  const [printMode, setPrintMode] = useState<'integrated' | 'test_sheet'>('integrated');
  const [showStudentInfo, setShowStudentInfo] = useState<boolean>(true);
  const [showPitfallAnalysis, setShowPitfallAnalysis] = useState<boolean>(true);
  const [showKnowledgeSummary, setShowKnowledgeSummary] = useState<boolean>(true);
  const [showOriginalUserAnswer, setShowOriginalUserAnswer] = useState<boolean>(true);

  if (records.length === 0) return null;

  // Trigger browser print dialog (which allows native "Save as PDF")
  const handleSystemPrint = () => {
    window.print();
  };

  // Generate standalone downloadable HTML file
  const handleDownloadHtml = () => {
    const printContent = document.getElementById('print-preview-content');
    if (!printContent) return;

    const htmlString = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${paperTitle}</title>
  <style>
    body {
      font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 20mm;
      padding: 0;
      background: #fff;
    }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #334155; padding-bottom: 12px; }
    .header h1 { margin: 0 0 8px 0; font-size: 22px; color: #0f172a; }
    .meta-bar { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-top: 10px; }
    .item-card { margin-bottom: 28px; page-break-inside: avoid; border-bottom: 1px dashed #cbd5e1; padding-bottom: 20px; }
    .item-title { font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 8px; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 6px; }
    .tag-math { background: #e0e7ff; color: #3730a3; }
    .q-text { font-size: 14px; margin: 8px 0; white-space: pre-line; line-height: 1.6; }
    .ans-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-top: 8px; font-size: 13px; }
    .pitfall-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 14px; margin-top: 8px; font-size: 13px; color: #78350f; }
    mark { background: #fef08a; padding: 1px 4px; border-radius: 2px; font-weight: bold; }
    @media print {
      body { margin: 12mm; }
      @page { size: A4; margin: 12mm; }
    }
  </style>
</head>
<body>
  ${printContent.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paperTitle}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                PDF 排版与打印预览（已选 {records.length} 组错题）
              </h3>
              <p className="text-xs text-slate-300">
                每道原题及其 3 道举一反三变式题连续排列，答案与易错点剖析紧随其后
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载离线 HTML</span>
            </button>
            <button
              type="button"
              onClick={handleSystemPrint}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-500 hover:from-amber-400 hover:to-indigo-400 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>确认打印 / 存为 PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout: Settings Sidebar + Live Paper Preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-100">
          {/* Settings Left Column */}
          <div className="lg:col-span-4 p-5 bg-white border-r border-slate-200 overflow-y-auto space-y-5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Settings2 className="w-4 h-4 text-indigo-600" />
              <span>排版与试卷选项</span>
            </div>

            {/* Title Setting */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                试卷/特训标题
              </label>
              <input
                type="text"
                value={paperTitle}
                onChange={(e) => setPaperTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Print Mode Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                排版输出模式
              </label>
              <div className="space-y-2">
                <label className="flex items-start p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-indigo-50/40">
                  <input
                    type="radio"
                    name="printMode"
                    checked={printMode === 'integrated'}
                    onChange={() => setPrintMode('integrated')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="ml-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      讲练一体版 (推荐)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      原题与举一反三题连续排列，答案与易错点紧跟其后，适合纠错复盘
                    </span>
                  </div>
                </label>

                <label className="flex items-start p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-indigo-50/40">
                  <input
                    type="radio"
                    name="printMode"
                    checked={printMode === 'test_sheet'}
                    onChange={() => setPrintMode('test_sheet')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="ml-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      实战练习卷模式
                    </span>
                    <span className="text-[11px] text-slate-500">
                      题目在前，全部答案与解析排在末尾答案卷，适合闭卷做题测试
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Toggle checkboxes */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStudentInfo}
                  onChange={(e) => setShowStudentInfo(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                <span>打印姓名、班级、日期下划线栏</span>
              </label>

              <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPitfallAnalysis}
                  onChange={(e) => setShowPitfallAnalysis(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                <span>包含【易错点深度避坑剖析】与关键词</span>
              </label>

              <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showKnowledgeSummary}
                  onChange={(e) => setShowKnowledgeSummary(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                <span>包含知识点解题金律 / 秒杀口诀</span>
              </label>

              <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOriginalUserAnswer}
                  onChange={(e) => setShowOriginalUserAnswer(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                <span>标出原错答 (红笔防坑警示)</span>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              💡 <strong>打印小提示：</strong>在浏览器的打印预览窗口中，请将“目标打印机”选为
              <strong>“另存为 PDF”</strong>，即可导出超清矢量 PDF 电子文件！
            </div>
          </div>

          {/* Right Live Preview: A4 Simulated Sheet */}
          <div className="lg:col-span-8 p-4 sm:p-6 overflow-y-auto max-h-[82vh]">
            <div
              id="print-preview-content"
              className="bg-white shadow-lg mx-auto rounded-xl p-8 sm:p-10 max-w-[210mm] border border-slate-300 min-h-[297mm] text-slate-900 text-sm leading-relaxed"
            >
              {/* Paper Header */}
              <div className="text-center pb-4 mb-6 border-b-2 border-slate-800">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-1">
                  {paperTitle}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  久久的闯关星球 · 针对性攻克核心考点 · 举一反三巩固提优
                </p>

                {showStudentInfo && (
                  <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-3 border-t border-dashed border-slate-300 text-xs text-slate-700 font-medium">
                    <span>姓名：____________</span>
                    <span>班级：____________</span>
                    <span>日期：____________</span>
                    <span>得分：____________</span>
                  </div>
                )}
              </div>

              {/* MODE 1: Integrated (每道原题及其举一反三题连续排列，答案与解析紧随其后) */}
              {printMode === 'integrated' ? (
                <div className="space-y-8">
                  {records.map((record, rIdx) => (
                    <div key={record.id} className="page-break-inside-avoid pb-6 border-b border-slate-200 last:border-b-0">
                      {/* Section Badge & Knowledge Tag */}
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="px-2 py-0.5 rounded text-xs font-black bg-slate-900 text-white">
                          第 {rIdx + 1} 组错题突破
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-900">
                          {record.subject} · {record.knowledgePoint}
                        </span>
                      </div>

                      {showKnowledgeSummary && record.knowledgeSummary && (
                        <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-950 font-medium mb-3">
                          💡 <strong>解题要领：</strong> {record.knowledgeSummary}
                        </div>
                      )}

                      {/* 1. Original Problem */}
                      <div className="mb-4 pl-3 border-l-4 border-rose-400 bg-rose-50/20 py-2 pr-2 rounded-r-lg">
                        <div className="font-bold text-slate-900 text-sm mb-1 flex items-center justify-between">
                          <span>【原错题回顾】</span>
                          {record.gradeLevel && (
                            <span className="text-[11px] text-slate-500">{record.gradeLevel}</span>
                          )}
                        </div>
                        <div className="whitespace-pre-line text-slate-800 text-sm mb-2 font-medium">
                          {record.questionText}
                        </div>

                        {record.options && record.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2 text-xs text-slate-700">
                            {record.options.map((opt, oIdx) => (
                              <div key={oIdx}>{opt}</div>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                          {showOriginalUserAnswer && record.userAnswer && (
                            <div className="text-rose-700 font-medium">
                              ❌ <strong>原错因/原错答：</strong> {record.userAnswer}
                            </div>
                          )}
                          <div className="text-emerald-800 font-bold">
                            ✅ <strong>标准参考答案：</strong> {record.standardAnswer}
                          </div>
                          {record.explanation && (
                            <div className="text-slate-600 text-[11px] pt-1">
                              <strong>解析：</strong> {record.explanation}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. 3 Variant Practice Problems */}
                      <div className="space-y-4 mt-4">
                        <div className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                          ▼ 举一反三 · 变式过关特训
                        </div>

                        {record.variants.map((v, vIdx) => (
                          <div
                            key={v.id || vIdx}
                            className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 page-break-inside-avoid"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                                {v.level || `变式 ${vIdx + 1}`}
                              </span>
                              <span className="text-xs font-bold text-slate-800">{v.title}</span>
                            </div>

                            <div className="text-sm text-slate-900 whitespace-pre-line font-medium">
                              {v.questionText}
                            </div>

                            {v.options && v.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-700 my-1">
                                {v.options.map((opt, optIdx) => (
                                  <div key={optIdx}>{opt}</div>
                                ))}
                              </div>
                            )}

                            {/* Answer and Pitfall Box */}
                            <div className="mt-2 pt-2 border-t border-slate-100 text-xs space-y-1.5">
                              <div className="text-emerald-800 font-bold">
                                <strong>参考答案：</strong> {v.standardAnswer}
                              </div>
                              <div className="text-slate-700 text-[11px] leading-relaxed">
                                <strong>解析步骤：</strong> {v.explanation}
                              </div>

                              {showPitfallAnalysis && v.pitfallAnalysis && (
                                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-950 text-[11px] leading-relaxed">
                                  <span className="font-bold text-amber-900 block mb-0.5">
                                    ⚠️【易错点避坑深度剖析】：
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
              ) : (
                /* MODE 2: Test Sheet Mode (Questions First, Answers at Back) */
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-black text-slate-900 border-b pb-1 mb-4">
                      第一部分：试题区 (共 {records.length} 组试题)
                    </h2>
                    <div className="space-y-6">
                      {records.map((record, rIdx) => (
                        <div key={record.id} className="space-y-3 page-break-inside-avoid">
                          <div className="font-bold text-slate-900 text-sm">
                            第 {rIdx + 1} 题【{record.subject} · {record.knowledgePoint}】
                          </div>
                          <div className="text-sm text-slate-800 whitespace-pre-line pl-3 border-l-2 border-slate-400">
                            (原题) {record.questionText}
                          </div>
                          {record.variants.map((v, vIdx) => (
                            <div key={v.id || vIdx} className="text-sm text-slate-800 pl-3">
                              <span className="font-bold text-indigo-700">
                                ({rIdx + 1}.{vIdx + 1} - {v.level})
                              </span>{' '}
                              {v.questionText}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Answer Key Section */}
                  <div className="page-break-after-always pt-8 border-t-2 border-slate-800 mt-8">
                    <h2 className="text-base font-black text-slate-900 border-b pb-1 mb-4">
                      第二部分：参考答案与易错点深度剖析
                    </h2>
                    <div className="space-y-5">
                      {records.map((record, rIdx) => (
                        <div key={record.id} className="text-xs space-y-2 page-break-inside-avoid">
                          <div className="font-bold text-slate-800">
                            第 {rIdx + 1} 题答案及变式解析：
                          </div>
                          <div className="text-emerald-800">
                            <strong>原题答案：</strong> {record.standardAnswer}
                          </div>
                          {record.variants.map((v, vIdx) => (
                            <div key={v.id || vIdx} className="p-2 rounded bg-slate-50 border space-y-1">
                              <div className="font-bold text-indigo-800">
                                变式 {vIdx + 1} ({v.title}): {v.standardAnswer}
                              </div>
                              <div className="text-slate-600">{v.explanation}</div>
                              {v.pitfallAnalysis && (
                                <div className="text-amber-900 bg-amber-50 p-1.5 rounded">
                                  <strong>避坑要点：</strong> {v.pitfallAnalysis}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
