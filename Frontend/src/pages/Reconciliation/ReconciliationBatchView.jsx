import React, { useState } from 'react';
import ReconciliationProjectTable from './ReconciliationProjectTable';
import ReconciliationEmployeeTable from './ReconciliationEmployeeTable';

const ReconciliationBatchView = ({ data, batch }) => {
    const [activeTab, setActiveTab] = useState('project');

    const { summary, project_level, employee_level } = data;

    return (
        <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 uppercase">Total Entries</p>
                    <p className="text-xl font-bold text-gray-800">{summary?.total_entries || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 uppercase">Total Hours</p>
                    <p className="text-xl font-bold text-gray-800">{summary?.total_actual_hrs?.toFixed(1) || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 uppercase">Projects</p>
                    <p className="text-xl font-bold text-gray-800">{summary?.unique_projects || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 uppercase">Employees</p>
                    <p className="text-xl font-bold text-gray-800">{summary?.unique_employees || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 uppercase">Batch</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{batch?.batch_code}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('project')}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
                            activeTab === 'project'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Project Level
                    </button>
                    <button
                        onClick={() => setActiveTab('employee')}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
                            activeTab === 'employee'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Employee Level
                    </button>
                </nav>
            </div>

            {/* Content */}
            {activeTab === 'project' && (
                <ReconciliationProjectTable data={project_level} />
            )}
            {activeTab === 'employee' && (
                <ReconciliationEmployeeTable data={employee_level} />
            )}
        </div>
    );
};

export default ReconciliationBatchView;