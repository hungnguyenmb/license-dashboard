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
    InputNumber,
    DatePicker,
    Switch,
    Popconfirm,
    Select,
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
    Edit2,
    Puzzle,
    Trash2
} from 'lucide-react';
import dayjs from 'dayjs';

const API_BASE = '/api/v1';
const MASTER_KEY = 'antigravity_license_master_key_2026';
const PLATFORM_KEYS = ['darwin', 'win32', 'linux'];
const CODEX_PLATFORM_OPTIONS = [
    { value: 'darwin', label: 'darwin (macOS)' },
    { value: 'win32', label: 'win32 (Windows)' },
    { value: 'linux', label: 'linux' },
];
const CODEX_ARCH_OPTIONS = [
    { value: 'arm64', label: 'arm64' },
    { value: 'x64', label: 'x64' },
    { value: 'x86', label: 'x86' },
];
const CODEX_METHOD_OPTIONS = [
    { value: 'zip_extract', label: 'zip_extract' },
    { value: 'tar_extract', label: 'tar_extract' },
];
const CAPABILITY_OPTIONS = [
    { value: 'screen_capture', label: 'screen_capture' },
    { value: 'camera_access', label: 'camera_access' },
    { value: 'ui_automation', label: 'ui_automation' },
    { value: 'system_restart', label: 'system_restart' },
];
const CATEGORY_OPTIONS = [
    { value: 'general', label: 'general' },
    { value: 'office', label: 'office' },
    { value: 'productivity', label: 'productivity' },
    { value: 'communication', label: 'communication' },
    { value: 'automation', label: 'automation' },
];

const toCsvList = (raw) => {
    if (Array.isArray(raw)) {
        return [...new Set(raw.map((item) => String(item || '').trim()).filter(Boolean))];
    }
    return [...new Set(String(raw || '').split(',').map((item) => item.trim()).filter(Boolean))];
};

const normalizeColor = (raw, fallback = '#3B82F6') => {
    const value = String(raw || '').trim();
    if (!value) return fallback;
    const matched = value.match(/^#?([0-9a-fA-F]{6})$/);
    if (!matched) return fallback;
    return `#${matched[1].toUpperCase()}`;
};

const resolveDownloadInfo = (manifest, platform) => {
    const sources = [
        manifest?.downloads?.[platform],
        manifest?.platforms?.[platform],
        manifest?.download?.[platform],
        manifest?.download,
        manifest?.artifact,
    ].filter(Boolean);

    for (const source of sources) {
        if (typeof source === 'string' && source.trim()) {
            return { url: source.trim(), checksum: '', file_name: '', size: null };
        }
        if (source?.url) {
            const size = Number(source.size);
            return {
                url: String(source.url).trim(),
                checksum: String(source.checksum || source.sha256 || '').trim(),
                file_name: String(source.file_name || source.filename || '').trim(),
                size: Number.isFinite(size) ? size : null,
            };
        }
    }

    if (manifest?.download_url) {
        return {
            url: String(manifest.download_url).trim(),
            checksum: '',
            file_name: '',
            size: null,
        };
    }

    return { url: '', checksum: '', file_name: '', size: null };
};

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
    const [activeMenu, setActiveMenu] = useState('dashboard');

    const [loading, setLoading] = useState(false);
    const [licenses, setLicenses] = useState([]);
    const [skills, setSkills] = useState([]);
    const [versions, setVersions] = useState([]);
    const [codexReleases, setCodexReleases] = useState([]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLicense, setEditingLicense] = useState(null);

    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
    const [editingVersion, setEditingVersion] = useState(null);
    const [isCodexModalOpen, setIsCodexModalOpen] = useState(false);
    const [editingCodexRelease, setEditingCodexRelease] = useState(null);

    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const [skillForm] = Form.useForm();
    const [versionForm] = Form.useForm();
    const [codexForm] = Form.useForm();

    const authHeaders = { headers: { 'X-API-KEY': MASTER_KEY } };

    const fetchLicenses = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/licenses`, authHeaders);
            if (res.data && res.data.success && Array.isArray(res.data.data)) {
                setLicenses(res.data.data);
            } else {
                setLicenses([]);
            }
        } catch (err) {
            console.error('fetch licenses failed:', err);
            if (isLoggedIn) message.error('Không thể tải danh sách license');
            setLicenses([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSkills = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/skills`, authHeaders);
            if (res.data && res.data.success && Array.isArray(res.data.data)) {
                setSkills(res.data.data);
            } else {
                setSkills([]);
            }
        } catch (err) {
            console.error('fetch skills failed:', err);
            if (isLoggedIn) message.error('Không thể tải danh sách skills');
            setSkills([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchVersions = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/versions`, authHeaders);
            if (res.data && res.data.success && Array.isArray(res.data.data)) {
                setVersions(res.data.data);
            } else {
                setVersions([]);
            }
        } catch (err) {
            console.error('fetch versions failed:', err);
            if (isLoggedIn) message.error('Không thể tải danh sách phiên bản');
            setVersions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCodexReleases = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/codex/releases`, authHeaders);
            if (res.data && res.data.success && Array.isArray(res.data.data)) {
                setCodexReleases(res.data.data);
            } else {
                setCodexReleases([]);
            }
        } catch (err) {
            console.error('fetch codex releases failed:', err);
            if (isLoggedIn) message.error('Không thể tải danh sách Codex release');
            setCodexReleases([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoggedIn) return;
        fetchLicenses();
        fetchSkills();
        fetchVersions();
        fetchCodexReleases();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);

    const handleLogin = (values) => {
        if (values.username === 'admin' && values.password === 'admin') {
            message.success('Đăng nhập thành công');
            localStorage.setItem('isLoggedIn', 'true');
            setIsLoggedIn(true);
        } else {
            message.error('Sai tài khoản hoặc mật khẩu');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
        setLicenses([]);
        setSkills([]);
        setVersions([]);
        setCodexReleases([]);
    };

    const generateKey = (targetForm) => {
        targetForm.setFieldsValue({
            license_key: 'AG-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        });
    };

    const handleCreateLicense = async (values) => {
        try {
            setLoading(true);
            const expires_at = values.expiry ? values.expiry.valueOf() : null;
            const days = expires_at ? dayjs(expires_at).diff(dayjs(), 'day') : null;
            const res = await axios.post(`${API_BASE}/admin/licenses`, {
                license_key: values.license_key,
                expires_days: days,
                note: values.note
            }, authHeaders);

            if (res.data && res.data.success) {
                message.success('Tạo key thành công');
                setIsAddModalOpen(false);
                form.resetFields();
                fetchLicenses();
            }
        } catch (err) {
            message.error('Lỗi khi tạo key');
        } finally {
            setLoading(false);
        }
    };

    const openEditLicenseModal = (record) => {
        setEditingLicense(record);
        editForm.setFieldsValue({
            license_key: record.license_key,
            expiry: record.expires_at ? dayjs(record.expires_at) : null,
            note: record.note
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateLicense = async (values) => {
        if (!editingLicense) return;
        try {
            setLoading(true);
            const expires_at = values.expiry ? values.expiry.valueOf() : null;
            const res = await axios.patch(`${API_BASE}/admin/licenses/${editingLicense.id}`, {
                license_key: values.license_key,
                expires_at,
                note: values.note
            }, authHeaders);

            if (res.data && res.data.success) {
                message.success('Cập nhật license thành công');
                setIsEditModalOpen(false);
                setEditingLicense(null);
                editForm.resetFields();
                fetchLicenses();
            }
        } catch (err) {
            message.error('Lỗi khi cập nhật license');
        } finally {
            setLoading(false);
        }
    };

    const handleResetBinding = async (id) => {
        try {
            await axios.post(`${API_BASE}/admin/licenses/reset`, { id }, authHeaders);
            message.success('Đã reset binding máy');
            fetchLicenses();
        } catch (err) {
            message.error('Lỗi khi reset');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.patch(`${API_BASE}/admin/licenses/${id}`, { status }, authHeaders);
            message.success('Đã cập nhật trạng thái');
            fetchLicenses();
        } catch (err) {
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const openSkillModal = (record = null) => {
        setEditingSkill(record);
        const manifestObj = record?.manifest_json && typeof record.manifest_json === 'object'
            ? record.manifest_json
            : {};
        const darwin = resolveDownloadInfo(manifestObj, 'darwin');
        const win32 = resolveDownloadInfo(manifestObj, 'win32');
        const linux = resolveDownloadInfo(manifestObj, 'linux');
        const defaultBadge = record?.is_vip ? 'VIP' : (Number(record?.price || 0) <= 0 ? 'FREE' : 'PAID');
        skillForm.setFieldsValue({
            id: record?.id || '',
            name: record?.name || '',
            description: record?.description || '',
            skill_type: record?.skill_type || 'KNOWLEDGE',
            price: Number(record?.price || 0),
            author: record?.author || '',
            version: record?.version || '',
            is_vip: Boolean(record?.is_vip),
            icon: manifestObj.icon || '🧩',
            badge: manifestObj.badge || defaultBadge,
            color: manifestObj.color || '#3B82F6',
            category: manifestObj.category || 'general',
            tags_text: Array.isArray(manifestObj.tags) ? manifestObj.tags.join(', ') : '',
            short_description: manifestObj.short_description || record?.description || '',
            detail_description: manifestObj.detail_description || manifestObj.description || '',
            required_capabilities: Array.isArray(manifestObj.required_capabilities) ? manifestObj.required_capabilities : [],
            min_app_version: manifestObj.min_app_version || '',
            dependencies_text: Array.isArray(manifestObj.dependencies) ? manifestObj.dependencies.join(', ') : '',
            download_darwin_url: darwin.url || '',
            download_darwin_checksum: darwin.checksum || '',
            download_darwin_file_name: darwin.file_name || '',
            download_darwin_size: darwin.size || null,
            download_win32_url: win32.url || '',
            download_win32_checksum: win32.checksum || '',
            download_win32_file_name: win32.file_name || '',
            download_win32_size: win32.size || null,
            download_linux_url: linux.url || '',
            download_linux_checksum: linux.checksum || '',
            download_linux_file_name: linux.file_name || '',
            download_linux_size: linux.size || null,
        });
        setIsSkillModalOpen(true);
    };

    const handleSaveSkill = async (values) => {
        const downloads = {};
        for (const platform of PLATFORM_KEYS) {
            const url = String(values[`download_${platform}_url`] || '').trim();
            if (!url) continue;
            const sizeVal = Number(values[`download_${platform}_size`]);
            downloads[platform] = {
                url,
                checksum: String(values[`download_${platform}_checksum`] || '').trim(),
                file_name: String(values[`download_${platform}_file_name`] || '').trim(),
                size: Number.isFinite(sizeVal) ? sizeVal : null,
            };
        }
        if (Object.keys(downloads).length === 0) {
            message.error('Cần ít nhất 1 link tải cho darwin/win32/linux');
            return;
        }

        const manifest_json = {
            metadata_version: '1.0',
            icon: String(values.icon || '').trim() || '🧩',
            badge: String(values.badge || '').trim() || (Boolean(values.is_vip) ? 'VIP' : 'SKILL'),
            color: normalizeColor(values.color),
            category: String(values.category || '').trim() || 'general',
            tags: toCsvList(values.tags_text),
            short_description: String(values.short_description || '').trim() || String(values.description || '').trim(),
            detail_description: String(values.detail_description || '').trim(),
            required_capabilities: Array.isArray(values.required_capabilities)
                ? values.required_capabilities.filter(Boolean)
                : [],
            min_app_version: String(values.min_app_version || '').trim(),
            dependencies: toCsvList(values.dependencies_text),
            downloads,
        };

        const payload = {
            id: values.id,
            name: values.name,
            description: values.description,
            skill_type: values.skill_type,
            price: Number(values.price || 0),
            author: values.author,
            version: values.version,
            is_vip: Boolean(values.is_vip),
            manifest_json,
        };

        try {
            setLoading(true);
            if (editingSkill) {
                await axios.patch(`${API_BASE}/admin/omnimind/skills/${editingSkill.id}`, payload, authHeaders);
            } else {
                await axios.post(`${API_BASE}/admin/omnimind/skills`, payload, authHeaders);
            }
            message.success(editingSkill ? 'Cập nhật skill thành công' : 'Tạo skill thành công');
            setIsSkillModalOpen(false);
            setEditingSkill(null);
            skillForm.resetFields();
            fetchSkills();
        } catch (err) {
            const serverError = err?.response?.data?.error || err?.response?.data?.message;
            message.error(serverError || 'Lỗi khi lưu skill');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSkill = async (skillId) => {
        try {
            setLoading(true);
            await axios.delete(`${API_BASE}/admin/omnimind/skills/${skillId}`, authHeaders);
            message.success('Đã xóa skill');
            fetchSkills();
        } catch (err) {
            message.error('Không thể xóa skill');
        } finally {
            setLoading(false);
        }
    };

    const parseChangelogText = (text) => {
        const lines = String(text || '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
        return lines.map((line) => {
            const normalized = line.replace(/^[-*]\s*/, '');
            const match = normalized.match(/^\[?([a-zA-Z]+)\]?\s*[:\-]\s*(.+)$/);
            if (match) {
                return { type: match[1].toLowerCase(), content: match[2].trim() };
            }
            return { type: 'feat', content: normalized };
        });
    };

    const changelogToText = (logs) => {
        if (!Array.isArray(logs)) return '';
        return logs.map((item) => `${item.change_type || item.type || 'feat'}: ${item.content || ''}`).join('\n');
    };

    const openVersionModal = async (record = null) => {
        setEditingVersion(record);
        if (!record) {
            versionForm.setFieldsValue({
                version_id: '',
                version_name: '',
                download_url: '',
                is_critical: false,
                changelog_text: '',
            });
            setIsVersionModalOpen(true);
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/versions/${record.version_id}`, authHeaders);
            const detail = res?.data?.data || {};
            versionForm.setFieldsValue({
                version_id: detail.version_id || record.version_id,
                version_name: detail.version_name || '',
                download_url: detail.download_url || '',
                is_critical: Boolean(detail.is_critical),
                changelog_text: changelogToText(detail.changelogs),
            });
            setIsVersionModalOpen(true);
        } catch (err) {
            message.error('Không thể tải chi tiết phiên bản');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVersion = async (values) => {
        const changelogs = parseChangelogText(values.changelog_text);
        try {
            setLoading(true);
            await axios.post(`${API_BASE}/admin/omnimind/versions`, {
                version_id: values.version_id,
                version_name: values.version_name,
                is_critical: Boolean(values.is_critical),
                download_url: values.download_url,
                changelogs,
            }, authHeaders);
            message.success(editingVersion ? 'Cập nhật phiên bản thành công' : 'Tạo phiên bản thành công');
            setIsVersionModalOpen(false);
            setEditingVersion(null);
            versionForm.resetFields();
            fetchVersions();
        } catch (err) {
            message.error('Lỗi khi lưu phiên bản');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVersion = async (versionId) => {
        try {
            setLoading(true);
            await axios.delete(`${API_BASE}/admin/omnimind/versions/${versionId}`, authHeaders);
            message.success('Đã xoá phiên bản');
            fetchVersions();
        } catch (err) {
            message.error('Không thể xoá phiên bản');
        } finally {
            setLoading(false);
        }
    };

    const openCodexModal = (record = null) => {
        setEditingCodexRelease(record);
        codexForm.setFieldsValue({
            platform: record?.platform || 'darwin',
            arch: record?.arch || 'arm64',
            version: record?.version || '',
            url: record?.url || '',
            checksum: record?.checksum || '',
            file_name: record?.file_name || '',
            size_bytes: record?.size_bytes || null,
            method: record?.method || 'zip_extract',
            channel: record?.channel || 'stable',
            is_active: record?.is_active ?? true,
            notes: record?.notes || '',
        });
        setIsCodexModalOpen(true);
    };

    const handleSaveCodexRelease = async (values) => {
        const payload = {
            platform: values.platform,
            arch: values.arch,
            version: values.version,
            url: values.url,
            checksum: String(values.checksum || '').trim(),
            file_name: String(values.file_name || '').trim(),
            size_bytes: values.size_bytes ?? null,
            method: values.method || 'zip_extract',
            channel: values.channel || 'stable',
            is_active: Boolean(values.is_active),
            notes: String(values.notes || '').trim(),
        };
        try {
            setLoading(true);
            await axios.post(`${API_BASE}/admin/omnimind/codex/releases`, payload, authHeaders);
            message.success(editingCodexRelease ? 'Cập nhật Codex release thành công' : 'Tạo Codex release thành công');
            setIsCodexModalOpen(false);
            setEditingCodexRelease(null);
            codexForm.resetFields();
            fetchCodexReleases();
        } catch (err) {
            const serverError = err?.response?.data?.error || err?.response?.data?.message;
            message.error(serverError || 'Lỗi khi lưu Codex release');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCodexRelease = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`${API_BASE}/admin/omnimind/codex/releases/${id}`, authHeaders);
            message.success('Đã xoá Codex release');
            fetchCodexReleases();
        } catch (err) {
            message.error('Không thể xoá Codex release');
        } finally {
            setLoading(false);
        }
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
                        <Form.Item name="username" rules={[{ required: true, message: 'Nhập tài khoản' }]}>
                            <Input prefix={<User size={18} />} placeholder="User" />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
                            <Input.Password prefix={<Lock size={18} />} placeholder="Pass" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>Đăng nhập</Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        );
    }

    const safeLicenses = Array.isArray(licenses) ? licenses : [];
    const safeSkills = Array.isArray(skills) ? skills : [];
    const safeVersions = Array.isArray(versions) ? versions : [];
    const safeCodexReleases = Array.isArray(codexReleases) ? codexReleases : [];

    const licenseColumns = [
        {
            title: 'License Key',
            dataIndex: 'license_key',
            key: 'license_key',
            render: (t) => <span style={{ fontFamily: 'monospace', color: '#1677ff', fontWeight: 'bold' }}>{t || 'N/A'}</span>
        },
        { title: 'Ghi chú', dataIndex: 'note', key: 'note', render: (n) => <span style={{ fontSize: '12px', color: '#555' }}>{n || '-'}</span> },
        {
            title: 'Machine ID',
            dataIndex: 'machine_id',
            key: 'machine_id',
            render: (m) => m
                ? <Tag color="blue" style={{ fontSize: '10px' }}>{m}</Tag>
                : <span style={{ color: '#8c8c8c', fontStyle: 'italic', fontSize: '12px' }}>Chờ kích hoạt</span>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (s) => <Tag color={s === 'active' ? 'success' : 'error'}>{(s || 'active').toUpperCase()}</Tag>
        },
        {
            title: 'Hết hạn',
            dataIndex: 'expires_at',
            key: 'expires_at',
            render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : <Tag>Vĩnh viễn</Tag>
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, r) => (
                <Space>
                    <Button icon={<Edit2 size={16} />} onClick={() => openEditLicenseModal(r)} />
                    <Button icon={<RefreshCcw size={16} />} onClick={() => handleResetBinding(r.id)} />
                    {r.status === 'active' ? (
                        <Button danger icon={<Lock size={16} />} onClick={() => updateStatus(r.id, 'suspended')} />
                    ) : (
                        <Button type="primary" ghost icon={<Unlock size={16} />} onClick={() => updateStatus(r.id, 'active')} />
                    )}
                </Space>
            )
        },
    ];

    const skillColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 180, render: (v) => <code>{v}</code> },
        { title: 'Tên', dataIndex: 'name', key: 'name' },
        { title: 'Loại', dataIndex: 'skill_type', key: 'skill_type', width: 120 },
        { title: 'Version', dataIndex: 'version', key: 'version', width: 100 },
        { title: 'Giá', dataIndex: 'price', key: 'price', width: 100, render: (v) => Number(v || 0).toFixed(2) },
        { title: 'VIP', dataIndex: 'is_vip', key: 'is_vip', width: 90, render: (v) => v ? <Tag color="gold">VIP</Tag> : <Tag>NO</Tag> },
        { title: 'Tác giả', dataIndex: 'author', key: 'author', width: 140 },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 160,
            render: (_, r) => (
                <Space>
                    <Button icon={<Edit2 size={16} />} onClick={() => openSkillModal(r)} />
                    <Popconfirm title="Xóa skill này?" onConfirm={() => handleDeleteSkill(r.id)}>
                        <Button danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const versionColumns = [
        { title: 'Version', dataIndex: 'version_id', key: 'version_id', width: 120, render: (v) => <code>{v}</code> },
        { title: 'Tên bản phát hành', dataIndex: 'version_name', key: 'version_name' },
        {
            title: 'Mức độ',
            dataIndex: 'is_critical',
            key: 'is_critical',
            width: 120,
            render: (v) => v ? <Tag color="red">CRITICAL</Tag> : <Tag color="blue">NORMAL</Tag>,
        },
        {
            title: 'Ngày phát hành',
            dataIndex: 'release_date',
            key: 'release_date',
            width: 150,
            render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Download URL',
            dataIndex: 'download_url',
            key: 'download_url',
            render: (v) => v ? <a href={v} target="_blank" rel="noreferrer">Link tải</a> : <Tag>Chưa có</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 160,
            render: (_, r) => (
                <Space>
                    <Button icon={<Edit2 size={16} />} onClick={() => openVersionModal(r)} />
                    <Popconfirm title="Xoá phiên bản này?" onConfirm={() => handleDeleteVersion(r.version_id)}>
                        <Button danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const codexColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
        { title: 'Platform', dataIndex: 'platform', key: 'platform', width: 120, render: (v) => <Tag color="blue">{v}</Tag> },
        { title: 'Arch', dataIndex: 'arch', key: 'arch', width: 100, render: (v) => <Tag>{v}</Tag> },
        { title: 'Version', dataIndex: 'version', key: 'version', width: 110, render: (v) => <code>{v}</code> },
        { title: 'Channel', dataIndex: 'channel', key: 'channel', width: 100 },
        { title: 'Method', dataIndex: 'method', key: 'method', width: 120 },
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 90,
            render: (v) => v ? <Tag color="green">ACTIVE</Tag> : <Tag color="default">OFF</Tag>,
        },
        {
            title: 'URL',
            dataIndex: 'url',
            key: 'url',
            render: (v) => v ? <a href={v} target="_blank" rel="noreferrer">Link tải</a> : <Tag>Chưa có</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 160,
            render: (_, r) => (
                <Space>
                    <Button icon={<Edit2 size={16} />} onClick={() => openCodexModal(r)} />
                    <Popconfirm title="Xoá release này?" onConfirm={() => handleDeleteCodexRelease(r.id)}>
                        <Button danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const dashboardContent = (
        <Row gutter={16}>
            <Col span={6}>
                <Card bordered={false}>
                    <Statistic title="Tổng License" value={safeLicenses.length} prefix={<Key size={18} />} />
                </Card>
            </Col>
            <Col span={6}>
                <Card bordered={false}>
                    <Statistic title="License đã kích hoạt máy" value={safeLicenses.filter((l) => l.machine_id).length} valueStyle={{ color: '#3f8600' }} />
                </Card>
            </Col>
            <Col span={6}>
                <Card bordered={false}>
                    <Statistic title="Tổng Skills Marketplace" value={safeSkills.length} prefix={<Puzzle size={18} />} />
                </Card>
            </Col>
            <Col span={6}>
                <Card bordered={false}>
                    <Statistic title="Tổng App Versions" value={safeVersions.length} prefix={<Database size={18} />} />
                </Card>
            </Col>
        </Row>
    );

    const licensesContent = (
        <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}><Card bordered={false}><Statistic title="Tổng Key" value={safeLicenses.length} prefix={<Key size={18} />} /></Card></Col>
                <Col span={8}><Card bordered={false}><Statistic title="Đang sử dụng" value={safeLicenses.filter((l) => l.machine_id).length} valueStyle={{ color: '#3f8600' }} /></Card></Col>
                <Col span={8}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<Plus size={20} />}
                        onClick={() => setIsAddModalOpen(true)}
                        style={{ width: '100%', height: 60, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        Tạo Key Mới
                    </Button>
                </Col>
            </Row>
            <Card bordered={false} style={{ borderRadius: 12 }}>
                <Table columns={licenseColumns} dataSource={safeLicenses} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
            </Card>
        </>
    );

    const skillsContent = (
        <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}><Card bordered={false}><Statistic title="Tổng Skills" value={safeSkills.length} prefix={<Puzzle size={18} />} /></Card></Col>
                <Col span={8}><Card bordered={false}><Statistic title="Skills VIP" value={safeSkills.filter((s) => s.is_vip).length} /></Card></Col>
                <Col span={8}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<Plus size={20} />}
                        onClick={() => openSkillModal(null)}
                        style={{ width: '100%', height: 60, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        Tạo Skill
                    </Button>
                </Col>
            </Row>
            <Card bordered={false} style={{ borderRadius: 12 }}>
                <Table columns={skillColumns} dataSource={safeSkills} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
            </Card>
        </>
    );

    const versionsContent = (
        <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}><Card bordered={false}><Statistic title="Tổng phiên bản" value={safeVersions.length} prefix={<Database size={18} />} /></Card></Col>
                <Col span={8}><Card bordered={false}><Statistic title="Critical update" value={safeVersions.filter((v) => v.is_critical).length} /></Card></Col>
                <Col span={8}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<Plus size={20} />}
                        onClick={() => openVersionModal(null)}
                        style={{ width: '100%', height: 60, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        Tạo Version
                    </Button>
                </Col>
            </Row>
            <Card bordered={false} style={{ borderRadius: 12 }}>
                <Table columns={versionColumns} dataSource={safeVersions} rowKey="version_id" loading={loading} pagination={{ pageSize: 8 }} />
            </Card>
        </>
    );

    const codexContent = (
        <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}><Card bordered={false}><Statistic title="Tổng Codex Release" value={safeCodexReleases.length} prefix={<Database size={18} />} /></Card></Col>
                <Col span={8}><Card bordered={false}><Statistic title="Đang Active" value={safeCodexReleases.filter((r) => r.is_active).length} /></Card></Col>
                <Col span={8}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<Plus size={20} />}
                        onClick={() => openCodexModal(null)}
                        style={{ width: '100%', height: 60, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        Tạo Codex Release
                    </Button>
                </Col>
            </Row>
            <Card bordered={false} style={{ borderRadius: 12 }}>
                <Table columns={codexColumns} dataSource={safeCodexReleases} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
            </Card>
        </>
    );

    let content = dashboardContent;
    if (activeMenu === 'licenses') content = licensesContent;
    if (activeMenu === 'skills') content = skillsContent;
    if (activeMenu === 'versions') content = versionsContent;
    if (activeMenu === 'codex') content = codexContent;

    return (
        <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
            <Layout style={{ minHeight: '100vh' }}>
                <Layout.Sider breakpoint="lg" collapsedWidth="0">
                    <div style={{ padding: 16, textAlign: 'center', color: 'white' }}>
                        <Shield size={32} style={{ margin: '0 auto' }} />
                        <div style={{ marginTop: 8, fontWeight: 'bold' }}>ANTIGRAVITY</div>
                    </div>
                    <Menu
                        theme="dark"
                        mode="inline"
                        selectedKeys={[activeMenu]}
                        onClick={({ key }) => setActiveMenu(key)}
                        items={[
                            { key: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Bảng điều khiển' },
                            { key: 'licenses', icon: <Database size={18} />, label: 'Danh sách License' },
                            { key: 'skills', icon: <Puzzle size={18} />, label: 'Marketplace Skills' },
                            { key: 'versions', icon: <RefreshCcw size={18} />, label: 'App Versions' },
                            { key: 'codex', icon: <Key size={18} />, label: 'Codex Releases' },
                        ]}
                    />
                </Layout.Sider>

                <Layout>
                    <Layout.Header style={{ backgroundColor: 'white', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        <h3 style={{ margin: 0 }}>License & Marketplace Manager</h3>
                        <Space>
                            <Button icon={<RefreshCcw size={16} />} onClick={() => { fetchLicenses(); fetchSkills(); fetchVersions(); fetchCodexReleases(); }}>
                                Refresh
                            </Button>
                            <Button icon={<LogOut size={18} />} onClick={handleLogout}>Đăng xuất</Button>
                        </Space>
                    </Layout.Header>

                    <Layout.Content style={{ margin: 24 }}>
                        {content}
                    </Layout.Content>
                </Layout>

                <Modal title="Tạo License Mới" open={isAddModalOpen} onCancel={() => setIsAddModalOpen(false)} footer={null} destroyOnClose>
                    <Form form={form} layout="vertical" onFinish={handleCreateLicense}>
                        <Form.Item label="License Key" name="license_key" rules={[{ required: true, message: 'Nhập key' }]}>
                            <Input suffix={<Button type="link" onClick={() => generateKey(form)} style={{ padding: 0 }}>Auto</Button>} placeholder="AG-XXXX" />
                        </Form.Item>
                        <Form.Item label="Ngày hết hạn" name="expiry">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                        <Form.Item label="Ghi chú" name="note">
                            <Input.TextArea />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large" loading={loading}>Xác nhận</Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal title="Chỉnh sửa License" open={isEditModalOpen} onCancel={() => setIsEditModalOpen(false)} footer={null} destroyOnClose>
                    <Form form={editForm} layout="vertical" onFinish={handleUpdateLicense}>
                        <Form.Item label="License Key" name="license_key" rules={[{ required: true, message: 'Nhập key' }]}>
                            <Input suffix={<Button type="link" onClick={() => generateKey(editForm)} style={{ padding: 0 }}>Auto</Button>} />
                        </Form.Item>
                        <Form.Item label="Ngày hết hạn" name="expiry">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                        <Form.Item label="Ghi chú" name="note">
                            <Input.TextArea />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large" loading={loading}>Lưu thay đổi</Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={editingSkill ? "Chỉnh sửa Skill" : "Tạo Skill mới"}
                    open={isSkillModalOpen}
                    onCancel={() => { setIsSkillModalOpen(false); setEditingSkill(null); }}
                    footer={null}
                    width={760}
                    destroyOnClose
                >
                    <Form form={skillForm} layout="vertical" onFinish={handleSaveSkill}>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Skill ID" name="id" rules={[{ required: true, message: 'Nhập skill id' }]}>
                                    <Input placeholder="vd: web_crawler" disabled={Boolean(editingSkill)} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Tên Skill" name="name" rules={[{ required: true, message: 'Nhập tên skill' }]}>
                                    <Input placeholder="Web Crawler Pro" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="Loại" name="skill_type" initialValue="KNOWLEDGE">
                                    <Select options={[
                                        { value: 'KNOWLEDGE', label: 'KNOWLEDGE' },
                                        { value: 'TOOL', label: 'TOOL' },
                                    ]} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Version" name="version">
                                    <Input placeholder="1.0.0" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Tác giả" name="author">
                                    <Input placeholder="OmniMind Team" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="Giá" name="price" initialValue={0}>
                                    <InputNumber style={{ width: '100%' }} min={0} step={1} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="VIP" name="is_vip" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Mô tả ngắn" name="description">
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={6}>
                                <Form.Item label="Icon" name="icon">
                                    <Input placeholder="🧩" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="Badge" name="badge">
                                    <Input placeholder="FREE / VIP / PAID" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="Màu badge" name="color">
                                    <Input placeholder="#3B82F6" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="Category" name="category">
                                    <Select options={CATEGORY_OPTIONS} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Tags (phân tách bằng dấu phẩy)" name="tags_text">
                            <Input placeholder="office, productivity, meeting" />
                        </Form.Item>

                        <Form.Item label="Short Description (manifest)" name="short_description">
                            <Input.TextArea rows={2} />
                        </Form.Item>

                        <Form.Item label="Detail Description (manifest)" name="detail_description">
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Required Capabilities" name="required_capabilities">
                                    <Select
                                        mode="multiple"
                                        allowClear
                                        options={CAPABILITY_OPTIONS}
                                        placeholder="Chọn capability cần cho skill"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Min App Version" name="min_app_version">
                                    <Input placeholder="vd: 1.6.0" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Dependencies (phân tách bằng dấu phẩy)" name="dependencies_text">
                            <Input placeholder="requests, pandas" />
                        </Form.Item>

                        <h4 style={{ marginTop: 8 }}>Downloads Theo Hệ Điều Hành</h4>
                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item
                                    label="darwin URL"
                                    name="download_darwin_url"
                                    rules={[{ type: 'url', warningOnly: true, message: 'Link URL không hợp lệ' }]}
                                >
                                    <Input placeholder="https://.../skill-macos.zip" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="darwin checksum" name="download_darwin_checksum">
                                    <Input placeholder="sha256..." />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item label="darwin file name" name="download_darwin_file_name">
                                    <Input placeholder="skill.zip" />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item label="darwin size (bytes)" name="download_darwin_size">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item
                                    label="win32 URL"
                                    name="download_win32_url"
                                    rules={[{ type: 'url', warningOnly: true, message: 'Link URL không hợp lệ' }]}
                                >
                                    <Input placeholder="https://.../skill-win.zip" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="win32 checksum" name="download_win32_checksum">
                                    <Input placeholder="sha256..." />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item label="win32 file name" name="download_win32_file_name">
                                    <Input placeholder="skill.zip" />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item label="win32 size (bytes)" name="download_win32_size">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item
                                    label="linux URL"
                                    name="download_linux_url"
                                    rules={[{ type: 'url', warningOnly: true, message: 'Link URL không hợp lệ' }]}
                                >
                                    <Input placeholder="https://.../skill-linux.zip" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="linux checksum" name="download_linux_checksum">
                                    <Input placeholder="sha256..." />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item label="linux file name" name="download_linux_file_name">
                                    <Input placeholder="skill.zip" />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item label="linux size (bytes)" name="download_linux_size">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                                {editingSkill ? 'Lưu cập nhật' : 'Tạo Skill'}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={editingVersion ? "Chỉnh sửa Version" : "Tạo Version mới"}
                    open={isVersionModalOpen}
                    onCancel={() => { setIsVersionModalOpen(false); setEditingVersion(null); }}
                    footer={null}
                    width={760}
                    destroyOnClose
                >
                    <Form form={versionForm} layout="vertical" onFinish={handleSaveVersion}>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Version ID" name="version_id" rules={[{ required: true, message: 'Nhập version id' }]}>
                                    <Input placeholder="1.2.0" disabled={Boolean(editingVersion)} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Tên bản phát hành" name="version_name" rules={[{ required: true, message: 'Nhập tên bản phát hành' }]}>
                                    <Input placeholder="Phoenix Update" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Download URL" name="download_url" rules={[{ required: true, message: 'Nhập link tải payload zip/tar' }]}>
                            <Input placeholder="https://cdn.example.com/omnimind/v1.2.0.zip" />
                        </Form.Item>

                        <Form.Item label="Critical Update" name="is_critical" valuePropName="checked">
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            label="Changelog (mỗi dòng: type: nội dung)"
                            name="changelog_text"
                            rules={[{ required: true, message: 'Nhập changelog' }]}
                        >
                            <Input.TextArea
                                rows={10}
                                placeholder={'feat: Thêm tính năng update payload\nfix: Sửa lỗi install trên macOS\nrefactor: Tối ưu luồng kiểm tra version'}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                                {editingVersion ? 'Lưu cập nhật' : 'Tạo Version'}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={editingCodexRelease ? "Chỉnh sửa Codex Release" : "Tạo Codex Release mới"}
                    open={isCodexModalOpen}
                    onCancel={() => { setIsCodexModalOpen(false); setEditingCodexRelease(null); }}
                    footer={null}
                    width={760}
                    destroyOnClose
                >
                    <Form form={codexForm} layout="vertical" onFinish={handleSaveCodexRelease}>
                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="Platform" name="platform" rules={[{ required: true, message: 'Chọn platform' }]}>
                                    <Select options={CODEX_PLATFORM_OPTIONS} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Arch" name="arch" rules={[{ required: true, message: 'Chọn architecture' }]}>
                                    <Select options={CODEX_ARCH_OPTIONS} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Channel" name="channel" initialValue="stable" rules={[{ required: true, message: 'Nhập channel' }]}>
                                    <Input placeholder="stable" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="Version" name="version" rules={[{ required: true, message: 'Nhập version' }]}>
                                    <Input placeholder="0.27.0" />
                                </Form.Item>
                            </Col>
                            <Col span={16}>
                                <Form.Item label="Download URL" name="url" rules={[{ required: true, message: 'Nhập link tải Codex' }, { type: 'url', message: 'URL không hợp lệ' }]}>
                                    <Input placeholder="https://.../codex.zip" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Checksum (sha256)" name="checksum">
                                    <Input placeholder="optional sha256" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="File Name" name="file_name">
                                    <Input placeholder="codex.zip" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="Size (bytes)" name="size_bytes">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Method" name="method" initialValue="zip_extract">
                                    <Select options={CODEX_METHOD_OPTIONS} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Active" name="is_active" valuePropName="checked" initialValue>
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Notes" name="notes">
                            <Input.TextArea rows={4} placeholder="Ghi chú release..." />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                                {editingCodexRelease ? 'Lưu cập nhật' : 'Tạo Codex Release'}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </Layout>
        </ConfigProvider>
    );
}

export default App;
