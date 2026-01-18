import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, ChefHat, Package, CreditCard, BarChart3, 
  Bell, MessageCircle, Database, Settings, Search, LogOut,
  Check, X, Eye, Ban, RefreshCw
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

interface ChefApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  cuisine: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'cook';
  status: 'active' | 'suspended';
  joinedAt: Date;
  ordersCount: number;
}

const sampleApplications: ChefApplication[] = [
  { id: '1', name: 'Aisha Karimova', email: 'aisha@email.com', phone: '+7 777 123 4567', city: 'Almaty', cuisine: 'Kazakh', status: 'pending', submittedAt: new Date() },
  { id: '2', name: 'Rustam Mamedov', email: 'rustam@email.com', phone: '+7 777 234 5678', city: 'Astana', cuisine: 'Uzbek', status: 'pending', submittedAt: new Date(Date.now() - 86400000) },
  { id: '3', name: 'Elena Petrova', email: 'elena@email.com', phone: '+7 777 345 6789', city: 'Almaty', cuisine: 'Russian', status: 'approved', submittedAt: new Date(Date.now() - 86400000 * 3) },
];

const sampleUsers: AdminUser[] = [
  { id: '1', name: 'John Doe', email: 'john@email.com', role: 'buyer', status: 'active', joinedAt: new Date(), ordersCount: 12 },
  { id: '2', name: 'Jane Smith', email: 'jane@email.com', role: 'cook', status: 'active', joinedAt: new Date(Date.now() - 86400000 * 7), ordersCount: 45 },
  { id: '3', name: 'Bob Wilson', email: 'bob@email.com', role: 'buyer', status: 'suspended', joinedAt: new Date(Date.now() - 86400000 * 30), ordersCount: 3 },
];

const navItems = [
  { id: 'applications', label: 'Chef Applications', icon: ChefHat, count: 2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: CreditCard },
  { id: 'refunds', label: 'Refunds', icon: RefreshCw },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'chats', label: 'Chats', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminPanel() {
  const { user, isAuthenticated, setUser } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState(sampleApplications);
  const [users, setUsers] = useState(sampleUsers);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
              <Shield className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-8">
              You don't have permission to access this page. Please log in as an administrator.
            </p>
            <Link to="/">
              <Button variant="outline">Return Home</Button>
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const handleApproveApplication = (id: string) => {
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status: 'approved' as const } : app
    ));
    toast({ title: 'Application Approved', description: 'The chef application has been approved.' });
  };

  const handleRejectApplication = (id: string) => {
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status: 'rejected' as const } : app
    ));
    toast({ title: 'Application Rejected', description: 'The chef application has been rejected.' });
  };

  const handleSuspendUser = (id: string) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, status: u.status === 'active' ? 'suspended' as const : 'active' as const } : u
    ));
    toast({ title: 'User Status Updated' });
  };

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  return (
    <Layout>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r p-4 hidden lg:block">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">ChefCook</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count && (
                  <Badge variant="secondary" className="text-xs">
                    {item.count}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-4 border-t">
            <button
              onClick={() => { setUser(null); navigate('/'); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-serif font-bold">
                    {navItems.find(n => n.id === activeTab)?.label}
                  </h1>
                  <p className="text-muted-foreground">Manage your platform</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Content based on active tab */}
              {activeTab === 'applications' && (
                <div className="space-y-4">
                  <Tabs defaultValue="pending">
                    <TabsList>
                      <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                      <TabsTrigger value="approved">Approved</TabsTrigger>
                      <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="mt-6 space-y-4">
                      {applications.filter(a => a.status === 'pending').map(app => (
                        <div key={app.id} className="bg-card rounded-xl p-6 shadow-card">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">{app.name}</h3>
                              <p className="text-muted-foreground">{app.email} • {app.phone}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary">{app.city}</Badge>
                                <Badge variant="secondary">{app.cuisine} Cuisine</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="gap-1">
                                <Eye className="w-4 h-4" />
                                View Docs
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1">
                                <MessageCircle className="w-4 h-4" />
                                Chat
                              </Button>
                              <Button 
                                size="sm" 
                                className="gap-1 bg-success text-success-foreground hover:bg-success/90"
                                onClick={() => handleApproveApplication(app.id)}
                              >
                                <Check className="w-4 h-4" />
                                Approve
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleRejectApplication(app.id)}
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {applications.filter(a => a.status === 'pending').length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No pending applications</p>
                      )}
                    </TabsContent>

                    <TabsContent value="approved" className="mt-6 space-y-4">
                      {applications.filter(a => a.status === 'approved').map(app => (
                        <div key={app.id} className="bg-card rounded-xl p-6 shadow-card">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{app.name}</h3>
                              <p className="text-sm text-muted-foreground">{app.email}</p>
                            </div>
                            <Badge className="bg-success/20 text-success">Approved</Badge>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="rejected" className="mt-6 space-y-4">
                      {applications.filter(a => a.status === 'rejected').map(app => (
                        <div key={app.id} className="bg-card rounded-xl p-6 shadow-card">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{app.name}</h3>
                              <p className="text-sm text-muted-foreground">{app.email}</p>
                            </div>
                            <Badge className="bg-destructive/20 text-destructive">Rejected</Badge>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-card rounded-xl shadow-card overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-left p-4 font-medium">Role</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Orders</th>
                        <th className="text-right p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-t">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{u.name}</p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">{u.role}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={u.status === 'active' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
                              {u.status}
                            </Badge>
                          </td>
                          <td className="p-4">{u.ordersCount}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSuspendUser(u.id)}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">Total Users</span>
                    </div>
                    <p className="text-3xl font-bold">1,234</p>
                    <p className="text-sm text-success">+12% this month</p>
                  </div>
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <ChefHat className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <span className="text-muted-foreground">Active Chefs</span>
                    </div>
                    <p className="text-3xl font-bold">156</p>
                    <p className="text-sm text-success">+8% this month</p>
                  </div>
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-success" />
                      </div>
                      <span className="text-muted-foreground">Orders Today</span>
                    </div>
                    <p className="text-3xl font-bold">89</p>
                    <p className="text-sm text-success">+24% vs yesterday</p>
                  </div>
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-info" />
                      </div>
                      <span className="text-muted-foreground">Revenue Today</span>
                    </div>
                    <p className="text-3xl font-bold">$2,456</p>
                    <p className="text-sm text-success">+18% vs yesterday</p>
                  </div>
                </div>
              )}

              {['products', 'orders', 'refunds', 'notifications', 'chats', 'settings'].includes(activeTab) && (
                <div className="bg-card rounded-xl p-12 shadow-card text-center">
                  <p className="text-muted-foreground">This section is under development</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
