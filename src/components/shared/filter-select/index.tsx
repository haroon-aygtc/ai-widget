import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FilterOption {
    value: string;
    label: string;
}

interface FilterSelectProps {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    className?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
    placeholder = "Select option",
    value,
    onChange,
    options,
    className = "",
}) => {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default FilterSelect; 