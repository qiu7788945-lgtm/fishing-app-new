// 文件路径: netlify/functions/fishing-advice.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // 确保是 POST 请求
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. 解析前端传来的参数
    const { fishingMode, targetFish, weather } = JSON.parse(event.body);

    // 2. 使用 Netlify 环境变量中的 API Key 初始化 AI (绝对安全)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // 填入你使用的模型

    // 3. 拼接给 AI 的提示词 (Prompt)
    const prompt = `结合【${fishingMode}】和目标鱼【${targetFish}】，以及当前气压 ${weather?.pressure}，给出一份钓鱼攻略和开饵配方。`;

    // 4. 请求 AI
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 5. 返回给前端
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: text,
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'AI 大师暂时去打窝了' };
  }
};