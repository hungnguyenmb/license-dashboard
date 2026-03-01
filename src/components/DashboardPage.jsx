import React, { useState, useEffect } from 'react';
import { Layout, Menu, Table, Button, Tag, Space, Modal, Form, Input, DatePicker, Card, Statistic, Row, Col } from 'antd';
import {
    ShieldOutlined, KeyOutlined, ReloadOutlined, LockOutlined, UnlockOutlined,
    PlusOutlined, LogoutOutlined, DashboardOutlined, DatabaseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const DashboardPage = ({ onLogout, API_BASE, MASTER_KEY, axios, message }) => {
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchLicenses = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/licenses`, {
                headers: { 'X-API-KEY': MASTER_KEY }
            });
            if (res.data.success) setLicenses(res.data.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchLicenses(); }, []);

    const handleCreate = async (values) => {
        try {
            const expires_at = values.expiry ? values.expiry.valueOf() : null;
            const days = expires_at ? dayjs(expires_at).diff(dayjs(), 'day') : null;
            await axios.post(`${API_BASE}/admin/licenses`, {
                license_key: values.license_key,
                expires_days: days,
                note: values.note
            }, { headers: { 'X-API-KEY': MASTER_KEY } });
            setIsModalOpen(false);
            form.resetFields();
            fetchLicenses();
        } catch (err) { console.error(err); }
    };

    const columns = [
        { title: 'Key', dataIndex: 'license_key', render: (t) => <code style={{ color: '#1677ff' }}>{t}</code> },
        { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'active' ? 'success' : 'error'}>{s}</Tag> },
        { title: 'Hết hạn', dataIndex: 'expires_at', render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : 'Vĩnh viễn' },
        { title: 'Action', render: (_, r) => <Button icon={<ReloadOutlined />} onClick={() => { }} /> },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout.Sider breakpoint="lg" collapsedWidth="0">
                <div style={{ padding: 16, textAlign: 'center', color: 'white' }}>
                    <ShieldOutlined style={{ fontSize: 32 }} />
                    <div style={{ marginTop: 8, fontWeight: 'bold' }}>ANTIGRAVITY</div>
                </div>
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} items={[
                    { key: '1', icon: <DashboardOutlined />, label: 'Dashboard' },
                    { key: '2', icon: <DatabaseOutlined />, label: 'Licenses' }
                ]} />
            </Layout.Sider>
            <Layout>
                <Layout.Header style={{ background: 'white', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>License Manager</h3>
                    <Button icon={<LogoutOutlined />} onClick={onLogout}>Thoát</Button>
                </Layout.Header>
                <Layout.Content style={{ padding: 24 }}>
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={8}><Card><Statistic title="Total" value={licenses.length} /></Card></Col>
                        <Col span={8}><Card><Statistic title="Active" value={licenses.filter(l => l.machine_id).length} /></Card></Col>
                        <Col span={8}><Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} style={{ width: '100%', height: 60 }}>New Key</Button></Col>
                    </Row>
                    <Table columns={columns} dataSource={licenses} rowKey="id" loading={loading} />
                </Layout.Content>
            </Layout>
            <Modal title="New Key" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item label="Key" name="license_key" rules={[{ required: true }]}><Input placeholder="Key..." /></Form.Item>
                    <Form.Item label="Expires" name="expiry"><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" block>Create</Button></Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default DashboardPage;
