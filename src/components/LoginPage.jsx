import React from 'react';
import { Card, Form, Input, Button } from 'antd';
import { ShieldOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';

const LoginPage = ({ onLogin }) => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#001529' }}>
            <Card bordered={false} style={{ width: '100%', maxWidth: 400, borderRadius: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <ShieldOutlined style={{ fontSize: 48, color: '#1677ff' }} />
                    <h2 style={{ marginTop: 16 }}>Antigravity Admin</h2>
                    <p style={{ color: '#8c8c8c' }}>Vui lòng đăng nhập</p>
                </div>
                <Form layout="vertical" onFinish={onLogin} size="large">
                    <Form.Item name="username" rules={[{ required: true }]}><Input prefix={<UserOutlined />} placeholder="User" /></Form.Item>
                    <Form.Item name="password" rules={[{ required: true }]}><Input.Password prefix={<LockOutlined />} placeholder="Pass" /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" block>Đăng nhập</Button></Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
