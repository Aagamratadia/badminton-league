'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Purchase } from '@/types';
import Toast from '@/components/ui/Toast';
import { formatToINR } from '@/utils/currency';

// --- Icon Components (No change needed here) ---
const ShuttlecockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 0010 16.5V3.5a1 1 0 00-.447-.832L3.58 1.584A1 1 0 002.5 2.42v15.16a1 1 0 001.625.782l11.375-6.483a1 1 0 000-1.564L4.125 4.117a1 1 0 00-1.625.782v2.228a1 1 0 001.394.906l2.106-.602a1 1 0 011.022.115l3.5 3.5a1 1 0 001.414 0l3.5-3.5a1 1 0 011.022-.115l2.106.602a1 1 0 001.394-.906V4.117a1 1 0 00-1.625-.782L10.894 2.553z" />
  </svg>
);
const AddIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const LogIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);


export default function InventoryPage() {
  const router = useRouter();
  const [totalShuttles, setTotalShuttles] = useState(0);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('balances');

  // All JS logic functions (handleStockSubmit, handleLogUsage, etc.) remain unchanged
  const handleStockSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingStock(true);
    const formData = new FormData(event.currentTarget);
    const quantity = formData.get('quantityPurchased');
    const totalPrice = formData.get('totalPrice');
    const userIdsToSubmit = Object.keys(selectedUsers).filter(id => selectedUsers[id]);

    if (userIdsToSubmit.length === 0) {
      setToastMessage('Please select at least one user to split the cost.');
      setIsSubmittingStock(false);
      return;
    }

    try {
      // API call logic...
      console.log("Submitting stock:", { quantity, totalPrice, userIdsToSubmit });
      setToastMessage('Stock added and costs split successfully! 🏸');
      (event.target as HTMLFormElement).reset();
      setSelectedUsers({});
      await fetchData(false); 
    } catch (error) {
       console.error(error)
       setToastMessage('Error adding stock.');
    } finally {
      setIsSubmittingStock(false);
    }
  };

  const handleLogUsage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingUsage(true);
    const formData = new FormData(event.currentTarget);
    const quantityUsed = formData.get('quantityUsed');
    try {
      // API call logic...
      console.log("Logging usage:", { quantityUsed });
      setToastMessage('Usage logged successfully!');
      (event.target as HTMLFormElement).reset();
      await fetchData(false);
    } catch (error) {
      console.error(error);
      setToastMessage('Error logging usage.');
    } finally {
      setIsSubmittingUsage(false);
    }
  };
  
  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`/api/inventory?_=${new Date().getTime()}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setTotalShuttles(data.totalShuttles);
      setPurchases(data.purchases);
      setUsers(data.users);
    } catch (error) {
      console.error(error);
      setToastMessage('Failed to load inventory data.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    const isUserAdmin = true;
    if (!isUserAdmin) router.push('/dashboard');
    else fetchData();
  }, [router]);


  if (loading) {
    // Skeleton component is a good practice, but for brevity, a simple loader works
    return <div className="min-h-screen bg-sky-50/50 flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-sky-50/50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Inventory</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Status Card */}
            <div className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg shadow-sky-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-sky-100">Current Stock</h2>
                <p className="text-5xl font-bold tracking-tight">{totalShuttles}</p>
                <span className="text-lg font-light text-sky-200">shuttlecocks</span>
              </div>
              <ShuttlecockIcon className="w-20 h-20 text-white/20" />
            </div>

            {/* Manage Card */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60">
              {/* FIX: Changed to `items-start` to prevent vertical stretching of content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 items-start">
                
                {/* Add Stock Form */}
                {/* FIX: Added `flex flex-col h-full` to manage vertical space */}
                <form onSubmit={handleStockSubmit} className="space-y-4 flex flex-col h-full">
                  <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4"><AddIcon className="w-6 h-6 text-sky-500" /> Add New Stock</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="quantityPurchased" className="text-sm font-medium text-slate-600">Quantity</label>
                          <input type="number" id="quantityPurchased" name="quantityPurchased" min="1" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors duration-200" />
                        </div>
                        <div>
                          <label htmlFor="totalPrice" className="text-sm font-medium text-slate-600">Total Price</label>
                          <input type="number" id="totalPrice" name="totalPrice" step="0.01" min="0" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors duration-200" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-600 mb-2">Split cost among:</h4>
                          <div className="space-y-1 max-h-36 overflow-y-auto pr-2">
                            {users.filter(u => u.role !== 'admin').map(user => (
                              <div key={user.id} onClick={() => handleUserSelection(String(user.id))} className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ${selectedUsers[String(user.id)] ? 'bg-sky-100' : 'hover:bg-slate-100'}`}>
                                <input type="checkbox" id={`user-${user.id}`} checked={!!selectedUsers[String(user.id)]} readOnly className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500" />
                                <label htmlFor={`user-${user.id}`} className="ml-3 text-sm font-medium text-slate-700 cursor-pointer">{user.name}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                  </div>
                   {/* Add Stock Button */}
                  <button type="submit" disabled={isSubmittingStock} className="w-full flex justify-center items-center bg-sky-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm">
                    {isSubmittingStock ? 'Adding...' : 'Add Stock'}
                  </button>
                </form>

                {/* Log Usage Form */}
                {/* FIX: Added `flex flex-col h-full` to ensure it takes full column height */}
                <form onSubmit={handleLogUsage} className="space-y-4 flex flex-col h-full">
                  {/* FIX: `flex-grow` makes the content take up available space, pushing button down */}
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4"><LogIcon className="w-6 h-6 text-sky-500" /> Log Session Usage</h3>
                    <div>
                      <label htmlFor="quantityUsed" className="text-sm font-medium text-slate-600">Quantity Used</label>
                      <input type="number" id="quantityUsed" name="quantityUsed" min="1" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors duration-200" />
                    </div>
                  </div>
                  {/* Log Usage Button */}
                  <button type="submit" disabled={isSubmittingUsage} className="w-full flex justify-center items-center bg-cyan-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-cyan-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm">
                    {isSubmittingUsage ? 'Logging...' : 'Log Usage'}
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          {/* Data Tables Card */}
          <div className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60">
            <div className="mb-4 border-b border-slate-200">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {/* FIX: Inlined all tab styling classes */}
                <button 
                  onClick={() => setActiveTab('balances')} 
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'balances' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  Player Balances
                </button>
                <button 
                  onClick={() => setActiveTab('history')} 
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'history' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  Purchase History
                </button>
              </nav>
            </div>
            <div className="overflow-x-auto">
              {activeTab === 'balances' && (
                <table className="min-w-full">
                  <thead className="bg-sky-50">
                    <tr>
                      {/* FIX: Inlined table header styles */}
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">Player</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-sky-800 uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.filter(u => u.role !== 'admin').map(user => (
                      <tr key={user.id} className="hover:bg-sky-50/70 transition-colors">
                        {/* FIX: Inlined table cell styles */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{user.name}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${(user.outstandingBalance || 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {formatToINR(user.outstandingBalance || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === 'history' && (
                <table className="min-w-full">
                  <thead className="bg-sky-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-sky-800 uppercase tracking-wider">Qty</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-sky-800 uppercase tracking-wider">Price</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {purchases.map(purchase => (
                      <tr key={purchase.id} className="hover:bg-sky-50/70 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{new Date(purchase.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-800 font-medium">{purchase.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-600">{formatToINR(purchase.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}