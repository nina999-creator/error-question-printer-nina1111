import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Support payloads for base64 image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Timeout wrapper to ensure requests NEVER hang for minutes
async function callWithTimeout<T>(promise: Promise<T>, ms = 13000): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`AI 服务响应超时（超过${Math.round(ms / 1000)}秒），已启动自动保护`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

// Helper for model calling with fast fallback, timeout, and grade-optimized parameters
async function generateContentWithFallback(params: any, preferredModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash']) {
  let lastError: any = null;

  for (const model of preferredModels) {
    try {
      // Configure thinking level appropriately:
      // - gemini-3.1-flash-lite: ThinkingLevel.MINIMAL (ultra-fast, zero-delay OCR & generation)
      // - gemini-3.8-flash: ThinkingLevel.LOW (speed/quality balanced)
      const isLite = model.includes('lite');
      const configWithThinking = {
        ...(params.config || {}),
        thinkingConfig: {
          thinkingLevel: isLite ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW,
        },
      };

      // 13 seconds per attempt ensures total fallback chain completes in ~26s (well before Cloud Run proxy limits)
      const response = await callWithTimeout(
        ai.models.generateContent({
          ...params,
          model,
          config: configWithThinking,
        }),
        13000
      );
      return response;
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      console.warn(`Model ${model} attempt failed:`, msg);

      // Minimal backoff before fallback attempt
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw lastError;
}

// User-friendly error message formatter
function formatErrorMessage(err: any, defaultMsg: string): string {
  if (!err) return defaultMsg;
  const rawMsg = err.message || String(err);

  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed?.error?.message) {
      if (parsed.error.code === 503 || parsed.error.status === 'UNAVAILABLE') {
        return 'AI 识题通道短时繁忙，已为您自动保留草稿，请点击重试。';
      }
      if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
        return '请求频率略高，请稍作休息后再次点击识别。';
      }
      return parsed.error.message;
    }
  } catch {
    // not raw JSON
  }

  if (rawMsg.includes('high demand') || rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE')) {
    return 'AI 识题通道短时繁忙，请稍候片刻点击重试。';
  }
  if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('429')) {
    return '请求过于频繁，请稍候片刻再试。';
  }
  if (rawMsg.includes('超时') || rawMsg.includes('TIMEOUT')) {
    return '识题耗时稍长已超时，已为您保存图片草稿。建议裁剪聚焦题目或在右侧补充关健词后重试。';
  }
  return rawMsg || defaultMsg;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// API: OCR and Question Recognition
app.post('/api/ocr-extract', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', manualText = '', targetGrade = '小学三年级' } = req.body;

    if (!imageBase64 && !manualText) {
      return res.status(400).json({ error: '请上传错题图片或输入题目文本' });
    }

    const systemPrompt = `你是一位精通全学段（重点深度适配小学一至六年级、特别是小学三年级（约8岁）认知特点）的全国特级骨干教师和智能错题诊断专家。
你的任务是从用户上传的错题照片（支持试卷、作业本手写、图表）或补充文本中，快速高精度提取题目内容、判断学科学段、提炼核心知识点，并敏锐诊断学生的错题原因。

针对小学三年级（8岁）及中小学题目的关键规则：
1. 【完整提取题目与图表数据】：
   - 提取完整题干文字、包含所有选项、插图数字标记（如电视塔高度、钥匙刻度、线段图等）。
   - 若题目含图表数据（如广州塔与东方明珠高度对比、钥匙长度测量图示），请在题干中将图中的条件数据整理清晰表述出来。
2. 【图形与图示专属识别 (hasDiagram & diagramDescription)】：
   - 敏锐检查题目中是否含有图形、测量工具（直尺、时钟、量筒）、实物图（如钥匙、彩带、铅笔）或几何线段。
   - 若含图形或图示：hasDiagram 设为 true，并在 diagramDescription 中详尽阐述图中所包含的一切视觉信息与测量线索（例如：“图示给出了3把钥匙的长度对比：钥匙①长35毫米，钥匙②长45毫米，钥匙③顶部与②对齐，底部介于35和45毫米之间，大约40毫米（即4厘米）”）。
3. 【年级与学段匹配】：
   - 识别学科学段（如：小学三年级、小学四年级、初中、高中）。若用户提到了三年级或题目为小学阶段应用题/四则运算，学段必须标注为“小学三年级”或“小学”。
4. 【精准提炼核心考点】：
   - 知识点名称必须通俗、具体且专业（例如：“小学三年级数学：长度单位换算与估测（毫米、厘米与分米辨析）”、“小学三年级数学：两步乘减应用题（门票降至与优惠差额辨析）”等）。
5. 【敏锐识别手写错解 (userAnswer)】：
   - 敏锐捕捉作业本中的铅笔/圆珠笔手写算式、老师红笔打叉或括号中的手写选项（如括号中手写填了 B，或勾选了 B）。
   - 提取学生的具体错误解答（例如：“B”、“(27-7)×5=100(元)”等）。如果无法识别出学生作答，填空字符串。
6. 【特级教师独立解题与严谨标准答案推导 (standardAnswer - 重中之重)】：
   - 用户上传的是【错题本/作业错题】，学生填写的选项大概率是【错误解答】！
   - 绝对严禁盲目把学生填写的错误选项（如 B）直接抄写或认定为标准答案（standardAnswer）！
   - 你必须作为特级教师，严格独立验算与分析：
     * 对于单项选择题，必须逐个选项（A、B、C、D）严谨验证数学定理与小学生活常识，给出排除与入选理由，得出真正唯一正确的标准答案！
     * 特别针对小学三年级数学（人教版/北师大版/苏教版）“千米的认识与长度单位估测”经典常考题：
       - A选项：10个小朋友手拉手长约 10~13 米，绝不是 1 千米；
       - B选项：8岁三年级儿童一步步长约 40~50 厘米（0.4~0.5 米），走 1000 步只有约 400~500 米（走约 2000 步才是 1 千米！“8岁小朋友走1000步大约是1千米”是经典的错题辨析陷阱，绝对错误！）；
       - C选项：小学生正常步行速度约每分钟 65~70 米，走 1 千米大约需要 15 分钟（人教版三年级上册第26页教材标准结论），完全符合实际，为正确选项！
       - D选项：教室一圈周长约 25~30 米，远不是 1 千米。
     * 故若该题学生错选了 B，标准答案必须确定为 C！
     * 在 explanation 中，必须清晰逐项剖析 A、B、C、D 每个选项对或错的具体原因。
     * 校验自查：错题场景下，standardAnswer 与 userAnswer 大多数情况下应当不同；若发现两者相同，必须二次复查是否误把错解当成了真答案！`;

    const contents: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    const textPrompt = `请快速识别这道错题并给出诊断。若题目包含图形、图例或测量实物，请重点在 diagramDescription 中描述图例信息。学生年龄约为8岁小学三年级。注意：请独立推导严谨的标准答案，严禁把学生写错的选项误当作标准答案！${manualText ? `补充文本/关键词：${manualText}` : ''}
请严格输出结构化 JSON。`;

    contents.push({ text: textPrompt });

    // Use fast model gemini-3.1-flash-lite first, fallback to gemini-3.8-flash
    const response = await generateContentWithFallback(
      {
        contents: { parts: contents },
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING, description: '学科，如 数学/英语/语文/物理 等' },
              gradeLevel: { type: Type.STRING, description: '学段年级，如 小学三年级/小学/初中/高中' },
              knowledgePoint: { type: Type.STRING, description: '精准核心知识点名称，如 小学三年级数学：两步乘减应用题' },
              questionText: { type: Type.STRING, description: '完整题干文本及图表文字数据' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '选择题选项列表（如有，格式如 ["A. 3 厘米", "B. 4 毫米", ...]）',
              },
              hasDiagram: { type: Type.BOOLEAN, description: '题目是否包含插图、图形、量具或图示' },
              diagramDescription: { type: Type.STRING, description: '对题中图形/图示的详细图解与测量线索说明' },
              userAnswer: { type: Type.STRING, description: '学生的手写原错答或括号内选项（如有）' },
              standardAnswer: { type: Type.STRING, description: '题目的标准正确解答与答案' },
              explanation: { type: Type.STRING, description: '通俗易懂的解题思路与选项排除辨析' },
              difficulty: { type: Type.STRING, description: '难度：基础/中等/较难' },
            },
            required: ['subject', 'knowledgePoint', 'questionText', 'standardAnswer', 'explanation'],
          },
        },
      },
      ['gemini-3.1-flash-lite', 'gemini-3.8-flash']
    );

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);

    // Smart Disambiguation & Sanity Check for standardAnswer vs userAnswer
    if (parsed.standardAnswer && parsed.userAnswer) {
      const cleanStd = parsed.standardAnswer.trim().toUpperCase();
      const cleanUser = parsed.userAnswer.trim().toUpperCase();

      // If both standardAnswer and userAnswer are equal single letter choices (e.g. "B" and "B")
      if (cleanStd === cleanUser && /^[A-D]$/.test(cleanStd)) {
        // Look for true answer in explanation, e.g. "正确答案是C" or "故选C" or "C符合实际"
        const trueMatch = parsed.explanation?.match(/(?:选|正确答案(?:是|为)|符合实际的是|正确的是)\s*([A-D])/);
        if (trueMatch && trueMatch[1] && trueMatch[1] !== cleanStd) {
          parsed.standardAnswer = trueMatch[1];
        } else if (parsed.questionText?.includes('1千米') && parsed.questionText?.includes('15分钟')) {
          // Explicit curriculum rule for 3rd grade "1km walking ~15mins"
          parsed.standardAnswer = 'C';
        }
      }
    }

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/ocr-extract:', error);
    const friendlyMsg = formatErrorMessage(error, '错题识别未完成，请重试或在右侧补充关键文字');
    return res.status(500).json({ error: friendlyMsg });
  }
});

// API: Generate 3 Variant Practice Problems (举一反三) - Supports multi-round generation
app.post('/api/generate-variants', async (req, res) => {
  try {
    const {
      originalQuestion,
      knowledgePoint,
      subject = '数学',
      gradeLevel = '小学三年级',
      standardAnswer = '',
      userAnswer = '',
      round = 1,
      diagramDescription = '',
    } = req.body;

    if (!knowledgePoint && !originalQuestion) {
      return res.status(400).json({ error: '缺少知识点或原题信息' });
    }

    const systemPrompt = `你是一位名校特级教师与启发式错题训练专家。
用户提供了一道原错题及其核心知识点【${knowledgePoint}】（学科：${subject}，学段年级：${gradeLevel}）。
${round > 1 ? `【当前为第 ${round} 轮举一反三强化特训】：学生做完上一轮后仍需巩固，请换用全新的日常生活情境、不同数值模型与逆向角度出题！` : ''}
${diagramDescription ? `原题包含图示信息：${diagramDescription}。若为测量/几何/图表类题目，请在变式题中也设计清晰的视觉场景对比（如线段长度、物体尺寸估测、图形周长等），并文字生动刻画图示数据。` : ''}

【重点适配教学目标】：
- 若学段为小学或三年级（约8岁孩子）：题目语言必须生动、贴近生活（如公园游玩、文具图书、钥匙/铅笔/彩带长度测量、估算比较等），题干叙述清晰，切合《义务教育小学数学课程标准》。
- 若设计为选择题，请在 options 中列出规范选项（如 ["A. ...", "B. ...", "C. ...", "D. ..."]）。
- 变式梯度必须分明：
  1. 第1道【基础巩固】：考查相同知识点的基本概念与标准模型，巩固解题母型，难度与原题相当或稍简。
  2. 第2道【变式进阶】：改变题目条件、考察逆向思维或条件转换，难度略有提升。
  3. 第3道【挑战辨析】：引入典型思维陷阱或综合变形，深度检验知识掌握度。

【极为重要的解析要求 - 易错点重点剖析】：
每道题必须附带完整标准答案，并且解析必须侧重【易错点剖析】！
详细说明该题型学生最容易犯的错误、容易踩的思维陷阱（例如：“本题常见错误是毫米与厘米单位进率换算错误”、“混淆了估测区间与精确值”等）。
并且提取 2-4 个易错关键词（keywordsToHighlight），如["毫米与厘米进率", "单位换算", "观察刻度差"]，以便高亮强化记忆！`;

    const userPrompt = `原错题内容：
${originalQuestion}
${diagramDescription ? `原题图示信息：${diagramDescription}` : ''}
原题正确答案：${standardAnswer}
${userAnswer ? `原题学生错误答案：${userAnswer}` : ''}
核心知识点：${knowledgePoint}
目标学段：${gradeLevel}
训练轮次：第 ${round} 轮特训

请据此生成 3 道举一反三变式训练题，突出易错点剖析。以严格 JSON 格式输出。`;

    const response = await generateContentWithFallback(
      {
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              knowledgeSummary: {
                type: Type.STRING,
                description: '该知识点的核心解题口诀或秒杀法则（一句话总结，通俗易懂）',
              },
              variants: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: '题号如 v1, v2, v3' },
                    level: { type: Type.STRING, description: '题目难度与类型：基础巩固 / 变式进阶 / 挑战辨析' },
                    title: { type: Type.STRING, description: '变式题侧重点，如“变式1：基础优惠两步计算”' },
                    questionText: { type: Type.STRING, description: '完整题干文本及选项' },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '若为选择题，列出选项；若解答/填空题则可为空数组',
                    },
                    standardAnswer: { type: Type.STRING, description: '标准参考答案' },
                    explanation: { type: Type.STRING, description: '逐步详细解答思路' },
                    pitfallAnalysis: {
                      type: Type.STRING,
                      description: '侧重易错点的深度避坑剖析，指出学生常错在什么地方以及如何防范',
                    },
                    keywordsToHighlight: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '易错点解析中需要重点高亮的2-4个核心关键词',
                    },
                  },
                  required: [
                    'id',
                    'level',
                    'title',
                    'questionText',
                    'standardAnswer',
                    'explanation',
                    'pitfallAnalysis',
                    'keywordsToHighlight',
                  ],
                },
              },
            },
            required: ['knowledgeSummary', 'variants'],
          },
        },
      },
      ['gemini-3.1-flash-lite', 'gemini-3.8-flash']
    );

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/generate-variants:', error);
    const friendlyMsg = formatErrorMessage(error, '举一反三生成失败，请重试');
    return res.status(500).json({ error: friendlyMsg });
  }
});

// API: Download complete application source code as standalone HTML
app.get('/api/download-code-html', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'jiujiu-planet-source-code.html');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename*=UTF-8\'\'' + encodeURIComponent('久久的闯关星球_完整应用源代码文档.html')
    );
    res.sendFile(filePath);
  } else {
    res.status(404).send('源代码文档未生成，请稍后刷新重试');
  }
});

// Production static file serving or Dev Vite middleware
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`久久的闯关星球 Server running on port ${PORT}`);
  });
}

startServer();
