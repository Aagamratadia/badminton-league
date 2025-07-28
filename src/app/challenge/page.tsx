'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, X, ChevronRight, Loader2, Calendar, Clock, UserPlus, AlertCircle } from 'lucide-react';

type User = {
  _id: string;
  name: string;
  email: string;
};

export default function ChallengePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  
  // Fetch users from the backend
  useEffect(() => {
    const fetchUsers = async () => {
      if (!session) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load user list. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [session]);

  const [formData, setFormData] = useState({
    partnerId: '',
    opponent1Id: '',
    opponent2Id: '',
    matchDate: '',
    matchTime: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/matches/2v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team1: {
            player1: formData.partnerId,
            player2: session?.user?.id, // Current user's ID
          },
          team2: {
            player1: formData.opponent1Id,
            player2: formData.opponent2Id,
          },
          scheduledDate: formData.matchDate,
          matchTime: formData.matchTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create match');
      }

      setSuccess(true);
      // Reset form
      setFormData({
        partnerId: '',
        opponent1Id: '',
        opponent2Id: '',
        matchDate: '',
        matchTime: ''
      });
      setStep(1);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create challenge. Please try again.');
      console.error('Error creating challenge:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const availablePartners = users.filter(user => user._id !== session?.user?.id);
  const availableOpponents = availablePartners.filter(user => user._id !== formData.partnerId);
  const availableSecondOpponents = availableOpponents.filter(user => user._id !== formData.opponent1Id);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Sign In Required</h2>
          <p className="text-slate-600 mb-6">Please sign in to create a 2v2 challenge.</p>
          <Button 
            onClick={() => router.push('/login')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" />
          </div>
          <p className="text-slate-600">Loading players...</p>
        </div>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No Players Available</h2>
          <p className="text-slate-600 mb-6">There are no other players available to challenge at the moment.</p>
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="text-slate-700 border-slate-300 hover:bg-slate-50"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Create 2v2 Challenge</h1>
            <p className="mt-2 text-slate-600">
              {step === 1 && "Select your partner for the match"}
              {step === 2 && "Select your opponents"}
              {step === 3 && "Schedule your match"}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-8">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex flex-col items-center flex-1">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                    step === stepNum 
                      ? 'bg-cyan-600' 
                      : step > stepNum 
                        ? 'bg-green-500' 
                        : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {stepNum}
                </div>
                <div className={`text-xs mt-2 font-medium ${
                  step >= stepNum ? 'text-cyan-700' : 'text-slate-400'
                }`}>
                  {stepNum === 1 ? 'Select Partner' : stepNum === 2 ? 'Select Opponents' : 'Schedule'}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Challenge Created!</h3>
              <p className="text-gray-600 mb-6">Your 2v2 challenge has been created successfully.</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Select Partner */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Select Your Partner
                    </label>
                    <select
                      name="partnerId"
                      value={formData.partnerId}
                      onChange={handleChange}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      required
                    >
                      <option value="">Choose a partner</option>
                      {availablePartners.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Select Opponents */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      First Opponent
                    </label>
                    <select
                      name="opponent1Id"
                      value={formData.opponent1Id}
                      onChange={handleChange}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      required
                    >
                      <option value="">Choose first opponent</option>
                      {availableOpponents.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Second Opponent
                    </label>
                    <select
                      name="opponent2Id"
                      value={formData.opponent2Id}
                      onChange={handleChange}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      required
                      disabled={!formData.opponent1Id}
                    >
                      <option value="">Choose second opponent</option>
                      {availableSecondOpponents
                        .filter(user => user._id !== formData.opponent1Id)
                        .map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Schedule Match */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Match Date
                    </label>
                    <input
                      type="date"
                      name="matchDate"
                      value={formData.matchDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Match Time
                    </label>
                    <input
                      type="time"
                      name="matchTime"
                      value={formData.matchTime}
                      onChange={handleChange}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={step === 1 ? () => router.back() : prevStep}
                  disabled={isSubmitting}
                  className="text-slate-700 border-slate-300 hover:bg-slate-50"
                >
                  {step === 1 ? 'Cancel' : 'Back'}
                </Button>
                
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (step === 1 && !formData.partnerId) ||
                      (step === 2 && (!formData.opponent1Id || !formData.opponent2Id))
                    }
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Challenge...
                      </>
                    ) : (
                      'Create Challenge'
                    )}
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
