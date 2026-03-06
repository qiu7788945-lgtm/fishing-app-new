import React, { useState } from 'react';
import { User, PackagePlus, Settings, ChevronRight, Heart, Star, Clock, MapPin, ShoppingBag, CreditCard, Truck, HeadphonesIcon, Plus, Minus, X, Leaf, Camera, Sparkles, CheckCircle2, Moon, Sun } from 'lucide-react';

interface InventoryItem {
  name: string;
  quantity: number;
}

interface ProfileProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  totalEsgPoints: number;
  setTotalEsgPoints: React.Dispatch<React.SetStateAction<number>>;
  isNightMode: boolean;
  setIsNightMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Profile({ inventory, setInventory, totalEsgPoints, setTotalEsgPoints, isNightMode, setIsNightMode }: ProfileProps) {
  const [newBait, setNewBait] = useState('');
  const [showBaitLibrary, setShowBaitLibrary] = useState(false);
  
  // ESG States
  const [showESG, setShowESG] = useState(false);
  const [esgImage, setEsgImage] = useState<File | null>(null);
  const [esgPreview, setEsgPreview] = useState<string | null>(null);
  const [isAnalyzingEsg, setIsAnalyzingEsg] = useState(false);
  const [esgResult, setEsgResult] = useState<{score: number, points: number, comment: string} | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleWithdraw = () => {
    if (totalEsgPoints >= 10000) {
      setTotalEsgPoints(prev => prev - 10000);
      showToast('提现成功！0.1元已转入您的微信/支付宝余额。');
    }
  };

  const handleAddBait = () => {
    if (newBait.trim() && !inventory.some(inv => inv.name === newBait.trim())) {
      setInventory([...inventory, { name: newBait.trim(), quantity: 1 }]);
      setNewBait('');
    }
  };

  const handleEsgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEsgImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEsgPreview(reader.result as string);
        setEsgResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeEsgImage = async () => {
    if (!esgPreview || !esgImage) return;
    
    setIsAnalyzingEsg(true);
    setEsgResult(null);
    
    try {
      const mimeType = esgImage.type || 'image/jpeg';
      
      const response = await fetch('/api/analyze-esg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          esgPreview,
          mimeType
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setEsgResult(result);
        setTotalEsgPoints(prev => prev + result.points);
      } else {
        throw new Error('Failed to analyze ESG image');
      }
    } catch (err) {
      console.error("ESG Analysis Error:", err);
      // Fallback mock result if API fails
      const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100
      setEsgResult({
        score: mockScore,
        points: mockScore,
        comment: "AI分析暂时不可用，但我们看到了您的环保行动！感谢您为保护水域环境做出的贡献。"
      });
      setTotalEsgPoints(prev => prev + mockScore);
    } finally {
      setIsAnalyzingEsg(false);
    }
  };

  return (
    <div className={`min-h-screen pb-24 font-sans transition-colors duration-300 ${isNightMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      {/* Header / User Info */}
      <div className={`${isNightMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-white shadow-sm'} pt-12 pb-6 px-6 transition-colors duration-300`}>
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-full ${isNightMode ? 'bg-blue-900/40 border-slate-800' : 'bg-blue-100 border-white shadow-md'} border-4 flex items-center justify-center overflow-hidden shrink-0 transition-colors`}>
            <User className={`w-10 h-10 ${isNightMode ? 'text-blue-400' : 'text-blue-500'}`} />
          </div>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>钓鱼佬_8899</h2>
            <p className={`text-sm mt-1 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>ID: 8848233</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${isNightMode ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                <Star className="w-3 h-3 fill-current" />
                <span>黑坑达人</span>
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${isNightMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                <Leaf className="w-3 h-3 fill-current" />
                <span>环保卫士</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setIsNightMode(!isNightMode)}
              className={`p-2 rounded-full transition-colors ${isNightMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {isNightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button className={`p-2 transition-colors ${isNightMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-8 px-2">
          <div className="flex flex-col items-center">
            <span className={`text-xl font-bold ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>128</span>
            <span className={`text-xs mt-1 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>关注</span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-xl font-bold ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>3.2w</span>
            <span className={`text-xs mt-1 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>粉丝</span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-xl font-bold ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>15.6w</span>
            <span className={`text-xs mt-1 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>获赞与收藏</span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-xl font-bold ${isNightMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{totalEsgPoints}</span>
            <span className={`text-xs mt-1 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>环保积分</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* ESG Feature Card */}
        <div className={`${isNightMode ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-800/50' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 shadow-sm'} rounded-2xl border overflow-hidden transition-colors`}>
          <div 
            className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${isNightMode ? 'hover:bg-emerald-900/40' : 'hover:bg-emerald-100/50'}`}
            onClick={() => setShowESG(!showESG)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isNightMode ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                <Leaf className={`w-5 h-5 ${isNightMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <div>
                <h3 className={`text-base font-bold ${isNightMode ? 'text-emerald-100' : 'text-emerald-900'}`}>环保钓鱼 (ESG)</h3>
                <p className={`text-xs mt-0.5 ${isNightMode ? 'text-emerald-400/80' : 'text-emerald-600/80'}`}>带走垃圾，赚取商城积分</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 transition-transform ${isNightMode ? 'text-emerald-500' : 'text-emerald-400'} ${showESG ? 'rotate-90' : ''}`} />
          </div>

          {/* ESG Expanded Content */}
          {showESG && (
            <div className={`px-5 pb-5 border-t pt-4 backdrop-blur-sm transition-colors ${isNightMode ? 'border-emerald-800/50 bg-slate-900/60' : 'border-emerald-100/50 bg-white/60'}`}>
              <div className={`mb-4 p-3 rounded-xl border ${isNightMode ? 'bg-emerald-900/30 border-emerald-800/50' : 'bg-emerald-100/50 border-emerald-200/50'}`}>
                <p className={`text-xs leading-relaxed ${isNightMode ? 'text-emerald-200' : 'text-emerald-800'}`}>
                  <span className="font-bold">玩法说明：</span>作钓结束后，拍下您清理钓位垃圾的照片上传。AI将进行评分并奖励环保积分。满10000积分可提现0.1元，或在商城兑换购物金。
                </p>
              </div>

              {/* Withdrawal Section */}
              <div className={`mb-4 flex items-center justify-between p-3 rounded-xl border shadow-sm ${isNightMode ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100'}`}>
                <div>
                  <div className={`text-sm font-bold ${isNightMode ? 'text-emerald-300' : 'text-emerald-800'}`}>当前积分: {totalEsgPoints}</div>
                  <div className={`text-xs mt-0.5 ${isNightMode ? 'text-emerald-500' : 'text-emerald-600'}`}>满10000积分可提现0.1元</div>
                </div>
                <button 
                  onClick={handleWithdraw}
                  disabled={totalEsgPoints < 10000}
                  className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm ${isNightMode ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300'} disabled:cursor-not-allowed`}
                >
                  提现0.1元
                </button>
              </div>

              {!esgPreview ? (
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${isNightMode ? 'border-emerald-700/50 bg-emerald-900/20 hover:bg-emerald-900/30' : 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className={`w-8 h-8 mb-2 ${isNightMode ? 'text-emerald-500' : 'text-emerald-400'}`} />
                    <p className={`mb-1 text-sm ${isNightMode ? 'text-emerald-400' : 'text-emerald-600'}`}><span className="font-semibold">点击拍照</span> 上传清理垃圾照片</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleEsgImageUpload} />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className={`relative rounded-2xl overflow-hidden border aspect-video flex items-center justify-center ${isNightMode ? 'border-emerald-800 bg-slate-800' : 'border-emerald-200 bg-slate-100'}`}>
                    <img src={esgPreview} alt="垃圾清理照片" className="max-h-full max-w-full object-contain" />
                    <button 
                      onClick={() => { setEsgPreview(null); setEsgImage(null); setEsgResult(null); }}
                      className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors"
                    >
                      重新上传
                    </button>
                  </div>
                  
                  {!esgResult ? (
                    <button
                      onClick={analyzeEsgImage}
                      disabled={isAnalyzingEsg}
                      className={`w-full py-3 px-4 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2 ${isNightMode ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'}`}
                    >
                      {isAnalyzingEsg ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          AI正在评估您的环保贡献...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          提交AI评分
                        </>
                      )}
                    </button>
                  ) : (
                    <div className={`p-4 rounded-xl border shadow-sm ${isNightMode ? 'bg-slate-800 border-emerald-800/50' : 'bg-white border-emerald-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`flex items-center gap-2 font-bold ${isNightMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          <CheckCircle2 className="w-5 h-5" />
                          评估完成
                        </div>
                        <div className={`text-2xl font-black ${isNightMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          +{esgResult.points} <span className={`text-sm font-medium ${isNightMode ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>积分</span>
                        </div>
                      </div>
                      <p className={`text-sm p-3 rounded-lg border ${isNightMode ? 'text-slate-300 bg-slate-900/50 border-slate-700' : 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                        {esgResult.comment}
                      </p>
                      <button 
                        onClick={() => { setEsgPreview(null); setEsgImage(null); setEsgResult(null); }}
                        className={`w-full mt-4 py-2 text-sm font-medium rounded-lg transition-colors ${isNightMode ? 'text-emerald-400 bg-emerald-900/30 hover:bg-emerald-900/50' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                      >
                        继续上传
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bait Library Card */}
        <div className={`${isNightMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-sm'} rounded-2xl overflow-hidden transition-colors`}>
          <div 
            className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${isNightMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
            onClick={() => setShowBaitLibrary(!showBaitLibrary)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isNightMode ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
                <PackagePlus className={`w-5 h-5 ${isNightMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h3 className={`text-base font-bold ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>我的饵料库</h3>
                <p className={`text-xs mt-0.5 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>当前库存: {inventory.length} 种</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 transition-transform ${isNightMode ? 'text-slate-500' : 'text-slate-400'} ${showBaitLibrary ? 'rotate-90' : ''}`} />
          </div>

          {/* Bait Library Expanded Content */}
          {showBaitLibrary && (
            <div className={`px-5 pb-5 border-t pt-4 transition-colors ${isNightMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newBait}
                  onChange={(e) => setNewBait(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBait()}
                  placeholder="输入饵料名称 (如: 蓝鲫)"
                  className={`flex-1 px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isNightMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                />
                <button 
                  onClick={handleAddBait}
                  className={`px-4 py-2 text-white text-sm rounded-xl font-medium transition-colors shrink-0 ${isNightMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  添加
                </button>
              </div>

              {inventory.length === 0 ? (
                <div className={`text-center py-6 text-sm ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>空空如也，快去进货吧！</div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {inventory.map((item, idx) => (
                    <li key={idx} className={`flex items-center justify-between px-4 py-3 rounded-xl border shadow-sm transition-colors ${isNightMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                      <span className={`font-medium text-sm ${isNightMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.name}</span>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center border rounded-lg overflow-hidden transition-colors ${isNightMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <button 
                            onClick={() => {
                              const newInv = [...inventory];
                              if (newInv[idx].quantity > 0) {
                                newInv[idx].quantity -= 1;
                                setInventory(newInv);
                              }
                            }}
                            className={`p-1.5 transition-colors ${isNightMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className={`w-8 text-center text-sm font-medium ${isNightMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => {
                              const newInv = [...inventory];
                              newInv[idx].quantity += 1;
                              setInventory(newInv);
                            }}
                            className={`p-1.5 transition-colors ${isNightMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button 
                          onClick={() => setInventory(inventory.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-500 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* My Orders */}
        <div className={`${isNightMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-sm'} rounded-2xl p-5 transition-colors`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base font-bold ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>我的订单</h3>
            <span className={`text-xs flex items-center cursor-pointer transition-colors ${isNightMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
              全部订单 <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${isNightMode ? 'bg-slate-800 group-hover:bg-blue-900/40' : 'bg-slate-50 group-hover:bg-blue-50'}`}>
                <CreditCard className={`w-5 h-5 transition-colors ${isNightMode ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-600 group-hover:text-blue-600'}`} />
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 ${isNightMode ? 'border-slate-900' : 'border-white'}`}>1</span>
              </div>
              <span className={`text-xs font-medium ${isNightMode ? 'text-slate-400' : 'text-slate-600'}`}>待付款</span>
            </div>
            <div className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isNightMode ? 'bg-slate-800 group-hover:bg-blue-900/40' : 'bg-slate-50 group-hover:bg-blue-50'}`}>
                <ShoppingBag className={`w-5 h-5 transition-colors ${isNightMode ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-600 group-hover:text-blue-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isNightMode ? 'text-slate-400' : 'text-slate-600'}`}>待发货</span>
            </div>
            <div className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${isNightMode ? 'bg-slate-800 group-hover:bg-blue-900/40' : 'bg-slate-50 group-hover:bg-blue-50'}`}>
                <Truck className={`w-5 h-5 transition-colors ${isNightMode ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-600 group-hover:text-blue-600'}`} />
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 ${isNightMode ? 'border-slate-900' : 'border-white'}`}>2</span>
              </div>
              <span className={`text-xs font-medium ${isNightMode ? 'text-slate-400' : 'text-slate-600'}`}>待收货</span>
            </div>
            <div className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isNightMode ? 'bg-slate-800 group-hover:bg-blue-900/40' : 'bg-slate-50 group-hover:bg-blue-50'}`}>
                <HeadphonesIcon className={`w-5 h-5 transition-colors ${isNightMode ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-600 group-hover:text-blue-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isNightMode ? 'text-slate-400' : 'text-slate-600'}`}>退款/售后</span>
            </div>
          </div>
        </div>

        {/* Tools & Services */}
        <div className={`${isNightMode ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-sm'} rounded-2xl overflow-hidden transition-colors`}>
          <div className={`px-5 py-4 border-b ${isNightMode ? 'border-slate-800' : 'border-slate-50'}`}>
            <h3 className={`text-base font-bold ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>常用功能</h3>
          </div>
          <div className={`divide-y ${isNightMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
            <div className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${isNightMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-500" />
                <span className={`text-sm font-medium ${isNightMode ? 'text-slate-300' : 'text-slate-700'}`}>我的收藏</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
            <div className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${isNightMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span className={`text-sm font-medium ${isNightMode ? 'text-slate-300' : 'text-slate-700'}`}>钓点足迹</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
            <div className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${isNightMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className={`text-sm font-medium ${isNightMode ? 'text-slate-300' : 'text-slate-700'}`}>浏览历史</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
            <div className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${isNightMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <HeadphonesIcon className="w-5 h-5 text-blue-500" />
                <span className={`text-sm font-medium ${isNightMode ? 'text-slate-300' : 'text-slate-700'}`}>联系客服</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
