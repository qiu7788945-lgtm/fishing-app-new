import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini AI with the API key from the environment
  // The key is safely stored on the server and never sent to the client
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // API Route 1: Get Fishing Advice
  app.post("/api/fishing-advice", async (req, res) => {
    try {
      const { fishingMode, targetFish, weather, imagePreview, mimeType } = req.body;

      let prompt = `你现在是一位拥有30年经验的特级钓鱼大师。我现在的作钓模式是：【${fishingMode}】，目标鱼种是：【${targetFish}】。\n`;
      if (weather) {
        prompt += `当前天气参考：气温 ${weather.temperature}℃，气压 ${weather.pressure}hPa，风力 ${weather.windSpeed} ${weather.windDirection}。\n`;
      }

      let contents;
      if (imagePreview) {
        prompt += `\n请仔细观察我上传的这张钓点实景照片。
请帮我分析：
1. 图中哪里是最佳的“黄金钓位”（例如：水草边缘、铧尖、回水湾、树荫下、深浅交界处、增氧机旁等）？请具体描述在画面的哪个位置。
2. 结合当前的作钓模式、目标鱼种和天气，给出针对性的作钓建议（如线组搭配、饵料味型、开饵思路、钓深钓浅、浮漂调钓等）。
请用专业但易懂的钓鱼人行话来回答，语气要像一位热心的老钓友，直接给出结论，不要说客套话。`;

        const base64Data = imagePreview.split(',')[1];

        contents = {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        };
      } else {
        prompt += `\n我没有上传钓点照片。
请帮我分析：
结合当前的作钓模式、目标鱼种和天气，给出针对性的作钓建议（如线组搭配、饵料味型、开饵思路、钓深钓浅、浮漂调钓等）。
请用专业但易懂的钓鱼人行话来回答，语气要像一位热心的老钓友，直接给出结论，不要说客套话。`;

        contents = {
          parts: [
            { text: prompt }
          ]
        };
      }

      prompt += `\n\n【特别注意】请务必在回答的最后，单独附上一个【核心开饵配方】区块，严格按照以下格式列出需要的具体饵料商品名或通用名（每行一个，以"-"开头）：
【核心开饵配方】
- 饵料名称1
- 饵料名称2
- 饵料名称3`;

      // Update contents text part with the appended prompt
      if (contents.parts.length === 2) {
        contents.parts[1].text = prompt;
      } else {
        contents.parts[0].text = prompt;
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents
      });

      for await (const chunk of responseStream) {
        res.write(chunk.text || '');
      }
      res.end();
    } catch (error: any) {
      console.error("Error generating fishing advice:", error);
      res.status(500).json({ error: "Failed to generate advice" });
    }
  });

  // API Route 2: Generate Catch Report Image
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { imagePrompt, selectedImage } = req.body;

      const parts: any[] = [{ text: imagePrompt }];
      if (selectedImage) {
        const base64Data = selectedImage.split(',')[1];
        const mimeType = selectedImage.split(';')[0].split(':')[1];
        parts.unshift({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K"
          }
        }
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = \`data:image/png;base64,\${base64EncodeString}\`;
          break;
        }
      }

      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(500).json({ error: "No image generated" });
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // API Route 3: Analyze ESG Image
  app.post("/api/analyze-esg", async (req, res) => {
    try {
      const { esgPreview, mimeType } = req.body;

      const prompt = `你是一个环保评估AI。用户上传了一张钓鱼后清理垃圾的照片。
请分析这张照片，判断用户清理垃圾的程度，并给出评分（0-100分）。
根据评分，奖励一定的环保积分（1分=1积分，最高100积分）。
请严格按照以下JSON格式返回结果，不要包含任何其他文本或Markdown标记：
{
  "score": 85,
  "points": 85,
  "comment": "感谢您清理了水瓶和塑料袋，保护了水域环境！"
}`;

      const base64Data = esgPreview.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        }
      });

      const text = response.text || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        res.json(result);
      } else {
        res.status(500).json({ error: "Failed to parse AI response" });
      }
    } catch (error: any) {
      console.error("Error analyzing ESG image:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // API Route 4: Generate Report Text
  app.post("/api/generate-report-text", async (req, res) => {
    try {
      const { location, rod, bait, maxFish, templateLabel } = req.body;
      
      const textPrompt = `写一段幽默风趣的钓鱼战报文案，用于发朋友圈。
      包含以下信息：
      地点：${location || '秘密钓点'}
      鱼竿：${rod || '我的爱竿'}
      饵料：${bait || '秘制神饵'}
      最大单尾：${maxFish || '大板鲫'}
      风格：${templateLabel}
      要求：字数100字左右，多用emoji，让人看了想点赞。`;
      
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: textPrompt,
      });
      
      res.json({ text: textResponse.text });
    } catch (error: any) {
      console.error("Error generating report text:", error);
      res.status(500).json({ error: "Failed to generate text" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
