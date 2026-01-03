
import React from 'react';
import Icon from './Icon';
import { Order } from '../types';

interface DigitalReceiptProps {
  order: Order;
  onClose: () => void;
}

const DigitalReceipt: React.FC<DigitalReceiptProps> = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 z-[7000] bg-black/95 flex items-center justify-center p-4">
      <div className="bg-white text-black w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-6 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#ff3131]"></div>
        <div className="bg-green-100 text-green-600 p-3 rounded-full mb-4">
          <Icon name="CheckCircle" size={32} />
        </div>
        <h2 className="text-2xl font-black mb-1 text-center">وەسڵی دیجیتاڵی</h2>
        <p className="text-gray-500 text-sm mb-4 text-center">سوپاس بۆ متمانەکەت!</p>
        
        <div className="w-full bg-red-50 p-3 rounded-2xl mb-4 text-center border border-red-100">
           <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">کاتی گەیشتن (خەملێندراو)</p>
           <p className="text-lg font-black text-[#ff3131]">30 - 45 خولەک</p>
        </div>

        <div className="w-full border-t border-dashed border-gray-300 py-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-bold">کۆدی داواکاری:</span>
            <span className="font-bold">#{order.orderID}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-bold">کات:</span>
            <span className="font-bold">{order.time}</span>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-gray-500 text-sm font-bold">داواکارییەکان:</span>
            <span className="font-bold text-sm bg-gray-50 p-2 rounded-lg">{order.items}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
            <span className="text-lg font-bold">کۆی گشتی:</span>
            <span className="text-2xl font-black text-[#ff3131]">{order.total} د.ع</span>
          </div>
        </div>
        
        <div className="w-full mt-6 space-y-3 text-center">
          <p className="text-[10px] text-zinc-400 mb-2">بە وێنەی شاشە (Screenshot) ئەم وەسڵە لای خۆت بپارێزە</p>
          
          <div className="grid grid-cols-2 gap-2">
            <button
                onClick={() => {
                const msg = `🆔 # ${order.orderID}\n🍴 ${order.items}\n💰 ${order.total} د.ع\n📍 ${order.location}\n📝 ${order.note || "بەبێ تێبینی"}`;
                window.location.href = `https://wa.me/9647504629237?text=${encodeURIComponent(msg)}`;
                }}
                className="bg-[#25D366] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
                <Icon name="MessageCircle" size={18} /> واتسئەپ
            </button>
            <a
                href="tel:07504629237"
                className="bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
                <Icon name="Phone" size={18} /> پەیوەندی
            </a>
          </div>

          <button onClick={onClose} className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">گەڕانەوە بۆ مێنۆ</button>
        </div>
      </div>
    </div>
  );
};

export default DigitalReceipt;
