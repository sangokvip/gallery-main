import { supabase } from './utils/supabase.js';

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function getReportDataCount(reportData) {
  if (!reportData || typeof reportData !== 'object') return 0;
  if (Number.isFinite(reportData.completedItems)) return reportData.completedItems;
  if (reportData.ratings && typeof reportData.ratings === 'object') {
    return Object.values(reportData.ratings).filter(Boolean).length;
  }
  return 0;
}

function isLocalAdminMockEnabled() {
  if (import.meta.env.VITE_ADMIN_MOCK !== '1') return false;
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

const mockAdminSession = {
  id: 'mock-admin-session',
  username: 'admin-preview',
  role: 'admin',
  sessionToken: 'local-admin-mock-session',
  expiresAt: '2026-12-31T23:59:59.000Z'
};

const mockRecordDetails = Array.from({ length: 108 }, (_, index) => {
  const ratings = ['SSS', 'SS', 'S', 'Q', 'N', 'W'];
  const category = ['SSS 控制', 'SS 感官', 'S 信任', 'Q 情境'][index % 4];
  return {
    id: `mock-detail-${index + 1}`,
    record_id: 'mock-record-001',
    category,
    item: `本地预览项目 ${index + 1}`,
    rating: ratings[index % ratings.length]
  };
});

function buildMockRecords() {
  return Array.from({ length: 36 }, (_, index) => {
    const type = ['female', 'male', 's', 'lgbt'][index % 4];
    const detailCount = index === 0 ? 108 : 24 + (index % 8) * 6;
    return {
      id: `mock-record-${String(index + 1).padStart(3, '0')}`,
      test_type: type,
      user_id_text: `mock-user-${String((index % 6) + 1).padStart(2, '0')}`,
      nickname: `预览用户${(index % 6) + 1}`,
      result_count: detailCount,
      report_data: { completedItems: detailCount, totalItems: detailCount },
      created_at: new Date(Date.UTC(2026, 4, 28 - index, 10, index % 60, 0)).toISOString()
    };
  });
}

const localAdminApi = {
  async login(username) {
    return {
      ...mockAdminSession,
      username: username?.trim() || mockAdminSession.username
    };
  },

  async changePassword() {
    return true;
  },

  validateSession() {
    try {
      const raw = localStorage.getItem('admin_data');
      if (!raw) return null;
      const admin = JSON.parse(raw);
      if (!admin?.username || !admin?.role || !admin?.id) {
        localStorage.removeItem('admin_data');
        return null;
      }
      return admin;
    } catch {
      localStorage.removeItem('admin_data');
      return null;
    }
  },

  async getSessionTokenHash() {
    return 'local-admin-mock-session-hash';
  },

  async getSettings() {
    return {
      site_title: 'M-Profile Lab',
      max_login_attempts: '8',
      session_timeout: '86400',
      data_retention_days: '365',
      enable_ip_tracking: 'true',
      enable_analytics: 'true'
    };
  },

  async saveSetting() {
    return true;
  },

  async getStats() {
    return {
      totalUsers: 128,
      totalTests: 36,
      todayUsers: 7,
      todayTests: 11,
      types: [
        { name: '女M测试', type: 'female', count: 12, todayCount: 4 },
        { name: '男M测试', type: 'male', count: 9, todayCount: 3 },
        { name: 'S型测试', type: 's', count: 8, todayCount: 2 },
        { name: 'LGBT+测试', type: 'lgbt', count: 7, todayCount: 2 }
      ]
    };
  },

  async getMemberStats() {
    return {
      totalMembers: 18,
      activeSubscriptions: 9,
      pendingOrders: 2,
      activeShares: 6
    };
  },

  async getMembers() {
    return {
      total: 3,
      members: [
        {
          account_id: '00000000-0000-4000-8000-000000000001',
          display_name: '本地高级会员',
          membership_tier: 'premium',
          subscription: { status: 'active' },
          legacy_user_id_text: 'mock-user-01',
          orders: [{ id: 'mock-order-001' }],
          created_at: '2026-05-24T08:00:00.000Z'
        },
        {
          account_id: '00000000-0000-4000-8000-000000000002',
          display_name: '本地基础会员',
          membership_tier: 'basic',
          subscription: { status: 'active' },
          legacy_user_id_text: 'mock-user-02',
          orders: [],
          created_at: '2026-05-25T08:00:00.000Z'
        },
        {
          account_id: '00000000-0000-4000-8000-000000000003',
          display_name: '本地免费会员',
          membership_tier: 'free',
          subscription: null,
          legacy_user_id_text: 'mock-user-03',
          orders: [],
          created_at: '2026-05-26T08:00:00.000Z'
        }
      ]
    };
  },

  async getMemberOrders() {
    return [
      {
        id: 'mock-order-pending-001',
        plan_code: 'premium_monthly',
        amount_cents: 3900,
        currency: 'CNY',
        status: 'pending',
        account_id: '00000000-0000-4000-8000-000000000001',
        contact_note: '本地预览待审核订单',
        created_at: '2026-05-28T08:00:00.000Z'
      },
      {
        id: 'mock-order-approved-001',
        plan_code: 'lifetime',
        amount_cents: 29900,
        currency: 'CNY',
        status: 'approved',
        account_id: '00000000-0000-4000-8000-000000000002',
        contact_note: '已通过订单',
        created_at: '2026-05-27T08:00:00.000Z'
      }
    ];
  },

  async approveMemberOrder() {
    return true;
  },

  async rejectMemberOrder() {
    return true;
  },

  async getRecords(filters = {}, limit = 20, offset = 0) {
    let records = buildMockRecords();
    if (filters.testType) records = records.filter(record => record.test_type === filters.testType);
    return {
      results: records.slice(offset, offset + limit),
      total: records.length
    };
  },

  async getRecordDetails(recordId) {
    if (recordId === 'mock-record-001') return mockRecordDetails;
    return mockRecordDetails.slice(0, 36).map(detail => ({ ...detail, record_id: recordId }));
  },

  async getMessages() {
    return { messages: [], total: 0 };
  },

  async deleteMessage() {
    return true;
  }
};

// Admin API - all Supabase queries, NO hardcoded credentials
const realAdminApi = {
  // 登录 - 通过 Supabase RPC 验证密码
  async login(username, password) {
    const sessionToken = randomToken();
    const sessionTokenHash = await sha256(sessionToken);
    const { data: sessionData, error: sessionError } = await supabase.rpc('create_admin_session', {
      input_username: username,
      input_password: password,
      input_session_token_hash: sessionTokenHash
    });

    if (!sessionError && sessionData?.id) {
      return {
        id: sessionData.id,
        username: sessionData.username,
        role: sessionData.role,
        sessionToken,
        expiresAt: sessionData.expires_at
      };
    }

    throw new Error(sessionError?.message || '管理员登录服务未部署');
  },

  // 修改密码 - 通过 Supabase RPC
  async changePassword(username, currentPassword, newPassword) {
    const sessionTokenHash = await this.getSessionTokenHash();
    if (!sessionTokenHash) throw new Error('管理员会话无效或已过期');

    const { data, error } = await supabase.rpc('change_admin_password', {
      input_session_token_hash: sessionTokenHash,
      current_password: currentPassword,
      new_password: newPassword
    });
    if (error) throw new Error('修改密码失败: ' + error.message);
    if (!data?.success) throw new Error(data?.error || '修改密码失败');
    return true;
  },

  // 验证会话
  validateSession() {
    try {
      const raw = localStorage.getItem('admin_data');
      if (!raw) return null;
      const admin = JSON.parse(raw);
      if (!admin?.username || !admin?.role || !admin?.id) { localStorage.removeItem('admin_data'); return null; }
      return admin;
    } catch { localStorage.removeItem('admin_data'); return null; }
  },

  async getSessionTokenHash() {
    const admin = this.validateSession();
    if (!admin?.sessionToken) return null;
    return sha256(admin.sessionToken);
  },

  // 获取/保存系统设置 - 通过 Supabase system_settings 表
  async getSettings() {
    const { data, error } = await supabase.from('system_settings').select('key, value, description');
    if (error) return {};
    return (data || []).reduce((acc, item) => { acc[item.key] = item.value; return acc; }, {});
  },

  async saveSetting(key, value) {
    const { error } = await supabase.from('system_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw new Error('保存设置失败: ' + error.message);
    return true;
  },

  async getStats() {
    const todayISO = new Date(new Date().setHours(0,0,0,0)).toISOString();
    const [u, t, tu, tt] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('test_records').select('id', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }).gte('created_at', todayISO),
      supabase.from('test_records').select('id', { count: 'exact' }).gte('created_at', todayISO)
    ]);
    const types = await Promise.all(
      [{ name: '女M测试', type: 'female' }, { name: '男M测试', type: 'male' }, { name: 'S型测试', type: 's' }, { name: 'LGBT+测试', type: 'lgbt' }]
        .map(async tp => {
          const [{ count: c1 }, { count: c2 }] = await Promise.all([
            supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', tp.type),
            supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', tp.type).gte('created_at', todayISO)
          ]);
          return { ...tp, count: c1 || 0, todayCount: c2 || 0 };
        })
    );
    return { totalUsers: u.count || 0, totalTests: t.count || 0, todayUsers: tu.count || 0, todayTests: tt.count || 0, types };
  },

  async getMemberStats() {
    const sessionTokenHash = await this.getSessionTokenHash();
    if (sessionTokenHash) {
      const { data, error } = await supabase.rpc('member_admin_overview', {
        input_session_token_hash: sessionTokenHash
      });
      if (!error && data) return data;
      throw new Error(error?.message || '会员概览服务不可用');
    }

    throw new Error('管理员会话无效或已过期，请重新登录');
  },

  async getMembers(limit = 50, offset = 0) {
    const sessionTokenHash = await this.getSessionTokenHash();
    if (sessionTokenHash) {
      const { data, error } = await supabase.rpc('member_admin_members', {
        input_session_token_hash: sessionTokenHash,
        input_limit: limit,
        input_offset: offset
      });
      if (!error && data) {
        return {
          members: data.members || [],
          total: data.total || 0
        };
      }
      throw new Error(error?.message || '会员列表服务不可用');
    }

    throw new Error('管理员会话无效或已过期，请重新登录');
  },

  async getMemberOrders(limit = 50) {
    const sessionTokenHash = await this.getSessionTokenHash();
    if (sessionTokenHash) {
      const { data, error } = await supabase.rpc('member_admin_orders', {
        input_session_token_hash: sessionTokenHash,
        input_limit: limit
      });
      if (!error && data) return data;
      throw new Error(error?.message || '会员订单服务不可用');
    }

    throw new Error('管理员会话无效或已过期，请重新登录');
  },

  async approveMemberOrder(order, tier) {
    const sessionTokenHash = await this.getSessionTokenHash();
    if (sessionTokenHash) {
      const { error } = await supabase.rpc('member_admin_approve_order', {
        input_session_token_hash: sessionTokenHash,
        input_order_id: order.id
      });
      if (!error) return true;
      throw new Error(error?.message || '会员订单审核服务不可用');
    }

    throw new Error('管理员会话无效或已过期，请重新登录');
  },

  async rejectMemberOrder(orderId, note = '后台手动拒绝') {
    const sessionTokenHash = await this.getSessionTokenHash();
    if (sessionTokenHash) {
      const { error } = await supabase.rpc('member_admin_reject_order', {
        input_session_token_hash: sessionTokenHash,
        input_order_id: orderId,
        input_note: note
      });
      if (!error) return true;
      throw new Error(error?.message || '会员订单拒绝服务不可用');
    }

    throw new Error('管理员会话无效或已过期，请重新登录');
  },

  async getRecords(filters = {}, limit = 20, offset = 0) {
    let q = supabase.from('test_records').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (filters.testType) q = q.eq('test_type', filters.testType);
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) return { results: [], total: 0 };
    const records = data || [];

    const resultCounts = await Promise.all(records.map(async (record) => {
      const { count: resultCount, error: countError } = await supabase
        .from('test_results')
        .select('id', { count: 'exact', head: true })
        .eq('record_id', record.id);

      if (!countError && Number.isFinite(resultCount)) return resultCount;
      return getReportDataCount(record.report_data);
    }));

    const userIds = [...new Set(records.map(r => r.user_id_text).filter(Boolean))];
    let nickMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, nickname').in('id', userIds);
      if (users) users.forEach(u => { nickMap[u.id] = u.nickname; });
    }
    return {
      results: records.map((r, index) => ({
        ...r,
        nickname: nickMap[r.user_id_text] || '匿名用户',
        result_count: resultCounts[index] || 0
      })),
      total: count || 0
    };
  },

  async getRecordDetails(recordId) {
    const { data, error } = await supabase.from('test_results').select('*').eq('record_id', recordId).order('category');
    return error ? [] : (data || []);
  },

  async getMessages() {
    const { data, count } = await supabase.from('messages').select('id, text, user_id, created_at, is_pinned', { count: 'exact' }).order('created_at', { ascending: false }).limit(50);
    return { messages: data || [], total: count || 0 };
  },

  async deleteMessage(id) {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) throw error;
  }
};

export const adminApi = isLocalAdminMockEnabled() ? localAdminApi : realAdminApi;
