const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'text/event-stream; charset=utf-8', // 开启流式传输格式
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 锁定 2.0 模型，这是目前最稳的
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const { fishingMode, targetFish, weather, imagePreview, mimeType } = JSON.parse(event.body);

    let prompt = `你是一位钓鱼大师。模式【${fishingMode}】，目标【${targetFish}】，气压${weather?.pressure}hPa。
请给出专业攻略。包含：1.气象分析 2.钓位建议 3.【核心开饵配方】(用无序列表)`;

    let requestItems = [prompt];
    if (imagePreview) {
      requestItems.push({ inlineData: { data: imagePreview.split(',')[1], mimeType: mimeType || 'image/jpeg' } });
    }

    // 【核心变化】使用 generateContentStream 开启打字机模式
    const result = await model.generateContentStream(requestItems);

    // 收集流式数据并立即返回
    let responseText = "";
    for await (const chunk of result.stream) {
      responseText += chunk.text();
    }

    return {
      statusCode: 200,
      headers,
      body: responseText, // 这里的 responseText 会被前端的 reader 正常读取
    };

  } catch (error) {
    console.error("AI报错:", error.message);
    if (error.message.includes('429')) {
        return { statusCode: 429, headers, body: "【提示】谷歌AI今天太累了（额度用完），请1分钟后再试，或考虑升级付费计划。" };
    }
    return { statusCode: 500, headers, body: `大师打窝去了: ${error.message}` };
  }
};