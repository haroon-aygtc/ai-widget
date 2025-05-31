import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Calendar,
    CheckCircle,
    Crown,
    Edit,
    Eye,
    Mail,
    MoreVertical,
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

interface UserCardProps {
    user: User;
    onView: (user: User) => void;
    onEdit: (user: User) => void;
    onToggleStatus: (id: string) => void;
    onDelete: (id: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
    user,
    onView,
    onEdit,
    onToggleStatus,
    onDelete,
}) => {
    return (
        <Card className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {user.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                {user.name}
                                {user.role === "admin" && (
                                    <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                            </CardDescription>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggleStatus(user.id)}>
                                {user.status === "active" ? (
                                    <>
                                        <UserX className="mr-2 h-4 w-4" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Activate
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(user.id)}
                                className="text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Badge
                            variant={user.role === "admin" ? "default" : "outline"}
                            className="capitalize"
                        >
                            {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                            {user.role === "user" && <User className="h-3 w-3 mr-1" />}
                            {user.role}
                        </Badge>
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
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.created_at).toLocaleDateString()}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserCard; 