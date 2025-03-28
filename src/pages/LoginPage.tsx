import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LockKeyhole, Mail, LogIn } from 'lucide-react';
import { authenticateAdmin, pb } from '@/lib/pocketbase';
import { useTheme } from '@/components/theme/theme-provider';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Try to authenticate with PocketBase admin API
      await authenticateAdmin(email, password);
      
      toast({
        title: 'Login Successful',
        description: 'Welcome to Konipai CRM',
      });
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to demo credentials for testing
      if (email === 'admin@konipai.com' && password === 'admin') {
        toast({
          title: 'Demo Login Successful',
          description: 'Using demo credentials',
        });
        navigate('/admin');
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br ${theme === 'dark' ? 'from-gray-900 via-gray-800 to-konipai-900' : 'from-konipai-50 via-blue-50 to-slate-100'}`}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-r from-konipai-500 to-konipai-600 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
            <span className="text-2xl font-bold">K</span>
          </div>
        </div>
        
        <Card className={`w-full border-0 ${theme === 'dark' ? 'bg-gray-800/50 backdrop-blur-md' : 'bg-white/80 backdrop-blur-sm'} shadow-xl overflow-hidden rounded-xl`}>
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-konipai-500 to-konipai-600 bg-clip-text text-transparent">Konipai CRM</CardTitle>
            <CardDescription className="text-center pt-2">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-3 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-konipai-400'}`} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@konipai.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 h-12 rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-konipai-500 focus:ring-konipai-500' : 'bg-gray-50 border-gray-200 focus:border-konipai-500'}`}
                      required
                    />
                  </div>
                </div>
              
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <a href="#" className={`text-xs ${theme === 'dark' ? 'text-konipai-400 hover:text-konipai-300' : 'text-konipai-600 hover:text-konipai-800'} font-medium transition-colors`}>
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <LockKeyhole className={`absolute left-3 top-3 h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-konipai-400'}`} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-10 h-12 rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-konipai-500 focus:ring-konipai-500' : 'bg-gray-50 border-gray-200 focus:border-konipai-500'}`}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 rounded-lg mt-2 text-white bg-gradient-to-r from-konipai-500 to-konipai-600 hover:from-konipai-600 hover:to-konipai-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className={`text-center border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} px-8 py-4`}>
            <p className="w-full text-sm text-gray-500">
              For demo, use: <span className="font-medium text-konipai-500">admin@konipai.com / admin</span>
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            © {new Date().getFullYear()} Konipai CRM. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
