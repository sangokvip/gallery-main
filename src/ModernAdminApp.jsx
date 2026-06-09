import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { adminApi } from './adminBrutalApi.js';
import './admin-brutal.css';

const TEST_BADGE = { female: 'badge-female', male: 'badge-male', s: 'badge-s', lgbt: 'badge-lgbt' };
const TEST_LABEL = { female: '女M测试', male: '男M测试', s: 'S型测试', lgbt: 'LGBT+' };
const TYPE_ACCENT = { female: 'accent-pink', male: 'accent-blue', s: 'accent-amber', lgbt: 'accent-green' };
const RATING_COLORS = { SSS: '#dc2626', SS: '#ea580c', S: '#d97706', Q: '#2563eb', N: '#6b7280', W: '#94a3b8' };
const getMemberTierLabel = () => '会员';
const getMemberPlanLabel = () => '会员';
const GENDER_LABELS = { male: '男生', female: '女生', non_binary: '非二元', other: '其他', undisclosed: '不想透露' };
const BDSM_ORIENTATION_LABELS = { sub: 'M / sub 倾向', dom: 'S / Dom 倾向', switch: 'Switch / 双向', exploring: '探索中', undisclosed: '不想透露' };
const ORDER_STATUS_LABEL = {
  pending: '待审核',
  paid: '已付款',
  approved: '已开通',
  rejected: '已拒绝',
  canceled: '已取消',
  refunded: '已退款'
};

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
}

function formatMoney(cents = 0, currency = 'CNY') {
  return `${currency} ${(Number(cents || 0) / 100).toFixed(2)}`;
}

function getAdminRecordCount(record) {
  if (Number.isFinite(record?.result_count)) return record.result_count;
  if (Number.isFinite(record?.report_data?.completedItems)) return record.report_data.completedItems;
  if (record?.report_data?.ratings && typeof record.report_data.ratings === 'object') {
    return Object.values(record.report_data.ratings).filter(Boolean).length;
  }
  return 0;
}

function getMemberStatusBadgeClass(member) {
  if (member?.gender_identity === 'male') return 'badge-male';
  if (member?.gender_identity === 'female') return 'badge-female';
  if (member?.is_banned) return 'badge-danger';
  return 'badge-neutral';
}

function getMemberAssessmentCount(member) {
  return member?.assessment_count
    ?? member?.test_record_count
    ?? member?.record_count
    ?? member?.records?.length
    ?? 0;
}

function getRecordOwnerName(record) {
  return record?.member_username || record?.member_login_name || '';
}

// ===== Login =====
function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const admin = await adminApi.login(form.username, form.password);
      localStorage.setItem('admin_data', JSON.stringify(admin));
      onLogin(admin);
    } catch (err) { setError(err.message); }
  };
  return (
    <div className="admin-app">
      <div className="login-wrap">
        <div className="brutal-card login-card no-hover">
          <h1>M-Profile Lab</h1>
          <p className="sub">管理后台</p>
          {error && <div className="login-error">{error}</div>}
          <form onSubmit={submit}>
            <input placeholder="用户名" value={form.username} onChange={e => setForm({...form, username: e.target.value})} autoFocus />
            <input type="password" placeholder="密码" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            <button type="submit" className="btn-login">登录</button>
          </form>
        </div>
      </div>
    </div>
  );
}

const ADMIN_SHORTCUTS = [
  { label: '测评记录', description: '查看、筛选和翻页测评数据', target: 'records', accent: 'accent-blue' },
  { label: '会员管理', description: '查看会员账号、联系方式和测评记录', target: 'members', accent: 'accent-pink' },
  { label: '安全管理', description: '修改密码和查看当前会话', target: 'security', accent: 'accent-green' },
  { label: '系统设置', description: '站点配置和外部工具入口', target: 'settings', accent: 'accent-amber' },
];

const SITE_SHORTCUTS = [
  { label: '女M测试', href: '/female.html', accent: 'accent-pink' },
  { label: '男M测试', href: '/male.html', accent: 'accent-blue' },
  { label: 'S型测试', href: '/s.html', accent: 'accent-amber' },
  { label: 'LGBT+测试', href: '/lgbt.html', accent: 'accent-green' },
  { label: '留言板', href: '/message.html', accent: 'accent-green' },
  { label: '图库', href: '/gallery.html', accent: 'accent-blue' },
  { label: '会员中心', href: '/member.html', accent: 'accent-pink' },
];

// ===== Dashboard =====
function DashboardView({ stats, loading, recentRecords, onViewDetail, onNavigate }) {
  const { totalUsers = 0, totalTests = 0, todayUsers = 0, todayTests = 0, types = [] } = stats || {};
  return (
    <div>
      <div className="section-header"><div><h2>仪表板</h2><span className="sub">系统运行概览</span></div></div>
      <div className="shortcut-section">
        <div className="section-header compact"><h3>后台快捷跳转</h3></div>
        <div className="shortcut-grid">
          {ADMIN_SHORTCUTS.map(item => (
            <button key={item.target} type="button" className={`brutal-card shortcut-card ${item.accent}`} onClick={() => onNavigate(item.target)}>
              <span className="shortcut-title">{item.label}</span>
              <span className="shortcut-desc">{item.description}</span>
            </button>
          ))}
        </div>
        <div className="section-header compact"><h3>站点页面</h3></div>
        <div className="shortcut-grid site-shortcuts">
          {SITE_SHORTCUTS.map(item => (
            <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className={`brutal-card shortcut-card ${item.accent}`}>
              <span className="shortcut-title">{item.label}</span>
              <span className="shortcut-desc">新窗口打开</span>
            </a>
          ))}
        </div>
      </div>
      {loading && <div className="loading">加载统计数据中...</div>}
      {!loading && !stats && <div className="loading">统计数据暂不可用</div>}
      {!loading && stats && (
        <>
      <div className="stats-grid">
        <div className="brutal-card stat-card accent-green"><div className="stat-value">{totalUsers}</div><div className="stat-label">注册用户</div><div className="stat-today">今日 +{todayUsers}</div></div>
        <div className="brutal-card stat-card accent-blue"><div className="stat-value">{totalTests}</div><div className="stat-label">测评总数</div><div className="stat-today">今日 +{todayTests}</div></div>
        <div className="brutal-card stat-card accent-pink"><div className="stat-value">{types?.length ? types.reduce((s,t) => s+t.todayCount, 0) : 0}</div><div className="stat-label">今日测试</div><div className="stat-today">活跃中</div></div>
        <div className="brutal-card stat-card accent-amber"><div className="stat-value">{types?.length || 4}</div><div className="stat-label">测试类型</div><div className="stat-today">全部运行</div></div>
      </div>
      <div className="section-header" style={{marginTop:'1rem'}}><h3 style={{fontWeight:800, fontSize:'1.2rem'}}>测试类型分布</h3></div>
      <div className="type-grid">
        {(types || []).map(t => (
          <div key={t.type} className={`brutal-card type-card ${TYPE_ACCENT[t.type] || ''}`}>
            <div className="type-count">{t.count}</div>
            <div className="type-name">{t.name}</div>
            <div className="type-today">今日 +{t.todayCount}</div>
          </div>
        ))}
      </div>
      <div className="section-header" style={{marginTop:'2rem'}}><h3 style={{fontWeight:800, fontSize:'1.2rem'}}>最近测评</h3></div>
      <div className="brutal-card no-hover" style={{padding:0, overflow:'hidden'}}>
        <table className="brutal-table">
          <thead><tr><th>类型</th><th>用户</th><th>时间</th><th>操作</th></tr></thead>
          <tbody>
            {(recentRecords || []).length === 0 ? (
              <tr><td colSpan={4} style={{textAlign:'center', padding:'2rem', color:'#888'}}>暂无记录</td></tr>
            ) : recentRecords.map(r => (
              <tr key={r.id}>
                <td><span className={`badge ${TEST_BADGE[r.test_type] || ''}`}>{TEST_LABEL[r.test_type] || r.test_type}</span></td>
                <td>{r.nickname || '匿名'}</td>
                <td>{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                <td><button className="btn-brutal" onClick={() => onViewDetail(r)}>详情</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}

// ===== Records =====
function RecordsView({ records, loading, total, page, rowsPerPage, filters, onPageChange, onRppChange, onFilterChange, onRefresh, onViewDetail }) {
  const totalPages = Math.ceil(total / rowsPerPage);
  const [jumpPage, setJumpPage] = useState('');
  const goToPage = () => {
    const requestedPage = Number.parseInt(jumpPage, 10);
    if (!Number.isFinite(requestedPage)) return;
    const nextPage = Math.min(Math.max(requestedPage, 1), totalPages || 1) - 1;
    setJumpPage('');
    onPageChange(nextPage);
  };

  return (
    <div>
      <div className="section-header"><div><h2>测评记录</h2><span className="sub">共 {total} 条记录</span></div>
        <button className="btn-brutal" onClick={onRefresh} disabled={loading}>↻ 刷新</button>
      </div>
      <div className="filter-bar">
        <select value={filters.testType} onChange={e => onFilterChange('testType', e.target.value)}>
          <option value="">全部类型</option>
          <option value="female">女M测试</option><option value="male">男M测试</option>
          <option value="s">S型测试</option><option value="lgbt">LGBT+测试</option>
        </select>
      </div>
      <div className="brutal-card no-hover" style={{padding:0, overflow:'hidden'}}>
        {loading ? <div className="loading">加载中...</div> : records.length === 0 ? (
          <div className="loading">{filters.testType ? '当前筛选无结果' : '暂无测评记录'}</div>
        ) : (
          <>
            <table className="brutal-table records-table">
              <thead><tr><th>ID / 会员</th><th>类型</th><th>用户</th><th>结果</th><th>时间</th><th>操作</th></tr></thead>
              <tbody>{records.map(r => (
                <tr key={r.id}>
                  <td className={getRecordOwnerName(r) ? 'record-owner-cell' : 'record-id-cell'}>
                    {getRecordOwnerName(r) || r.id}
                  </td>
                  <td><span className={`badge ${TEST_BADGE[r.test_type]||''}`}>{TEST_LABEL[r.test_type]||r.test_type}</span></td>
                  <td>{r.nickname}</td>
                  <td>{r.result_count ?? r.test_results?.length ?? 0} 项</td>
                  <td style={{fontSize:'0.85rem'}}>{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                  <td><button className="btn-brutal" onClick={() => onViewDetail(r)}>详情</button></td>
                </tr>
              ))}</tbody>
            </table>
            <div className="pagination" style={{padding:'0.8rem 1rem'}}>
              <span className="pagination-info">{page * rowsPerPage + 1}-{Math.min((page+1)*rowsPerPage, total)} / 共 {total} 条</span>
              <div className="pagination-controls">
                <span style={{fontWeight:600, fontSize:'0.85rem'}}>每页</span>
                <select value={rowsPerPage} onChange={e => onRppChange(+e.target.value)}>
                  {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button className="btn-brutal" disabled={page===0} onClick={() => onPageChange(page-1)}>← 上一页</button>
                <span style={{fontWeight:700, fontSize:'0.9rem'}}>{page+1} / {totalPages || 1}</span>
                <button className="btn-brutal" disabled={page >= totalPages-1} onClick={() => onPageChange(page+1)}>下一页 →</button>
                <div className="page-jump">
                  <input
                    type="number"
                    min="1"
                    max={totalPages || 1}
                    value={jumpPage}
                    onChange={e => setJumpPage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') goToPage(); }}
                    placeholder="页码"
                    aria-label="跳转页码"
                  />
                  <button className="btn-brutal" disabled={!jumpPage || totalPages <= 1} onClick={goToPage}>跳转</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ===== Members =====
function MembersView({ stats, members, orders, loading, error, actionMessage, onRefresh, onApproveOrder, onRejectOrder, onViewDetail }) {
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [orderFilter, setOrderFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberAction, setMemberAction] = useState(null);
  const [memberActionForm, setMemberActionForm] = useState({ password: '', confirmPassword: '', reason: '' });
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [localActionMessage, setLocalActionMessage] = useState('');

  const openMemberAction = (type, member) => {
    setMemberAction({ type, member });
    setMemberActionForm({ password: '', confirmPassword: '', reason: '' });
    setLocalActionMessage('');
  };

  const closeMemberAction = () => {
    if (memberActionLoading) return;
    setMemberAction(null);
    setMemberActionForm({ password: '', confirmPassword: '', reason: '' });
  };

  const submitMemberAction = async (event) => {
    event.preventDefault();
    if (!memberAction?.member?.account_id) return;
    setLocalActionMessage('');

    const { type, member } = memberAction;
    if (type === 'password') {
      if (memberActionForm.password.length < 6) {
        setLocalActionMessage('会员新密码至少 6 位');
        return;
      }
      if (memberActionForm.password !== memberActionForm.confirmPassword) {
        setLocalActionMessage('两次输入的密码不一致');
        return;
      }
    }
    if (type === 'delete' && memberActionForm.reason.trim().length < 2) {
      setLocalActionMessage('删除会员前请填写原因，方便后台记录');
      return;
    }

    setMemberActionLoading(true);
    try {
      if (type === 'password') {
        await adminApi.resetMemberPassword(member.account_id, memberActionForm.password);
        setLocalActionMessage('会员密码已修改');
      } else if (type === 'ban') {
        await adminApi.setMemberBan(member.account_id, true, memberActionForm.reason);
        setSelectedMember(prev => prev?.account_id === member.account_id ? { ...prev, is_banned: true, banned_reason: memberActionForm.reason } : prev);
        setLocalActionMessage('会员已封禁');
      } else if (type === 'unban') {
        await adminApi.setMemberBan(member.account_id, false, '');
        setSelectedMember(prev => prev?.account_id === member.account_id ? { ...prev, is_banned: false, banned_reason: null, banned_at: null } : prev);
        setLocalActionMessage('会员已解封');
      } else if (type === 'delete') {
        await adminApi.deleteMemberAccount(member.account_id, memberActionForm.reason);
        setSelectedMember(null);
        setLocalActionMessage('会员已删除');
      }
      setMemberAction(null);
      setMemberActionForm({ password: '', confirmPassword: '', reason: '' });
      await onRefresh();
    } catch (err) {
      setLocalActionMessage(err.message || '会员操作失败');
    } finally {
      setMemberActionLoading(false);
    }
  };

  const pendingOrders = (orders || []).filter(order => order.status === 'pending');
  const visibleOrders = (orders || []).filter(order => !orderFilter || order.status === orderFilter);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredMembers = (members || []).filter(member => {
    const matchesTier = !tierFilter || member.membership_tier === tierFilter;
    const haystack = [
      member.display_name,
      member.contact_email,
      member.qq,
      member.wechat,
      member.phone,
      member.account_id,
      member.legacy_user_id_text
    ].filter(Boolean).join(' ').toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchesTier && matchesQuery;
  });

  return (
    <div>
      <div className="section-header">
        <div><h2>会员管理</h2><span className="sub">会员账号、联系方式和测评记录</span></div>
        <button className="btn-brutal" onClick={onRefresh} disabled={loading}>↻ 刷新</button>
      </div>
      {loading ? <div className="loading">加载会员数据中...</div> : (
        <>
          {error && (
            <div className="login-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          {(actionMessage || localActionMessage) && (
            <div className="brutal-card no-hover" style={{ marginBottom: '1rem', padding: '0.8rem 1rem', fontWeight: 700 }}>
              {localActionMessage || actionMessage}
            </div>
          )}
          <div className="stats-grid">
            <div className="brutal-card stat-card accent-pink"><div className="stat-value">{stats?.totalMembers || 0}</div><div className="stat-label">会员账号</div><div className="stat-today">已注册</div></div>
            <div className="brutal-card stat-card accent-green"><div className="stat-value">{stats?.activeShares || 0}</div><div className="stat-label">分享链接</div><div className="stat-today">已生成</div></div>
            <div className="brutal-card stat-card accent-amber"><div className="stat-value">{pendingOrders.length}</div><div className="stat-label">历史待处理</div><div className="stat-today">兼容旧订单</div></div>
            <div className="brutal-card stat-card accent-blue"><div className="stat-value">{filteredMembers.length}</div><div className="stat-label">当前筛选</div><div className="stat-today">列表结果</div></div>
          </div>

          <div className="member-admin-layout">
            <div className="brutal-card no-hover">
              <div className="section-header compact"><h3>会员筛选</h3></div>
              <div className="member-filter-grid">
                <div className="form-group">
                  <label>搜索会员</label>
                  <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="昵称 / 邮箱 / QQ / 微信 / 电话"
                  />
                </div>
                <div className="form-group">
                  <label>账号类型</label>
                  <select value={tierFilter} onChange={event => setTierFilter(event.target.value)}>
                    <option value="">全部会员</option>
                    <option value="free">普通会员</option>
                    <option value="basic">普通会员</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>订单状态</label>
                  <select value={orderFilter} onChange={event => setOrderFilter(event.target.value)}>
                    <option value="">全部订单</option>
                    <option value="pending">待审核</option>
                    <option value="approved">已开通</option>
                    <option value="rejected">已拒绝</option>
                    <option value="canceled">已取消</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="brutal-card no-hover member-admin-help">
              <h3>后台能做什么</h3>
              <p>查看会员资料、联系方式和测评记录。旧订单数据仅保留兼容查看，不再用于限制会员功能。</p>
            </div>
          </div>

          <div className="section-header compact"><h3>会员账号</h3><span className="sub">显示 {filteredMembers.length} / {members?.length || 0} 个</span></div>
          <div className="brutal-card no-hover table-scroll" style={{padding:0}}>
            <table className="brutal-table records-table member-list-table">
              <thead><tr><th>会员</th><th>联系方式</th><th>状态</th><th>分享</th><th>测评数量</th><th>创建时间</th><th>操作</th></tr></thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center', padding:'2rem', color:'#888'}}>暂无会员账号</td></tr>
                ) : filteredMembers.map(member => (
                  <tr key={member.account_id}>
                    <td>
                      <div className="contact-stack">
                        <strong>{member.login_name || member.display_name || '会员用户'}</strong>
                        <small>{member.account_id?.slice(0, 8) || '-'}</small>
                      </div>
                    </td>
                    <td>
                      <div className="contact-stack">
                        <span className="contact-primary">{member.contact_email || '-'}</span>
                        <small>{[member.qq && `QQ ${member.qq}`, member.wechat && `微信 ${member.wechat}`, member.phone && `电话 ${member.phone}`].filter(Boolean).join(' · ') || '未填写其他联系方式'}</small>
                      </div>
                    </td>
                    <td>
                      <div className="contact-stack">
                        <span className={`badge ${getMemberStatusBadgeClass(member)}`}>{member.is_banned ? '已封禁' : getMemberTierLabel(member.membership_tier)}</span>
                        {member.is_banned && <small>{member.banned_reason || '未填写原因'}</small>}
                      </div>
                    </td>
                    <td>{member.share_links?.length || member.shares?.length || 0}</td>
                    <td>{getMemberAssessmentCount(member)}</td>
                    <td>{formatDateTime(member.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-brutal" onClick={() => setSelectedMember(member)}>详情</button>
                        <button className="btn-brutal" onClick={() => openMemberAction('password', member)}>改密码</button>
                        <button className={`btn-brutal ${member.is_banned ? '' : 'danger'}`} onClick={() => openMemberAction(member.is_banned ? 'unban' : 'ban', member)}>{member.is_banned ? '解封' : '封禁'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section-header compact" style={{marginTop:'1.5rem'}}><h3>历史订单</h3><span className="sub">仅兼容旧数据</span></div>
          <div className="brutal-card no-hover" style={{padding:0, overflow:'hidden'}}>
            <table className="brutal-table member-order-table">
              <thead><tr><th>方案</th><th>金额</th><th>状态</th><th>会员</th><th>备注</th><th>时间</th><th>操作</th></tr></thead>
              <tbody>
                {visibleOrders.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center', padding:'2rem', color:'#888'}}>暂无订单</td></tr>
                ) : visibleOrders.map(order => {
                  const member = (members || []).find(item => item.account_id === order.account_id);
                  return (
                    <tr key={order.id}>
                      <td><strong>{getMemberPlanLabel(order.plan_code)}</strong></td>
                      <td>{formatMoney(order.amount_cents, order.currency)}</td>
                      <td><span className={`badge ${order.status === 'pending' ? 'badge-s' : order.status === 'approved' ? 'badge-lgbt' : 'badge-male'}`}>{ORDER_STATUS_LABEL[order.status] || order.status}</span></td>
                      <td>{member?.display_name || order.account_id?.slice(0, 8) || '-'}</td>
                      <td>{order.contact_note || order.admin_note || '-'}</td>
                      <td>{formatDateTime(order.created_at)}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn-brutal" disabled={order.status !== 'pending'} onClick={() => onApproveOrder(order)}>通过</button>
                          <button className="btn-brutal danger" disabled={order.status !== 'pending'} onClick={() => onRejectOrder(order)}>拒绝</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedMember && (
            <MemberDetailModal
              member={selectedMember}
              orders={(orders || []).filter(order => order.account_id === selectedMember.account_id)}
              onViewRecord={onViewDetail}
              onMemberAction={openMemberAction}
              onClose={() => setSelectedMember(null)}
            />
          )}
          {memberAction && (
            <MemberActionDialog
              action={memberAction}
              form={memberActionForm}
              loading={memberActionLoading}
              error={localActionMessage}
              onChange={setMemberActionForm}
              onSubmit={submitMemberAction}
              onClose={closeMemberAction}
            />
          )}
        </>
      )}
    </div>
  );
}

function MemberActionDialog({ action, form, loading, error, onChange, onSubmit, onClose }) {
  const { type, member } = action;
  const title = {
    password: '修改会员密码',
    ban: '封禁会员',
    unban: '解封会员',
    delete: '删除会员'
  }[type] || '会员操作';
  const submitLabel = {
    password: '确认修改',
    ban: '确认封禁',
    unban: '确认解封',
    delete: '确认删除'
  }[type] || '确认';
  const isDanger = type === 'ban' || type === 'delete';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content member-action-modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body member-action-form" onSubmit={onSubmit}>
          <div className="member-action-target">
            <strong>{member.login_name || member.display_name || member.contact_email || '会员用户'}</strong>
            <code>{member.account_id}</code>
          </div>
          {type === 'password' && (
            <>
              <div className="form-group"><label>新密码</label><input type="password" value={form.password} onChange={event => onChange(prev => ({ ...prev, password: event.target.value }))} autoFocus /></div>
              <div className="form-group"><label>确认新密码</label><input type="password" value={form.confirmPassword} onChange={event => onChange(prev => ({ ...prev, confirmPassword: event.target.value }))} /></div>
            </>
          )}
          {(type === 'ban' || type === 'delete') && (
            <div className="form-group">
              <label>{type === 'delete' ? '删除原因' : '封禁原因'}</label>
              <textarea value={form.reason} onChange={event => onChange(prev => ({ ...prev, reason: event.target.value }))} placeholder="仅后台记录，用户不会看到" autoFocus />
            </div>
          )}
          {type === 'delete' && (
            <div className="login-error">删除会员会删除登录账号和会员资料，并停用相关分享链接。该操作不可恢复。</div>
          )}
          {error && <div className="login-error">{error}</div>}
          <div className="row-actions member-action-buttons">
            <button type="button" className="btn-brutal" onClick={onClose} disabled={loading}>取消</button>
            <button type="submit" className={`btn-brutal ${isDanger ? 'danger' : 'primary'}`} disabled={loading}>{loading ? '处理中...' : submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberDetailModal({ member, orders, onViewRecord, onMemberAction, onClose }) {
  const [memberRecords, setMemberRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    setRecordsLoading(true);
    setRecordsError('');
    adminApi.getMemberRecords(member)
      .then(records => {
        if (!cancelled) setMemberRecords(records);
      })
      .catch(error => {
        if (!cancelled) {
          setMemberRecords([]);
          setRecordsError(error.message || '会员测评记录读取失败');
        }
      })
      .finally(() => {
        if (!cancelled) setRecordsLoading(false);
      });
    return () => { cancelled = true; };
  }, [member]);

  if (!member) return null;
  const contactRows = [
    ['邮箱', member.contact_email || '-'],
    ['QQ', member.qq || '-'],
    ['微信', member.wechat || '-'],
    ['电话', member.phone || '-'],
    ['性别', GENDER_LABELS[member.gender_identity] || '不想透露'],
    ['BDSM 倾向', BDSM_ORIENTATION_LABELS[member.bdsm_orientation] || '探索中'],
    ['账号类型', '会员'],
    ['历史订阅', member.subscription?.status || '无'],
    ['注册时间', formatDateTime(member.created_at)],
    ['更新时间', formatDateTime(member.updated_at)]
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content member-detail-modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{member.display_name || '会员用户'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="member-detail-actions">
            <button className="btn-brutal" onClick={() => onMemberAction('password', member)}>修改密码</button>
            <button className={`btn-brutal ${member.is_banned ? '' : 'danger'}`} onClick={() => onMemberAction(member.is_banned ? 'unban' : 'ban', member)}>{member.is_banned ? '解除封禁' : '封禁会员'}</button>
            <button className="btn-brutal danger" onClick={() => onMemberAction('delete', member)}>删除会员</button>
          </div>
          <div className="member-detail-grid">
            {contactRows.map(([label, value]) => (
              <div key={label} className="member-detail-field">
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="section-header compact" style={{marginTop:'1.5rem'}}>
            <h3>技术信息</h3>
          </div>
          <details className="member-technical-details">
            <summary>查看账号技术标识</summary>
            <p>后台保留两类标识：会员账号 ID 用于登录账号和后台操作，旧测评身份 ID 用于关联注册前的游客测评记录。日常管理只需要看上面的会员资料和测评记录。</p>
            <div className="member-id-list">
              <code>会员账号 ID: {member.account_id}</code>
              {member.legacy_user_id_text && <code>旧测评身份 ID: {member.legacy_user_id_text}</code>}
            </div>
          </details>

          <div className="section-header compact" style={{marginTop:'1.5rem'}}>
            <h3>会员测评记录</h3>
            <span className="sub">{recordsLoading ? '读取中' : `${memberRecords.length} 条`}</span>
          </div>
          <table className="brutal-table member-record-table">
            <thead><tr><th>记录ID</th><th>类型</th><th>完成项</th><th>用户</th><th>时间</th><th>操作</th></tr></thead>
            <tbody>
              {recordsLoading ? (
                <tr><td colSpan={6} style={{textAlign:'center', padding:'1.2rem', color:'#888'}}>正在读取测评记录...</td></tr>
              ) : recordsError ? (
                <tr><td colSpan={6} style={{textAlign:'center', padding:'1.2rem', color:'#dc2626'}}>{recordsError}</td></tr>
              ) : memberRecords.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center', padding:'1.2rem', color:'#888'}}>暂无测评记录</td></tr>
              ) : memberRecords.map(record => (
                <tr key={record.id}>
                  <td><code>{record.id}</code></td>
                  <td><span className={`badge ${TEST_BADGE[record.test_type] || ''}`}>{TEST_LABEL[record.test_type] || record.test_type}</span></td>
                  <td>{getAdminRecordCount(record)} 项</td>
                  <td>{record.nickname || record.user_id_text || '匿名用户'}</td>
                  <td>{formatDateTime(record.created_at)}</td>
                  <td><button className="btn-brutal" onClick={() => onViewRecord(record)}>测评详情</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="section-header compact" style={{marginTop:'1.5rem'}}>
            <h3>订单记录</h3>
          </div>
          <table className="brutal-table">
            <thead><tr><th>方案</th><th>状态</th><th>金额</th><th>时间</th></tr></thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={4} style={{textAlign:'center', padding:'1.2rem', color:'#888'}}>暂无订单</td></tr>
              ) : orders.map(order => (
                <tr key={order.id}>
                  <td>{getMemberPlanLabel(order.plan_code)}</td>
                  <td>{ORDER_STATUS_LABEL[order.status] || order.status}</td>
                  <td>{formatMoney(order.amount_cents, order.currency)}</td>
                  <td>{formatDateTime(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===== Security =====
function SecurityView() {
  const [sessions] = useState(() => {
    const admin = adminApi.validateSession();
    if (!admin) return [];
    return [{ user: admin.username, role: admin.role, loginTime: new Date().toLocaleString('zh-CN'), device: navigator.userAgent.includes('Mobile') ? '移动端' : '桌面端', browser: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] || '未知浏览器' }];
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const changePw = async (e) => {
    e.preventDefault(); setPwMsg('');
    if (!pwForm.current) { setPwMsg('❌ 请输入当前密码'); return; }
    if (pwForm.newPw.length < 8) { setPwMsg('❌ 新密码至少8位'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg('❌ 两次密码不一致'); return; }
    setPwLoading(true);
    try {
      const admin = adminApi.validateSession();
      await adminApi.changePassword(admin.username, pwForm.current, pwForm.newPw);
      setPwMsg('✅ 密码修改成功！下次登录请使用新密码。');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) { setPwMsg('❌ ' + err.message); }
    setPwLoading(false);
  };

  const msgStyle = pwMsg.startsWith('✅') ? {bg:'#f0fdf4',border:'#16a34a',color:'#166534'} : pwMsg.startsWith('❌') ? {bg:'#fef2f2',border:'#dc2626',color:'#dc2626'} : {bg:'#fffbeb',border:'#d97706',color:'#92400e'};

  return (
    <div>
      <div className="section-header"><h2>安全管理</h2></div>
      <div className="settings-grid">
        <div className="brutal-card no-hover">
          <h3>🔐 修改密码</h3>
          {pwMsg && <div style={{padding:'0.6rem 1rem', borderRadius:6, marginBottom:'1rem', fontWeight:600, fontSize:'0.9rem', background:msgStyle.bg, border:`2px solid ${msgStyle.border}`, color:msgStyle.color}}>{pwMsg}</div>}
          <form onSubmit={changePw}>
            <div className="form-group"><label>当前密码</label><input type="password" value={pwForm.current} onChange={e => setPwForm({...pwForm, current: e.target.value})} /></div>
            <div className="form-group"><label>新密码</label><input type="password" value={pwForm.newPw} onChange={e => setPwForm({...pwForm, newPw: e.target.value})} /></div>
            <div className="form-group"><label>确认新密码</label><input type="password" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} /></div>
            <button type="submit" className="btn-brutal primary" disabled={pwLoading}>{pwLoading ? '提交中...' : '更新密码'}</button>
          </form>
        </div>
        <div className="brutal-card no-hover">
          <h3>📱 当前会话</h3>
          <table className="brutal-table" style={{marginTop:'0.5rem'}}>
            <thead><tr><th>用户</th><th>角色</th><th>设备</th><th>浏览器</th></tr></thead>
            <tbody>{sessions.map((s, i) => (
              <tr key={i}><td style={{fontWeight:700}}>{s.user}</td><td>{s.role}</td><td>{s.device}</td><td style={{fontSize:'0.8rem'}}>{s.browser}</td></tr>
            ))}</tbody>
          </table>
          <div style={{marginTop:'1.5rem'}}>
            <h3 style={{marginBottom:'0.8rem'}}>🛡️ 安全状态</h3>
            {[
              {text: '✅ 密码通过 Supabase RPC 服务端验证', done: true},
              {text: '✅ 密码使用 bcrypt 哈希存储', done: true},
              {text: '✅ 管理员凭据已从前端代码移除', done: true},
              {text: '⬜ 启用双因素认证 (2FA)', done: false},
              {text: '⬜ 设置会话过期时间', done: false},
            ].map((tip, i) => (
              <div key={i} style={{padding:'0.5rem 0', borderBottom:'1px solid #e5e7eb', fontWeight:600, fontSize:'0.9rem', color: tip.done ? '#16a34a' : '#444'}}>{tip.text}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Settings =====
function SettingsView() {
  const [config, setConfig] = useState({});
  const [configLoading, setConfigLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // 从 Supabase system_settings 表加载配置
  useEffect(() => {
    (async () => {
      try {
        const settings = await adminApi.getSettings();
        setConfig({
          site_title: settings.site_title || 'M-Profile Lab',
          max_login_attempts: settings.max_login_attempts || '5',
          session_timeout: settings.session_timeout || '3600',
          data_retention_days: settings.data_retention_days || '365',
          enable_ip_tracking: settings.enable_ip_tracking || 'true',
          enable_analytics: settings.enable_analytics || 'true'
        });
      } catch (e) { console.error(e); }
      setConfigLoading(false);
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setSaveMsg('');
    try {
      await Promise.all(Object.entries(config).map(([k, v]) => adminApi.saveSetting(k, v)));
      setSaveMsg('✅ 配置已保存到 Supabase');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) { setSaveMsg('❌ ' + err.message); }
    setSaving(false);
  };

  if (configLoading) return <div className="loading">加载配置中...</div>;

  return (
    <div>
      <div className="section-header"><h2>系统设置</h2></div>
      <div className="settings-grid">
        <div className="brutal-card no-hover">
          <h3>⚙️ 站点配置</h3>
          {saveMsg && <div style={{padding:'0.6rem 1rem', borderRadius:6, marginBottom:'1rem', fontWeight:600, fontSize:'0.9rem', background: saveMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: `2px solid ${saveMsg.startsWith('✅') ? '#16a34a' : '#dc2626'}`, color: saveMsg.startsWith('✅') ? '#166534' : '#dc2626'}}>{saveMsg}</div>}
          <form onSubmit={save}>
            <div className="form-group"><label>站点名称</label><input value={config.site_title} onChange={e => setConfig({...config, site_title: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label>最大登录尝试</label><input type="number" value={config.max_login_attempts} onChange={e => setConfig({...config, max_login_attempts: e.target.value})} /></div>
              <div className="form-group"><label>会话超时 (秒)</label><input type="number" value={config.session_timeout} onChange={e => setConfig({...config, session_timeout: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>数据保留 (天)</label><input type="number" value={config.data_retention_days} onChange={e => setConfig({...config, data_retention_days: e.target.value})} /></div>
              <div className="form-group"><label>IP追踪</label>
                <select value={config.enable_ip_tracking} onChange={e => setConfig({...config, enable_ip_tracking: e.target.value})}>
                  <option value="true">启用</option><option value="false">禁用</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>用户行为分析</label>
              <select value={config.enable_analytics} onChange={e => setConfig({...config, enable_analytics: e.target.value})}>
                <option value="true">启用</option><option value="false">禁用</option>
              </select>
            </div>
            <button type="submit" className="btn-brutal primary" disabled={saving}>{saving ? '保存中...' : '保存配置'}</button>
          </form>
        </div>
        <div className="brutal-card no-hover">
          <h3>🔗 快速入口</h3>
          <div style={{display:'grid', gap:'0.8rem', marginTop:'0.5rem'}}>
            {[
              { label: '女M测试', href: '/female.html', accent: '#fce7f3' },
              { label: '男M测试', href: '/male.html', accent: '#dbeafe' },
              { label: 'S型测试', href: '/s.html', accent: '#fef3c7' },
              { label: 'LGBT+测试', href: '/lgbt.html', accent: '#ede9fe' },
              { label: '社区留言板', href: '/message.html', accent: '#f0fdf4' },
              { label: '返回首页', href: '/', accent: '#f8fafc' },
            ].map(link => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="btn-brutal" style={{background: link.accent, textDecoration:'none', justifyContent:'space-between'}}>
                {link.label} <span>↗</span>
              </a>
            ))}
          </div>
          <div style={{marginTop:'1.5rem'}}>
            <h3 style={{marginBottom:'0.5rem'}}>📊 数据管理</h3>
            <p style={{fontSize:'0.85rem', fontWeight:600, color:'#666', marginBottom:'0.8rem'}}>数据导出和清理操作需通过 Supabase 控制台执行。</p>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="btn-brutal" style={{textDecoration:'none'}}>打开 Supabase 控制台 ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Record Detail Modal =====
function DetailModal({ record, details, loading, onClose }) {
  if (!record) return null;
  const grouped = {};
  ['SSS','SS','S','Q','N','W'].forEach(r => { grouped[r] = []; });
  (details || []).forEach(d => { if (d.rating && grouped[d.rating]) grouped[d.rating].push(d); });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><span className={`badge ${TEST_BADGE[record.test_type]||''}`}>{TEST_LABEL[record.test_type]||''}</span> {record.nickname || '匿名用户'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {loading ? <div className="loading">加载详情中...</div> : (
            <>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.8rem', marginBottom:'1.5rem'}}>
                <div className="brutal-card stat-card accent-blue no-hover" style={{padding:'0.8rem'}}><div className="stat-value" style={{fontSize:'1.5rem'}}>{details.length}</div><div className="stat-label">评测项</div></div>
                <div className="brutal-card stat-card accent-green no-hover" style={{padding:'0.8rem'}}><div className="stat-value" style={{fontSize:'1.5rem'}}>{record.user_id_text?.slice(0,8) || '-'}</div><div className="stat-label">用户ID</div></div>
                <div className="brutal-card stat-card accent-amber no-hover" style={{padding:'0.8rem'}}><div className="stat-value" style={{fontSize:'1.5rem'}}>{new Date(record.created_at).toLocaleDateString('zh-CN')}</div><div className="stat-label">日期</div></div>
              </div>
              {['SSS','SS','S','Q','N','W'].filter(r => grouped[r].length > 0).map(rating => (
                <div key={rating} style={{marginBottom:'1rem'}}>
                  <div style={{fontWeight:800, fontSize:'0.9rem', marginBottom:'0.5rem', color: RATING_COLORS[rating]}}>{rating} ({grouped[rating].length})</div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'0.4rem'}}>
                    {grouped[rating].map((d,i) => (
                      <span key={i} style={{padding:'0.2rem 0.6rem', borderRadius:4, fontSize:'0.8rem', fontWeight:600, background:'#f8fafc', border:'1px solid #e2e8f0'}}>{d.item || d.category}</span>
                    ))}
                  </div>
                </div>
              ))}
              {details.length === 0 && <div style={{textAlign:'center', padding:'2rem', color:'#888', fontWeight:600}}>暂无详细评测数据</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Main App =====
function ModernAdminApp() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [memberStats, setMemberStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberOrders, setMemberOrders] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [memberActionMessage, setMemberActionMessage] = useState('');
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(20);
  const [filters, setFilters] = useState({ testType: '' });
  const [detailRecord, setDetailRecord] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const a = adminApi.validateSession();
    setAdmin(a);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!admin) return;
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'records') loadRecords();
    if (tab === 'members') loadMembers();
  }, [admin, tab]);

  const loadDashboard = async () => {
    setStatsLoading(true);
    try {
      const [s, r] = await Promise.all([adminApi.getStats(), adminApi.getRecords({}, 5, 0)]);
      setStats(s); setRecentRecords(r.results);
    } catch (e) { console.error(e); }
    setStatsLoading(false);
  };

  const loadRecords = async (f = filters, p = page, r = rpp) => {
    setRecordsLoading(true);
    try {
      const res = await adminApi.getRecords(f, r, p * r);
      setRecords(res.results); setTotal(res.total);
    } catch (e) { console.error(e); setRecords([]); setTotal(0); }
    setRecordsLoading(false);
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    setMembersError('');
    try {
      const [statsData, membersData, ordersData] = await Promise.all([
        adminApi.getMemberStats(),
        adminApi.getMembers(50, 0),
        adminApi.getMemberOrders(50)
      ]);
      setMemberStats(statsData);
      setMembers(membersData.members);
      setMemberOrders(ordersData);
    } catch (e) {
      console.error(e);
      setMembersError(e.message || '会员管理服务不可用');
      setMemberStats(null);
      setMembers([]);
      setMemberOrders([]);
    }
    setMembersLoading(false);
  };

  const approveOrder = async (order) => {
    setMemberActionMessage('');
    try {
      await adminApi.approveMemberOrder(order);
      setMemberActionMessage('订单已审核通过');
      await loadMembers();
    } catch (e) {
      setMemberActionMessage(e.message || '订单审核失败');
    }
  };

  const rejectOrder = async (order) => {
    setMemberActionMessage('');
    try {
      await adminApi.rejectMemberOrder(order.id);
      setMemberActionMessage('订单已拒绝');
      await loadMembers();
    } catch (e) {
      setMemberActionMessage(e.message || '订单拒绝失败');
    }
  };

  const viewDetail = async (record) => {
    setDetailRecord(record); setDetailLoading(true);
    const d = await adminApi.getRecordDetails(record.id);
    setDetails(d); setDetailLoading(false);
  };

  const onFilterChange = (k, v) => { const f = { ...filters, [k]: v }; setFilters(f); setPage(0); loadRecords(f, 0, rpp); };
  const onPageChange = (p) => { setPage(p); loadRecords(filters, p, rpp); };
  const onRppChange = (r) => { setRpp(r); setPage(0); loadRecords(filters, 0, r); };
  const logout = () => { setAdmin(null); localStorage.removeItem('admin_data'); };

  if (loading) return <div className="admin-app"><div className="loading">初始化中...</div></div>;
  if (!admin) return <LoginPage onLogin={setAdmin} />;

  return (
    <div className="admin-app">
      <nav className="admin-nav">
        <span className="admin-nav-logo">M-Profile Lab</span>
        <div className="admin-nav-tabs">
          {[{id:'dashboard',label:'仪表板'},{id:'records',label:'测评记录'},{id:'members',label:'会员管理'},{id:'security',label:'安全管理'},{id:'settings',label:'系统设置'}].map(t => (
            <button
              key={t.id}
              className={`admin-nav-tab ${tab===t.id?'active':''}`}
              data-admin-tab={t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="admin-nav-right">
          <span className="admin-nav-user">{admin.username}</span>
          <button className="btn-logout" onClick={logout}>登出</button>
        </div>
      </nav>
      <div className="admin-content">
        {tab === 'dashboard' && <DashboardView stats={stats} loading={statsLoading} recentRecords={recentRecords} onViewDetail={viewDetail} onNavigate={setTab} />}
        {tab === 'records' && <RecordsView records={records} loading={recordsLoading} total={total} page={page} rowsPerPage={rpp} filters={filters} onPageChange={onPageChange} onRppChange={onRppChange} onFilterChange={onFilterChange} onRefresh={() => loadRecords(filters, page, rpp)} onViewDetail={viewDetail} />}
        {tab === 'members' && <MembersView stats={memberStats} members={members} orders={memberOrders} loading={membersLoading} error={membersError} actionMessage={memberActionMessage} onRefresh={loadMembers} onApproveOrder={approveOrder} onRejectOrder={rejectOrder} onViewDetail={viewDetail} />}
        {tab === 'security' && <SecurityView />}
        {tab === 'settings' && <SettingsView />}
      </div>
      {detailRecord && <DetailModal record={detailRecord} details={details} loading={detailLoading} onClose={() => setDetailRecord(null)} />}
    </div>
  );
}

// Mount
const root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(<ModernAdminApp />);
export default ModernAdminApp;
