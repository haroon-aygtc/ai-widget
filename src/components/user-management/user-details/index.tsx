import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Crown,
    Edit,
    Mail,
    RefreshCw,
    Shield,
    Trash2,
    User,
    UserCheck,
    UserX,
    XCircle,
} from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
    avatar?: string;
    status?: "active" | "inactive";
    created_at: string;
    updated_at?: string;
    email_verified_at?: string;
}

interface UserDetailsProps {
    user: User | null;
    onEdit: (user: User) => void;
    onToggleStatus: (id: string) => void;
    onDelete: (id: string) => void;
    onBack: () => void;
}

export const UserDetails: React.FC<UserDetailsProps> = ({
    user,
    onEdit,
    onToggleStatus,
    onDelete,
    onBack,
}) => {
    if (!user) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold">User Details</h2>
                        <p className="text-muted-foreground">
                            View detailed information about this user
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => onEdit(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit User
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                        {user.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-semibold flex items-center gap-2">
                                        {user.name}
                                        {user.role === "admin" && (
                                            <Crown className="h-5 w-5 text-yellow-500" />
                                        )}
                                    </h3>
                                    <p className="text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Role</Label>
                                    <div className="mt-1">
                                        <Badge
                                            variant={user.role === "admin" ? "default" : "outline"}
                                            className="capitalize"
                                        >
                                            {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                                            {user.role === "user" && <User className="h-3 w-3 mr-1" />}
                                            {user.role}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">
                                        {user.status === "active" || !user.status ? (
                                            <Badge variant="default" className="bg-green-500">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Inactive
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Account Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Account Created</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {user.updated_at && (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                        <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Last Updated</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(user.updated_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {user.email_verified_at && (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Email Verified</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(user.email_verified_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => onEdit(user)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => onToggleStatus(user.id)}
                            >
                                {user.status === "active" ? (
                                    <>
                                        <UserX className="h-4 w-4 mr-2" />
                                        Deactivate User
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Activate User
                                    </>
                                )}
                            </Button>
                            <Separator />
                            <Button
                                variant="outline"
                                className="w-full justify-start text-red-600 hover:text-red-700"
                                onClick={() => onDelete(user.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {user.role === 'admin' ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Shield className="h-4 w-4 text-primary" />
                                        <span>Full administrative access</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>Standard user access</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UserDetails; 