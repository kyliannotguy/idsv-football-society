(() => {
  const leagues = {
    eng: ['英格兰', 'England'], esp: ['西班牙', 'Spain'], ger: ['德国', 'Germany'],
    ita: ['意大利', 'Italy'], fra: ['法国', 'France'], ned: ['荷兰', 'Netherlands'],
    ksa: ['沙特', 'Saudi Arabia'], usa: ['美国', 'USA'], chn: ['中国', 'China']
  };
  const clubs = window.SOCIETY_CLUBS;
  const translations = {
    zh: {
      lifeTitle: '比赛之外，<br /><em>我们也在场。</em>',
      lifeIntro: '每周根据重要赛事安排线上与线下观赛，在讨论中交换视角，把好问题写成文章。',
      photoReference: '摄影参考 · 非本校实拍',
      pitchCaption: '从球场开始，保持好奇。', discussionCaption: '一场比赛，让不同的想法相遇。',
      photoChoice: '这里适合放入你们的球场照、集体观赛照和赛后讨论照。', photoGuide: '查看照片选择建议 ↗',
      watchTitle: '一起看球', watchBody: '围绕每周重要赛事安排线上与线下观赛。让不同主队的球迷坐在同一片看台。',
      discussTitle: '带着问题讨论', discussBody: '战术为什么奏效？数据遗漏了什么？从比赛出发，延伸到历史、经济与文化。',
      writeTitle: '把观点写下来', writeBody: '用文章记录观察与证据。已发布作品集中在公众号，让讨论留下可以回看的文字。',
      teamNote: '21支主队均来自群成员提供的名单。队徽来源：ESPN。',
      teamIntro: '160+位群友，21支主队。<br />从欧洲到亚洲与美洲，在101共享足球的热爱。',
      filters: ['全部', '英格兰', '西班牙', '德国', '意大利', '法国', '荷兰', '沙特', '美国', '中国'],
      filterLabel: '筛选球队', badge: '群友主队', additional: '群友主队', count: '支球队',
      pitchAlt: '绿色足球场上的足球与球员双脚，作为球场摄影参考',
      discussionAlt: '几位成年人围桌交流、使用笔记本电脑，作为社团讨论摄影参考',
      guideTitle: '简介照片 · 建议拍这三组',
      guideBody: '<p>主图选择真实的101校园球场，副图用同学们正在发生的交流，让网站有你们自己的生活感。</p><ol class="photo-guide-list"><li><strong>校园球场：</strong>放学后的自然光，横向拍摄球场、足球或场边同学。建议4:3构图，一侧留白，避免过多杂物。</li><li><strong>集体观赛：</strong>拍教室或公共活动空间里一起看球的侧面、背影或击掌瞬间。建议16:9横图，保留现场气氛。</li><li><strong>赛后讨论：</strong>拍围桌讨论、战术板、手写笔记或共同修改文章的过程。建议4:3构图，画面里有一个清晰的讨论中心。</li></ol><p>首页建议用“球场主图＋讨论副图”；观赛照适合后续活动回顾。尽量提供长边2000像素以上的原图。</p><p class="content-note">当前两张图片是Unsplash摄影参考，并非本校活动实拍。替换时选用已同意公开展示的同学照片。</p>'
    },
    en: {
      lifeTitle: 'Beyond the game,<br /><em>we belong.</em>',
      lifeIntro: 'We gather online and in person around the week’s key matches, exchange perspectives and turn good questions into articles.',
      photoReference: 'Photo reference · not our campus',
      pitchCaption: 'Start on the pitch. Stay curious.', discussionCaption: 'One game. More than one perspective.',
      photoChoice: 'A place for your campus pitch, shared match viewings and post-match discussions.', photoGuide: 'Explore photo suggestions ↗',
      watchTitle: 'Watch together', watchBody: 'Online and in-person viewings follow the week’s key fixtures. Different loyalties share the same stand.',
      discussTitle: 'Ask better questions', discussBody: 'Why did the tactic work? What did the numbers miss? Follow the game into history, economics and culture.',
      writeTitle: 'Put it into words', writeBody: 'Record observations and evidence. Our published work lives on WeChat, so a conversation becomes something we can revisit.',
      teamNote: 'All 21 clubs were confirmed by our community. Crest source: ESPN.',
      teamIntro: '160+ group members. 21 supported clubs.<br />From Europe to Asia and the Americas, a shared love of football at 101.',
      filters: ['All clubs', 'England', 'Spain', 'Germany', 'Italy', 'France', 'Netherlands', 'Saudi Arabia', 'USA', 'China'],
      filterLabel: 'Filter clubs', badge: 'Supported by members', additional: 'Supported by members', count: 'clubs',
      pitchAlt: 'A football and a player’s feet on a green pitch, used as a photography reference',
      discussionAlt: 'Adults discussing work around laptops, used as a reference for society discussion photography',
      guideTitle: 'Three photo stories to capture',
      guideBody: '<p>Lead with your actual Beijing 101 pitch, then add a candid conversation to give the site a sense of your own community.</p><ol class="photo-guide-list"><li><strong>The campus pitch:</strong> natural light after school, with the pitch, a football or students on the touchline. Use a landscape 4:3 frame with a little breathing room.</li><li><strong>Watching together:</strong> a shared viewing in a classroom or common room. Photograph a side view, silhouettes or a spontaneous celebration in a landscape 16:9 frame.</li><li><strong>The discussion:</strong> a table conversation, a tactics board, handwritten notes or a group editing an article. A 4:3 image with a clear focal point works well.</li></ol><p>For this homepage, choose a pitch lead image and a discussion secondary image. Save match-viewing shots for event stories. Original files at least 2,000 pixels wide are ideal.</p><p class="content-note">The two current photographs are Unsplash references, not school event documentation. Use photographs of students who have agreed to appear publicly.</p>'
    }
  };
  const keys = ['all', ...Object.keys(leagues)];
  let selected = 'all';
  let language = 'zh';
  const grid = document.querySelector('.club-grid');
  const filters = document.querySelector('.club-filters');

  const cards = clubs.map(club => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'club-card';
    button.dataset.club = club[0];
    button.dataset.badge = String(club[4]);
    button.innerHTML = `<img src="assets/teams/${club[0]}.png" width="46" height="52" alt="" loading="lazy" decoding="async" /><span class="club-copy"><b></b><small></small></span><span class="club-status"></span><span class="club-arrow" aria-hidden="true">↗</span>`;
    button.addEventListener('click', () => {
      const en = language === 'en';
      const t = translations[language];
      const name = club[en ? 2 : 1];
      openDetail(name, `<div class="team-detail"><div class="team-detail-head"><img src="assets/teams/${club[0]}.png" alt="" width="72" height="80" /><div><b>${club[2]}</b><small>${leagues[club[3]][en ? 1 : 0]} · ${t.badge}</small></div></div><h3>${en ? 'About the club' : '球队简介'}</h3><p>${club[en ? 6 : 5]}</p><p class="content-note">${en ? 'This club is supported by members of our group.' : '本队已确认有群友支持。'}</p></div>`);
    });
    grid.append(button);
    return button;
  });
  const filterButtons = keys.map(key => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.filter = key;
    button.addEventListener('click', () => { selected = key; filterClubs(); });
    filters.append(button);
    return button;
  });

  function filterClubs() {
    let count = 0;
    clubs.forEach((club, index) => {
      const visible = selected === 'all' || (selected === 'badge' ? club[4] : club[3] === selected);
      cards[index].hidden = !visible;
      if (visible) count++;
    });
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selected)));
    document.querySelector('.club-results').textContent = `${String(count).padStart(2, '0')} / ${clubs.length} ${translations[language].count}`;
  }

  function translate() {
    language = document.documentElement.lang === 'en' ? 'en' : 'zh';
    const en = language === 'en';
    const t = translations[language];
    document.querySelectorAll('[data-community]').forEach(element => { element.innerHTML = t[element.dataset.community]; });
    document.querySelector('.team-intro').innerHTML = t.teamIntro;
    filters.setAttribute('aria-label', t.filterLabel);
    filterButtons.forEach((button, index) => { button.textContent = t.filters[index]; });
    clubs.forEach((club, index) => {
      cards[index].querySelector('b').textContent = club[en ? 2 : 1];
      cards[index].querySelector('small').textContent = en ? leagues[club[3]][1].toUpperCase() : club[2].toUpperCase();
      cards[index].querySelector('.club-status').textContent = club[4] ? t.badge : t.additional;
    });


    document.querySelector('.stat-grid > div:nth-child(3) strong').textContent = String(clubs.length);
    document.querySelector('.stat-grid > div:nth-child(3) span').textContent = en ? 'Club profiles' : '球队档案';
    document.querySelector('.stat-grid > div:first-child strong').textContent = '160+';
    document.querySelector('.stat-grid > div:first-child span').textContent = en ? 'Group members' : '群成员';
    
    filterClubs();
  }

  document.addEventListener('site:languagechange', translate);
  translate();
})();
