document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  // ===== Dify 配置 =====
  const difyConfig = window.DIFY_CONFIG || {};
  const difyBaseUrl = String(
    difyConfig.baseUrl || localStorage.getItem("DIFY_BASE_URL") || "http://localhost"
  )
    .replace(/\/+$/, "")
    .replace(/\/v1$/, "");

  let difyApiKey = String(
    difyConfig.apiKey || localStorage.getItem("DIFY_PRO_API_KEY") || localStorage.getItem("DIFY_API_KEY") || ""
  );

  let difyWorkflowYml = String(
    difyConfig.workflow_yaml || localStorage.getItem("DIFY_WORKFLOW_YML") || ""
  );

  const embeddedWorkflowUrl = encodeURI(
    difyConfig.workflow_yaml || "./反诈劝阻助手(pro版) (1).yml"
  );

  const defaultPageContent = {
    documentTitle: "反诈中心 - Demo",
    brand: { logoText: "反", name: "反诈中心" },
    nav: {
      home: "首页",
      scene: "场景模拟",
      judge: "风险研判",
      report: "一键举报",
      kb: "反诈小课堂",
      reportShortcut: "恶意线索举报",
    },
    hero: {
      title: "谛听",
      tagline: "辨伪·劝止·守护"
    },
    scenarios: [
      {
        name: "刷单返利",
        desc: "小额返利诱导大额垫付，借口“解冻/保证金”。",
        story:
          "【剧情】你在群里看到“轻松兼职日赚300”，对方先让你做小任务返你20元，随后要求你垫付更大金额才能“解冻返利”。\n对方话术：“这是系统流程，不做就会影响信誉分。”\n目标：识别“先小利诱导大额投入/解冻费/保证金”等风险点。",
      },
      {
        name: "游戏交易",
        desc: "低价皮肤/账号，诱导跳转外链或仿冒担保平台。",
        story:
          "【剧情】你在二手平台看到低价皮肤，对方让你加QQ并发来“担保交易链接”，要求你在外站付款。\n对方话术：“平台手续费太高，走链接更安全。”\n目标：识别“跳转外部链接/诱导私下交易/仿冒担保平台”等风险点。",
      },
      {
        name: "冒充公检法",
        desc: "恐吓涉案，要求保密、屏幕共享、转入安全账户。",
        story:
          "【剧情】电话自称“公安/检察院”，称你涉嫌洗钱，要求你下载会议软件并屏幕共享，随后让你把钱转入“安全账户”。\n对方话术：“这是保密案件，不能告诉家人。”\n目标：识别“安全账户/恐吓威胁/要求保密/屏幕共享”等风险点。",
      },
    ],
    judge: {
      title: "风险研判",
      desc: "粘贴可疑链接/文本进行快速检测（规则引擎 Demo）。",
      runText: "开始研判",
      demoText: "填充示例",
      resultTitle: "研判结果",
      adviceTitle: "劝阻建议",
      copyAdviceText: "复制话术",
      openAiText: "高风险示例",
    },
    report: {
      title: "一键举报",
      desc: "提交可疑链接/内容（Demo：本地保存，后续对接你们后端）。",
      submitText: "提交举报",
      viewText: "查看本地记录",
      options: [
        { value: "phishing", label: "钓鱼链接" },
        { value: "impersonation", label: "冒充机构" },
        { value: "investment", label: "虚假投资" },
        { value: "task", label: "刷单返利" },
        { value: "loan", label: "校园贷/网贷" },
      ],
    },
    kb: {
      title: "反诈小课堂",
      desc: "关键词检索（Demo：静态知识条目）。",
      searchPlaceholder: "搜索：刷单 / 公检法 / 安全账户 / 验证码...",
      items: [
        { q: "刷单返利有什么典型特征？", a: "先小额返利获取信任，再诱导大额垫付；常见借口：解冻、保证金、刷流水。" },
        { q: "什么是“安全账户”？", a: "公检法不会要求转入所谓安全账户；这是典型诈骗话术。" },
        { q: "验证码可以给对方吗？", a: "任何验证码都不要透露；验证码=账户操作授权。" },
        { q: "收到可疑链接怎么办？", a: "不点击；通过官方 App/官网手动输入地址核验；保存证据并举报。" },
      ],
    },
    footer: "提示：右下角为 AI 助手入口（可嵌入 Dify）。",
    drawer: {
      title: "AI 反诈助手",
      sub: "把场景、链接、文本或图片传进来，让 AI 判断风险并生成劝阻话术",
      copyContextText: "复制当前内容",
      loadWorkflowText: "加载工作流(YML)",
      openConfigText: "配置 Key",
      closeText: "关闭",
      placeholder: "请输入您要判别的内容(支持文本、图片、视频)",
      welcome: "你好,我是谛听",
      hint: "",
    },
    scenariosTitle: "场景模拟",
    scenariosDesc: "输入骗局关键词，快速找到对应剧情并发送给 AI 分析。",
  };

  function mergeDeep(base, override) {
    if (Array.isArray(base) && Array.isArray(override)) return override;
    if (!base || typeof base !== "object" || Array.isArray(base)) {
      return override !== undefined ? override : base;
    }
    const result = { ...base };
    Object.entries(override || {}).forEach(([key, value]) => {
      result[key] = mergeDeep(base[key], value);
    });
    return result;
  }

  const pageContent = mergeDeep(defaultPageContent, window.PAGE_CONTENT || {});
  document.title = pageContent.documentTitle;

  function renderPageContent(content) {
    const brandLogo = document.querySelector(".brand__logo");
    const brandName = document.querySelector(".brand__name");
    const menuItems = Array.from(document.querySelectorAll(".menu__item"));
    const reportShortcut = document.querySelector(".linkbtn[data-tab='report']");
    const heroTitle = document.querySelector(".hero__title");
    const heroTagline = document.querySelector(".hero__tagline");
    const scenarioHead = document.querySelector("#tab-scene .panel__head");
    const judgeHead = document.querySelector("#tab-judge .panel__head");
    const judgeCards = document.querySelectorAll("#tab-judge .card");
    const reportHead = document.querySelector("#tab-report .panel__head");
    const reportType = document.querySelector("#reportType");
    const kbHead = document.querySelector("#tab-kb .panel__head");
    const kbList = document.querySelector("#kbList");
    const footer = document.querySelector(".footer span");
    const drawerTitle = document.querySelector(".ai-drawer__title");
    const drawerSub = document.querySelector(".ai-drawer__sub");

    if (brandLogo) brandLogo.textContent = content.brand.logoText;
    if (brandName) brandName.textContent = content.brand.name;
    if (menuItems[0]) menuItems[0].textContent = content.nav.home;
    if (menuItems[1]) menuItems[1].textContent = content.nav.scene;
    if (menuItems[2]) menuItems[2].textContent = content.nav.judge;
    if (menuItems[3]) menuItems[3].textContent = content.nav.report;
    if (menuItems[4]) menuItems[4].textContent = content.nav.kb;
    if (reportShortcut) reportShortcut.textContent = content.nav.reportShortcut;

    if (heroTitle) heroTitle.textContent = content.hero.title;
    if (heroTagline) heroTagline.textContent = content.hero.tagline;

    if (scenarioHead) {
      const h2 = scenarioHead.querySelector("h2");
      const p = scenarioHead.querySelector("p");
      if (h2) h2.textContent = content.scenariosTitle || "场景模拟";
      if (p) p.textContent = content.scenariosDesc || "输入骗局关键词，快速找到对应剧情并发送给 AI 分析。";
    }

    if (judgeHead) {
      const h2 = judgeHead.querySelector("h2");
      const p = judgeHead.querySelector("p");
      if (h2) h2.textContent = content.judge.title;
      if (p) p.textContent = content.judge.desc;
    }
    if (judgeCards[0]) {
      const h3 = judgeCards[0].querySelector(".card__title");
      const buttonRow = judgeCards[0].querySelectorAll(".btn");
      if (h3) h3.textContent = content.judge.resultTitle;
      if (buttonRow[0]) buttonRow[0].textContent = content.judge.copyAdviceText;
      if (buttonRow[1]) buttonRow[1].textContent = content.judge.openAiText;
    }

    if (reportHead) {
      const h2 = reportHead.querySelector("h2");
      const p = reportHead.querySelector("p");
      if (h2) h2.textContent = content.report.title;
      if (p) p.textContent = content.report.desc;
    }
    if (reportType) {
      reportType.innerHTML = content.report.options
        .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
        .join("");
    }

    if (kbHead) {
      const h2 = kbHead.querySelector("h2");
      const p = kbHead.querySelector("p");
      if (h2) h2.textContent = content.kb.title;
      if (p) p.textContent = content.kb.desc;
    }
    if (kbList) {
      kbList.innerHTML = content.kb.items
        .map(
          (item) => `
        <div class="kb__item">
          <div class="kb__q">${escapeHtml(item.q)}</div>
          <div class="kb__a">${escapeHtml(item.a)}</div>
        </div>`
        )
        .join("");
    }

    if (footer) footer.textContent = content.footer;
    if (drawerTitle) drawerTitle.textContent = content.drawer.title;
    if (drawerSub) drawerSub.textContent = content.drawer.sub;

    const copyStoryBtn = document.querySelector("#copyStoryBtn");
    const runJudgeBtn = document.querySelector("#runJudgeBtn");
    const fillDemoBtn = document.querySelector("#fillDemoBtn");
    const copyAdviceBtn = document.querySelector("#copyAdviceBtn");
    const openAiBtnFromJudge = document.querySelector("#openAiBtnFromJudge");
    const submitReportBtn = document.querySelector("#submitReportBtn");
    const viewReportsBtn = document.querySelector("#viewReportsBtn");
    const copyContextBtn = document.querySelector("#copyContextBtn");
    const loadWorkflowBtn = document.querySelector("#loadWorkflowBtn");
    const openConfigBtn = document.querySelector("#openConfigBtn");
    const closeAiBtn = document.querySelector("#closeAiBtn");
    const kbSearch = document.querySelector("#kbSearch");
    const aiDrawer = document.querySelector("#aiDrawer");

    if (copyStoryBtn) copyStoryBtn.textContent = content.storyCopyText || copyStoryBtn.textContent;
    if (runJudgeBtn) runJudgeBtn.textContent = content.judge.runText;
    if (fillDemoBtn) fillDemoBtn.textContent = content.judge.demoText;
    if (copyAdviceBtn) copyAdviceBtn.textContent = content.judge.copyAdviceText;
    if (openAiBtnFromJudge) openAiBtnFromJudge.textContent = content.judge.openAiText;
    if (submitReportBtn) submitReportBtn.textContent = content.report.submitText;
    if (viewReportsBtn) viewReportsBtn.textContent = content.report.viewText;
    if (copyContextBtn) copyContextBtn.textContent = content.drawer.copyContextText;
    if (loadWorkflowBtn) loadWorkflowBtn.textContent = content.drawer.loadWorkflowText;
    if (openConfigBtn) openConfigBtn.textContent = content.drawer.openConfigText;
    if (closeAiBtn) closeAiBtn.textContent = content.drawer.closeText;
    if (kbSearch) kbSearch.placeholder = content.kb.searchPlaceholder;
    if (aiDrawer) aiDrawer.setAttribute("data-bot-placeholder", content.drawer.placeholder);
  }

  renderPageContent(pageContent);

  function on(id, event, handler) {
    const el = $(id);
    if (!el) { console.warn(`[bind skipped] #${id} not found`); return; }
    el.addEventListener(event, handler);
  }

  // ===== Tabs =====
  const panels = {
    home: $("tab-home"),
    scene: $("tab-scene"),
    judge: $("tab-judge"),
    report: $("tab-report"),
    kb: $("tab-kb"),
    game: $("tab-game"),   // 新增这一行
};
  const workbench = document.querySelector(".workbench");
  function showPanel(key) {
    document.querySelectorAll(".menu__item").forEach((b) => b.classList.remove("is-active"));
    document.querySelector(`.menu__item[data-tab="${key}"]`)?.classList.add("is-active");
    if (key === "home") {
      if (workbench) workbench.style.display = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (workbench) workbench.style.display = "";
    document.querySelectorAll(".workbench .panel").forEach((p) => p.classList.remove("is-show"));
    panels[key]?.classList.add("is-show");
    workbench?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  document.querySelectorAll(".menu__item").forEach((btn) => {
    btn.addEventListener("click", () => showPanel(btn.dataset.tab));
  });
  document.querySelectorAll('[data-tab]:not(.menu__item)').forEach((btn) => {
    btn.addEventListener("click", () => showPanel(btn.dataset.tab));
  });

  // ===== 场景模拟 =====
  const storyTitle = $("storyTitle");
  const storyBody = $("storyBody");
  const sceneChatInput = $("sceneChatInput");
  const sceneChatSendBtn = $("sceneChatSendBtn");
  const copyStoryBtn = $("copyStoryBtn");
  const scenarioCases = pageContent.scenarios || [];
  function matchScenario(query) {
    if (!query.trim()) return null;
    const lowerQuery = query.trim().toLowerCase();
    for (const scenario of scenarioCases) {
      const keywords = [scenario.name, scenario.desc].join(" ").toLowerCase();
      if (keywords.includes(lowerQuery)) return scenario;
    }
    return null;
  }
  if (sceneChatSendBtn) {
    sceneChatSendBtn.addEventListener("click", () => {
      const query = sceneChatInput?.value || "";
      const matched = matchScenario(query);
      if (matched) {
        storyTitle.textContent = matched.name;
        storyBody.textContent = matched.story;
      } else {
        storyTitle.textContent = "未匹配到相关案例";
        storyBody.textContent = "请尝试其他关键词，如“刷单”“公检法”“游戏交易”等。";
      }
    });
  }
  if (sceneChatInput) {
    sceneChatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") { e.preventDefault(); sceneChatSendBtn?.click(); }
    });
  }
  if (copyStoryBtn) {
    copyStoryBtn.addEventListener("click", async () => {
      const title = storyTitle?.textContent || "";
      const body = storyBody?.textContent || "";
      await copyText(`【${title}】\n${body}`);
    });
  }

  // ===== 风险研判 =====
  const urlInput = $("urlInput");
  const textInput = $("textInput");
  const riskBadge = $("riskBadge");
  const signalsEl = $("signals");
  const adviceEl = $("advice");
  const rules = [
    { score: 40, hit: (u, t) => /安全账户|转入.*账户|逮捕|通缉令|配合调查|洗钱|保密案件/.test(t), msg: "高危：冒充公检法/安全账户话术" },
    { score: 30, hit: (u, t) => /刷单|返利|垫付|解冻|保证金|任务单|兼职/.test(t), msg: "疑似刷单返利/垫付诈骗" },
    { score: 25, hit: (u, t) => /验证码|不要告诉别人|10分钟|立即|否则影响征信|冻结/.test(t), msg: "存在紧迫威胁/验证码诱导特征" },
    { score: 20, hit: (u, t) => /屏幕共享|远程协助|会议软件/.test(t), msg: "屏幕共享/远程控制风险" },
    { score: 20, hit: (u, t) => /(http|https):\/\/\S+/.test(t) || (u && /(http|https):\/\/\S+/.test(u)), msg: "包含外部链接，需核验来源" },
    { score: 25, hit: (u) => u && /t\.cn|bit\.ly|tinyurl|dwz|short|url\.cn/.test(u), msg: "使用了短链接，可能隐藏真实地址" },
    { score: 30, hit: (u) => u && /(police|bank|verify|login|secure|gov)/i.test(u) && !/gov\.cn$/.test(u), msg: "URL 含敏感仿冒词" },
    { score: 15, hit: (u) => u && /^http:\/\//.test(u) && !/^https:\/\//.test(u), msg: "使用了不安全的 HTTP 协议" },
  ];
  function calcRisk(total) {
    if (total >= 60) return { level: "HIGH", cls: "risk--high" };
    if (total >= 30) return { level: "MID", cls: "risk--mid" };
    return { level: "LOW", cls: "risk--low" };
  }
  function buildAdvice(level) {
    const base = "建议：不点击链接、不转账、不透露验证码；通过官方渠道自行核验；保存证据并举报。";
    if (level === "HIGH") return `⚠️ 高风险！${base}\n如已转账或泄露信息：立即联系银行止付，修改密码，报警。`;
    if (level === "MID") return `⚠️ 中风险，存在明显可疑特征。${base}\n建议将完整对话发给 AI 进一步分析。`;
    return `✅ 当前未发现明显风险，但仍需谨慎核实信息来源。${base}`;
  }
  on("runJudgeBtn", "click", () => {
    const u = (urlInput?.value || "").trim();
    const t = (textInput?.value || "").trim();
    let total = 0;
    const hits = [];
    rules.forEach((r) => { if (r.hit(u, t)) { total += r.score; hits.push(r.msg); } });
    const r = calcRisk(total);
    if (riskBadge) { riskBadge.textContent = r.level; riskBadge.className = `risk ${r.cls}`; }
    if (signalsEl) { signalsEl.innerHTML = hits.length ? hits.map((x) => `<li>${escapeHtml(x)}</li>`).join("") : "<li>未命中明显规则（建议仍进行官方渠道核验）</li>"; }
    if (adviceEl) adviceEl.textContent = buildAdvice(r.level);
  });
  function fillDemo(url, text) { if (urlInput) urlInput.value = url; if (textInput) textInput.value = text; }
  const highDemo = { url: "http://www.police-check.com/verify", text: "【市公安局】您涉嫌洗钱犯罪，请立即配合调查。将名下所有资金转入“安全账户”622848***以证清白。案件编号：A08321，切勿告知他人，否则将逮捕。验证码：8542，请在10分钟内完成操作。" };
 const mediumDemo = {
  url: "https://t.cn/A6xxxxx",
  text: "【菜鸟驿站】您的包裹已到达，因地址不详无法派送，请点击链接 https://t.cn/A6xxxxx 更新地址。"
};
  const lowDemo = { url: "https://www.gov.cn", text: "尊敬的纳税人，您有一笔退税待申请，请登录国家税务总局官网（www.gov.cn）办理。切勿点击不明链接或透露个人信息。如有疑问，请拨打12366纳税服务热线。" };
  on("fillHighBtn", "click", () => fillDemo(highDemo.url, highDemo.text));
  on("fillMediumBtn", "click", () => fillDemo(mediumDemo.url, mediumDemo.text));
  on("fillLowBtn", "click", () => fillDemo(lowDemo.url, lowDemo.text));
  on("copyAdviceBtn", "click", async () => {
    const risk = (riskBadge?.textContent || "").trim();
    const signals = Array.from(signalsEl?.querySelectorAll("li") || []).map((li) => li.textContent.trim()).filter(Boolean);
    const advice = (adviceEl?.textContent || "").trim();
    const text = [risk ? `【风险等级】${risk}` : "", signals.length ? `【命中信号】\n${signals.map((s) => `- ${s}`).join("\n")}` : "", advice ? `【劝阻建议】\n${advice}` : ""].filter(Boolean).join("\n\n");
    if (!text) return alert("暂无可复制内容，请先开始研判。");
    await copyText(text);
  });
  on("openAiBtnFromJudge", "click", openAi);

  // ===== 举报 =====
  const reportLog = $("reportLog");
  on("submitReportBtn", "click", () => {
    const type = $("reportType")?.value;
    const evidence = ($("reportEvidence")?.value || "").trim();
    if (!evidence) return alert("请填写证据内容（链接/账号/群号/聊天记录等）");
    const item = { type, evidence, time: new Date().toISOString() };
    const key = "anti_fraud_reports";
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(item);
    localStorage.setItem(key, JSON.stringify(list));
    alert("已提交（本地保存）。我们会尽快处理您的举报信息。\n\n如需紧急举报，请立即拨打 110 或访问国家反诈中心官方平台：\n• 网络违法犯罪举报网站：cyberpolice.mps.gov.cn\n• 国家反诈中心 APP（各大应用商店可下载）\n• 反诈专线：96110");
  });
  on("viewReportsBtn", "click", () => {
    const key = "anti_fraud_reports";
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    if (!reportLog) return;
    reportLog.classList.toggle("is-hidden");
    reportLog.textContent = list.length ? list.map((x, i) => `#${i+1} [${x.time}] (${x.type})\n${x.evidence}\n`).join("\n") : "暂无本地举报记录。";
  });

  // ===== 知识库渲染 =====
  const kbData = pageContent.kb.items;
  const kbListEl = $("kbList");
  const kbSearch = $("kbSearch");
  function renderKb(keyword = "") {
    if (!kbListEl) return;
    const k = keyword.trim();
    const rows = kbData.filter((x) => !k || (x.q + x.a).includes(k));
    kbListEl.innerHTML = rows.map((x) => `<div class="kb__item"><div class="kb__q">${escapeHtml(x.q)}</div><div class="kb__a">${escapeHtml(x.a)}</div></div>`).join("");
    // 绑定点击展开详细知识
    attachKbClickHandlers();
  }
  renderKb();
  kbSearch?.addEventListener("input", () => renderKb(kbSearch.value));

  // ========= 新增：详细知识模态框功能 =========
  const modal = document.getElementById("knowledgeModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const closeModalBtn = document.getElementById("closeModalBtn");

  // 详细内容映射（根据问题标题匹配）
  const detailMap = {
    "刷单返利有什么典型特征？": `
      <h4>一、引流渠道多变，但“轻松高薪”是诱饵</h4>
      <p>诈骗分子会通过短信、短视频平台、招聘网站、陌生微信群等广撒网，打着“足不出户、日进斗金”“动动手指、月入过万”的旗号，专门吸引有空闲时间、希望兼职赚钱的人群（如宝妈、学生）。</p>
      <h4>二、前期施以小利，建立信任</h4>
      <p>最初会给你安排“新手任务”，比如点赞、关注公众号、小额垫付购物。完成后会快速返还本金并支付几元到几十元不等的佣金。这一步是为了让你相信真的能赚钱，放下戒备。</p>
      <h4>三、诱导下载独立APP，进入封闭陷阱</h4>
      <p>这是关键一步。对方会以“任务更稳定、佣金更高”为由，要求你通过不明链接或二维码下载非官方应用市场的聊天或刷单APP。一旦进入这个封闭环境，你就脱离了正规平台的保护，所有交易和沟通都在骗子的控制之下。</p>
      <h4>四、从“小额试水”到“大额联单”，无法提现</h4>
      <p>当你开始信任后，对方会推出“佣金更高”的复合任务，比如“三连单”“五连单”，需要连续完成多笔大额垫付才能一次性结算。</p>
      <h4>五、拒绝本金结算，最终拉黑失联</h4>
      <p>当你质疑或要求退款时，骗子会以“任务未完成”“审核失败”“需要缴纳保证金解冻”等理由，继续要求你转账。一旦你察觉被骗或拒绝再转钱，对方会立刻将你拉黑、踢出群聊，APP也无法再登录。</p>
      <p><strong>核心识别逻辑：</strong>所有要求先垫付资金做任务、承诺高额返利、后面让你下载不明APP进行大额转账的行为，100%是诈骗。正规的兼职工作绝不会让你在任务完成前自己掏钱。</p>
    `,
    "什么是“安全账户”？": `
      <p>“安全账户”是电信诈骗里一个典型的幌子，它根本不存在，是骗子为了骗钱而虚构的“资金黑洞”。它由骗子操控，专门等着你把钱转进去，是冒充公检法类诈骗中最核心的诱导工具。任何自称官方的“安全账户”，实际上都是诈骗账号。</p>
      <h4>“安全账户”诈骗的典型步骤</h4>
      <p><strong>1. 冒充权威，制造危机：</strong>骗子会冒充公检法或银行工作人员，以你涉嫌洗钱、账户有风险等名义制造恐慌。他们会准确报出你的个人信息以骗取信任，并发出伪造的通缉令等文件，加深你的恐惧。</p>
      <p><strong>2. 切断联系，远程操控：</strong>骗子会以“办案需要”或“涉密”为由，要求你保密并切断与亲友的联系。他们会进一步引导你下载会议软件、开启屏幕共享，或登录仿冒网站，实时监控你的手机并套取密码和验证码。</p>
      <p><strong>3. 诱导转账，榨干积蓄：</strong>在制造了强烈的恐惧和紧迫感后，骗子就会提出将资金转入“安全账户”接受审查，并承诺查完退还。为榨干你，他们甚至会要求你将定期存款、理财资金全部取出汇总转账，一旦得手，立刻失联。</p>
      <h4>如何一眼识别“安全账户”骗局？</h4>
      <ul>
        <li>“你涉嫌犯罪，资金需要转入‘安全账户’接受审查。”</li>
        <li>“我们是XX公安局的，你有一张通缉令，请配合调查。”</li>
        <li>“此案涉密，不得向任何人透露，包括你的家人和当地警察。”</li>
        <li>“请下载XX软件，我要跟你做视频笔录/屏幕共享。”</li>
        <li>“你的银行卡即将被冻结，请立即把所有钱转到我们指定的账户。”</li>
      </ul>
      <h4>真实案例警示</h4>
      <p>喻大爷的11万养老钱：他接到“南京警官”电话，称其涉案需转账到“安全账户”，警方及时介入保住存款。<br>老夫妇的27万积蓄：骗子发来穿警服、带手铐的恐吓视频，老夫妇险些转出所有养老金，被银行和警方联合拦截。</p>
      <p><strong>核心官方提示：</strong>公检法机关不存在任何“安全账户”。公检法机关绝不会通过电话、网络远程办案或要求转账。任何要求你转账到指定账户接受审查的，都是诈骗。</p>
      <p><strong>建议采取的行动：</strong>及时拨打110或96110核实，坚决不透露密码、验证码。</p>
    `,
    "验证码可以给对方吗？": `
      <p><strong>绝对不能把短信/APP验证码发给任何人！</strong></p>
      <h4>1. 验证码=账号钥匙</h4>
      <p>银行卡、支付宝、微信、各大软件、网贷、手机号过户的登录、改密、转账、绑卡、贷款全靠验证码，对方拿到就能：</p>
      <ul>
        <li>盗微信/支付宝，转走你余额、绑定银行卡里全部存款</li>
        <li>冒用身份注册网贷、借贷，债务记在你名下</li>
        <li>解绑你的银行卡、修改支付密码、盗刷</li>
        <li>过户你的手机号，接管所有账号</li>
      </ul>
      <h4>2. 刷单骗子索要验证码的目的</h4>
      <ul>
        <li>盗用你的实名账户走洗钱流水</li>
        <li>偷偷开通网贷、绑定收款账户</li>
        <li>盗取账号用于诈骗、违法活动</li>
      </ul>
      <h4>3. 重要原则</h4>
      <ul>
        <li>警察、客服、平台工作人员永远不会索要验证码</li>
        <li>任何理由（对账、验资、提现解冻、绑定账户）要验证码全是骗子</li>
        <li>收到陌生验证码短信直接删除，切勿转发</li>
      </ul>
      <p><strong>已经泄露验证码：</strong>立刻冻结银行卡、修改微信支付宝支付密码，必要时拨打96110反诈咨询。</p>
    `,
    "收到可疑链接怎么办？": `
      <p><strong>1. 不点、不复制、不跳转</strong><br>无论短信、QQ、微信、陌生好友发来链接，绝不点击打开，不点预览、不在浏览器粘贴网址。骗子链接内含木马、钓鱼页面，点开可能自动窃取手机号、相册、银行卡信息。</p>
      <p><strong>2. 不填任何信息</strong><br>钓鱼网页通常仿冒银行、支付宝、运营商，索要身份证、银行卡号、密码、验证码，一律拒绝填写。</p>
      <p><strong>3. 立即删除消息</strong><br>短信：直接删除短信，拉黑发送号码；社交软件：删除聊天消息、拉黑对方，退出陌生群聊。</p>
      <p><strong>4. 附带刷单/返利链接直接判定诈骗</strong><br>搭配“刷单返利、提现、领补贴、账户解冻”的链接100%是诈骗，切勿注册APP、充值。</p>
      <p><strong>5. 已误点补救</strong><br>立刻关闭网页，不要下载页面内任何软件；检查手机有无陌生APP，全部卸载；修改微信、支付宝、银行卡支付密码；收到陌生验证码一概不透露。</p>
      <p><strong>6. 举报渠道</strong><br>短信链接：运营商短信举报；微信/QQ：长按消息选择举报→诈骗；可疑被骗咨询：96110反诈专线。</p>
    `
  };

  function attachKbClickHandlers() {
    document.querySelectorAll('.kb__item').forEach(item => {
      // 避免重复绑定
      if (item.dataset.listener) return;
      item.dataset.listener = 'true';
      item.addEventListener('click', (e) => {
        const qElement = item.querySelector('.kb__q');
        if (!qElement) return;
        const question = qElement.textContent.trim();
        const detailHtml = detailMap[question];
        if (detailHtml) {
          modalTitle.textContent = question;
          modalBody.innerHTML = detailHtml;
          openModal();
        } else {
          console.warn('未找到详细内容:', question);
        }
      });
    });
  }

  function openModal() {
    if (modal) modal.classList.add('is-open');
  }
  function closeModal() {
    if (modal) modal.classList.remove('is-open');
  }
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal(); });

  // ===== AI Drawer 功能 =====
  const aiFab = $("aiFab");
  const aiDrawer = $("aiDrawer");
  const backdrop = $("backdrop");
  function openAi() { aiDrawer?.classList.add("is-open"); backdrop?.classList.add("is-show"); aiDrawer?.setAttribute("aria-hidden", "false"); backdrop?.setAttribute("aria-hidden", "false"); }
  function closeAi() { aiDrawer?.classList.remove("is-open"); backdrop?.classList.remove("is-show"); aiDrawer?.setAttribute("aria-hidden", "true"); backdrop?.setAttribute("aria-hidden", "true"); }
  aiFab?.addEventListener("click", openAi);
  on("closeAiBtn", "click", closeAi);
  backdrop?.addEventListener("click", closeAi);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAi(); });
  on("copyContextBtn", "click", async () => {
    const ctx = ["【当前场景】" + (storyTitle?.textContent || ""), storyBody?.textContent || "", "【可疑URL】" + (urlInput?.value || ""), "【可疑文本】" + (textInput?.value || ""), "【我希望你做】请识别诈骗特征，给出风险等级与应对步骤，并生成劝阻话术与举报建议。"].join("\n\n");
    await copyText(ctx);
  });

  // ===== Workflow YML & Dify 配置 =====
  const loadWorkflowBtn = $("loadWorkflowBtn");
  const workflowFileInput = document.getElementById("workflowFileInput");
  const workflowNameEl = $("workflowName");
  function updateWorkflowNameDisplay(label = "") { if (workflowNameEl) workflowNameEl.textContent = label || (difyWorkflowYml ? "已加载 YML" : ""); }
  updateWorkflowNameDisplay();
  async function loadEmbeddedWorkflowYml() { try { const response = await fetch(embeddedWorkflowUrl, { cache: "no-store" }); if (!response.ok) return; const text = await response.text(); if (!text.trim()) return; difyWorkflowYml = text; localStorage.setItem("DIFY_WORKFLOW_YML", text); updateWorkflowNameDisplay("已加载内置 YML"); } catch (error) { console.warn("工作流 YML 自动加载失败：", error); } }
  loadEmbeddedWorkflowYml();
  loadWorkflowBtn?.addEventListener("click", () => workflowFileInput?.click());
  const openConfigBtn = $("openConfigBtn");
  const difyConfigPanel = $("difyConfigPanel");
  const cfgBaseUrl = $("cfgBaseUrl");
  const cfgProKey = $("cfgProKey");
  const saveDifyConfigBtn = $("saveDifyConfigBtn");
  const cancelDifyConfigBtn = $("cancelDifyConfigBtn");
  function showDifyConfigPanel() { if (!difyConfigPanel) return; cfgBaseUrl.value = localStorage.getItem("DIFY_BASE_URL") || difyConfig.baseUrl || "https://api.dify.ai"; cfgProKey.value = localStorage.getItem("DIFY_PRO_API_KEY") || ""; difyConfigPanel.style.display = "block"; }
  function hideDifyConfigPanel() { if (difyConfigPanel) difyConfigPanel.style.display = "none"; }
  openConfigBtn?.addEventListener("click", () => showDifyConfigPanel());
  cancelDifyConfigBtn?.addEventListener("click", () => hideDifyConfigPanel());
  saveDifyConfigBtn?.addEventListener("click", () => { const b = (cfgBaseUrl?.value || "").trim(); const k = (cfgProKey?.value || "").trim(); if (b) localStorage.setItem("DIFY_BASE_URL", b); if (k) localStorage.setItem("DIFY_PRO_API_KEY", k); alert("已保存 DIFY 配置（存入 localStorage），下次请求将优先使用 DIFY_PRO_API_KEY。\n若页面已打开，请刷新后生效。"); hideDifyConfigPanel(); if (workflowNameEl) workflowNameEl.textContent = "已加载 YML"; });
  workflowFileInput?.addEventListener("change", async () => { const f = workflowFileInput.files && workflowFileInput.files[0]; if (!f) return; try { const txt = await f.text(); difyWorkflowYml = txt; localStorage.setItem("DIFY_WORKFLOW_YML", txt); if (workflowNameEl) workflowNameEl.textContent = f.name; alert("已加载工作流 YML（保存在 localStorage）。"); } catch (e) { alert("读取 YML 文件失败：" + (e?.message || e)); } finally { workflowFileInput.value = ""; } });

  // ===== Chat Interface =====
  const chatMessages = $("chatMessages");
  const chatInput = $("chatInput");
  const chatSendBtn = $("chatSendBtn");
  const chatAttachBtn = $("chatAttachBtn");
  const chatAttachmentsPreview = $("chatAttachmentsPreview");
  const mediaFileInput = $("mediaFileInput");
  let pendingFiles = [];
  function appendAiMsg(html) { if (!chatMessages) return; const el = document.createElement("div"); el.className = "chat-msg chat-msg--ai"; el.innerHTML = `<div class="chat-msg__avatar">AI</div><div class="chat-msg__bubble">${html}</div>`; chatMessages.appendChild(el); chatMessages.scrollTop = chatMessages.scrollHeight; }
  function appendUserMsg(text, files) { if (!chatMessages) return; const el = document.createElement("div"); el.className = "chat-msg chat-msg--user"; let mediaHtml = ""; if (files.length) { const thumbs = files.map((f) => { const url = URL.createObjectURL(f); if (f.type.startsWith("image/")) return `<img src="${url}" class="chat-media-thumb__img" alt="${escapeHtml(f.name)}" onload="URL.revokeObjectURL(this.src)">`; if (f.type.startsWith("video/")) return `<video src="${url}" class="chat-media-thumb__video" controls preload="metadata"></video>`; return `<span class="chat-media-thumb__file">📄 ${escapeHtml(f.name)}</span>`; }).join(""); mediaHtml = `<div class="chat-media-thumb">${thumbs}</div>`; } el.innerHTML = `<div class="chat-msg__bubble">${text ? `<div>${escapeHtml(text)}</div>` : ""}${mediaHtml}</div><div class="chat-msg__avatar">我</div>`; chatMessages.appendChild(el); chatMessages.scrollTop = chatMessages.scrollHeight; }
  function appendThinkingMsg() { if (!chatMessages) return null; const el = document.createElement("div"); el.className = "chat-msg chat-msg--ai"; el.innerHTML = `<div class="chat-msg__avatar">AI</div><div class="chat-msg__bubble"><span class="chat-thinking-dots"><span>.</span><span>.</span><span>.</span></span></div>`; chatMessages.appendChild(el); chatMessages.scrollTop = chatMessages.scrollHeight; return el; }
  function renderPendingChips() { if (!chatAttachmentsPreview) return; if (!pendingFiles.length) { chatAttachmentsPreview.classList.add("is-hidden"); chatAttachmentsPreview.innerHTML = ""; return; } chatAttachmentsPreview.classList.remove("is-hidden"); chatAttachmentsPreview.innerHTML = pendingFiles.map((f, i) => `<div class="chat-attach-chip">${f.type.startsWith("image/") ? "🖼" : "📄"} <span>${escapeHtml(f.name)}</span><button class="chat-attach-chip__remove" data-idx="${i}" type="button" aria-label="移除附件">✕</button></div>`).join(""); chatAttachmentsPreview.querySelectorAll(".chat-attach-chip__remove").forEach((btn) => { btn.addEventListener("click", () => { pendingFiles.splice(Number(btn.dataset.idx), 1); renderPendingChips(); }); }); }
  async function uploadFileToDify(file, user) { const fd = new FormData(); fd.append("file", file); fd.append("user", user); const res = await fetch(`${difyBaseUrl}/v1/files/upload`, { method: "POST", headers: { Authorization: `Bearer ${difyApiKey}` }, body: fd }); const raw = await res.text(); if (!res.ok) throw new Error(`文件上传失败（HTTP ${res.status}）：${raw || "(empty)"}`); let data = null; try { data = raw ? JSON.parse(raw) : null; } catch {} const id = data?.id || data?.data?.id || data?.file_id || data?.data?.file_id; if (!id) throw new Error("文件上传接口未返回 file id：" + raw); return id; }
  function getFileBaseName(filename) { const name = String(filename || "media"); const idx = name.lastIndexOf("."); return idx > 0 ? name.slice(0, idx) : name; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  async function createStoryboardImageFromVideo(file) { const objectUrl = URL.createObjectURL(file); const video = document.createElement("video"); video.preload = "metadata"; video.muted = true; video.playsInline = true; video.src = objectUrl; try { await new Promise((resolve, reject) => { video.onloadedmetadata = () => resolve(); video.onerror = () => reject(new Error(`视频解码失败：${file.name || "未知文件"}`)); }); const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 8; const originW = Math.max(video.videoWidth || 1280, 320); const originH = Math.max(video.videoHeight || 720, 180); const ratio = originW / originH; const tileWidth = 360; const tileHeight = Math.max(180, Math.round(tileWidth / ratio)); const cols = 2; const rows = 2; const tileCount = cols * rows; const canvas = document.createElement("canvas"); canvas.width = tileWidth * cols; canvas.height = tileHeight * rows; const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("浏览器不支持 Canvas 上下文"); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, canvas.width, canvas.height); const timestamps = Array.from({ length: tileCount }, (_, i) => clamp(duration * (i + 1) / (tileCount + 1), 0, Math.max(duration - 0.08, 0))); for (let i = 0; i < timestamps.length; i++) { const t = timestamps[i]; await new Promise((resolve, reject) => { const onSeeked = () => { video.removeEventListener("seeked", onSeeked); video.removeEventListener("error", onError); resolve(); }; const onError = () => { video.removeEventListener("seeked", onSeeked); video.removeEventListener("error", onError); reject(new Error(`视频抽帧失败：${file.name}`)); }; video.addEventListener("seeked", onSeeked, { once: true }); video.addEventListener("error", onError, { once: true }); video.currentTime = clamp(t, 0, Math.max(duration - 0.04, 0)); }); const x = (i % cols) * tileWidth; const y = Math.floor(i / cols) * tileHeight; ctx.drawImage(video, x, y, tileWidth, tileHeight); ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(x + 8, y + 8, 86, 24); ctx.fillStyle = "#ffffff"; ctx.font = "bold 14px sans-serif"; ctx.fillText(`T+${Math.round(t)}s`, x + 14, y + 25); } const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("视频关键帧生成失败")), "image/jpeg", 0.86)); const fileName = `${getFileBaseName(file.name)}_storyboard.jpg`; return new File([blob], fileName, { type: "image/jpeg" }); } finally { URL.revokeObjectURL(objectUrl); video.src = ""; } }
  async function prepareWorkflowFiles(files, user) { const workflowFiles = []; for (const file of files) { let uploadTarget = file; if (file?.type?.startsWith("video/")) uploadTarget = await createStoryboardImageFromVideo(file); else if (!file?.type?.startsWith("image/")) throw new Error(`仅支持图片或视频上传，当前文件不支持：${file?.name || "未知文件"}`); const uploadFileId = await uploadFileToDify(uploadTarget, user); workflowFiles.push({ type: "image", transfer_method: "local_file", upload_file_id: uploadFileId }); } return workflowFiles; }
  function inferMoneyStatus(text) { const value = String(text || ""); if (/(已|已经|刚刚|马上)?(转账|转了|充值|付款|付了|汇款|打款)/.test(value)) return "已转账"; if (/(未|没|没有|还没|尚未|不用|不需要).{0,4}(转账|转了|充值|付款|汇款|打款)/.test(value)) return "未转账"; return "未说明"; }
  function normalizeWorkflowResponse(result) { const rawData = result?.data ?? result ?? {}; const outputs = rawData?.outputs ?? rawData?.answer ?? rawData?.result ?? {}; const answer = (typeof outputs === "string" && outputs) || outputs?.answer || outputs?.text || outputs?.result || rawData?.answer || ""; const status = rawData?.status || result?.status || ""; return { success: status ? status === "succeeded" || status === "completed" : Boolean(answer), answer: String(answer || "").trim(), outputs, rawOutput: rawData }; }
  async function callDifyWorkflow({ text = "", money_sent = "未说明", user = "web-user", files = [] } = {}) { const baseUrl = String(difyConfig.baseUrl || localStorage.getItem("DIFY_BASE_URL") || "https://api.dify.ai").replace(/\/+$/, "").replace(/\/v1$/, ""); const apiKey = String(difyConfig.apiKey || localStorage.getItem("DIFY_PRO_API_KEY") || localStorage.getItem("DIFY_API_KEY") || "").trim(); if (!apiKey) throw new Error("请先配置 DIFY_PRO_API_KEY 或 DIFY_API_KEY"); const workflowFiles = files && files.length > 0 ? await prepareWorkflowFiles(files, user) : []; const payload = { inputs: { text: String(text || ""), money_sent: String(money_sent || "未说明"), files_user: workflowFiles }, response_mode: "blocking", user: String(user || "web-user") }; const response = await fetch(`${baseUrl}/v1/workflows/run`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, mode: "cors", body: JSON.stringify(payload) }); const rawText = await response.text(); let result = null; try { result = rawText ? JSON.parse(rawText) : null; } catch { result = { rawText }; } if (!response.ok) throw new Error(`HTTP ${response.status}: ${result?.message || result?.msg || rawText || "请求失败"}`); return normalizeWorkflowResponse(result); }
  async function sendChatMessage() { const text = (chatInput?.value || "").trim(); const files = [...pendingFiles]; if (!text && !files.length) return; chatInput.value = ""; chatInput.style.height = "auto"; pendingFiles = []; renderPendingChips(); appendUserMsg(text, files); const thinking = appendThinkingMsg(); try { const result = await callDifyWorkflow({ text, money_sent: inferMoneyStatus(text), user: "front1-web-user", files }); thinking?.remove(); if (result?.answer) {
    appendAiMsg(`<div>${escapeHtml(result.answer).replace(/\n/g, "<br>")}</div>`);
} else if (result?.outputs) { appendAiMsg(`<div class="chat-section-title">ℹ️ 工作流执行完成</div><div>返回数据格式：</div><pre style="background:#f5f5f5;padding:12px;border-radius:6px;overflow:auto;max-height:300px;font-size:12px;">${escapeHtml(JSON.stringify(result.outputs, null, 2))}</pre>`); } else { appendAiMsg("工作流已执行，但未返回可展示的 answer 字段。"); } } catch (err) { thinking?.remove(); const baseMsg = String(err?.message || err || "未知错误"); let errorHtml = escapeHtml(baseMsg).replace(/\n/g, "<br>"); if (baseMsg.includes("API Key") || baseMsg.includes("配置")) errorHtml += `<br><br>请先配置 DIFY_PRO_API_KEY（优先）或 DIFY_API_KEY 和 DIFY_BASE_URL。`; else if (baseMsg.includes("CORS") || baseMsg.includes("NetworkError")) errorHtml += `<br><br>请检查：<br>1. Base URL 是否正确<br>2. Dify 是否允许跨域（CORS）<br>3. 是否启用 HTTPS`; appendAiMsg(`<div class="chat-section-title">❌ 调用失败</div><div style="white-space:normal;word-break:break-word;">${errorHtml}</div><div style="margin-top:12px;padding:12px;background:#fff3cd;border-radius:6px;border:1px solid #ffeaa7;"><strong>排查建议：</strong><br>1. 去 Dify 控制台查看该次运行的日志<br>2. 确认开始节点变量名与类型<br>3. Base URL 通常是 https://api.dify.ai</div>`); } }
  chatAttachBtn?.addEventListener("click", () => mediaFileInput?.click());
  mediaFileInput?.addEventListener("change", () => { Array.from(mediaFileInput.files || []).forEach((f) => pendingFiles.push(f)); renderPendingChips(); mediaFileInput.value = ""; });
  chatInput?.addEventListener("input", () => { chatInput.style.height = "auto"; chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + "px"; });
  chatInput?.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } });
  chatSendBtn?.addEventListener("click", sendChatMessage);
  appendAiMsg(`${escapeHtml(pageContent.drawer.welcome).replace(/\n/g, "<br>")}<br><span class="chat-hint">${escapeHtml(pageContent.drawer.hint)}</span>`);

  // ===== Utils =====
  async function copyText(text) { const content = String(text || ""); if (!content.trim()) return; try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(content); alert("已复制，可直接粘贴给 AI。"); return; } } catch {} const ta = document.createElement("textarea"); ta.value = content; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.left = "-9999px"; document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, ta.value.length); const ok = document.execCommand("copy"); document.body.removeChild(ta); alert(ok ? "已复制，可直接粘贴给 AI。" : "复制失败，请手动复制。"); }
  function escapeHtml(str) { return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  window.__openAi = openAi;
});
// ==================== 全新反诈闯关模块 ====================
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGameModule);
    } else {
        initGameModule();
    }

    function initGameModule() {
        // ---------- 积分系统 ----------
        let currentPoints = parseInt(localStorage.getItem('antiFraudPoints') || '0');
        const pointsSpan = document.getElementById('totalPoints');
        function updatePointsUI() { if(pointsSpan) pointsSpan.innerText = currentPoints; }
        updatePointsUI();

        function addPoints(amount) {
            currentPoints += amount;
            localStorage.setItem('antiFraudPoints', currentPoints);
            updatePointsUI();
        }

        // ---------- 十大反诈类型 ----------
        const fraudTypes = [
            "冒充公检法诈骗", "刷单返利诈骗", "虚假投资理财诈骗", "冒充电商物流客服诈骗",
            "杀猪盘（婚恋交友诈骗）", "虚假征信（注销校园贷）诈骗", "机票退改签诈骗",
            "共享屏幕诈骗", "AI换脸/拟声诈骗", "虚假购物服务诈骗"
        ];

        // 为每个类型准备3道不同的题目（场景描述、正确选项文本、错误选项文本）
        // 题库结构：type -> array of { question, correctAnswer, wrongAnswer }
        const questionBank = {};

        // 定义各类型的题目（每个类型3题，从真实话术中提取）
        const questionData = {
            "冒充公检法诈骗": [
                { question: "接到自称“公安局”的电话，说你涉嫌洗钱，要求将钱转入“安全账户”验证。你应该？", correct: "立即挂断电话，拨打110或96110核实，绝不转账。", wrong: "为了证明清白，按照对方要求转账到指定账户。" },
                { question: "对方发来一张“通缉令”，要求你配合调查并保密，否则会牵连家人。你该怎么做？", correct: "通缉令是伪造的，公检法不会网上发通缉令，直接挂断并报警。", wrong: "害怕家人受牵连，按对方指示下载软件并转账。" },
                { question: "电话里“民警”说你的身份信息被冒用贷款，需要你提供验证码注销账户。你该？", correct: "验证码绝不能给任何人，挂断电话并报警。", wrong: "赶紧提供验证码，让“民警”帮忙处理。" }
            ],
            "刷单返利诈骗": [
                { question: "看到“日结500元，动动手指”的兼职广告，第一单返利10元。接下来对方让你做大额“联单”，你会？", correct: "立即停止，所有刷单垫资都是诈骗，保存证据报警。", wrong: "为了拿回本金，继续做联单任务。" },
                { question: "刷单群里大家都在晒高额收益截图，催促你继续投钱。你应该？", correct: "群里全是托，果断退群并举报。", wrong: "跟风继续投钱，相信能赚大钱。" },
                { question: "对方说账户被冻结，需要交解冻费才能提现，你怎么办？", correct: "这是连环骗局，不再转账，立即报警。", wrong: "交解冻费试试看。" }
            ],
            "虚假投资理财诈骗": [
                { question: "网友推荐一款“稳赚不赔”的理财APP，群里都在晒盈利截图。你会？", correct: "拒绝任何“稳赚不赔”投资，只通过正规金融机构理财。", wrong: "下载APP并充值，抓住赚钱机会。" },
                { question: "“投资老师”称有内幕消息，让你跟着买指定股票，收益极高。你该？", correct: "内幕消息是谎言，不轻信，不转账。", wrong: "跟着老师投入全部积蓄。" },
                { question: "你发现账户盈利但无法提现，客服说要交保证金。你怎么办？", correct: "这是诈骗，停止转账并报警。", wrong: "交保证金尝试提现。" }
            ],
            "冒充电商物流客服诈骗": [
                { question: "接到“客服”电话，说你买的商品有质量问题，要双倍退款，需要你提供验证码。你该？", correct: "挂断电话，通过官方APP联系客服核实。", wrong: "提供验证码以便快速退款。" },
                { question: "对方称你误开了会员，每月扣费，要帮你取消，让你下载会议软件。你会？", correct: "不下载任何软件，挂断并自行联系官方客服。", wrong: "下载软件配合取消。" },
                { question: "“快递客服”说包裹丢失，要赔偿你200元，让你扫描二维码填写信息。你该？", correct: "不扫陌生二维码，通过购物平台官方渠道处理。", wrong: "扫码填写银行卡信息。" }
            ],
            "杀猪盘（婚恋交友诈骗）": [
                { question: "网恋对象发现博彩网站漏洞，带你一起赚钱，让你投钱。你该？", correct: "这是杀猪盘骗局，绝不转账，拉黑对方。", wrong: "相信恋人，投钱试试。" },
                { question: "对方借口家人生病急需用钱，让你转账。你如何应对？", correct: "拒绝转账，要求视频通话验证，并与亲友商量。", wrong: "立刻转账帮助对方。" },
                { question: "对方一直拒绝视频或见面，却频繁索要礼物和钱。你该？", correct: "怀疑是骗子，停止联系并举报。", wrong: "继续满足要求，相信对方。" }
            ],
            "虚假征信（注销校园贷）诈骗": [
                { question: "接到电话说你大学期间注册的校园贷未注销，会影响征信，让你转账消除记录。你该？", correct: "个人征信无法人为修改，挂断并报警。", wrong: "按要求转账到“安全账户”注销。" },
                { question: "对方能准确报出你的姓名和学校，要求你在各网贷平台贷款后转给他。你会？", correct: "绝不贷款转账，通过官方渠道查询征信。", wrong: "担心征信受损，按对方操作。" },
                { question: "“客服”称可以帮你修复征信，收取手续费。你如何做？", correct: "征信无法修复，这是骗局，拒绝并举报。", wrong: "支付手续费尝试修复。" }
            ],
            "机票退改签诈骗": [
                { question: "收到航班取消短信，称点击链接可领300元延误险。你会？", correct: "不点链接，通过航空公司官方电话核实。", wrong: "点击链接填写信息领取赔偿。" },
                { question: "“客服”让你下载APP并开启屏幕共享指导理赔。你该？", correct: "绝不开启屏幕共享，挂断并自行联系航司。", wrong: "下载APP并共享屏幕。" },
                { question: "对方说退款失败，需要你提供银行卡号和验证码。你怎么办？", correct: "不提供任何信息，这是诈骗。", wrong: "提供信息以便快速退款。" }
            ],
            "共享屏幕诈骗": [
                { question: "“快递客服”称包裹丢失，要理赔并让你下载会议软件开启屏幕共享。你该？", correct: "绝不开启屏幕共享，挂断并自行联系快递公司。", wrong: "下载软件并共享屏幕。" },
                { question: "对方说你的百万保障险到期，需屏幕共享指导关闭。你会？", correct: "任何要求屏幕共享的都是诈骗，直接挂断。", wrong: "配合对方开启屏幕共享。" },
                { question: "你开启了屏幕共享后，对方让你输入银行卡密码。此时你该？", correct: "立即关闭共享，检查账户，并报警。", wrong: "继续输入密码。" }
            ],
            "AI换脸/拟声诈骗": [
                { question: "突然接到“儿子”视频通话，画面和声音都一样，让你立刻转钱。你该？", correct: "挂断后拨打儿子原号码核实，不转账。", wrong: "看到视频是真的，立刻转账。" },
                { question: "“领导”微信视频要求你转账到公司新账户。你会？", correct: "通过原有电话或当面核实，不轻信视频。", wrong: "按领导要求转账。" },
                { question: "对方在视频中做不出你要求的指定动作，却催促转账。你怎么办？", correct: "确认是AI换脸诈骗，拒绝转账并报警。", wrong: "相信对方，继续转账。" }
            ],
            "虚假购物服务诈骗": [
                { question: "二手平台看到低价手机，卖家要求加微信私下交易再便宜200元。你该？", correct: "坚持平台交易，不私下转账。", wrong: "加微信私下转账，贪图便宜。" },
                { question: "对方发来一个“官方代购”链接，价格比市场价低一半。你会？", correct: "不点击不明链接，只通过正规电商购买。", wrong: "点击链接下单。" },
                { question: "付款后卖家迟迟不发货并拉黑你。你该怎么做？", correct: "保存聊天和转账记录，立即报警。", wrong: "自认倒霉，不追究。" }
            ]
        };

        // 初始化题库（确保每个类型有3题）
        for (let type of fraudTypes) {
            if (questionData[type]) {
                questionBank[type] = questionData[type];
            } else {
                // 兜底默认题目
                questionBank[type] = [
                    { question: `请判断以下哪种应对${type}是正确的？`, correct: "保持警惕，通过官方渠道核实，不转账不透露验证码。", wrong: "相信对方，按要求操作。" },
                    { question: `遇到${type}，以下哪种行为最安全？`, correct: "挂断电话，拨打110或96110咨询。", wrong: "按照对方指示提供个人信息。" },
                    { question: `以下哪项是${type}的正确识别方法？`, correct: "任何要求转账到“安全账户”的都是诈骗。", wrong: "相信对方是公职人员，配合调查。" }
                ];
            }
        }

        // 存储每个类型的进度（连续答对计数，当前题目索引）
        let typeProgress = {};
        function loadProgress() {
            const saved = localStorage.getItem('fraudGameProgress');
            if (saved) {
                try {
                    typeProgress = JSON.parse(saved);
                } catch(e) {}
            }
            // 确保每个类型都有记录
            for (let type of fraudTypes) {
                if (!typeProgress[type]) {
                    typeProgress[type] = { streak: 0, questionIndex: 0 };
                }
            }
        }
        function saveProgress() {
            localStorage.setItem('fraudGameProgress', JSON.stringify(typeProgress));
        }
        loadProgress();

        // 法律后果映射
        const legalConsequences = {
            "冒充公检法诈骗": "📜 法律依据：《刑法》第266条诈骗罪。若被骗转账，资金难追回，可能被利用洗钱，数额较大可处三年以下有期徒刑。",
            "刷单返利诈骗": "📜 违反《反不正当竞争法》《刑法》。参与刷单违法，被骗后资金追回率极低，还可能涉嫌帮助信息网络犯罪活动罪。",
            "虚假投资理财诈骗": "📜 依据《刑法》第266条，此类平台涉嫌集资诈骗。受害人损失惨重，且非法平台多在境外，追赃困难。",
            "冒充电商物流客服诈骗": "📜 泄露验证码后通常遭受盗刷，依据法律规定，银行不承担责任，损失自担。",
            "杀猪盘（婚恋交友诈骗）": "📜 依据《刑法》第266条，最高可判无期徒刑。受害人往往情感钱财双失。",
            "虚假征信（注销校园贷）诈骗": "📜 受害人背上巨债，骗子面临严厉刑罚，但受害人自愿转账追回难度大，征信也无法修复。",
            "机票退改签诈骗": "📜 违反《刑法》，受害人损失通常无法通过航空公司追回，破案率较低。",
            "共享屏幕诈骗": "📜 共享屏幕导致银行卡信息泄露，符合诈骗罪，但个人疏忽往往无法获得全额赔付。",
            "AI换脸/拟声诈骗": "📜 新型诈骗，依照《刑法》诈骗罪从重处罚。受害人基于“熟人”信任转账，损失大。",
            "虚假购物服务诈骗": "📜 依据《刑法》第266条，此类案件多发，举证困难，钱款难追回。"
        };

        // 全局变量
        let currentMode = null;   // 'random' 或 'free'
        let currentType = null;   // 当前正在答题的类型
        const gameArea = document.getElementById('gameArea');
        const randomBtn = document.getElementById('randomModeBtn');
        const freeBtn = document.getElementById('freeModeBtn');

        // 渲染自主模式：显示所有类型卡片
        function renderTypeList() {
    if (!gameArea) return;
    let html = `<div class="types-grid">`;
    for (let type of fraudTypes) {
        html += `
            <div class="type-card" data-type="${type}">
                <div class="type-card__name">${type}</div>
            </div>
        `;
    }
    html += `</div>`;
    gameArea.innerHTML = html;
    // 绑定卡片点击事件
    document.querySelectorAll('.type-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            startQuiz(type, 'free');
        });
    });
}

        // 开始答题（type: 诈骗类型, mode: 'random' 或 'free')
        function startQuiz(type, mode) {
            currentMode = mode;
            currentType = type;
            renderQuiz();
        }

        // 渲染答题界面
        function renderQuiz() {
            if (!gameArea || !currentType) return;
            const progress = typeProgress[currentType];
            const questions = questionBank[currentType];
            const currentQ = questions[progress.questionIndex];
            if (!currentQ) {
                // 防御：重置索引
                progress.questionIndex = 0;
                saveProgress();
                renderQuiz();
                return;
            }
            const html = `
                <div class="quiz-area">
                    <div class="quiz-header">
                        <div class="current-type-badge">📌 ${currentType}</div>
                        <div class="counter-badge">✅ 连续答对: ${progress.streak} / 3</div>
                    </div>
                    <div class="question-text">${escapeHtml(currentQ.question)}</div>
                    <div class="options">
                        <button class="opt-btn" data-choice="correct">A. ${escapeHtml(currentQ.correct)}</button>
                        <button class="opt-btn" data-choice="wrong">B. ${escapeHtml(currentQ.wrong)}</button>
                    </div>
                    <div class="back-to-list">
                        <button id="backToTypeListBtn">← 返回类型列表</button>
                    </div>
                </div>
            `;
            gameArea.innerHTML = html;
            // 绑定选项事件
            document.querySelectorAll('.opt-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const choice = btn.dataset.choice;
                    const isCorrect = (choice === 'correct');
                    handleAnswer(currentType, isCorrect);
                });
            });
            const backBtn = document.getElementById('backToTypeListBtn');
            if (backBtn) backBtn.addEventListener('click', () => {
                if (currentMode === 'free') {
                    renderTypeList();
                    currentType = null;
                } else if (currentMode === 'random') {
                    // 随机模式返回后重新显示自主模式列表（或重新选择模式）
                    renderTypeList();
                    currentMode = 'free';
                    currentType = null;
                }
            });
        }

        function handleAnswer(type, isCorrect) {
            const progress = typeProgress[type];
            if (isCorrect) {
                progress.streak++;
                // 答对后，移动到下一题（不同题目）
                const questions = questionBank[type];
                if (progress.streak >= 3) {
                    // 闯关成功
                    addPoints(10);
                    alert(`🎉 闯关成功！获得10积分！你已连续答对3道${type}题目。`);
                    // 重置该类型的进度
                    progress.streak = 0;
                    progress.questionIndex = 0;
                    saveProgress();
                    // 成功后可选择返回列表或继续同类型（重置后重新开始）
                    if (currentMode === 'free') {
                        renderTypeList();
                        currentType = null;
                    } else if (currentMode === 'random') {
                        renderTypeList();
                        currentMode = 'free';
                        currentType = null;
                    }
                } else {
                    // 答对但未满3次：移动到下一题（不同索引）
                    let nextIndex = progress.questionIndex + 1;
                    if (nextIndex >= questions.length) {
                        // 如果当前类型题目不够3道，循环使用（但应保证每个类型至少3题）
                        nextIndex = 0;
                    }
                    progress.questionIndex = nextIndex;
                    saveProgress();
                    renderQuiz(); // 刷新显示新题目
                }
            } else {
                // 答错：连续计数归零，题目索引重置为0
                const law = legalConsequences[type] || "📜 违反《刑法》第266条，将面临刑事处罚。";
                alert(`❌ 回答错误！你已落入诈骗陷阱。\n\n${law}`);
                progress.streak = 0;
                progress.questionIndex = 0;
                saveProgress();
                if (currentMode === 'free') {
                    renderTypeList();
                    currentType = null;
                } else if (currentMode === 'random') {
                    renderTypeList();
                    currentMode = 'free';
                    currentType = null;
                }
            }
        }

        // 随机模式：随机选一个类型开始答题
        function startRandomMode() {
            const randomIndex = Math.floor(Math.random() * fraudTypes.length);
            const randomType = fraudTypes[randomIndex];
            currentMode = 'random';
            startQuiz(randomType, 'random');
        }

        // 绑定按钮事件
        if (randomBtn) {
            randomBtn.addEventListener('click', () => {
                startRandomMode();
            });
        }
        if (freeBtn) {
            freeBtn.addEventListener('click', () => {
                renderTypeList();
                currentMode = 'free';
                currentType = null;
            });
        }

        // 初始化默认显示自主模式的类型列表
        renderTypeList();
        currentMode = 'free';

        function escapeHtml(str) {
            return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
        }
    }
})();