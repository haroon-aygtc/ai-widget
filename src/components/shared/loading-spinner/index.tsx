import React from "react";

interface LoadingSpinnerProps {
    message?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = "Loading...",
    size = "md",
    className = "",
}) => {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
    };

    return (
        <div className={`flex justify-center items-center py-12 ${className}`}>
            <div className="text-center">
                <div
                    className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4`}
                ></div>
                <p className="text-muted-foreground">{message}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner; 