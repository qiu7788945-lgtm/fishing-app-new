const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const apiKey = (process.env.GEMINI_API_KEY || '').replace(/^["']|["']$/g, '').trim();
    if (!apiKey) return { statusCode: 500, headers, body: '未配置 API 密钥' };

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 【提速核心】锁定成功连通的 2.0 模型，并强制限制输出字数，防止 30 秒超时
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { maxOutputTokens: 500 } // 强行限制字数，让它在5秒内吐出结果
    });

    const { fishingMode, targetFish, weather, imagePreview, mimeType } = JSON.parse(event.body);

    // 极简提示词，要求直奔主题
    let prompt = `你是一位大师。模式【${fishingMode}】，目标【${targetFish}】，气压${weather?.pressure}hPa。
请简明扼要（总字数200字内），包含：
1. 气象出钓建议
2. 钓位水深
3. 线组调钓
4. 【核心开饵配方】(仅列出无序列表)`;

    let requestItems = [prompt];
    
    // 如果有图片，带着图片一起发
    if (imagePreview) {
      requestItems.push({
        inlineData: {
          data: imagePreview.split(',')[1],
          mimeType: mimeType || 'image/jpeg'
        }
      });
    }

    // 发起请求
    const result = await model.generateContent(requestItems);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
      body: result.response.text(),
    };

  } catch (error) {
    console.error("AI报错:", error.message);
    return { statusCode: 500, headers, body: `服务器超时或崩溃: ${error.message}` };
  }
};