import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className = "",
}) => {
    return (
        <Card className={className}>
            <CardContent className="py-12">
                <div className="text-center">
                    <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground">
                        {icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-muted-foreground mb-4">{description}</p>
                    {actionLabel && onAction && (
                        <Button onClick={onAction}>{actionLabel}</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default EmptyState; 