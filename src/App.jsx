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
    theme,
    Tabs
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
    Trash2,
    CreditCard
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
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [licensePlans, setLicensePlans] = useState([]);
    const [pricingOverrides, setPricingOverrides] = useState([]);
    const [paymentTransactions, setPaymentTransactions] = useState([]);
    const [paymentAudits, setPaymentAudits] = useState([]);
    const [paymentUserHistory, setPaymentUserHistory] = useState([]);
    const [monitoringSummary, setMonitoringSummary] = useState(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLicense, setEditingLicense] = useState(null);

    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
    const [editingVersion, setEditingVersion] = useState(null);
    const [isCodexModalOpen, setIsCodexModalOpen] = useState(false);
    const [editingCodexRelease, setEditingCodexRelease] = useState(null);
    const [isLicensePlanModalOpen, setIsLicensePlanModalOpen] = useState(false);
    const [editingLicensePlan, setEditingLicensePlan] = useState(null);
    const [isPricingOverrideModalOpen, setIsPricingOverrideModalOpen] = useState(false);

    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const [skillForm] = Form.useForm();
    const [versionForm] = Form.useForm();
    const [codexForm] = Form.useForm();
    const [paymentConfigForm] = Form.useForm();
    const [licensePlanForm] = Form.useForm();
    const [pricingOverrideForm] = Form.useForm();

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
            if (isLoggedIn) message.error('Không thể tải danh sách OmniMind release');
            setCodexReleases([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentConfig = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/payments/config`, authHeaders);
            const data = res?.data?.data || null;
            setPaymentConfig(data);
            paymentConfigForm.setFieldsValue({
                bank_code: data?.bank_code || '',
                bank_account: data?.bank_account || '',
                bank_account_name: data?.bank_account_name || '',
                qr_base_url: data?.qr_base_url || 'https://img.vietqr.io/image',
                payment_content_prefix: data?.payment_content_prefix || 'OMNI',
                sepay_api_key: '',
            });
        } catch (err) {
            console.error('fetch payment config failed:', err);
            if (isLoggedIn) message.error('Không thể tải cấu hình thanh toán');
            setPaymentConfig(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchLicensePlans = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/licenses/plans`, authHeaders);
            if (res?.data?.success && Array.isArray(res?.data?.data)) {
                setLicensePlans(res.data.data);
            } else {
                setLicensePlans([]);
            }
        } catch (err) {
            console.error('fetch license plans failed:', err);
            if (isLoggedIn) message.error('Không thể tải bảng giá license');
            setLicensePlans([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPricingOverrides = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/pricing/overrides`, authHeaders);
            if (res?.data?.success && Array.isArray(res?.data?.data)) {
                setPricingOverrides(res.data.data);
            } else {
                setPricingOverrides([]);
            }
        } catch (err) {
            console.error('fetch pricing overrides failed:', err);
            if (isLoggedIn) message.error('Không thể tải pricing overrides');
            setPricingOverrides([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentTransactions = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/payments/transactions?limit=100`, authHeaders);
            if (res?.data?.success && Array.isArray(res?.data?.data)) {
                setPaymentTransactions(res.data.data);
            } else {
                setPaymentTransactions([]);
            }
        } catch (err) {
            console.error('fetch payment transactions failed:', err);
            if (isLoggedIn) message.error('Không thể tải lịch sử giao dịch');
            setPaymentTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentAudits = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/payments/audits?limit=200`, authHeaders);
            if (res?.data?.success && Array.isArray(res?.data?.data)) {
                setPaymentAudits(res.data.data);
            } else {
                setPaymentAudits([]);
            }
        } catch (err) {
            console.error('fetch payment audits failed:', err);
            if (isLoggedIn) message.error('Không thể tải payment audit logs');
            setPaymentAudits([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentUserHistory = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/payments/users/history?limit=200`, authHeaders);
            if (res?.data?.success && Array.isArray(res?.data?.data)) {
                setPaymentUserHistory(res.data.data);
            } else {
                setPaymentUserHistory([]);
            }
        } catch (err) {
            console.error('fetch payment user history failed:', err);
            if (isLoggedIn) message.error('Không thể tải lịch sử thanh toán theo người dùng');
            setPaymentUserHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonitoringSummary = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/admin/omnimind/monitoring/summary`, authHeaders);
            if (res?.data?.success && res?.data?.data) {
                setMonitoringSummary(res.data.data);
            } else {
                setMonitoringSummary(null);
            }
        } catch (err) {
            console.error('fetch monitoring summary failed:', err);
            if (isLoggedIn) message.error('Không thể tải dữ liệu monitoring');
            setMonitoringSummary(null);
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
        fetchPaymentConfig();
        fetchLicensePlans();
        fetchPricingOverrides();
        fetchPaymentTransactions();
        fetchPaymentAudits();
        fetchPaymentUserHistory();
        fetchMonitoringSummary();
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
        setPaymentConfig(null);
        setLicensePlans([]);
        setPricingOverrides([]);
        setPaymentTransactions([]);
        setPaymentAudits([]);
        setPaymentUserHistory([]);
        setMonitoringSummary(null);
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
                note: values.note,
                plan_id: values.plan_id || 'Standard',
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
            note: record.note,
            plan_id: record.plan_id || 'Standard',
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
                note: values.note,
                plan_id: values.plan_id || 'Standard',
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
                checksum_sha256: '',
                package_size_bytes: null,
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
                checksum_sha256: detail.checksum_sha256 || '',
                package_size_bytes: detail.package_size_bytes ?? null,
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
                checksum_sha256: String(values.checksum_sha256 || '').trim(),
                package_size_bytes: values.package_size_bytes ?? null,
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
            message.success(editingCodexRelease ? 'Cập nhật OmniMind release thành công' : 'Tạo OmniMind release thành công');
            setIsCodexModalOpen(false);
            setEditingCodexRelease(null);
            codexForm.resetFields();
            fetchCodexReleases();
        } catch (err) {
            const serverError = err?.response?.data?.error || err?.response?.data?.message;
            message.error(serverError || 'Lỗi khi lưu OmniMind release');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCodexRelease = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`${API_BASE}/admin/omnimind/codex/releases/${id}`, authHeaders);
            message.success('Đã xoá OmniMind release');
            fetchCodexReleases();
        } catch (err) {
            message.error('Không thể xoá OmniMind release');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePaymentConfig = async (values) => {
        const payload = {
            bank_code: String(values.bank_code || '').trim(),
            bank_account: String(values.bank_account || '').trim(),
            bank_account_name: String(values.bank_account_name || '').trim(),
            qr_base_url: String(values.qr_base_url || '').trim(),
            payment_content_prefix: String(values.payment_content_prefix || '').trim().toUpperCase(),
        };
        const nextApiKey = String(values.sepay_api_key || '').trim();
        if (nextApiKey) {
            payload.sepay_api_key = nextApiKey;
        }
        try {
            setLoading(true);
            await axios.put(`${API_BASE}/admin/omnimind/payments/config`, payload, authHeaders);
            message.success('Đã cập nhật cấu hình thanh toán');
            fetchPaymentConfig();
        } catch (err) {
            const serverError = err?.response?.data?.error || err?.response?.data?.message;
            message.error(serverError || 'Không thể lưu cấu hình thanh toán');
        } finally {
            setLoading(false);
        }
    };

    const openLicensePlanModal = (record = null) => {
        setEditingLicensePlan(record);
        licensePlanForm.setFieldsValue({
            plan_id: record?.plan_id || '',
            display_name: record?.display_name || '',
            duration_days: Number(record?.duration_days || 30),
            price: Number(record?.price || 0),
            is_active: record?.is_active ?? true,
            note: record?.note || '',
        });
        setIsLicensePlanModalOpen(true);
    };

    const handleSaveLicensePlan = async (values) => {
        const payload = {
            plan_id: String(values.plan_id || '').trim(),
            display_name: String(values.display_name || '').trim(),
            duration_days: Number(values.duration_days || 0),
            price: Number(values.price || 0),
            is_active: Boolean(values.is_active),
            note: String(values.note || '').trim(),
        };
        try {
            setLoading(true);
            await axios.post(`${API_BASE}/admin/omnimind/licenses/plans`, payload, authHeaders);
            message.success(editingLicensePlan ? 'Cập nhật plan thành công' : 'Tạo plan thành công');
            setIsLicensePlanModalOpen(false);
            setEditingLicensePlan(null);
            licensePlanForm.resetFields();
            fetchLicensePlans();
        } catch (err) {
            const serverError = err?.response?.data?.error || err?.response?.data?.message;
            message.error(serverError || 'Không thể lưu license plan');
        } finally {
            setLoading(false);
        }
    };

    const handleDisableLicensePlan = async (planId) => {
        try {
            setLoading(true);
            await axios.delete(`${API_BASE}/admin/omnimind/licenses/plans/${planId}`, authHeaders);
            message.success('Đã tắt plan');
            fetchLicensePlans();
        } catch (err) {
            message.error('Không thể tắt plan');
        } finally {
            setLoading(false);
        }
    };

    const openPricingOverrideModal = () => {
        pricingOverrideForm.setFieldsValue({
            skill_id: '',
            override_price: null,
            discount_percent: null,
            starts_at: null,
            ends_at: null,
            is_active: true,
            note: '',
        });
        setIsPricingOverrideModalOpen(true);
    };

    const handleSavePricingOverride = async (values) => {
        const payload = {
            skill_id: values.skill_id,
            override_price: values.override_price ?? null,
            discount_percent: values.discount_percent ?? null,
            starts_at: values.starts_at ? values.starts_at.toISOString() : null,
            ends_at: values.ends_at ? values.ends_at.toISOString() : null,
            is_active: Boolean(values.is_active),
            note: String(values.note || '').trim(),
        };
        try {
            setLoading(true);
            await axios.post(`${API_BASE}/admin/omnimind/pricing/overrides`, payload, authHeaders);
            message.success('Đã tạo pricing override');
            setIsPricingOverrideModalOpen(false);
            pricingOverrideForm.resetFields();
            fetchPricingOverrides();
        } catch (err) {
            const serverError = err?.response?.data?.error || err?.response?.data?.message;
            message.error(serverError || 'Không thể tạo pricing override');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePricingOverride = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`${API_BASE}/admin/omnimind/pricing/overrides/${id}`, authHeaders);
            message.success('Đã xoá pricing override');
            fetchPricingOverrides();
        } catch (err) {
            message.error('Không thể xoá pricing override');
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
    const safeLicensePlans = Array.isArray(licensePlans) ? licensePlans : [];
    const safePricingOverrides = Array.isArray(pricingOverrides) ? pricingOverrides : [];
    const safePaymentTransactions = Array.isArray(paymentTransactions) ? paymentTransactions : [];
    const safePaymentAudits = Array.isArray(paymentAudits) ? paymentAudits : [];
    const safePaymentUserHistory = Array.isArray(paymentUserHistory) ? paymentUserHistory : [];
    const safeMonitoringSummary = monitoringSummary && typeof monitoringSummary === 'object' ? monitoringSummary : {};

    const licenseColumns = [
        {
            title: 'License Key',
            dataIndex: 'license_key',
            key: 'license_key',
            render: (t) => <span style={{ fontFamily: 'monospace', color: '#1677ff', fontWeight: 'bold' }}>{t || 'N/A'}</span>
        },
        { title: 'Plan', dataIndex: 'plan_id', key: 'plan_id', width: 120, render: (v) => <Tag color="purple">{v || 'Standard'}</Tag> },
        { title: 'Nguồn cấp', dataIndex: 'issued_source', key: 'issued_source', width: 110, render: (v) => v || '-' },
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
            title: 'Checksum',
            dataIndex: 'checksum_sha256',
            key: 'checksum_sha256',
            width: 220,
            render: (v) => v ? <code>{String(v).slice(0, 18)}...</code> : '-',
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

    const pricingOverrideColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: 'Skill ID', dataIndex: 'skill_id', key: 'skill_id', width: 180, render: (v) => <code>{v}</code> },
        { title: 'Skill Name', dataIndex: 'skill_name', key: 'skill_name' },
        { title: 'Override Price', dataIndex: 'override_price', key: 'override_price', width: 140, render: (v) => (v === null || v === undefined ? '-' : Number(v).toFixed(2)) },
        { title: 'Discount %', dataIndex: 'discount_percent', key: 'discount_percent', width: 120, render: (v) => (v === null || v === undefined ? '-' : `${Number(v).toFixed(2)}%`) },
        { title: 'Active', dataIndex: 'is_active', key: 'is_active', width: 90, render: (v) => v ? <Tag color="green">ON</Tag> : <Tag>OFF</Tag> },
        { title: 'Starts', dataIndex: 'starts_at', key: 'starts_at', width: 160, render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-' },
        { title: 'Ends', dataIndex: 'ends_at', key: 'ends_at', width: 160, render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-' },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            render: (_, r) => (
                <Popconfirm title="Xoá override này?" onConfirm={() => handleDeletePricingOverride(r.id)}>
                    <Button danger icon={<Trash2 size={16} />} />
                </Popconfirm>
            ),
        },
    ];

    const licensePlanColumns = [
        { title: 'Plan ID', dataIndex: 'plan_id', key: 'plan_id', width: 170, render: (v) => <code>{v}</code> },
        { title: 'Tên gói', dataIndex: 'display_name', key: 'display_name' },
        { title: 'Số ngày', dataIndex: 'duration_days', key: 'duration_days', width: 100 },
        { title: 'Giá', dataIndex: 'price', key: 'price', width: 140, render: (v) => Number(v || 0).toFixed(2) },
        { title: 'Kích hoạt', dataIndex: 'is_active', key: 'is_active', width: 100, render: (v) => v ? <Tag color="green">ON</Tag> : <Tag>OFF</Tag> },
        { title: 'Ghi chú', dataIndex: 'note', key: 'note' },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 170,
            render: (_, r) => (
                <Space>
                    <Button icon={<Edit2 size={16} />} onClick={() => openLicensePlanModal(r)} />
                    <Popconfirm title="Tắt plan này?" onConfirm={() => handleDisableLicensePlan(r.plan_id)}>
                        <Button danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const paymentTransactionsColumns = [
        { title: 'Transaction ID', dataIndex: 'id', key: 'id', width: 220, render: (v) => <code>{v}</code> },
        { title: 'Type', dataIndex: 'type', key: 'type', width: 90 },
        { title: 'Item', dataIndex: 'item_id', key: 'item_id', width: 160 },
        { title: 'License', dataIndex: 'license_key', key: 'license_key', width: 170, render: (v) => v || '-' },
        { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, render: (v, r) => `${Number(v || 0).toFixed(2)} ${r?.currency || 'VND'}` },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (v) => <Tag color={String(v || '').toUpperCase() === 'SUCCESS' ? 'green' : (String(v || '').toUpperCase() === 'PENDING' ? 'gold' : 'red')}>{String(v || '').toUpperCase()}</Tag> },
        { title: 'Provider Tx', dataIndex: 'provider_transaction_id', key: 'provider_transaction_id', width: 130, render: (v) => v || '-' },
        { title: 'Payment Content', dataIndex: 'payment_content', key: 'payment_content', width: 170, render: (v) => <code>{v || '-'}</code> },
        { title: 'Failure', dataIndex: 'failure_reason', key: 'failure_reason', width: 120, render: (v) => v || '-' },
        { title: 'Created', dataIndex: 'created_at', key: 'created_at', width: 170, render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-' },
        { title: 'Paid', dataIndex: 'paid_at', key: 'paid_at', width: 170, render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-' },
    ];

    const paymentAuditColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
        { title: 'Transaction ID', dataIndex: 'transaction_id', key: 'transaction_id', width: 240, render: (v) => v ? <code>{v}</code> : '-' },
        { title: 'Event', dataIndex: 'event_type', key: 'event_type', width: 220, render: (v) => <Tag color="blue">{v}</Tag> },
        { title: 'Created', dataIndex: 'created_at', key: 'created_at', width: 170, render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '-' },
        {
            title: 'Detail',
            dataIndex: 'detail_json',
            key: 'detail_json',
            render: (v) => (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 11 }}>
                    {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v || '-')}
                </pre>
            ),
        },
    ];

    const paymentUserHistoryColumns = [
        {
            title: 'License/User',
            dataIndex: 'label',
            key: 'label',
            width: 220,
            render: (v, r) => r?.license_key ? <code>{v}</code> : <Tag>{v || 'Không gắn license'}</Tag>,
        },
        {
            title: 'Trạng thái license',
            dataIndex: 'license_status',
            key: 'license_status',
            width: 140,
            render: (v) => v ? <Tag color={String(v).toLowerCase() === 'active' ? 'green' : 'orange'}>{String(v).toUpperCase()}</Tag> : '-',
        },
        { title: 'Plan', dataIndex: 'license_plan_id', key: 'license_plan_id', width: 130, render: (v) => v || '-' },
        { title: 'Tổng giao dịch', dataIndex: 'total_transactions', key: 'total_transactions', width: 120 },
        { title: 'Success', dataIndex: 'success_transactions', key: 'success_transactions', width: 100, render: (v) => <Tag color="green">{v}</Tag> },
        { title: 'Pending', dataIndex: 'pending_transactions', key: 'pending_transactions', width: 100, render: (v) => <Tag color="gold">{v}</Tag> },
        { title: 'Failed', dataIndex: 'failed_transactions', key: 'failed_transactions', width: 100, render: (v) => <Tag color="red">{v}</Tag> },
        { title: 'Doanh thu success', dataIndex: 'total_success_amount', key: 'total_success_amount', width: 160, render: (v) => `${Number(v || 0).toFixed(2)} VND` },
        { title: 'Lần đầu', dataIndex: 'first_transaction_at', key: 'first_transaction_at', width: 170, render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-' },
        { title: 'Gần nhất', dataIndex: 'last_transaction_at', key: 'last_transaction_at', width: 170, render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-' },
        { title: 'Last Tx', dataIndex: 'last_transaction_id', key: 'last_transaction_id', width: 220, render: (v) => v ? <code>{v}</code> : '-' },
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
                <Col span={8}><Card bordered={false}><Statistic title="Tổng OmniMind CLI Release" value={safeCodexReleases.length} prefix={<Database size={18} />} /></Card></Col>
                <Col span={8}><Card bordered={false}><Statistic title="Đang Active" value={safeCodexReleases.filter((r) => r.is_active).length} /></Card></Col>
                <Col span={8}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<Plus size={20} />}
                        onClick={() => openCodexModal(null)}
                        style={{ width: '100%', height: 60, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        Tạo OmniMind CLI Release
                    </Button>
                </Col>
            </Row>
            <Card bordered={false} style={{ borderRadius: 12 }}>
                <Table columns={codexColumns} dataSource={safeCodexReleases} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
            </Card>
        </>
    );

    const monitoringTx24h = safeMonitoringSummary.transactions_24h || {};
    const monitoringWebhook24h = safeMonitoringSummary.webhook_24h || {};
    const monitoringAudit24h = safeMonitoringSummary.audits_24h || {};

    const paymentContent = (
        <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}><Card bordered={false}><Statistic title="License Plans" value={safeLicensePlans.length} prefix={<CreditCard size={18} />} /></Card></Col>
                <Col span={6}><Card bordered={false}><Statistic title="Pricing Overrides" value={safePricingOverrides.length} /></Card></Col>
                <Col span={6}><Card bordered={false}><Statistic title="Giao dịch SePay" value={safePaymentTransactions.length} /></Card></Col>
                <Col span={6}><Card bordered={false}><Statistic title="User thanh toán" value={safePaymentUserHistory.length} /></Card></Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<Plus size={20} />}
                        onClick={() => openLicensePlanModal(null)}
                        style={{ width: '100%', height: 60, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        Tạo License Plan
                    </Button>
                </Col>
                <Col span={12}>
                    <Button
                        size="large"
                        icon={<Plus size={20} />}
                        onClick={openPricingOverrideModal}
                        style={{ width: '100%', height: 60, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        Tạo Pricing Override
                    </Button>
                </Col>
            </Row>

            <Tabs
                defaultActiveKey="config"
                items={[
                    {
                        key: 'monitoring',
                        label: 'Monitoring & Rollback',
                        children: (
                            <Card bordered={false} style={{ borderRadius: 12 }}>
                                <Row gutter={16} style={{ marginBottom: 12 }}>
                                    <Col span={6}>
                                        <Card size="small">
                                            <Statistic title="Tx 24h" value={Number(monitoringTx24h.total || 0)} />
                                        </Card>
                                    </Col>
                                    <Col span={6}>
                                        <Card size="small">
                                            <Statistic title="Success 24h" value={Number(monitoringTx24h.success || 0)} valueStyle={{ color: '#3f8600' }} />
                                        </Card>
                                    </Col>
                                    <Col span={6}>
                                        <Card size="small">
                                            <Statistic title="Pending quá hạn" value={Number(safeMonitoringSummary.overdue_pending_count || 0)} valueStyle={{ color: '#cf1322' }} />
                                        </Card>
                                    </Col>
                                    <Col span={6}>
                                        <Card size="small">
                                            <Statistic title="Webhook unmatched 24h" value={Number(monitoringWebhook24h.unmatched || 0)} valueStyle={{ color: '#fa8c16' }} />
                                        </Card>
                                    </Col>
                                </Row>
                                <Row gutter={16} style={{ marginBottom: 12 }}>
                                    <Col span={8}><Tag color="green">Webhook matched: {Number(monitoringWebhook24h.matched || 0)}</Tag></Col>
                                    <Col span={8}><Tag color="red">Webhook amount_mismatch: {Number(monitoringWebhook24h.amount_mismatch || 0)}</Tag></Col>
                                    <Col span={8}><Tag color="blue">Audit lỗi 24h: {Number(monitoringAudit24h.error_events || 0)}</Tag></Col>
                                </Row>
                                <Card size="small" title="Checklist rollback khi có sự cố thanh toán/deploy">
                                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                                        <li>Khoá release mới trên CMS (set inactive) để chặn phát sinh lỗi mới.</li>
                                        <li>Kiểm tra tab Monitoring: pending quá hạn, unmatched webhook, audit error.</li>
                                        <li>Đối soát giao dịch với SePay theo `payment_content` và `provider_transaction_id`.</li>
                                        <li>Nếu webhook lỗi: replay webhook hoặc cập nhật trạng thái transaction thủ công.</li>
                                        <li>Redeploy backend/CMS bản ổn định trước, xác nhận API health rồi mới mở lại release.</li>
                                    </ol>
                                </Card>
                            </Card>
                        ),
                    },
                    {
                        key: 'config',
                        label: 'Cấu hình SePay',
                        children: (
                            <Card bordered={false} style={{ borderRadius: 12 }}>
                                <Form form={paymentConfigForm} layout="vertical" onFinish={handleSavePaymentConfig}>
                                    <Row gutter={12}>
                                        <Col span={8}>
                                            <Form.Item label="Bank Code" name="bank_code" rules={[{ required: true, message: 'Nhập bank code' }]}>
                                                <Input placeholder="VCB" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="Bank Account" name="bank_account" rules={[{ required: true, message: 'Nhập số tài khoản' }]}>
                                                <Input placeholder="0123456789" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="Bank Account Name" name="bank_account_name">
                                                <Input placeholder="NGUYEN VAN A" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={12}>
                                        <Col span={12}>
                                            <Form.Item label="QR Base URL" name="qr_base_url" rules={[{ required: true, message: 'Nhập QR base URL' }, { type: 'url', message: 'URL không hợp lệ' }]}>
                                                <Input placeholder="https://img.vietqr.io/image" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="Tiền tố nội dung CK" name="payment_content_prefix" rules={[{ required: true, message: 'Nhập tiền tố' }]}>
                                                <Input maxLength={8} placeholder="OMNI" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={12}>
                                        <Col span={24}>
                                            <Form.Item label="SePay API Key (để trống nếu giữ nguyên)" name="sepay_api_key">
                                                <Input.Password placeholder={paymentConfig?.sepay_api_key ? 'Đã lưu API key, nhập để cập nhật' : 'Nhập API key mới'} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" loading={loading}>Lưu cấu hình thanh toán</Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        ),
                    },
                    {
                        key: 'license_plans',
                        label: 'License Plans',
                        children: (
                            <Card bordered={false} style={{ borderRadius: 12 }}>
                                <Table columns={licensePlanColumns} dataSource={safeLicensePlans} rowKey="plan_id" loading={loading} pagination={{ pageSize: 8 }} />
                            </Card>
                        ),
                    },
                    {
                        key: 'overrides',
                        label: 'Pricing Overrides',
                        children: (
                            <Card bordered={false} style={{ borderRadius: 12 }}>
                                <Table columns={pricingOverrideColumns} dataSource={safePricingOverrides} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} scroll={{ x: 1200 }} />
                            </Card>
                        ),
                    },
                    {
                        key: 'transactions',
                        label: 'Giao dịch SePay',
                        children: (
                            <Card bordered={false} style={{ borderRadius: 12 }}>
                                <Table columns={paymentTransactionsColumns} dataSource={safePaymentTransactions} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1600 }} />
                            </Card>
                        ),
                    },
                    {
                        key: 'users_history',
                        label: 'Lịch sử theo người dùng',
                        children: (
                            <Card bordered={false} style={{ borderRadius: 12 }}>
                                <Table columns={paymentUserHistoryColumns} dataSource={safePaymentUserHistory} rowKey={(row) => `${row.license_key || 'no_license'}:${row.last_transaction_id || row.label || 'unknown'}`} loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1800 }} />
                            </Card>
                        ),
                    },
                    {
                        key: 'audits',
                        label: 'Payment Audits',
                        children: (
                            <Card bordered={false} style={{ borderRadius: 12 }}>
                                <Table columns={paymentAuditColumns} dataSource={safePaymentAudits} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1600 }} />
                            </Card>
                        ),
                    },
                ]}
            />
        </>
    );

    let content = dashboardContent;
    if (activeMenu === 'licenses') content = licensesContent;
    if (activeMenu === 'skills') content = skillsContent;
    if (activeMenu === 'versions') content = versionsContent;
    if (activeMenu === 'codex') content = codexContent;
    if (activeMenu === 'payments') content = paymentContent;

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
                            { key: 'codex', icon: <Key size={18} />, label: 'OmniMind CLI Releases' },
                            { key: 'payments', icon: <CreditCard size={18} />, label: 'Thanh toán' },
                        ]}
                    />
                </Layout.Sider>

                <Layout>
                    <Layout.Header style={{ backgroundColor: 'white', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        <h3 style={{ margin: 0 }}>License & Marketplace Manager</h3>
                        <Space>
                            <Button icon={<RefreshCcw size={16} />} onClick={() => { fetchLicenses(); fetchSkills(); fetchVersions(); fetchCodexReleases(); fetchPaymentConfig(); fetchLicensePlans(); fetchPricingOverrides(); fetchPaymentTransactions(); fetchPaymentAudits(); fetchPaymentUserHistory(); fetchMonitoringSummary(); }}>
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
                        <Form.Item label="Plan ID" name="plan_id" initialValue="Standard">
                            <Input placeholder="Standard / pro_90d ..." />
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
                        <Form.Item label="Plan ID" name="plan_id" initialValue="Standard">
                            <Input placeholder="Standard / pro_90d ..." />
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

                        <Row gutter={12}>
                            <Col span={16}>
                                <Form.Item label="Checksum SHA256" name="checksum_sha256">
                                    <Input placeholder="sha256:abc... hoặc chỉ nhập hex" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Package size (bytes)" name="package_size_bytes">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

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
                    title={editingCodexRelease ? "Chỉnh sửa OmniMind CLI Release" : "Tạo OmniMind CLI Release mới"}
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
                                <Form.Item label="Download URL" name="url" rules={[{ required: true, message: 'Nhập link tải OmniMind CLI' }, { type: 'url', message: 'URL không hợp lệ' }]}>
                                    <Input placeholder="https://.../omnimind-cli.zip" />
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
                                    <Input placeholder="omnimind-cli.zip" />
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
                                {editingCodexRelease ? 'Lưu cập nhật' : 'Tạo OmniMind CLI Release'}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={editingLicensePlan ? "Chỉnh sửa License Plan" : "Tạo License Plan"}
                    open={isLicensePlanModalOpen}
                    onCancel={() => { setIsLicensePlanModalOpen(false); setEditingLicensePlan(null); }}
                    footer={null}
                    destroyOnClose
                >
                    <Form form={licensePlanForm} layout="vertical" onFinish={handleSaveLicensePlan}>
                        <Form.Item label="Plan ID" name="plan_id" rules={[{ required: true, message: 'Nhập plan_id' }]}>
                            <Input placeholder="standard_30d" disabled={Boolean(editingLicensePlan)} />
                        </Form.Item>
                        <Form.Item label="Tên gói" name="display_name" rules={[{ required: true, message: 'Nhập tên gói' }]}>
                            <Input placeholder="Standard 30 ngày" />
                        </Form.Item>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Số ngày hiệu lực" name="duration_days" rules={[{ required: true, message: 'Nhập số ngày' }]}>
                                    <InputNumber min={1} step={1} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Giá (VND)" name="price" rules={[{ required: true, message: 'Nhập giá' }]}>
                                    <InputNumber min={0} step={1000} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label="Active" name="is_active" valuePropName="checked" initialValue>
                            <Switch />
                        </Form.Item>
                        <Form.Item label="Note" name="note">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading}>
                                {editingLicensePlan ? 'Lưu cập nhật' : 'Tạo Plan'}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="Tạo Pricing Override"
                    open={isPricingOverrideModalOpen}
                    onCancel={() => setIsPricingOverrideModalOpen(false)}
                    footer={null}
                    destroyOnClose
                >
                    <Form form={pricingOverrideForm} layout="vertical" onFinish={handleSavePricingOverride}>
                        <Form.Item label="Skill ID" name="skill_id" rules={[{ required: true, message: 'Nhập skill_id' }]}>
                            <Input placeholder="office-meeting-notes" />
                        </Form.Item>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Override Price" name="override_price">
                                    <InputNumber min={0} step={1000} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Discount %" name="discount_percent">
                                    <InputNumber min={0} max={100} step={1} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Starts At" name="starts_at">
                                    <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm:ss" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Ends At" name="ends_at">
                                    <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm:ss" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label="Active" name="is_active" valuePropName="checked" initialValue>
                            <Switch />
                        </Form.Item>
                        <Form.Item label="Note" name="note">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading}>Tạo Override</Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </Layout>
        </ConfigProvider>
    );
}

export default App;
