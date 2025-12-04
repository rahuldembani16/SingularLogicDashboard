import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const categoryId = searchParams.get("categoryId");

        if (!from || !to) {
            return NextResponse.json(
                { error: "Date range (from, to) is required" },
                { status: 400 }
            );
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);
        // Adjust toDate to include the entire day
        toDate.setHours(23, 59, 59, 999);

        // 1. Fetch all users
        const users = await prisma.user.findMany({
            include: {
                department: true,
            },
            orderBy: {
                surname: "asc",
            },
        });

        // 2. Fetch attendance records
        const attendanceWhere: Prisma.AttendanceWhereInput = {
            date: {
                gte: fromDate,
                lte: toDate,
            },
        };

        if (categoryId && categoryId !== "all") {
            attendanceWhere.categoryId = categoryId;
        }

        const attendanceRecords = await prisma.attendance.findMany({
            where: attendanceWhere,
            include: {
                category: true,
            },
        });

        // Map attendance by userId and date string (YYYY-MM-DD)
        const attendanceMap = new Map<string, string>();
        attendanceRecords.forEach((record) => {
            const dateStr = record.date.toISOString().split("T")[0];
            const key = `${record.userId}_${dateStr}`;
            attendanceMap.set(key, record.category.code);
        });

        // 3. Generate Date Range
        const dates: Date[] = [];
        const currentDate = new Date(fromDate);
        while (currentDate <= toDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Attendance Matrix");

        // 4. Define Columns
        const columns = [
            { header: "ID", key: "am", width: 10 },
            { header: "Surname", key: "surname", width: 20 },
            { header: "Name", key: "name", width: 20 },
            { header: "Department", key: "department", width: 15 },
        ];

        // Add date columns
        dates.forEach((date) => {
            const dateStr = date.toISOString().split("T")[0];
            columns.push({ header: dateStr, key: dateStr, width: 5 });
        });

        worksheet.columns = columns;

        // 5. Add Rows
        users.forEach((user) => {
            const rowData: any = {
                am: user.am,
                surname: user.surname,
                name: user.name,
                department: user.department?.name || "",
            };

            // Prepare employment dates
            const startDate = new Date(user.startDate);
            startDate.setHours(0, 0, 0, 0);

            let endDate: Date | null = null;
            if (user.endDate) {
                endDate = new Date(user.endDate);
                endDate.setHours(0, 0, 0, 0);
            }

            dates.forEach((date) => {
                const dateStr = date.toISOString().split("T")[0];
                const key = `${user.id}_${dateStr}`;
                const categoryCode = attendanceMap.get(key);

                // Check if date is within employment period
                const checkDate = new Date(date);
                checkDate.setHours(0, 0, 0, 0);

                let isBlocked = false;
                if (checkDate < startDate) isBlocked = true;
                if (endDate && checkDate > endDate) isBlocked = true;

                if (!isBlocked) {
                    rowData[dateStr] = categoryCode || "";
                } else {
                    rowData[dateStr] = ""; // Don't show data for blocked days
                }
            });

            const row = worksheet.addRow(rowData);

            // Style cells
            dates.forEach((date, index) => {
                const day = date.getDay();
                const colIndex = 5 + index;
                const cell = row.getCell(colIndex);

                // Check blocked again for styling
                const checkDate = new Date(date);
                checkDate.setHours(0, 0, 0, 0);

                let isBlocked = false;
                if (checkDate < startDate) isBlocked = true;
                if (endDate && checkDate > endDate) isBlocked = true;

                if (isBlocked) {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFEEEEEE" }, // Very Light Gray for non-employment
                    };
                } else if (day === 0 || day === 6) {
                    // 0 is Sunday, 6 is Saturday
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFD3D3D3" }, // Light Gray for weekends
                    };
                }
            });
        });

        // Style header
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };

        // Rotate date headers for better visibility
        for (let i = 5; i <= columns.length; i++) {
            headerRow.getCell(i).alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center' };
        }


        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="Attendance_Matrix_${from}_to_${to}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Error generating report:", error);
        return NextResponse.json(
            { error: "Failed to generate report" },
            { status: 500 }
        );
    }
}
