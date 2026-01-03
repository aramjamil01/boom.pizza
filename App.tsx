
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { db } from './services/firebase';
import Icon from './components/Icon';
import DigitalReceipt from './components/DigitalReceipt';
import LuckyWheel from './components/LuckyWheel';
import AdminPanel from './components/AdminPanel';
import { Category, MenuItem, Prize, CartItem, Order } from './types';

// Use React.FC to handle React-specific props like 'key' and ensure correct typing of the onAddToCart callback
const MenuItemCard: React.FC<{ item: MenuItem, onAddToCart: (item: MenuItem, size: string | null) => void }> = ({ item, onAddToCart }) => {
    const [selectedSize, setSelectedSize] = useState('M');

    const currentPrice = useMemo(() => {
        let p = item.price;
        if (item.category === 'pizza') {
            const offsetS = item.offsetS !== undefined ? item.offsetS : -2000;
            const offsetL = item.offsetL !== undefined ? item.offsetL : 3000;
            if (selectedSize === 'S') p += offsetS;
            if (selectedSize === 'L') p += offsetL;
        }
        return p - (item.discount || 0);
    }, [item.price, item.discount, item.category, selectedSize, item.offsetS, item.offsetL]);

    const sliderTransform = selectedSize === 'S' ? 'translateX(100%)' : selectedSize === 'M' ? 'translateX(0%)' : 'translateX(-100%)';

    return (
        <div className="bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col shadow-2xl group hover:border-red-500/30 transition-all duration-500">
            <div className="relative h-40 overflow-hidden">
                <img src={item.img || 'https://via.placeholder.com/150'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                {item.discount > 0 && <span className="absolute top-4 right-4 bg-[#ff3131] text-white text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg">Sale!</span>}
            </div>
            <div className="p-5 text-center flex-grow flex flex-col items-center">
                <h3 className="font-black text-sm text-white mb-2 line-clamp-1">{item.name}</h3>
                
                <div className="flex flex-col items-center mb-4 min-h-[40px] justify-center">
                    {item.discount > 0 ? (
                        <>
                            <span className="text-zinc-500 line-through text-[10px] font-bold">
                                {(item.price + (item.category === 'pizza' ? (selectedSize === 'L' ? (item.offsetL || 3000) : selectedSize === 'S' ? (item.offsetS || -2000) : 0) : 0)).toLocaleString()}
                            </span>
                            <span className="text-[#ffc107] font-black text-lg tracking-tighter transition-all duration-300 transform scale-110">
                                {currentPrice.toLocaleString()} <span className="text-[10px]">د.ع</span>
                            </span>
                        </>
                    ) : (
                        <span className="text-white font-black text-lg tracking-tighter transition-all duration-300">
                            {currentPrice.toLocaleString()} <span className="text-[10px] text-zinc-500 font-bold uppercase">د.ع</span>
                        </span>
                    )}
                </div>

                {item.category === 'pizza' && (
                    <div className="size-toggle-container mb-5 w-full max-w-[150px]">
                        <div className="size-slider" style={{ transform: sliderTransform }}></div>
                        <div onClick={() => setSelectedSize('L')} className={`size-option ${selectedSize === 'L' ? 'active' : 'inactive'}`}>L</div>
                        <div onClick={() => setSelectedSize('M')} className={`size-option ${selectedSize === 'M' ? 'active' : 'inactive'}`}>M</div>
                        <div onClick={() => setSelectedSize('S')} className={`size-option ${selectedSize === 'S' ? 'active' : 'inactive'}`}>S</div>
                    </div>
                )}
            </div>
            <button 
                onClick={() => onAddToCart(item, item.category === 'pizza' ? selectedSize : null)} 
                className="w-full bg-[#ff3131] hover:bg-red-700 text-white py-5 font-black text-[10px] flex items-center justify-center gap-3 transition-all uppercase tracking-widest shadow-xl shadow-red-500/10 active:scale-95"
            >
                <Icon name="ShoppingBag" size={16} strokeWidth={3} /> زیادکردن
            </button>
        </div>
    );
};

const App: React.FC = () => {
    const [view, setView] = useState<'menu' | 'admin'>('menu');
    const [activeCategory, setActiveCategory] = useState('');
    const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [wheelPrizes, setWheelPrizes] = useState<Prize[]>([]);
    const [cart, setCart] = useState<{ [key: string]: CartItem }>({});
    const [showWheel, setShowWheel] = useState(false);
    const [prizesWon, setPrizesWon] = useState<string[]>([]);
    const [orderNote, setOrderNote] = useState('');
    const [manualAddress, setManualAddress] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [lastOrder, setLastOrder] = useState<Order | null>(null);
    const [showManualInput, setShowManualInput] = useState(false);
    const [isCartBouncing, setIsCartBouncing] = useState(false);

    useEffect(() => {
        onValue(ref(db, 'categories'), (snap) => {
            const data = snap.val();
            const list = data ? Object.entries(data).map(([id, val]) => ({ ...(val as any), id })) : [];
            setCategories(list);
            if (list.length > 0 && !activeCategory) setActiveCategory(list[0].id);
        });
        onValue(ref(db, 'prizes'), (snap) => {
            const data = snap.val();
            setWheelPrizes(data ? Object.entries(data).map(([id, val]) => ({ ...(val as any), id })) : []);
        });
        onValue(ref(db, 'menu_items'), (snapshot) => {
            const data = snapshot.val();
            setAllMenuItems(data ? Object.entries(data).map(([id, val]) => ({ ...(val as any), id })) : []);
        });
    }, []);

    const filteredMenuItems = useMemo(() => {
        return allMenuItems.filter(item => item.category === activeCategory);
    }, [allMenuItems, activeCategory]);

    // addToCart is typed to allow size to be passed as string or null.
    const addToCart = (item: MenuItem, size: string | null = null) => {
        let basePrice = item.price;
        if (item.category === 'pizza' && size) {
            const offsetS = item.offsetS !== undefined ? item.offsetS : -2000;
            const offsetL = item.offsetL !== undefined ? item.offsetL : 3000;
            if (size === 'S') basePrice += offsetS;
            if (size === 'L') basePrice += offsetL;
        }

        const finalPrice = basePrice - (item.discount || 0);
        const displayName = size ? `${item.name} (${size})` : item.name;

        setCart(prev => {
            const existing = prev[displayName];
            return {
                ...prev,
                [displayName]: {
                    name: displayName,
                    price: finalPrice,
                    qty: (existing?.qty || 0) + 1,
                    size: size,
                    originalItem: item
                }
            };
        });

        setIsCartBouncing(true);
        setTimeout(() => setIsCartBouncing(false), 400);
    };

    const removeFromCart = (name: string) => {
        setCart(prev => {
            const existing = prev[name];
            if (!existing) return prev;
            if (existing.qty > 1) return { ...prev, [name]: { ...existing, qty: existing.qty - 1 } };
            const newCart = { ...prev };
            delete newCart[name];
            return newCart;
        });
    };

    const totalAmount = (Object.values(cart) as CartItem[]).reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

    const handleSendOrder = async () => {
        if (Object.keys(cart).length === 0) return alert("سەبەتەکەت بەتاڵە!");
        setIsSending(true);
        const orderID = Math.floor(1000 + Math.random() * 9000);
        const itemsStr = (Object.values(cart) as CartItem[]).map(i => `${i.qty}x ${i.name}`).join(", ");
        const prizeStr = prizesWon.length > 0 ? ` | 🎁 خەڵات: ${prizesWon.join(", ")}` : "";
        
        const orderData: Order = {
            orderID,
            items: itemsStr + prizeStr,
            total: totalAmount.toLocaleString(),
            location: "لۆکەیشنی نێردراو", // Simplified for this implementation
            note: orderNote,
            time: new Date().toLocaleString('ku-IQ'),
            status: 'pending'
        };

        try {
            await push(ref(db, 'orders'), orderData);
            setLastOrder(orderData);
            setCart({});
            setOrderNote('');
            setIsSending(false);
        } catch (e) {
            alert("هەڵە ڕوویدا لە ناردنی داواکارییەکە");
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-32">
            <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-around h-16">
                <button onClick={() => setView('menu')} className={`flex-1 flex flex-col items-center gap-1 transition-all ${view === 'menu' ? 'text-[#ff3131]' : 'text-zinc-500'}`}>
                    <Icon name="LayoutGrid" size={20} />
                    <span className="text-[10px] font-bold">مێنۆ</span>
                </button>
                <div className={`relative transition-transform duration-300 ${isCartBouncing ? 'scale-125' : 'scale-100'}`}>
                     <Icon name="ShoppingBag" className={view === 'menu' ? 'text-zinc-500' : 'text-zinc-500'} size={24} />
                     {Object.keys(cart).length > 0 && <span className="absolute -top-1 -right-1 bg-[#ff3131] text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-pulse shadow-lg">!</span>}
                </div>
                <button onClick={() => {
                    const pw = prompt("تکایە پاسوۆرد بنووسە:");
                    if (pw === "1998a") setView('admin');
                }} className={`flex-1 flex flex-col items-center gap-1 transition-all ${view === 'admin' ? 'text-[#ff3131]' : 'text-zinc-500'}`}>
                    <Icon name="Settings" size={20} />
                    <span className="text-[10px] font-bold">دەستکاری</span>
                </button>
            </nav>

            {view === 'menu' ? (
                <div className="animate-in fade-in duration-700">
                    <header className="relative h-64 flex items-center justify-center overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1470&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover brightness-[0.3] scale-105" />
                        <div className="relative z-10 text-center px-6">
                            <h1 className="text-6xl font-black text-[#ffc107] drop-shadow-2xl tracking-tighter mb-2">BOOM'S PIZZA</h1>
                            <div className="h-1 w-24 bg-[#ff3131] mx-auto rounded-full mb-4"></div>
                            <p className="text-white/80 font-bold text-lg">چێژێکی بێ وێنە لەگەڵ بوم پیتزا</p>
                        </div>
                    </header>

                    <div className="flex overflow-x-auto p-6 gap-6 no-scrollbar bg-black/20">
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex flex-col items-center min-w-[90px] transition-all active:scale-90 ${activeCategory === cat.id ? 'scale-110' : 'opacity-40 grayscale'}`}>
                                <div className={`w-20 h-20 rounded-[2rem] overflow-hidden border-2 mb-3 shadow-2xl transition-all ${activeCategory === cat.id ? 'border-[#ff3131] rotate-6 shadow-red-500/20' : 'border-white/5 grayscale'}`}>
                                    <img src={cat.img} className="w-full h-full object-cover" />
                                </div>
                                <span className={`text-[11px] font-black uppercase tracking-widest ${activeCategory === cat.id ? 'text-[#ff3131]' : 'text-white'}`}>{cat.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-5 p-5 max-w-4xl mx-auto">
                        {filteredMenuItems.map(item => (
                            <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} />
                        ))}
                    </div>

                    {Object.keys(cart).length > 0 && (
                        <div className="p-6 mx-5 mb-10 bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-3xl animate-in slide-in-from-bottom duration-500">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <Icon name="ShoppingCart" className="text-[#ffc107]" size={24} /> سەبەتەکەت
                                </h3>
                                <span className="bg-[#ff3131]/10 text-[#ff3131] text-[10px] font-black px-4 py-1 rounded-full border border-[#ff3131]/20 uppercase">{Object.keys(cart).length} Dishes</span>
                            </div>

                            <div className="space-y-4 mb-8">
                                {(Object.values(cart) as CartItem[]).map(item => (
                                    <div key={item.name} className="flex justify-between items-center text-sm bg-black/40 p-5 rounded-[2rem] border border-white/5 group hover:border-white/10 transition-all">
                                        <div>
                                            <p className="font-black text-white text-base mb-1">{item.name}</p>
                                            <p className="text-xs text-zinc-500 font-bold">{(item.price * item.qty).toLocaleString()} <span className="text-[10px] uppercase">IQD</span></p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl">
                                            <button onClick={() => removeFromCart(item.name)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Icon name="Minus" size={18} /></button>
                                            <span className="font-black text-white min-w-[20px] text-center text-lg">{item.qty}</span>
                                            <button onClick={() => {
                                                if (item.originalItem) addToCart(item.originalItem, item.size || null);
                                            }} className="p-2 text-green-500 hover:bg-green-500/10 rounded-xl transition-all"><Icon name="Plus" size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 mb-8">
                                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-4">Special Requests (e.g. No Onions)</label>
                                <textarea 
                                    className="w-full bg-black/40 border border-white/5 p-5 rounded-[2rem] text-white text-sm outline-none focus:border-[#ff3131] transition-all" 
                                    rows={3} 
                                    placeholder="تێبینی بۆ خواردنەکان..." 
                                    value={orderNote} 
                                    onChange={e => setOrderNote(e.target.value)} 
                                />
                            </div>

                            <div className="flex justify-between items-end mb-8 px-2">
                                <div>
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Total Amount</span>
                                    <span className="text-4xl font-black text-white tracking-tighter">{totalAmount.toLocaleString()} <span className="text-sm font-bold text-zinc-500">IQD</span></span>
                                </div>
                            </div>

                            <button onClick={handleSendOrder} disabled={isSending} className="w-full bg-green-500 text-white font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl shadow-green-500/30 active:scale-95 transition-all tracking-widest text-lg">
                                {isSending ? <Icon name="Loader2" className="animate-spin" size={24} /> : <>✅ ناردنی داواکاری و بینینی وەسڵ</>}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <AdminPanel categories={categories} wheelPrizes={wheelPrizes} />
            )}

            {showWheel && <LuckyWheel prizes={wheelPrizes} onWin={(p) => { setPrizesWon(prev => [...prev, p]); setShowWheel(false); }} onClose={() => setShowWheel(false)} />}
            {lastOrder && <DigitalReceipt order={lastOrder} onClose={() => setLastOrder(null)} />}
        </div>
    );
};

export default App;
