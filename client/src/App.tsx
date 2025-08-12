import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { User, LoginInput } from '../../server/src/schema';

// Import components
import AdminDashboard from '@/components/AdminDashboard';
import CustomerInterface from '@/components/CustomerInterface';
import LoginForm from '@/components/LoginForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app and check for stored user session
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = useCallback(async (loginData: LoginInput) => {
    try {
      // STUB: Using mock login since server handlers are placeholders
      // In real implementation, this would call trpc.loginUser.mutate(loginData)
      const mockUser: User = {
        id: 1,
        name: loginData.email === 'admin@shop.com' ? 'Admin User' : 'Customer User',
        email: loginData.email,
        password: '', // Don't store password in frontend
        role: loginData.email === 'admin@shop.com' ? 'Admin' : 'Customer',
        address: null,
        phone: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setCurrentUser(mockUser);
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      return mockUser;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">🛒 E-Commerce Platform</CardTitle>
            <CardDescription>Welcome! Please sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onLogin={handleLogin} />
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-xs text-blue-700">
                <p><strong>Admin:</strong> admin@shop.com / password</p>
                <p><strong>Customer:</strong> customer@shop.com / password</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                🛒 E-Commerce Platform
              </h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentUser.role === 'Admin' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.name}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {currentUser.role === 'Admin' ? (
          <AdminDashboard user={currentUser} />
        ) : (
          <CustomerInterface user={currentUser} />
        )}
      </main>
    </div>
  );
}

export default App;