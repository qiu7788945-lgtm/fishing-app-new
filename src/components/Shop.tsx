import React, { useState } from 'react';
import { Search, ShoppingCart, Star, Truck, Store, MapPin, Tag, Filter, ChevronDown, Sparkles, CheckCircle2 } from 'lucide-react';

// The CSV data provided by the user
const RAW_PRODUCTS = [
  {
    id: 'LG918YZP',
    name: '老鬼九一八野战篇',
    category: '综合饵',
    spec: '300g / 包',
    price: 12.50,
    scene: '野钓、湖库、江河',
    fish: '鲫鱼、鲤鱼、草鱼、鳊鱼',
    stock: 1000,
    desc: '经典综合饵，比重轻，雾化好，入口性佳，可单开或搭配其他饵料，野钓通杀',
    image: 'https://picsum.photos/seed/bait1/400/400'
  },
  {
    id: 'LGSG2H-NX',
    name: '老鬼速攻 2 号（奶香）',
    category: '鲫鱼饵',
    spec: '240g / 包',
    price: 10.00,
    scene: '野钓、黑坑、竞技',
    fish: '鲫鱼',
    stock: 800,
    desc: '奶香浓郁，状态柔软，适合钓轻口鲫鱼，可作为状态饵搭配九一八、蓝鲫使用',
    image: 'https://picsum.photos/seed/bait2/400/400'
  },
  {
    id: 'LGLK2H-NX',
    name: '老鬼螺鲤 2 号（浓腥）',
    category: '鲤鱼饵',
    spec: '340g / 包',
    price: 15.00,
    scene: '黑坑、湖库、野钓大水面',
    fish: '鲤鱼、青鱼',
    stock: 600,
    desc: '螺肉腥香，主攻大个体鲤鱼，水温低时效果佳，需提前泡开',
    image: 'https://picsum.photos/seed/bait3/400/400'
  },
  {
    id: 'LGKDCY',
    name: '老鬼狂钓草鱼',
    category: '草鱼饵',
    spec: '400g / 包',
    price: 18.00,
    scene: '野钓、湖库、黑坑',
    fish: '草鱼、鳊鱼',
    stock: 450,
    desc: '果酸 + 草香复合味型，雾化快留鱼久，针对草鱼开口差，可搓可拉',
    image: 'https://picsum.photos/seed/bait4/400/400'
  },
  {
    id: 'LG918XB',
    name: '老鬼九一八腥版',
    category: '综合饵',
    spec: '300g / 包',
    price: 12.50,
    scene: '野钓、江河、冬季钓',
    fish: '鲫鱼、鲤鱼、翘嘴',
    stock: 900,
    desc: '腥香浓郁，比重适中，适合低温季节野钓，诱鱼快，适合搭配速攻使用',
    image: 'https://picsum.photos/seed/bait5/400/400'
  },
  {
    id: 'LGLK1H',
    name: '老鬼螺鲤 1 号（本味）',
    category: '鲤鱼饵',
    spec: '340g / 包',
    price: 15.00,
    scene: '黑坑、湖库、夏季钓',
    fish: '鲤鱼',
    stock: 550,
    desc: '螺香本味，清淡不闹小杂鱼，主攻滑口大鲤鱼，适合水温高时使用',
    image: 'https://picsum.photos/seed/bait6/400/400'
  },
  {
    id: 'LGSG3H',
    name: '老鬼速攻 3 号（腥香）',
    category: '鲫鱼饵',
    spec: '200g / 包',
    price: 9.50,
    scene: '野钓、冬季、低温水域',
    fish: '鲫鱼、白条',
    stock: 700,
    desc: '浓腥型，比重轻，适合冬季轻口鲫鱼，拉饵状态好，入口率高',
    image: 'https://picsum.photos/seed/bait7/400/400'
  }
];

const STORES = [
  { name: '老李渔具店', type: '实体店', delivery: true, shipping: false },
  { name: '海明威钓具行', type: '实体店', delivery: true, shipping: false },
  { name: '淘宝-老鬼官方旗舰店', type: '电商', delivery: false, shipping: true },
  { name: '大鲫大鲤渔具', type: '实体店', delivery: true, shipping: false },
];

// Assign random stores to products
const PRODUCTS = RAW_PRODUCTS.map(product => {
  // Always include the official store
  const officialStore = STORES.find(s => s.name.includes('老鬼'));
  const offlineStores = STORES.filter(s => !s.name.includes('老鬼'));
  
  // Randomly pick 1-2 offline stores
  const numOffline = Math.floor(Math.random() * 2) + 1;
  const shuffledOffline = [...offlineStores].sort(() => 0.5 - Math.random());
  
  // Combine official store with selected offline stores
  const selectedStores = [officialStore, ...shuffledOffline.slice(0, numOffline)].filter(Boolean);

  const productStores = selectedStores.map(store => {
    // Randomize price slightly around the base price
    const priceVariation = (Math.random() * 2 - 1); // -1 to +1
    const finalPrice = Math.max(0.1, product.price + priceVariation).toFixed(2);
    return {
      ...store,
      price: parseFloat(finalPrice)
    };
  });

  // Sort by price to find the lowest
  productStores.sort((a, b) => a.price - b.price);

  return {
    ...product,
    stores: productStores,
    lowestPrice: productStores[0].price
  };
});

const CATEGORIES = ['全部', '综合饵', '鲫鱼饵', '鲤鱼饵', '草鱼饵'];

interface ShopProps {
  totalEsgPoints: number;
  setTotalEsgPoints: React.Dispatch<React.SetStateAction<number>>;
}

export default function Shop({ totalEsgPoints, setTotalEsgPoints }: ShopProps) {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRedeem = () => {
    if (totalEsgPoints >= 10000) {
      setTotalEsgPoints(prev => prev - 10000);
      showToast('兑换成功！0.1元购物金已发放到您的账户。');
    }
  };

  const filteredProducts = PRODUCTS.filter(p => {
    const matchCategory = activeCategory === '全部' || p.category === activeCategory;
    const matchSearch = p.name.includes(searchQuery) || p.desc.includes(searchQuery) || p.fish.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  return (
    <div className="w-full max-w-md mx-auto pb-24 bg-slate-50 min-h-screen">
      {/* Header & Search */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Store className="w-6 h-6 text-blue-500" />
          渔具商城
        </h1>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索饵料、鱼竿、配件..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Points Redemption Banner */}
      <div className="px-4 mt-4">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-orange-900 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-orange-500" />
              环保积分兑换
            </h3>
            <p className="text-xs text-orange-700 mt-1">当前积分: <span className="font-bold text-orange-600">{totalEsgPoints}</span></p>
            <p className="text-[10px] text-orange-600/80 mt-0.5">10000积分 = 0.1元购物金</p>
          </div>
          <button
            onClick={handleRedeem}
            disabled={totalEsgPoints < 10000}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all shrink-0"
          >
            兑换0.1元
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="px-4 space-y-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-base leading-tight mb-1 truncate">{product.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{product.spec}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{product.category}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{product.desc}</p>
                
                <div className="flex items-end justify-between mt-auto">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-red-500 font-medium">¥</span>
                    <span className="text-lg font-bold text-red-500 leading-none">{product.lowestPrice.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 ml-1">起</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Listings */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> 推荐购买渠道
              </div>
              {product.stores.map((store, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm text-slate-800">{store.name}</span>
                      {idx === 0 && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded font-medium">全网最低</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {store.delivery && (
                        <span className="flex items-center gap-0.5 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                          <MapPin className="w-3 h-3" /> 同城外卖
                        </span>
                      )}
                      {store.shipping && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          <Truck className="w-3 h-3" /> 包邮
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-500">¥{store.price.toFixed(2)}</div>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>没有找到相关商品</p>
          </div>
        )}
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
