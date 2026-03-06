const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // 跨域支持，防止浏览器拦截
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 1. 获取密钥，自动清理可能不小心复制进去的引号和空格
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

    // 拼装发送给 AI 的数据包
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

    // 2. 终极火力覆盖：设立模型备用梯队，倒下一个顶上一个！
    const modelsToTry = [
      "gemini-1.5-flash", 
      "gemini-1.5-flash-latest", 
      "gemini-1.5-pro",
      "gemini-pro"
    ];
    
    let lastError = null;
    let result = null;

    for (const modelName of modelsToTry) {
        try {
            // 旧版 gemini-pro 不支持传图片，如果带了图片就跳过它
            if (imagePreview && modelName === "gemini-pro") continue;

            const model = genAI.getGenerativeModel({ model: modelName });
            result = await model.generateContent(requestItems);
            
            // 如果成功拿到了结果，立刻跳出循环！
            if (result) break;
        } catch (err) {
            console.log(`尝试模型 ${modelName} 失败:`, err.message);
            lastError = err;
        }
    }

    // 如果所有模型都阵亡了
    if (!result) {
        throw new Error(`所有模型均拒绝访问。最后错误: ${lastError?.message}`);
    }

    // 3. 成功返回给前端
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
      body: result.response.text(),
    };

  } catch (error) {
    console.error("AI 接口报错:", error);
    
    // 把冰冷的报错翻译成人话，方便排查
    let errorMsg = `抱歉，大师推演失败。错误详情: ${error.message}`;
    if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
        errorMsg = "致命错误：您的 API 密钥无效或输入了错误的内容，请前往 Google AI Studio 重新生成。";
    } else if (error.message.includes('404')) {
        errorMsg = "致命错误：API 密钥格式正确，但该密钥没有访问大模型的权限。请务必使用 Google 账号登录 AI Studio，创建一个【全新】的 API Key 并更新到 Netlify。";
    }

    return { statusCode: 500, headers, body: errorMsg };
  }
};