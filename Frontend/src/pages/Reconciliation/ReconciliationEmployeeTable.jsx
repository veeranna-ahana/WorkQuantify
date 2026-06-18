import React, { useState } from 'react';

const getStatusBadge = (status) => {
    const styles = {
        matched: 'bg-green-100 text-green-800',
        missing: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || styles.missing;
};

const ReconciliationEmployeeTable = ({ data }) => {
    const [expanded, setExpanded] = useState(null);

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                No employee data available
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((item, index) => (
                        <React.Fragment key={index}>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">{item.emp_id}</div>
                                    <div className="text-xs text-gray-500">{item.employee_name}</div>
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-600">
                                    {item.total_projects || 0}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                                    {item.total_actual_hrs?.toFixed(1) || '0'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                                    {item.status_message || '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => setExpanded(expanded === index ? null : index)}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        {expanded === index ? 'Hide' : 'View'}
                                    </button>
                                </td>
                            </tr>
                            {expanded === index && item.projects && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-2 bg-gray-50">
                                        <div className="text-xs text-gray-600">
                                            <span className="font-medium">Projects:</span>
                                            {item.projects.map((p, i) => (
                                                <span key={i} className="ml-2 inline-block bg-white px-2 py-1 rounded border border-gray-200">
                                                    {p.project_name}: {p.hours?.toFixed(1)} hrs
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReconciliationEmployeeTable;