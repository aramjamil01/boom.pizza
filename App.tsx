
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, push } from 'firebase/database';
import { 
  LayoutDashboard, 
  Utensils, 
  ShoppingCart, 
  ChefHat, 
  Sparkles,
  Menu as MenuIcon,
  Plus,
  Trash2,
  Clock,
  Users,
  DollarSign,
  X,
  Image as ImageIcon,
  Save,
  AlertCircle,
  AlertTriangle,
  Lock,
  Unlock,
  LogOut,
  MonitorCheck,
  CheckCircle,
  Settings,
  LayoutGrid,
  ChevronRight,
  Search
} from 'lucide-react';
import { ViewState, MenuItem, Order, OrderStatus, Table } from './types';
import { INITIAL_MENU, TABLES } from './constants';
import { suggestNewDish } from './services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Firebase Setup (Using User's Config) ---
const firebaseConfig = {
    apiKey: "AIzaSyDqoOjm4m1Fxp760mJPy0sv5_NjaJfkm7g",
    authDomain: "boompizza-5d048.firebaseapp.com",
    databaseURL: "https://boompizza-5d048-default-rtdb.firebaseio.com",
    projectId: "boompizza-5d048",
    storageBucket: "boompizza-5d048.firebasestorage.app",
    messagingSenderId: "636068289590",
    appId: "1:636068289590:web:41fe758906140c700ecc97"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Sub-Components ---

const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200`}>
        <ImageIcon size={20} strokeWidth={1.5} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
};

// --- Advanced Management System (The Admin-Only Interface) ---

const AdvancedManagementSystem = ({ onExit }: { onExit: () => void }) => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('restaurant_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>(TABLES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({ name: '', category: 'خواردنی سەرەکی', price: '', description: '', image: '' });
  
  // AI Helper state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [ingredients, setIngredients] = useState('');

  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    return onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({
          ...val,
          id: id,
          status: val.status || OrderStatus.PENDING,
          createdAt: new Date(val.time || Date.now())
        }));
        setOrders(list.reverse());
      }
    });
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, curr) => acc + (parseFloat(curr.total?.toString().replace(/,/g, '')) || 0), 0);
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.COOKING).length;
    return { totalRevenue, pendingOrders };
  }, [orders]);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    update(ref(db, `orders/${orderId}`), { status: newStatus });
  };

  const handleAiSuggest = async () => {
    if (!ingredients) return;
    setAiLoading(true);
    const result = await suggestNewDish(ingredients);
    setAiResult(result);
    setAiLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex bg-gray-50 text-gray-900 animate-in fade-in duration-300 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-l h-screen flex flex-col shadow-2xl z-10">
        <div className="p-8 border-b flex items-center gap-4">
          <div className="bg-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-100 transform -rotate-6">
            <Utensils className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">بەڕێوەبردن</h1>
            <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Advanced System</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'داشبۆرد' },
            { id: 'kitchen', icon: ChefHat, label: 'چێشتخانە' },
            { id: 'menu', icon: MenuIcon, label: 'مینیو' },
            { id: 'ai-helper', icon: Sparkles, label: 'Gemini AI', special: true },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setCurrentView(item.id as ViewState)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold transition-all duration-300 transform active:scale-95 ${
                currentView === item.id 
                  ? (item.special ? 'bg-purple-600 text-white shadow-xl shadow-purple-100 scale-[1.02]' : 'bg-orange-600 text-white shadow-xl shadow-orange-100 scale-[1.02]') 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} strokeWidth={2.5} />
                <span>{item.label}</span>
              </div>
              <ChevronRight size={14} className={currentView === item.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </nav>

        <div className="p-6 border-t bg-gray-50/50">
          <button onClick={onExit} className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl font-bold bg-white text-red-600 border border-red-100 hover:bg-red-50 transition-all shadow-sm">
            <LogOut size={20} />
            <span>گەڕانەوە بۆ وێب</span>
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 h-screen overflow-y-auto p-12 bg-gray-50/50 custom-scrollbar">
        <header className="mb-12 flex justify-between items-end">
          <div className="animate-in slide-in-from-top-4 duration-500">
            <h2 className="text-5xl font-black text-gray-900 tracking-tight mb-2">
              {currentView === 'dashboard' && 'داشبۆرد'}
              {currentView === 'kitchen' && 'چێشتخانە'}
              {currentView === 'menu' && 'مینیو'}
              {currentView === 'ai-helper' && 'Gemini AI'}
            </h2>
            <p className="text-gray-400 font-medium text-lg">بەڕێوەبردنی گشتی لقی سەرەکی</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-4 px-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-right">
              <div className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Administrator</div>
              <div className="text-lg font-bold text-gray-800">ئارام ئەحمەد</div>
            </div>
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 border-2 border-orange-100 shadow-inner">
               <Unlock size={24} />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {currentView === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-xl transition-all">
                  <div className="p-5 bg-green-100 text-green-600 rounded-[1.5rem] group-hover:scale-110 transition-transform"><DollarSign size={32} /></div>
                  <div>
                    <div className="text-gray-500 text-sm font-bold mb-1">کۆی داهاتی فرۆش</div>
                    <div className="text-3xl font-black">{stats.totalRevenue.toLocaleString()} د.ع</div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-xl transition-all">
                  <div className="p-5 bg-blue-100 text-blue-600 rounded-[1.5rem] group-hover:scale-110 transition-transform"><ShoppingCart size={32} /></div>
                  <div>
                    <div className="text-gray-500 text-sm font-bold mb-1">داواکارییە چالاکەکان</div>
                    <div className="text-3xl font-black">{stats.pendingOrders}</div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-xl transition-all">
                  <div className="p-5 bg-purple-100 text-purple-600 rounded-[1.5rem] group-hover:scale-110 transition-transform"><Users size={32} /></div>
                  <div>
                    <div className="text-gray-500 text-sm font-bold mb-1">مێزە بەردەستەکان</div>
                    <div className="text-3xl font-black">{tables.filter(t => t.status === 'available').length} / {tables.length}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 h-[450px]">
                  <h3 className="font-black text-xl mb-8 flex items-center gap-3"><MonitorCheck className="text-orange-500" /> هێڵکاری فرۆش</h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={orders.slice(0, 10).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="orderID" hide />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke="#ea580c" strokeWidth={4} dot={{fill: '#ea580c', r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
                  <h3 className="font-black text-xl mb-8 flex items-center gap-3"><Clock className="text-orange-500" /> دوایین داواکارییەکان</h3>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex justify-between items-center p-5 bg-gray-50 hover:bg-orange-50/50 rounded-2xl transition-all border border-transparent hover:border-orange-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-orange-600 shadow-sm border border-gray-100">#{o.orderID}</div>
                          <div>
                            <div className="font-bold text-gray-800 truncate max-w-[200px]">{o.items}</div>
                            <div className="text-xs text-gray-400 font-medium">{o.time}</div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-black text-gray-900">{o.total} د.ع</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'kitchen' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {orders.filter(o => o.status !== OrderStatus.PAID).map(order => (
                <div key={order.id} className={`bg-white rounded-[2rem] border-t-8 shadow-sm overflow-hidden transition-all hover:shadow-xl ${
                  order.status === OrderStatus.PENDING ? 'border-orange-500' : 'border-blue-500'
                }`}>
                  <div className="p-6 border-b flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-xl text-gray-800">داواکاری #{order.orderID}</h4>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.time}</div>
                    </div>
                  </div>
                  <div className="p-8 min-h-[150px] space-y-3">
                    <p className="font-bold text-gray-700 leading-relaxed text-lg">{order.items}</p>
                    {order.note && <div className="mt-4 p-4 bg-orange-50 rounded-xl text-xs text-orange-700 font-bold border border-orange-100">تێبینی: {order.note}</div>}
                  </div>
                  <div className="p-6 bg-gray-50/80 flex gap-3">
                    {order.status === OrderStatus.PENDING ? (
                      <button onClick={() => handleUpdateStatus(order.id, OrderStatus.COOKING)} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all">دەستپێکردن</button>
                    ) : (
                      <button onClick={() => handleUpdateStatus(order.id, OrderStatus.PAID)} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-green-100 hover:bg-green-700 transition-all">تەواوبوو</button>
                    )}
                  </div>
                </div>
              ))}
              {orders.filter(o => o.status !== OrderStatus.PAID).length === 0 && (
                <div className="col-span-full py-32 text-center text-gray-300 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center gap-6">
                  <ChefHat size={80} strokeWidth={1} className="opacity-20" />
                  <p className="text-2xl font-bold">هیچ خواردنێک لە چاوەڕوانیدا نییە</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'menu' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 mb-1">بەڕێوەبردنی مینیو</h2>
                  <p className="text-gray-400 font-medium">دەتوانیت خواردنی نوێ زیاد بکەیت یان بسڕیتەوە</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-3 bg-orange-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all hover:-translate-y-1 active:translate-y-0">
                  <Plus size={24} /> خواردنی نوێ
                </button>
              </div>

              <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-8 font-black text-gray-500 uppercase text-xs tracking-widest">خواردن</th>
                      <th className="p-8 font-black text-gray-500 uppercase text-xs tracking-widest">پۆلێن</th>
                      <th className="p-8 font-black text-gray-500 uppercase text-xs tracking-widest">نرخ</th>
                      <th className="p-8 font-black text-gray-500 uppercase text-xs tracking-widest text-center">کردار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {menuItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="p-8 flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                            <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-xl">{item.name}</div>
                            <div className="text-sm text-gray-400 font-medium line-clamp-1 max-w-sm">{item.description}</div>
                          </div>
                        </td>
                        <td className="p-8">
                          <span className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-xs font-black">{item.category}</span>
                        </td>
                        <td className="p-8 font-black text-gray-900 text-lg">{item.price.toLocaleString()} د.ع</td>
                        <td className="p-8 text-center">
                          <button onClick={() => setItemToDelete(item)} className="text-red-300 p-4 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all">
                            <Trash2 size={24} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === 'ai-helper' && (
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-purple-50 animate-bounce">
                  <Sparkles size={48} />
                </div>
                <h2 className="text-5xl font-black text-gray-900 tracking-tight">Gemini AI Helper</h2>
                <p className="text-gray-400 text-xl font-medium">پێشنیاری خواردنی نوێ وەربگرە لە ڕێگەی زیرەکی دەستکردەوە</p>
              </div>

              <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-purple-100/50 border border-purple-100 space-y-10">
                <div className="space-y-4">
                  <label className="font-black text-gray-700 text-xl px-4">کەرەستە خاوەکانت بنووسە:</label>
                  <textarea 
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="بۆ نموونە: مریشک، قارچک، پەنیری مۆزاریلا..."
                    className="w-full p-8 rounded-[2.5rem] bg-gray-50 border-2 border-transparent focus:border-purple-400 focus:bg-white outline-none min-h-[180px] resize-none transition-all text-xl font-medium"
                  />
                </div>
                <button 
                  onClick={handleAiSuggest} 
                  disabled={aiLoading} 
                  className="w-full py-6 bg-purple-600 text-white rounded-[2rem] font-black text-2xl flex items-center justify-center gap-4 disabled:opacity-50 hover:bg-purple-700 transition-all shadow-2xl shadow-purple-200 transform active:scale-[0.98]"
                >
                  {aiLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>خەریکی بیرکردنەوەم...</span>
                    </div>
                  ) : (
                    <><Sparkles size={28} /> پێشنیارم بۆ بکە</>
                  )}
                </button>

                {aiResult && (
                  <div className="mt-12 p-10 bg-purple-50/50 rounded-[3rem] border-2 border-purple-100 animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-between items-start mb-8">
                      <h3 className="text-3xl font-black text-purple-900">{aiResult.name}</h3>
                      <span className="bg-white px-8 py-3 rounded-2xl text-purple-600 font-black border border-purple-200 shadow-sm text-xl">{aiResult.price.toLocaleString()} د.ع</span>
                    </div>
                    <p className="text-purple-800 leading-loose text-xl mb-10 font-medium">{aiResult.description}</p>
                    <button 
                      onClick={() => {
                        const newItem: MenuItem = {
                          id: Date.now().toString(),
                          name: aiResult.name,
                          category: 'خواردنی AI',
                          price: aiResult.price,
                          description: aiResult.description,
                          image: `https://picsum.photos/seed/${aiResult.name}/400/300`
                        };
                        setMenuItems([...menuItems, newItem]);
                        alert('زیادکرا بۆ مینیو!');
                        setAiResult(null);
                      }}
                      className="px-12 py-5 bg-white text-purple-600 border-2 border-purple-200 rounded-2xl font-black text-xl hover:bg-purple-600 hover:text-white transition-all shadow-lg"
                    >
                      زیادکردن بۆ مینیوی فەرمی
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-12 rounded-[3.5rem] w-full max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><AlertTriangle size={48} /></div>
            <h3 className="text-3xl font-black text-gray-900 mb-4">سڕینەوەی خواردن</h3>
            <p className="text-gray-500 text-lg mb-10 font-medium">ئایا دڵنیایت لە سڕینەوەی <span className="text-gray-900 font-black">"{itemToDelete.name}"</span>؟</p>
            <div className="flex gap-4">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-2xl font-black text-lg hover:bg-gray-200 transition-all">نەخێر</button>
              <button onClick={() => {
                setMenuItems(menuItems.filter(m => m.id !== itemToDelete.id));
                setItemToDelete(null);
              }} className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-100 hover:bg-red-700 transition-all">بەڵێ، بیسرەوە</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Boom's Pizza Components ---

const App = () => {
    const [view, setView] = useState('menu');
    const [activeCategory, setActiveCategory] = useState('');
    const [allMenuItems, setAllMenuItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [cart, setCart] = useState<any>({});
    const [orderNote, setOrderNote] = useState('');
    const [manualAddress, setManualAddress] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [showManualInput, setShowManualInput] = useState(false);
    
    // Management System State
    const [showAdvancedSystem, setShowAdvancedSystem] = useState(false);

    useEffect(() => {
        onValue(ref(db, 'categories'), (snap) => {
            const data = snap.val();
            const list = data ? Object.entries(data).map(([id, val]: any) => ({ ...val, id })) : [];
            setCategories(list);
            if (list.length > 0 && !activeCategory) setActiveCategory(list[0].id);
        });
        onValue(ref(db, 'menu_items'), (snapshot) => {
            const data = snapshot.val();
            setAllMenuItems(data ? Object.entries(data).map(([id, val]: any) => ({ ...val, id })) : []);
        });
    }, [activeCategory]);

    const filteredMenuItems = useMemo(() => allMenuItems.filter(item => item.category === activeCategory), [allMenuItems, activeCategory]);
    const totalAmount = Object.values(cart).reduce((acc: number, curr: any) => acc + (curr.price * curr.qty), 0);

    const handleAdminAccess = () => {
        const pw = prompt("کۆدی ئەدمین بنووسە:");
        if (pw === "1998a") setView('admin');
        else if (pw !== null) alert("کۆدەکە هەڵەیە!");
    };

    const handleSendOrder = async () => {
        if (Object.keys(cart).length === 0) return alert("سەبەتەکەت بەتاڵە!");
        setIsSending(true);
        const orderID = Math.floor(1000 + Math.random() * 9000);
        const itemsStr = Object.values(cart).map((i: any) => `${i.qty}x ${i.name}`).join(", ");
        const orderData = { 
            orderID, 
            items: itemsStr, 
            total: totalAmount.toLocaleString(), 
            location: "لە ڕێگەی GPS", 
            note: orderNote, 
            status: OrderStatus.PENDING,
            time: new Date().toLocaleString('ku-IQ') 
        };
        try {
            await set(ref(db, `orders/${orderID}`), orderData);
            setLastOrder(orderData);
            setCart({});
            setOrderNote('');
            setIsSending(false);
        } catch (e) { alert("هەڵە ڕوویدا"); setIsSending(false); }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-24 relative overflow-x-hidden selection:bg-[#ff3131] selection:text-white">
            {showAdvancedSystem && <AdvancedManagementSystem onExit={() => setShowAdvancedSystem(false)} />}
            
            <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-around h-20 px-4">
                <button onClick={() => setView('menu')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${view === 'menu' ? 'text-[#ff3131] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    <LayoutGrid size={22} strokeWidth={2.5} /><span className="text-[10px] font-black uppercase tracking-widest">مێنۆ</span>
                </button>
                <div className="w-px h-8 bg-zinc-800/50"></div>
                <button onClick={handleAdminAccess} className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${view === 'admin' ? 'text-[#ff3131] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    <Settings size={22} strokeWidth={2.5} /><span className="text-[10px] font-black uppercase tracking-widest">دەستکاری</span>
                </button>
            </nav>

            {view === 'menu' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <header className="relative h-64 flex items-center justify-center overflow-hidden border-b-[6px] border-[#ff3131] shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1470&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover brightness-[0.2] scale-110" alt="banner" />
                        <div className="relative z-10 text-center space-y-2">
                            <h1 className="text-7xl font-black text-[#ffc107] drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] tracking-tighter">BOOM'S PIZZA</h1>
                            <div className="h-1 w-32 bg-[#ff3131] mx-auto rounded-full"></div>
                            <p className="text-white font-black mt-4 text-xl tracking-wide">چێژێکی بێ وێنە لەگەڵ بوم پیتزا</p>
                        </div>
                    </header>

                    <div className="flex overflow-x-auto p-6 gap-6 no-scrollbar bg-zinc-900/30 backdrop-blur-sm sticky top-20 z-40">
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex flex-col items-center min-w-[90px] transition-all duration-500 active:scale-90 ${activeCategory === cat.id ? 'scale-110 translate-y-[-5px]' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}>
                                <div className={`w-20 h-20 rounded-full overflow-hidden border-4 mb-3 transition-all duration-500 ${activeCategory === cat.id ? 'border-[#ff3131] shadow-[0_0_25px_rgba(255,49,49,0.6)]' : 'border-zinc-800'}`}>
                                    <img src={cat.img || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt={cat.name} />
                                </div>
                                <span className={`text-xs font-black tracking-tighter uppercase ${activeCategory === cat.id ? 'text-[#ff3131]' : 'text-zinc-500'}`}>{cat.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
                        {filteredMenuItems.map(item => (
                            <div key={item.id} className="group bg-zinc-900/50 rounded-[2rem] overflow-hidden border border-zinc-800/50 flex flex-col shadow-xl hover:shadow-[#ff3131]/5 transition-all duration-500 hover:translate-y-[-8px]">
                                <div className="relative h-44 overflow-hidden">
                                    <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>
                                <div className="p-5 text-center flex-grow flex flex-col justify-center gap-2">
                                    <h3 className="font-black text-lg text-white group-hover:text-[#ffc107] transition-colors line-clamp-1">{item.name}</h3>
                                    <span className="text-[#ff3131] font-black text-xl tracking-tight">{item.price.toLocaleString()} د.ع</span>
                                </div>
                                <button onClick={() => setCart((p:any) => ({...p, [item.name]: {name: item.name, price: item.price, qty: (p[item.name]?.qty || 0) + 1}}))} className="w-full bg-[#ff3131] hover:bg-red-700 text-white py-5 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <Plus size={16} strokeWidth={3} /> زیادکردن
                                </button>
                            </div>
                        ))}
                    </div>

                    {Object.keys(cart).length > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 animate-in slide-in-from-bottom-10 duration-500">
                           <div className="bg-zinc-900 border-2 border-[#ff3131] rounded-[2.5rem] p-6 shadow-2xl shadow-black/50">
                              <div className="flex justify-between items-center mb-6">
                                 <span className="text-zinc-400 font-black text-xs uppercase tracking-widest">کۆی گشتی:</span>
                                 <span className="text-3xl font-black text-white">{totalAmount.toLocaleString()} د.ع</span>
                              </div>
                              <button onClick={handleSendOrder} className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                 ✅ ناردنی داواکاری
                              </button>
                           </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-8 max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
                    <div className="bg-orange-500/5 p-12 rounded-[4rem] border-2 border-orange-500/20 text-center space-y-8 shadow-2xl">
                        <div className="w-28 h-28 bg-orange-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/20 rotate-3">
                            <MonitorCheck size={56} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black text-white tracking-tight">سیستەمی بەڕێوەبردن</h3>
                            <p className="text-zinc-400 text-xl font-medium leading-relaxed max-w-lg mx-auto">
                                دەتوانیت لێرەوە چاودێری فرۆش، چێشتخانە و مینیوی فەرمی بکەیت. ئەم پانێڵە تەنها بۆ خاوەنکارە.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowAdvancedSystem(true)} 
                            className="bg-orange-600 text-white px-14 py-6 rounded-[2rem] font-black text-2xl shadow-2xl shadow-orange-600/20 hover:bg-orange-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 mx-auto"
                        >
                           <Unlock size={28} /> چوونەژوورەوە
                        </button>
                    </div>
                    
                    <div className="text-center space-y-2 opacity-30">
                        <p className="font-bold text-zinc-500 uppercase tracking-widest text-xs">Boom Pizza Enterprise Edition</p>
                        <p className="text-[10px] text-zinc-600">v3.0.4 • Powered by Gemini AI</p>
                    </div>
                </div>
            )}
            
            {lastOrder && (
                <div className="fixed inset-0 z-[8000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white text-black w-full max-w-sm rounded-[3.5rem] p-10 relative shadow-2xl border-b-[8px] border-green-500 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
                                <CheckCircle size={48} strokeWidth={3} />
                            </div>
                            <div className="text-center">
                                <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase">سەرکەوتوو بوو!</h2>
                                <p className="text-gray-400 font-bold">داواکارییەکەت گەیشتە چێشتخانە</p>
                            </div>
                            <div className="w-full border-t border-dashed py-8 space-y-4 font-black">
                                <div className="flex justify-between items-center"><span className="text-gray-400 text-xs">کۆد:</span><span className="text-xl">#{lastOrder.orderID}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-400 text-xs">کۆی گشتی:</span><span className="text-xl text-green-600">{lastOrder.total} د.ع</span></div>
                            </div>
                            <button onClick={() => setLastOrder(null)} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all">گەڕانەوە</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
