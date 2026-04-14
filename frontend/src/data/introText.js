const introText = {
  en: {
    heading: 'Take back your timeline',
    p1: 'Trolls thrive on attention. They provoke, insult, and derail conversations to get a reaction out of you. The best thing you can do is',
    p1Bold: 'not play their game',
    p2: "Don't argue, don't engage, don't feed them. Block, report, and move on. TrollsHunter is a community-driven blocklist — we identify and catalog the worst offenders so you can protect your feed before they ever reach you.",
    cta: '↓ Scroll to see who\'s behind bars',
  },
  es: {
    heading: 'Recupera tu timeline',
    p1: 'Los trolls se alimentan de atención. Provocan, insultan y desvían conversaciones para sacarte una reacción. Lo mejor que puedes hacer es',
    p1Bold: 'no seguirles el juego',
    p2: 'No discutas, no interactúes, no los alimentes. Bloquea, reporta y sigue adelante. TrollsHunter es una lista de bloqueo comunitaria — identificamos y catalogamos a los peores agresores para que puedas proteger tu feed antes de que te alcancen.',
    cta: '↓ Desliza para ver quién está tras las rejas',
  },
  fr: {
    heading: 'Reprenez le contrôle de votre fil',
    p1: "Les trolls se nourrissent d'attention. Ils provoquent, insultent et déraillent les conversations pour obtenir une réaction de votre part. La meilleure chose à faire est de",
    p1Bold: 'ne pas jouer leur jeu',
    p2: "Ne discutez pas, ne répondez pas, ne les alimentez pas. Bloquez, signalez et passez à autre chose. TrollsHunter est une liste de blocage communautaire — nous identifions et répertorions les pires fauteurs de troubles pour protéger votre fil.",
    cta: '↓ Faites défiler pour voir qui est derrière les barreaux',
  },
  pt: {
    heading: 'Recupere sua timeline',
    p1: 'Trolls se alimentam de atenção. Provocam, insultam e desviam conversas para tirar uma reação de você. A melhor coisa que você pode fazer é',
    p1Bold: 'não entrar no jogo deles',
    p2: 'Não discuta, não interaja, não os alimente. Bloqueie, denuncie e siga em frente. TrollsHunter é uma lista de bloqueio comunitária — identificamos e catalogamos os piores agressores para que você possa proteger seu feed antes que eles te alcancem.',
    cta: '↓ Role para ver quem está atrás das grades',
  },
  de: {
    heading: 'Hol dir deine Timeline zurück',
    p1: 'Trolle leben von Aufmerksamkeit. Sie provozieren, beleidigen und entgleisen Gespräche, um eine Reaktion von dir zu bekommen. Das Beste, was du tun kannst, ist',
    p1Bold: 'ihr Spiel nicht mitzuspielen',
    p2: 'Diskutiere nicht, reagiere nicht, füttere sie nicht. Blockieren, melden und weitergehen. TrollsHunter ist eine gemeinschaftliche Sperrliste — wir identifizieren und katalogisieren die schlimmsten Störer, damit du deinen Feed schützen kannst.',
    cta: '↓ Scrolle, um zu sehen, wer hinter Gittern sitzt',
  },
  it: {
    heading: 'Riprendi il controllo della tua timeline',
    p1: "I troll si nutrono di attenzione. Provocano, insultano e fanno deragliare le conversazioni per ottenere una reazione da te. La cosa migliore che puoi fare è",
    p1Bold: 'non stare al loro gioco',
    p2: "Non discutere, non interagire, non alimentarli. Blocca, segnala e vai avanti. TrollsHunter è una lista di blocco comunitaria — identifichiamo e cataloghiamo i peggiori disturbatori per proteggere il tuo feed.",
    cta: '↓ Scorri per vedere chi è dietro le sbarre',
  },
  ja: {
    heading: 'タイムラインを取り戻そう',
    p1: '荒らしは注目を糧にしています。挑発し、侮辱し、会話を脱線させてあなたの反応を引き出そうとします。あなたができる最善のことは',
    p1Bold: '彼らのゲームに乗らないこと',
    p2: '議論せず、関わらず、餌を与えない。ブロックして、報告して、先に進みましょう。TrollsHunterはコミュニティ主導のブロックリストです。最悪の荒らしを特定・記録し、あなたのフィードを守ります。',
    cta: '↓ スクロールして誰が檻の中にいるか見てみよう',
  },
  ko: {
    heading: '타임라인을 되찾으세요',
    p1: '트롤은 관심을 먹고 삽니다. 도발하고, 모욕하고, 대화를 탈선시켜 반응을 끌어내려 합니다. 당신이 할 수 있는 최선은',
    p1Bold: '그들의 게임에 말려들지 않는 것',
    p2: '논쟁하지 마세요. 반응하지 마세요. 먹이를 주지 마세요. 차단하고, 신고하고, 넘어가세요. TrollsHunter는 커뮤니티 기반 차단 목록입니다 — 최악의 악성 사용자를 식별하고 기록하여 여러분의 피드를 보호합니다.',
    cta: '↓ 스크롤하여 누가 철창 뒤에 있는지 확인하세요',
  },
  zh: {
    heading: '夺回你的时间线',
    p1: '喷子靠关注度生存。他们挑衅、侮辱、让对话偏离方向，就是为了引起你的反应。你能做的最好的事就是',
    p1Bold: '不要陪他们玩',
    p2: '不要争论，不要互动，不要喂养他们。屏蔽、举报、继续前行。TrollsHunter是一个社区驱动的黑名单——我们识别和记录最恶劣的骚扰者，保护你的信息流。',
    cta: '↓ 向下滚动看看谁在铁栏后面',
  },
}

export function getIntroText() {
  const lang = (navigator.language || 'en').slice(0, 2).toLowerCase()
  return introText[lang] || introText.en
}
