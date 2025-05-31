import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import SearchInput from "@/components/shared/search-input";
import FilterSelect from "@/components/shared/filter-select";

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchInput
            placeholder="Search users..."
            value={searchQuery}
            onChange={onSearchChange}
            className="flex-1"
          />

          <div className="flex gap-2">
            <FilterSelect
              value={roleFilter}
              onChange={onRoleFilterChange}
              options={roleOptions}
              className="w-[150px]"
            />

            <FilterSelect
              value={statusFilter}
              onChange={onStatusFilterChange}
              options={statusOptions}
              className="w-[150px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserFilters; 