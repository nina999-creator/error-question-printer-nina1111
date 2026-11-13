import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  PenTool,
  Eraser,
  Trash2,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VariantProblem } from '../types';

interface InteractiveAnswerBoxProps {
  problem: VariantProblem;
  onAnswerSubmit: (problemId: string, answer: string, isCorrect: boolean) => void;
  isRevealed: boolean;
  onToggleReveal: () => void;
}

export const InteractiveAnswerBox: React.FC<InteractiveAnswerBoxProps> = ({
  problem,
  onAnswerSubmit,
  isRevealed,
  onToggleReveal,
}) => {
  // Only consider submitted if problem.hasChecked is explicitly true AND childAnswer is non-empty
  const hasValidChecked = !!(problem.hasChecked && problem.childAnswer && problem.childAnswer.trim());
  const [selectedAnswer, setSelectedAnswer] = useState<string>(problem.childAnswer || '');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(hasValidChecked);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(hasValidChecked ? (problem.isCorrect ?? null) : null);
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Sync internal state whenever problem identity, childAnswer, or check status changes
  useEffect(() => {
    const valid = !!(problem.hasChecked && problem.childAnswer && problem.childAnswer.trim());
    setSelectedAnswer(problem.childAnswer || '');
    setHasSubmitted(valid);
    setIsCorrect(valid ? (problem.isCorrect ?? null) : null);
    setShowHint(false);
  }, [problem.id, problem.childAnswer, problem.hasChecked, problem.isCorrect]);

  // Canvas Scratchpad references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  // Parse whether options exist
  const hasOptions = problem.options && problem.options.length > 0;

  // Evaluate correctness
  const evaluateAnswer = (childAns: string, standardAns: string): boolean => {
    if (!childAns.trim()) return false;
    const cleanChild = childAns.trim().toUpperCase();
    const cleanStandard = standardAns.trim().toUpperCase();

    // 1. Direct match
    if (cleanChild === cleanStandard) return true;

    // 2. Multiple choice: extract option letter A/B/C/D
    const childOptionMatch = cleanChild.match(/^([A-D])\b/);
    const standardOptionMatch = cleanStandard.match(/^([A-D])\b/);
    if (childOptionMatch && standardOptionMatch) {
      if (childOptionMatch[1] === standardOptionMatch[1]) return true;
    }

    // 3. Choice text without letter match
    if (cleanStandard.includes(cleanChild) || cleanChild.includes(cleanStandard)) {
      return true;
    }

    // 4. Number match for math questions (e.g., 35 or 40)
    const childNums = cleanChild.match(/\d+(\.\d+)?/g);
    const standardNums = cleanStandard.match(/\d+(\.\d+)?/g);
    if (childNums && standardNums && childNums.length === 1 && standardNums.length >= 1) {
      if (standardNums.includes(childNums[0])) return true;
    }

    return false;
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer.trim()) {
      alert('请先选择或输入你的答案哦！');
      return;
    }

    const correct = evaluateAnswer(selectedAnswer, problem.standardAnswer);
    setIsCorrect(correct);
    setHasSubmitted(true);
    onAnswerSubmit(problem.id, selectedAnswer, correct);

    if (correct) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }
    } else {
      setShowHint(true);
    }
  };

  const handleResetAnswer = () => {
    setSelectedAnswer('');
    setHasSubmitted(false);
    setIsCorrect(null);
    setShowHint(false);
    onAnswerSubmit(problem.id, '', false);
  };

  // Canvas scratchpad drawing logic
  useEffect(() => {
    if (!showScratchpad) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [showScratchpad]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    if (tool === 'pen') {
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 18;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
      {/* 1. Answer Selection / Input Area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-600 mr-1.5" />
            <span>【在线作答】：请在此作答后立即核对</span>
          </label>

          <button
            type="button"
            onClick={() => setShowScratchpad(!showScratchpad)}
            className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition flex items-center space-x-1 ${
              showScratchpad
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <PenTool className="w-3 h-3 text-amber-600" />
            <span>{showScratchpad ? '收起演草板' : '📝 打开演草板/算竖式'}</span>
          </button>
        </div>

        {/* Scratchpad Canvas */}
        {showScratchpad && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-amber-900 font-semibold px-1">
              <span>✏️ 电子演草板（手指或鼠标可在格内画竖式验算）：</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setTool('pen')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    tool === 'pen' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'
                  }`}
                >
                  铅笔
                </button>
                <button
                  type="button"
                  onClick={() => setTool('eraser')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    tool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'
                  }`}
                >
                  橡皮
                </button>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white text-rose-600 hover:bg-rose-50"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="border border-amber-300 rounded-lg overflow-hidden bg-white shadow-inner">
              <canvas
                ref={canvasRef}
                width={550}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-36 cursor-crosshair touch-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
              />
            </div>
          </div>
        )}

        {/* Option Clickable Tiles */}
        {hasOptions ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {problem.options!.map((opt, oIdx) => {
              const cleanSelected = selectedAnswer.trim();
              const isSelected =
                cleanSelected !== '' &&
                (cleanSelected === opt.trim() ||
                  cleanSelected === opt.slice(0, 1) ||
                  (opt.trim().startsWith(cleanSelected) && /^[A-D]/i.test(cleanSelected)));
              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={hasSubmitted && isCorrect === true}
                  onClick={() => {
                    setSelectedAnswer(opt);
                    if (hasSubmitted) {
                      setHasSubmitted(false);
                      setIsCorrect(null);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50/70'
                  }`}
                >
                  <span>{opt}</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Fill-in input */
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={selectedAnswer}
              disabled={hasSubmitted && isCorrect === true}
              onChange={(e) => {
                setSelectedAnswer(e.target.value);
                if (hasSubmitted) {
                  setHasSubmitted(false);
                  setIsCorrect(null);
                }
              }}
              placeholder="请输入你的作答内容或计算结果（例如：35元 或 4厘米）..."
              className="flex-1 p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        )}
      </div>

      {/* 2. Check Action & Status Feedback */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center space-x-2">
          {!hasSubmitted || isCorrect !== true ? (
            <button
              type="button"
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer.trim()}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
                !selectedAnswer.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{hasSubmitted && isCorrect === false ? '再次尝试核对' : '立即核对答案'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResetAnswer}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重新作答</span>
            </button>
          )}

          {/* Feedback Badges */}
          {hasSubmitted && (
            <div className="flex items-center space-x-2 animate-in fade-in duration-150">
              {isCorrect === true ? (
                <div className="flex items-center space-x-1 text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-1.5 rounded-xl font-black text-xs shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>太棒了！回答完全正确！⭐+1</span>
                </div>
              ) : isCorrect === false ? (
                <div className="flex items-center space-x-1 text-rose-800 bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-xl font-bold text-xs">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>差一点点就答对啦！别灰心</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Toggle Explanation View */}
        <button
          type="button"
          onClick={onToggleReveal}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer py-1"
        >
          <span>{isRevealed ? '收起名师解析' : '查看完整解析与易错点'}</span>
          {isRevealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3. Gentle Hint Box if incorrect */}
      {hasSubmitted && !isCorrect && showHint && !isRevealed && (
        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 flex flex-col space-y-1 animate-in fade-in">
          <div className="flex items-center space-x-1.5 font-bold text-amber-900">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            <span>【名师启发锦囊】：</span>
          </div>
          <p className="leading-relaxed pl-5 text-[11px] text-amber-900 font-medium">
            别着急看答案哦，再仔细观察一下题干数据或单位！
            {problem.keywordsToHighlight && problem.keywordsToHighlight.length > 0 && (
              <span className="block mt-1">
                思考关键词：
                {problem.keywordsToHighlight.map((kw, i) => (
                  <strong key={i} className="text-amber-950 underline decoration-amber-400 mx-1">
                    {kw}
                  </strong>
                ))}
              </span>
            )}
          </p>
          <div className="pt-1 pl-5">
            <button
              type="button"
              onClick={handleResetAnswer}
              className="text-[11px] font-bold text-indigo-700 hover:underline"
            >
              🔄 清空我的答案，我再算一次！
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
