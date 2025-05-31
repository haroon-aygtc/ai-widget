import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  Shield,
  User,
  Loader2,
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

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchQuery) params.append("search", searchQuery);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", currentPage.toString());

      const response = await api.get(`/users?${params.toString()}`);

      if (response.data.data) {
        setUsers(response.data.data);
        setTotalPages(Math.ceil(response.data.total / response.data.per_page));
      } else {
        setUsers(response.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!selectedUser && !formData.password.trim())
      errors.password = "Password is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    try {
      const response = await api.post("/users", {
        ...formData,
        password_confirmation: formData.password,
      });

      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(
          ([key, messages]: [string, any]) => {
            backendErrors[key] = Array.isArray(messages)
              ? messages[0]
              : messages;
          },
        );
        setFormErrors(backendErrors);
      }
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !validateForm()) return;

    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      await api.put(`/users/${selectedUser.id}`, updateData);

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsEditDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(
          ([key, messages]: [string, any]) => {
            backendErrors[key] = Array.isArray(messages)
              ? messages[0]
              : messages;
          },
        );
        setFormErrors(backendErrors);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/users/${id}`);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/users/${id}/toggle-status`);
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
    });
    setFormErrors({});
    setSelectedUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6 bg-background">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">User Management</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="w-full md:w-[150px]">
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-[150px]">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found.
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 bg-muted p-4 font-medium">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-12 p-4 border-t items-center"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant={user.role === "admin" ? "default" : "outline"}
                      className="capitalize"
                    >
                      {user.role === "admin" && (
                        <Shield className="h-3 w-3 mr-1" />
                      )}
                      {user.role === "user" && (
                        <User className="h-3 w-3 mr-1" />
                      )}
                      {user.role}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    {user.status === "active" || !user.status ? (
                      <Badge variant="default" className="bg-green-500">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(user)}
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(user.id)}
                      title={
                        user.status === "active" ? "Deactivate" : "Activate"
                      }
                    >
                      {user.status === "active" ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page > totalPages) return null;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                      disabled={loading}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with appropriate permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter full name"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter password"
                className={formErrors.password ? "border-red-500" : ""}
              />
              {formErrors.password && (
                <p className="text-sm text-red-500">{formErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "user") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger
                  className={formErrors.role ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-500">{formErrors.role}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Full Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter full name"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_password">Password</Label>
              <Input
                id="edit_password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Leave blank to keep current password"
                className={formErrors.password ? "border-red-500" : ""}
              />
              {formErrors.password && (
                <p className="text-sm text-red-500">{formErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "user") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger
                  className={formErrors.role ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-500">{formErrors.role}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
