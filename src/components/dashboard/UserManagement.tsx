import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import {
  Plus,
  User,
  Users,
} from "lucide-react";

import LoadingSpinner from "@/components/shared/loading-spinner";
import EmptyState from "@/components/shared/empty-state";
import Pagination from "@/components/shared/pagination";
import UserCard from "@/components/user-management/user-card";
import UserFilters from "@/components/user-management/user-filters";
import UserForm from "@/components/user-management/user-form";
import UserDetails from "@/components/user-management/user-details";

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

type ViewMode = 'list' | 'create' | 'edit' | 'view';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    role: "user",
    status: "active",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: currentPage.toString(),
        per_page: "10",
        sort_by: "created_at",
        sort_order: "desc",
      };

      if (searchQuery) params.search = searchQuery;
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await apiClient.get('/users', { params });

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
        description: error.response?.data?.error || "Failed to load users",
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
      await apiClient.post('/users', {
        ...formData,
        password_confirmation: formData.password,
      });

      toast({
        title: "Success",
        description: "User created successfully",
      });
      resetForm();
      setViewMode('list');
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to create user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(
          ([key, messages]: [string, any]) => {
            backendErrors[key] = Array.isArray(messages) ? messages[0] : messages;
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

      await apiClient.put(`/users/${selectedUser.id}`, updateData);

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      resetForm();
      setViewMode('list');
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to update user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(
          ([key, messages]: [string, any]) => {
            backendErrors[key] = Array.isArray(messages) ? messages[0] : messages;
          },
        );
        setFormErrors(backendErrors);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await apiClient.delete(`/users/${id}`);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await apiClient.put(`/users/${id}/toggle-status`);
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const openEditMode = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status || "active",
    });
    setFormErrors({});
    setViewMode('edit');
  };

  const openViewMode = (user: User) => {
    setSelectedUser(user);
    setViewMode('view');
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      status: "active",
    });
    setFormErrors({});
    setSelectedUser(null);
    setShowPassword(false);
  };

  const openCreateMode = () => {
    resetForm();
    setViewMode('create');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Render different views based on current mode
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <UserForm
        mode={viewMode}
        user={selectedUser}
        formData={formData}
        formErrors={formErrors}
        onFormDataChange={setFormData}
        onSubmit={viewMode === 'create' ? handleCreateUser : handleUpdateUser}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  if (viewMode === 'view') {
    return (
      <UserDetails
        user={selectedUser}
        onEdit={openEditMode}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteUser}
        onBack={() => setViewMode('list')}
      />
    );
  }

  // Main list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage team members and their access permissions
          </p>
        </div>
        <Button onClick={openCreateMode} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Filters */}
      <UserFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
      />

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading users..." />
      ) : (users || []).length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No users found"
          description="Get started by adding your first team member."
          actionLabel="Add Your First User"
          onAction={openCreateMode}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(users || []).map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onView={openViewMode}
              onEdit={openEditMode}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteUser}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading}
      />
    </div>
  );
};

export default UserManagement;
