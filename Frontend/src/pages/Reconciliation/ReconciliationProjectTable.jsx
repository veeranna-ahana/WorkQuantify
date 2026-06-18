import React from 'react';

const getStatusBadge = (status) => {
    const styles = {
        matched: 'bg-green-100 text-green-800',
        under: 'bg-yellow-100 text-yellow-800',
        over: 'bg-red-100 text-red-800',
        missing: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || styles.missing;
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'matched': return '✅';
        case 'under': return '⚠️';
        case 'over': return '🔴';
        case 'missing': return '❓';
        default: return '❓';
    }
};

const ReconciliationProjectTable = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                No project data available
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Hrs</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Hrs</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Utilized %</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{item.project_code}</div>
                                <div className="text-xs text-gray-500 truncate max-w-xs">{item.project_name}</div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                                {item.estimated_hrs?.toFixed(1) || '-'}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                                {item.actual_hrs?.toFixed(1) || '0'}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <span className={`text-sm font-medium ${
                                    item.utilization_percentage > 80 ? 'text-green-600' :
                                    item.utilization_percentage > 50 ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {item.utilization_percentage?.toFixed(1) || 0}%
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                                {item.remaining_hrs?.toFixed(1) || '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                                    {getStatusIcon(item.status)} {item.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                                {item.status_message || '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReconciliationProjectTable;