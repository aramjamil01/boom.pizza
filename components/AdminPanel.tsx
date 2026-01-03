
import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { db } from '../services/firebase';
import Icon from './Icon';
import { Category, MenuItem, Prize, Order } from '../types';

interface AdminPanelProps {
  categories: Category[];
  wheelPrizes: Prize[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ categories, wheelPrizes }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<Partial<MenuItem>>({ 
    name: '', price: 0, discount: 0, img: '', category: categories[0]?.id || '', 
    offsetS: -2000, offsetL: 3000 
  });
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({ id: '', name: '', img: '' });
  const [editingPrize, setEditingPrize] = useState<Partial<Prize>>({ label: '', color: '#ff3131', prob: 20 });

  useEffect(() => {
    onValue(ref(db, 'menu_items'), (snapshot) => {
      const data = snapshot.val();
      setMenuItems(data ? Object.entries(data).map(([id, val]) => ({ ...(val as any), id })) : []);
    });
    onValue(ref(db, 'orders'), (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, val]) => ({ ...(val as any), id })) : [];
      setOrders(list.reverse());
    });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (res: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.name || !editingItem.price) return alert("تکایە خانەکان پڕبکەرەوە");
    editingItem.id ? await update(ref(db, `menu_items/${editingItem.id}`), editingItem) : await push(ref(db, 'menu_items'), editingItem);
    resetForms();
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory.id || !editingCategory.name) return alert("ID و ناو پێویستە");
    await set(ref(db, `categories/${editingCategory.id}`), { name: editingCategory.name, img: editingCategory.img });
    resetForms();
  };

  const savePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrize.label) return alert("ناو پێویستە");
    (editingPrize as any).id ? await update(ref(db, `prizes/${(editingPrize as any).id}`), editingPrize) : await push(ref(db, 'prizes'), editingPrize);
    resetForms();
  };

  const resetForms = () => {
    setEditingItem({ name: '', price: 0, discount: 0, img: '', category: categories[0]?.id || '', offsetS: -2000, offsetL: 3000 });
    setEditingCategory({ id: '', name: '', img: '' });
    setEditingPrize({ label: '', color: '#ff3131', prob: 20 });
    setIsEditorOpen(false);
  };

  const deleteEntry = async (path: string, id: string) => {
    if (confirm("ئایا دڵنیای لە سڕینەوە؟")) await remove(ref(db, `${path}/${id}`));
  };

  const clearAllOrders = async () => {
      if(confirm("ئایا دڵنیای لە سڕینەوەی گشت داواکارییەکان؟")) {
          await remove(ref(db, 'orders'));
      }
  };

  const toggleOrderStatus = async (order: Order) => {
      const newStatus = order.status === 'completed' ? 'pending' : 'completed';
      await update(ref(db, `orders/${order.id || order.orderID}`), { status: newStatus });
  };

  const openEditor = (type: string, data?: any) => {
    if (type === 'item') setEditingItem(data || { name: '', price: 0, discount: 0, img: '', category: categories[0]?.id || '', offsetS: -2000, offsetL: 3000 });
    if (type === 'category') setEditingCategory(data || { id: '', name: '', img: '' });
    if (type === 'prize') setEditingPrize(data || { label: '', color: '#ff3131', prob: 20 });
    setIsEditorOpen(true);
  };

  return (
    <div className="min-h-screen pb-32 bg-[#0a0a0a]">
      {/* Redesigned Tab Navigation */}
      <div className="sticky top-16 z-40 bg-black/40 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="max-w-md mx-auto bg-zinc-900/60 p-1.5 rounded-2xl flex items-center shadow-2xl">
          {[
            { id: 'orders', label: 'داواکاری', icon: 'Inbox' },
            { id: 'items', label: 'مێنۆ', icon: 'Pizza' },
            { id: 'categories', label: 'جۆر', icon: 'Layers' },
            { id: 'wheel', label: 'چەرخ', icon: 'Trophy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-[#ff3131] text-white shadow-xl scale-[1.05]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto space-y-6">
        {/* Orders View */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Icon name="Activity" className="text-[#ff3131]" size={20} />
                داواکارییە نوێیەکان
              </h2>
              {orders.length > 0 && (
                  <button onClick={clearAllOrders} className="text-red-500 text-xs font-bold bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">سڕینەوەی هەموو</button>
              )}
            </div>
            {orders.length === 0 ? (
              <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-20 text-center text-zinc-600">
                هیچ داواکارییەک نییە
              </div>
            ) : (
              orders.map(o => (
                <div key={o.id} className={`bg-zinc-900/50 backdrop-blur-md border p-6 rounded-[2rem] shadow-2xl transition-all duration-500 ${o.status === 'completed' ? 'border-green-500/30 opacity-70 scale-95' : 'border-white/10 hover:border-white/20'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl ${o.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-[#ff3131]/20 text-[#ff3131]'}`}>
                           <Icon name={o.status === 'completed' ? 'CheckCircle' : 'Clock'} size={24} />
                        </div>
                        <div>
                           <div className="text-xs font-black text-zinc-500 uppercase tracking-widest">ORDER #{o.orderID}</div>
                           <div className="text-sm font-bold text-[#ffc107]">{o.time}</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => toggleOrderStatus(o)} 
                            className={`p-3 rounded-2xl transition-all shadow-lg ${o.status === 'completed' ? 'bg-zinc-800 text-zinc-400' : 'bg-green-500 text-white'}`}
                            title={o.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                        >
                            <Icon name={o.status === 'completed' ? 'RotateCcw' : 'Check'} size={20} />
                        </button>
                        <button 
                            onClick={() => deleteEntry('orders', o.id || '')} 
                            className="bg-red-500/10 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                        >
                            <Icon name="Trash2" size={20} />
                        </button>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 rounded-3xl p-4 mb-4 border border-white/5">
                    <div className="text-sm font-bold text-zinc-100 leading-relaxed mb-1">{o.items}</div>
                    {o.note && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                            <p className="text-[10px] text-[#ffc107] font-black uppercase mb-1">Customer Note:</p>
                            <p className="text-xs text-zinc-400 italic">"{o.note}"</p>
                        </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-white tracking-tighter">{o.total} <span className="text-xs text-zinc-500">د.ع</span></div>
                    </div>
                    <a 
                      href={o.location} 
                      target="_blank" 
                      className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 text-xs font-bold"
                    >
                      <Icon name="MapPin" size={16} /> لۆکەیشن
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Card-based Item Management */}
        {activeTab !== 'orders' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeTab === 'items' && menuItems.map(item => (
              <div key={item.id} className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-[2rem] overflow-hidden group hover:border-[#ff3131]/40 transition-all duration-300">
                <div className="relative h-32">
                  <img src={item.img || 'https://via.placeholder.com/150'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center">
                    <span className="text-[9px] bg-[#ff3131] text-white px-2 py-0.5 rounded-full font-black uppercase">{item.category}</span>
                    <span className="text-xs font-black text-white">{item.price.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xs font-bold text-white truncate mb-4">{item.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => openEditor('item', item)} className="flex-1 bg-white/5 hover:bg-blue-600 text-blue-400 hover:text-white py-2.5 rounded-xl border border-white/5 transition-all flex justify-center"><Icon name="Edit" size={14} /></button>
                    <button onClick={() => deleteEntry('menu_items', item.id)} className="flex-1 bg-white/5 hover:bg-red-600 text-red-500 hover:text-white py-2.5 rounded-xl border border-white/5 transition-all flex justify-center"><Icon name="Trash2" size={14} /></button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'categories' && categories.map(c => (
              <div key={c.id} className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-[2rem] p-5 text-center group hover:border-[#ff3131]/40 transition-all">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-white/10 group-hover:border-[#ff3131] transition-all">
                  <img src={c.img || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest">{c.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => openEditor('category', {id: c.id, ...c})} className="flex-1 bg-white/5 text-blue-400 py-2.5 rounded-xl border border-white/5 flex justify-center"><Icon name="Edit" size={14} /></button>
                  <button onClick={() => deleteEntry('categories', c.id)} className="flex-1 bg-white/5 text-red-500 py-2.5 rounded-xl border border-white/5 flex justify-center"><Icon name="Trash2" size={14} /></button>
                </div>
              </div>
            ))}

            {activeTab === 'wheel' && wheelPrizes.map(p => (
              <div key={p.id} className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-6 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-10 h-10 opacity-10" style={{ backgroundColor: p.color as string }} />
                <div className="text-3xl mb-3">🎁</div>
                <h3 className="text-xs font-black text-white mb-1 uppercase tracking-tight">{p.label}</h3>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{p.prob}% Chance</div>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => openEditor('prize', p)} className="flex-1 bg-white/5 text-blue-400 py-2.5 rounded-xl border border-white/5 flex justify-center"><Icon name="Edit" size={14} /></button>
                  <button onClick={() => deleteEntry('prizes', p.id || '')} className="flex-1 bg-white/5 text-red-500 py-2.5 rounded-xl border border-white/5 flex justify-center"><Icon name="Trash2" size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern FAB */}
      {activeTab !== 'orders' && !isEditorOpen && (
        <button 
          onClick={() => openEditor(activeTab === 'items' ? 'item' : activeTab === 'categories' ? 'category' : 'prize')}
          className="fixed bottom-24 left-8 z-50 bg-[#ff3131] text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all border border-white/20 animate-bounce"
        >
          <Icon name="Plus" size={32} strokeWidth={3} />
        </button>
      )}

      {/* Item/Category Editor Sidebar/Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-end sm:items-center justify-center p-4 animate-in slide-in-from-bottom duration-500">
          <div className="bg-zinc-900 w-full max-w-xl rounded-[3rem] border border-white/10 p-10 shadow-3xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button onClick={resetForms} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
              <Icon name="X" size={28} />
            </button>
            
            <h2 className="text-3xl font-black text-white mb-10 flex items-center gap-4">
              <div className="bg-[#ff3131]/20 p-3 rounded-2xl">
                 <Icon name={activeTab === 'items' ? 'PlusSquare' : activeTab === 'categories' ? 'FolderPlus' : 'Gift'} className="text-[#ff3131]" size={28} />
              </div>
              {activeTab === 'items' ? (editingItem.id ? 'Edit Dish' : 'New Dish') : 
               activeTab === 'categories' ? 'Categories' : 'Prizes'}
            </h2>

            <form onSubmit={activeTab === 'items' ? saveItem : activeTab === 'categories' ? saveCategory : savePrize} className="space-y-6">
              {activeTab === 'items' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                        <label className="text-[10px] text-zinc-500 font-black uppercase ml-2 tracking-widest">Dish Name</label>
                        <div className="relative">
                            <Icon name="Type" className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                            <input type="text" placeholder="e.g. Margarita" className="w-full bg-black/40 border border-white/5 p-5 pl-14 rounded-[1.5rem] text-white font-bold text-sm outline-none focus:border-[#ff3131] transition-all" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] text-zinc-500 font-black uppercase ml-2 tracking-widest">Base Price</label>
                        <div className="relative">
                            <Icon name="DollarSign" className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                            <input type="number" placeholder="10000" className="w-full bg-black/40 border border-white/5 p-5 pl-14 rounded-[1.5rem] text-white font-bold text-sm outline-none focus:border-[#ff3131] transition-all" value={editingItem.price || ''} onChange={e => setEditingItem({ ...editingItem, price: parseInt(e.target.value) })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-zinc-500 font-black uppercase ml-2 tracking-widest">Discount</label>
                        <div className="relative">
                            <Icon name="Percent" className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                            <input type="number" placeholder="0" className="w-full bg-black/40 border border-white/5 p-5 pl-14 rounded-[1.5rem] text-white font-bold text-sm outline-none focus:border-[#ff3131] transition-all" value={editingItem.discount || ''} onChange={e => setEditingItem({ ...editingItem, discount: parseInt(e.target.value) })} />
                        </div>
                    </div>
                  </div>

                  {/* Size Config Offsets */}
                  {editingItem.category === 'pizza' && (
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                        <p className="text-[10px] text-[#ffc107] font-black uppercase tracking-widest mb-4">Pizza Size Price Adjustments</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-zinc-400 font-bold uppercase">Small Offset</label>
                                <input type="number" className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none focus:border-[#ff3131]" value={editingItem.offsetS} onChange={e => setEditingItem({...editingItem, offsetS: parseInt(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-zinc-400 font-bold uppercase">Large Offset</label>
                                <input type="number" className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none focus:border-[#ff3131]" value={editingItem.offsetL} onChange={e => setEditingItem({...editingItem, offsetL: parseInt(e.target.value)})} />
                            </div>
                        </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-black uppercase ml-2 tracking-widest">Category</label>
                    <div className="relative">
                        <Icon name="Layers" className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                        <select className="w-full bg-black/40 border border-white/5 p-5 pl-14 rounded-[1.5rem] text-white font-bold text-sm outline-none appearance-none focus:border-[#ff3131] transition-all" value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <div className="relative">
                    <Icon name="Hash" className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input type="text" placeholder="ID (e.g. burger)" className="w-full bg-black/40 border border-white/5 p-5 pl-14 rounded-[1.5rem] text-white font-bold text-sm outline-none focus:border-[#ff3131] transition-all" value={editingCategory.id} onChange={e => setEditingCategory({ ...editingCategory, id: e.target.value })} />
                  </div>
                  <div className="relative">
                    <Icon name="PenTool" className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input type="text" placeholder="Display Name (Kurdish)" className="w-full bg-black/40 border border-white/5 p-5 pl-14 rounded-[1.5rem] text-white font-bold text-sm outline-none focus:border-[#ff3131] transition-all" value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                  </div>
                </div>
              )}

              {activeTab === 'wheel' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 relative">
                    <Icon name="Star" className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input type="text" placeholder="Prize Label" className="w-full bg-black/40 border border-white/5 p-5 pl-14 rounded-[1.5rem] text-white font-bold text-sm outline-none focus:border-[#ff3131] transition-all" value={editingPrize.label} onChange={e => setEditingPrize({ ...editingPrize, label: e.target.value })} />
                  </div>
                  <div className="relative">
                    <Icon name="Zap" className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input type="number" placeholder="Prob %" className="w-full bg-black/40 border border-white/5 p-5 pl-14 rounded-[1.5rem] text-white font-bold text-sm outline-none focus:border-[#ff3131] transition-all" value={editingPrize.prob} onChange={e => setEditingPrize({ ...editingPrize, prob: e.target.value })} />
                  </div>
                  <input type="color" className="h-full w-full bg-black/40 border border-white/10 p-3 rounded-[1.5rem]" value={editingPrize.color as string} onChange={e => setEditingPrize({ ...editingPrize, color: e.target.value })} />
                </div>
              )}

              <div className="pt-4">
                <label className="flex items-center justify-center gap-3 cursor-pointer bg-white/5 border border-dashed border-white/20 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all group">
                  <Icon name="Image" size={24} className="text-[#ff3131] group-hover:scale-125 transition-transform" />
                  <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Upload Photo</span>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, (res) => {
                    if(activeTab === 'items') setEditingItem({...editingItem, img: res});
                    if(activeTab === 'categories') setEditingCategory({...editingCategory, img: res});
                  })} className="hidden" />
                </label>
                {(editingItem.img || editingCategory.img) && (
                  <div className="mt-6 relative w-32 h-32 mx-auto">
                    <img src={activeTab === 'items' ? editingItem.img : editingCategory.img} className="w-full h-full object-cover rounded-[1.5rem] border-2 border-white/10 shadow-2xl" />
                    <button type="button" onClick={() => activeTab === 'items' ? setEditingItem({...editingItem, img: ''}) : setEditingCategory({...editingCategory, img: ''})} className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg"><Icon name="X" size={14} /></button>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-10">
                <button type="button" onClick={resetForms} className="flex-1 bg-white/5 text-zinc-500 font-black uppercase py-5 rounded-[1.5rem] border border-white/5 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] bg-[#ff3131] text-white font-black uppercase py-5 rounded-[1.5rem] shadow-2xl shadow-red-500/30 active:scale-95 transition-all tracking-widest">Save Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
