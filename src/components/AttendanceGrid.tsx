"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isWeekend } from "date-fns";

interface AttendanceGridProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
}

export function AttendanceGrid({ currentDate, setCurrentDate }: AttendanceGridProps) {
    const { users, categories, holidays, getAttendance, updateAttendance } = useApp();

    // Filter active categories for selection and legend
    const activeCategories = categories.filter(c => c.isActive !== false); // Handle undefined as true for legacy

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const isHoliday = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return holidays.some((h) => h.date.split("T")[0] === dateStr);
    };

    const isBlocked = (date: Date) => {
        return isWeekend(date) || isHoliday(date);
    };

    const handleStatusClick = (userId: string, date: string) => {
        const currentCode = getAttendance(userId, date);

        // Find next category from ACTIVE categories only
        let nextCategory;
        if (!currentCode) {
            // Default to "On Site" (OS) if available and active, otherwise first active category
            nextCategory = activeCategories.find(c => c.code === "OS") || activeCategories[0];
        } else {
            const currentIndex = activeCategories.findIndex(c => c.code === currentCode);

            if (currentIndex === -1) {
                // Current category is inactive or not found, start over with first active
                nextCategory = activeCategories[0];
            } else {
                const nextIndex = (currentIndex + 1) % (activeCategories.length + 1);
                nextCategory = nextIndex < activeCategories.length ? activeCategories[nextIndex] : undefined;
            }
        }

        if (nextCategory) {
            updateAttendance({ userId, date, categoryId: nextCategory.id });
        } else {
            // Clear status (cycle to empty)
            // If we want to loop back to start immediately without empty state:
            // updateAttendance({ userId, date, categoryId: activeCategories[0].id });

            // Current implementation: Allow clearing (undefined)
            updateAttendance({ userId, date, categoryId: activeCategories[0].id });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-800">
                    {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                        <tr>
                            <th className="p-3 min-w-[80px] sticky left-0 bg-gray-50 z-10 border-r">ID</th>
                            <th className="p-3 min-w-[120px] sticky left-[80px] bg-gray-50 z-10 border-r">Surname</th>
                            <th className="p-3 min-w-[120px] sticky left-[200px] bg-gray-50 z-10 border-r">Name</th>
                            <th className="p-3 min-w-[80px] border-r">Dept</th>
                            {daysInMonth.map((day) => {
                                const isDayBlocked = isBlocked(day);
                                return (
                                    <th
                                        key={day.toISOString()}
                                        className={cn(
                                            "p-2 text-center min-w-[40px] border-r",
                                            isDayBlocked && "bg-gray-200"
                                        )}
                                        title={isHoliday(day) ? "Holiday" : undefined}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span>{format(day, "d")}</span>
                                            <span className="text-xs text-gray-500">{format(day, "EEE")}</span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">{user.am}</td>
                                <td className="p-3 sticky left-[80px] bg-white z-10 border-r">{user.surname}</td>
                                <td className="p-3 sticky left-[200px] bg-white z-10 border-r">{user.name}</td>
                                <td className="p-3 border-r">{user.department?.name}</td>
                                {daysInMonth.map((day) => {
                                    const dateStr = format(day, "yyyy-MM-dd");
                                    const code = getAttendance(user.id, dateStr);
                                    const category = categories.find(c => c.code === code);

                                    // Check employment dates
                                    // Check employment dates
                                    // Use string comparison (YYYY-MM-DD) to avoid timezone issues
                                    const startDateStr = new Date(user.startDate).toISOString().split('T')[0];

                                    let isEmploymentBlocked = false;
                                    if (dateStr < startDateStr) {
                                        isEmploymentBlocked = true;
                                    } else if (user.endDate) {
                                        const endDateStr = new Date(user.endDate).toISOString().split('T')[0];
                                        if (dateStr > endDateStr) {
                                            isEmploymentBlocked = true;
                                        }
                                    }

                                    const isDayBlocked = isBlocked(day) || isEmploymentBlocked;

                                    return (
                                        <td
                                            key={dateStr}
                                            className={cn(
                                                "p-1 text-center border-r transition-colors",
                                                isDayBlocked ? "bg-gray-200 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100",
                                                isEmploymentBlocked && "bg-gray-300" // Darker gray for employment blocked
                                            )}
                                            onClick={() => !isDayBlocked && handleStatusClick(user.id, dateStr)}
                                        >
                                            {category && !isDayBlocked && (
                                                <div
                                                    className={cn(
                                                        "w-full h-8 flex items-center justify-center rounded text-xs font-bold border",
                                                        category.color // Assuming color is a full Tailwind class string like "bg-blue-100 text-blue-800 border-blue-200"
                                                    )}
                                                >
                                                    {category.code}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t">
                        <tr>
                            <td colSpan={4} className="p-3 text-right text-gray-700 sticky left-0 bg-gray-50 z-10 border-r">Total On Site:</td>
                            {daysInMonth.map((day) => {
                                const dateStr = format(day, "yyyy-MM-dd");
                                const countOS = users.reduce((acc, user) => {
                                    return getAttendance(user.id, dateStr) === "OS" ? acc + 1 : acc;
                                }, 0);

                                return (
                                    <td key={dateStr} className="p-2 text-center border-r text-green-700 bg-green-50">
                                        {countOS}
                                    </td>
                                );
                            })}
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex gap-4 flex-wrap">
                {activeCategories.map((category) => (
                    <div key={category.id} className="flex items-center gap-2">
                        <div
                            className={cn(
                                "w-8 h-8 flex items-center justify-center rounded text-xs font-bold border",
                                category.color
                            )}
                        >
                            {category.code}
                        </div>
                        <span className="text-sm text-gray-600">{category.label}</span>
                    </div>
                ))}
            </div>
        </div >
    );
}
