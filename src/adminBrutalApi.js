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

// Admin API - all Supabase queries, NO hardcoded credentials
export const adminApi = {
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
