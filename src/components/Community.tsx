import React, { useState } from 'react';
import { Camera, MapPin, Fish, Crosshair, Sparkles, Image as ImageIcon, ThumbsUp, MessageCircle, Share2, Send, Wand2, Check, Copy, Upload, X } from 'lucide-react';
import Markdown from 'react-markdown';

const MOCK_POSTS = [
  {
    id: 1,
    user: '钓鱼佬老王',
    avatar: 'https://picsum.photos/seed/user1/100/100',
    time: '2小时前',
    content: '今天天气不错，去水库野钓，没想到碰到了大货！用的蓝鲫加点红虫，效果杠杠的。',
    images: ['https://picsum.photos/seed/fish1/600/400'],
    location: '东风水库',
    rod: '7.2m 综合竿',
    bait: '野战蓝鲫 + 红虫',
    maxFish: '草鱼 8.5斤',
    likes: 128,
    comments: 32
  },
  {
    id: 2,
    user: '黑坑终结者',
    avatar: 'https://picsum.photos/seed/user2/100/100',
    time: '5小时前',
    content: '黑坑练竿，今天鱼口有点滑，换了细线小钩才开始连竿。',
    images: ['https://picsum.photos/seed/fish2/600/400', 'https://picsum.photos/seed/fish3/600/400'],
    location: '老李黑坑',
    rod: '4.5m 战斗竿',
    bait: '原塘颗粒 + 散炮',
    maxFish: '鲤鱼 3斤',
    likes: 56,
    comments: 12
  }
];

const TEMPLATES = [
  { id: 'standard', label: '标准战报', desc: '清晰展示渔获信息' },
  { id: 'spring', label: '春日爆护', desc: '适合春季野钓' },
  { id: 'night', label: '夜钓王者', desc: '酷炫夜钓风格' },
  { id: 'holiday', label: '节日特供', desc: '喜庆节日氛围' }
];

export default function Community() {
  const [activeView, setActiveView] = useState<'feed' | 'create' | 'ai-report'>('feed');
  const [posts, setPosts] = useState(MOCK_POSTS);
  
  // Create Post State
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [rod, setRod] = useState('');
  const [bait, setBait] = useState('');
  const [maxFish, setMaxFish] = useState('');
  
  // AI Report State
  const [reportTemplate, setReportTemplate] = useState(TEMPLATES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = () => {
    if (!content.trim()) return;
    
    const newPost = {
      id: Date.now(),
      user: '我',
      avatar: 'https://picsum.photos/seed/me/100/100',
      time: '刚刚',
      content,
      images: ['https://picsum.photos/seed/newfish/600/400'], // Mock image
      location,
      rod,
      bait,
      maxFish,
      likes: 0,
      comments: 0
    };
    
    setPosts([newPost, ...posts]);
    setActiveView('feed');
    setContent('');
    setLocation('');
    setRod('');
    setBait('');
    setMaxFish('');
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    setReportText(null);
    
    try {
      // Generate Image
      const imagePrompt = selectedImage
        ? `Please beautify and enhance this fishing photo to make it look like a professional catch report poster. Theme: ${TEMPLATES.find(t => t.id === reportTemplate)?.label}. Add stylish effects suitable for social media.`
        : `A beautiful and exciting fishing catch report poster. 
      Theme: ${TEMPLATES.find(t => t.id === reportTemplate)?.label}. 
      Details: Location ${location || 'Unknown'}, Rod ${rod || 'Unknown'}, Bait ${bait || 'Unknown'}, Biggest catch ${maxFish || 'Unknown'}. 
      Style: High quality, vibrant, social media ready, typography overlay style.`;
      
      const imageRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePrompt,
          selectedImage
        }),
      });

      if (imageRes.ok) {
        const imageData = await imageRes.json();
        setGeneratedImage(imageData.imageUrl);
      } else {
        setGeneratedImage('https://picsum.photos/seed/report/800/1200');
      }
      
      // Generate Text
      const textRes = await fetch('/api/generate-report-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          rod,
          bait,
          maxFish,
          templateLabel: TEMPLATES.find(t => t.id === reportTemplate)?.label
        }),
      });

      if (textRes.ok) {
        const textData = await textRes.json();
        setReportText(textData.text || '战报生成失败，请自己写点什么吧~');
      } else {
        setReportText('战报生成失败，请自己写点什么吧~');
      }
      
    } catch (error) {
      console.error('Generation failed:', error);
      alert('生成失败，请稍后再试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto pb-24">
      {/* Header Tabs */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4">
        <button 
          onClick={() => setActiveView('feed')}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${activeView === 'feed' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          钓友圈
        </button>
        <button 
          onClick={() => setActiveView('create')}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${activeView === 'create' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          发动态
        </button>
        <button 
          onClick={() => setActiveView('ai-report')}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${activeView === 'ai-report' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <span className="flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4" /> AI战报
          </span>
        </button>
      </div>

      {/* Feed View */}
      {activeView === 'feed' && (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <img src={post.avatar} alt={post.user} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div>
                  <div className="font-medium text-slate-800">{post.user}</div>
                  <div className="text-xs text-slate-400">{post.time}</div>
                </div>
              </div>
              
              <p className="text-slate-700 mb-3 text-sm leading-relaxed">{post.content}</p>
              
              {/* Fishing Details Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {post.location && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md">
                    <MapPin className="w-3 h-3" /> {post.location}
                  </span>
                )}
                {post.rod && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                    <Crosshair className="w-3 h-3" /> {post.rod}
                  </span>
                )}
                {post.bait && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded-md">
                    <Sparkles className="w-3 h-3" /> {post.bait}
                  </span>
                )}
                {post.maxFish && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-md">
                    <Fish className="w-3 h-3" /> {post.maxFish}
                  </span>
                )}
              </div>
              
              {/* Images */}
              <div className={`grid gap-2 mb-4 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {post.images.map((img, idx) => (
                  <img key={idx} src={img} alt="Catch" className="w-full h-48 object-cover rounded-xl" referrerPolicy="no-referrer" />
                ))}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-slate-500">
                <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors text-sm">
                  <ThumbsUp className="w-4 h-4" /> {post.likes}
                </button>
                <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors text-sm">
                  <MessageCircle className="w-4 h-4" /> {post.comments}
                </button>
                <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors text-sm">
                  <Share2 className="w-4 h-4" /> 分享
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Post View */}
      {activeView === 'create' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的钓鱼故事..."
            className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> 钓点</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="在哪钓的？" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1"><Crosshair className="w-3 h-3" /> 鱼竿</label>
              <input type="text" value={rod} onChange={e => setRod(e.target.value)} placeholder="用的什么竿？" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1"><Sparkles className="w-3 h-3" /> 饵料</label>
              <input type="text" value={bait} onChange={e => setBait(e.target.value)} placeholder="用的什么饵？" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1"><Fish className="w-3 h-3" /> 最大单尾</label>
              <input type="text" value={maxFish} onChange={e => setMaxFish(e.target.value)} placeholder="多大的鱼？" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <div className="pt-2">
            <button className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-500 transition-colors">
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm font-medium">添加照片 (最多9张)</span>
            </button>
          </div>
          
          <button 
            onClick={handleCreatePost}
            disabled={!content.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors mt-4"
          >
            <Send className="w-4 h-4" />
            发布动态
          </button>
        </div>
      )}

      {/* AI Report View */}
      {activeView === 'ai-report' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Wand2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">AI 战报生成器</h3>
                <p className="text-xs text-slate-500">输入渔获信息，一键生成炫酷战报图文</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="钓点 (如: 东风水库)" className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm" />
                <input type="text" value={maxFish} onChange={e => setMaxFish(e.target.value)} placeholder="最大单尾 (如: 鲤鱼5斤)" className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm" />
                <input type="text" value={rod} onChange={e => setRod(e.target.value)} placeholder="鱼竿 (如: 7.2m)" className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm" />
                <input type="text" value={bait} onChange={e => setBait(e.target.value)} placeholder="饵料 (如: 蓝鲫)" className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm" />
              </div>
              
              {/* Optional Image Upload */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">上传原图 (选填，AI将为您美化)</label>
                {selectedImage ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-purple-100">
                    <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-purple-200 rounded-xl cursor-pointer bg-white hover:bg-purple-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 text-purple-400 mb-2" />
                      <p className="text-xs text-slate-500">点击上传照片</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">选择战报模板</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setReportTemplate(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${reportTemplate === t.id ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-slate-200 bg-white hover:border-purple-200'}`}
                    >
                      <div className={`text-sm font-bold ${reportTemplate === t.id ? 'text-purple-700' : 'text-slate-700'}`}>{t.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={handleGenerateReport}
                disabled={isGenerating || (!location && !maxFish)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI 正在施展魔法...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    一键生成炫酷战报
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Generated Result */}
          {(generatedImage || reportText) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                生成成功！
              </h4>
              
              {generatedImage && (
                <div className="mb-4 rounded-xl overflow-hidden shadow-sm border border-slate-100 relative group">
                  <img src={generatedImage} alt="AI Generated Report" className="w-full h-auto" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="px-4 py-2 bg-white text-slate-800 rounded-lg font-medium text-sm shadow-lg flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> 保存图片
                    </button>
                  </div>
                </div>
              )}
              
              {reportText && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {reportText}
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(reportText);
                      alert('文案已复制！');
                    }}
                    className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="w-3.5 h-3.5" /> 复制文案
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => {
                  setContent(reportText || '');
                  setActiveView('create');
                }}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                去发动态
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
