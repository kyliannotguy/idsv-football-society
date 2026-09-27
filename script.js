const dialog = document.querySelector('#detail-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogBody = document.querySelector('#dialog-body');
let currentLang = 'zh';
const copy = {
  zh: {
    nav: ['关于社团', '文章档案', '主队看台', '转会实验室 ↗'], join: '加入社团',
    heroTitle: '从一场比赛，<br /><em>读懂更大的世界。</em>', heroLede: '北京101中学足球社团。我们观察比赛，也分享球队、球员与球迷的故事。', heroPrimary: '阅读社团文章', heroSecondary: '了解我们',
    ticker: ['FOOTBALL · ANALYSIS · CULTURE', '一零一赛后情书', '在101，看见足球的更多可能', 'FOOTBALL · ANALYSIS · CULTURE'],
    aboutTitle: '一群认真看球的<br /><em>学生。</em>', aboutBody: '我们是北京101中学的足球社团，因对比赛、球队与球迷文化的共同兴趣相聚。社团成员支持不同的主队，来自皇马、巴萨、英超球队、德甲球队、米兰双雄，以及北京国安、山东泰山等21支主队。我们分享比赛观察、球队故事和个人观点，让不同的立场在同一片看台相遇。公众号“一零一赛后情书”记录社团里的足球故事，也欢迎每一位认真看球的人加入讨论。', stats: ['群成员', '主队档案'],
    journalTitle: '最新的<br /><em>观察。</em>', journalNote: '公众号原创文章', accountLabel: 'WECHAT / 我们的公众号', accountBody: '把对足球的热爱，写成赛后的每一封情书。', accountButton: '查看公众号',
    teamsTitle: '不同主队，<br /><em>同一片看台。</em>', joinTitle: '下一篇文章，<br /><em>由你开始。</em>', joinBody: '欢迎喜爱足球、愿意分享观点与故事的同学加入。', joinButton: '扫码加入群聊',
    weeklyTitle: '欧洲每周<br /><em>最佳球员</em>', weeklyNote: '谁改变了这一周的比赛？从关键扑救到最后一传，我们关注每个位置的价值，让数据与比赛观察共同发声。', weeklyAction: '加入评选讨论',
    footer: '足球 · 分析 · 文化', close: '关闭详情'
  },
  en: {
    nav: ['About', 'Journal', 'Our Colours', 'Transfer Lab ↗'], join: 'Join us',
    heroTitle: 'Read the world<br /><em>through the game.</em>', heroLede: 'A football society at Beijing 101 High School, sharing stories about matches, clubs, players and supporters.', heroPrimary: 'Read our journal', heroSecondary: 'About us',
    ticker: ['FOOTBALL · ANALYSIS · CULTURE', '一零一赛后情书', 'SEE MORE IN THE GAME AT 101', 'FOOTBALL · ANALYSIS · CULTURE'],
    aboutTitle: 'Students who<br /><em>love the game.</em>', aboutBody: 'We are a football society at Beijing 101 High School, brought together by a shared interest in matches, clubs and supporter culture. Our members support 21 different clubs, from Real Madrid, Barcelona and English and German sides to the Milan clubs, Beijing Guoan and Shandong Taishan. We share match observations, club stories and personal viewpoints, while the WeChat account 一零一赛后情书 records stories from our football community.', stats: ['Group members', 'Club profiles'],
    journalTitle: 'The latest<br /><em>observations.</em>', journalNote: 'Original articles on WeChat', accountLabel: 'WECHAT / OUR OFFICIAL ACCOUNT', accountBody: 'Football stories, observations and conversations from our community.', accountButton: 'Explore our account',
    teamsTitle: 'Different clubs,<br /><em>one stand.</em>', joinTitle: 'The next story<br /><em>starts with you.</em>', joinBody: 'Students who enjoy football and want to share their views and stories are welcome.', joinButton: 'View group QR code',
    weeklyTitle: 'European<br /><em>Player of the Week</em>', weeklyNote: 'Who changed the game this week? From a decisive save to the final pass, we look at the value of every position through data and match observation.', weeklyAction: 'Join the award discussion',
    footer: 'FOOTBALL · ANALYSIS · CULTURE', close: 'Close details'
  }
};
const dialogs = { zh: {}, en: {} };
function set(selector, html) { const node = document.querySelector(selector); if (node) node.innerHTML = html; }
function setAll(selector, values) { document.querySelectorAll(selector).forEach((node, i) => { if (values[i] !== undefined) node.innerHTML = values[i]; }); }
function arrow(text, symbol = '↗') { return `${text} <span>${symbol}</span>`; }
function applyLang(language) {
  const lang = language === 'en' ? 'en' : 'zh'; currentLang = lang; const t = copy[lang];
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.title = lang === 'en' ? '101 FOOTBALL SOCIETY · Beijing 101 High School' : '101 FOOTBALL SOCIETY · 北京101中学';
  document.querySelector('meta[name="description"]').content = lang === 'en' ? 'Football society at Beijing 101 High School.' : '北京101中学足球社团';
  setAll('.nav a', t.nav); set('.join-button', arrow(t.join));
  set('.hero h1', t.heroTitle); set('.hero-lede', t.heroLede); set('.hero .button-dark', arrow(t.heroPrimary, '→')); set('.hero .text-link', arrow(t.heroSecondary));
  set('.ticker-track', t.ticker.map(item => `<span>${item}</span>`).join(''));
  set('#about h2', t.aboutTitle); set('#about .stats-content>p:first-child', t.aboutBody); setAll('.stat-grid span', t.stats);
  set('#weekly h2', t.weeklyTitle); set('#weekly .player-note', t.weeklyNote); set('#weekly .button-light', arrow(t.weeklyAction, '→'));
  set('#journal h2', t.journalTitle); set('#journal .feature-head .content-note', t.journalNote); set('.account-copy .mini-label', t.accountLabel); set('.account-copy>p:last-child', t.accountBody); set('.account-button', arrow(t.accountButton));
  set('#teams h2', t.teamsTitle); set('#join h2', t.joinTitle); set('#join .join-side p', t.joinBody); set('#join .button-light', arrow(t.joinButton)); set('.footer>span:nth-child(2)', t.footer);
  document.querySelector('.nav').setAttribute('aria-label', lang === 'en' ? 'Main navigation' : '主导航'); document.querySelector('.lang-switch').setAttribute('aria-label', lang === 'en' ? 'Language' : '语言选择'); document.querySelector('.dialog-close').setAttribute('aria-label', t.close);
  document.querySelectorAll('.lang-button').forEach(button => { const on = button.dataset.lang === lang; button.classList.toggle('is-active', on); button.setAttribute('aria-pressed', String(on)); });
  if (dialog.open) dialog.close(); document.dispatchEvent(new CustomEvent('site:languagechange'));
}
function openDetail(heading, html) { dialogTitle.textContent = heading; dialogBody.innerHTML = html; dialog.showModal(); }
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => { const item = dialogs[currentLang][button.dataset.dialog]; if (item) openDetail(...item); }));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });
document.querySelectorAll('.lang-button').forEach(button => button.addEventListener('click', () => { applyLang(button.dataset.lang); try { localStorage.setItem('101-football-language', currentLang); } catch {} }));
let saved = 'zh'; try { saved = localStorage.getItem('101-football-language') || 'zh'; } catch {} applyLang(saved);
