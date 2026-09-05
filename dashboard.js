/**
 * 校园招聘助手系统 - 核心业务逻辑
 * 支持投递追踪、可视化简历库编辑、数据安全与离线 OCR 识别
 */

(() => {
  'use strict';

  // ================= 常量定义 =================
  const STAGES = ['待投递', '已投递', '笔试', '一面', '二面', 'HR面', 'Offer', '已结束'];
  const RECORDS_STORAGE_KEY = 'autumnRecruitmentTracker.records.v1';
  const RESUME_STORAGE_KEY = 'autumnRecruitmentTracker.resume.v1';
  const SAFETY_DB_NAME = 'autumnRecruitmentTracker.safety.v1';
  const APP_VERSION = '2.0.0';

  // 默认示例简历种子
  const DEFAULT_RESUME = {
    "基本信息": [
      ["姓名", "李明"],
      ["性别", "男"],
      ["出生年月", "1999-06"],
      ["政治面貌", "共青团员"],
      ["籍贯", "山东省济南市"],
      ["紧急联系人", "李华 (父子 13900139000)"],
      ["自我评价", "具备扎实的AI技术认知与产品化落地经验，深度理解大语言模型、多智能体交互机制。自驱力强，跨部门沟通流畅，多次主导高校与工业级产学研项目。"]
    ],
    "其他信息": [
      ["身份证", "110101199801011234"],
      ["手机", "13800138000"],
      ["邮箱", "job_hunter@example.com"],
      ["微信号", "wechat_demo"],
      ["现居地", "北京市海淀区"],
      ["求职意向", "AI产品经理 / 算法工程师"]
    ],
    "教育经历": [
      {
        "_rowName": "硕士",
        "学校": "浙江大学",
        "学院": "计算机科学与技术学院",
        "专业": "人工智能",
        "学历": "硕士研究生",
        "开始时间": "2023-09",
        "结束时间": "2026-06",
        "导师": "张教授",
        "专业排名": "前 5%"
      },
      {
        "_rowName": "本科",
        "学校": "华东理工大学",
        "学院": "信息科学与工程学院",
        "专业": "软件工程",
        "学历": "本科",
        "开始时间": "2019-09",
        "结束时间": "2023-06",
        "GPA": "3.85 / 4.0",
        "荣誉": "国家励志奖学金、校优秀毕业生"
      }
    ],
    "实习经历": [
      {
        "_rowName": "字节跳动",
        "单位": "北京字节跳动科技有限公司",
        "部门": "商业化产品部",
        "岗位": "AI产品经理实习生",
        "开始": "2025-06",
        "结束": "至今",
        "证明人": "王主管",
        "证明人电话": "139XXXXXXXX",
        "岗位职责": "1. 主导智能广告生成 Agent 方案设计，构建提示词工程与评估指标集；\n2. 协同算法团队完成模型微调与端到端延迟优化，CTR 提升 12.4%；\n3. 撰写多份高保真 PRD 与交互原型，推动敏捷迭代上线。",
        "实习收获": "1. 深入理解商业化广告的业务逻辑与数据驱动决策方法；\n2. 系统掌握大模型产品化落地的全流程，从 Prompt 工程到模型评估；\n3. 提升了跨部门（算法/工程/运营）协同沟通能力。"
      }
    ],
    "校园经历": [
      {
        "_rowName": "学生会",
        "组织": "浙江大学计算机学院学生会",
        "职务": "部长",
        "开始": "2024-09",
        "结束": "2025-06",
        "主要工作": "1. 统筹举办学院科技文化节，覆盖 500+ 人次；\n2. 组织策划校企合作技术沙龙 8 场，对接字节跳动、阿里等企业。"
      }
    ],
    "项目经历": [
      {
        "_rowName": "Multi-Agent 仿真系统",
        "项目名称": "基于大模型多智能体的自动化仿真与决策工作流平台",
        "角色": "核心负责人",
        "开始": "2024-09",
        "结束": "2025-05",
        "主要工作": "1. 设计认知层-技能层解耦架构，结合拓扑校验与动态 Prompt 编排实现手绘草图到工业仿真的端到端闭环；\n2. 提出基于质心的空间推理机制，弥合自然语言与抽象边界条件之间的语义差距；\n3. 投稿 SCI/EI 顶级期刊一篇 (Under Review)。",
        "技术栈": "Python, LLM Agent, LangChain, Vue.js, FastAPI"
      }
    ],
    "奖励荣誉": [
      {
        "_rowName": "国家奖学金",
        "获奖年月": "2024-10",
        "荣誉名称": "国家奖学金",
        "奖励级别": "国家级",
        "说明": "综合成绩排名专业前1%，获教育部颁发国家奖学金"
      },
      {
        "_rowName": "优秀毕业生",
        "获奖年月": "2023-06",
        "荣誉名称": "校优秀毕业生",
        "奖励级别": "校级",
        "说明": "本科期间综合表现优异，获评校级优秀毕业生荣誉称号"
      }
    ],
    "家庭成员": [
      {
        "_rowName": "父亲",
        "姓名": "李建国",
        "与本人关系": "父子",
        "出生年月": "1972-03",
        "工作单位": "中国铁路济南局集团有限公司",
        "职务": "高级工程师"
      },
      {
        "_rowName": "母亲",
        "姓名": "王秀英",
        "与本人关系": "母子",
        "出生年月": "1973-08",
        "工作单位": "山东省济南市第一中学",
        "职务": "英语教师"
      }
    ],
    "技能证书": [
      ["英语水平", "CET-6 (598分) / 英语流利"],
      ["专业技能", "Python, SQL, Figma, Axure, Prompt Engineering, Agent Architecture"],
      ["学术竞赛", "全国大学生数学建模竞赛一等奖、互联网+大学生创新创业大赛银奖"]
    ],
    "_sectionOrder": ["基本信息", "其他信息", "教育经历", "实习经历", "校园经历", "项目经历", "奖励荣誉", "家庭成员", "技能证书"]
  };

  // 默认示例投递记录
  function getExampleRecords() {
    const now = Date.now();
    return [
      { id: cryptoId(), company: '腾讯科技', position: 'AI产品经理校招生', city: '深圳', applicationDate: new Date(now - 86400000 * 3).toISOString().slice(0, 10), stage: '一面', applicationUrl: 'https://careers.tencent.com', scheduleAt: new Date(now + 86400000 * 2).toISOString().slice(0, 16), recentSchedule: '腾讯会议专业面', nextAction: '复盘 Agent 架构项目经历，准备 3 分钟自我介绍', updatedAt: now - 3000 },
      { id: cryptoId(), company: '字节跳动', position: '大模型应用产品经理', city: '北京', applicationDate: new Date(now - 86400000 * 8).toISOString().slice(0, 10), stage: '笔试', applicationUrl: 'https://jobs.bytedance.com', scheduleAt: new Date(now + 86400000 * 1).toISOString().slice(0, 16), recentSchedule: '在线专业笔试', nextAction: '复习产品分析案例与行测', updatedAt: now - 6000 },
      { id: cryptoId(), company: '阿里巴巴', position: '算法工程师 (NLP/Agent)', city: '杭州', applicationDate: new Date(now - 86400000 * 12).toISOString().slice(0, 10), stage: '二面', applicationUrl: 'https://talent.alibaba.com', scheduleAt: new Date(now + 86400000 * 4).toISOString().slice(0, 16), recentSchedule: '总监业务面', nextAction: '深入准备多物理场仿真论文讲解', updatedAt: now - 10000 },
      { id: cryptoId(), company: '美团', position: '商业化产品经理', city: '北京', applicationDate: new Date(now - 86400000 * 20).toISOString().slice(0, 10), stage: 'Offer', applicationUrl: 'https://zhaopin.meituan.com', scheduleAt: '', recentSchedule: '已发放录用意向书', nextAction: '确认薪资与入职时间', updatedAt: now - 15000 }
    ];
  }

  // ================= 全局状态 =================
  let records = [];
  let currentResume = DEFAULT_RESUME;
  let resumeSectionOrder = Object.keys(DEFAULT_RESUME);
  let editingRecordId = null;
  let ocrWorker = null;
  let ocrFile = null;
  let safetyDbPromise = null;

  // ================= 辅助函数 =================
  function $(selector) { return document.querySelector(selector); }
  function $$(selector) { return document.querySelectorAll(selector); }

  function cryptoId() {
    return (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showToast(msg) {
    const toast = $('#globalToast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ================= 统一存储适配层 =================
  async function storageGet(key) {
    // 优先读取 localStorage，因为 storageSet 总是先写 localStorage，
    // 确保读到的一定是最新数据，避免 chrome.storage.local 有旧数据时返回旧值
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.warn('localStorage 解析失败，尝试 chrome.storage', e);
      }
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        const res = await chrome.storage.local.get([key]);
        if (res[key] !== undefined) return res[key];
      } catch (e) {
        console.warn('chrome.storage.local 读取失败', e);
      }
    }
    return null;
  }

  async function storageSet(key, value) {
    const json = JSON.stringify(value);
    localStorage.setItem(key, json);
    // 同步写 chrome.storage.local，供 content.js 跨上下文读取
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        await chrome.storage.local.set({ [key]: value });
        console.log('[storageSet] chrome.storage.local 写入成功，key:', key);
      } catch (e) {
        console.warn('chrome.storage.local 写入失败，已使用 localStorage 兜底', e);
      }
    }
  }

  // ================= IndexedDB 快照恢复系统 =================
  function openSafetyDb() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('当前浏览器不支持快照'));
    if (safetyDbPromise) return safetyDbPromise;
    safetyDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(SAFETY_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('无法打开快照存储'));
    });
    return safetyDbPromise;
  }

  async function saveSnapshot(recordsData, resumeData) {
    try {
      const db = await openSafetyDb();
      const snapshot = {
        savedAt: new Date().toISOString(),
        records: recordsData,
        resume: resumeData
      };
      const key = `${snapshot.savedAt}-${cryptoId()}`;
      await new Promise((resolve, reject) => {
        const tx = db.transaction('snapshots', 'readwrite');
        tx.objectStore('snapshots').put(snapshot, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      updateSnapshotCount();
    } catch (e) {
      console.warn('快照保存失败', e);
    }
  }

  async function updateSnapshotCount() {
    try {
      const db = await openSafetyDb();
      const count = await new Promise((resolve, reject) => {
        const tx = db.transaction('snapshots', 'readonly');
        const req = tx.objectStore('snapshots').count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      $('#snapshotCountText').textContent = `已自动保留 ${count} 个历史快照`;
    } catch (e) {
      $('#snapshotCountText').textContent = '未开启快照';
    }
  }

  // ================= 选项卡切换逻辑 =================
  const tabs = {
    'records-tab': { kicker: 'JOB TRACKING', title: '投递追踪', subtitle: '全面监控网申进度、面试安排与全链路阶段流转', showActions: true },
    'resume-tab': { kicker: 'MY RESUME', title: '我的简历', subtitle: '集中维护个人信息与多段经历，实时同步至网页端快速填报', showActions: false },
    'safety-tab': { kicker: 'LOCAL DATA & PRIVACY', title: '数据安全与备份', subtitle: '100% 浏览器本地存储保护，支持备份导出与快照回滚', showActions: false }
  };

  function switchTab(tabId) {
    $$('.sidebar-nav .nav-item').forEach(item => {
      if (item.getAttribute('data-tab') === tabId) item.classList.add('is-active');
      else item.classList.remove('is-active');
    });

    $$('.tab-content').forEach(content => {
      if (content.id === tabId) content.classList.add('is-active');
      else content.classList.remove('is-active');
    });

    const info = tabs[tabId];
    if (info) {
      $('#tabKicker').textContent = info.kicker;
      $('#tabTitle').textContent = info.title;
      $('#tabSubtitle').textContent = info.subtitle;
      $('#topActionsContainer').style.display = info.showActions ? 'flex' : 'none';
    }
  }

  $$('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-tab');
      switchTab(target);
    });
  });

  // 处理 URL Hash
  function handleUrlHash() {
    const hash = location.hash;
    if (hash === '#resume') switchTab('resume-tab');
    else if (hash === '#safety') switchTab('safety-tab');
    else switchTab('records-tab');
  }
  window.addEventListener('hashchange', handleUrlHash);

  // ================= TAB 1: 投递追踪核心逻辑 =================
  async function loadRecords() {
    const saved = await storageGet(RECORDS_STORAGE_KEY);
    // 只要本地已存在存储（即使是删除后的空数组 []），均直接读取，不再自动生成示例数据
    if (Array.isArray(saved)) {
      records = saved;
    } else {
      // 仅在首次全新安装/初始化（null 或 undefined）时载入初始示例
      records = getExampleRecords();
      await storageSet(RECORDS_STORAGE_KEY, records);
    }
    renderRecords();
  }

  async function saveRecords(msg) {
    await storageSet(RECORDS_STORAGE_KEY, records);
    saveSnapshot(records, currentResume);
    renderRecords();
    if (msg) showToast(msg);
  }

  function renderRecords() {
    const searchVal = $('#searchInput').value.trim().toLowerCase();
    const stageVal = $('#stageFilter').value;
    const sortVal = $('#sortSelect').value;

    // 过滤
    let filtered = records.filter(r => {
      if (stageVal && r.stage !== stageVal) return false;
      if (searchVal) {
        const text = `${r.company} ${r.position} ${r.city} ${r.nextAction} ${r.recentSchedule}`.toLowerCase();
        if (!text.includes(searchVal)) return false;
      }
      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      if (sortVal === 'updatedAt_desc') return (b.updatedAt || 0) - (a.updatedAt || 0);
      if (sortVal === 'applicationDate_desc') return (b.applicationDate || '').localeCompare(a.applicationDate || '');
      if (sortVal === 'applicationDate_asc') return (a.applicationDate || '').localeCompare(b.applicationDate || '');
      if (sortVal === 'company_asc') return (a.company || '').localeCompare(b.company || '', 'zh-Hans-CN');
      return 0;
    });

    // 渲染统计指标
    $('#totalCount').textContent = records.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    $('#todayCount').textContent = records.filter(r => (r.applicationDate === todayStr || (r.updatedAt && new Date(r.updatedAt).toISOString().slice(0,10) === todayStr))).length;
    $('#activeCount').textContent = records.filter(r => !['Offer', '已结束', '待投递'].includes(r.stage)).length;
    $('#weekCount').textContent = records.filter(r => r.scheduleAt && new Date(r.scheduleAt) >= new Date()).length;
    $('#offerCount').textContent = records.filter(r => r.stage === 'Offer').length;

    // 渲染阶段漏斗
    const pipelineEl = $('#stagePipeline');
    pipelineEl.innerHTML = STAGES.map(stage => {
      const count = records.filter(r => r.stage === stage).length;
      const isSelected = stageVal === stage ? 'is-selected' : '';
      return `
        <div class="stage-pill ${isSelected}" data-stage="${stage}">
          <span class="stage-pill-title">${stage}</span>
          <span class="stage-pill-val">${count}</span>
        </div>
      `;
    }).join('');

    // 绑定漏斗点击筛选
    pipelineEl.querySelectorAll('.stage-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const s = pill.getAttribute('data-stage');
        $('#stageFilter').value = ($('#stageFilter').value === s) ? '' : s;
        renderRecords();
      });
    });

    // 渲染表格内容
    const tbody = $('#recordsTbody');
    const emptyEl = $('#recordsEmptyState');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
      tbody.innerHTML = filtered.map(r => {
        const url = r.applicationUrl || r.url || '';
        const hasUrl = /^https?:\/\//i.test(url);
        const compHtml = hasUrl
          ? `<a class="comp-name comp-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="点击跳转至网申/招聘原链接: ${escapeHtml(url)}">${escapeHtml(r.company)} <span class="link-icon" aria-hidden="true">↗</span></a>`
          : `<span class="comp-name">${escapeHtml(r.company)}</span>`;

        return `
        <tr>
          <td>
            <div class="comp-cell">
              ${compHtml}
              <span class="comp-pos">${escapeHtml(r.position)}</span>
            </div>
          </td>
          <td class="col-nowrap">${escapeHtml(r.city || '-')}</td>
          <td>${r.applicationDate || '-'}</td>
          <td class="col-nowrap">
            <span class="stage-tag stage-${r.stage}">${r.stage}</span>
          </td>
          <td>
            <div>${escapeHtml(r.recentSchedule || '-')}</div>
            ${r.nextAction ? `<div style="font-size:11px;color:var(--muted)">👉 ${escapeHtml(r.nextAction)}</div>` : ''}
          </td>
          <td class="text-right col-nowrap">
            <div class="table-actions">
              <button class="btn-sm btn-advance" data-id="${r.id}" title="推进到下一阶段">推进</button>
              <button class="btn-sm btn-edit" data-id="${r.id}">编辑</button>
              <button class="btn-sm btn-danger btn-del" data-id="${r.id}">删除</button>
            </div>
          </td>
        </tr>
      `;
      }).join('');
    }

    // 渲染右侧近期待办列表
    renderUpcoming();
  }

  function renderUpcoming() {
    const listEl = $('#upcomingList');
    const upcoming = records
      .filter(r => r.scheduleAt && new Date(r.scheduleAt) >= new Date(Date.now() - 86400000))
      .sort((a, b) => new Date(a.scheduleAt) - new Date(b.scheduleAt));

    if (upcoming.length === 0) {
      listEl.innerHTML = `<p style="font-size:12px;color:var(--muted);text-align:center;padding:12px 0;">近期暂无日程安排</p>`;
      return;
    }

    listEl.innerHTML = upcoming.slice(0, 5).map(r => {
      const url = r.applicationUrl || r.url || '';
      const hasUrl = /^https?:\/\//i.test(url);
      const titleHtml = hasUrl
        ? `<a class="schedule-item-title comp-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="点击跳转至网申/招聘原链接: ${escapeHtml(url)}">${escapeHtml(r.company)} · ${escapeHtml(r.recentSchedule || '日程')} <span class="link-icon" aria-hidden="true">↗</span></a>`
        : `<span class="schedule-item-title">${escapeHtml(r.company)} · ${escapeHtml(r.recentSchedule || '日程')}</span>`;

      return `
      <div class="schedule-item">
        <span class="schedule-item-time">${r.scheduleAt.replace('T', ' ')}</span>
        ${titleHtml}
        ${r.nextAction ? `<span class="schedule-item-desc">${escapeHtml(r.nextAction)}</span>` : ''}
      </div>
    `;
    }).join('');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 搜索与过滤事件绑定
  $('#searchInput').addEventListener('input', renderRecords);
  $('#stageFilter').addEventListener('change', renderRecords);
  $('#sortSelect').addEventListener('change', renderRecords);

  // 表格操作委托
  $('#recordsTbody').addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-id');
    if (!id) return;

    if (e.target.classList.contains('btn-advance')) {
      advanceStage(id);
    } else if (e.target.classList.contains('btn-edit')) {
      openEditModal(id);
    } else if (e.target.classList.contains('btn-del')) {
      deleteRecord(id);
    }
  });

  function advanceStage(id) {
    const record = records.find(r => r.id === id);
    if (!record) return;
    const curIdx = STAGES.indexOf(record.stage);
    if (curIdx >= 0 && curIdx < STAGES.length - 1) {
      record.stage = STAGES[curIdx + 1];
      record.updatedAt = Date.now();
      saveRecords(`🚀 ${record.company} 阶段已推进至「${record.stage}」`);
    }
  }

  function deleteRecord(id) {
    const record = records.find(r => r.id === id);
    if (!record) return;
    if (confirm(`确定要删除 ${record.company} - ${record.position} 的投递记录吗？`)) {
      records = records.filter(r => r.id !== id);
      saveRecords('已删除投递记录');
    }
  }

  // ================= 投递记录表单弹窗 =================
  const recordModal = $('#recordModal');
  $('#addRecordBtn').addEventListener('click', () => {
    editingRecordId = null;
    $('#modalTitle').textContent = '新增投递记录';
    $('#editRecordId').value = '';
    $('#m-company').value = '';
    $('#m-position').value = '';
    $('#m-city').value = '';
    $('#m-date').value = new Date().toISOString().slice(0, 10);
    $('#m-stage').value = '已投递';
    $('#m-url').value = '';
    $('#m-scheduleAt').value = '';
    $('#m-recentSchedule').value = '';
    $('#m-nextAction').value = '';
    recordModal.showModal();
  });

  function openEditModal(id) {
    const record = records.find(r => r.id === id);
    if (!record) return;
    editingRecordId = id;
    $('#modalTitle').textContent = '编辑投递记录';
    $('#editRecordId').value = id;
    $('#m-company').value = record.company || '';
    $('#m-position').value = record.position || '';
    $('#m-city').value = record.city || '';
    $('#m-date').value = record.applicationDate || '';
    $('#m-stage').value = record.stage || '已投递';
    $('#m-url').value = record.applicationUrl || '';
    $('#m-scheduleAt').value = record.scheduleAt || '';
    $('#m-recentSchedule').value = record.recentSchedule || '';
    $('#m-nextAction').value = record.nextAction || '';
    recordModal.showModal();
  }

  $('#closeModalBtn').addEventListener('click', () => recordModal.close());
  $('#cancelModalBtn').addEventListener('click', () => recordModal.close());

  $('#recordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      company: $('#m-company').value.trim(),
      position: $('#m-position').value.trim(),
      city: $('#m-city').value.trim(),
      applicationDate: $('#m-date').value,
      stage: $('#m-stage').value,
      applicationUrl: $('#m-url').value.trim(),
      scheduleAt: $('#m-scheduleAt').value,
      recentSchedule: $('#m-recentSchedule').value.trim(),
      nextAction: $('#m-nextAction').value.trim(),
      updatedAt: Date.now()
    };

    if (editingRecordId) {
      const idx = records.findIndex(r => r.id === editingRecordId);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...data };
      }
    } else {
      records.unshift({ id: cryptoId(), ...data });
    }

    recordModal.close();
    saveRecords(editingRecordId ? '记录修改成功' : '新增记录成功');
  });

  // ================= TAB 2: 简历资料库管理核心逻辑 =================
  const KV_SECTIONS = ['基本信息', '其他信息', '技能证书'];

  function migrateKvToArray(resume) {
    if (!resume || typeof resume !== 'object') return resume;
    let migrated = false;
    KV_SECTIONS.forEach(sec => {
      if (resume[sec] && !Array.isArray(resume[sec]) && typeof resume[sec] === 'object') {
        resume[sec] = Object.entries(resume[sec]).map(([k, v]) => [k, v]);
        migrated = true;
      }
    });
    return migrated;
  }

  async function loadResume() {
    console.log('[loadResume] 开始加载简历数据...');
    const saved = await storageGet(RESUME_STORAGE_KEY);
    if (saved && typeof saved === 'object') {
      currentResume = saved;
      console.log('[loadResume] 加载成功，模块顺序:', Object.keys(currentResume).join(' → '));
      if (migrateKvToArray(currentResume)) {
        await storageSet(RESUME_STORAGE_KEY, currentResume);
      }
    } else {
      currentResume = DEFAULT_RESUME;
      console.log('[loadResume] 无保存数据，使用默认简历');
      await storageSet(RESUME_STORAGE_KEY, currentResume);
    }

    if (currentResume._sectionOrder && Array.isArray(currentResume._sectionOrder)) {
      resumeSectionOrder = currentResume._sectionOrder;
      console.log('[loadResume] 从数据中加载 _sectionOrder:', resumeSectionOrder.join(' → '));
    } else {
      resumeSectionOrder = Object.keys(currentResume).filter(k => k !== '_sectionOrder');
      console.log('[loadResume] 无 _sectionOrder，按对象键顺序');
    }

    renderResumeEditor();
    console.log('[loadResume] 渲染完成，当前 DOM 模块顺序:',
      Array.from($$('.resume-editor-grid .editor-card')).map(c => c.id).join(' → '));
  }

  function kvEntries(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return Object.entries(data);
    return [];
  }

  function renderResumeEditor() {
    // 渲染 KV 区域
    KV_SECTIONS.forEach(sec => {
      const container = $(`#kv-${sec}`);
      if (!container) return;
      const entries = kvEntries(currentResume[sec]);
      container.innerHTML = entries.map(([k, v]) => `
        <div class="kv-row" data-section="${sec}">
          <span class="drag-handle" title="拖动排序" draggable="true"></span>
          <input type="text" class="kv-key" value="${escapeHtml(k)}" placeholder="字段名称">
          <input type="text" class="kv-val" value="${escapeHtml(v)}" placeholder="内容值">
          <button type="button" class="kv-del-btn" data-action="del-kv" title="删除字段">✕</button>
        </div>
      `).join('');
    });

    // 渲染经历列表
    ['教育经历', '实习经历', '校园经历', '项目经历', '奖励荣誉', '家庭成员'].forEach(sec => {
      const container = $(`#exp-${sec}`);
      if (!container) return;
      const list = Array.isArray(currentResume[sec]) ? currentResume[sec] : [];
      container.innerHTML = list.map((item, idx) => `
        <div class="exp-item-card" data-section="${sec}" data-index="${idx}">
          <div class="exp-item-header">
            <span class="drag-handle" title="拖动排序" draggable="true"></span>
            <h4>#${idx + 1} ${escapeHtml(item._rowName || '经历')}</h4>
            <div>
              <button type="button" class="btn-sm btn-danger" data-action="del-exp">删除此条</button>
            </div>
          </div>
          <div class="exp-fields-grid">
            <div class="form-item">
              <label>经历标签</label>
              <input type="text" class="exp-field" data-key="_rowName" value="${escapeHtml(item._rowName || '')}" placeholder="例如：硕士 / 腾讯">
            </div>
            ${Object.entries(item).filter(([k]) => k !== '_rowName').map(([k, v]) => {
              const isLongText = ['主要工作', '岗位职责', '实习收获', '自我评价', '项目职责', '说明'].includes(k);
              return `
                <div class="form-item ${isLongText ? 'full-w' : ''}">
                  <label>${escapeHtml(k)}</label>
                  ${isLongText 
                    ? `<textarea class="exp-field" data-key="${escapeHtml(k)}" rows="4">${escapeHtml(v)}</textarea>`
                    : `<input type="text" class="exp-field" data-key="${escapeHtml(k)}" value="${escapeHtml(v)}">`
                  }
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('');
    });

    // 按 currentResume 的键顺序重排 DOM 中的模块卡片
    const grid = $('.resume-editor-grid');
    if (!grid) return;
    const cardMap = {};
    grid.querySelectorAll('.editor-card').forEach(card => {
      const kv = card.querySelector('[id^="kv-"]');
      const exp = card.querySelector('[id^="exp-"]');
      if (kv) cardMap[kv.id.replace('kv-', '')] = card;
      if (exp) cardMap[exp.id.replace('exp-', '')] = card;
    });
    console.log('[renderResumeEditor] 按 resumeSectionOrder 重排模块, 目标顺序:', resumeSectionOrder.join(' → '));
    resumeSectionOrder.forEach(sec => {
      const card = cardMap[sec];
      if (card) {
        grid.appendChild(card);
      } else {
        console.warn('[renderResumeEditor] 未找到模块卡片:', sec);
      }
    });
    console.log('[renderResumeEditor] 重排后 DOM 顺序:',
      Array.from(grid.querySelectorAll('.editor-card')).map(c => c.id).join(' → '));
  }

  // 添加 KV 字段函数
  function addKvField(sec) {
    const container = $(`#kv-${sec}`);
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'kv-row';
    row.setAttribute('data-section', sec);
    row.innerHTML = `
      <span class="drag-handle" title="拖动排序" draggable="true"></span>
      <input type="text" class="kv-key" placeholder="新字段名称">
      <input type="text" class="kv-val" placeholder="内容值">
      <button type="button" class="kv-del-btn" data-action="del-kv" title="删除字段">✕</button>
    `;
    container.appendChild(row);
    const keyInput = row.querySelector('.kv-key');
    if (keyInput) keyInput.focus();
  }

  // 添加经历行卡片函数
  function addExperienceRow(sec) {
    const container = $(`#exp-${sec}`);
    if (!container) return;
    const card = document.createElement('div');
    card.className = 'exp-item-card';
    card.setAttribute('data-section', sec);

    let defaultFields = [];
    if (sec === '教育经历') {
      defaultFields = [
        { k: '_rowName', label: '经历标签', val: '本/硕' },
        { k: '学校', label: '学校', val: '' },
        { k: '学院', label: '学院', val: '' },
        { k: '专业', label: '专业', val: '' },
        { k: '学历', label: '学历', val: '本科/硕士' },
        { k: '开始时间', label: '开始时间', val: '2023-09' },
        { k: '结束时间', label: '结束时间', val: '2026-06' }
      ];
    } else if (sec === '实习经历') {
      defaultFields = [
        { k: '_rowName', label: '经历标签', val: '实习单位简写' },
        { k: '单位', label: '单位全称', val: '' },
        { k: '部门', label: '部门', val: '' },
        { k: '岗位', label: '岗位名称', val: '' },
        { k: '开始', label: '开始时间', val: '2025-06' },
        { k: '结束', label: '结束时间', val: '至今' },
        { k: '证明人', label: '证明人', val: '' },
        { k: '证明人电话', label: '证明人电话', val: '' },
        { k: '岗位职责', label: '岗位职责 (长文本)', val: '', isTextarea: true },
        { k: '实习收获', label: '实习收获 (长文本)', val: '', isTextarea: true }
      ];
    } else if (sec === '校园经历') {
      defaultFields = [
        { k: '_rowName', label: '经历标签', val: '校园经历简称' },
        { k: '组织', label: '组织/社团全称', val: '' },
        { k: '职务', label: '担任职务', val: '部长/主席/干事' },
        { k: '开始', label: '开始时间', val: '2024-09' },
        { k: '结束', label: '结束时间', val: '2025-06' },
        { k: '主要工作', label: '主要工作 (长文本)', val: '', isTextarea: true }
      ];
    } else if (sec === '项目经历') {
      defaultFields = [
        { k: '_rowName', label: '经历标签', val: '项目简称' },
        { k: '项目名称', label: '项目全称', val: '' },
        { k: '角色', label: '担任角色', val: '核心负责人' },
        { k: '开始', label: '开始时间', val: '2024-09' },
        { k: '结束', label: '结束时间', val: '至今' },
        { k: '主要工作', label: '主要工作 (长文本)', val: '', isTextarea: true }
      ];
    } else if (sec === '奖励荣誉') {
      defaultFields = [
        { k: '_rowName', label: '荣誉标签', val: '荣誉简称' },
        { k: '获奖年月', label: '获奖年月', val: '2024-10' },
        { k: '荣誉名称', label: '荣誉名称', val: '' },
        { k: '奖励级别', label: '奖励级别', val: '国家级/省部级/校级/院级' },
        { k: '说明', label: '说明', val: '', isTextarea: true }
      ];
    } else if (sec === '家庭成员') {
      defaultFields = [
        { k: '_rowName', label: '成员标签', val: '父亲/母亲/配偶' },
        { k: '姓名', label: '姓名', val: '' },
        { k: '与本人关系', label: '与本人关系', val: '父子/母子/配偶' },
        { k: '出生年月', label: '出生年月', val: '1972-03' },
        { k: '工作单位', label: '工作单位', val: '' },
        { k: '职务', label: '职务', val: '' }
      ];
    }

    const currentCount = container.querySelectorAll('.exp-item-card').length + 1;

    card.innerHTML = `
      <div class="exp-item-header">
        <span class="drag-handle" title="拖动排序" draggable="true"></span>
        <h4>#${currentCount} 新增经历</h4>
        <button type="button" class="btn-sm btn-danger" data-action="del-exp">删除此条</button>
      </div>
      <div class="exp-fields-grid">
        ${defaultFields.map(f => `
          <div class="form-item ${f.isTextarea ? 'full-w' : ''}">
            <label>${f.label}</label>
            ${f.isTextarea
              ? `<textarea class="exp-field" data-key="${f.k}" rows="4" placeholder="详细描述..."></textarea>`
              : `<input type="text" class="exp-field" data-key="${f.k}" value="${f.val}" placeholder="填写内容...">`
            }
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(card);
    const firstInput = card.querySelector('.exp-field');
    if (firstInput) firstInput.focus();
  }

  // 挂载到 window 供多场景访问
  window.addKvField = addKvField;
  window.addExperienceRow = addExperienceRow;

  // 全局事件委托：绑定简历资料库全部动态按钮事件 (彻底规避 Chrome CSP 限制)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const sec = btn.getAttribute('data-section');

    if (action === 'add-kv') {
      e.preventDefault();
      addKvField(sec);
      showToast(`已在「${sec}」中添加新字段`);
    } else if (action === 'add-exp') {
      e.preventDefault();
      addExperienceRow(sec);
      showToast(`已在「${sec}」中添加新经历`);
    } else if (action === 'del-kv') {
      e.preventDefault();
      const row = btn.closest('.kv-row');
      if (row) {
        row.remove();
        showToast('已删除该字段');
      }
    } else if (action === 'del-exp') {
      e.preventDefault();
      const card = btn.closest('.exp-item-card');
      if (card) {
        const parent = card.parentElement;
        card.remove();
        // 重新排序标题编号
        if (parent) {
          parent.querySelectorAll('.exp-item-card').forEach((c, idx) => {
            const h4 = c.querySelector('.exp-item-header h4');
            const tag = c.querySelector('.exp-field[data-key="_rowName"]')?.value || '经历';
            if (h4) h4.textContent = `#${idx + 1} ${tag}`;
          });
        }
        showToast('已删除该段经历');
      }
    }
  });

  // ================= 拖拽排序系统 =================
  (function initDragAndDrop() {
    let dragSrcElement = null;
    const emptyImg = new Image();
    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    function getDropTarget(el) {
      if (!dragSrcElement) return null;
      if (dragSrcElement.classList.contains('kv-row')) {
        return el.closest('.kv-row') || null;
      }
      if (dragSrcElement.classList.contains('exp-item-card')) {
        return el.closest('.exp-item-card') || null;
      }
      return el.closest('.editor-card') || null;
    }

    // 当拖拽模块卡片时，鼠标可能落在 Grid gap 间隙上，此时 e.target 是 grid 容器而非卡片
    // 此函数根据鼠标 Y 坐标在 grid 内查找最近的 .editor-card
    function findNearestCardInGrid(clientY) {
      const grid = $('.resume-editor-grid');
      if (!grid) return null;
      const cards = grid.querySelectorAll('.editor-card');
      let nearest = null;
      let minDist = Infinity;
      cards.forEach(card => {
        if (card === dragSrcElement) return;
        const rect = card.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const dist = Math.abs(clientY - centerY);
        if (dist < minDist) {
          minDist = dist;
          nearest = card;
        }
      });
      return nearest;
    }

    function updateExpCardNumbers(container) {
      if (!container) return;
      container.querySelectorAll('.exp-item-card').forEach((c, idx) => {
        const h4 = c.querySelector('.exp-item-header h4');
        const tagEl = c.querySelector('.exp-field[data-key="_rowName"]');
        const tag = tagEl ? tagEl.value : '经历';
        if (h4) h4.textContent = `#${idx + 1} ${tag}`;
      });
    }

    function insertRelative(dragEl, targetEl, clientY) {
      const parent = targetEl.parentElement;
      if (!parent) return;
      const rect = targetEl.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (clientY < midY) {
        parent.insertBefore(dragEl, targetEl);
      } else {
        parent.insertBefore(dragEl, targetEl.nextSibling);
      }
    }

    function cleanupDragging() {
      if (dragSrcElement) {
        dragSrcElement.classList.remove('dragging');
      }
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }

    document.addEventListener('dragstart', (e) => {
      const handle = e.target.closest('.drag-handle');
      if (!handle) { e.preventDefault(); return; }

      const kvRow = handle.closest('.kv-row');
      const expCard = handle.closest('.exp-item-card');
      const card = handle.closest('.editor-card');

      if (kvRow) {
        dragSrcElement = kvRow;
        kvRow.classList.add('dragging');
        console.log('[dragstart] 开始拖拽 kv-row, section:', kvRow.getAttribute('data-section'));
      } else if (expCard) {
        dragSrcElement = expCard;
        expCard.classList.add('dragging');
        console.log('[dragstart] 开始拖拽 exp-item-card, section:', expCard.getAttribute('data-section'));
      } else if (card) {
        dragSrcElement = card;
        card.classList.add('dragging');
        console.log('[dragstart] 开始拖拽编辑器模块:', card.id || 'unknown');
      } else {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setDragImage(emptyImg, 0, 0);
    });

    document.addEventListener('dragend', () => {
      console.log('[dragend] 拖拽结束');
      // 不在这里清空 dragSrcElement，让 drop 事件先处理
      // 使用 setTimeout 确保 drop 事件先执行
      setTimeout(() => {
        cleanupDragging();
        dragSrcElement = null;
      }, 0);
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!dragSrcElement) return;
      e.dataTransfer.dropEffect = 'move';

      var target = getDropTarget(e.target);
      // 模块拖拽：如果鼠标落在 Grid gap 上，根据坐标找最近的卡片
      if (!target && dragSrcElement.classList.contains('editor-card')) {
        target = findNearestCardInGrid(e.clientY);
      }
      if (!target || target === dragSrcElement) return;

      document.querySelectorAll('.drag-over').forEach(el => {
        if (el !== target) el.classList.remove('drag-over');
      });

      if (dragSrcElement.classList.contains('editor-card') && target.classList.contains('editor-card')) {
        target.classList.add('drag-over');
      } else if (dragSrcElement.classList.contains('kv-row') && target.classList.contains('kv-row') &&
                 dragSrcElement.getAttribute('data-section') === target.getAttribute('data-section')) {
        target.classList.add('drag-over');
      } else if (dragSrcElement.classList.contains('exp-item-card') && target.classList.contains('exp-item-card') &&
                 dragSrcElement.getAttribute('data-section') === target.getAttribute('data-section')) {
        target.classList.add('drag-over');
      }
    });

    document.addEventListener('dragleave', (e) => {
      const target = getDropTarget(e.target);
      if (target && !target.contains(e.relatedTarget)) {
        target.classList.remove('drag-over');
      }
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      console.log('[drop] 事件触发, e.target:', e.target.tagName, e.target.className, 'e.clientY:', e.clientY);

      if (!dragSrcElement) {
        console.warn('[drop] dragSrcElement 为 null，跳过');
        return;
      }
      console.log('[drop] dragSrcElement:', dragSrcElement.tagName, dragSrcElement.className, dragSrcElement.id || '');

      var target = getDropTarget(e.target);
      console.log('[drop] getDropTarget 返回:', target ? (target.tagName + ' ' + target.className + ' ' + (target.id || '')) : 'null');

      // 模块拖拽：如果鼠标落在 Grid gap 上，根据坐标找最近的卡片
      if (!target && dragSrcElement.classList.contains('editor-card')) {
        target = findNearestCardInGrid(e.clientY);
        console.log('[drop] findNearestCardInGrid 返回:', target ? (target.id || 'unknown') : 'null');
      }
      if (!target || target === dragSrcElement) {
        console.warn('[drop] 目标无效或与源相同，跳过移动。target:', target === dragSrcElement ? '=== dragSrcElement' : 'null');
        cleanupDragging();
        dragSrcElement = null;
        return;
      }

      let moved = false;
      if (dragSrcElement.classList.contains('editor-card') && target.classList.contains('editor-card')) {
        if (target.parentElement === dragSrcElement.parentElement) {
          insertRelative(dragSrcElement, target, e.clientY);
          moved = true;
          console.log('[drop] 模块移动成功, 源:', dragSrcElement.id, '目标:', target.id);
        } else {
          console.warn('[drop] 模块父容器不同，跳过');
        }
      } else if (dragSrcElement.classList.contains('kv-row') && target.classList.contains('kv-row') &&
                 dragSrcElement.getAttribute('data-section') === target.getAttribute('data-section')) {
        insertRelative(dragSrcElement, target, e.clientY);
        moved = true;
        console.log('[drop] KV行移动成功');
      } else if (dragSrcElement.classList.contains('exp-item-card') && target.classList.contains('exp-item-card') &&
                 dragSrcElement.getAttribute('data-section') === target.getAttribute('data-section')) {
        insertRelative(dragSrcElement, target, e.clientY);
        updateExpCardNumbers(dragSrcElement.parentElement);
        moved = true;
        console.log('[drop] 经历卡片移动成功');
      } else {
        console.warn('[drop] 拖拽类型不匹配，跳过');
      }

      cleanupDragging();
      dragSrcElement = null;

      if (moved) {
        console.log('[drop] 开始保存...');
        // 使用 setTimeout 确保 DOM 已完全更新
        setTimeout(async () => {
          try {
            await collectAndSaveResume();
            console.log('[drop] 拖拽排序保存成功');
          } catch (err) {
            console.error('[drop] 拖拽排序保存失败', err);
            showToast('拖拽排序保存失败，请手动点击保存按钮');
          }
        }, 50);
      } else {
        console.warn('[drop] moved=false，未触发保存');
      }
    });
  })();

  function updateSaveStatus() {
    const indicator = $('#saveStatusIndicator');
    if (!indicator) return;
    const ts = localStorage.getItem('__last_save_time');
    if (ts) {
      const d = new Date(parseInt(ts));
      indicator.textContent = `上次保存: ${d.toLocaleTimeString()}`;
      indicator.style.color = 'var(--green)';
    } else {
      indicator.textContent = '尚未保存';
      indicator.style.color = 'var(--red)';
    }
  }

  // 从 DOM 收集并保存简历数据（按模块 DOM 顺序）
  async function collectAndSaveResume() {
    const updated = {};

    const cards = $$('.resume-editor-grid .editor-card');
    console.log('[collectAndSaveResume] 收集 DOM 顺序模块:',
      Array.from(cards).map(c => c.id).join(' → '));

    cards.forEach(card => {
      const kv = card.querySelector('[id^="kv-"]');
      const exp = card.querySelector('[id^="exp-"]');

      if (kv) {
        const sec = kv.id.replace('kv-', '');
        updated[sec] = [];
        const rows = kv.querySelectorAll('.kv-row');
        rows.forEach(r => {
          const k = r.querySelector('.kv-key').value.trim();
          const v = r.querySelector('.kv-val').value.trim();
          if (k) updated[sec].push([k, v]);
        });
      } else if (exp) {
        const sec = exp.id.replace('exp-', '');
        updated[sec] = [];
        const expCards = exp.querySelectorAll('.exp-item-card');
        expCards.forEach(ec => {
          const item = {};
          const fields = ec.querySelectorAll('.exp-field');
          fields.forEach(f => {
            const k = f.getAttribute('data-key');
            if (k) item[k] = f.value.trim();
          });
          if (Object.keys(item).length > 0) {
            updated[sec].push(item);
          }
        });
      }
    });

    console.log('[collectAndSaveResume] 收集到的模块顺序:', Object.keys(updated).join(' → '));

    updated._sectionOrder = Object.keys(updated);
    currentResume = updated;
    resumeSectionOrder = updated._sectionOrder;
    await storageSet(RESUME_STORAGE_KEY, currentResume);
    console.log('[collectAndSaveResume] 已保存（含 _sectionOrder）:', resumeSectionOrder.join(' → '));
    localStorage.setItem('__last_save_time', Date.now());
    localStorage.setItem('__last_save_order', JSON.stringify(
      (currentResume['其他信息'] || []).map(e => (Array.isArray(e) ? e[0] : e))
    ));
    saveSnapshot(records, currentResume);
    updateSaveStatus();
    showToast('🎉 简历资料库已保存！所有网页侧边栏已实时同步');
  }

  $('#saveAllResumeBtn').addEventListener('click', async () => {
    const btn = $('#saveAllResumeBtn');
    const origText = btn.textContent;
    btn.textContent = '⏳ 保存中...';
    btn.disabled = true;
    try {
      await collectAndSaveResume();
      btn.textContent = '✓ 已保存';
      setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 1500);
    } catch (err) {
      console.error('保存失败', err);
      btn.textContent = origText;
      btn.disabled = false;
      showToast('保存失败，请刷新页面后重试');
    }
  });

  // 导出简历 JSON
  $('#resumeExportJsonBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(currentResume, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_profile_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('简历 JSON 已导出');
  });

  // 导入简历 JSON
  $('#resumeImportJsonBtn').addEventListener('click', () => $('#resumeFileInput').click());
  $('#resumeFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed && typeof parsed === 'object') {
          currentResume = parsed;
          await storageSet(RESUME_STORAGE_KEY, currentResume);
          renderResumeEditor();
          showToast('✅ 简历已成功导入并同步！');
        }
      } catch (err) {
        alert('导入失败：不是有效的 JSON 文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // 重置简历为示例
  $('#resumeResetSeedBtn').addEventListener('click', async () => {
    if (confirm('确定要重置简历为默认示例数据吗？')) {
      currentResume = DEFAULT_RESUME;
      resumeSectionOrder = DEFAULT_RESUME._sectionOrder || Object.keys(DEFAULT_RESUME).filter(k => !k.startsWith('_'));
      await storageSet(RESUME_STORAGE_KEY, currentResume);
      renderResumeEditor();
      showToast('已重置为示例简历');
    }
  });

  // ================= TAB 3: 数据安全与备份 =================
  function downloadFullBackup() {
    const envelope = {
      schemaVersion: 2,
      appVersion: APP_VERSION,
      savedAt: new Date().toISOString(),
      recordCount: records.length,
      records: records,
      resume: currentResume
    };
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autumn_assistant_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('完整备份文件已下载');
  }

  $('#exportDataBtn').addEventListener('click', downloadFullBackup);
  $('#exportFullBackupBtn').addEventListener('click', downloadFullBackup);

  // 投递追踪导入备份
  $('#importRecordsBtn').addEventListener('click', () => $('#recordsFileInput').click());
  $('#recordsFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        let importedRecords = [];

        if (Array.isArray(parsed)) {
          importedRecords = parsed;
        } else if (parsed && Array.isArray(parsed.records)) {
          importedRecords = parsed.records;
        }

        if (importedRecords.length === 0) {
          alert('导入失败：文件中未找到投递记录');
          return;
        }

        records = importedRecords;
        await storageSet(RECORDS_STORAGE_KEY, records);
        saveSnapshot(records, currentResume);
        renderRecords();
        showToast(`✅ 成功导入 ${importedRecords.length} 条投递记录！`);
      } catch (err) {
        alert('导入失败：文件损坏或格式不兼容');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // 数据安全备份导入
  $('#importFullBackupBtn').addEventListener('click', () => $('#fullBackupFileInput').click());
  $('#fullBackupFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        let importedRecords = [];
        let importedResume = null;

        // 兼容原 autumn-recruitment-tracker 的 envelope 格式或纯数组
        if (Array.isArray(parsed)) {
          importedRecords = parsed;
        } else if (parsed && Array.isArray(parsed.records)) {
          importedRecords = parsed.records;
          if (parsed.resume) importedResume = parsed.resume;
        }

        if (importedRecords.length > 0) {
          records = importedRecords;
          await storageSet(RECORDS_STORAGE_KEY, records);
        }
        if (importedResume) {
          currentResume = importedResume;
          currentResume._sectionOrder = Object.keys(importedResume).filter(k => k !== '_sectionOrder');
          resumeSectionOrder = currentResume._sectionOrder;
          await storageSet(RESUME_STORAGE_KEY, currentResume);
        }

        saveSnapshot(records, currentResume);
        renderRecords();
        renderResumeEditor();
        showToast(`✅ 成功导入 ${importedRecords.length} 条投递记录！`);
      } catch (err) {
        alert('导入失败：文件损坏或格式不兼容');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // 打开历史快照列表
  $('#openSnapshotListBtn').addEventListener('click', async () => {
    const modal = $('#snapshotListModal');
    const body = $('#snapshotListBody');
    body.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">正在加载快照列表...</p>';
    modal.showModal();

    try {
      const db = await openSafetyDb();
      const allSnapshots = await new Promise((resolve, reject) => {
        const tx = db.transaction('snapshots', 'readonly');
        const req = tx.objectStore('snapshots').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      const keys = await new Promise((resolve, reject) => {
        const tx = db.transaction('snapshots', 'readonly');
        const req = tx.objectStore('snapshots').getAllKeys();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      if (allSnapshots.length === 0) {
        body.innerHTML = '<div class="snapshot-empty">暂无历史快照</div>';
        return;
      }

      const pairs = keys.map((k, i) => ({ key: k, snapshot: allSnapshots[i] }));
      pairs.sort((a, b) => (b.snapshot.savedAt || '').localeCompare(a.snapshot.savedAt || ''));

      body.innerHTML = pairs.map(({ key, snapshot }) => {
        const time = snapshot.savedAt ? new Date(snapshot.savedAt).toLocaleString('zh-CN') : '未知时间';
        const recordCount = Array.isArray(snapshot.records) ? snapshot.records.length : 0;
        const resumeModuleCount = snapshot.resume && typeof snapshot.resume === 'object'
          ? Object.keys(snapshot.resume).filter(k => !k.startsWith('_')).length : 0;
        return `
          <div class="snapshot-item" data-key="${escapeHtml(key)}">
            <div class="snapshot-info">
              <div class="snapshot-time">${escapeHtml(time)}</div>
              <div class="snapshot-meta">${recordCount} 条投递记录 · ${resumeModuleCount} 个简历模块</div>
            </div>
            <button class="snapshot-restore-btn" data-key="${escapeHtml(key)}">恢复此版本</button>
          </div>
        `;
      }).join('');

      body.querySelectorAll('.snapshot-restore-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const targetKey = btn.dataset.key;
          if (!confirm('确定要恢复到此快照版本吗？当前数据将被覆盖，建议先导出备份。')) return;

          try {
            const snapshot = await new Promise((resolve, reject) => {
              const tx = db.transaction('snapshots', 'readonly');
              const req = tx.objectStore('snapshots').get(targetKey);
              req.onsuccess = () => resolve(req.result);
              req.onerror = () => reject(req.error);
            });

            if (snapshot && Array.isArray(snapshot.records)) {
              records = snapshot.records;
              if (snapshot.resume) {
                currentResume = snapshot.resume;
                currentResume._sectionOrder = Object.keys(snapshot.resume).filter(k => k !== '_sectionOrder');
                resumeSectionOrder = currentResume._sectionOrder;
              }
              await storageSet(RECORDS_STORAGE_KEY, records);
              await storageSet(RESUME_STORAGE_KEY, currentResume);
              renderRecords();
              renderResumeEditor();
              modal.close();
              showToast(`✅ 已成功恢复至快照版本 (${snapshot.savedAt.slice(0, 16)})`);
            }
          } catch (err) {
            alert('恢复失败：' + (err.message || '未知错误'));
          }
        });
      });
    } catch (e) {
      body.innerHTML = `<div class="snapshot-empty">加载失败：${e.message || '未知错误'}</div>`;
    }
  });

  $('#closeSnapshotListBtn').addEventListener('click', () => $('#snapshotListModal').close());

  // 清空历史快照
  $('#clearSnapshotsBtn').addEventListener('click', async () => {
    if (!confirm('确定要清空所有历史版本快照吗？此操作不可逆！')) return;
    try {
      const db = await openSafetyDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('snapshots', 'readwrite');
        const req = tx.objectStore('snapshots').clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      updateSnapshotCount();
      showToast('已清空所有历史快照');
    } catch (e) {
      alert('清空快照失败：' + (e.message || '未知错误'));
    }
  });

  // 清空所有数据
  $('#clearAllDataBtn').addEventListener('click', async () => {
    if (confirm('警告：确定要清空全部投递记录与简历配置吗？此操作不可逆！')) {
      records = [];
      await storageSet(RECORDS_STORAGE_KEY, records);
      renderRecords();
      showToast('已清空全部数据');
    }
  });

  // ================= 离线 OCR 截图识别逻辑 =================
  const ocrModal = $('#ocrModal');
  const ocrDropzone = $('#ocrDropzone');
  const ocrFileInput = $('#ocrFileInput');
  const ocrPreviewImg = $('#ocrPreviewImg');
  const ocrPrompt = $('#ocrPrompt');
  const startOcrBtn = $('#startOcrBtn');
  const ocrProgress = $('#ocrProgress');
  const ocrProgressInner = $('#ocrProgressInner');
  const ocrStatusText = $('#ocrStatusText');
  const ocrResultForm = $('#ocrResultForm');
  const saveOcrRecordBtn = $('#saveOcrRecordBtn');

  $('#openOcrModalBtn').addEventListener('click', () => {
    resetOcrModal();
    ocrModal.showModal();
  });
  $('#closeOcrModalBtn').addEventListener('click', () => ocrModal.close());
  $('#cancelOcrBtn').addEventListener('click', () => ocrModal.close());

  ocrDropzone.addEventListener('click', () => ocrFileInput.click());
  ocrFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleOcrImage(e.target.files[0]);
    }
  });

  // 拖拽支持
  ocrDropzone.addEventListener('dragover', (e) => { e.preventDefault(); ocrDropzone.style.borderColor = 'var(--primary)'; });
  ocrDropzone.addEventListener('dragleave', () => { ocrDropzone.style.borderColor = '#cbd5e1'; });
  ocrDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    ocrDropzone.style.borderColor = '#cbd5e1';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleOcrImage(e.dataTransfer.files[0]);
    }
  });

  // 粘贴剪贴板图片支持
  window.addEventListener('paste', (e) => {
    if (!ocrModal.open) return;
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleOcrImage(file);
        break;
      }
    }
  });

  function handleOcrImage(file) {
    ocrFile = file;
    const url = URL.createObjectURL(file);
    ocrPreviewImg.src = url;
    ocrPreviewImg.classList.remove('hidden');
    ocrPrompt.classList.add('hidden');
    startOcrBtn.disabled = false;
  }

  function resetOcrModal() {
    ocrFile = null;
    ocrPreviewImg.src = '';
    ocrPreviewImg.classList.add('hidden');
    ocrPrompt.classList.remove('hidden');
    startOcrBtn.disabled = true;
    startOcrBtn.classList.remove('hidden');
    ocrProgress.classList.add('hidden');
    ocrResultForm.classList.add('hidden');
    saveOcrRecordBtn.classList.add('hidden');
  }

  // ================= 离线 OCR 预热与识别核心 =================
  function openTesseractCache() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('keyval-store');
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('keyval')) {
          request.result.createObjectStore('keyval');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('无法打开本地识别缓存数据库'));
    });
  }

  async function ensureChineseOcrModel() {
    if (!window.__OCR_CHI_SIM_GZIP_BASE64__) throw new Error('中文识别模型依赖缺失 (chi_sim-data.js 未加载)');
    const db = await openTesseractCache();
    const key = './chi_sim.traineddata';
    const exists = await new Promise((resolve, reject) => {
      const request = db.transaction('keyval', 'readonly').objectStore('keyval').get(key);
      request.onsuccess = () => resolve(typeof request.result !== 'undefined');
      request.onerror = () => reject(request.error);
    });
    if (!exists) {
      const raw = atob(window.__OCR_CHI_SIM_GZIP_BASE64__);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
      await new Promise((resolve, reject) => {
        const tx = db.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(bytes, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('写入离线语言模型到 IndexedDB 失败'));
      });
    }
    db.close();
  }

  function describeOcrProgress(message) {
    const names = {
      'loading tesseract core': '正在加载本地识别引擎',
      'initializing tesseract': '正在初始化识别引擎',
      'loading language traineddata': '正在读取离线中文模型',
      'initializing api': '正在准备中文识别',
      'recognizing text': '正在识别截图文字'
    };
    const progress = Math.max(0, Math.min(1, Number(message.progress) || 0));
    ocrProgressInner.style.width = `${Math.round(progress * 100)}%`;
    ocrStatusText.textContent = `${names[message.status] || '正在识别'}… ${Math.round(progress * 100)}%`;
  }

  // 辅助函数：将任意格式图片文件转为标准 Canvas (填充白底保证 OCR 识别对比度)
  function loadImageToCanvas(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('未选择有效图片'));
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const width = img.naturalWidth || img.width || 800;
          const height = img.naturalHeight || img.height || 600;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // 关键：PNG 截图透明通道处理，填充纯白底色确保 OCR 算法准确识别
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve({ canvas, dataUrl: e.target.result });
        };
        img.onerror = () => reject(new Error('图片格式无法解码，请上传常见 PNG 或 JPG 图片'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('读取图片文件失败'));
      reader.readAsDataURL(file);
    });
  }

  startOcrBtn.addEventListener('click', async () => {
    if (!ocrFile) return;
    startOcrBtn.disabled = true;
    ocrProgress.classList.remove('hidden');
    ocrProgressInner.style.width = '2%';
    ocrStatusText.textContent = '正在准备离线中文识别，首次可能需要几秒…';

    try {
      if (typeof window.Tesseract === 'undefined') {
        throw new Error('未加载本地 Tesseract OCR 引擎组件 (tesseract.min.js)');
      }

      // 1. 确保离线语言模型已注入 IndexedDB keyval-store
      await ensureChineseOcrModel();

      // 2. 转为标准白底 Canvas，消除透明通道与格式差异
      const { canvas } = await loadImageToCanvas(ocrFile);

      // 3. 构建本地相对/扩展绝对路径
      const ocrRoot = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL('ocr/')
        : new URL('./ocr/', location.href).href;

      // 4. 启动 Worker 并配置 cacheMethod: 'readOnly' 与 workerBlobURL: false (兼容 MV3 扩展沙箱)
      ocrWorker = await Tesseract.createWorker('chi_sim', 1, {
        workerPath: `${ocrRoot}worker.min.js`,
        corePath: `${ocrRoot}core`,
        langPath: `${ocrRoot}lang`,
        cacheMethod: 'readOnly',
        workerBlobURL: false,
        logger: describeOcrProgress
      });

      // 5. 执行识别
      const result = await ocrWorker.recognize(canvas);
      const text = result?.data?.text || '';
      await ocrWorker.terminate();
      ocrWorker = null;

      ocrProgressInner.style.width = '100%';
      ocrStatusText.textContent = '识别完成！';

      // 6. 智能正则提取字段
      const parsed = parseOcrText(text);
      $('#ocr-company').value = parsed.company;
      $('#ocr-position').value = parsed.position;
      $('#ocr-date').value = parsed.date;
      $('#ocr-stage').value = parsed.stage;

      ocrResultForm.classList.remove('hidden');
      startOcrBtn.classList.add('hidden');
      saveOcrRecordBtn.classList.remove('hidden');
    } catch (err) {
      console.error('OCR 识别失败', err);
      if (ocrWorker) {
        try { await ocrWorker.terminate(); } catch (_) {}
        ocrWorker = null;
      }
      alert(`识别失败：${err.message || '请检查图片清晰度或直接手动录入'}`);
      ocrProgress.classList.add('hidden');
      startOcrBtn.disabled = false;
    }
  });

  function cleanOcrCandidate(value, maxLength = 80) {
    return String(value || '')
      .replace(/^[\s:：|·•\-—]+|[\s:：|·•\-—]+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .slice(0, maxLength);
  }

  function matchOcrLabel(text, labels, maxLength) {
    const labelGroup = labels.join('|');
    const match = text.match(new RegExp(`(?:${labelGroup})\\s*[:：]?\\s*([^\\n]{2,${maxLength}})`, 'i'));
    return cleanOcrCandidate(match?.[1], maxLength);
  }

  function parseOcrText(rawText) {
    const text = String(rawText || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
    const lines = text.split('\n').map(line => cleanOcrCandidate(line, 100)).filter(line => line.length >= 2);
    let company = matchOcrLabel(text, ['公司(?:名称)?', '企业(?:名称)?', '招聘单位', '应聘公司'], 60);
    let position = matchOcrLabel(text, ['投递岗位', '应聘岗位', '应聘职位', '岗位(?:名称)?', '职位(?:名称)?'], 80);
    if (!company) company = lines.find(line => /(?:公司|集团|科技|银行|证券|咨询|智能|互娱|网络|汽车|电子|传媒|研究院)/.test(line) && line.length <= 45) || '';
    if (!position) position = lines.find(line => /(?:工程师|经理|运营|设计师|分析师|顾问|开发|算法|产品|实习|管培生|专员|研究员)/.test(line) && line.length <= 60) || '';

    let stage = '已投递';
    if (/(?:offer|录用|已通过|已录取)/i.test(text)) stage = 'Offer';
    else if (/(?:已结束|流程结束|不合适|未通过|淘汰|拒绝)/i.test(text)) stage = '已结束';
    else if (/(?:HR\s*面|人力面|人事面)/i.test(text)) stage = 'HR面';
    else if (/(?:二面|第二轮面试|复试)/i.test(text)) stage = '二面';
    else if (/(?:一面|第一轮面试|初面|面试中)/i.test(text)) stage = '一面';
    else if (/(?:笔试|测评|在线测试)/i.test(text)) stage = '笔试';

    const labelled = text.match(/(?:投递|申请|提交)(?:日期|时间)?\s*[:：]?\s*(20\d{2})\s*[年/.\-]\s*(\d{1,2})\s*[月/.\-]\s*(\d{1,2})\s*日?/);
    const generic = text.match(/(20\d{2})\s*[年/.\-]\s*(\d{1,2})\s*[月/.\-]\s*(\d{1,2})\s*日?/);
    const parts = labelled || generic;
    let date = new Date().toISOString().slice(0, 10);
    if (parts) {
      const month = String(Math.min(12, Math.max(1, Number(parts[2])))).padStart(2, '0');
      const day = String(Math.min(31, Math.max(1, Number(parts[3])))).padStart(2, '0');
      date = `${parts[1]}-${month}-${day}`;
    }

    return {
      company: cleanOcrCandidate(company, 60) || '识别公司',
      position: cleanOcrCandidate(position, 80) || '识别岗位',
      date,
      stage
    };
  }

  saveOcrRecordBtn.addEventListener('click', () => {
    const newRec = {
      id: cryptoId(),
      company: $('#ocr-company').value.trim() || '待确认公司',
      position: $('#ocr-position').value.trim() || '待确认岗位',
      city: '',
      applicationDate: $('#ocr-date').value || new Date().toISOString().slice(0, 10),
      stage: $('#ocr-stage').value,
      recentSchedule: '截图识别收录',
      nextAction: '核对岗位详情与跟进状态',
      updatedAt: Date.now()
    };
    records.unshift(newRec);
    saveRecords(`🎉 已收录: ${newRec.company} - ${newRec.position}`);
    ocrModal.close();
  });

  // ================= 初始化启动 =================
  async function init() {
    handleUrlHash();
    await loadRecords();
    await loadResume();
    updateSnapshotCount();
    updateSaveStatus();
  }

  init();
})();