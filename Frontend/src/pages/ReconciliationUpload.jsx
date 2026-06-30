import React, { useState, useRef, useEffect } from 'react';
import {
    Upload,
    Button,
    Card,
    Table,
    Tag,
    message,
    Spin,
    Alert,
    Typography,
    Space,
    Select,
    Divider,
    Statistic,
    Row,
    Col
} from 'antd';
import {
    UploadOutlined,
    FileExcelOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    ReloadOutlined,
    InboxOutlined,
    FolderOpenOutlined
} from '@ant-design/icons';
import { uploadTimesheet, getBatchDetails, getBatches } from '../api/timesheet.api';

const { Text, Title } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const ReconciliationUpload = ({ onUploadSuccess }) => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [batchDetails, setBatchDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [projectStatusData, setProjectStatusData] = useState([]);
    const [expandedProject, setExpandedProject] = useState(null);
    const [allBatches, setAllBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [loadingBatches, setLoadingBatches] = useState(false);

    useEffect(() => {
        fetchAllBatches();
    }, []);

    const fetchAllBatches = async () => {
        setLoadingBatches(true);
        try {
            const response = await getBatches();
            const batches = response.data || [];
            setAllBatches(batches);
            if (batches.length > 0) {
                const latestWithData = batches.find(b => b.total_entries > 0);
                const batchToSelect = latestWithData || batches[0];
                setSelectedBatchId(batchToSelect.id);
                await fetchBatchDetails(batchToSelect.id);
            }
        } catch (err) {
            console.error('Failed to fetch batches:', err);
        } finally {
            setLoadingBatches(false);
        }
    };

    const fetchBatchDetails = async (batchId) => {
        setLoadingDetails(true);
        try {
            const details = await getBatchDetails(batchId);
            setBatchDetails(details);
            buildProjectStatusData(details);
        } catch (err) {
            console.error('Failed to fetch batch details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const buildProjectStatusData = (details) => {
        if (!details?.entries || details.entries.length === 0) {
            setProjectStatusData([]);
            return;
        }
        const projectMap = new Map();
        details.entries.forEach(entry => {
            const projectCode = entry.project_code || entry.original_project_code;
            if (!projectCode) return;
            if (!projectMap.has(projectCode)) {
                projectMap.set(projectCode, {
                    project_code: projectCode,
                    project_name: entry.original_project_name || projectCode,
                    project_exists: entry.project_found === 1 && !!entry.project_id,
                    total_hours: 0,
                    employee_count: new Set(),
                    entry_count: 0,
                    employee_details: []
                });
            }
            const project = projectMap.get(projectCode);
            project.total_hours += parseFloat(entry.hours || 0);
            if (entry.user_id) {
                project.employee_count.add(entry.user_id);
                project.employee_details.push({
                    emp_id: entry.emp_id || entry.original_emp_code,
                    name: entry.employee_name || 'Unknown',
                    hours: parseFloat(entry.hours || 0)
                });
            }
            project.entry_count += 1;
        });
        const data = Array.from(projectMap.values()).map(p => {
            const empMap = new Map();
            p.employee_details.forEach(emp => {
                if (empMap.has(emp.emp_id)) {
                    empMap.get(emp.emp_id).hours += emp.hours;
                } else {
                    empMap.set(emp.emp_id, { ...emp });
                }
            });
            p.employee_details = Array.from(empMap.values());
            p.employee_count = p.employee_details.length;
            return p;
        });
        data.sort((a, b) => {
            if (a.project_exists === b.project_exists) return a.project_code.localeCompare(b.project_code);
            return a.project_exists ? 1 : -1;
        });
        setProjectStatusData(data);
    };

    const handleBatchChange = async (batchId) => {
        setSelectedBatchId(batchId);
        setUploadResult(null);
        await fetchBatchDetails(batchId);
    };

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning('Please select a file first');
            return;
        }
        const file = fileList[0].originFileObj || fileList[0];
        if (!file) {
            message.error('Invalid file selected');
            return;
        }
        setUploading(true);
        setUploadResult(null);
        setProjectStatusData([]);
        try {
            const response = await uploadTimesheet(file);
            setUploadResult(response);
            const duplicateCount = response.data?.duplicate_entries || 0;
            if (duplicateCount > 0) {
                message.warning(`${duplicateCount} duplicate entries were skipped`);
            } else {
                message.success('Timesheet uploaded successfully!');
            }
            await fetchAllBatches();
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
            message.error(errorMsg);
            setUploadResult(null);
        } finally {
            setUploading(false);
            setFileList([]);
        }
    };

    const uploadProps = {
        onRemove: () => setFileList([]),
        beforeUpload: (file) => {
            const isValid =
                file.type === 'application/vnd.ms-excel' ||
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.name.endsWith('.xls') ||
                file.name.endsWith('.xlsx');
            if (!isValid) {
                message.error('Please upload Excel files only (.xls, .xlsx)');
                return false;
            }
            setFileList([file]);
            return false;
        },
        fileList,
        maxCount: 1,
    };

    const projectStatusColumns = [
        {
            title: 'Project Code',
            dataIndex: 'project_code',
            key: 'project_code',
            width: 180,
            render: (text) => (
                <Text code style={{ fontSize: 13 }}>{text || 'N/A'}</Text>
            ),
        },
        {
            title: 'Project Name',
            dataIndex: 'project_name',
            key: 'project_name',
            render: (text, record) => (
                <Text style={{ color: '#1d1d1f' }}>{text || record.project_code || 'Unknown'}</Text>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            width: 190,
            render: (_, record) =>
                record.project_exists ? (
                    <Tag
                        icon={<CheckCircleOutlined />}
                        color="success"
                        style={{ borderRadius: 20, padding: '2px 10px', fontWeight: 500 }}
                    >
                        Found in System
                    </Tag>
                ) : (
                    <Tag
                        icon={<CloseCircleOutlined />}
                        color="error"
                        style={{ borderRadius: 20, padding: '2px 10px', fontWeight: 500 }}
                    >
                        Not Found — Create
                    </Tag>
                ),
        },
        {
            title: 'Total Hours',
            dataIndex: 'total_hours',
            key: 'total_hours',
            align: 'right',
            width: 120,
            render: (hours) => (
                <Text strong style={{ color: '#1d1d1f' }}>
                    {hours?.toFixed(1) || '0'} <Text type="secondary" style={{ fontWeight: 400, fontSize: 12 }}>hrs</Text>
                </Text>
            ),
        },
        {
            title: 'Employees',
            dataIndex: 'employee_count',
            key: 'employee_count',
            align: 'center',
            width: 100,
            render: (count) => (
                <Tag color="blue" style={{ borderRadius: 20, padding: '2px 10px' }}>
                    {count || 0}
                </Tag>
            ),
        },
        {
            title: '',
            key: 'actions',
            align: 'center',
            width: 140,
            render: (_, record) => (
                <Button
                    type="text"
                    size="small"
                    icon={<UserOutlined />}
                    style={{ color: '#4f46e5', fontWeight: 500 }}
                    onClick={() =>
                        setExpandedProject(
                            expandedProject === record.project_code ? null : record.project_code
                        )
                    }
                >
                    {expandedProject === record.project_code ? 'Hide' : 'Employees'}
                </Button>
            ),
        },
    ];

    const expandedRowRender = (record) => {
        if (!record.employee_details || record.employee_details.length === 0) {
            return <div style={{ color: '#9ca3af', padding: '8px 16px' }}>No employee details available</div>;
        }
        const employeeColumns = [
            { title: 'Employee Code', dataIndex: 'emp_id', key: 'emp_id', width: 150 },
            { title: 'Employee Name', dataIndex: 'name', key: 'name' },
            {
                title: 'Hours',
                dataIndex: 'hours',
                key: 'hours',
                align: 'right',
                render: (hours) => `${hours?.toFixed(1) || '0'} hrs`,
            },
        ];
        return (
            <div style={{ padding: '12px 24px', background: '#f8fafc', borderRadius: 8, margin: '4px 0' }}>
                <Text strong style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 10 }}>
                    👥 Employee Breakdown
                </Text>
                <Table
                    columns={employeeColumns}
                    dataSource={record.employee_details}
                    pagination={false}
                    size="small"
                    rowKey="emp_id"
                    style={{ background: 'transparent' }}
                />
            </div>
        );
    };

    const foundProjects = projectStatusData.filter(p => p.project_exists).length;
    const notFoundProjects = projectStatusData.filter(p => !p.project_exists).length;
    const hasData = projectStatusData.length > 0;

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

            {/* ── Page Header ─────────────────────────────────────── */}
            <div style={{ marginBottom: 28 }}>
                <Title level={4} style={{ margin: 0, color: '#111827', fontWeight: 700 }}>
                    Timesheet Upload
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                    Upload and review timesheet data against active projects in the system
                </Text>
            </div>

            {/* ── Upload Card ──────────────────────────────────────── */}
            <Card
                style={{
                    marginBottom: 20,
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}
                bodyStyle={{ padding: '24px' }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    {/* Dragger zone */}
                    <div style={{ flex: 1, minWidth: 260 }}>
                        <Dragger
                            {...uploadProps}
                            style={{
                                borderRadius: 10,
                                background: '#f9fafb',
                                borderColor: fileList.length > 0 ? '#4f46e5' : '#d1d5db',
                                padding: '8px 0'
                            }}
                        >
                            <p style={{ marginBottom: 6 }}>
                                <InboxOutlined style={{ fontSize: 32, color: fileList.length > 0 ? '#4f46e5' : '#9ca3af' }} />
                            </p>
                            {fileList.length > 0 ? (
                                <>
                                    <p style={{ fontWeight: 600, color: '#4f46e5', margin: 0 }}>{fileList[0].name}</p>
                                    <p style={{ color: '#9ca3af', fontSize: 12, margin: '4px 0 0' }}>Click or drag to replace</p>
                                </>
                            ) : (
                                <>
                                    <p style={{ fontWeight: 500, color: '#374151', margin: 0 }}>Drop your Excel file here</p>
                                    {/* <p style={{ color: '#9ca3af', fontSize: 12, margin: '4px 0 0' }}>or click to browse — .xls, .xlsx supported</p> */}
                                </>
                            )}
                        </Dragger>
                    </div>

                    {/* Upload action */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 8 }}>
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleUpload}
                            loading={uploading}
                            disabled={fileList.length === 0}
                            icon={<FileExcelOutlined />}
                            style={{
                                background: fileList.length === 0 ? undefined : '#4f46e5',
                                borderColor: fileList.length === 0 ? undefined : '#4f46e5',
                                borderRadius: 8,
                                height: 44,
                                paddingInline: 28,
                                fontWeight: 600,
                                minWidth: 140
                            }}
                        >
                            {uploading ? 'Uploading…' : 'Upload'}
                        </Button>
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 6, textAlign: 'center' }}>
                            Max 1 file per upload
                        </Text>
                    </div>
                </div>
            </Card>

            {/* ── Batch Selector ───────────────────────────────────── */}
            <Card
                style={{
                    marginBottom: 20,
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}
                bodyStyle={{ padding: '16px 24px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <FolderOpenOutlined style={{ color: '#6b7280', fontSize: 16 }} />
                    <Text style={{ fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Active Batch</Text>
                    <Select
                        value={selectedBatchId}
                        onChange={handleBatchChange}
                        style={{ flex: 1, minWidth: 280, maxWidth: 480 }}
                        loading={loadingBatches}
                        placeholder="Select a batch…"
                        size="middle"
                    >
                        {allBatches.map((batch) => (
                            <Option key={batch.id} value={batch.id}>
                                <span style={{ fontFamily: 'monospace', marginRight: 6 }}>{batch.batch_code}</span>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    · {batch.file_name?.split('_').pop() || 'Unknown'} · {batch.total_entries || 0} entries · {batch.created_at?.split('T')[0]}
                                </Text>
                            </Option>
                        ))}
                    </Select>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchAllBatches}
                        loading={loadingBatches}
                        style={{ borderRadius: 8 }}
                    >
                        Refresh
                    </Button>
                </div>
            </Card>

            {/* ── Upload Result Summary ────────────────────────────── */}
            {uploadResult && (
                <Card
                    style={{
                        marginBottom: 20,
                        borderRadius: 12,
                        border: '1px solid #d1fae5',
                        background: '#f0fdf4',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                    }}
                    bodyStyle={{ padding: '20px 28px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 18 }} />
                        <Text strong style={{ fontSize: 15, color: '#15803d' }}>Upload Successful</Text>
                    </div>
                    <Row gutter={32}>
                        <Col>
                            <Statistic
                                title={<Text type="secondary" style={{ fontSize: 12 }}>Total Records</Text>}
                                value={uploadResult.data?.total_records || 0}
                                valueStyle={{ fontSize: 22, fontWeight: 700, color: '#111827' }}
                            />
                        </Col>
                        <Col>
                            <Statistic
                                title={<Text type="secondary" style={{ fontSize: 12 }}>Entries Stored</Text>}
                                value={uploadResult.data?.total_entries_stored || 0}
                                valueStyle={{ fontSize: 22, fontWeight: 700, color: '#111827' }}
                            />
                        </Col>
                        <Col>
                            <Statistic
                                title={<Text type="secondary" style={{ fontSize: 12 }}>Duplicates Skipped</Text>}
                                value={uploadResult.data?.duplicate_entries || 0}
                                valueStyle={{
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: uploadResult.data?.duplicate_entries > 0 ? '#dc2626' : '#16a34a'
                                }}
                            />
                        </Col>
                        <Col>
                            <Statistic
                                title={<Text type="secondary" style={{ fontSize: 12 }}>Projects</Text>}
                                value={`${foundProjects} / ${notFoundProjects}`}
                                suffix={<Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>found / missing</Text>}
                                valueStyle={{ fontSize: 22, fontWeight: 700, color: '#111827' }}
                            />
                        </Col>
                    </Row>
                </Card>
            )}

            {/* ── Alerts ──────────────────────────────────────────── */}
            {notFoundProjects > 0 && (
                <Alert
                    message={`${notFoundProjects} project${notFoundProjects > 1 ? 's' : ''} not found in the system`}
                    description="Create the missing projects before running reconciliation."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12, borderRadius: 10 }}
                />
            )}
            {uploadResult?.data?.duplicate_entries > 0 && (
                <Alert
                    message={`${uploadResult.data.duplicate_entries} duplicate entries skipped`}
                    description="These entries already exist in the system and were not inserted again."
                    type="info"
                    showIcon
                    style={{ marginBottom: 12, borderRadius: 10 }}
                />
            )}

            {/* ── Project Status Table ─────────────────────────────── */}
            {loadingDetails ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', flexDirection: 'column', gap: 12 }}>
                    <Spin size="large" />
                    <Text type="secondary" style={{ fontSize: 13 }}>Loading project details…</Text>
                </div>
            ) : hasData ? (
                <Card
                    style={{
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}
                    bodyStyle={{ padding: 0 }}
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                            <Text strong style={{ fontSize: 15, color: '#111827' }}>Project Status</Text>
                            <Space size={8}>
                                <Tag
                                    icon={<CheckCircleOutlined />}
                                    color="success"
                                    style={{ borderRadius: 20, padding: '3px 12px', fontWeight: 500 }}
                                >
                                    {foundProjects} Found
                                </Tag>
                                <Tag
                                    icon={<CloseCircleOutlined />}
                                    color="error"
                                    style={{ borderRadius: 20, padding: '3px 12px', fontWeight: 500 }}
                                >
                                    {notFoundProjects} Missing
                                </Tag>
                            </Space>
                        </div>
                    }
                    headStyle={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}
                >
                    <Table
                        columns={projectStatusColumns}
                        dataSource={projectStatusData}
                        rowKey="project_code"
                        pagination={{ pageSize: 10, showSizeChanger: false }}
                        size="middle"
                        scroll={{ x: 800 }}
                        rowClassName={(record) =>
                            !record.project_exists ? 'row-missing' : ''
                        }
                        expandable={{
                            expandedRowRender,
                            expandedRowKeys: expandedProject ? [expandedProject] : [],
                            onExpand: (expanded, record) =>
                                setExpandedProject(expanded ? record.project_code : null),
                            rowExpandable: (record) =>
                                record.employee_details && record.employee_details.length > 0,
                            showExpandColumn: false,
                        }}
                        style={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}
                    />
                </Card>
            ) : uploadResult && !loadingDetails ? (
                <Card
                    style={{ borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center', padding: '40px 0' }}
                >
                    <InboxOutlined style={{ fontSize: 40, color: '#d1d5db', display: 'block', marginBottom: 12 }} />
                    <Text type="secondary" style={{ fontSize: 14 }}>No project data found in this batch</Text>
                </Card>
            ) : null}

            {/* Row highlight style for missing projects */}
            <style>{`
                .row-missing td {
                    background-color: #fff7f7 !important;
                }
                .row-missing:hover td {
                    background-color: #fff0f0 !important;
                }
            `}</style>
        </div>
    );
};

export default ReconciliationUpload;