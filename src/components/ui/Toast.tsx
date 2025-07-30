'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // Auto-close after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg">
      {message}
    </div>
  );
}
