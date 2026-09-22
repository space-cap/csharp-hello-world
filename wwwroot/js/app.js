/**
 * CoreTeam Portal - Frontend Application Logic
 * Integrates directly with C# ASP.NET Core UsersController
 */

(function () {
  'use strict';

  // --- 상태 관리 (State) ---
  const state = {
    users: [],
    filter: 'all', // 'all' | 'active' | 'inactive'
    searchQuery: '',
    deleteTargetId: null
  };

  // --- DOM Elements ---
  const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    serverStatusBadge: document.getElementById('serverStatusBadge'),
    statTotalUsers: document.getElementById('statTotalUsers'),
    statActiveUsers: document.getElementById('statActiveUsers'),
    statInactiveUsers: document.getElementById('statInactiveUsers'),
    statActiveRatio: document.getElementById('statActiveRatio'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    segmentBtns: document.querySelectorAll('.segment-btn'),
    refreshBtn: document.getElementById('refreshBtn'),
    filteredCountBadge: document.getElementById('filteredCountBadge'),
    membersGrid: document.getElementById('membersGrid'),
    emptyState: document.getElementById('emptyState'),
    resetFilterBtn: document.getElementById('resetFilterBtn'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    addModal: document.getElementById('addModal'),
    addMemberForm: document.getElementById('addMemberForm'),
    addName: document.getElementById('addName'),
    addEmail: document.getElementById('addEmail'),
    editModal: document.getElementById('editModal'),
    editMemberForm: document.getElementById('editMemberForm'),
    editUserId: document.getElementById('editUserId'),
    editName: document.getElementById('editName'),
    editEmailDisabled: document.getElementById('editEmailDisabled'),
    editIsActive: document.getElementById('editIsActive'),
    deleteModal: document.getElementById('deleteModal'),
    deleteTargetName: document.getElementById('deleteTargetName'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    toastContainer: document.getElementById('toastContainer')
  };

  // --- 아바타 배경용 그라데이션 팔레트 ---
  const avatarGradients = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #14b8a6 0%, #0284c7 100%)'
  ];

  function getAvatarGradient(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarGradients.length;
    return avatarGradients[index];
  }

  // --- 날짜 포맷팅 함수 ---
  function formatDate(isoString) {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return '오늘 가입';
      if (diffDays === 1) return '어제 가입';
      if (diffDays < 30) return `${diffDays}일 전`;

      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  // --- 토스트 알림 표시 ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconSvg = type === 'success'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toast-out 0.2s forwards';
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  // --- 테마 관리 (Dark/Light) ---
  function initTheme() {
    const saved = localStorage.getItem('coreteam_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    elements.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('coreteam_theme', next);
    });
  }

  // --- C# API 통신 함수들 ---
  async function loadUsers() {
    try {
      elements.refreshBtn.classList.add('loading');
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.users = Array.isArray(data) ? data : (data.value || []);
      updateKPIs();
      renderMembers();
      updateServerStatus(true);
    } catch (err) {
      console.error('사용자 목록 조회 실패:', err);
      updateServerStatus(false);
      showToast('서버와의 통신에 실패했습니다.', 'error');
      elements.membersGrid.innerHTML = `
        <div class="empty-state">
          <h3>데이터를 불러올 수 없습니다</h3>
          <p>C# 백엔드 서버가 실행 중인지 확인해 주세요.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">새로고침</button>
        </div>
      `;
    } finally {
      elements.refreshBtn.classList.remove('loading');
    }
  }

  async function createUser(name, email) {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `오류 발생 (HTTP ${res.status})`);
      }

      showToast(`'${name}' 님이 성공적으로 등록되었습니다!`, 'success');
      closeAllModals();
      elements.addMemberForm.reset();
      await loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function updateUser(id, name, isActive) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, isActive })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `수정 실패 (HTTP ${res.status})`);
      }

      showToast('팀원 정보가 수정되었습니다.', 'success');
      closeAllModals();
      await loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function toggleStatus(id) {
    const user = state.users.find(u => u.id === id);
    if (!user) return;
    const newStatus = !user.isActive;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, isActive: newStatus })
      });

      if (!res.ok) throw new Error('상태 변경 실패');
      user.isActive = newStatus;
      showToast(`'${user.name}' 님의 상태가 ${newStatus ? '활성' : '비활성'}(으)로 변경되었습니다.`, 'success');
      updateKPIs();
      renderMembers();
    } catch (err) {
      showToast('상태 변경 중 오류가 발생했습니다.', 'error');
    }
  }

  async function deleteUser(id) {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');

      showToast('팀원이 삭제되었습니다.', 'success');
      closeAllModals();
      await loadUsers();
    } catch (err) {
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  }

  // --- 서버 연결 상태 표시 ---
  function updateServerStatus(isConnected) {
    if (isConnected) {
      elements.serverStatusBadge.innerHTML = `<span class="status-dot"></span><span class="status-text">서버 연결됨</span>`;
      elements.serverStatusBadge.style.display = 'flex';
    } else {
      elements.serverStatusBadge.innerHTML = `<span class="status-dot" style="background:#ef4444;box-shadow:0 0 8px #ef4444"></span><span class="status-text" style="color:#ef4444">서버 응답 없음</span>`;
    }
  }

  // --- KPI 수치 계산 & 갱신 ---
  function updateKPIs() {
    const total = state.users.length;
    const active = state.users.filter(u => u.isActive).length;
    const inactive = total - active;
    const ratio = total > 0 ? Math.round((active / total) * 100) : 0;

    elements.statTotalUsers.textContent = total;
    elements.statActiveUsers.textContent = active;
    elements.statInactiveUsers.textContent = inactive;
    elements.statActiveRatio.textContent = `${ratio}%`;
  }

  // --- 필터링 및 카드 렌더링 ---
  function getFilteredUsers() {
    let list = state.users;

    // 탭 필터 적용
    if (state.filter === 'active') {
      list = list.filter(u => u.isActive);
    } else if (state.filter === 'inactive') {
      list = list.filter(u => !u.isActive);
    }

    // 검색어 필터 적용
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    return list;
  }

  function renderMembers() {
    const filtered = getFilteredUsers();
    elements.filteredCountBadge.textContent = filtered.length;

    if (filtered.length === 0) {
      elements.membersGrid.innerHTML = '';
      elements.emptyState.classList.remove('hidden');
      return;
    }

    elements.emptyState.classList.add('hidden');

    elements.membersGrid.innerHTML = filtered.map(user => {
      const initial = user.name ? user.name.trim().charAt(0) : '?';
      const gradient = getAvatarGradient(user.name || '');
      const statusClass = user.isActive ? 'pill-active' : 'pill-inactive';
      const statusText = user.isActive ? '활성 (Active)' : '비활성 (Inactive)';
      const toggleActionText = user.isActive ? '비활성화' : '활성화';

      return `
        <article class="member-card" data-user-id="${user.id}">
          <div class="member-card-top">
            <div class="member-avatar" style="background: ${gradient};">
              ${escapeHtml(initial)}
            </div>
            <div class="member-details">
              <div class="member-name-row">
                <h3 class="member-name" title="${escapeHtml(user.name)}">${escapeHtml(user.name)}</h3>
                <span class="member-status-pill ${statusClass}">
                  ${statusText}
                </span>
              </div>
              <p class="member-email" title="${escapeHtml(user.email)}">${escapeHtml(user.email)}</p>
            </div>
          </div>

          <div class="member-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>가입: ${formatDate(user.createdAt)}</span>
          </div>

          <div class="member-card-actions">
            <button class="btn-card-action" data-action="toggle" data-id="${user.id}" title="${toggleActionText}">
              ${user.isActive ? '비활성화' : '활성화'}
            </button>
            <button class="btn-card-action" data-action="edit" data-id="${user.id}" title="정보 수정">
              수정
            </button>
            <button class="btn-card-action btn-card-danger" data-action="delete" data-id="${user.id}" data-name="${escapeHtml(user.name)}" title="삭제">
              삭제
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- 모달 헬퍼 ---
  function openModal(modal) {
    modal.classList.remove('hidden');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    state.deleteTargetId = null;
  }

  // --- 이벤트 리스너 바인딩 ---
  function initEventListeners() {
    // 검색창 입력 이벤트
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      elements.clearSearchBtn.classList.toggle('hidden', state.searchQuery.length === 0);
      renderMembers();
    });

    // 검색어 지우기
    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      renderMembers();
      elements.searchInput.focus();
    });

    // 세그먼트 필터 버튼 (전체 / 활성 / 비활성)
    elements.segmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.segmentBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filter = btn.dataset.filter;
        renderMembers();
      });
    });

    // 필터 초기화 버튼
    elements.resetFilterBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      elements.segmentBtns.forEach(b => b.classList.remove('active'));
      elements.segmentBtns[0].classList.add('active');
      state.filter = 'all';
      renderMembers();
    });

    // 새로고침 버튼
    elements.refreshBtn.addEventListener('click', () => {
      loadUsers();
    });

    // 새 멤버 등록 모달 열기
    elements.openAddModalBtn.addEventListener('click', () => {
      elements.addMemberForm.reset();
      openModal(elements.addModal);
      setTimeout(() => elements.addName.focus(), 50);
    });

    // 새 멤버 등록 폼 제출
    elements.addMemberForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = elements.addName.value.trim();
      const email = elements.addEmail.value.trim();
      if (!name || !email) return;
      createUser(name, email);
    });

    // 멤버 수정 폼 제출
    elements.editMemberForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = parseInt(elements.editUserId.value, 10);
      const name = elements.editName.value.trim();
      const isActive = elements.editIsActive.checked;
      if (!name) return;
      updateUser(id, name, isActive);
    });

    // 멤버 삭제 확인 버튼
    elements.confirmDeleteBtn.addEventListener('click', () => {
      if (state.deleteTargetId) {
        deleteUser(state.deleteTargetId);
      }
    });

    // 카드 영역 클릭 이벤트 (이벤트 위임)
    elements.membersGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = parseInt(btn.dataset.id, 10);

      if (action === 'toggle') {
        toggleStatus(id);
      } else if (action === 'edit') {
        const user = state.users.find(u => u.id === id);
        if (!user) return;
        elements.editUserId.value = user.id;
        elements.editName.value = user.name;
        elements.editEmailDisabled.value = user.email;
        elements.editIsActive.checked = user.isActive;
        openModal(elements.editModal);
      } else if (action === 'delete') {
        const name = btn.dataset.name || '팀원';
        state.deleteTargetId = id;
        elements.deleteTargetName.textContent = name;
        openModal(elements.deleteModal);
      }
    });

    // 모달 닫기 버튼들 및 백드롭 클릭
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllModals();
      });
    });

    // ESC 키 누르면 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });
  }

  // --- 앱 초기화 ---
  function init() {
    initTheme();
    initEventListeners();
    loadUsers();
  }

  // DOM 로드 완료 시 구동
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
