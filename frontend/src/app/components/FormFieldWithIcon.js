"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function FormFieldWithIcon({ icon: Icon, label, type = "text", placeholder, value, onChange, required = false, id, error, className = "" }) {
    return (
        <div className="flex flex-col space-y-2">
            <Label htmlFor={id} className="text-neutral-300 flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                {label}
            </Label>
            <Input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className={`premium-input h-12 text-white placeholder:text-neutral-600 ${className}`}
            />
            {error && <span className="text-red-400 text-xs">{error}</span>}
        </div>
    );
}
