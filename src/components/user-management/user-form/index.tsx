import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Eye,
    EyeOff,
    Save,
    Shield,
    User,
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

interface FormData {
    name: string;
    email: string;
    password: string;
    role: "admin" | "user";
    status: "active" | "inactive";
}

interface UserFormProps {
    mode: "create" | "edit";
    user?: User | null;
    formData: FormData;
    formErrors: Record<string, string>;
    onFormDataChange: (data: FormData) => void;
    onSubmit: () => void;
    onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
    mode,
    user,
    formData,
    formErrors,
    onFormDataChange,
    onSubmit,
    onCancel,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleFieldChange = (field: keyof FormData, value: any) => {
        onFormDataChange({ ...formData, [field]: value });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold">
                            {mode === "create" ? "Create New User" : "Edit User"}
                        </h2>
                        <p className="text-muted-foreground">
                            {mode === "create"
                                ? "Add a new team member to your organization"
                                : "Update user information and permissions"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit}>
                        <Save className="h-4 w-4 mr-2" />
                        {mode === "create" ? "Create User" : "Update User"}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions & Access</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Basic user details and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleFieldChange("name", e.target.value)}
                                        placeholder="Enter full name"
                                        className={formErrors.name ? "border-red-500" : ""}
                                    />
                                    {formErrors.name && (
                                        <p className="text-sm text-red-500">{formErrors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleFieldChange("email", e.target.value)}
                                        placeholder="Enter email address"
                                        className={formErrors.email ? "border-red-500" : ""}
                                    />
                                    {formErrors.email && (
                                        <p className="text-sm text-red-500">{formErrors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {mode === "create"
                                        ? "Password"
                                        : "New Password (leave blank to keep current)"}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) =>
                                            handleFieldChange("password", e.target.value)
                                        }
                                        placeholder={
                                            mode === "create"
                                                ? "Enter password"
                                                : "Enter new password"
                                        }
                                        className={formErrors.password ? "border-red-500" : ""}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {formErrors.password && (
                                    <p className="text-sm text-red-500">{formErrors.password}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Permissions</CardTitle>
                            <CardDescription>
                                Configure user role and account status
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="role">User Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value: "admin" | "user") =>
                                        handleFieldChange("role", value)
                                    }
                                >
                                    <SelectTrigger
                                        className={formErrors.role ? "border-red-500" : ""}
                                    >
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <div>
                                                    <div className="font-medium">User</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Standard access
                                                    </div>
                                                </div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                <div>
                                                    <div className="font-medium">Administrator</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Full system access
                                                    </div>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {formErrors.role && (
                                    <p className="text-sm text-red-500">{formErrors.role}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Account Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: "active" | "inactive") =>
                                        handleFieldChange("status", value)
                                    }
                                >
                                    <SelectTrigger
                                        className={formErrors.status ? "border-red-500" : ""}
                                    >
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <div>
                                                    <div className="font-medium">Active</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        User can access the system
                                                    </div>
                                                </div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            <div className="flex items-center gap-2">
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                <div>
                                                    <div className="font-medium">Inactive</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        User access is disabled
                                                    </div>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {formErrors.status && (
                                    <p className="text-sm text-red-500">{formErrors.status}</p>
                                )}
                            </div>

                            {formData.role === "admin" && (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                                                Administrator Access
                                            </h4>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                                This user will have full administrative privileges
                                                including user management, system settings, and access to
                                                all features.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default UserForm; 