"use client"
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { insertUser } from "@/models/Twitter/fetchUser";
import { Suspense, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, UserPlus, Settings, Users2, Activity } from "lucide-react";

interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'manager' | 'analyst' | 'viewer';
    team: string;
    permissions: string[];
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
    last_login: string;
}

function AddUserContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        role: 'viewer' as const,
        team: '',
        permissions: [] as string[]
    });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'teams'>('add');

    const Userhandle = searchParams.get("id");

    // Sample user data - in real app, fetch from API
    const sampleUsers: User[] = [
        {
            id: '1',
            username: 'john_doe',
            email: 'john@company.com',
            role: 'admin',
            team: 'Engineering',
            permissions: ['read', 'write', 'delete', 'admin'],
            status: 'active',
            created_at: '2024-01-15',
            last_login: '2024-01-20'
        },
        {
            id: '2',
            username: 'jane_smith',
            email: 'jane@company.com',
            role: 'manager',
            team: 'Analytics',
            permissions: ['read', 'write'],
            status: 'active',
            created_at: '2024-01-10',
            last_login: '2024-01-19'
        }
    ];

    useEffect(() => {
        setUsers(sampleUsers);
    }, []);

    const handleAddUser = async () => {
        setLoading(true);
        try {
            // Add user to database
            if (Userhandle) {
                await insertUser(Userhandle);
            }
            
            // Add new user to local state
            const user: User = {
                id: Date.now().toString(),
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                team: newUser.team,
                permissions: getPermissionsForRole(newUser.role),
                status: 'pending',
                created_at: new Date().toISOString().split('T')[0],
                last_login: 'Never'
            };
            
            setUsers([...users, user]);
            setNewUser({ username: '', email: '', role: 'viewer', team: '', permissions: [] });
            
            // Show success message
            alert('User added successfully!');
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Error adding user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPermissionsForRole = (role: string): string[] => {
        const permissions = {
            'admin': ['read', 'write', 'delete', 'admin'],
            'manager': ['read', 'write'],
            'analyst': ['read', 'write'],
            'viewer': ['read']
        };
        return permissions[role as keyof typeof permissions] || ['read'];
    };

    const getRoleColor = (role: string) => {
        const colors = {
            'admin': 'bg-red-100 text-red-800',
            'manager': 'bg-blue-100 text-blue-800',
            'analyst': 'bg-green-100 text-green-800',
            'viewer': 'bg-gray-100 text-gray-800'
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'active': 'bg-green-100 text-green-800',
            'inactive': 'bg-red-100 text-red-800',
            'pending': 'bg-yellow-100 text-yellow-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-2">Manage users, roles, and team permissions</p>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    <span className="text-sm text-gray-600">{users.length} users</span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('add')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'add' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Add User
                </button>
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'manage' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Manage Users
                </button>
                <button
                    onClick={() => setActiveTab('teams')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'teams' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                                                <Users2 className="w-4 h-4 inline mr-2" />
                    Teams
                </button>
            </div>

            {/* Add User Tab */}
            {activeTab === 'add' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Add New User
                        </CardTitle>
                        <CardDescription>
                            Create a new user account with appropriate role and permissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                    placeholder="Enter username"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                    placeholder="Enter email"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="role">Role</Label>
                                <Select 
                                    value={newUser.role} 
                                    onValueChange={(value: any) => setNewUser({...newUser, role: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                        <SelectItem value="analyst">Analyst</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="team">Team</Label>
                                <Input
                                    id="team"
                                    value={newUser.team}
                                    onChange={(e) => setNewUser({...newUser, team: e.target.value})}
                                    placeholder="Enter team name"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                onClick={handleAddUser} 
                                disabled={loading || !newUser.username || !newUser.email}
                                className="w-full"
                            >
                                {loading ? 'Adding User...' : 'Add User'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Manage Users Tab */}
            {activeTab === 'manage' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            User Management
                        </CardTitle>
                        <CardDescription>
                            View and manage existing users, roles, and permissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2">User</th>
                                        <th className="text-left py-3 px-2">Role</th>
                                        <th className="text-left py-3 px-2">Team</th>
                                        <th className="text-left py-3 px-2">Status</th>
                                        <th className="text-left py-3 px-2">Permissions</th>
                                        <th className="text-left py-3 px-2">Last Login</th>
                                        <th className="text-left py-3 px-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-2">
                                                <div>
                                                    <div className="font-medium">{user.username}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <Badge className={getRoleColor(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2">{user.team}</td>
                                            <td className="py-3 px-2">
                                                <Badge className={getStatusColor(user.status)}>
                                                    {user.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.permissions.map((perm) => (
                                                        <Badge key={perm} variant="outline" className="text-xs">
                                                            {perm}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-xs text-gray-500">
                                                {user.last_login}
                                            </td>
                                            <td className="py-3 px-2">
                                                <Button variant="outline" size="sm">
                                                    Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users2 className="w-5 h-5" />
                            Team Management
                        </CardTitle>
                        <CardDescription>
                            Organize users into teams for better collaboration
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {['Engineering', 'Analytics', 'Marketing', 'Sales', 'Support'].map((team) => (
                                <Card key={team} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">{team}</CardTitle>
                                        <CardDescription>
                                            {users.filter(u => u.team === team).length} members
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {users
                                                .filter(u => u.team === team)
                                                .slice(0, 3)
                                                .map((user) => (
                                                    <div key={user.id} className="flex items-center justify-between">
                                                        <span className="text-sm">{user.username}</span>
                                                        <Badge className={getRoleColor(user.role)}>
                                                            {user.role}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            {users.filter(u => u.team === team).length > 3 && (
                                                <div className="text-xs text-gray-500 text-center pt-2">
                                                    +{users.filter(u => u.team === team).length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            <div className="flex justify-end space-x-3">
                <Button onClick={() => router.push('/dashboard')}>
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
}

export default function page() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading user management...</span>
            </div>
        }>
            <AddUserContent />
        </Suspense>
    );
}