'use client';

import { useState, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });

  const fetchUsers = async () => {
    const res = await fetch('/api/users/list');
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      fetchUsers();
      setIsAddModalOpen(false);
      setNewUser({ name: '', email: '', password: '' });
    } else {
      console.error('Failed to add user');
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = await fetch(`/api/users/${editingUser._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingUser.name }),
    });

    if (res.ok) {
      fetchUsers();
      setIsEditModalOpen(false);
      setEditingUser(null);
    } else {
      console.error('Failed to update user');
    }
  };

  const handleDeleteClick = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsers();
      } else {
        console.error('Failed to delete user');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-green-500 text-white px-4 py-2 rounded">Add User</button>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleAddUser}>
              {/* Form fields */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
              </div>

              <div className="flex items-center justify-between">
                <button type="submit" className="bg-blue-500 text-white font-bold py-2 px-4 rounded">Submit</button>
                <button onClick={() => setIsAddModalOpen(false)} className="bg-red-500 text-white font-bold py-2 px-4 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
              </div>


              <div className="flex items-center justify-between">
                <button type="submit" className="bg-blue-500 text-white font-bold py-2 px-4 rounded">Update</button>
                <button onClick={() => setIsEditModalOpen(false)} className="bg-red-500 text-white font-bold py-2 px-4 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Email</th>

              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="py-2 px-4 border-b">{user.name}</td>
                <td className="py-2 px-4 border-b">{user.email}</td>

                <td className="py-2 px-4 border-b">
                  <button onClick={() => handleEditClick(user)} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                  <button onClick={() => handleDeleteClick(user._id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
