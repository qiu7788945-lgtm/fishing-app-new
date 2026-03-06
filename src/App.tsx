import React, { useState, useEffect } from 'react';
import { Search, MapPin, Wind, Thermometer, Droplets, Gauge, CloudRain, Sun, Cloud, CloudLightning, Snowflake, Sunrise, Sunset, Compass, Camera, Sparkles, Fish, Crosshair, Anchor, Waves, Copy, Check, Store, Phone, PackagePlus, ShoppingBag, X, Navigation, Plus, Minus, Home, Users, User } from 'lucide-react';
import Markdown from 'react-markdown';
import Community from './components/Community';
import Shop from './components/Shop';
import Profile from './components/Profile';

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  time: string;
  sunrise: string;
  sunset: string;
}

interface LocationData {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
}

const FISHING_MODES = [
  { id: '野钓', label: '野钓', desc: '江河水库', icon: <Waves className="w-4 h-4" /> },
  { id: '黑坑', label: '黑坑', desc: '商业高密度', icon: <Fish className="w-4 h-4" /> },
  { id: '斤塘', label: '斤塘', desc: '论斤称重', icon: <Gauge className="w-4 h-4" /> },
  { id: '练竿池', label: '练竿池', desc: '只练不带', icon: <Crosshair className="w-4 h-4" /> },
  { id: '竞技', label: '竞技', desc: '比赛掐鱼', icon: <Sparkles className="w-4 h-4" /> },
  { id: '海钓', label: '海钓/矶钓', desc: '大海作钓', icon: <Anchor className="w-4 h-4" /> },
  { id: '路亚', label: '路亚', desc: '拟饵作钓', icon: <Fish className="w-4 h-4" /> },
];

const TARGET_FISHES = [
  '综合鱼 (无特定目标)',
  '鲫鱼',
  '鲤鱼',
  '草鱼',
  '青鱼',
  '鲢鳙',
  '罗非鱼',
  '翘嘴',
  '黑鱼',
  '鲈鱼',
  '鳜鱼',
  '黄颡鱼 (昂刺)'
];

export default function App() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState<string>('定位中...');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // New states for AI Spot Analysis
  const [fishingMode, setFishingMode] = useState('野钓');
  const [targetFish, setTargetFish] = useState(TARGET_FISHES[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [thinkingLogs, setThinkingLogs] = useState<string[]>([]);

  // Inventory & Shopping States
  const [inventory, setInventory] = useState<{name: string, quantity: number}[]>([
    { name: '野战蓝鲫', quantity: 1 },
    { name: '速攻2号', quantity: 2 },
    { name: '红虫', quantity: 1 }
  ]);
  const [isCopied, setIsCopied] = useState(false);
  const [totalEsgPoints, setTotalEsgPoints] = useState(12500); // Initial points for testing
  const [isNightMode, setIsNightMode] = useState(false);

  // Fetch weather data from Open-Meteo
  const fetchWeather = async (lat: number, lon: number, locName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&daily=sunrise,sunset&timezone=auto`
      );
      if (!res.ok) throw new Error('获取天气数据失败');
      const data = await res.json();
      
      setWeather({
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        pressure: data.current.surface_pressure,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        weatherCode: data.current.weather_code,
        time: data.current.time,
        sunrise: data.daily?.sunrise?.[0] || '',
        sunset: data.daily?.sunset?.[0] || '',
      });
      setLocationName(locName);
      setSearchResults([]);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // Geolocation API
  const handleLocateMe = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('您的浏览器不支持地理定位');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocoding to get city name (using Open-Meteo or just generic name)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=zh`);
          const data = await res.json();
          const locName = data.address?.city || data.address?.town || data.address?.county || '当前位置';
          fetchWeather(latitude, longitude, locName);
        } catch (e) {
          // Fallback if reverse geocoding fails
          fetchWeather(latitude, longitude, '当前位置');
        }
      },
      (err) => {
        setError('定位失败，请确保已授予位置权限');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  // Manual search using Open-Meteo Geocoding API
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=zh&format=json`);
      if (!res.ok) throw new Error('搜索城市失败');
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setError('未找到该城市');
        setSearchResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (loc: LocationData) => {
    const locName = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}`;
    fetchWeather(loc.latitude, loc.longitude, locName);
  };

  // Initial load
  useEffect(() => {
    handleLocateMe();
  }, []);

  // Weather code mapping
  const getWeatherInfo = (code: number) => {
    if (code === 0) return { text: '晴朗', icon: <Sun className="w-16 h-16 text-yellow-400" /> };
    if (code >= 1 && code <= 3) return { text: '多云/阴', icon: <Cloud className="w-16 h-16 text-gray-400" /> };
    if (code >= 45 && code <= 48) return { text: '雾', icon: <Cloud className="w-16 h-16 text-gray-300" /> };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { text: '雨', icon: <CloudRain className="w-16 h-16 text-blue-400" /> };
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { text: '雪', icon: <Snowflake className="w-16 h-16 text-blue-200" /> };
    if (code >= 95 && code <= 99) return { text: '雷暴', icon: <CloudLightning className="w-16 h-16 text-purple-500" /> };
    return { text: '未知', icon: <Cloud className="w-16 h-16 text-gray-400" /> };
  };

  // Fishing tip based on pressure
  const getFishingTip = (pressure: number) => {
    if (pressure > 1015) return { text: '气压较高，水中溶氧量充足，鱼儿活跃，非常适合钓鱼！', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (pressure >= 1005 && pressure <= 1015) return { text: '气压正常，适合钓鱼，祝您爆护！', color: 'text-blue-600', bg: 'bg-blue-50' };
    return { text: '气压偏低，水中溶氧量下降，鱼儿可能不太活跃，建议钓浮或选择活水处。', color: 'text-amber-600', bg: 'bg-amber-50' };
  };

  // Wind speed to Beaufort scale
  const getBeaufortScale = (speed: number) => {
    if (speed < 1) return 0;
    if (speed < 6) return 1;
    if (speed < 12) return 2;
    if (speed < 20) return 3;
    if (speed < 29) return 4;
    if (speed < 39) return 5;
    if (speed < 50) return 6;
    if (speed < 62) return 7;
    if (speed < 75) return 8;
    if (speed < 89) return 9;
    if (speed < 103) return 10;
    if (speed < 118) return 11;
    return 12;
  };

  // Wind direction degree to text
  const getWindDirection = (degree: number) => {
    const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    return dirs[Math.round(degree / 45) % 8];
  };

  // Format ISO time to HH:mm
  const formatTime = (isoString: string) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // Simulated thinking process
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAnalyzing && !aiAnalysis) {
      const steps = [
        `获取当前气象数据：气压 ${weather?.pressure || '--'}hPa...`,
        `结合【${fishingMode}】模式，分析水域底层环境...`,
        `针对目标鱼种【${targetFish}】，推演最佳摄食水深...`,
        `计算当前风向与溶氧量对鱼口的影响...`,
        `正在调配独门开饵秘方与线组搭配...`,
        `整理钓位建议，生成最终爆护指南...`
      ];
      let currentStep = 0;

      const addLog = () => {
        if (currentStep < steps.length) {
          setThinkingLogs(prev => [...prev, steps[currentStep]]);
          currentStep++;
          timeout = setTimeout(addLog, 800 + Math.random() * 600);
        }
      };
      timeout = setTimeout(addLog, 300);
    }
    return () => clearTimeout(timeout);
  }, [isAnalyzing, aiAnalysis, fishingMode, targetFish, weather]);

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setAiAnalysis(null); // Reset previous analysis
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze Spot with Gemini
  const analyzeSpot = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    setThinkingLogs([]);
    try {
      const mimeType = imageFile ? imageFile.type || 'image/jpeg' : undefined;
      
      const response = await fetch('/api/fishing-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fishingMode,
          targetFish,
          weather,
          imagePreview,
          mimeType
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setAiAnalysis((prev) => prev + chunk);
        }
      }
    } catch (err) {
      console.error(err);
      setAiAnalysis('抱歉，AI大师暂时去打窝了，请稍后再试或检查网络。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Parse Recipe and Missing Baits
  const recipeMatch = aiAnalysis?.match(/【核心开饵配方】([\s\S]*?)$/);
  const recipeText = recipeMatch ? recipeMatch[1].trim() : '';
  const recipeItems = recipeText.split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line))
    .map(line => line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
  
  const missingBaits = recipeItems.filter(item => {
    return !inventory.some(inv => inv.quantity > 0 && (item.includes(inv.name) || inv.name.includes(item)));
  });

  const displayAnalysis = aiAnalysis ? aiAnalysis.replace(/【核心开饵配方】[\s\S]*$/, '').trim() : '';

  const handleCopyRecipe = () => {
    if (recipeItems.length > 0) {
      navigator.clipboard.writeText(recipeItems.join('\n'));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const MOCK_SHOPS = [
    { id: 1, name: '老李渔具店', distance: '1.2km', phone: '13752563804', delivery: true },
    { id: 2, name: '海明威钓具行', distance: '2.5km', phone: '13900139000', delivery: true },
    { id: 3, name: '大鲫大鲤渔具', distance: '3.8km', phone: '13700137000', delivery: false },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-4 md:p-8 flex flex-col items-center pb-24">
      {activeTab === 'home' && (
        <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            <Droplets className="w-8 h-8 text-blue-500" />
            钓鱼气象站
          </h1>
          <p className="text-slate-500 text-sm">专为钓鱼人打造的实时天气与气压助手</p>
        </header>

        {/* Search Bar */}
        <div className="relative">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入城市/区域名称..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            </div>
            <button
              type="button"
              onClick={handleLocateMe}
              className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-blue-600 transition-colors flex items-center justify-center"
              title="自动定位"
            >
              <MapPin className="w-5 h-5" />
            </button>
          </form>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10">
              {searchResults.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => selectLocation(loc)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                >
                  <div className="font-medium text-slate-800">{loc.name}</div>
                  <div className="text-xs text-slate-500">
                    {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Toggle */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200">
          <span className="text-sm font-medium text-slate-700">显示高级气象数据 (风向/日出日落)</span>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showAdvanced ? 'bg-blue-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAdvanced ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="text-center py-8 text-slate-500 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p>获取数据中...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Weather Card */}
        {weather && !loading && !error && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-8 space-y-8">
              
              {/* Location & Current Weather */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    {locationName}
                  </h2>
                  <p className="text-slate-500 text-sm pl-7">
                    {getWeatherInfo(weather.weatherCode).text}
                  </p>
                </div>
                <div>
                  {getWeatherInfo(weather.weatherCode).icon}
                </div>
              </div>

              {/* Main Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Temperature */}
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Thermometer className="w-4 h-4" />
                    气温
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    {weather.temperature}<span className="text-xl text-slate-500 font-normal">°C</span>
                  </div>
                </div>

                {/* Pressure (Crucial for fishing) */}
                <div className="bg-blue-50 p-4 rounded-2xl space-y-2 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                    <Gauge className="w-4 h-4" />
                    气压 (关键)
                  </div>
                  <div className="text-3xl font-bold text-blue-900">
                    {weather.pressure}<span className="text-xl text-blue-600/70 font-normal"> hPa</span>
                  </div>
                </div>

                {/* Wind */}
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Wind className="w-4 h-4" />
                    风力风速
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-slate-800">{getBeaufortScale(weather.windSpeed)}级</span>
                    <span className="text-sm text-slate-500 font-normal">({weather.windSpeed} km/h)</span>
                  </div>
                  {showAdvanced && (
                    <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                      <Compass className="w-3.5 h-3.5" />
                      {getWindDirection(weather.windDirection)}风
                    </div>
                  )}
                </div>

                {/* Humidity */}
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Droplets className="w-4 h-4" />
                    湿度
                  </div>
                  <div className="text-2xl font-semibold text-slate-800">
                    {weather.humidity}<span className="text-base text-slate-500 font-normal">%</span>
                  </div>
                </div>
                
                {/* Advanced: Sunrise & Sunset */}
                {showAdvanced && (
                  <>
                    <div className="bg-orange-50 p-4 rounded-2xl space-y-2 border border-orange-100">
                      <div className="flex items-center gap-2 text-orange-600 text-sm font-medium">
                        <Sunrise className="w-4 h-4" />
                        日出时间
                      </div>
                      <div className="text-2xl font-semibold text-orange-900">
                        {formatTime(weather.sunrise)}
                      </div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl space-y-2 border border-indigo-100">
                      <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
                        <Sunset className="w-4 h-4" />
                        日落时间
                      </div>
                      <div className="text-2xl font-semibold text-indigo-900">
                        {formatTime(weather.sunset)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Fishing Tip */}
              <div className={`p-4 rounded-2xl ${getFishingTip(weather.pressure).bg} border border-black/5`}>
                <h3 className={`text-sm font-bold mb-1 ${getFishingTip(weather.pressure).color}`}>钓鱼指数提示</h3>
                <p className={`text-sm ${getFishingTip(weather.pressure).color} opacity-90 leading-relaxed`}>
                  {getFishingTip(weather.pressure).text}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* AI Spot Analysis Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Crosshair className="w-5 h-5 text-blue-500" />
                  AI 智能选位与开饵
                </h2>
                <p className="text-slate-500 text-sm">选择出钓模式和目标鱼，可选择性上传钓点照片，让AI大师为您出谋划策</p>
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="flex flex-col items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0 ml-2"
              >
                <PackagePlus className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">我的饵料库</span>
              </button>
            </div>

            {/* Fishing Mode Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">出钓模式 (行话)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FISHING_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setFishingMode(mode.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border transition-all ${
                      fishingMode === mode.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      {mode.icon}
                      {mode.label}
                    </div>
                    <div className="text-xs opacity-70">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Fish Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">目标鱼种</label>
              <select
                value={targetFish}
                onChange={(e) => setTargetFish(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700"
              >
                {TARGET_FISHES.map((fish) => (
                  <option key={fish} value={fish}>
                    {fish}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload & Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">钓点实勘图 (选填)</label>
                <span className="text-xs text-slate-400">上传照片可增加选位建议</span>
              </div>
              
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="mb-1 text-sm text-slate-500"><span className="font-semibold">点击拍照</span> 或上传照片</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
                    <img src={imagePreview} alt="钓点预览" className="max-h-full max-w-full object-contain" />
                    <button 
                      onClick={() => { setImagePreview(null); setImageFile(null); setAiAnalysis(null); }}
                      className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors"
                    >
                      更换照片
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Button */}
            <button
              onClick={analyzeSpot}
              disabled={isAnalyzing}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {aiAnalysis ? '正在输出攻略...' : '大师正在推演...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {imagePreview ? '分析钓点并生成爆护攻略' : '生成专属开饵与作钓方案'}
                </>
              )}
            </button>

            {/* AI Analysis Result */}
            {(aiAnalysis || thinkingLogs.length > 0) && (
              <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-blue-800 font-medium">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  爆护攻略
                </div>
                
                {/* Thinking Process */}
                {thinkingLogs.length > 0 && !aiAnalysis && (
                  <div className="mb-4 space-y-2 font-mono text-xs text-blue-600/80 bg-blue-100/50 p-3 rounded-xl border border-blue-200/50 transition-all">
                    {thinkingLogs.map((log, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        {log}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      ...
                    </div>
                  </div>
                )}

                {/* Streamed Result */}
                {displayAnalysis && (
                  <div className="prose prose-sm prose-blue max-w-none text-slate-700 leading-relaxed">
                    <Markdown>{displayAnalysis}</Markdown>
                    {isAnalyzing && !recipeMatch && <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse"></span>}
                  </div>
                )}

                {/* Recipe & Shopping Section */}
                {recipeItems.length > 0 && (
                  <div className="mt-6 border-t border-blue-200/50 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                        专属开饵配方
                      </h3>
                      <button 
                        onClick={handleCopyRecipe}
                        className="flex items-center gap-1 text-xs font-medium bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? '已复制' : '复制配方'}
                      </button>
                    </div>
                    
                    <ul className="space-y-2 mb-5">
                      {recipeItems.map((item, idx) => {
                        const isMissing = missingBaits.includes(item);
                        return (
                          <li key={idx} className="flex items-center justify-between bg-white/60 p-2.5 rounded-lg border border-blue-100">
                            <span className="font-medium text-slate-700">{item}</span>
                            {isMissing ? (
                              <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100">缺货</span>
                            ) : (
                              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">库存充足</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {/* Nearby Shops for Missing Baits */}
                    {missingBaits.length > 0 && !isAnalyzing && (
                      <div className="bg-white rounded-xl border border-orange-100 overflow-hidden">
                        <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center gap-2">
                          <Store className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-bold text-orange-800">附近渔具店 (补齐缺货)</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {MOCK_SHOPS.map(shop => (
                            <div key={shop.id} className="p-4 flex items-center justify-between">
                              <div>
                                <div className="font-medium text-slate-800 flex items-center gap-2">
                                  {shop.name}
                                  {shop.delivery && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">支持外卖</span>}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                                  <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {shop.distance}</span>
                                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {shop.phone}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <a href={`tel:${shop.phone}`} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                  <Phone className="w-4 h-4" />
                                </a>
                                {shop.delivery && (
                                  <button className="px-3 py-2 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors">
                                    买饵料
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'community' && <Community />}
      
      {activeTab === 'shop' && <Shop totalEsgPoints={totalEsgPoints} setTotalEsgPoints={setTotalEsgPoints} />}

      {activeTab === 'profile' && (
        <Profile 
          inventory={inventory} 
          setInventory={setInventory} 
          totalEsgPoints={totalEsgPoints} 
          setTotalEsgPoints={setTotalEsgPoints}
          isNightMode={isNightMode}
          setIsNightMode={setIsNightMode}
        />
      )}

      {/* Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 border-t px-6 py-3 flex justify-between items-center z-40 pb-safe transition-colors duration-300 ${isNightMode && activeTab === 'profile' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-600' : (isNightMode && activeTab === 'profile' ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600')}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">首页</span>
        </button>
        <button 
          onClick={() => setActiveTab('community')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'community' ? 'text-blue-600' : (isNightMode && activeTab === 'profile' ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600')}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium">社区</span>
        </button>
        <button 
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'shop' ? 'text-blue-600' : (isNightMode && activeTab === 'profile' ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600')}`}
        >
          <Store className="w-6 h-6" />
          <span className="text-[10px] font-medium">商城</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : (isNightMode && activeTab === 'profile' ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600')}`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">我的</span>
        </button>
      </div>
    </div>
  );
}
