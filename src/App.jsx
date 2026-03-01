import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Layout,
    Menu,
    Table,
    Button,
    Tag,
    Space,
    Modal,
    Form,
    Input,
    DatePicker,
    message,
    Card,
    Statistic,
    Row,
    Col,
    ConfigProvider,
    theme
} from 'antd';
import {
    Shield,
    Key,
    RefreshCcw,
    Lock,
    Unlock,
    Plus,
    LogOut,
    User,
    LayoutDashboard,
    Database,
    Edit2
} from 'lucide-react';
import dayjs from 'dayjs';

const API_BASE = '/api/v1';
const MASTER_KEY = 'antigravity_license_master_key_2026';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLicense, setEditingLicense] = useState(null);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    const fetchLicenses = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/licenses`, {
                headers: { 'X-API-KEY': MASTER_KEY }
            });
            if (res.data && res.data.success && Array.isArray(res.data.data)) {
                setLicenses(res.data.data);
            } else {
                setLicenses([]);
            }
        } catch (err) {
            console.error('Fetch failed:', err);
            if (isLoggedIn) message.error('Không thể tải dữ liệu!');
            setLicenses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchLicenses();
        }
    }, [isLoggedIn]);

    const handleLogin = (values) => {
        if (values.username === 'admin' && values.password === 'admin') {
            message.success('Đăng nhập thành công!');
            localStorage.setItem('isLoggedIn', 'true');
            setIsLoggedIn(true);
        } else {
            message.error('Sai tài khoản hoặc mật khẩu!');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
        setLicenses([]);
    };

    const handleCreate = async (values) => {
        try {
            setLoading(true);
            const expires_at = values.expiry ? values.expiry.valueOf() : null;
            const days = expires_at ? dayjs(expires_at).diff(dayjs(), 'day') : null;

            const res = await axios.post(`${API_BASE}/admin/licenses`, {
                license_key: values.license_key,
                expires_days: days,
                note: values.note
            }, { headers: { 'X-API-KEY': MASTER_KEY } });

            if (res.data && res.data.success) {
                message.success('Tạo Key thành công!');
                setIsAddModalOpen(false);
                form.resetFields();
                fetchLicenses();
            }
        } catch (err) {
            message.error('Lỗi khi tạo Key!');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (values) => {
        if (!editingLicense) return;

        // V3.3: Log everything to debug mapping issues
        console.log('handleUpdate called for ID:', editingLicense.id);
        console.log('Form values:', values);

        try {
            setLoading(true);
            const expires_at = values.expiry ? values.expiry.valueOf() : null;

            const res = await axios.patch(`${API_BASE}/admin/licenses/${editingLicense.id}`, {
                license_key: values.license_key,
                expires_at: expires_at,
                note: values.note
            }, { headers: { 'X-API-KEY': MASTER_KEY } });

            if (res.data && res.data.success) {
                message.success('Cập nhật thành công!');
                setIsEditModalOpen(false);
                setEditingLicense(null);
                editForm.resetFields();
                fetchLicenses();
            }
        } catch (err) {
            console.error('Update failed:', err);
            message.error('Lỗi khi cập nhật! ' + (err.response?.data?.error || ''));
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (id) => {
        try {
            await axios.post(`${API_BASE}/admin/licenses/reset`, { id }, { headers: { 'X-API-KEY': MASTER_KEY } });
            message.success('Đã reset binding máy!');
            fetchLicenses();
        } catch (err) {
            message.error('Lỗi khi reset!');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.patch(`${API_BASE}/admin/licenses/${id}`, { status }, { headers: { 'X-API-KEY': MASTER_KEY } });
            message.success('Đã cập nhật trạng thái!');
            fetchLicenses();
        } catch (err) {
            message.error('Lỗi khi cập nhật!');
        }
    };

    const generateKey = (targetForm) => {
        targetForm.setFieldsValue({ license_key: 'AG-' + Math.random().toString(36).substr(2, 9).toUpperCase() });
    };

    const openEditModal = (record) => {
        console.log('opening edit modal for:', record);
        setEditingLicense(record);
        // Explicitly set values to the form instance
        editForm.setFieldsValue({
            license_key: record.license_key,
            expiry: record.expires_at ? dayjs(record.expires_at) : null,
            note: record.note
        });
        setIsEditModalOpen(true);
    };

    if (!isLoggedIn) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#001529' }}>
                <Card bordered={false} style={{ width: '100%', maxWidth: 400, borderRadius: 16 }}>
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <Shield size={48} color="#1677ff" style={{ margin: '0 auto' }} />
                        <h2 style={{ marginTop: 16, fontSize: 24, fontWeight: 'bold' }}>Antigravity Admin</h2>
                        <p style={{ color: '#8c8c8c' }}>Vui lòng đăng nhập</p>
                    </div>
                    <Form layout="vertical" onFinish={handleLogin} size="large">
                        <Form.Item name="username" rules={[{ required: true, message: 'Nhập tài khoản!' }]}><Input prefix={<User size={18} />} placeholder="User" /></Form.Item>
                        <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}><Input.Password prefix={<Lock size={18} />} placeholder="Pass" /></Form.Item>
                        <Form.Item><Button type="primary" htmlType="submit" block>Đăng nhập</Button></Form.Item>
                    </Form>
                </Card>
            </div>
        );
    }

    const columns = [
        { title: 'License Key', dataIndex: 'license_key', key: 'license_key', render: (t) => <span style={{ fontFamily: 'monospace', color: '#1677ff', fontWeight: 'bold' }}>{t || 'N/A'}</span> },
        { title: 'Ghi chú', dataIndex: 'note', key: 'note', render: (n) => <span style={{ fontSize: '12px', color: '#555' }}>{n || '-'}</span> },
        { title: 'Machine ID', dataIndex: 'machine_id', key: 'machine_id', render: (m) => m ? <Tag color="blue" style={{ fontSize: '10px' }}>{m}</Tag> : <span style={{ color: '#8c8c8c', fontStyle: 'italic', fontSize: '12px' }}>Chờ kích hoạt</span> },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'active' ? 'success' : 'error'}>{(s || 'active').toUpperCase()}</Tag> },
        { title: 'Hết hạn', dataIndex: 'expires_at', key: 'expires_at', render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : <Tag>Vĩnh viễn</Tag> },
        {
            title: 'Thao tác', key: 'action', render: (_, r) => (
                <Space>
                    <Button icon={<Edit2 size={16} />} onClick={() => openEditModal(r)} title="Sửa" />
                    <Button icon={<RefreshCcw size={16} />} onClick={() => handleReset(r.id)} title="Reset Máy" />
                    {r.status === 'active' ? (
                        <Button danger icon={<Lock size={16} />} onClick={() => updateStatus(r.id, 'suspended')} title="Khóa" />
                    ) : (
                        <Button type="primary" ghost icon={<Unlock size={16} />} onClick={() => updateStatus(r.id, 'active')} title="Mở khóa" />
                    )}
                </Space>
            )
        },
    ];

    const safeLicenses = Array.isArray(licenses) ? licenses : [];

    return (
        <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
            <Layout style={{ minHeight: '100vh' }}>
                <Layout.Sider breakpoint="lg" collapsedWidth="0">
                    <div style={{ padding: 16, textAlign: 'center', color: 'white' }}>
                        <Shield size={32} style={{ margin: '0 auto' }} />
                        <div style={{ marginTop: 8, fontWeight: 'bold' }}>ANTIGRAVITY</div>
                    </div>
                    <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} items={[
                        { key: '1', icon: <LayoutDashboard size={18} />, label: 'Bảng điều khiển' },
                        { key: '2', icon: <Database size={18} />, label: 'Danh sách License' }
                    ]} />
                </Layout.Sider>
                <Layout>
                    <Layout.Header style={{ backgroundColor: 'white', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        <h3 style={{ margin: 0 }}>Quản lý Bản quyền</h3>
                        <Button icon={<LogOut size={18} />} onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Đăng xuất</Button>
                    </Layout.Header>
                    <Layout.Content style={{ margin: 24 }}>
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={8}><Card bordered={false} className="shadow-sm"><Statistic title="Tổng Key" value={safeLicenses.length} prefix={<Key size={18} />} /></Card></Col>
                            <Col span={8}><Card bordered={false} className="shadow-sm"><Statistic title="Đang sử dụng" value={safeLicenses.filter(l => l.machine_id).length} valueStyle={{ color: '#3f8600' }} /></Card></Col>
                            <Col span={8}><Button type="primary" size="large" icon={<Plus size={20} />} onClick={() => setIsAddModalOpen(true)} style={{ width: '100%', height: 60, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Tạo Key Mới</Button></Col>
                        </Row>
                        <Card bordered={false} style={{ borderRadius: 12 }}>
                            <Table columns={columns} dataSource={safeLicenses} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
                        </Card>
                    </Layout.Content>
                </Layout>

                <Modal title="Tạo License Mới" open={isAddModalOpen} onCancel={() => setIsAddModalOpen(false)} footer={null} destroyOnClose>
                    <Form form={form} layout="vertical" onFinish={handleCreate} key="add-form">
                        <Form.Item label="License Key" name="license_key" rules={[{ required: true, message: 'Nhập Key!' }]}>
                            <Input suffix={<Button type="link" onClick={() => generateKey(form)} style={{ padding: 0 }}>Auto</Button>} placeholder="AG-XXXX" />
                        </Form.Item>
                        <Form.Item label="Ngày hết hạn" name="expiry"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                        <Form.Item label="Ghi chú" name="note"><Input.TextArea /></Form.Item>
                        <Form.Item><Button type="primary" htmlType="submit" block size="large" loading={loading}>Xác nhận</Button></Form.Item>
                    </Form>
                </Modal>

                <Modal title="Chỉnh sửa License" open={isEditModalOpen} onCancel={() => setIsEditModalOpen(false)} footer={null} destroyOnClose>
                    <Form
                        form={editForm}
                        layout="vertical"
                        onFinish={handleUpdate}
                        key={`edit-form-${editingLicense?.id || 'none'}`}
                    >
                        <Form.Item label="License Key" name="license_key" rules={[{ required: true, message: 'Nhập Key!' }]}>
                            <Input suffix={<Button type="link" onClick={() => generateKey(editForm)} style={{ padding: 0 }}>Auto</Button>} />
                        </Form.Item>
                        <Form.Item label="Ngày hết hạn" name="expiry"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                        <Form.Item label="Ghi chú" name="note"><Input.TextArea /></Form.Item>
                        <Form.Item><Button type="primary" htmlType="submit" block size="large" loading={loading}>Lưu thay đổi</Button></Form.Item>
                    </Form>
                </Modal>
            </Layout>
        </ConfigProvider>
    );
}

export default App;
