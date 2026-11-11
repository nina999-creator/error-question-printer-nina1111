import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  RefreshCw,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Edit3,
  Trash2,
  Zap,
  Printer,
  ChevronDown,
  ChevronUp,
  XCircle,
  RotateCcw,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MistakeRecord, VariantProblem } from '../types';
import { PRESET_MISTAKE_IMAGES } from '../data/sampleMistakes';
import { renderHighlightedText } from '../utils/highlight';
import { compressImage } from '../utils/imageCompressor';

const SESSION_STORAGE_KEY = 'jiujiu_recognition_session_v1';

interface RecognitionSessionState {
  selectedImage: string | null;
  mimeType: string;
  imageSizeKb: number | null;
  manualNotes: string;
  isRecognizing: boolean;
  recognitionStartTime: number | null;
  isGeneratingVariants: boolean;
  variantStartTime: number | null;
  subject: string;
  gradeLevel: string;
  knowledgePoint: string;
  questionText: string;
  userAnswer: string;
  standardAnswer: string;
  explanation: string;
  difficulty: string;
  knowledgeSummary: string;
  variants: VariantProblem[];
  revealedVariantAnswers: Record<string, boolean>;
  hasSavedCurrent: boolean;
  recognitionError: string | null;
  variantsError: string | null;
}

function getStoredSessionState(): Partial<RecognitionSessionState> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to read from sessionStorage:', e);
    return null;
  }
}

function setStoredSessionState(state: Partial<RecognitionSessionState>) {
  try {
    const existing = getStoredSessionState() || {};
    const merged = { ...existing, ...state };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to save to sessionStorage:', e);
  }
}

interface RecognitionPageProps {
  onSaveToNotebook: (record: MistakeRecord) => void;
  onQuickPrint: (record: MistakeRecord) => void;
  onNavigateToNotebook: () => void;
}

export const RecognitionPage: React.FC<RecognitionPageProps> = ({
  onSaveToNotebook,
  onQuickPrint,
  onNavigateToNotebook,
}) => {
  // Restore initial state from sessionStorage if available
  const initial = getStoredSessionState();

  // Image and input state
  const [selectedImage, setSelectedImage] = useState<string | null>(initial?.selectedImage ?? null);
  const [mimeType, setMimeType] = useState<string>(initial?.mimeType ?? 'image/jpeg');
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(initial?.imageSizeKb ?? null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [manualNotes, setManualNotes] = useState<string>(initial?.manualNotes ?? '');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Loading & Progress timer states
  const [isRecognizing, setIsRecognizing] = useState<boolean>(() => {
    if (initial?.isRecognizing && initial?.recognitionStartTime) {
      const elapsed = Math.floor((Date.now() - initial.recognitionStartTime) / 1000);
      return elapsed < 30;
    }
    return false;
  });

  const [recognitionSeconds, setRecognitionSeconds] = useState<number>(() => {
    if (initial?.isRecognizing && initial?.recognitionStartTime) {
      return Math.floor((Date.now() - initial.recognitionStartTime) / 1000);
    }
    return 0;
  });

  const [isGeneratingVariants, setIsGeneratingVariants] = useState<boolean>(() => {
    if (initial?.isGeneratingVariants && initial?.variantStartTime) {
      const elapsed = Math.floor((Date.now() - initial.variantStartTime) / 1000);
      return elapsed < 30;
    }
    return false;
  });

  const [variantSeconds, setVariantSeconds] = useState<number>(() => {
    if (initial?.isGeneratingVariants && initial?.variantStartTime) {
      return Math.floor((Date.now() - initial.variantStartTime) / 1000);
    }
    return 0;
  });

  const [recognitionError, setRecognitionError] = useState<string | null>(initial?.recognitionError ?? null);
  const [variantsError, setVariantsError] = useState<string | null>(initial?.variantsError ?? null);

  // Recognized & editable data
  const [subject, setSubject] = useState<string>(initial?.subject ?? '数学');
  const [gradeLevel, setGradeLevel] = useState<string>(initial?.gradeLevel ?? '小学三年级 (8岁)');
  const [knowledgePoint, setKnowledgePoint] = useState<string>(initial?.knowledgePoint ?? '');
  const [questionText, setQuestionText] = useState<string>(initial?.questionText ?? '');
  const [userAnswer, setUserAnswer] = useState<string>(initial?.userAnswer ?? '');
  const [standardAnswer, setStandardAnswer] = useState<string>(initial?.standardAnswer ?? '');
  const [explanation, setExplanation] = useState<string>(initial?.explanation ?? '');
  const [difficulty, setDifficulty] = useState<string>(initial?.difficulty ?? '中等');

  // Variant questions state
  const [knowledgeSummary, setKnowledgeSummary] = useState<string>(initial?.knowledgeSummary ?? '');
  const [variants, setVariants] = useState<VariantProblem[]>(initial?.variants ?? []);
  const [revealedVariantAnswers, setRevealedVariantAnswers] = useState<Record<string, boolean>>(
    initial?.revealedVariantAnswers ?? {}
  );

  // Saved status flag
  const [hasSavedCurrent, setHasSavedCurrent] = useState<boolean>(initial?.hasSavedCurrent ?? false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const variantsRef = useRef<HTMLDivElement>(null);
  const ocrAbortRef = useRef<AbortController | null>(null);
  const variantAbortRef = useRef<AbortController | null>(null);

  // Continuously sync full state to sessionStorage
  useEffect(() => {
    setStoredSessionState({
      selectedImage,
      mimeType,
      imageSizeKb,
      manualNotes,
      isRecognizing,
      recognitionStartTime: isRecognizing ? (initial?.recognitionStartTime || Date.now()) : null,
      isGeneratingVariants,
      variantStartTime: isGeneratingVariants ? (initial?.variantStartTime || Date.now()) : null,
      subject,
      gradeLevel,
      knowledgePoint,
      questionText,
      userAnswer,
      standardAnswer,
      explanation,
      difficulty,
      knowledgeSummary,
      variants,
      revealedVariantAnswers,
      hasSavedCurrent,
      recognitionError,
      variantsError,
    });
  }, [
    selectedImage,
    mimeType,
    imageSizeKb,
    manualNotes,
    isRecognizing,
    isGeneratingVariants,
    subject,
    gradeLevel,
    knowledgePoint,
    questionText,
    userAnswer,
    standardAnswer,
    explanation,
    difficulty,
    knowledgeSummary,
    variants,
    revealedVariantAnswers,
    hasSavedCurrent,
    recognitionError,
    variantsError,
  ]);

  // Timer for recognition
  useEffect(() => {
    let timer: any;
    if (isRecognizing) {
      timer = setInterval(() => {
        setRecognitionSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecognizing]);

  // Timer for variant generation
  useEffect(() => {
    let timer: any;
    if (isGeneratingVariants) {
      timer = setInterval(() => {
        setVariantSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGeneratingVariants]);

  // Handle image compression & setting
  const processAndSetImage = async (fileOrDataUrl: File | string) => {
    setIsCompressing(true);
    setRecognitionError(null);
    try {
      // Scale down large photos to max 1600px and compress to JPEG ~250KB for fast upload and OCR
      const compressed = await compressImage(fileOrDataUrl, 1600, 1600, 0.85);
      setSelectedImage(compressed.dataUrl);
      setMimeType(compressed.mimeType);
      setImageSizeKb(compressed.sizeKb);

      setStoredSessionState({
        selectedImage: compressed.dataUrl,
        mimeType: compressed.mimeType,
        imageSizeKb: compressed.sizeKb,
        recognitionError: null,
      });
    } catch (err: any) {
      console.error('Image compression failed:', err);
      if (typeof fileOrDataUrl === 'string') {
        setSelectedImage(fileOrDataUrl);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  // Support clipboard paste (Ctrl+V / Cmd+V anywhere on page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              processAndSetImage(blob);
              e.preventDefault();
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndSetImage(e.target.files[0]);
    }
  };

  // Drag and Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processAndSetImage(file);
      }
    }
  };

  // Load a preset example
  const handleLoadPreset = (preset: typeof PRESET_MISTAKE_IMAGES[0]) => {
    const targetGrade = (preset as any).gradeLevel || '小学三年级 (8岁)';
    setSubject(preset.subject);
    setGradeLevel(targetGrade);
    setKnowledgePoint(preset.knowledgePoint);
    setQuestionText(preset.questionText);
    setUserAnswer(preset.userAnswer);
    setStandardAnswer(preset.standardAnswer);
    setExplanation(preset.description);
    setDifficulty('中等');
    setSelectedImage(null);
    setImageSizeKb(null);
    setRecognitionError(null);
    setVariants([]);
    setHasSavedCurrent(false);

    setStoredSessionState({
      subject: preset.subject,
      gradeLevel: targetGrade,
      knowledgePoint: preset.knowledgePoint,
      questionText: preset.questionText,
      userAnswer: preset.userAnswer,
      standardAnswer: preset.standardAnswer,
      explanation: preset.description,
      difficulty: '中等',
      selectedImage: null,
      imageSizeKb: null,
      variants: [],
      hasSavedCurrent: false,
    });

    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Clear / Reset all current inputs & sessionStorage
  const handleResetAll = () => {
    if (confirm('确定要清空当前的题目与识别草稿吗？')) {
      setSelectedImage(null);
      setImageSizeKb(null);
      setManualNotes('');
      setKnowledgePoint('');
      setQuestionText('');
      setUserAnswer('');
      setStandardAnswer('');
      setExplanation('');
      setKnowledgeSummary('');
      setVariants([]);
      setRecognitionError(null);
      setVariantsError(null);
      setHasSavedCurrent(false);
      setIsRecognizing(false);
      setIsGeneratingVariants(false);
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }
  };

  // Cancel ongoing OCR
  const handleCancelOCR = () => {
    if (ocrAbortRef.current) {
      ocrAbortRef.current.abort();
      ocrAbortRef.current = null;
    }
    setIsRecognizing(false);
    setStoredSessionState({ isRecognizing: false, recognitionStartTime: null });
  };

  // OCR Recognition API Call
  const handleStartOCR = async () => {
    if (!selectedImage && !manualNotes && !questionText) {
      setRecognitionError('请先上传错题图片或在补充文本框中输入题目内容');
      return;
    }

    const startTime = Date.now();
    setIsRecognizing(true);
    setRecognitionSeconds(0);
    setRecognitionError(null);
    setHasSavedCurrent(false);

    setStoredSessionState({
      isRecognizing: true,
      recognitionStartTime: startTime,
      recognitionError: null,
      hasSavedCurrent: false,
    });

    const controller = new AbortController();
    ocrAbortRef.current = controller;

    // Client-side safety timeout of 38s
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 38000);

    try {
      const res = await fetch('/api/ocr-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          manualText: manualNotes,
          targetGrade: gradeLevel,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Safe text response reading first to avoid "Unexpected token '<', '<!doctype '... is not valid JSON"
      const resText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(resText);
      } catch (parseErr) {
        if (!res.ok) {
          throw new Error(`识题云端通道响应超时或繁忙 (HTTP ${res.status})，建议在右侧补充题目文字后快速识别`);
        }
        throw new Error('解析题目失败，请点击重新识别');
      }

      if (!res.ok || json.error) {
        throw new Error(json.error || '错题识别未完成，请重试');
      }

      const data = json.data;
      if (data) {
        const nextSubject = data.subject || '数学';
        const nextGradeLevel = data.gradeLevel || gradeLevel || '小学三年级 (8岁)';
        const nextKnowledgePoint = data.knowledgePoint || '';
        const nextQuestionText = data.questionText || '';
        const nextUserAnswer = data.userAnswer || '';
        const nextStandardAnswer = data.standardAnswer || '';
        const nextExplanation = data.explanation || '';
        const nextDifficulty = data.difficulty || '中等';

        setSubject(nextSubject);
        setGradeLevel(nextGradeLevel);
        setKnowledgePoint(nextKnowledgePoint);
        setQuestionText(nextQuestionText);
        setUserAnswer(nextUserAnswer);
        setStandardAnswer(nextStandardAnswer);
        setExplanation(nextExplanation);
        setDifficulty(nextDifficulty);

        setStoredSessionState({
          isRecognizing: false,
          recognitionStartTime: null,
          subject: nextSubject,
          gradeLevel: nextGradeLevel,
          knowledgePoint: nextKnowledgePoint,
          questionText: nextQuestionText,
          userAnswer: nextUserAnswer,
          standardAnswer: nextStandardAnswer,
          explanation: nextExplanation,
          difficulty: nextDifficulty,
        });

        // Scroll to the confirmed results section
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const msg = '识题用时稍长已超时。久久已为您自动保留草稿，您可以直接在右侧补充题目文字辅助识别，或点击重新识别。';
        setRecognitionError(msg);
        setStoredSessionState({ isRecognizing: false, recognitionStartTime: null, recognitionError: msg });
      } else {
        console.error(err);
        let msg = err?.message || '网络连接或识题异常，请重试';
        try {
          const parsed = JSON.parse(msg);
          if (parsed?.error?.message) {
            msg = parsed.error.message;
          }
        } catch {
          // not raw JSON
        }
        if (msg.includes('<!doctype') || msg.includes('Unexpected token')) {
          msg = '识题服务响应稍慢或网络抖动，已自动为您保留图片，请点击重新识别或手动输入关键词加速。';
        }
        setRecognitionError(msg);
        setStoredSessionState({ isRecognizing: false, recognitionStartTime: null, recognitionError: msg });
      }
    } finally {
      setIsRecognizing(false);
      ocrAbortRef.current = null;
    }
  };

  // Generate 3 Variant Practice Problems (举一反三)
  const handleGenerateVariants = async () => {
    if (!knowledgePoint && !questionText) {
      setVariantsError('请先确认或填写核心知识点与题目内容');
      return;
    }

    const startTime = Date.now();
    setIsGeneratingVariants(true);
    setVariantSeconds(0);
    setVariantsError(null);
    setHasSavedCurrent(false);

    setStoredSessionState({
      isGeneratingVariants: true,
      variantStartTime: startTime,
      variantsError: null,
      hasSavedCurrent: false,
    });

    const controller = new AbortController();
    variantAbortRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 38000);

    try {
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: questionText,
          knowledgePoint,
          subject,
          gradeLevel,
          standardAnswer,
          userAnswer,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const resText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(resText);
      } catch (parseErr) {
        if (!res.ok) {
          throw new Error(`变式生成服务响应繁忙 (HTTP ${res.status})，请点击稍后重试`);
        }
        throw new Error('变式题数据解析失败，请点击重新生成');
      }

      if (!res.ok || json.error) {
        throw new Error(json.error || '生成变式题失败，请重试');
      }

      const data = json.data;
      if (data && data.variants) {
        setKnowledgeSummary(data.knowledgeSummary || '');
        setVariants(data.variants);

        const initialRevealed: Record<string, boolean> = {};
        data.variants.forEach((v: VariantProblem) => {
          initialRevealed[v.id] = true;
        });
        setRevealedVariantAnswers(initialRevealed);

        setStoredSessionState({
          isGeneratingVariants: false,
          variantStartTime: null,
          knowledgeSummary: data.knowledgeSummary || '',
          variants: data.variants,
          revealedVariantAnswers: initialRevealed,
        });

        // Scroll to variants section
        setTimeout(() => {
          variantsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const msg = '变式题生成用时较长超时，请点击下方【重新生成】';
        setVariantsError(msg);
        setStoredSessionState({ isGeneratingVariants: false, variantStartTime: null, variantsError: msg });
      } else {
        console.error(err);
        let msg = err?.message || '生成举一反三失败，请重试';
        try {
          const parsed = JSON.parse(msg);
          if (parsed?.error?.message) {
            msg = parsed.error.message;
          }
        } catch {
          // keep msg
        }
        if (msg.includes('<!doctype') || msg.includes('Unexpected token')) {
          msg = '云端服务繁忙，请稍等片刻点击重新生成。';
        }
        setVariantsError(msg);
        setStoredSessionState({ isGeneratingVariants: false, variantStartTime: null, variantsError: msg });
      }
    } finally {
      setIsGeneratingVariants(false);
      variantAbortRef.current = null;
    }
  };

  // Save full record to Mistake Notebook
  const handleSaveToNotebook = () => {
    if (!questionText || !knowledgePoint) {
      alert('请确保题目内容和知识点不为空');
      return;
    }

    const newRecord: MistakeRecord = {
      id: `mistake-${Date.now()}`,
      createdAt: Date.now(),
      subject,
      gradeLevel,
      knowledgePoint,
      difficulty,
      questionText,
      userAnswer,
      standardAnswer,
      explanation,
      knowledgeSummary,
      imageUrl: selectedImage || undefined,
      variants,
      masteryStatus: 'learning',
    };

    onSaveToNotebook(newRecord);
    setHasSavedCurrent(true);
    setStoredSessionState({ hasSavedCurrent: true });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore
    }
  };

  // Quick print for current generated bundle
  const handlePrintCurrent = () => {
    const currentRecord: MistakeRecord = {
      id: `print-${Date.now()}`,
      createdAt: Date.now(),
      subject,
      gradeLevel,
      knowledgePoint,
      difficulty,
      questionText,
      userAnswer,
      standardAnswer,
      explanation,
      knowledgeSummary,
      imageUrl: selectedImage || undefined,
      variants,
      masteryStatus: 'learning',
    };
    onQuickPrint(currentRecord);
  };

  const toggleVariantAnswer = (id: string) => {
    setRevealedVariantAnswers((prev) => {
      const updated = {
        ...prev,
        [id]: !prev[id],
      };
      setStoredSessionState({ revealedVariantAnswers: updated });
      return updated;
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>智能学习实验室 · 秒级极速识别与避坑剖析</span>
            </div>
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-400/20 backdrop-blur-md text-amber-200 text-xs font-bold border border-amber-400/30">
              <span>🎯 8岁三年级上学期深度适配</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            拍照识别错题，一键举一反三
          </h2>
          <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
            上传错题照片或截图，针对 8 岁三年级量身提炼两步应用题、看图高低计算、优惠差额等核心考点，精准生成 3 道梯度变式题并深度剖析易踩陷阱！切换页面进度自动保留。
          </p>
        </div>

        {/* Quick Example Pills */}
        <div className="mt-5 pt-5 border-t border-indigo-700/60 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-indigo-300 font-medium mb-2 flex items-center">
              <Zap className="w-3.5 h-3.5 mr-1 text-amber-400" />
              没有随手照片？点击直接体验精选经典错题：
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_MISTAKE_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadPreset(preset)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-indigo-50 hover:text-white transition-all duration-150 flex items-center space-x-1.5 shadow-xs"
                >
                  <span>{preset.title.split('：')[0]}</span>
                  <span className="text-indigo-300 text-[11px] truncate max-w-[140px]">
                    {preset.title.split('：')[1]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {(selectedImage || questionText) && (
            <button
              type="button"
              onClick={handleResetAll}
              className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-indigo-200 hover:text-rose-200 border border-white/10 text-xs font-medium transition flex items-center space-x-1"
              title="清空当前草稿"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>清空重置</span>
            </button>
          )}
        </div>
      </section>

      {/* 1. Upload & Image Capture Section */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              1
            </span>
            <h3 className="text-lg font-bold text-slate-800">上传或拍摄错题</h3>
          </div>
          <div className="flex items-center space-x-2">
            {imageSizeKb && (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                ⚡ 已智能轻量化 ({imageSizeKb} KB)
              </span>
            )}
            <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              支持截图粘贴 (Ctrl+V / ⌘+V)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Dropzone / Image Preview Area */}
          <div className="md:col-span-8">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {isCompressing ? (
              <div className="border-2 border-dashed border-indigo-300 rounded-xl p-12 text-center bg-indigo-50/30 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-sm font-bold text-indigo-900">正在快速轻量化压缩图片...</p>
                <p className="text-xs text-indigo-600">优化高清手机拍摄照片以实现秒级上传与识别</p>
              </div>
            ) : selectedImage ? (
              <div className="relative rounded-xl border border-indigo-200 bg-slate-900/5 p-3 overflow-hidden group">
                <div className="max-h-72 flex items-center justify-center overflow-hidden rounded-lg bg-white border border-slate-200">
                  <img
                    src={selectedImage}
                    alt="错题预览"
                    className="max-h-72 object-contain w-auto mx-auto shadow-xs"
                  />
                </div>
                <div className="absolute top-5 right-5 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-700 text-xs font-medium shadow-md hover:bg-white hover:text-indigo-600 transition flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>更换图片</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImageSizeKb(null);
                    }}
                    className="p-1.5 rounded-lg bg-white/95 text-rose-600 shadow-md hover:bg-rose-50 transition"
                    title="移除图片"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20 bg-slate-50/60'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-3 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1">
                  点击上传错题照片，或将图片拖拽到此处
                </p>
                <p className="text-xs text-slate-600 max-w-sm mb-3">
                  支持试卷拍照、错题本截图、作业打叉图（系统自动高速压缩，秒级识别）
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center space-x-1 shadow-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Camera className="w-3.5 h-3.5 mr-1" />
                    <span>选择图片 / 拍照</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Supplementary Text & Trigger */}
          <div className="md:col-span-4 flex flex-col justify-between space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>补充或直接输入题目文本 (选填)</span>
                <span className="text-[11px] text-slate-600">可辅助识别或手写补充</span>
              </label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="例如：公园门票促销从27元降至20元买5张能优惠多少元；或广州塔中原福塔东方明珠高度关系..."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none leading-relaxed"
              />
            </div>

            {recognitionError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col space-y-2">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold mb-0.5">识别提示：</div>
                    <div>{recognitionError}</div>
                  </div>
                </div>
                <div className="text-[11px] text-rose-600 bg-white/70 p-2 rounded-lg border border-rose-200/60 leading-relaxed">
                  💡 <strong>家长小技巧</strong>：如果试卷字迹较淡或反光，您可直接在上方框中输入题目关健字（如“门票从27元降至20元买5张”），系统将立刻结合图片极速精准识别！
                </div>
              </div>
            )}

            {/* Recognition Button with Elapsed Timer and Cancel option */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isRecognizing || (!selectedImage && !manualNotes && !questionText)}
                onClick={handleStartOCR}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center space-x-2 shadow-md transition-all ${
                  isRecognizing || (!selectedImage && !manualNotes && !questionText)
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {isRecognizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>
                      正在识别中... ({recognitionSeconds}s)
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>开始智能识别错题与知识点</span>
                  </>
                )}
              </button>

              {isRecognizing && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] text-indigo-600 flex items-center">
                    <Clock className="w-3 h-3 mr-1 animate-pulse" />
                    {recognitionSeconds < 4
                      ? '第1步：提取题目文本与公式符号'
                      : recognitionSeconds < 8
                      ? '第2步：分析学生原错答与解题要点'
                      : '第3步：提炼核心考点与生成诊断'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelOCR}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center cursor-pointer"
                  >
                    <XCircle className="w-3 h-3 mr-0.5" />
                    取消识别
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Recognition Result Display & Editable Review Section */}
      <section
        ref={resultsRef}
        className={`bg-white rounded-2xl p-6 sm:p-7 shadow-xs border transition-all duration-300 ${
          questionText || knowledgePoint ? 'border-indigo-200' : 'border-slate-200 opacity-90'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              2
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                核对原错题内容与核心知识点
              </h3>
              <p className="text-xs text-slate-600">
                AI 已自动提取关键字段，您可以直接点击修改或补充，保证题目绝对精准（切换页面进度自动保存至会话）
              </p>
            </div>
          </div>

          {/* Subject & Grade selectors */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">学科:</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-transparent text-xs font-bold text-indigo-700 focus:outline-hidden cursor-pointer"
              >
                {['数学', '物理', '化学', '英语', '语文', '生物', '历史', '地理', '其他'].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-300">
              <span className="text-xs text-amber-900 font-semibold">学段:</span>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="bg-transparent text-xs font-bold text-amber-950 focus:outline-hidden cursor-pointer"
              >
                {[
                  '小学三年级 (8岁)',
                  '小学低年级 (一/二年级)',
                  '小学高年级 (四/五/六年级)',
                  '初中阶段',
                  '高中阶段',
                ].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* Knowledge Point Tag (Key Focus) */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <label className="block text-xs font-bold text-amber-900 mb-1.5 flex items-center justify-between">
              <span className="flex items-center">
                <Lightbulb className="w-4 h-4 mr-1 text-amber-600" />
                核心知识点（大模型智能提炼）：
              </span>
              <span className="text-[11px] font-normal text-amber-700">举一反三将基于此知识点生成</span>
            </label>
            <input
              type="text"
              value={knowledgePoint}
              onChange={(e) => setKnowledgePoint(e.target.value)}
              placeholder="例如：一元二次方程根的判别式与二次项系数讨论"
              className="w-full text-sm font-bold text-slate-800 px-3 py-2 rounded-lg bg-white border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-500 shadow-xs"
            />
          </div>

          {/* Original Question Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>原错题题干与选项（可编辑修正）：</span>
              <span className="text-[11px] text-slate-600 font-normal">支持数学公式与选项排版</span>
            </label>
            <textarea
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="错题题干、选项（A/B/C/D）及题目所给条件..."
              className="w-full text-sm p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition leading-relaxed"
            />
          </div>

          {/* Answers Row: Student's Error vs Standard Answer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100">
              <label className="block text-xs font-bold text-rose-800 mb-1">
                学生原错答 (识别自作业本红笔打叉或手写)：
              </label>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="例如：误选了 A；或者漏除了负号..."
                className="w-full text-xs font-medium text-slate-800 px-3 py-1.5 rounded-lg bg-white border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <label className="block text-xs font-bold text-emerald-800 mb-1">
                标准正确答案：
              </label>
              <input
                type="text"
                value={standardAnswer}
                onChange={(e) => setStandardAnswer(e.target.value)}
                placeholder="例如：C (m ≤ 3/2 且 m ≠ 1)"
                className="w-full text-xs font-bold text-emerald-900 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Explanation if present */}
          {explanation && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-800 mr-1.5">【原题解题思路】：</span>
              {explanation}
            </div>
          )}

          {variantsError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{variantsError}</span>
            </div>
          )}

          {/* Trigger Generate Variants Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isGeneratingVariants || !questionText || !knowledgePoint}
              onClick={handleGenerateVariants}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base text-white flex items-center justify-center space-x-2 shadow-lg transition-all ${
                isGeneratingVariants || !questionText || !knowledgePoint
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-amber-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {isGeneratingVariants ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>
                    正在命制 3 道梯级变式题并剖析易错点... ({variantSeconds}s)
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-yellow-200" />
                  <span>
                    {variants.length > 0 ? '✨ 重新生成 3 道举一反三变式题' : '✨ 确认原题无误，生成举一反三 (3道相似题)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Variant Practice Problems Section (举一反三) */}
      {variants.length > 0 && (
        <section ref={variantsRef} className="space-y-6">
          {/* Section Header & Summary */}
          <div className="bg-gradient-to-r from-indigo-50 via-amber-50 to-indigo-50 p-5 rounded-2xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  3
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  举一反三 · 梯级变式特训 (已就绪)
                </h3>
              </div>
              {knowledgeSummary && (
                <p className="mt-1 text-xs sm:text-sm text-indigo-900 font-medium">
                  💡 <span className="font-bold">解题金律：</span>
                  {knowledgeSummary}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleGenerateVariants}
                disabled={isGeneratingVariants}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 text-xs font-semibold shadow-xs hover:bg-indigo-50/50 transition flex items-center space-x-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingVariants ? 'animate-spin' : ''}`} />
                <span>换一批</span>
              </button>
              <button
                type="button"
                onClick={handlePrintCurrent}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold shadow-xs transition flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>排版打印</span>
              </button>
            </div>
          </div>

          {/* 3 Variant Cards */}
          <div className="space-y-5">
            {variants.map((v, index) => {
              const isRevealed = !!revealedVariantAnswers[v.id];
              return (
                <div
                  key={v.id || index}
                  className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 hover:border-indigo-200 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
                          index === 0
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : index === 1
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {v.level || `变式 ${index + 1}`}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {v.title || `变式题 ${index + 1}`}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleVariantAnswer(v.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition"
                    >
                      <span>{isRevealed ? '收起答案与易错点' : '查看答案与易错点'}</span>
                      {isRevealed ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Problem Stem */}
                  <div className="py-4 text-slate-800 text-sm sm:text-[15px] leading-relaxed whitespace-pre-line font-medium">
                    {v.questionText}
                  </div>

                  {/* Options if provided */}
                  {v.options && v.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {v.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer & Pitfall Analysis (Revealed / Hidden) */}
                  {isRevealed && (
                    <div className="mt-3 pt-4 border-t border-slate-100 space-y-3.5">
                      {/* Standard Answer */}
                      <div className="flex items-start space-x-2 text-xs">
                        <span className="font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100 shrink-0">
                          标准答案
                        </span>
                        <span className="font-bold text-emerald-950 text-sm leading-normal">
                          {v.standardAnswer}
                        </span>
                      </div>

                      {/* Step-by-step reasoning */}
                      <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="font-bold text-slate-800 block mb-1">【解题步骤】：</span>
                        <div className="whitespace-pre-line text-slate-700">{v.explanation}</div>
                      </div>

                      {/* CRITICAL USER REQUIREMENT: 易错点重点剖析 with highlighted keywords */}
                      <div className="p-3.5 rounded-xl bg-amber-50/90 border-2 border-amber-300/80 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-1.5 text-amber-900 font-black text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>【易错点深度避坑剖析】</span>
                          </div>
                          <span className="text-[11px] text-amber-700 font-medium">
                            高亮重点 · 考场防丢分
                          </span>
                        </div>

                        <div className="text-xs text-amber-950 leading-relaxed font-normal">
                          {renderHighlightedText(v.pitfallAnalysis, v.keywordsToHighlight)}
                        </div>

                        {/* Keyword Tag Pills */}
                        {v.keywordsToHighlight && v.keywordsToHighlight.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/70 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                              避坑核心词：
                            </span>
                            {v.keywordsToHighlight.map((kw, kwIdx) => (
                              <span
                                key={kwIdx}
                                className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/70 text-amber-900 border border-amber-300/60"
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
            })}
          </div>

          {/* Action Dock: Save to Notebook / View Notebook */}
          <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-indigo-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                原题 + 3道举一反三变式题已全部就绪，随时可加入历史错题本进行复习与打印
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {hasSavedCurrent ? (
                <>
                  <button
                    type="button"
                    disabled
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center space-x-1.5"
                  >
                    <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                    <span>已成功收录到错题本</span>
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateToNotebook}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-indigo-200 transition flex items-center justify-center space-x-1"
                  >
                    <span>前往错题本查看</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveToNotebook}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                >
                  <BookmarkCheck className="w-4 h-4 text-amber-300" />
                  <span>保存至历史错题本 (原题+3道变式)</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
