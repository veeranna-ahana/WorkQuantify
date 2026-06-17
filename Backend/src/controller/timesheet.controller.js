const xlsx = require('xlsx');
const { query } = require("../config/db");

// Generate batch code
function generateBatchCode() {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-8);
    return `BATCH-${timestamp}`;
}

// MAIN API: Upload and store ALL data (no rejections)
const uploadTimesheet = async (req, res, next) => {
    try {
        console.log("Upload function called");
        
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Read Excel file
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            return res.status(400).json({ message: "Excel file is empty" });
        }

        // Get dates from first row
        const firstRow = data[0];
        let fromDate = firstRow['From Date'];
        let toDate = firstRow['To Date'];
        
        if (typeof fromDate === 'number') {
            fromDate = new Date((fromDate - 25569) * 86400 * 1000);
        }
        if (typeof toDate === 'number') {
            toDate = new Date((toDate - 25569) * 86400 * 1000);
        }
        
        fromDate = fromDate.toISOString().split('T')[0];
        toDate = toDate.toISOString().split('T')[0];
        
        // Create batch record
        const batchCode = generateBatchCode();
        const userId = req.user.id;
        
        const batchResult = await query(
            `INSERT INTO timesheet_batches 
             (batch_code, uploaded_by, week_start_date, week_end_date, file_name, total_records, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
            [batchCode, userId, fromDate, toDate, req.file.originalname, data.length]
        );
        
        const batchId = batchResult.insertId;
        
        // Get all existing projects for lookup
        const allProjects = await query(`SELECT id, project_code FROM projects WHERE project_code IS NOT NULL`);
        const projectMap = new Map();
        allProjects.forEach(p => projectMap.set(p.project_code, p.id));
        
        // Get all existing users for lookup
        const allUsers = await query(`SELECT id, emp_id FROM users WHERE emp_id IS NOT NULL`);
        const userMap = new Map();
        allUsers.forEach(u => userMap.set(u.emp_id, u.id));
        
        // Track statistics
        let totalEntries = 0;
        let employeeNotFoundCount = 0;
        let projectNotFoundCount = 0;
        let noHoursCount = 0;
        const missingEmployees = new Set();
        const missingProjects = new Set();
        
        // Process each row - STORE EVERYTHING
        for (const row of data) {
            const employeeCode = row['Employee Code'];
            const projectCode = row['Project Code'];
            
            // Look up IDs (may be null if not found)
            const employeeId = employeeCode ? userMap.get(String(employeeCode)) : null;
            const projectId = projectCode ? projectMap.get(String(projectCode)) : null;
            
            // Track missing data
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
            const baseDate = new Date(fromDate);
            let hasEntries = false;
            
            for (let i = 0; i < days.length; i++) {
                const day = days[i];
                let hours = parseFloat(row[day]) || 0;
                const description = row[`${day}s Description`] || '';
                
                if (hours > 0) {
                    hasEntries = true;
                    totalEntries++;
                    
                    const entryDate = new Date(baseDate);
                    entryDate.setDate(baseDate.getDate() + i);
                    const formattedDate = entryDate.toISOString().split('T')[0];
                    
                    // Determine reconciliation status
                    let reconStatus = 'pending';
                    if (!employeeId) {
                        reconStatus = 'missing_employee';
                    } else if (!projectId) {
                        reconStatus = 'missing_project';
                    }
                    
                    // ALWAYS INSERT - even if employee or project not found
                    await query(
                        `INSERT INTO timesheet_entries 
                         (batch_id, user_id, original_emp_code, project_id, original_project_code, 
                          entry_date, hours, description, day_of_week, employee_found, project_found, reconciliation_status) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            batchId, 
                            employeeId, 
                            employeeCode,
                            projectId, 
                            projectCode,
                            formattedDate, 
                            hours, 
                            description, 
                            day,
                            employeeId ? 1 : 0,
                            projectId ? 1 : 0,
                            reconStatus
                        ]
                    );
                }
            }
            
            if (!hasEntries) {
                noHoursCount++;
            }
        }
        
        // Update batch with counts
        const validRecords = data.length - (employeeNotFoundCount > 0 || projectNotFoundCount > 0 ? 
                               (data.filter(row => {
                                   const empCode = row['Employee Code'];
                                   const projCode = row['Project Code'];
                                   return (empCode && !userMap.get(String(empCode))) || 
                                          (projCode && !projectMap.get(String(projCode)));
                               }).length) : 0);
        
        await query(
            `UPDATE timesheet_batches 
             SET valid_records = ?, invalid_records = ? 
             WHERE id = ?`,
            [validRecords, data.length - validRecords, batchId]
        );
        
        // Return response with summary of missing data
        res.status(200).json({
            success: true,
            message: "Timesheet uploaded successfully. All data stored. Review missing mappings below.",
            data: {
                batch_id: batchId,
                batch_code: batchCode,
                total_records: data.length,
                total_entries_stored: totalEntries,
                week_start: fromDate,
                week_end: toDate,
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
                    message: "These projects need effort estimates added"
                },
                no_hours: {
                    count: noHoursCount,
                    message: "Rows with zero hours logged"
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

// Get all batches
const getBatches = async (req, res, next) => {
    try {
        const batches = await query(`
            SELECT tb.*, u.name as uploaded_by_name,
                   COUNT(DISTINCT te.id) as total_entries
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

// Get batch details with reconciliation summary
const getBatchDetails = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        
        // Get batch info
        const batch = await query(`
            SELECT tb.*, u.name as uploaded_by_name 
            FROM timesheet_batches tb
            LEFT JOIN users u ON tb.uploaded_by = u.id
            WHERE tb.id = ?
        `, [batchId]);
        
        if (batch.length === 0) {
            return res.status(404).json({ message: "Batch not found" });
        }
        
        // Get reconciliation summary
        const summary = await query(`
            SELECT 
                reconciliation_status,
                COUNT(*) as count,
                SUM(hours) as total_hours
            FROM timesheet_entries
            WHERE batch_id = ?
            GROUP BY reconciliation_status
        `, [batchId]);
        
        // Get missing employees (entries without user_id)
        const missingEmployees = await query(`
            SELECT DISTINCT original_emp_code, COUNT(*) as entry_count, SUM(hours) as total_hours
            FROM timesheet_entries
            WHERE batch_id = ? AND employee_found = 0
            GROUP BY original_emp_code
        `, [batchId]);
        
        // Get missing projects (entries without project_id)
        const missingProjects = await query(`
            SELECT DISTINCT original_project_code, COUNT(*) as entry_count, SUM(hours) as total_hours
            FROM timesheet_entries
            WHERE batch_id = ? AND project_found = 0
            GROUP BY original_project_code
        `, [batchId]);
        
        // Get reconciled entries
        const reconciledEntries = await query(`
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
        
        res.status(200).json({
            success: true,
            batch: batch[0],
            reconciliation_summary: summary,
            missing_employees: missingEmployees,
            missing_projects: missingProjects,
            entries: reconciledEntries
        });
    } catch (err) {
        next(err);
    }
};

// NEW: Get reconciliation report for a batch
const getReconciliationReport = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        
        // Compare with effort_estimates for projects that exist
        const projectLevelRecon = await query(`
            SELECT 
                p.project_code,
                p.project_name,
                COALESCE(ee.total_hrs, 0) as estimated_hours,
                COALESCE(SUM(te.hours), 0) as actual_hours,
                COALESCE(ee.total_hrs, 0) - COALESCE(SUM(te.hours), 0) as variance,
                CASE 
                    WHEN ee.id IS NULL THEN 'MISSING_ESTIMATE'
                    WHEN COALESCE(SUM(te.hours), 0) > COALESCE(ee.total_hrs, 0) THEN 'OVER'
                    WHEN COALESCE(SUM(te.hours), 0) < COALESCE(ee.total_hrs, 0) THEN 'UNDER'
                    ELSE 'MATCHED'
                END as status
            FROM timesheet_entries te
            LEFT JOIN projects p ON te.project_id = p.id
            LEFT JOIN effort_estimates ee ON ee.project_id = te.project_id
            WHERE te.batch_id = ? AND te.project_found = 1
            GROUP BY te.project_id
        `, [batchId]);
        
        res.status(200).json({
            success: true,
            batch_id: batchId,
            project_level_reconciliation: projectLevelRecon
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    uploadTimesheet,
    getBatches,
    getBatchDetails,
    getReconciliationReport
};