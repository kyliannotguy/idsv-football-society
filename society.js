(() => {
  const articleUrl = 'https://mp.weixin.qq.com/s/NShugFoo53l2dfuIG-Oyfg';
  const accountName = '一零一赛后情书';
  const grid = document.querySelector('.article-grid');
  grid.classList.add('published-articles');
  grid.innerHTML = `<article class="published-article"><a class="article-image published-cover" href="${articleUrl}" target="_blank" rel="noopener noreferrer"><img src="assets/teams/newcastle.png" alt="" width="110" height="130" /><span>NEWCASTLE UNITED</span></a><div class="published-copy"><div class="article-meta"><span class="published-category"></span><time datetime="2026-09-15">2026.09.15</time></div><h3><a href="${articleUrl}" target="_blank" rel="noopener noreferrer">我和喜鹊，从七岁开始的十年</a></h3><p class="published-summary"></p><p class="published-author"></p><a class="read-more" href="${articleUrl}" target="_blank" rel="noopener noreferrer"></a></div></article>`;

  function update() {
    const en = document.documentElement.lang === 'en';
    const expired = Date.now() >= Date.parse('2026-09-24T00:00:00+08:00');
    dialogs.zh.join = ['加入 IDSV 观赛社', `<p>160+位群友，21支主队。欢迎一起观赛、讨论与写作。</p><img class="group-qr" src="assets/group-qr.png" alt="IDSV观赛社微信群二维码，标注有效至9月23日" width="720" height="1094" /><p class="qr-validity">${expired ? '此二维码已超过标注有效期，请联系社团获取新二维码。' : '使用微信扫码加入群聊。二维码标注有效至2026年9月23日，是否可加入以微信提示为准。'}</p><p class="content-note">这是观赛社群二维码，不是公众号二维码。</p>`];
    dialogs.en.join = ['Join IDSV Football Society', `<p>160+ group members, 21 supported clubs. Join us to watch, discuss and write.</p><img class="group-qr" src="assets/group-qr.png" alt="IDSV WeChat group QR code, valid until September 23" width="720" height="1094" /><p class="qr-validity">${expired ? 'The printed expiry date has passed. Contact the society for a new QR code.' : 'Scan with WeChat to join. The code is marked valid until September 23, 2026; availability is subject to WeChat.'}</p><p class="content-note">This QR code is for the group chat, not the official account.</p>`];
    dialogs.zh.account = [accountName, `<p>我们的足球观察、主队故事与社团文章都发布在微信公众号“${accountName}”。</p><p>在微信搜索公众号名，或通过下方原文进入账号。</p><a class="button button-dark" href="${articleUrl}" target="_blank" rel="noopener noreferrer">阅读已发布文章 ↗</a>`];
    dialogs.en.account = [accountName, `<p>Our football observations, supporter stories and society articles are published on WeChat under the name ${accountName}.</p><p>Search this exact name in WeChat, or open the published article below to find the account.</p><a class="button button-dark" href="${articleUrl}" target="_blank" rel="noopener noreferrer">Read on WeChat ↗</a>`];
    set('#journal .eyebrow', '<span class="eyebrow-line"></span>THE JOURNAL');
    set('#journal .feature-head .content-note', en ? 'Published on WeChat · original articles' : '公众号原创文章');
    set('.account-copy .mini-label', en ? 'WECHAT / OUR OFFICIAL ACCOUNT' : 'WECHAT / 我们的公众号');
    set('.account-copy h3', accountName);
    set('.account-copy>p:last-child', en ? 'Football stories, observations and conversations from our community.' : '把对足球的热爱，写成赛后的每一封情书。');
    set('.account-button', (en ? 'Explore our account' : '查看公众号') + ' <span>↗</span>');
    set('.published-category', en ? 'Supporter story / Newcastle' : '球迷故事 / 纽卡斯尔联');
    set('.published-article h3 a', en ? 'Me and the Magpies: Ten Years Since Age Seven' : '我和喜鹊，从七岁开始的十年');
    set('.published-summary', en ? 'A personal account of discovering Newcastle at seven, following the club through setbacks and celebrations, and growing up alongside a team. Original article in Chinese.' : '从七岁时偶然认识纽卡斯尔联，到与球队一起经历低谷和欢呼，轩辕用个人记忆写下一段与“喜鹊”共同成长的故事。');
    set('.published-author', en ? 'By 轩辕 · 一零一赛后情书' : '轩辕 · 一零一赛后情书');
    set('.published-article .read-more', (en ? 'Read original on WeChat' : '前往微信阅读全文') + ' <span>↗</span>');
    document.querySelector('.published-cover').setAttribute('aria-label', en ? 'Read the Newcastle supporter story on WeChat' : '前往微信阅读纽卡斯尔球迷故事');
    set('.stat-grid > div:nth-child(2) strong', '01');
    set('.stat-grid > div:nth-child(2) span', en ? 'Article featured' : '已收录文章');
    set('#join .button-light', (en ? 'View group QR code' : '扫码加入群聊') + ' <span>↗</span>');
  }
  document.addEventListener('site:languagechange', update);
  update();
})();
