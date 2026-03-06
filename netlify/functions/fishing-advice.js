const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').replace(/^["']|["']$/g, '').trim();
  if (!apiKey) {
    return { statusCode: 500, headers, body: '系统错误：未在 Netlify 后台配置 API 密钥' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const { fishingMode, targetFish, weather, imagePreview, mimeType } = JSON.parse(event.body);

    let prompt = `你现在是一位拥有20年经验的钓鱼大师。
请求分析：
- 作钓模式：【${fishingMode}】
- 目标鱼：【${targetFish}】
- 当前气象：气温 ${weather?.temperature}°C，气压 ${weather?.pressure}hPa，风速 ${weather?.windSpeed}km/h。

请给出一段专业的爆护攻略，必须包含以下结构：
1. 气象分析与出钓建议
2. 钓位选择与水深建议
3. 线组与浮漂调钓建议
4. 【核心开饵配方】(请以此为标题，并用无序列表列出饵料名称)`;

    let requestItems = [prompt];
    if (imagePreview) {
      const base64Data = imagePreview.split(',')[1];
      requestItems.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType || 'image/jpeg'
        }
      });
      requestItems[0] += "\n\n我还上传了钓点实勘图，请结合图片的地形、水情推荐钓位！";
    }

    // 核心修复：1.5系列已被谷歌删除，必须使用 2.5 或 2.0 系列最新存活模型
    const modelsToTry = [
      "gemini-2.5-flash", 
      "gemini-2.0-flash", 
      "gemini-flash-latest"
    ];
    
    let lastError = null;
    let result = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            result = await model.generateContent(requestItems);
            if (result) break; // 成功则立刻跳出循环
        } catch (err) {
            console.log(`尝试模型 ${modelName} 失败:`, err.message);
            lastError = err;
        }
    }

    if (!result) {
        throw new Error(`所有新版模型均拒绝访问。最后错误: ${lastError?.message}`);
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
      body: result.response.text(),
    };

  } catch (error) {
    console.error("AI 接口报错:", error);
    return { statusCode: 500, headers, body: `抱歉，大师推演失败。错误详情: ${error.message}` };
  }
};