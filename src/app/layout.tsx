export const metadata = {
  title: 'Rawat Academy',
  description: 'Rawat Academy Badminton League - Manage your matches and track your progress',
}

import AuthProvider from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-cyan-100 via-blue-100 to-blue-200 min-h-screen">
        <div className="min-h-screen">
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}
