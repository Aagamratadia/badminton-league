'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { User, Purchase } from '@/types';
import Toast from '@/components/ui/Toast';
import { formatToINR } from '@/utils/currency';
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

// --- Reusable Modal Component ---
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/70" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-slate-800">{title}</Dialog.Title>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><XMarkIcon className="h-6 w-6" /></button>
                <div className="mt-4">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// --- Icon Components ---
const ShuttlecockIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 0010 16.5V3.5a1 1 0 00-.447-.832L3.58 1.584A1 1 0 002.5 2.42v15.16a1 1 0 001.625.782l11.375-6.483a1 1 0 000-1.564L4.125 4.117a1 1 0 00-1.625.782v2.228a1 1 0 001.394.906l2.106-.602a1 1 0 011.022.115l3.5 3.5a1 1 0 001.414 0l3.5-3.5a1 1 0 011.022-.115l2.106.602a1 1 0 001.394-.906V4.117a1 1 0 00-1.625-.782L10.894 2.553z" /></svg>);
const AddIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const LogIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>);

export default function InventoryPage() {
  // --- State variables ---
  const router = useRouter();
  const [totalShuttles, setTotalShuttles] = useState(0);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('balances');

  // --- Data Fetching and Handlers ---
  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`/api/inventory?_=${new Date().getTime()}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setTotalShuttles(data.totalShuttles || 0);
      setPurchases(data.purchases || []);
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setToastMessage('Failed to load inventory data.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleStockSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingStock(true);
    const formData = new FormData(event.currentTarget);
    const companyName = formData.get('companyName') as string;
    const quantity = Number(formData.get('quantityPurchased'));
    const totalPrice = Number(formData.get('totalPrice'));
    const userIdsToSubmit = Object.keys(selectedUsers).filter(id => selectedUsers[id]);

    if (userIdsToSubmit.length === 0) {
      setToastMessage('Please select at least one user to split the cost.');
      setIsSubmittingStock(false);
      return;
    }

    try {
      // NOTE: This is a mock API call. Replace with your actual API endpoint.
      console.log("Submitting stock:", { companyName, quantity, totalPrice, userIdsToSubmit });
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
    const quantityUsed = Number(formData.get('quantityUsed'));
    try {
      // NOTE: This is a mock API call. Replace with your actual API endpoint.
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

  const handleUpdatePurchase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPurchase) return;
    const formData = new FormData(event.currentTarget);
    const companyName = formData.get('companyName') as string;
    const quantity = Number(formData.get('editQuantity'));
    const totalPrice = Number(formData.get('editTotalPrice'));
    const userIdsToSubmit = Object.keys(selectedUsers).filter(id => selectedUsers[id]);

    if (userIdsToSubmit.length === 0) {
      setToastMessage('Please select at least one user.');
      return;
    }

    try {
      // NOTE: Replace with your actual API call
      console.log("Updating purchase:", { id: editingPurchase.id, companyName, quantity, totalPrice, userIdsToSubmit });
      setToastMessage('Purchase updated successfully!');
      closeModal();
      await fetchData(false);
    } catch (error) {
      console.error(error);
      setToastMessage(`Failed to update purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeletePurchase = async () => {
    if (!purchaseToDelete) return;
    try {
      // NOTE: Replace with your actual API call
      console.log("Deleting purchase:", purchaseToDelete);
      setToastMessage('Purchase deleted successfully!');
      closeModal();
      await fetchData(false);
    } catch (error) {
      console.error(error);
      setToastMessage(`Failed to delete purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleEditClick = (purchase: Purchase) => {
    const userSelections = purchase.splitAmong.reduce((acc, userId) => {
      acc[userId] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setSelectedUsers(userSelections);
    setEditingPurchase(purchase);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (purchaseId: string) => {
    setPurchaseToDelete(purchaseId);
    setIsDeleteConfirmOpen(true);
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setEditingPurchase(null);
    setPurchaseToDelete(null);
    setSelectedUsers({});
  }

  useEffect(() => {
    const isUserAdmin = true;
    if (!isUserAdmin) router.push('/dashboard');
    else fetchData();
  }, [router]);


  if (loading) {
    return <div className="min-h-screen bg-sky-50/50 flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-sky-50/50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Inventory</h1>
        
        <Modal isOpen={isEditModalOpen} onClose={closeModal} title="Edit Purchase">
          {editingPurchase && (
            <form onSubmit={handleUpdatePurchase} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="text-sm font-medium text-slate-600">Company Name</label>
                <input type="text" id="companyName" name="companyName" defaultValue={editingPurchase.companyName} required className="mt-1 block w-full input-styled" />
              </div>
              <div>
                <label htmlFor="editQuantity" className="text-sm font-medium text-slate-600">Quantity</label>
                <input type="number" id="editQuantity" name="editQuantity" defaultValue={editingPurchase.quantity} required className="mt-1 block w-full input-styled" />
              </div>
              <div>
                <label htmlFor="editTotalPrice" className="text-sm font-medium text-slate-600">Total Price</label>
                <input type="number" id="editTotalPrice" name="editTotalPrice" step="0.01" defaultValue={editingPurchase.totalPrice} required className="mt-1 block w-full input-styled" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2">Split cost among:</h4>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-2 border rounded-md p-2">
                  {users.filter(u => u.role !== 'admin').map(user => (
                    <div key={user.id} onClick={() => handleUserSelection(String(user.id))} className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ${selectedUsers[String(user.id)] ? 'bg-sky-100' : 'hover:bg-slate-100'}`}>
                      <input type="checkbox" id={`edit-user-${user.id}`} checked={!!selectedUsers[String(user.id)]} readOnly className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500" />
                      <label htmlFor={`edit-user-${user.id}`} className="ml-3 text-sm font-medium text-slate-700 cursor-pointer">{user.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          )}
        </Modal>

        <Modal isOpen={isDeleteConfirmOpen} onClose={closeModal} title="Confirm Deletion">
          <p className="text-sm text-slate-600">Are you sure you want to delete this purchase record? This will adjust player balances accordingly and cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-6">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button onClick={handleDeletePurchase} className="btn-danger">Delete Purchase</button>
          </div>
        </Modal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg shadow-sky-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-sky-100">Current Stock</h2>
                <p className="text-5xl font-bold tracking-tight">{totalShuttles}</p>
                <span className="text-lg font-light text-sky-200">shuttlecocks</span>
              </div>
              <ShuttlecockIcon className="w-20 h-20 text-white/20" />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 items-start">
                <form onSubmit={handleStockSubmit} className="space-y-4 flex flex-col h-full">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4"><AddIcon className="w-6 h-6 text-sky-500" /> Add New Stock</h3>
                    <div className="space-y-4">
                      <div><label htmlFor="companyName" className="text-sm font-medium text-slate-600">Company Name</label><input type="text" id="companyName" name="companyName" required className="mt-1 block w-full input-styled" /></div>
                      <div><label htmlFor="quantityPurchased" className="text-sm font-medium text-slate-600">Quantity</label><input type="number" id="quantityPurchased" name="quantityPurchased" min="1" required className="mt-1 block w-full input-styled" /></div>
                      <div><label htmlFor="totalPrice" className="text-sm font-medium text-slate-600">Total Price</label><input type="number" id="totalPrice" name="totalPrice" step="0.01" min="0" required className="mt-1 block w-full input-styled" /></div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-600 mb-2">Split cost among:</h4>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-2 border rounded-md p-2">
                          {users.filter(u => u.role !== 'admin').map(user => (<div key={user.id} onClick={() => handleUserSelection(String(user.id))} className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ${selectedUsers[String(user.id)] ? 'bg-sky-100' : 'hover:bg-slate-100'}`}><input type="checkbox" id={`user-${user.id}`} checked={!!selectedUsers[String(user.id)]} readOnly className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500" /><label htmlFor={`user-${user.id}`} className="ml-3 text-sm font-medium text-slate-700 cursor-pointer">{user.name}</label></div>))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmittingStock} className="btn-primary">{isSubmittingStock ? 'Adding...' : 'Add Stock'}</button>
                </form>

                <form onSubmit={handleLogUsage} className="space-y-4 flex flex-col h-full">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4"><LogIcon className="w-6 h-6 text-sky-500" /> Log Session Usage</h3>
                    <div><label htmlFor="quantityUsed" className="text-sm font-medium text-slate-600">Quantity Used</label><input type="number" id="quantityUsed" name="quantityUsed" min="1" required className="mt-1 block w-full input-styled" /></div>
                  </div>
                  <button type="submit" disabled={isSubmittingUsage} className="btn-primary !bg-cyan-600 hover:!bg-cyan-700 focus:!ring-cyan-500 disabled:!bg-cyan-400">{isSubmittingUsage ? 'Logging...' : 'Log Usage'}</button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60">
            <div className="mb-4 border-b border-slate-200">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('balances')} className={`tab-button ${activeTab === 'balances' ? 'tab-active' : 'tab-inactive'}`}>Player Balances</button>
                <button onClick={() => setActiveTab('history')} className={`tab-button ${activeTab === 'history' ? 'tab-active' : 'tab-inactive'}`}>Purchase History</button>
              </nav>
            </div>
            <div className="overflow-x-auto">
              {activeTab === 'balances' && (
                <table className="min-w-full">
                  <thead className="bg-sky-50">
                    <tr>
                      <th className="table-header">Player</th>
                      <th className="table-header text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.filter(u => u.role !== 'admin').map(user => (
                      <tr key={user.id} className="hover:bg-sky-50/70 transition-colors">
                        <td className="table-cell font-medium text-slate-800">{user.name}</td>
                        <td className={`table-cell text-right font-semibold ${(user.outstandingBalance || 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>{formatToINR(user.outstandingBalance || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === 'history' && (
                <table className="min-w-full">
                  <thead className="bg-sky-50">
                    <tr>
                      <th className="table-header">Date</th>
                      <th className="table-header">Company</th>
                      <th className="table-header">Details</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {purchases.map(purchase => (
                      <tr key={purchase.id} className="hover:bg-sky-50/70 transition-colors">
                        <td className="table-cell text-slate-600">{new Date(purchase.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                        <td className="table-cell font-medium text-slate-800">{purchase.companyName}</td>
                        <td className="table-cell text-slate-600"><div className="text-xs">Qty: {purchase.quantity}</div><div className="text-xs">Price: {formatToINR(purchase.totalPrice)}</div></td>
                        <td className="table-cell text-right">
                          <div className="flex items-center justify-end gap-4">
                            <button onClick={() => handleEditClick(purchase)} className="text-slate-500 hover:text-sky-600" title="Edit"><PencilIcon className="h-5 w-5" /></button>
                            <button onClick={() => handleDeleteClick(purchase.id)} className="text-slate-500 hover:text-red-600" title="Delete"><TrashIcon className="h-5 w-5" /></button>
                          </div>
                        </td>
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