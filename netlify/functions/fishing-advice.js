const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // 添加跨域支持，防止浏览器拦截
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // 1. 获取 API 密钥，并自动去掉多余的空格 (.trim)
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return { 
      statusCode: 500, 
      headers,
      body: '系统错误：未配置 API 密钥' 
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // 【关键】必须用 1.5-flash，绝对不能写错！
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    let result;

    // 如果上传了图片，带上图片一起发给谷歌
    if (imagePreview) {
      const base64Data = imagePreview.split(',')[1];
      const imageParts = [{
        inlineData: {
          data: base64Data,
          mimeType: mimeType || 'image/jpeg'
        }
      }];
      prompt += "\n\n我还上传了钓点实勘图，请结合图片的地形、水情推荐钓位！";
      result = await model.generateContent([prompt, ...imageParts]);
    } else {
      result = await model.generateContent(prompt);
    }

    // 成功返回给前端
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
      body: result.response.text(),
    };

  } catch (error) {
    console.error("AI 接口报错详情:", error);
    return { 
      statusCode: 500, 
      headers,
      body: `抱歉，大师推演失败。错误详情: ${error.message}` 
    };
  }
};