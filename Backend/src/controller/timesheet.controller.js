// ============================================
// COMPLETE FIXED UPLOAD CONTROLLER
// ============================================

const xlsx = require('xlsx');
const { query } = require("../config/db");

function generateBatchCode() {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-8);
    return `BATCH-${timestamp}`;
}

// SIMPLE DATE PARSER - NO TIMEZONE ISSUES
function parseDate(value) {
    if (!value) return null;
    
    // If it's a number (Excel serial)
    if (typeof value === 'number') {
        const utcDays = value - 25569;
        const d = new Date(utcDays * 86400 * 1000);
        return {
            year: d.getUTCFullYear(),
            month: d.getUTCMonth(),
            day: d.getUTCDate()
        };
    }
    
    // If it's a string
    if (typeof value === 'string') {
        // Try YYYY-MM-DD
        let parts = value.split('-');
        if (parts.length === 3) {
            return {
                year: parseInt(parts[0]),
                month: parseInt(parts[1]) - 1,
                day: parseInt(parts[2])
            };
        }
        // Try DD/MM/YYYY
        parts = value.split('/');
        if (parts.length === 3) {
            return {
                year: parseInt(parts[2]),
                month: parseInt(parts[1]) - 1,
                day: parseInt(parts[0])
            };
        }
    }
    
    return null;
}

const uploadTimesheet = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        if (!data || data.length === 0) {
            return res.status(400).json({ message: "Excel file is empty" });
        }

        const batchCode = generateBatchCode();
        const userId = req.user.id;
        
        const batchResult = await query(
            `INSERT INTO timesheet_batches 
             (batch_code, uploaded_by, file_name, total_records, status) 
             VALUES (?, ?, ?, ?, 'draft')`,
            [batchCode, userId, req.file.originalname, data.length]
        );
        
        const batchId = batchResult.insertId;

        const projects = await query(`SELECT id, project_code FROM projects WHERE project_code IS NOT NULL`);
        const users = await query(`SELECT id, emp_id FROM users WHERE emp_id IS NOT NULL`);
        
        const projectMap = new Map(projects.map(p => [p.project_code, p.id]));
        const userMap = new Map(users.map(u => [u.emp_id, u.id]));

        let totalEntries = 0;
        let employeeNotFoundCount = 0;
        let projectNotFoundCount = 0;
        let noHoursCount = 0;
        let invalidDateCount = 0;
        const missingEmployees = new Set();
        const missingProjects = new Set();

        for (const row of data) {
            const employeeCode = String(row['Employee Code'] || '').trim();
            const projectCode = String(row['Project Code'] || '').trim();
            
            // Parse dates using the simple function
            const fromDate = parseDate(row['From Date']);
            const toDate = parseDate(row['To Date']);
            
            if (!fromDate || !toDate) {
                invalidDateCount++;
                continue;
            }
            
            const employeeId = employeeCode ? userMap.get(employeeCode) || null : null;
            const projectId = projectCode ? projectMap.get(projectCode) || null : null;
            
            if (employeeCode && !employeeId) {
                employeeNotFoundCount++;
                missingEmployees.add(employeeCode);
            }
            if (projectCode && !projectId) {
                projectNotFoundCount++;
                missingProjects.add(projectCode);
            }

            // Process Monday to Friday
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            let hasEntries = false;

            // Use the parsed date parts
            const baseYear = fromDate.year;
            const baseMonth = fromDate.month;
            const baseDay = fromDate.day;

            for (let i = 0; i < days.length; i++) {
                const day = days[i];
                const hours = parseFloat(row[day]) || 0;
                const description = String(row[`${day}s Description`] || '').trim();
                
                if (hours > 0) {
                    hasEntries = true;
                    totalEntries++;
                    
                    // Create date using parts - NO TIMEZONE ISSUES
                    const entryDate = new Date(baseYear, baseMonth, baseDay + i);
                    const formattedDate = 
                        entryDate.getFullYear() + '-' +
                        String(entryDate.getMonth() + 1).padStart(2, '0') + '-' +
                        String(entryDate.getDate()).padStart(2, '0');
                    
                    let reconStatus = 'pending';
                    if (!employeeId) reconStatus = 'missing_employee';
                    else if (!projectId) reconStatus = 'missing_project';
                    
                    await query(
                        `INSERT INTO timesheet_entries 
                         (batch_id, user_id, original_emp_code, project_id, original_project_code, 
                          entry_date, hours, description, day_of_week, employee_found, project_found, reconciliation_status) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            batchId, employeeId, employeeCode, projectId, projectCode,
                            formattedDate, hours, description, day,
                            employeeId ? 1 : 0, projectId ? 1 : 0, reconStatus
                        ]
                    );
                }
            }
            
            if (!hasEntries) noHoursCount++;
        }

        const totalInvalid = employeeNotFoundCount + projectNotFoundCount + invalidDateCount;
        await query(
            `UPDATE timesheet_batches 
             SET valid_records = ?, invalid_records = ? 
             WHERE id = ?`,
            [data.length - totalInvalid, totalInvalid, batchId]
        );

        res.status(200).json({
            success: true,
            message: "Timesheet uploaded successfully.",
            data: {
                batch_id: batchId,
                batch_code: batchCode,
                total_records: data.length,
                total_entries_stored: totalEntries,
                status: 'draft'
            },
            warnings: {
                employee_not_found: {
                    count: employeeNotFoundCount,
                    employees: Array.from(missingEmployees),
                    message: "These employees need to be added to the system"
                },
                project_not_found: {
                    count: projectNotFoundCount,
                    projects: Array.from(missingProjects),
                    message: "These projects need to be created in the system"
                },
                no_hours: {
                    count: noHoursCount,
                    message: "Rows with zero hours logged"
                },
                invalid_dates: {
                    count: invalidDateCount,
                    message: "Rows with invalid dates"
                }
            }
        });

    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ 
            message: "Error processing upload", 
            error: err.message 
        });
    }
};

// ============================================
// GET ALL BATCHES
// ============================================
const getBatches = async (req, res, next) => {
    try {
        const batches = await query(`
            SELECT tb.*, u.name as uploaded_by_name,
                   COUNT(te.id) as total_entries,
                   MIN(te.entry_date) as earliest_date,
                   MAX(te.entry_date) as latest_date
            FROM timesheet_batches tb
            LEFT JOIN users u ON tb.uploaded_by = u.id
            LEFT JOIN timesheet_entries te ON te.batch_id = tb.id
            GROUP BY tb.id
            ORDER BY tb.created_at DESC
        `);
        
        res.status(200).json({
            success: true,
            data: batches
        });
    } catch (err) {
        next(err);
    }
};

// ============================================
// GET BATCH DETAILS
// ============================================
const getBatchDetails = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        
        const batch = await query(`
            SELECT tb.*, u.name as uploaded_by_name 
            FROM timesheet_batches tb
            LEFT JOIN users u ON tb.uploaded_by = u.id
            WHERE tb.id = ?
        `, [batchId]);
        
        if (batch.length === 0) {
            return res.status(404).json({ message: "Batch not found" });
        }
        
        const entries = await query(`
            SELECT 
                te.*, 
                u.name as employee_name, 
                u.emp_id, 
                p.project_name, 
                p.project_code
            FROM timesheet_entries te
            LEFT JOIN users u ON te.user_id = u.id
            LEFT JOIN projects p ON te.project_id = p.id
            WHERE te.batch_id = ?
            ORDER BY te.entry_date, te.user_id
        `, [batchId]);
        
        const summary = {
            total_entries: entries.length,
            total_hours: entries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0),
            unique_employees: new Set(entries.map(e => e.user_id || e.original_emp_code)).size,
            unique_projects: new Set(entries.map(e => e.project_id || e.original_project_code)).size,
            missing_employees: entries.filter(e => e.employee_found === 0).length,
            missing_projects: entries.filter(e => e.project_found === 0).length
        };
        
        res.status(200).json({
            success: true,
            batch: batch[0],
            summary: summary,
            entries: entries
        });
    } catch (err) {
        next(err);
    }
};



const getProjectReconciliation = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        
        // 1. Get project info
        const project = await query(
            `SELECT id, project_code, project_name FROM projects WHERE id = ?`,
            [projectId]
        );
        
        const projectExists = project.length > 0;
        const projectCode = projectExists ? project[0].project_code : null;
        
        // 2. Get ALL effort estimates for this project (SUM)
        const effortSummary = await query(
            `SELECT 
                SUM(total_hrs) as total_estimated_hrs,
                SUM(effort_days + buffer_days) as total_estimated_days, 
                COUNT(*) as role_count,
                GROUP_CONCAT(role ORDER BY role) as roles
             FROM effort_estimates 
             WHERE project_id = ?`,
            [projectId]
        );
        
        const hasEffortEstimate = effortSummary.length > 0 && effortSummary[0].total_estimated_hrs > 0;
        
        let totalEstimatedHrs = 0;
        let totalEstimatedDays = 0;
        let roleCount = 0;
        let roles = [];
        
        if (hasEffortEstimate) {
            totalEstimatedHrs = parseFloat(effortSummary[0].total_estimated_hrs || 0);
            totalEstimatedDays = parseFloat(effortSummary[0].total_estimated_days || 0);
            roleCount = parseInt(effortSummary[0].role_count || 0);
            roles = effortSummary[0].roles ? effortSummary[0].roles.split(',') : [];
        }
        
        // 3. Get role-wise effort details
        const effortDetails = await query(
            `SELECT role, total_hrs, effort_days, effort_hrs, buffer_days, (effort_days + buffer_days) as total_days, buffer_hrs, units, unit_label
             FROM effort_estimates 
             WHERE project_id = ?
             ORDER BY role`,
            [projectId]
        );
        
        // 4. Get all timesheet entries for this project
        const timesheets = await query(
            `SELECT 
                te.*,
                u.name as employee_name,
                u.emp_id
            FROM timesheet_entries te
            LEFT JOIN users u ON te.user_id = u.id
            WHERE te.project_id = ? OR te.original_project_code = ?
            ORDER BY te.entry_date`,
            [projectId, projectCode]
        );
        
        // 5. Calculate timesheet summary
        let totalActualHrs = 0;
        let employeeMap = {};
        
        if (timesheets.length > 0) {
            totalActualHrs = timesheets.reduce((sum, t) => sum + parseFloat(t.hours || 0), 0);
            
            // Employee breakdown
            for (const entry of timesheets) {
                const key = entry.user_id || entry.original_emp_code;
                if (!employeeMap[key]) {
                    employeeMap[key] = {
                        user_id: entry.user_id,
                        emp_id: entry.emp_id || entry.original_emp_code,
                        name: entry.employee_name || 'Unknown',
                        actual_hrs: 0,
                        entries: 0
                    };
                }
                employeeMap[key].actual_hrs += parseFloat(entry.hours || 0);
                employeeMap[key].entries += 1;
            }
        }
        
        const totalActualDays = totalActualHrs / 8;
        const employeeBreakdown = Object.values(employeeMap).map(e => ({
            emp_id: e.emp_id,
            name: e.name,
            actual_hrs: parseFloat(e.actual_hrs.toFixed(2)),
            actual_days: parseFloat((e.actual_hrs / 8).toFixed(2)),
            entries: e.entries
        }));
        
        // 6. Calculate reconciliation
        const utilizedHrs = Math.min(totalActualHrs, totalEstimatedHrs);
        const utilizedDays = Math.min(totalActualDays, totalEstimatedDays);
        const remainingHrs = Math.max(0, totalEstimatedHrs - totalActualHrs);
        const remainingDays = Math.max(0, totalEstimatedDays - totalActualDays);
        const utilizationPercentage = totalEstimatedHrs > 0 ? (totalActualHrs / totalEstimatedHrs) * 100 : 0;
        const varianceHrs = totalEstimatedHrs - totalActualHrs;
        const variancePercentage = totalEstimatedHrs > 0 ? (varianceHrs / totalEstimatedHrs) * 100 : 0;
        
        // 7. Determine status
        let status = 'missing';
        let statusMessage = '';
        let severity = 'high';
        
        if (!projectExists) {
            status = 'missing';
            statusMessage = 'Project not found in system. Please create project.';
            severity = 'critical';
        } else if (!hasEffortEstimate) {
            status = 'missing';
            statusMessage = `No effort estimates found for project. Please add effort estimates.`;
            severity = 'critical';
        } else if (totalActualHrs === 0) {
            status = 'missing';
            statusMessage = 'No timesheet entries found for this project.';
            severity = 'medium';
        } else if (variancePercentage > 20) {
            status = 'under';
            statusMessage = `Project is under-utilized. ${totalActualHrs.toFixed(1)} hrs logged vs ${totalEstimatedHrs.toFixed(1)} hrs estimated. (${variancePercentage.toFixed(1)}% variance)`;
            severity = 'high';
        } else if (variancePercentage < -20) {
            status = 'over';
            statusMessage = `Project is over-utilized. ${totalActualHrs.toFixed(1)} hrs logged vs ${totalEstimatedHrs.toFixed(1)} hrs estimated. (${Math.abs(variancePercentage).toFixed(1)}% variance)`;
            severity = 'medium';
        } else {
            status = 'matched';
            statusMessage = `Project is on track. ${totalActualHrs.toFixed(1)} hrs logged vs ${totalEstimatedHrs.toFixed(1)} hrs estimated.`;
            severity = 'low';
        }
        
        // 8. Response
        res.status(200).json({
            success: true,
            data: {
                project_info: {
                    exists: projectExists,
                    id: projectExists ? project[0].id : null,
                    project_code: projectExists ? project[0].project_code : (timesheets[0]?.original_project_code || 'Unknown'),
                    project_name: projectExists ? project[0].project_name : 'Project Not Found'
                },
                effort_estimates: {
                    exists: hasEffortEstimate,
                    total_estimated_hrs: parseFloat(totalEstimatedHrs.toFixed(2)),
                    total_estimated_days: parseFloat(totalEstimatedDays.toFixed(2)),
                    role_count: roleCount,
                    roles: roles,
                    details: effortDetails.map(e => ({
                        role: e.role,
                        estimated_hrs: parseFloat(e.total_hrs || 0),
                        estimated_days: parseFloat(e.total_days|| 0),
                        effort_hrs: parseFloat(e.effort_hrs || 0),
                        effort_days:parseFloat(e.effort_days || 0),
                        buffer_hrs: parseFloat(e.buffer_hrs || 0),
                        buffer_days:parseFloat(e.buffer_days || 0),
                        units: e.units,
                        // unit_label: e.unit_label
                    }))
                },
                timesheet_summary: {
                    total_employees: employeeBreakdown.length,
                    total_entries: timesheets.length,
                    utilized_hrs: parseFloat(totalActualHrs.toFixed(2)),
                    utilized_days: parseFloat(totalActualDays.toFixed(2))
                },
                reconciliation: {
                    estimated_hrs: parseFloat(totalEstimatedHrs.toFixed(2)),
                    estimated_days: parseFloat(totalEstimatedDays.toFixed(2)),
                    utilized_hrs: parseFloat(utilizedHrs.toFixed(2)),
                    utilized_days: parseFloat(utilizedDays.toFixed(2)),
                    remaining_hrs: parseFloat(remainingHrs.toFixed(2)),
                    remaining_days: parseFloat(remainingDays.toFixed(2)),
                    utilization_percentage: parseFloat(utilizationPercentage.toFixed(2)),
                    variance_hrs: parseFloat(varianceHrs.toFixed(2)),
                    variance_percentage: parseFloat(variancePercentage.toFixed(2)),
                    status: status,
                    message: statusMessage,
                    
                },
                // employee_breakdown: employeeBreakdown
            }
        });
        
    } catch (err) {
        console.error("Project reconciliation error:", err);
        next(err);
    }
};
const getEmployeeReconciliation = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { projectId } = req.query;
        
        // 1. Get employee info
        const employee = await query(
            `SELECT id, emp_id, name, email FROM users WHERE id = ?`,
            [userId]
        );
        
        const employeeExists = employee.length > 0;
        
        // 2. Get all assignments for this employee (with roles)
        const assignments = await query(
            `SELECT project_id, role, units_assigned 
             FROM assignments 
             WHERE user_id = ?`,
            [userId]
        );
        
        const assignmentMap = {};
        assignments.forEach(a => {
            assignmentMap[a.project_id] = {
                role: a.role,
                units_assigned: a.units_assigned
            };
        });
        
        // 3. Get all timesheet entries for this employee
        let timesheetQuery = `
            SELECT 
                te.*,
                u.name as employee_name,
                u.emp_id,
                p.project_name,
                p.project_code,
                te.original_project_code,
                te.original_emp_code,
                p.id as project_id
            FROM timesheet_entries te
            LEFT JOIN users u ON te.user_id = u.id
            LEFT JOIN projects p ON te.project_id = p.id
            WHERE te.user_id = ? OR te.original_emp_code = ?
        `;
        const params = [userId, employeeExists ? employee[0].emp_id : null];
        
        if (projectId) {
            timesheetQuery += ` AND (te.project_id = ? OR te.original_project_code = (SELECT project_code FROM projects WHERE id = ?))`;
            params.push(projectId, projectId);
        }
        
        timesheetQuery += ` ORDER BY te.entry_date`;
        
        const timesheets = await query(timesheetQuery, params);
        
        if (timesheets.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    employee_info: {
                        exists: employeeExists,
                        id: employeeExists ? employee[0].id : null,
                        emp_id: employeeExists ? employee[0].emp_id : 'Unknown',
                        name: employeeExists ? employee[0].name : 'Employee Not Found'
                    },
                    message: 'No timesheet entries found for this employee',
                    projects: []
                }
            });
        }
        
        // 4. Group by project
        const projectGroups = {};
        
        for (const entry of timesheets) {
            const key = entry.project_id || entry.original_project_code;
            if (!projectGroups[key]) {
                // Get project details
                const projectExists = !!entry.project_id;
                
                // Get employee's role for this project from assignments
                const assignment = assignments.find(a => a.project_id === entry.project_id);
                const employeeRole = assignment ? assignment.role : null;
                const assignedUnits = assignment ? assignment.units_assigned : 0;
                
                // Get effort estimate for this employee's role
                let effort = [];
                if (entry.project_id && employeeRole) {
                    effort = await query(
                        `SELECT * FROM effort_estimates WHERE project_id = ? AND role = ?`,
                        [entry.project_id, employeeRole]
                    );
                }
                
                projectGroups[key] = {
                    project_id: entry.project_id,
                    project_code: entry.project_code || entry.original_project_code,
                    project_name: entry.project_name || 'Project Not Found',
                    project_exists: projectExists,
                    employee_role: employeeRole,
                    assigned_units: assignedUnits,
                    is_assigned: !!assignment,
                    effort_estimate_exists: effort.length > 0,
                    estimated_hrs: effort.length > 0 ? parseFloat(effort[0].total_hrs || 0) : 0,
                    estimated_days: effort.length > 0 ? parseFloat(effort[0].effort_days || 0) + parseFloat(effort[0].buffer_days || 0) : 0,
                    actual_hrs: 0,
                    entries: []
                };
            }
            projectGroups[key].actual_hrs += parseFloat(entry.hours || 0);
            projectGroups[key].entries.push(entry);
        }
        
        // 5. Build response
        const projects = Object.values(projectGroups).map(p => {
            const actualDays = p.actual_hrs / 8;
            const estimatedHrs = p.estimated_hrs;
            const estimatedDays = p.estimated_days;
            
            // Calculate reconciliation
            const utilizedHrs = Math.min(p.actual_hrs, estimatedHrs);
            const utilizedDays = Math.min(actualDays, estimatedDays);
            const remainingHrs = Math.max(0, estimatedHrs - p.actual_hrs);
            const remainingDays = Math.max(0, estimatedDays - actualDays);
            const utilizationPercentage = estimatedHrs > 0 ? (p.actual_hrs / estimatedHrs) * 100 : 0;
            
            // Status messages
            let status = 'missing';
            let statusMessage = '';
            
            if (!p.project_exists) {
                status = 'missing';
                statusMessage = `Project not found. Please create project with code: ${p.project_code}`;
            } else if (!p.is_assigned) {
                status = 'missing';
                statusMessage = `Employee not assigned to project: ${p.project_name}`;
            } else if (!p.effort_estimate_exists) {
                status = 'missing';
                statusMessage = `No effort estimate for role '${p.employee_role}' in project: ${p.project_name}`;
            } else if (p.actual_hrs === 0) {
                status = 'missing';
                statusMessage = `No hours logged for this project`;
            } else if (p.actual_hrs > estimatedHrs * 1.2) {
                status = 'over';
                statusMessage = `Over-utilized: ${p.actual_hrs.toFixed(1)} hrs vs ${estimatedHrs.toFixed(1)} hrs estimated`;
            } else if (p.actual_hrs < estimatedHrs * 0.8) {
                status = 'under';
                statusMessage = `Under-utilized: ${p.actual_hrs.toFixed(1)} hrs vs ${estimatedHrs.toFixed(1)} hrs estimated`;
            } else {
                status = 'matched';
                statusMessage = `On track: ${p.actual_hrs.toFixed(1)} hrs logged vs ${estimatedHrs.toFixed(1)} hrs estimated`;
            }
            
            return {
                project_info: {
                    exists: p.project_exists,
                    id: p.project_id,
                    project_code: p.project_code,
                    project_name: p.project_name
                },
                assignment: {
                    is_assigned: p.is_assigned,
                    role: p.employee_role,
                    units_assigned: p.assigned_units
                },
                effort_estimate: {
                    exists: p.effort_estimate_exists,
                    estimated_hrs: p.estimated_hrs,
                    estimated_days: p.estimated_days
                },
                timesheet: {
                    actual_hrs: p.actual_hrs,
                    actual_days: actualDays,
                    utilized_hrs: utilizedHrs,
                    utilized_days: utilizedDays,
                    remaining_hrs: remainingHrs,
                    remaining_days: remainingDays,
                    utilization_percentage: utilizationPercentage,
                    entry_count: p.entries.length
                },
                reconciliation_status: {
                    status: status,
                    message: statusMessage
                }
            };
        });
        
        // Summary
        const totalEstimated = projects.reduce((sum, p) => sum + p.effort_estimate.estimated_hrs, 0);
        const totalActual = projects.reduce((sum, p) => sum + p.timesheet.actual_hrs, 0);
        
        res.status(200).json({
            success: true,
            data: {
                employee_info: {
                    exists: employeeExists,
                    id: employeeExists ? employee[0].id : null,
                    emp_id: employeeExists ? employee[0].emp_id : timesheets[0]?.original_emp_code || 'Unknown',
                    name: employeeExists ? employee[0].name : 'Employee Not Found'
                },
                summary: {
                    total_projects: projects.length,
                    total_estimated_hrs: totalEstimated,
                    total_actual_hrs: totalActual,
                    overall_utilization: totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0
                },
                projects: projects
            }
        });
        
    } catch (err) {
        console.error("Employee reconciliation error:", err);
        next(err);
    }
};

const getBatchReconciliation = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        
        // 1. Get batch info
        const batch = await query(
            `SELECT * FROM timesheet_batches WHERE id = ?`,
            [batchId]
        );
        
        if (batch.length === 0) {
            return res.status(404).json({ message: "Batch not found" });
        }
        
        // 2. Get all entries for this batch
        const entries = await query(`
            SELECT 
                te.*,
                u.name as employee_name,
                u.emp_id,
                p.project_name,
                p.project_code
            FROM timesheet_entries te
            LEFT JOIN users u ON te.user_id = u.id
            LEFT JOIN projects p ON te.project_id = p.id
            WHERE te.batch_id = ?
            ORDER BY te.user_id, te.project_id, te.entry_date
        `, [batchId]);
        
        if (entries.length === 0) {
            return res.status(200).json({
                success: true,
                batch: batch[0],
                message: "No entries found for this batch",
                summary: {
                    total_entries: 0,
                    unique_projects: 0,
                    unique_employees: 0,
                    total_actual_hrs: 0
                },
                project_level: [],
                employee_level: []
            });
        }
        
        // 3. Group by project
        const projectEntries = {};
        const employeeEntries = {};
        
        for (const entry of entries) {
            const projectKey = entry.project_id || entry.original_project_code;
            const employeeKey = entry.user_id || entry.original_emp_code;
            
            // Project grouping
            if (!projectEntries[projectKey]) {
                projectEntries[projectKey] = {
                    project_id: entry.project_id,
                    project_code: entry.project_code || entry.original_project_code,
                    project_name: entry.project_name || 'Project Not Found',
                    project_exists: !!entry.project_id,
                    actual_hrs: 0,
                    employees: new Set(),
                    entries: []
                };
            }
            projectEntries[projectKey].actual_hrs += parseFloat(entry.hours || 0);
            if (entry.user_id) projectEntries[projectKey].employees.add(entry.user_id);
            projectEntries[projectKey].entries.push(entry);
            
            // Employee grouping
            if (!employeeEntries[employeeKey]) {
                employeeEntries[employeeKey] = {
                    user_id: entry.user_id,
                    emp_id: entry.emp_id || entry.original_emp_code,
                    employee_name: entry.employee_name || 'Employee Not Found',
                    employee_exists: !!entry.user_id,
                    projects: {},
                    actual_hrs: 0
                };
            }
            employeeEntries[employeeKey].actual_hrs += parseFloat(entry.hours || 0);
            
            // Track project hours for this employee
            if (!employeeEntries[employeeKey].projects[projectKey]) {
                employeeEntries[employeeKey].projects[projectKey] = {
                    project_id: entry.project_id,
                    project_code: entry.project_code || entry.original_project_code,
                    project_name: entry.project_name || 'Project Not Found',
                    project_exists: !!entry.project_id,
                    hours: 0
                };
            }
            employeeEntries[employeeKey].projects[projectKey].hours += parseFloat(entry.hours || 0);
        }
        
        // 4. Get project IDs for estimates
        const projectIds = Object.values(projectEntries)
            .filter(p => p.project_id)
            .map(p => p.project_id);
        
        let estimateMap = {};
        let roleEstimateMap = {};
        
        if (projectIds.length > 0) {
            const placeholders = projectIds.map(() => '?').join(',');
            
            // Get project-level estimates (sum of all roles)
            const estimates = await query(`
                SELECT 
                    project_id,
                    SUM(total_hrs) as total_estimated_hrs,
                    SUM(effort_days + buffer_days) as total_estimated_days,
                    GROUP_CONCAT(DISTINCT role) as roles
                FROM effort_estimates 
                WHERE project_id IN (${placeholders})
                GROUP BY project_id
            `, projectIds);
            
            estimates.forEach(e => {
                estimateMap[e.project_id] = {
                    total_estimated_hrs: parseFloat(e.total_estimated_hrs || 0),
                    total_estimated_days: parseFloat(e.total_estimated_days || 0),
                    roles: e.roles ? e.roles.split(',') : []
                };
            });
            
            // Get role-wise estimates for employee breakdown
            const roleEstimates = await query(`
                SELECT 
                    project_id,
                    role,
                    total_hrs,
                    effort_days + buffer_days as total_days
                FROM effort_estimates 
                WHERE project_id IN (${placeholders})
                ORDER BY project_id, role
            `, projectIds);
            
            roleEstimates.forEach(e => {
                if (!roleEstimateMap[e.project_id]) {
                    roleEstimateMap[e.project_id] = [];
                }
                roleEstimateMap[e.project_id].push({
                    role: e.role,
                    total_hrs: parseFloat(e.total_hrs || 0),
                    total_days: parseFloat(e.total_days || 0)
                });
            });
        }
        
        // 5. Get employee assignments (roles per project)
        const userIds = Object.values(employeeEntries)
            .filter(e => e.user_id)
            .map(e => e.user_id);
        
        let assignmentMap = {};
        if (userIds.length > 0 && projectIds.length > 0) {
            const userPlaceholders = userIds.map(() => '?').join(',');
            const projectPlaceholders = projectIds.map(() => '?').join(',');
            
            const assignments = await query(`
                SELECT user_id, project_id, role
                FROM assignments
                WHERE user_id IN (${userPlaceholders}) 
                AND project_id IN (${projectPlaceholders})
            `, [...userIds, ...projectIds]);
            
            assignments.forEach(a => {
                const key = `${a.user_id}_${a.project_id}`;
                assignmentMap[key] = a.role;
            });
        }
        
        // 6. Build project level summary
        const projectSummary = Object.values(projectEntries).map(p => {
            const estimate = estimateMap[p.project_id];
            const estimatedHrs = estimate ? estimate.total_estimated_hrs : 0;
            const estimatedDays = estimate ? estimate.total_estimated_days : 0;
            const actualHrs = p.actual_hrs;
            const actualDays = actualHrs / 8;
            
            let status = 'missing';
            let statusMessage = '';
            let severity = 'high';
            
            if (!p.project_exists) {
                status = 'missing';
                statusMessage = 'Project not found in system';
                severity = 'critical';
            } else if (!estimate) {
                status = 'missing';
                statusMessage = 'No effort estimates found';
                severity = 'critical';
            } else if (actualHrs === 0) {
                status = 'missing';
                statusMessage = 'No hours logged';
                severity = 'medium';
            } else {
                const variance = estimatedHrs - actualHrs;
                const variancePercentage = estimatedHrs > 0 ? (variance / estimatedHrs) * 100 : 0;
                if (variancePercentage > 20) {
                    status = 'under';
                    statusMessage = `Under-utilized (${variancePercentage.toFixed(1)}% variance)`;
                    severity = 'high';
                } else if (variancePercentage < -20) {
                    status = 'over';
                    statusMessage = `Over-utilized (${Math.abs(variancePercentage).toFixed(1)}% variance)`;
                    severity = 'medium';
                } else {
                    status = 'matched';
                    statusMessage = 'On track';
                    severity = 'low';
                }
            }
            
            return {
                project_code: p.project_code,
                project_name: p.project_name,
                project_exists: p.project_exists,
                estimated_hrs: estimatedHrs,
                estimated_days: estimatedDays,
                actual_hrs: actualHrs,
                actual_days: actualDays,
                utilized_hrs: Math.min(actualHrs, estimatedHrs),
                utilized_days: Math.min(actualDays, estimatedDays),
                remaining_hrs: Math.max(0, estimatedHrs - actualHrs),
                remaining_days: Math.max(0, estimatedDays - actualDays),
                utilization_percentage: estimatedHrs > 0 ? (actualHrs / estimatedHrs) * 100 : 0,
                unique_employees: p.employees.size,
                status: status,
                status_message: statusMessage,
                severity: severity,
                roles: estimate ? estimate.roles : []
            };
        });
        
        // 7. Build employee level summary WITH ROLE AND ESTIMATE DATA
        const employeeSummary = Object.values(employeeEntries).map(e => {
            const projects = Object.values(e.projects);
            const totalActualHrs = e.actual_hrs;
            const totalActualDays = totalActualHrs / 8;
            
            // Build project details with role and estimate
            const projectDetails = projects.map(p => {
                // Get employee's role for this project from assignments
                const assignmentKey = `${e.user_id}_${p.project_id}`;
                const role = assignmentMap[assignmentKey] || null;
                
                // Get role-wise estimates for this project
                const roleEstimates = roleEstimateMap[p.project_id] || [];
                
                // Find estimate for this specific role
                let estimatedHrs = 0;
                let estimatedDays = 0;
                if (role) {
                    const roleEstimate = roleEstimates.find(r => r.role === role);
                    if (roleEstimate) {
                        estimatedHrs = roleEstimate.total_hrs;
                        estimatedDays = roleEstimate.total_days;
                    }
                }
                
                return {
                    project_name: p.project_name,
                    project_code: p.project_code,
                    project_exists: p.project_exists,
                    hours: p.hours,
                    days: p.hours / 8,
                    role: role || 'Not Assigned',
                    estimated_hrs: estimatedHrs,
                    estimated_days: estimatedDays,
                    utilized_hrs: Math.min(p.hours, estimatedHrs),
                    utilized_days: Math.min(p.hours / 8, estimatedDays),
                    remaining_hrs: Math.max(0, estimatedHrs - p.hours),
                    remaining_days: Math.max(0, estimatedDays - (p.hours / 8)),
                    utilization_percentage: estimatedHrs > 0 ? (p.hours / estimatedHrs) * 100 : 0,
                    status: estimatedHrs > 0 
                        ? (p.hours > estimatedHrs * 1.2 ? 'over' :
                           p.hours < estimatedHrs * 0.8 ? 'under' : 'matched')
                        : 'missing'
                };
            });
            
            // Calculate overall status
            let status = 'matched';
            let statusMessage = `${totalActualHrs.toFixed(1)} hrs logged across ${projects.length} project(s)`;
            
            return {
                emp_id: e.emp_id,
                employee_name: e.employee_name,
                employee_exists: e.employee_exists,
                total_projects: projects.length,
                total_actual_hrs: totalActualHrs,
                total_actual_days: totalActualDays,
                projects: projectDetails,
                status: status,
                status_message: statusMessage
            };
        });
        
        // 8. Calculate total summary
        const totalActualHrs = entries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0);
        const totalEstimatedFromProjects = projectSummary.reduce((sum, p) => sum + (p.estimated_hrs || 0), 0);
        const totalUtilization = totalEstimatedFromProjects > 0 ? (totalActualHrs / totalEstimatedFromProjects) * 100 : 0;
        
        res.status(200).json({
            success: true,
            batch: {
                id: batch[0].id,
                batch_code: batch[0].batch_code,
                uploaded_by: batch[0].uploaded_by,
                uploaded_at: batch[0].uploaded_at,
                file_name: batch[0].file_name,
                total_records: batch[0].total_records,
                valid_records: batch[0].valid_records,
                invalid_records: batch[0].invalid_records,
                status: batch[0].status,
                created_at: batch[0].created_at
            },
            summary: {
                total_entries: entries.length,
                unique_projects: Object.keys(projectEntries).length,
                unique_employees: Object.keys(employeeEntries).length,
                total_actual_hrs: totalActualHrs,
                total_actual_days: totalActualHrs / 8,
                utilization_percentage: totalUtilization
            },
            project_level: projectSummary,
            employee_level: employeeSummary
        });
        
    } catch (err) {
        console.error("Batch reconciliation error:", err);
        next(err);
    }
};

module.exports = {
    uploadTimesheet,
    getBatches,  
    getBatchDetails, 
    getProjectReconciliation,
    getEmployeeReconciliation,
    getBatchReconciliation
};