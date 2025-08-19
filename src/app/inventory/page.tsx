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
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('balances');
  const [confirmingPayments, setConfirmingPayments] = useState<Record<string, boolean>>({});
  const [usageLogs, setUsageLogs] = useState<{ usageDate: string; quantityUsed: number }[]>([]);
  // Fund Raiser state
  const [fundAmountPerPerson, setFundAmountPerPerson] = useState(0);
  const [fundNumPeople, setFundNumPeople] = useState(1);
  const [fundSelectedUserIds, setFundSelectedUserIds] = useState<string[]>([]);
  // Fund Raiser Table State
  type FundContribution = {
    _id: string;
    date: string;
    userIds: any[]; // Can be string[] or object[]
    amountPerPerson: number;
    totalAmount: number;
  };
  const [fundContributions, setFundContributions] = useState<FundContribution[]>([]);
  const [isFundDeleteConfirmOpen, setIsFundDeleteConfirmOpen] = useState(false);
  const [fundContributionToDelete, setFundContributionToDelete] = useState<string | null>(null);
  const [isDeletingFund, setIsDeletingFund] = useState(false);
  const [isFundEditModalOpen, setIsFundEditModalOpen] = useState(false);
  const [editingFundContribution, setEditingFundContribution] = useState<FundContribution | null>(null);

  const handleAddFundAmount = async () => {
    if (fundAmountPerPerson <= 0 || fundSelectedUserIds.length === 0) return;

    try {
      const res = await fetch('/api/funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPerPerson: fundAmountPerPerson,
          totalAmount: fundAmountPerPerson * fundSelectedUserIds.length,
          userIds: fundSelectedUserIds,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add fund contribution');
      }

      setToastMessage('Fund contribution added successfully!');
      setFundAmountPerPerson(0);
      setFundSelectedUserIds([]);
      await fetchFunds(); // Refresh fund contributions
    } catch (error) {
      console.error(error);
      setToastMessage(`Failed to add fund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // --- Data Fetching and Handlers ---
  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`/api/inventory?_=${new Date().getTime()}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setTotalShuttles(data.totalShuttles || 0);
      setPurchases((data.purchases || []).map((p: any) => ({
        ...p,
        id: p.id || p._id || '',
      })));
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setToastMessage('Failed to load inventory data.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchFunds = async () => {
    try {
      const res = await fetch('/api/funds');
      if (!res.ok) throw new Error('Failed to fetch fund contributions');
      const data = await res.json();
      setFundContributions(data || []);
    } catch (error) {
      console.error('Error fetching funds:', error);
      setToastMessage('Failed to load fund contributions.');
    }
  };

  const fetchUsageLogs = async () => {
    try {
      const res = await fetch('/api/inventory/usage');
      if (!res.ok) throw new Error('Failed to fetch usage logs');
      const data = await res.json();
      setUsageLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching usage logs:', error);
      setToastMessage('Failed to load usage logs.');
    }
  };

  useEffect(() => {
    const isUserAdmin = true;
    if (!isUserAdmin) {
      router.push('/dashboard');
    } else {
      fetchData();
      fetchUsageLogs();
      fetchFunds();
    }
  }, [router]);

  const handleStockSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingStock(true);
    const formData = new FormData(event.currentTarget);
    const companyName = formData.get('companyName') as string;
    const quantity = Number(formData.get('quantityPurchased'));
    const totalPrice = Number(formData.get('totalPrice'));

    try {
      // Basic validation
      if (!companyName || !quantity || quantity < 1 || totalPrice == null || totalPrice < 0) {
        setToastMessage('Please fill all fields with valid values.');
        setIsSubmittingStock(false);
        return;
      }
      const res = await fetch('/api/inventory/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, quantity, totalPrice }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add stock');
      }
      setToastMessage('Stock added successfully! 🏸');
      (event.target as HTMLFormElement).reset();
      await fetchData(false);
    } catch (error) {
      console.error(error);
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
    if (!quantityUsed || quantityUsed < 1) {
      setToastMessage('Please enter a valid quantity used.');
      setIsSubmittingUsage(false);
      return;
    }
    try {
      const res = await fetch('/api/inventory/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantityUsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to log usage');
      }
      setToastMessage('Usage logged successfully!');
      (event.target as HTMLFormElement).reset();
      await fetchData(false); // Refresh state from backend
    await fetchUsageLogs(); // Refresh usage logs
    } catch (error) {
      console.error(error);
      setToastMessage('Error logging usage.');
    } finally {
      setIsSubmittingUsage(false);
    }
  };

  const handleUpdatePurchase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPurchase) {
      setToastMessage('Error: No purchase selected for editing!');
      return;
    }
    if (!editingPurchase.id) {
      setToastMessage('Error: Purchase ID is missing for editing!');
      return;
    }
    const formData = new FormData(event.currentTarget);
    const companyName = formData.get('companyName') as string;
    const quantity = Number(formData.get('editQuantity'));
    const totalPrice = Number(formData.get('editTotalPrice'));
    const userIdsToSubmit = Object.keys(selectedUsers).filter(id => selectedUsers[id]);

    if (userIdsToSubmit.length === 0) {
      setToastMessage('Please select at least one user.');
      return;
    }

    // Ensure only user IDs (as strings) are sent, not user objects
    const selectedUserIds = userIdsToSubmit.map(id => String(id));

    try {
      const res = await fetch(`/api/inventory/purchases/${editingPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, quantity, totalPrice, selectedUserIds }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update purchase');
      }
      setToastMessage('Purchase updated successfully!');
      closeModal();
      await fetchData(false);
    } catch (error) {
      console.error(error);
      setToastMessage(`Failed to update purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeletePurchase = async () => {
    if (!purchaseToDelete) {
      setToastMessage('Error: No purchase selected for deletion!');
      return;
    }
    setIsDeleting(true);
    console.log('Deleting purchase with id:', purchaseToDelete);
    try {
      const res = await fetch(`/api/inventory/purchases/${purchaseToDelete}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete purchase');
      }
      setToastMessage('Purchase deleted successfully!');
      closeModal();
      await fetchData(false);
    } catch (error) {
      console.error('Delete error:', error);
      setToastMessage(`Failed to delete purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
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

  const handleDeleteClick = (purchaseId: string | undefined | null) => {
    if (!purchaseId) {
      setToastMessage('Error: Purchase ID is missing!');
      return;
    }
    setPurchaseToDelete(purchaseId);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteFundContribution = async () => {
    if (!fundContributionToDelete) return;
    setIsDeletingFund(true);
    try {
      const res = await fetch(`/api/funds/${fundContributionToDelete}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete contribution');
      }
      setToastMessage('Fund contribution deleted successfully!');
      setIsFundDeleteConfirmOpen(false);
      setFundContributionToDelete(null);
      await fetchFunds(); // Refresh the list
    } catch (error) {
      console.error('Delete error:', error);
      setToastMessage(`Failed to delete contribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeletingFund(false);
    }
  };

  const handleFundDeleteClick = (contributionId: string) => {
    setFundContributionToDelete(contributionId);
    setIsFundDeleteConfirmOpen(true);
  };

  const handleFundEditClick = (contribution: FundContribution) => {
    setEditingFundContribution(contribution);
    setFundAmountPerPerson(contribution.amountPerPerson);
    setFundSelectedUserIds(contribution.userIds.map((u: any) => u._id));
    setIsFundEditModalOpen(true);
  };

  const handleUpdateFundContribution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingFundContribution) return;

    try {
      const res = await fetch(`/api/funds/${editingFundContribution._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPerPerson: fundAmountPerPerson,
          userIds: fundSelectedUserIds,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update contribution');
      }

      setToastMessage('Fund contribution updated successfully!');
      closeModal();
      await fetchFunds();
    } catch (error) {
      console.error('Update error:', error);
      setToastMessage(`Failed to update contribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleConfirmPayment = async (userId: string) => {
    setConfirmingPayments(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`/api/users/${userId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to confirm payment');
      }
      setToastMessage('Payment confirmed! Balance reset to ₹0.');
      await fetchData(false);
    } catch (error) {
      console.error(error);
      setToastMessage(`Failed to confirm payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setConfirmingPayments(prev => ({ ...prev, [userId]: false }));
    }
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setEditingPurchase(null);
    setPurchaseToDelete(null);
    setSelectedUsers({});
    // Also close fund modals
    setIsFundDeleteConfirmOpen(false);
    setFundContributionToDelete(null);
    setIsFundEditModalOpen(false);
    setEditingFundContribution(null);
    // Reset form fields
    setFundAmountPerPerson(0);
    setFundSelectedUserIds([]);
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

        <Modal isOpen={isFundDeleteConfirmOpen} onClose={closeModal} title="Confirm Deletion">
          <p className="text-slate-600">Are you sure you want to delete this fund contribution? This action cannot be undone.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={closeModal} className="px-4 py-2 rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
            <button onClick={handleDeleteFundContribution} disabled={isDeletingFund} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 transition-colors">
              {isDeletingFund ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>

        <Modal isOpen={isFundEditModalOpen} onClose={closeModal} title="Edit Fund Contribution">
          <form onSubmit={handleUpdateFundContribution}>
            <div className="space-y-4">
              <div>
                <label htmlFor="editFundAmount" className="block text-sm font-medium text-slate-700">Amount per Person</label>
                <input
                  type="number"
                  id="editFundAmount"
                  name="editFundAmount"
                  value={fundAmountPerPerson}
                  onChange={(e) => setFundAmountPerPerson(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Select Users</label>
                <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-slate-300 p-2 grid grid-cols-2 gap-2">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-sky-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={fundSelectedUserIds.includes(user.id)}
                        onChange={() => {
                          setFundSelectedUserIds(prev => 
                            prev.includes(user.id) 
                              ? prev.filter(id => id !== user.id) 
                              : [...prev, user.id]
                          );
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                Update Contribution
              </button>
            </div>
          </form>
        </Modal>
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Inventory</h1>
          <div className="flex items-center">
            {/* <button
              className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center disabled:opacity-60"
              onClick={() => fetchData()}
              disabled={loading}
              title="Refresh inventory and balances"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5 19A9 9 0 105 5" />
                </svg>
              )}
              Refresh
            </button> */}
            <button
              className="ml-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded flex items-center disabled:opacity-60"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch('/api/inventory/reset-balances', { method: 'POST' });
                  if (!res.ok) throw new Error('Failed to reset balances');
                  setToastMessage('All player balances reset to 0!');
                  await fetchData(false);
                } catch (e) {
                  setToastMessage('Failed to reset balances.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              title="Set all player balances to 0"
            >
              <svg className="h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Reset All Balances
            </button>
          </div>
        </div>
        
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
                  {users.map(user => (
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
            <button type="button" onClick={closeModal} className="btn-secondary" disabled={isDeleting}>Cancel</button>
            <button onClick={handleDeletePurchase} className="btn-danger" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Purchase'}
            </button>
          </div>
        </Modal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Stock Card */}
          <div className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg shadow-sky-200 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-medium text-sky-100">Current Stock</h2>
            </div>
            <div>
              <p className="text-5xl font-bold tracking-tight">{totalShuttles}</p>
              {purchases.length > 0 && (
                <p className="text-sm font-light text-sky-200">{purchases[0].companyName}</p>
              )}
            </div>
          </div>

          {/* Total Purchases Card */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60">
            <h2 className="text-lg font-medium text-slate-500">Total Purchases</h2>
            <p className="text-3xl font-bold text-slate-800 mt-2">{formatToINR(purchases.reduce((sum, p) => sum + p.totalPrice, 0))}</p>
          </div>

          {/* Total Funds Raised Card */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60">
            <h2 className="text-lg font-medium text-slate-500">Total Funds Raised</h2>
            <p className="text-3xl font-bold text-red-600 mt-2">{formatToINR(fundContributions.reduce((sum, c) => sum + c.totalAmount, 0))}</p>
          </div>

          {/* Net Amount Card */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60">
            <h2 className="text-lg font-medium text-slate-500">Net Amount</h2>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatToINR(fundContributions.reduce((sum, c) => sum + c.totalAmount, 0) - purchases.reduce((sum, p) => sum + p.totalPrice, 0))}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Fund Raiser Section */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60 flex flex-col gap-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Fund Raiser</h3>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <label htmlFor="amountPerPerson" className="block text-sm font-medium text-slate-600 mb-1">Amount per Person</label>
                  <input
                    type="number"
                    id="amountPerPerson"
                    min={1}
                    value={fundAmountPerPerson}
                    onChange={e => setFundAmountPerPerson(Number(e.target.value))}
                    className="input-styled w-full"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="fundSelectedUsers" className="block text-sm font-medium text-slate-600 mb-1">Select People</label>
                  <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-white">
                    {users.map(user => (
                      <label key={user.id} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          value={user.id}
                          checked={fundSelectedUserIds.includes(user.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFundSelectedUserIds(prev => [...prev, user.id]);
                            } else {
                              setFundSelectedUserIds(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                        />
                        <span className="text-slate-700">{user.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Selected: <span className="font-semibold text-sky-700">{fundSelectedUserIds.length}</span> people
                  </div>
                </div>
              </div>
              <div className="mt-4 text-lg font-semibold text-slate-700">
                Total Amount: <span className="text-sky-600">{formatToINR(fundAmountPerPerson * fundSelectedUserIds.length)}</span>
              </div>
              <button
                className="mt-4 btn-primary !bg-green-600 hover:!bg-green-700 focus:!ring-green-500 disabled:!bg-green-400"
                disabled={fundAmountPerPerson <= 0 || fundSelectedUserIds.length === 0}
                onClick={handleAddFundAmount}
              >
                Add Amount
              </button>
            </div>

            {/* Fund Raiser Contributions Table */}
            {fundContributions.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60 mt-6">
                <h4 className="text-md font-semibold mb-2 text-slate-700">Fund Raiser Contributions</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-3 py-2 border">Date</th>
                        <th className="px-3 py-2 border">Amount/Person</th>
                        <th className="px-3 py-2 border">Total Amount</th>
                        <th className="px-3 py-2 border">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fundContributions.map((c, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 border">{new Date(c.date).toLocaleString()}</td>
                          <td className="px-3 py-2 border">{formatToINR(c.amountPerPerson)}</td>
                          <td className="px-3 py-2 border">{formatToINR(c.totalAmount)}</td>
                          <td className="px-3 py-2 border">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleFundEditClick(c)} className="p-1 text-slate-500 hover:text-blue-600 transition-colors">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleFundDeleteClick(c._id)} className="p-1 text-slate-500 hover:text-red-600 transition-colors">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 items-start">
                <form onSubmit={handleStockSubmit} className="space-y-4 flex flex-col h-full">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4"><AddIcon className="w-6 h-6 text-sky-500" /> Add New Stock</h3>
                    <div className="space-y-4">
                      <div><label htmlFor="companyName" className="text-sm font-medium text-slate-600">Company Name</label><input type="text" id="companyName" name="companyName" required className="mt-1 block w-full input-styled" /></div>
                      <div><label htmlFor="quantityPurchased" className="text-sm font-medium text-slate-600">Quantity</label><input type="number" id="quantityPurchased" name="quantityPurchased" min="1" required className="mt-1 block w-full input-styled" /></div>
                      <div><label htmlFor="totalPrice" className="text-sm font-medium text-slate-600">Total Price</label><input type="number" id="totalPrice" name="totalPrice" step="0.01" min="0" required className="mt-1 block w-full input-styled" /></div>

                    </div>
                  </div>
                  <button type="submit" disabled={isSubmittingStock} className="btn-primary">{isSubmittingStock ? 'Adding...' : 'Add Stock'}</button>
                </form>

                <div className="flex flex-col gap-8">
                  <form onSubmit={handleLogUsage} className="space-y-4 flex flex-col h-full">
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4"><LogIcon className="w-6 h-6 text-sky-500" /> Log Session Usage</h3>
                      <div><label htmlFor="quantityUsed" className="text-sm font-medium text-slate-600">Quantity Used</label><input type="number" id="quantityUsed" name="quantityUsed" min="1" required className="mt-1 block w-full input-styled" /></div>
                    </div>
                    <button type="submit" disabled={isSubmittingUsage} className="btn-primary !bg-cyan-600 hover:!bg-cyan-700 focus:!ring-cyan-500 disabled:!bg-cyan-400">{isSubmittingUsage ? 'Logging...' : 'Log Usage'}</button>
                  </form>

                  <div className="my-2">
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-2"><LogIcon className="w-6 h-6 text-sky-500" /> Usage Log History</h3>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-sky-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">Quantity Used</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usageLogs.length === 0 ? (
                            <tr><td colSpan={2} className="px-4 py-3 text-slate-400 text-center">No usage logs found.</td></tr>
                          ) : (
                            usageLogs.map((log, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="px-4 py-2">{new Date(log.usageDate).toLocaleString()}</td>
                                <td className="px-4 py-2">{log.quantityUsed}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
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
  <table className="min-w-full text-sm border">
    <thead>
      <tr className="bg-sky-50">
        <th className="table-header">Player</th>
        <th className="table-header text-right">Fund Raised</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-slate-200">
      {users.filter(u => u.role !== 'admin').map(user => {
        // Sum all fund contributions for this user
        const fundTotal = fundContributions.reduce((sum, c) => {
          const userInContribution = c.userIds.some((u: any) => u._id === user.id);
          return userInContribution ? sum + c.amountPerPerson : sum;
        }, 0);
        const netBalance = (user.outstandingBalance || 0) - fundTotal;
        return (
          <tr key={user.id} className="hover:bg-sky-50/70 transition-colors">
            <td className="table-cell font-medium text-slate-800">{user.name}</td>
            <td className="table-cell text-right font-semibold text-green-700">{formatToINR(fundTotal)}</td>
          </tr>
        );
      })}
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