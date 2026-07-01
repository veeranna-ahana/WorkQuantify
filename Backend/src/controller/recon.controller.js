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
// 3. GET PROJECT LEVEL RECONCILIATION (FILTERS FIXED)
// ──────────────────────────────────────────────────────────────
const getProjectLevelRecon = async (req, res, next) => {
    try {
        const { month, year, clientName, projectCode, projectName, employeeName, department, reportingManager } = req.query;
        
        // ─── Build base WHERE conditions ──────────────────────────
        let baseConditions = [];
        let baseParams = [];
        
        if (month) {
            baseConditions.push('MONTH(te.entry_date) = ?');
            baseParams.push(parseInt(month));
        }
        if (year) {
            baseConditions.push('YEAR(te.entry_date) = ?');
            baseParams.push(parseInt(year));
        }
        
        const baseWhereClause = baseConditions.length > 0 
            ? `AND ${baseConditions.join(' AND ')}` 
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
        
        // ─── System Projects ──────────────────────────────────────
        // ✅ FIX: Remove employee filter from subquery (it doesn't have u table joined)
        const systemProjects = await query(`
            SELECT 
                p.id as project_id,
                p.project_code,
                p.project_name,
                p.client_name,
                COALESCE((SELECT SUM(total_hrs) FROM effort_estimates WHERE project_id = p.id), 0) as estimated_hours,
                COALESCE((SELECT SUM(hours) FROM timesheet_entries te WHERE te.project_id = p.id), 0) as actual_hours,
                COALESCE((SELECT COUNT(DISTINCT te.user_id) FROM timesheet_entries te WHERE te.project_id = p.id), 0) as employee_count,
                1 as in_system,
                CASE WHEN EXISTS (SELECT 1 FROM effort_estimates WHERE project_id = p.id) THEN 1 ELSE 0 END as has_estimate
            FROM projects p
            ${systemWhereClause}
            GROUP BY p.id
        `, systemParams);
        
        // ─── Apply employee filter for system projects ──────────
        if (employeeName) {
            const empProjectIds = await query(`
                SELECT DISTINCT te.project_id 
                FROM timesheet_entries te
                LEFT JOIN users u ON te.user_id = u.id
                WHERE u.name LIKE ?
                AND te.project_id IS NOT NULL
            `, [`%${employeeName}%`]);
            
            const empProjectIdSet = new Set(empProjectIds.map(r => r.project_id));
            
            // Keep only projects where employee worked
            systemProjects = systemProjects.filter(p => {
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
        
        let timesheetQuery = `
            SELECT 
                NULL as project_id,
                te.original_project_code as project_code,
                MAX(te.original_project_name) as project_name,
                MAX(te.original_client_name) as client_name,
                0 as estimated_hours,
                COALESCE(SUM(te.hours), 0) as actual_hours,
                COUNT(DISTINCT te.user_id) as employee_count,
                0 as in_system,
                0 as has_estimate
            FROM timesheet_entries te
            ${employeeJoin}
            WHERE te.project_id IS NULL
            ${timesheetWhereClause}
            GROUP BY te.original_project_code
        `;
        
        const timesheetProjects = await query(timesheetQuery, timesheetParams);
        
        // ─── Combine results ──────────────────────────────────────
        let allProjects = [...systemProjects, ...timesheetProjects];
        
        // ─── Reporting Manager filter (post-filter) ──────────────
        if (reportingManager) {
            allProjects = allProjects.filter(p => 
                p.client_name && p.client_name.toLowerCase().includes(reportingManager.toLowerCase())
            );
        }
        
        const result = allProjects.map(p => {
            const estimated = parseFloat(p.estimated_hours || 0);
            const actual = parseFloat(p.actual_hours || 0);
            const variance = estimated - actual;
            const variancePct = estimated > 0 ? (variance / estimated) * 100 : 0;
            
            let status = 'On Track';
            if (!p.in_system) {
                status = 'Project Not Found';
            } else if (estimated === 0) {
                status = 'No Estimate';
            } else if (variancePct < -20) {
                status = 'Over Utilized';
            } else if (variancePct > 20) {
                status = 'Under Utilized';
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
// 4. GET EMPLOYEE LEVEL RECONCILIATION (FIXED)
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
            whereConditions.push('p.sub_category LIKE ?');
            params.push(`%${department}%`);
        }
        if (reportingManager) {
            whereConditions.push('p.project_manager LIKE ?');
            params.push(`%${reportingManager}%`);
        }
        
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';
        
        // ─── QUERY 1: Get employees from timesheet_entries ──────────
        const timesheetEmployees = await query(`
            SELECT 
                te.user_id,
                u.emp_id as employee_code,
                u.name as employee_name,
                p.id as project_id,
                COALESCE(p.project_code, te.original_project_code) as project_code,
                COALESCE(p.project_name, te.original_project_name) as project_name,
                COALESCE(p.client_name, te.original_client_name) as client_name,
                COALESCE(SUM(a.units_assigned), 0) as assigned_units,
                COALESCE(SUM(a.estimated_days), 0) as assigned_days,
                COALESCE(SUM(a.estimated_hours), 0) as assigned_hours,
                COALESCE(SUM(te.hours), 0) as actual_hours,
                COALESCE(ee.effort_days, 0) as role_effort_days,
                COALESCE(ee.effort_hrs, 0) as role_effort_hours,
                COALESCE(ee.total_hrs, 0) as role_total_hrs,
                GROUP_CONCAT(DISTINCT a.role) as roles,
                CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END as project_exists,
                1 as source
            FROM timesheet_entries te
            LEFT JOIN users u ON te.user_id = u.id
            LEFT JOIN projects p ON p.id = te.project_id
            LEFT JOIN assignments a ON a.user_id = te.user_id AND a.project_id = te.project_id
            LEFT JOIN effort_estimates ee ON ee.project_id = te.project_id AND ee.role = a.role
            ${whereClause}
            GROUP BY te.user_id, u.emp_id, u.name, p.id, p.project_code, p.project_name, 
                     p.client_name, ee.effort_days, ee.effort_hrs, ee.total_hrs, 
                     te.original_project_code, te.original_project_name, te.original_client_name
            HAVING te.user_id IS NOT NULL
        `, params);
        
        // ─── QUERY 2: Get system projects without timesheets ──────────
        let systemEmployees = [];
        if (!employeeName && !month && !year) {
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
                ? `AND ${systemWhere.join(' AND ')}` 
                : '';
            
            systemEmployees = await query(`
                SELECT 
                    a.user_id,
                    u.emp_id as employee_code,
                    u.name as employee_name,
                    p.id as project_id,
                    p.project_code,
                    p.project_name,
                    p.client_name,
                    COALESCE(SUM(a.units_assigned), 0) as assigned_units,
                    COALESCE(SUM(a.estimated_days), 0) as assigned_days,
                    COALESCE(SUM(a.estimated_hours), 0) as assigned_hours,
                    0 as actual_hours,
                    COALESCE(ee.effort_days, 0) as role_effort_days,
                    COALESCE(ee.effort_hrs, 0) as role_effort_hours,
                    COALESCE(ee.total_hrs, 0) as role_total_hrs,
                    a.role as roles,
                    1 as project_exists,
                    2 as source
                FROM assignments a
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN projects p ON a.project_id = p.id
                LEFT JOIN effort_estimates ee ON ee.project_id = a.project_id AND ee.role = a.role
                WHERE 1=1
                ${systemWhereClause}
                AND NOT EXISTS (SELECT 1 FROM timesheet_entries te WHERE te.project_id = a.project_id)
                GROUP BY a.user_id, u.emp_id, u.name, p.id, p.project_code, p.project_name, 
                         p.client_name, ee.effort_days, ee.effort_hrs, ee.total_hrs, a.role
            `, systemParams);
        }
        
        // ─── COMBINE and DEDUPLICATE ──────────────────────────────────
        const employeeMap = new Map();
        
        timesheetEmployees.forEach(e => {
            const key = `${e.employee_code}_${e.project_code}`;
            employeeMap.set(key, e);
        });
        
        systemEmployees.forEach(e => {
            const key = `${e.employee_code}_${e.project_code}`;
            if (!employeeMap.has(key)) {
                employeeMap.set(key, e);
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
            const assignedUnits = parseFloat(e.assigned_units || 0);
            const assignedDays = parseFloat(e.assigned_days || 0);
            const assignedHours = parseFloat(e.assigned_hours || 0);
            
            const roleEffortDays = parseFloat(e.role_effort_days || 0);
            const roleEffortHours = parseFloat(e.role_effort_hours || 0);
            
            const actual = parseFloat(e.actual_hours || 0);
            
            const estimatedHours = assignedHours > 0 ? assignedHours : roleEffortHours;
            const estimatedDays = assignedDays > 0 ? assignedDays : roleEffortDays;
            
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
            
            let status = 'On Track';
            if (estimatedHours > 0) {
                if (variancePct < -20) status = 'Over Utilized';
                else if (variancePct > 20) status = 'Under Utilized';
            } else if (!e.project_exists) {
                status = 'Project Not Found';
            } else if (estimatedHours === 0 && actual === 0) {
                status = 'No Activity';
            } else if (estimatedHours === 0 && actual > 0) {
                status = 'No Estimate';
            }
            
            let roleDisplay = 'Not Assigned';
            if (e.roles) {
                const roleList = e.roles.split(',');
                roleDisplay = roleList.length > 0 ? roleList[0] : 'Not Assigned';
            }
            
            return {
                employee_code: e.employee_code || '—',
                employee_name: e.employee_name || 'Unknown',
                reporting_manager: e.reporting_manager || '—',
                project_id: e.project_id,
                project_code: e.project_code || '—',
                project_name: e.project_name || '—',
                client_name: e.client_name || '—',
                assigned_units: assignedUnits.toFixed(1),
                assigned_days: estimatedDays.toFixed(1),
                assigned_hours: estimatedHours.toFixed(1),
                actual_hours: actual.toFixed(1),
                actual_days: (actual / 8).toFixed(1),
                variance_hours: variance.toFixed(1),
                variance_pct: variancePct.toFixed(1),
                utilization_pct: utilizationDisplay,
                role: roleDisplay,
                project_exists: e.project_exists === 1,
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
// 5. GET PROJECT DETAIL (FIXED)
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
        }
        
        let projectData;
        let roleData = [];
        let employeeData = [];
        
        // ─── Project Not Found in System ────────────────────────────
        if (!projectIdNum) {
            // Get data from timesheet_entries by original_project_code
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
            
            // Get timesheet employees (who logged hours)
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
            
            // Get project info
            projectData = await query(`
                SELECT 
                    p.id as project_id,
                    p.project_code,
                    p.project_name,
                    p.client_name,
                    COALESCE((SELECT SUM(total_hrs) FROM effort_estimates WHERE project_id = p.id), 0) as estimated_hours,
                    COALESCE((SELECT SUM(hours) FROM timesheet_entries WHERE project_id = p.id), 0) as actual_hours,
                    COALESCE((SELECT COUNT(DISTINCT user_id) FROM timesheet_entries WHERE project_id = p.id), 0) as employee_count,
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
                    COALESCE((SELECT SUM(hours) FROM timesheet_entries WHERE project_id = ee.project_id), 0) as actual_hours,
                    COALESCE((SELECT SUM(hours) FROM timesheet_entries WHERE project_id = ee.project_id), 0) / 8 as actual_days,
                    (ee.total_hrs - COALESCE((SELECT SUM(hours) FROM timesheet_entries WHERE project_id = ee.project_id), 0)) as variance_hours,
                    CASE 
                        WHEN ee.total_hrs > 0 
                        THEN ((ee.total_hrs - COALESCE((SELECT SUM(hours) FROM timesheet_entries WHERE project_id = ee.project_id), 0)) / ee.total_hrs * 100)
                        ELSE 0 
                    END as variance_pct
                FROM effort_estimates ee
                WHERE ee.project_id = ?
                ORDER BY ee.role
            `, [projectIdNum]);
            
            // ─── Get Assigned Employees (from assignments) ──────────
            const assignedData = await query(`
                SELECT 
                    u.emp_id as employee_code,
                    u.name as employee_name,
                    a.role,
                    a.units_assigned as assigned_hours,
                    a.units_assigned / 8 as assigned_days,
                    COALESCE(te_sum.total_hours, 0) as actual_hours,
                    COALESCE(te_sum.total_hours, 0) / 8 as actual_days
                FROM assignments a
                LEFT JOIN users u ON u.id = a.user_id
                LEFT JOIN (
                    SELECT user_id, SUM(hours) as total_hours
                    FROM timesheet_entries
                    WHERE project_id = ?
                    GROUP BY user_id
                ) te_sum ON te_sum.user_id = a.user_id
                WHERE a.project_id = ?
                ORDER BY u.name
            `, [projectIdNum, projectIdNum]);
            
            // ─── Get Timesheet Employees (who logged hours) ──────────
            const timesheetData = await query(`
                SELECT 
                    u.emp_id as employee_code,
                    u.name as employee_name,
                    a.role,
                    COALESCE(a.units_assigned, 0) as assigned_hours,
                    COALESCE(a.units_assigned, 0) / 8 as assigned_days,
                    COALESCE(SUM(te.hours), 0) as actual_hours,
                    COALESCE(SUM(te.hours), 0) / 8 as actual_days
                FROM timesheet_entries te
                LEFT JOIN users u ON te.user_id = u.id
                LEFT JOIN assignments a ON a.user_id = te.user_id AND a.project_id = te.project_id
                WHERE te.project_id = ?
                GROUP BY u.id, u.emp_id, u.name, a.role, a.units_assigned
                ORDER BY u.name
            `, [projectIdNum]);
            
            // ─── Combine Employee Data ──────────────────────────────────
            const employeeMap = new Map();
            
            // Process assigned employees
            assignedData.forEach(e => {
                const actualHrs = parseFloat(e.actual_hours || 0);
                const assignedHrs = parseFloat(e.assigned_hours || 0);
                
                employeeMap.set(e.employee_code, {
                    employee_code: e.employee_code || '—',
                    employee_name: e.employee_name || 'Unknown',
                    role: e.role || 'Not Assigned',
                    assigned_hours: assignedHrs,
                    assigned_days: assignedHrs / 8,
                    actual_hours: actualHrs,
                    actual_days: actualHrs / 8,
                    variance_hours: assignedHrs - actualHrs,
                    variance_pct: assignedHrs > 0 ? ((assignedHrs - actualHrs) / assignedHrs * 100) : 0,
                    assignment_status: 'Assigned',
                    timesheet_status: actualHrs > 0 ? 'Present' : 'Not Present',
                    utilization_pct: assignedHrs > 0 ? (actualHrs / assignedHrs * 100) : 0
                });
            });
            
            // Process timesheet employees (add if not already in map)
            timesheetData.forEach(e => {
                const actualHrs = parseFloat(e.actual_hours || 0);
                const assignedHrs = parseFloat(e.assigned_hours || 0);
                
                if (employeeMap.has(e.employee_code)) {
                    // Update existing entry
                    const existing = employeeMap.get(e.employee_code);
                    existing.timesheet_status = 'Present';
                    existing.actual_hours = Math.max(existing.actual_hours, actualHrs);
                    existing.actual_days = Math.max(existing.actual_days, actualHrs / 8);
                    existing.variance_hours = existing.assigned_hours - existing.actual_hours;
                    existing.variance_pct = existing.assigned_hours > 0 
                        ? ((existing.assigned_hours - existing.actual_hours) / existing.assigned_hours * 100) 
                        : 0;
                    existing.utilization_pct = existing.assigned_hours > 0 
                        ? (existing.actual_hours / existing.assigned_hours * 100) 
                        : 0;
                } else {
                    employeeMap.set(e.employee_code, {
                        employee_code: e.employee_code || '—',
                        employee_name: e.employee_name || 'Unknown',
                        role: e.role || 'Not Assigned',
                        assigned_hours: assignedHrs,
                        assigned_days: assignedHrs / 8,
                        actual_hours: actualHrs,
                        actual_days: actualHrs / 8,
                        variance_hours: assignedHrs - actualHrs,
                        variance_pct: assignedHrs > 0 ? ((assignedHrs - actualHrs) / assignedHrs * 100) : 0,
                        assignment_status: assignedHrs > 0 ? 'Assigned' : 'Not Assigned',
                        timesheet_status: 'Present',
                        utilization_pct: assignedHrs > 0 ? (actualHrs / assignedHrs * 100) : 0
                    });
                }
            });
            
            employeeData = Array.from(employeeMap.values());
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
            employeeSummary: employeeData.map(e => ({
                employee_code: e.employee_code || '—',
                employee_name: e.employee_name || 'Unknown',
                role: e.role || 'Not Assigned',
                assigned_hours: parseFloat(e.assigned_hours || 0),
                assigned_days: parseFloat(e.assigned_days || 0),
                actual_hours: parseFloat(e.actual_hours || 0),
                actual_days: parseFloat(e.actual_days || 0),
                variance_hours: parseFloat(e.variance_hours || 0),
                variance_pct: parseFloat(e.variance_pct || 0),
                assignment_status: e.assignment_status,
                timesheet_status: e.timesheet_status,
                utilization_pct: parseFloat(e.utilization_pct || 0)
            }))
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