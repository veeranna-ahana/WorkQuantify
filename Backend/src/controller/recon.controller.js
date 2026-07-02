const { query } = require("../config/db");

// ──────────────────────────────────────────────────────────────
// 1. GET FILTER OPTIONS (UPDATED - Includes timesheet clients)
// ──────────────────────────────────────────────────────────────
const getReconFilters = async (req, res, next) => {
    try {
        // ─── Get clients from projects table ──────────────────────
        const projectClients = await query(`
            SELECT DISTINCT client_name 
            FROM projects 
            WHERE client_name IS NOT NULL AND client_name != ''
        `);
        
        // ─── Get clients from timesheet_entries ────────────────────
        const timesheetClients = await query(`
            SELECT DISTINCT original_client_name as client_name
            FROM timesheet_entries 
            WHERE original_client_name IS NOT NULL AND original_client_name != ''
        `);
        
        // ─── Combine and deduplicate ──────────────────────────────
        const allClients = [
            ...projectClients.map(c => c.client_name),
            ...timesheetClients.map(c => c.client_name)
        ];
        const uniqueClients = [...new Set(allClients)].filter(Boolean);
        
        // ─── Get projects ──────────────────────────────────────────
        const projects = await query(`
            SELECT id, project_code, project_name 
            FROM projects 
            WHERE project_code IS NOT NULL
        `);
        
        // ─── Get employees ─────────────────────────────────────────
        const employees = await query(`
            SELECT id, emp_id, name 
            FROM users 
            WHERE role = 'EMP' AND emp_id IS NOT NULL
        `);
        
        // ─── Get departments ───────────────────────────────────────
        const departments = await query(`
            SELECT DISTINCT 'Application Development and Automation' as dept
        `);
        
        // ─── Get managers ──────────────────────────────────────────
        const managers = await query(`
            SELECT DISTINCT u.name as manager_name
            FROM users u
            JOIN projects p ON p.project_manager = u.name
            WHERE p.project_manager IS NOT NULL
        `);
        
        res.status(200).json({
            clients: uniqueClients,
            projects: projects.map(p => ({
                id: p.id,
                code: p.project_code,
                name: p.project_name
            })),
            employees: employees.map(e => ({
                id: e.id,
                emp_id: e.emp_id,
                name: e.name
            })),
            departments: departments.map(d => d.dept).filter(Boolean),
            managers: managers.map(m => m.manager_name).filter(Boolean)
        });
        
    } catch (err) {
        console.error("Get filters error:", err);
        res.status(500).json({ message: err.message });
    }
};

// ──────────────────────────────────────────────────────────────
// 2. GET DASHBOARD SUMMARY
// ──────────────────────────────────────────────────────────────
const getReconDashboard = async (req, res, next) => {
    try {
        // Get ALL unique projects from timesheet_entries
        const timesheetProjectsQuery = `
            SELECT DISTINCT 
                te.original_project_code,
                te.original_project_name,
                CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END as in_system,
                CASE WHEN ee.id IS NOT NULL THEN 1 ELSE 0 END as has_estimate,
                COALESCE(SUM(te.hours), 0) as actual_hours
            FROM timesheet_entries te
            LEFT JOIN projects p ON p.project_code = te.original_project_code
            LEFT JOIN effort_estimates ee ON ee.project_id = p.id
            GROUP BY te.original_project_code, te.original_project_name, p.id, ee.id
            HAVING COALESCE(SUM(te.hours), 0) > 0
        `;
        const timesheetProjects = await query(timesheetProjectsQuery, []);
        
        // Get ALL projects from projects table
        const systemProjectsQuery = `
            SELECT p.id, p.project_code, p.project_name,
                   CASE WHEN ee.id IS NOT NULL THEN 1 ELSE 0 END as has_estimate
            FROM projects p
            LEFT JOIN effort_estimates ee ON ee.project_id = p.id
        `;
        const systemProjects = await query(systemProjectsQuery, []);
        
        // Combine: System projects + Timesheet projects not in system
        const systemProjectCodes = new Set(systemProjects.map(p => p.project_code));
        const combinedProjects = new Map();
        
        systemProjects.forEach(p => {
            combinedProjects.set(p.project_code, {
                project_code: p.project_code,
                project_name: p.project_name,
                in_system: true,
                has_estimate: p.has_estimate === 1,
                actual_hours: 0
            });
        });
        
        timesheetProjects.forEach(p => {
            if (combinedProjects.has(p.original_project_code)) {
                const existing = combinedProjects.get(p.original_project_code);
                existing.actual_hours = parseFloat(p.actual_hours || 0);
                combinedProjects.set(p.original_project_code, existing);
            } else {
                combinedProjects.set(p.original_project_code, {
                    project_code: p.original_project_code,
                    project_name: p.original_project_name || p.original_project_code,
                    in_system: false,
                    has_estimate: false,
                    actual_hours: parseFloat(p.actual_hours || 0)
                });
            }
        });
        
        const allProjects = Array.from(combinedProjects.values());
        const totalProjects = allProjects.length;
        
        let projectsWithEstimates = 0;
        let projectsWithoutEstimates = 0;
        let projectsWithTimesheets = 0;
        let projectsWithoutTimesheets = 0;
        let totalActualHours = 0;
        
        allProjects.forEach(p => {
            totalActualHours += p.actual_hours;
            
            if (p.in_system) {
                if (p.has_estimate) {
                    projectsWithEstimates++;
                } else {
                    projectsWithoutEstimates++;
                }
                if (p.actual_hours > 0) {
                    projectsWithTimesheets++;
                } else {
                    projectsWithoutTimesheets++;
                }
            } else {
                projectsWithoutEstimates++;
                projectsWithTimesheets++;
            }
        });
        
        // Get total estimated hours
        const estimatedResult = await query(`SELECT COALESCE(SUM(total_hrs), 0) as total FROM effort_estimates`, []);
        const totalEstimatedHours = parseFloat(estimatedResult[0]?.total || 0);
        
        // Get total employees
        const employeesResult = await query(
            `SELECT COUNT(DISTINCT user_id) as count FROM timesheet_entries WHERE user_id IS NOT NULL`, 
            []
        );
        const totalEmployees = parseInt(employeesResult[0]?.count || 0);
        
        // Get over/under utilized
        const utilStats = await query(`
            SELECT 
                p.id,
                COALESCE((SELECT SUM(total_hrs) FROM effort_estimates WHERE project_id = p.id), 0) as estimated_hrs,
                COALESCE((SELECT SUM(hours) FROM timesheet_entries WHERE project_id = p.id), 0) as actual_hrs
            FROM projects p
            WHERE EXISTS (SELECT 1 FROM effort_estimates WHERE project_id = p.id)
        `, []);
        
        let overutilized = 0;
        let underutilized = 0;
        
        utilStats.forEach(p => {
            const estimated = parseFloat(p.estimated_hrs || 0);
            const actual = parseFloat(p.actual_hrs || 0);
            if (estimated > 0) {
                const variancePct = ((estimated - actual) / estimated) * 100;
                if (variancePct < -20) overutilized++;
                else if (variancePct > 20) underutilized++;
            }
        });
        
        res.status(200).json({
            total_projects: totalProjects,
            projects_with_estimates: projectsWithEstimates,
            projects_without_estimates: projectsWithoutEstimates,
            projects_with_timesheets: projectsWithTimesheets,
            projects_without_timesheets: projectsWithoutTimesheets,
            total_employees: totalEmployees,
            total_estimated_hours: totalEstimatedHours,
            total_actual_hours: totalActualHours,
            total_variance_hours: totalEstimatedHours - totalActualHours,
            overutilized_count: overutilized,
            underutilized_count: underutilized
        });
        
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ message: err.message });
    }
};
// ──────────────────────────────────────────────────────────────
// 3. GET PROJECT LEVEL RECONCILIATION (COMPLETE FIX)
// ──────────────────────────────────────────────────────────────
const getProjectLevelRecon = async (req, res, next) => {
    try {
        const { month, year, clientName, projectCode, projectName, employeeName, department, reportingManager } = req.query;
        
        // ─── Build date conditions ──────────────────────────────────
        let dateConditions = [];
        let dateParams = [];
        
        if (month) {
            dateConditions.push('MONTH(te.entry_date) = ?');
            dateParams.push(parseInt(month));
        }
        if (year) {
            dateConditions.push('YEAR(te.entry_date) = ?');
            dateParams.push(parseInt(year));
        }
        
        const dateWhereClause = dateConditions.length > 0 
            ? `AND ${dateConditions.join(' AND ')}` 
            : '';
        
        // ─── Get System Projects ──────────────────────────────────
        let systemWhere = [];
        let systemParams = [];
        
        if (clientName) {
            systemWhere.push('p.client_name LIKE ?');
            systemParams.push(`%${clientName}%`);
        }
        if (projectCode) {
            systemWhere.push('p.project_code LIKE ?');
            systemParams.push(`%${projectCode}%`);
        }
        if (projectName) {
            systemWhere.push('p.project_name LIKE ?');
            systemParams.push(`%${projectName}%`);
        }
        if (department) {
            systemWhere.push('p.sub_category LIKE ?');
            systemParams.push(`%${department}%`);
        }
        if (reportingManager) {
            systemWhere.push('p.project_manager LIKE ?');
            systemParams.push(`%${reportingManager}%`);
        }
        
        const systemWhereClause = systemWhere.length > 0 
            ? `WHERE ${systemWhere.join(' AND ')}` 
            : 'WHERE 1=1';
        
        // ─── Get System Projects with subqueries ──────────────────
        const systemProjects = await query(`
            SELECT 
                p.id as project_id,
                p.project_code,
                p.project_name,
                p.client_name,
                COALESCE((SELECT SUM(total_hrs) FROM effort_estimates WHERE project_id = p.id), 0) as estimated_hours,
                COALESCE((SELECT SUM(hours) FROM timesheet_entries te WHERE te.project_id = p.id ${dateWhereClause}), 0) as actual_hours,
                COALESCE((SELECT COUNT(DISTINCT te.user_id) FROM timesheet_entries te WHERE te.project_id = p.id ${dateWhereClause}), 0) as employee_count,
                1 as in_system,
                CASE WHEN EXISTS (SELECT 1 FROM effort_estimates WHERE project_id = p.id) THEN 1 ELSE 0 END as has_estimate
            FROM projects p
            ${systemWhereClause}
            GROUP BY p.id
        `, systemParams);
        
        // ─── Apply employee filter for system projects ──────────
        let filteredSystemProjects = systemProjects;
        if (employeeName) {
            const empProjectIds = await query(`
                SELECT DISTINCT te.project_id 
                FROM timesheet_entries te
                LEFT JOIN users u ON te.user_id = u.id
                WHERE u.name LIKE ?
                AND te.project_id IS NOT NULL
            `, [`%${employeeName}%`]);
            
            const empProjectIdSet = new Set(empProjectIds.map(r => r.project_id));
            
            filteredSystemProjects = systemProjects.filter(p => {
                return empProjectIdSet.has(p.project_id);
            });
        }
        
        // ─── Get Timesheet Projects ──────────────────────────────
        let timesheetWhere = [];
        let timesheetParams = [];
        let employeeJoin = '';
        
        if (projectCode) {
            timesheetWhere.push('te.original_project_code LIKE ?');
            timesheetParams.push(`%${projectCode}%`);
        }
        if (projectName) {
            timesheetWhere.push('te.original_project_name LIKE ?');
            timesheetParams.push(`%${projectName}%`);
        }
        if (clientName) {
            timesheetWhere.push('te.original_client_name LIKE ?');
            timesheetParams.push(`%${clientName}%`);
        }
        if (month) {
            timesheetWhere.push('MONTH(te.entry_date) = ?');
            timesheetParams.push(parseInt(month));
        }
        if (year) {
            timesheetWhere.push('YEAR(te.entry_date) = ?');
            timesheetParams.push(parseInt(year));
        }
        if (employeeName) {
            employeeJoin = 'LEFT JOIN users u ON te.user_id = u.id';
            timesheetWhere.push('u.name LIKE ?');
            timesheetParams.push(`%${employeeName}%`);
        }
        if (department) {
            timesheetWhere.push('te.original_project_name LIKE ?');
            timesheetParams.push(`%${department}%`);
        }
        
        const timesheetWhereClause = timesheetWhere.length > 0 
            ? `AND ${timesheetWhere.join(' AND ')}` 
            : '';
        
        // ✅ Fix: Remove ee.id from SELECT and use proper grouping
        let timesheetQuery = `
            SELECT 
                te.original_project_code as project_code,
                MAX(te.original_project_name) as project_name,
                MAX(te.original_client_name) as client_name,
                COALESCE(SUM(te.hours), 0) as actual_hours,
                COUNT(DISTINCT te.user_id) as employee_count,
                0 as in_system,
                0 as has_estimate,
                NULL as project_id
            FROM timesheet_entries te
            ${employeeJoin}
            WHERE te.project_id IS NULL
            ${timesheetWhereClause}
            GROUP BY te.original_project_code
        `;
        
        const timesheetProjects = await query(timesheetQuery, timesheetParams);
        
        // ─── Combine results using Map to deduplicate ──────────────
        const projectMap = new Map();
        
        // Add system projects first
        filteredSystemProjects.forEach(p => {
            const key = p.project_code;
            projectMap.set(key, p);
        });
        
        // Add/merge timesheet projects
        timesheetProjects.forEach(p => {
            const key = p.project_code;
            if (projectMap.has(key)) {
                // Merge: update actual_hours and employee_count if timesheet has data
                const existing = projectMap.get(key);
                if (p.actual_hours > 0) {
                    existing.actual_hours = p.actual_hours;
                    existing.employee_count = p.employee_count;
                }
                projectMap.set(key, existing);
            } else {
                // Only add if project doesn't exist in system
                if (!p.in_system) {
                    projectMap.set(key, p);
                }
            }
        });
        
        // ─── Reporting Manager filter (post-filter) ──────────────
        let allProjects = Array.from(projectMap.values());
        
        if (reportingManager) {
            allProjects = allProjects.filter(p => 
                p.client_name && p.client_name.toLowerCase().includes(reportingManager.toLowerCase())
            );
        }
        
        const result = allProjects.map(p => {
            // ─── Status logic ─────────────────────────────────────────────
const estimated = parseFloat(p.estimated_hours || 0);
const actual = parseFloat(p.actual_hours || 0);
const variance = estimated - actual;
const variancePct = estimated > 0 ? (variance / estimated) * 100 : 0;

let status = 'On Track';

if (!p.in_system) {
    status = 'Project Not Found';
} else if (estimated === 0) {
    status = 'No Estimate';
} else if (variancePct < 0) {
    // ✅ Negative variance means actual > estimated → OVER-UTILIZED
    status = 'Over Utilized';
} else if (variancePct > 20) {
    status = 'Under Utilized';
} else if (variancePct > 0) {
    status = 'Under Utilized';
} else {
    status = 'On Track';
}
            
            return {
                project_id: p.project_id,
                project_code: p.project_code || '',
                project_name: p.project_name || p.project_code || '',
                client_name: p.client_name || '—',
                estimated_hours: estimated.toFixed(1),
                estimated_days: (estimated / 8).toFixed(1),
                actual_hours: actual.toFixed(1),
                actual_days: (actual / 8).toFixed(1),
                variance_hours: variance.toFixed(1),
                variance_pct: variancePct.toFixed(1),
                employee_count: parseInt(p.employee_count || 0),
                in_system: p.in_system === 1,
                has_estimate: p.has_estimate === 1,
                status: status
            };
        });
        
        // Sort with null checks
        result.sort((a, b) => {
            const aCode = a?.project_code || '';
            const bCode = b?.project_code || '';
            
            if (a.in_system !== b.in_system) return a.in_system ? -1 : 1;
            return aCode.localeCompare(bCode);
        });
        
        res.status(200).json(result);
        
    } catch (err) {
        console.error("Project level recon error:", err);
        res.status(500).json({ message: err.message });
    }
};
// ──────────────────────────────────────────────────────────────
// 4. GET EMPLOYEE LEVEL RECONCILIATION (COMPLETE FIX)
// ──────────────────────────────────────────────────────────────
const getEmployeeLevelRecon = async (req, res, next) => {
    try {
        const { month, year, clientName, projectCode, projectName, employeeName, department, reportingManager } = req.query;
        
        // ─── Build WHERE conditions ──────────────────────────────────
        let whereConditions = [];
        let params = [];
        
        if (month) {
            whereConditions.push('MONTH(te.entry_date) = ?');
            params.push(parseInt(month));
        }
        if (year) {
            whereConditions.push('YEAR(te.entry_date) = ?');
            params.push(parseInt(year));
        }
        if (clientName) {
            whereConditions.push('(p.client_name LIKE ? OR te.original_client_name LIKE ?)');
            params.push(`%${clientName}%`, `%${clientName}%`);
        }
        if (projectCode) {
            whereConditions.push('(p.project_code LIKE ? OR te.original_project_code LIKE ?)');
            params.push(`%${projectCode}%`, `%${projectCode}%`);
        }
        if (projectName) {
            whereConditions.push('(p.project_name LIKE ? OR te.original_project_name LIKE ?)');
            params.push(`%${projectName}%`, `%${projectName}%`);
        }
        if (employeeName) {
            whereConditions.push('u.name LIKE ?');
            params.push(`%${employeeName}%`);
        }
        if (department) {
            whereConditions.push('(p.sub_category LIKE ? OR te.original_project_name LIKE ?)');
            params.push(`%${department}%`, `%${department}%`);
        }
        if (reportingManager) {
            whereConditions.push('p.project_manager LIKE ?');
            params.push(`%${reportingManager}%`);
        }
        
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';
        
        // ─── Query 1: Get ALL assignments ──────────────────────────────
        let assignWhere = [];
        let assignParams = [];
        
        if (clientName) {
            assignWhere.push('p.client_name LIKE ?');
            assignParams.push(`%${clientName}%`);
        }
        if (projectCode) {
            assignWhere.push('p.project_code LIKE ?');
            assignParams.push(`%${projectCode}%`);
        }
        if (projectName) {
            assignWhere.push('p.project_name LIKE ?');
            assignParams.push(`%${projectName}%`);
        }
        if (department) {
            assignWhere.push('p.sub_category LIKE ?');
            assignParams.push(`%${department}%`);
        }
        if (reportingManager) {
            assignWhere.push('p.project_manager LIKE ?');
            assignParams.push(`%${reportingManager}%`);
        }
        
        const assignWhereClause = assignWhere.length > 0 
            ? `AND ${assignWhere.join(' AND ')}` 
            : '';
        
        const assignmentsData = await query(`
            SELECT 
                a.user_id,
                u.emp_id as employee_code,
                u.name as employee_name,
                a.project_id,
                p.project_code,
                p.project_name,
                p.client_name,
                SUM(a.units_assigned) as assigned_units,
                SUM(a.estimated_days) as assigned_days,
                SUM(a.estimated_hours) as assigned_hours,
                GROUP_CONCAT(DISTINCT a.role) as roles
            FROM assignments a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE 1=1 ${assignWhereClause}
            GROUP BY a.user_id, a.project_id, u.emp_id, u.name, p.project_code, p.project_name, p.client_name
        `, assignParams);
        
        // ─── Query 2: Get ALL timesheet hours (including project_id = NULL) ──────────────
        let timesheetWhere = [];
        let timesheetParams = [];
        
        if (month) {
            timesheetWhere.push('MONTH(te.entry_date) = ?');
            timesheetParams.push(parseInt(month));
        }
        if (year) {
            timesheetWhere.push('YEAR(te.entry_date) = ?');
            timesheetParams.push(parseInt(year));
        }
        if (employeeName) {
            timesheetWhere.push('u.name LIKE ?');
            timesheetParams.push(`%${employeeName}%`);
        }
        if (projectCode) {
            timesheetWhere.push('(p.project_code LIKE ? OR te.original_project_code LIKE ?)');
            timesheetParams.push(`%${projectCode}%`, `%${projectCode}%`);
        }
        if (projectName) {
            timesheetWhere.push('(p.project_name LIKE ? OR te.original_project_name LIKE ?)');
            timesheetParams.push(`%${projectName}%`, `%${projectName}%`);
        }
        if (clientName) {
            timesheetWhere.push('(p.client_name LIKE ? OR te.original_client_name LIKE ?)');
            timesheetParams.push(`%${clientName}%`, `%${clientName}%`);
        }
        if (department) {
            timesheetWhere.push('(p.sub_category LIKE ? OR te.original_project_name LIKE ?)');
            timesheetParams.push(`%${department}%`, `%${department}%`);
        }
        
        const timesheetWhereClause = timesheetWhere.length > 0 
            ? `AND ${timesheetWhere.join(' AND ')}` 
            : '';
        
        const timesheetData = await query(`
            SELECT 
                te.user_id,
                u.emp_id as employee_code,
                u.name as employee_name,
                COALESCE(te.project_id, p.id) as project_id,
                COALESCE(p.project_code, te.original_project_code) as project_code,
                COALESCE(p.project_name, te.original_project_name) as project_name,
                COALESCE(p.client_name, te.original_client_name) as client_name,
                COALESCE(SUM(te.hours), 0) as actual_hours,
                CASE WHEN p.id IS NOT NULL OR te.project_id IS NOT NULL THEN 1 ELSE 0 END as project_exists
            FROM timesheet_entries te
            LEFT JOIN users u ON te.user_id = u.id
            LEFT JOIN projects p ON p.project_code = te.original_project_code
            WHERE 1=1 ${timesheetWhereClause}
            GROUP BY te.user_id, u.emp_id, u.name, te.project_id, p.id, p.project_code, p.project_name, 
                     p.client_name, te.original_project_code, te.original_project_name, te.original_client_name
        `, timesheetParams);
        
        // ─── Combine both queries ──────────────────────────────────────
        const employeeMap = new Map();
        
        // Add assignments data first
        assignmentsData.forEach(a => {
            const key = `${a.user_id}_${a.project_id}`;
            employeeMap.set(key, {
                user_id: a.user_id,
                employee_code: a.employee_code || '—',
                employee_name: a.employee_name || 'Unknown',
                project_id: a.project_id,
                project_code: a.project_code || '—',
                project_name: a.project_name || '—',
                client_name: a.client_name || '—',
                assigned_units: parseFloat(a.assigned_units || 0),
                assigned_days: parseFloat(a.assigned_days || 0),
                assigned_hours: parseFloat(a.assigned_hours || 0),
                roles: a.roles || 'Not Assigned',
                actual_hours: 0,
                project_exists: true
            });
        });
        
        // Add timesheet data (merge with assignments or create new entry)
        timesheetData.forEach(t => {
            const key = `${t.user_id}_${t.project_id || t.project_code}`;
            
            if (employeeMap.has(key)) {
                // Update existing assignment with actual hours
                const existing = employeeMap.get(key);
                existing.actual_hours = parseFloat(t.actual_hours || 0);
                existing.project_id = t.project_id || existing.project_id;
                existing.project_code = t.project_code || existing.project_code;
                existing.project_name = t.project_name || existing.project_name;
                existing.client_name = t.client_name || existing.client_name;
                existing.project_exists = t.project_exists === 1;
                employeeMap.set(key, existing);
            } else {
                // Create new entry for timesheet-only employee
                employeeMap.set(key, {
                    user_id: t.user_id,
                    employee_code: t.employee_code || '—',
                    employee_name: t.employee_name || 'Unknown',
                    project_id: t.project_id,
                    project_code: t.project_code || '—',
                    project_name: t.project_name || '—',
                    client_name: t.client_name || '—',
                    assigned_units: 0,
                    assigned_days: 0,
                    assigned_hours: 0,
                    roles: 'Not Assigned',
                    actual_hours: parseFloat(t.actual_hours || 0),
                    project_exists: t.project_exists === 1
                });
            }
        });
        
        const allEmployees = Array.from(employeeMap.values());
        
        // ─── Apply reportingManager filter (post-filter) ──────────
        let filteredEmployees = allEmployees;
        if (reportingManager) {
            filteredEmployees = filteredEmployees.filter(e => 
                e.client_name && e.client_name.toLowerCase().includes(reportingManager.toLowerCase())
            );
        }
        
        const result = filteredEmployees.map(e => {
            const assignedUnits = e.assigned_units;
            const assignedDays = e.assigned_days;
            const assignedHours = e.assigned_hours;
            const actual = e.actual_hours || 0;
            
            const estimatedHours = assignedHours > 0 ? assignedHours : 0;
            const estimatedDays = assignedDays > 0 ? assignedDays : 0;
            
            const variance = estimatedHours - actual;
            const variancePct = estimatedHours > 0 ? (variance / estimatedHours) * 100 : 0;
            
            let utilizationDisplay = '0%';
            if (estimatedHours > 0) {
                const utilPct = (actual / estimatedHours) * 100;
                if (utilPct > 100) {
                    utilizationDisplay = '+100%';
                } else {
                    utilizationDisplay = utilPct.toFixed(1) + '%';
                }
            } else if (actual > 0 && estimatedHours === 0) {
                utilizationDisplay = 'N/A';
            }
            
            // ─── Corrected employee status logic ──────────────────────────
let status = 'On Track';
if (estimatedHours > 0) {
    if (variancePct < 0) {
        status = 'Over Utilized';     // ✅ Actual > Estimated
    } else if (variancePct > 20) {
        status = 'Under Utilized';
    } else if (variancePct > 0) {
        status = 'Under Utilized';
    }
} else if (!e.project_exists) {
    status = 'Project Not Found';
} else if (estimatedHours === 0 && actual === 0) {
    status = 'No Activity';
} else if (estimatedHours === 0 && actual > 0) {
    status = 'No Estimate';
}
            
            let roleDisplay = 'Not Assigned';
            if (e.roles && e.roles !== 'Not Assigned') {
                const roleList = e.roles.split(',');
                roleDisplay = roleList.length > 0 ? roleList[0] : 'Not Assigned';
            }
            
            return {
                employee_code: e.employee_code,
                employee_name: e.employee_name,
                reporting_manager: '—',
                project_id: e.project_id,
                project_code: e.project_code,
                project_name: e.project_name,
                client_name: e.client_name,
                assigned_units: assignedUnits.toFixed(1),
                assigned_days: estimatedDays.toFixed(1),
                assigned_hours: estimatedHours.toFixed(1),
                actual_hours: actual.toFixed(1),
                actual_days: (actual / 8).toFixed(1),
                variance_hours: variance.toFixed(1),
                variance_pct: variancePct.toFixed(1),
                utilization_pct: utilizationDisplay,
                role: roleDisplay,
                project_exists: e.project_exists,
                status: status
            };
        });
        
        result.sort((a, b) => {
            const aName = a?.employee_name || '';
            const bName = b?.employee_name || '';
            return aName.localeCompare(bName);
        });
        
        res.status(200).json(result);
        
    } catch (err) {
        console.error("Employee level recon error:", err);
        res.status(500).json({ message: err.message });
    }
};

// ──────────────────────────────────────────────────────────────
// 5. GET PROJECT DETAIL (DIRECT APPROACH)
// ──────────────────────────────────────────────────────────────
const getProjectDetail = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { month, year } = req.query;
        
        // ─── Handle null/undefined projectId ──────────────────────
        if (!projectId || projectId === 'null' || projectId === 'undefined') {
            return res.status(400).json({ message: "Invalid project identifier" });
        }
        
        // ─── Check if it's a numeric ID or a project code ──────────
        const isNumeric = /^\d+$/.test(projectId);
        
        let projectIdNum = null;
        let projectCode = projectId;
        let projectExists = [];
        
        if (isNumeric) {
            projectExists = await query(`SELECT id FROM projects WHERE id = ?`, [parseInt(projectId)]);
        } else {
            projectExists = await query(`SELECT id FROM projects WHERE project_code = ?`, [projectId]);
        }
        
        if (projectExists.length > 0) {
            projectIdNum = projectExists[0].id;
            // Get the actual project code from database
            const projectInfo = await query(`SELECT project_code FROM projects WHERE id = ?`, [projectIdNum]);
            if (projectInfo.length > 0) {
                projectCode = projectInfo[0].project_code;
            }
        }
        
        // ─── If project not found in system ──────────────────────────
        if (!projectIdNum) {
            // Get project data from timesheet_entries
            projectData = await query(`
                SELECT 
                    NULL as project_id,
                    te.original_project_code as project_code,
                    MAX(te.original_project_name) as project_name,
                    NULL as client_name,
                    0 as estimated_hours,
                    COALESCE(SUM(te.hours), 0) as actual_hours,
                    COUNT(DISTINCT te.user_id) as employee_count,
                    0 as in_system
                FROM timesheet_entries te
                WHERE te.original_project_code = ?
                GROUP BY te.original_project_code
            `, [projectCode]);
            
            // Get employee data
            employeeData = await query(`
                SELECT 
                    u.emp_id as employee_code,
                    u.name as employee_name,
                    NULL as role,
                    0 as assigned_hours,
                    0 as assigned_days,
                    COALESCE(SUM(te.hours), 0) as actual_hours,
                    COALESCE(SUM(te.hours), 0) / 8 as actual_days,
                    'Not Assigned' as assignment_status,
                    'Present' as timesheet_status,
                    0 as variance_hours,
                    0 as variance_pct,
                    0 as utilization_pct
                FROM timesheet_entries te
                LEFT JOIN users u ON te.user_id = u.id
                WHERE te.original_project_code = ?
                GROUP BY u.id, u.emp_id, u.name
                ORDER BY actual_hours DESC
            `, [projectCode]);
            
        } else {
            // ─── Project Found in System ────────────────────────────
            
            // ─── Get project info ─────────────────────────────────────
            projectData = await query(`
                SELECT 
                    p.id as project_id,
                    p.project_code,
                    p.project_name,
                    p.client_name,
                    COALESCE((SELECT SUM(total_hrs) FROM effort_estimates WHERE project_id = p.id), 0) as estimated_hours,
                    COALESCE((
                        SELECT SUM(te.hours) 
                        FROM timesheet_entries te 
                        WHERE te.project_id = p.id OR te.original_project_code = p.project_code
                    ), 0) as actual_hours,
                    COALESCE((
                        SELECT COUNT(DISTINCT te.user_id) 
                        FROM timesheet_entries te 
                        WHERE te.project_id = p.id OR te.original_project_code = p.project_code
                    ), 0) as employee_count,
                    1 as in_system
                FROM projects p
                WHERE p.id = ?
            `, [projectIdNum]);
            
            // ─── Get Role-wise Breakdown ─────────────────────────────
            roleData = await query(`
                SELECT 
                    ee.role,
                    ee.total_hrs as estimated_hours,
                    ee.effort_days as estimated_days,
                    ee.buffer_days,
                    ee.buffer_hrs,
                    COALESCE((
                        SELECT SUM(te.hours) 
                        FROM timesheet_entries te 
                        WHERE te.project_id = ee.project_id OR te.original_project_code = p.project_code
                    ), 0) as actual_hours,
                    COALESCE((
                        SELECT SUM(te.hours) 
                        FROM timesheet_entries te 
                        WHERE te.project_id = ee.project_id OR te.original_project_code = p.project_code
                    ), 0) / 8 as actual_days,
                    (ee.total_hrs - COALESCE((
                        SELECT SUM(te.hours) 
                        FROM timesheet_entries te 
                        WHERE te.project_id = ee.project_id OR te.original_project_code = p.project_code
                    ), 0)) as variance_hours,
                    CASE 
                        WHEN ee.total_hrs > 0 
                        THEN ((ee.total_hrs - COALESCE((
                            SELECT SUM(te.hours) 
                            FROM timesheet_entries te 
                            WHERE te.project_id = ee.project_id OR te.original_project_code = p.project_code
                        ), 0)) / ee.total_hrs * 100)
                        ELSE 0 
                    END as variance_pct
                FROM effort_estimates ee
                JOIN projects p ON p.id = ee.project_id
                WHERE ee.project_id = ?
                ORDER BY ee.role
            `, [projectIdNum]);
            
            // ─── ✅ GET ALL EMPLOYEES DIRECTLY FROM TIMESHEET ──────
            // This is the simplest and most reliable approach
            const allTimesheetEmployees = await query(`
                SELECT 
                    te.user_id,
                    u.emp_id as employee_code,
                    u.name as employee_name,
                    COALESCE(SUM(te.hours), 0) as actual_hours
                FROM timesheet_entries te
                LEFT JOIN users u ON te.user_id = u.id
                WHERE te.project_id = ? OR te.original_project_code = ?
                GROUP BY te.user_id, u.emp_id, u.name
                ORDER BY actual_hours DESC
            `, [projectIdNum, projectCode]);
            
            // ─── GET ALL ASSIGNMENTS FOR THIS PROJECT ──────────────
            const allAssignments = await query(`
                SELECT 
                    a.user_id,
                    u.emp_id as employee_code,
                    u.name as employee_name,
                    a.role,
                    SUM(a.units_assigned) as assigned_units,
                    SUM(a.estimated_days) as assigned_days,
                    SUM(a.estimated_hours) as assigned_hours
                FROM assignments a
                LEFT JOIN users u ON a.user_id = u.id
                WHERE a.project_id = ?
                GROUP BY a.user_id, u.emp_id, u.name, a.role
            `, [projectIdNum]);
            
            // ─── Combine both using Map ──────────────────────────────
            const employeeMap = new Map();
            
            // First, add all timesheet employees
            allTimesheetEmployees.forEach(e => {
                const key = e.user_id;
                employeeMap.set(key, {
                    employee_code: e.employee_code || '—',
                    employee_name: e.employee_name || 'Unknown',
                    actual_hours: parseFloat(e.actual_hours || 0),
                    assigned_units: 0,
                    assigned_days: 0,
                    assigned_hours: 0,
                    roles: 'Not Assigned'
                });
            });
            
            // Then, add/update with assignments data
            allAssignments.forEach(a => {
                const key = a.user_id;
                if (employeeMap.has(key)) {
                    const existing = employeeMap.get(key);
                    existing.assigned_units += parseFloat(a.assigned_units || 0);
                    existing.assigned_days += parseFloat(a.assigned_days || 0);
                    existing.assigned_hours += parseFloat(a.assigned_hours || 0);
                    if (a.role) {
                        existing.roles = existing.roles === 'Not Assigned' ? a.role : existing.roles + ', ' + a.role;
                    }
                    employeeMap.set(key, existing);
                } else {
                    // This employee has assignment but no timesheet
                    employeeMap.set(key, {
                        employee_code: a.employee_code || '—',
                        employee_name: a.employee_name || 'Unknown',
                        actual_hours: 0,
                        assigned_units: parseFloat(a.assigned_units || 0),
                        assigned_days: parseFloat(a.assigned_days || 0),
                        assigned_hours: parseFloat(a.assigned_hours || 0),
                        roles: a.role || 'Not Assigned'
                    });
                }
            });
            
            // ─── Build employee summary ──────────────────────────────────
            employeeData = Array.from(employeeMap.values()).map(emp => {
                const assignedUnits = emp.assigned_units;
                const assignedDays = emp.assigned_days;
                const assignedHours = emp.assigned_hours;
                const actual = emp.actual_hours || 0;
                
                const estimatedHours = assignedHours > 0 ? assignedHours : 0;
                const estimatedDays = assignedDays > 0 ? assignedDays : 0;
                
                const variance = estimatedHours - actual;
                const variancePct = estimatedHours > 0 ? (variance / estimatedHours) * 100 : 0;
                const utilizationPct = estimatedHours > 0 ? (actual / estimatedHours) * 100 : 0;
                
                const assignmentStatus = assignedUnits > 0 ? 'Assigned' : 'Not Assigned';
                const timesheetStatus = actual > 0 ? 'Present' : 'Not Present';
                
                let roleDisplay = 'Not Assigned';
                if (emp.roles && emp.roles !== 'Not Assigned') {
                    const roleList = emp.roles.split(', ');
                    // Remove duplicates
                    const uniqueRoles = [...new Set(roleList)];
                    roleDisplay = uniqueRoles.join(', ');
                }
                
                return {
                    employee_code: emp.employee_code,
                    employee_name: emp.employee_name,
                    role: roleDisplay,
                    assigned_units: assignedUnits,
                    assigned_days: estimatedDays,
                    assigned_hours: estimatedHours,
                    actual_hours: actual,
                    actual_days: actual / 8,
                    variance_hours: variance,
                    variance_pct: variancePct,
                    assignment_status: assignmentStatus,
                    timesheet_status: timesheetStatus,
                    utilization_pct: utilizationPct
                };
            });
            
            // Sort by employee name
            employeeData.sort((a, b) => a.employee_name.localeCompare(b.employee_name));
        }
        
        if (!projectData || projectData.length === 0) {
            return res.status(404).json({ message: "Project not found" });
        }
        
        const p = projectData[0];
        const estimatedHrs = parseFloat(p.estimated_hours || 0);
        const actualHrs = parseFloat(p.actual_hours || 0);
        const remainingHours = estimatedHrs - actualHrs;
        
        res.status(200).json({
            project: {
                project_id: p.project_id,
                project_code: p.project_code,
                project_name: p.project_name || p.project_code,
                client_name: p.client_name || 'Not Available',
                estimated_hours: estimatedHrs,
                estimated_days: estimatedHrs / 8,
                actual_hours: actualHrs,
                actual_days: actualHrs / 8,
                remaining_hours: remainingHours,
                remaining_days: remainingHours / 8,
                variance_hours: estimatedHrs - actualHrs,
                variance_pct: estimatedHrs > 0 ? ((estimatedHrs - actualHrs) / estimatedHrs * 100) : 0,
                in_system: p.in_system === 1,
                utilization_pct: estimatedHrs > 0 ? (actualHrs / estimatedHrs * 100) : 0
            },
            roleSummary: roleData.map(r => ({
                role: r.role,
                estimated_hours: parseFloat(r.estimated_hours || 0),
                estimated_days: parseFloat(r.estimated_days || 0),
                buffer_days: parseFloat(r.buffer_days || 0),
                buffer_hrs: parseFloat(r.buffer_hrs || 0),
                actual_hours: parseFloat(r.actual_hours || 0),
                actual_days: parseFloat(r.actual_days || 0),
                variance_hours: parseFloat(r.variance_hours || 0),
                variance_pct: parseFloat(r.variance_pct || 0),
                utilization_pct: parseFloat(r.estimated_hours) > 0 
                    ? (parseFloat(r.actual_hours) / parseFloat(r.estimated_hours) * 100) 
                    : 0
            })),
            employeeSummary: employeeData
        });
        
    } catch (err) {
        console.error("Project detail error:", err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getReconFilters,
    getReconDashboard,
    getProjectLevelRecon,
    getEmployeeLevelRecon,
    getProjectDetail
};