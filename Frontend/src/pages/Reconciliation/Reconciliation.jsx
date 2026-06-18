import React, { useState, useEffect } from 'react';
import { 
    Upload, 
    Button, 
    Select, 
    Card, 
    Statistic, 
    Row, 
    Col, 
    Table, 
    Tag, 
    message, 
    Spin,
    Empty,
    Tooltip,
    Alert,
    Typography,
    Space
} from 'antd';
import { 
    UploadOutlined, 
    ReloadOutlined, 
    FileExcelOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    CloseCircleOutlined,
    QuestionCircleOutlined,
    UserOutlined,
    ProjectOutlined,
    ClockCircleOutlined,
    PercentageOutlined,
    DownOutlined,
    RightOutlined
} from '@ant-design/icons';
import { getBatches, getBatchReconciliation, uploadTimesheet } from '../../api/timesheet.api';

const { Option } = Select;
const { Text, Title } = Typography;

const Reconciliation = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [reconciliationData, setReconciliationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const response = await getBatches();
            const batchList = response.data || [];
            setBatches(batchList);
            
            const latestBatchWithData = batchList
                .filter(b => b.total_entries > 0)
                .sort((a, b) => b.id - a.id)[0];
            
            if (latestBatchWithData) {
                setSelectedBatch(latestBatchWithData);
                await fetchReconciliation(latestBatchWithData.id);
            } else if (batchList.length > 0) {
                const latestBatch = batchList.sort((a, b) => b.id - a.id)[0];
                setSelectedBatch(latestBatch);
                setReconciliationData(null);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to load batches');
        } finally {
            setLoading(false);
        }
    };

    const fetchReconciliation = async (batchId) => {
        setLoading(true);
        try {
            const response = await getBatchReconciliation(batchId);
            setReconciliationData(response);
            // Auto expand first project with employees
            const projectLevel = response?.project_level || [];
            if (projectLevel.length > 0) {
                setExpandedRowKeys([projectLevel[0].project_code]);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to load reconciliation data');
            setReconciliationData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning('Please select a file first');
            return;
        }

        const file = fileList[0].originFileObj;
        setUploading(true);
        try {
            const response = await uploadTimesheet(file);
            message.success('Timesheet uploaded successfully!');
            setFileList([]);
            await fetchBatches();
            if (response.data?.batch_id) {
                await fetchReconciliation(response.data.batch_id);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleBatchChange = async (batchId) => {
        const batch = batches.find(b => b.id === batchId);
        if (batch) {
            setSelectedBatch(batch);
            if (batch.total_entries > 0) {
                await fetchReconciliation(batchId);
            } else {
                setReconciliationData(null);
                message.info('This batch has no data');
            }
        }
    };

    const uploadProps = {
        onRemove: () => setFileList([]),
        beforeUpload: (file) => {
            const isValid = file.type === 'application/vnd.ms-excel' || 
                           file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            if (!isValid) {
                message.error('Please upload Excel files only (.xls, .xlsx)');
                return false;
            }
            setFileList([file]);
            return false;
        },
        fileList,
    };

    // ─── Helper Functions ─────────────────────────────────────────────
    const getStatusBadge = (status) => {
        const config = {
            matched: { color: 'success', icon: <CheckCircleOutlined />, label: 'On Track' },
            under: { color: 'warning', icon: <WarningOutlined />, label: 'Under' },
            over: { color: 'error', icon: <CloseCircleOutlined />, label: 'Over' },
            missing: { color: 'default', icon: <QuestionCircleOutlined />, label: 'Missing' },
        };
        return config[status] || config.missing;
    };

    const getStatusColor = (status) => {
        const colors = {
            matched: '#52c41a',
            under: '#faad14',
            over: '#ff4d4f',
            missing: '#d9d9d9'
        };
        return colors[status] || '#d9d9d9';
    };

    const safeToFixed = (value, decimals = 1) => {
        if (value === undefined || value === null || isNaN(value)) return '0';
        return Number(value).toFixed(decimals);
    };

    // ─── Employee Sub-Table Columns ──────────────────────────────────
    const employeeSubColumns = [
        {
            title: 'Employee',
            key: 'employee',
            width: 200,
            fixed: 'left',
            render: (_, record) => (
                <div>
                    <div className="font-medium text-sm">{record.emp_id || 'N/A'}</div>
                    <div className="text-xs text-gray-400">{record.employee_name || 'Unknown'}</div>
                </div>
            ),
        },
        {
            title: 'Role',
            key: 'role',
            width: 130,
            render: (_, record) => {
                const role = record.role || 'Not Assigned';
                return (
                    <span className={role === 'Not Assigned' ? 'text-orange-500' : 'text-gray-700'}>
                        {role}
                    </span>
                );
            },
        },
        {
            title: 'Estimated',
            key: 'estimated',
            align: 'center',
            width: 130,
            render: (_, record) => (
                (record.estimated_hrs || 0) > 0 ? (
                    <div>
                        <div className="text-sm font-medium">{safeToFixed(record.estimated_hrs)}</div>
                        <div className="text-xs text-gray-400">{safeToFixed(record.estimated_days)} days</div>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">No estimate</span>
                )
            ),
        },
        {
            title: 'Actual',
            key: 'actual',
            align: 'center',
            width: 130,
            render: (_, record) => (
                <div>
                    <div className="text-sm font-medium text-blue-600">{safeToFixed(record.hours || record.actual_hrs || 0)}</div>
                    <div className="text-xs text-gray-400">{safeToFixed((record.hours || record.actual_hrs || 0) / 8)} days</div>
                </div>
            ),
        },
        {
            title: 'Utilized',
            key: 'utilized',
            align: 'center',
            width: 130,
            render: (_, record) => (
                (record.estimated_hrs || 0) > 0 ? (
                    <div>
                        <div className="text-sm font-medium">{safeToFixed(record.utilized_hrs)}</div>
                        <div className="text-xs text-gray-400">{safeToFixed(record.utilized_days)} days</div>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                )
            ),
        },
        {
            title: 'Remaining',
            key: 'remaining',
            align: 'center',
            width: 130,
            render: (_, record) => (
                (record.estimated_hrs || 0) > 0 ? (
                    <div>
                        <div className="text-sm font-medium">{safeToFixed(record.remaining_hrs)}</div>
                        <div className="text-xs text-gray-400">{safeToFixed(record.remaining_days)} days</div>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                )
            ),
        },
        {
            title: 'Utilization',
            key: 'utilization',
            align: 'center',
            width: 110,
            render: (_, record) => {
                if ((record.estimated_hrs || 0) === 0) {
                    return <span className="text-gray-400 text-sm">N/A</span>;
                }
                const val = record.utilization_percentage || 0;
                return (
                    <span className={`font-semibold ${
                        val > 100 ? 'text-red-600' :
                        val > 80 ? 'text-green-600' : 
                        val > 50 ? 'text-yellow-600' : 
                        val > 0 ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                        {safeToFixed(val)}%
                    </span>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            align: 'center',
            width: 140,
            fixed: 'right',
            render: (_, record) => {
                if (record.role === 'Not Assigned' || !record.role) {
                    return <Tag color="orange">⚠️ Not Assigned</Tag>;
                }
                if ((record.estimated_hrs || 0) === 0) {
                    return <Tag color="default">❓ No Estimate</Tag>;
                }
                const status = record.status || 'missing';
                return (
                    <Tag color={getStatusColor(status)}>
                        {getStatusBadge(status).icon} {getStatusBadge(status).label}
                    </Tag>
                );
            },
        },
    ];

    // ─── Project Main Table Columns ──────────────────────────────────
    const projectColumns = [
        {
            title: 'Project',
            key: 'project',
            width: 280,
            fixed: 'left',
            render: (_, record) => (
                <div>
                    <div className="font-medium text-sm">{record.project_code || 'N/A'}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[180px]">{record.project_name || 'Unknown'}</div>
                    {record.project_exists === false && (
                        <Tag color="error" className="mt-1">Not Found</Tag>
                    )}
                    <div className="mt-1 text-xs text-gray-400">
                        <UserOutlined /> {record.unique_employees || 0} employees
                    </div>
                    {record.roles && record.roles.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                            {record.roles.slice(0, 3).map((role, i) => (
                                <Tag key={i} color="blue" className="text-xs">{role}</Tag>
                            ))}
                            {record.roles.length > 3 && (
                                <Tag className="text-xs">+{record.roles.length - 3}</Tag>
                            )}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Estimated',
            key: 'estimated',
            align: 'center',
            width: 130,
            render: (_, record) => (
                (record.estimated_hrs || 0) > 0 ? (
                    <div>
                        <div className="text-sm font-medium">{safeToFixed(record.estimated_hrs)}</div>
                        <div className="text-xs text-gray-400">{safeToFixed(record.estimated_days)} days</div>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">No estimate</span>
                )
            ),
        },
        {
            title: 'Actual',
            key: 'actual',
            align: 'center',
            width: 130,
            render: (_, record) => (
                <div>
                    <div className="text-sm font-medium text-blue-600">{safeToFixed(record.actual_hrs)}</div>
                    <div className="text-xs text-gray-400">{safeToFixed(record.actual_days)} days</div>
                </div>
            ),
        },
        {
            title: 'Utilized',
            key: 'utilized',
            align: 'center',
            width: 130,
            render: (_, record) => (
                (record.estimated_hrs || 0) > 0 ? (
                    <div>
                        <div className="text-sm font-medium">{safeToFixed(record.utilized_hrs)}</div>
                        <div className="text-xs text-gray-400">{safeToFixed(record.utilized_days)} days</div>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                )
            ),
        },
        {
            title: 'Remaining',
            key: 'remaining',
            align: 'center',
            width: 130,
            render: (_, record) => (
                (record.estimated_hrs || 0) > 0 ? (
                    <div>
                        <div className="text-sm font-medium">{safeToFixed(record.remaining_hrs)}</div>
                        <div className="text-xs text-gray-400">{safeToFixed(record.remaining_days)} days</div>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                )
            ),
        },
        {
            title: 'Utilization',
            key: 'utilization',
            align: 'center',
            width: 110,
            render: (_, record) => {
                if ((record.estimated_hrs || 0) === 0) {
                    return <span className="text-gray-400 text-sm">N/A</span>;
                }
                const val = record.utilization_percentage || 0;
                return (
                    <span className={`font-semibold ${
                        val > 100 ? 'text-red-600' :
                        val > 80 ? 'text-green-600' : 
                        val > 50 ? 'text-yellow-600' : 
                        val > 0 ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                        {safeToFixed(val)}%
                    </span>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            align: 'center',
            width: 150,
            fixed: 'right',
            render: (_, record) => {
                const status = record.status || 'missing';
                return (
                    <div>
                        <Tag color={getStatusColor(status)} icon={getStatusBadge(status).icon}>
                            {getStatusBadge(status).label}
                        </Tag>
                        <div className="text-xs text-gray-400 mt-1">{record.status_message || ''}</div>
                    </div>
                );
            },
        },
    ];

    // ─── Build Employee Breakdown for Expanded Row ──────────────────
    const expandedRowRender = (record) => {
        // Get employees for this project from employee_level
        const projectEmployees = reconciliationData?.employee_level?.filter(emp => 
            emp.projects && emp.projects.some(p => p.project_code === record.project_code)
        ) || [];

        if (projectEmployees.length === 0) {
            return (
                <div className="text-center py-4 text-gray-400">
                    <Empty description="No employee data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            );
        }

        // Flatten employee data for the table
        const employeeData = [];
        projectEmployees.forEach(emp => {
            const project = emp.projects.find(p => p.project_code === record.project_code);
            if (project) {
                employeeData.push({
                    key: `${record.project_code}-${emp.emp_id}`,
                    emp_id: emp.emp_id,
                    employee_name: emp.employee_name,
                    role: project.role || 'Not Assigned',
                    estimated_hrs: project.estimated_hrs || 0,
                    estimated_days: project.estimated_days || 0,
                    hours: project.hours || 0,
                    actual_hrs: project.hours || 0,
                    actual_days: (project.hours || 0) / 8,
                    utilized_hrs: project.utilized_hrs || 0,
                    utilized_days: project.utilized_days || 0,
                    remaining_hrs: project.remaining_hrs || 0,
                    remaining_days: project.remaining_days || 0,
                    utilization_percentage: project.utilization_percentage || 0,
                    status: project.status || 'missing'
                });
            }
        });

        return (
            <div className="p-4 bg-gray-50 rounded-b-lg">
                <div className="mb-3 text-sm font-medium text-gray-700">
                    <UserOutlined /> Employee Breakdown
                </div>
                <Table
                    columns={employeeSubColumns}
                    dataSource={employeeData}
                    pagination={false}
                    size="small"
                    rowKey="key"
                    scroll={{ x: 1000 }}
                />
            </div>
        );
    };

    // ─── Extract Data ────────────────────────────────────────────────
const summary = reconciliationData?.summary || {};
const projectLevel = reconciliationData?.project_level || [];
const employeeLevel = reconciliationData?.employee_level || [];

// ─── Calculate Utilization CORRECTLY ────────────────────────────
// Only consider projects WITH estimates
const projectsWithEstimates = projectLevel.filter(p => (p.estimated_hrs || 0) > 0);
const projectsWithoutEstimates = projectLevel.filter(p => (p.estimated_hrs || 0) === 0);
const totalProjectsWithEstimates = projectsWithEstimates.length;
const totalProjectsWithoutEstimates = projectsWithoutEstimates.length;

// Calculate total estimated and actual ONLY from projects with estimates
const totalEstimated = projectsWithEstimates.reduce((sum, p) => sum + (p.estimated_hrs || 0), 0);
const totalActualFromEstimatedProjects = projectsWithEstimates.reduce((sum, p) => sum + (p.actual_hrs || 0), 0);

// Calculate utilization percentage - ONLY for projects with estimates
const correctUtilizationPercentage = totalEstimated > 0 
    ? (totalActualFromEstimatedProjects / totalEstimated) * 100 
    : 0;

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Title level={2}>Reconciliation</Title>
                <Text type="secondary">Upload timesheets and view reconciliation data</Text>
            </div>

            {/* Upload Section */}
            <Card className="mb-6 shadow-sm">
                <Row gutter={16} align="middle">
                    <Col xs={24} md={6}>
                        <div>
                            <div className="font-medium">Upload Timesheet</div>
                            <div className="text-xs text-gray-400">Excel files (.xls, .xlsx)</div>
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />}>
                                {fileList.length > 0 ? fileList[0].name : 'Select File'}
                            </Button>
                        </Upload>
                    </Col>
                    <Col xs={24} md={6}>
                        <Button
                            type="primary"
                            onClick={handleUpload}
                            loading={uploading}
                            disabled={fileList.length === 0}
                            icon={<FileExcelOutlined />}
                            block
                        >
                            Upload
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Batch Selector */}
            {batches.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Select Batch:</span>
                    <Select
                        value={selectedBatch?.id}
                        onChange={handleBatchChange}
                        style={{ minWidth: 350 }}
                        loading={loading}
                    >
                        {batches.map((batch) => (
                            <Option key={batch.id} value={batch.id}>
                                {batch.batch_code} - {batch.file_name?.split('_').pop() || 'Unknown'} 
                                ({batch.total_entries || 0} entries) - {batch.created_at?.split('T')[0]}
                            </Option>
                        ))}
                    </Select>
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={fetchBatches}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                    {selectedBatch && (
                        <span className="text-xs text-gray-400">
                            {/* Status: <Tag color={selectedBatch.status === 'draft' ? 'default' : 'green'}>
                                {selectedBatch.status}
                            </Tag> */}
                        </span>
                    )}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center h-64">
                    <Spin size="large" description="Loading reconciliation data..." />
                </div>
            )}

            {/* Reconciliation Data */}
            {!loading && reconciliationData && summary.total_entries > 0 && (
                <div>
                    {/* Warning for projects without estimates */}
                    {totalProjectsWithoutEstimates > 0 && (
                        <Alert
                            title={`${totalProjectsWithoutEstimates} project(s) don't have effort estimates`}
                            description="Add effort estimates for these projects to get accurate reconciliation data."
                            type="warning"
                            showIcon
                            className="mb-4"
                        />
                    )}

                    {/* Summary Cards */}
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={12} sm={8} md={4}>
                            <Card>
                                <Statistic 
                                    title="Total Entries" 
                                    value={summary.total_entries || 0} 
                                    styles={{ content: { fontSize: '20px' } }}
                                    prefix={<ClockCircleOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Card>
                                <Statistic 
                                    title="Total Hours" 
                                    value={safeToFixed(summary.total_actual_hrs)} 
                                    styles={{ content: { fontSize: '20px' } }}
                                    prefix={<ClockCircleOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Card>
                                <Statistic 
                                    title="Projects" 
                                    value={summary.unique_projects || 0} 
                                    styles={{ content: { fontSize: '20px' } }}
                                    prefix={<ProjectOutlined />}
                                    suffix={
                                        <span className="text-xs text-gray-400">
                                            ({totalProjectsWithEstimates} with estimates)
                                        </span>
                                    }
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Card>
                                <Statistic 
                                    title="Employees" 
                                    value={summary.unique_employees || 0} 
                                    styles={{ content: { fontSize: '20px' } }}
                                    prefix={<UserOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Card>
                                <Statistic
                                    title="Utilization"
                                    value={safeToFixed(correctUtilizationPercentage)}
                                    suffix="%"
                                    styles={{
                                        content: {
                                            fontSize: '20px',
                                            color: correctUtilizationPercentage > 100 ? '#ff4d4f' :
                                                correctUtilizationPercentage > 80 ? '#52c41a' :
                                                    correctUtilizationPercentage > 50 ? '#faad14' : '#1890ff'
                                        }
                                    }}
                                    prefix={<PercentageOutlined />}
                                />
                                {totalProjectsWithoutEstimates > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                        Based on {totalProjectsWithEstimates} projects with estimates
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* Project Level Table */}
                    <Card className="shadow-sm">
                        <div className="mb-3">
                            <Title level={4}>Project Level</Title>
                            <Text type="secondary">Click expand (▶) on any project to view employee breakdown</Text>
                        </div>
                        <Table
                            columns={projectColumns}
                            dataSource={projectLevel}
                            rowKey="project_code"
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: 1200 }}
                            expandable={{
                                expandedRowRender: expandedRowRender,
                                expandedRowKeys: expandedRowKeys,
                                onExpand: (expanded, record) => {
                                    setExpandedRowKeys(expanded ? [record.project_code] : []);
                                },
                                rowExpandable: (record) => (record.unique_employees || 0) > 0,
                            }}
                        />
                    </Card>
                </div>
            )}

            {/* Empty State - No data in selected batch */}
            {!loading && reconciliationData && summary.total_entries === 0 && (
                <Card className="text-center py-12">
                    <Empty 
                        description={
                            <div>
                                <p className="text-gray-500">This batch has no data</p>
                                <p className="text-gray-400 text-sm">Batch {selectedBatch?.batch_code} has 0 entries</p>
                            </div>
                        }
                    />
                </Card>
            )}

            {/* Empty State - No batches at all */}
            {!loading && !reconciliationData && batches.length === 0 && (
                <Card className="text-center py-12">
                    <Empty 
                        description={
                            <div>
                                <p className="text-gray-500">No timesheets uploaded yet.</p>
                                <p className="text-gray-400 text-sm">Upload a timesheet file to start reconciliation.</p>
                            </div>
                        }
                    />
                </Card>
            )}
        </div>
    );
};

export default Reconciliation;