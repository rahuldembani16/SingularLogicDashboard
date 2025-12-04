"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isWeekend } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

export default function UserAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const { users, categories, holidays, getAttendance, updateAttendance } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());

    const user = users.find((u) => u.id === params.id);

    if (!user) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">User not found</h2>
                <button
                    onClick={() => router.push("/portal")}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    Back to Portal
                </button>
            </div>
        );
    }

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const isHoliday = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return holidays.some((h) => h.date.split("T")[0] === dateStr);
    };

    const isBlocked = (date: Date) => {
        // Check employment dates
        const dateStr = format(date, "yyyy-MM-dd");

        // Compare with startDate
        // Ensure we compare YYYY-MM-DD strings to avoid timezone issues
        const startDateStr = new Date(user.startDate).toISOString().split('T')[0];
        if (dateStr < startDateStr) return true;

        if (user.endDate) {
            const endDateStr = new Date(user.endDate).toISOString().split('T')[0];
            if (dateStr > endDateStr) return true;
        }

        return isWeekend(date) || isHoliday(date);
    };

    const handleStatusClick = (date: string) => {
        const currentCode = getAttendance(user.id, date);
        const currentCategory = categories.find(c => c.code === currentCode);

        // Find next category
        let nextCategory;
        if (!currentCode) {
            // Default to "On Site" (OS) if available, otherwise first category
            nextCategory = categories.find(c => c.code === "OS") || categories[0];
        } else {
            const currentIndex = categories.findIndex(c => c.code === currentCode);
            const nextIndex = (currentIndex + 1) % (categories.length + 1);
            nextCategory = nextIndex < categories.length ? categories[nextIndex] : undefined;
        }

        if (nextCategory) {
            updateAttendance({ userId: user.id, date, categoryId: nextCategory.id });
        } else {
            updateAttendance({ userId: user.id, date, categoryId: categories[0].id });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/portal")}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {user.surname} {user.name}
                        </h1>
                        <p className="text-gray-500">
                            {user.department?.name} • AM: {user.am} • {format(currentDate, "MMMM yyyy")}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                        className="p-2 hover:bg-gray-100 rounded-full border shadow-sm"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                        className="p-2 hover:bg-gray-100 rounded-full border shadow-sm"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {daysInMonth.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const code = getAttendance(user.id, dateStr);
                        const category = categories.find(c => c.code === code);
                        const isDayBlocked = isBlocked(day);

                        return (
                            <div
                                key={dateStr}
                                onClick={() => !isDayBlocked && handleStatusClick(dateStr)}
                                className={cn(
                                    "border rounded-lg p-4 flex flex-col items-center gap-2 transition-all",
                                    isDayBlocked ? "bg-gray-50 opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-md hover:border-blue-300 bg-white",
                                    category && !isDayBlocked && category.color.replace("text-", "border-") // Add border color based on status
                                )}
                                title={isHoliday(day) ? "Holiday" : undefined}
                            >
                                <div className="text-center">
                                    <span className="block text-sm font-medium text-gray-900">{format(day, "EEE")}</span>
                                    <span className="block text-2xl font-bold text-gray-700">{format(day, "d")}</span>
                                </div>

                                {!isDayBlocked && (
                                    <div
                                        className={cn(
                                            "w-full py-1 px-2 rounded text-xs font-bold text-center transition-colors",
                                            category ? category.color : "bg-gray-100 text-gray-400"
                                        )}
                                    >
                                        {category ? category.label : "Select"}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-4 flex-wrap justify-center">
                {categories.map((category) => (
                    <div key={category.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                        <div
                            className={cn(
                                "w-3 h-3 rounded-full",
                                category.color.split(" ")[0].replace("bg-", "bg-") // Extract bg color
                            )}
                        />
                        <span className="text-sm font-medium text-gray-700">{category.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
