// 性格別セリフ。その子の性格（あまえんぼ／やんちゃ／のんびりや）でしか出ない行を
// 専用カテゴリ "persona" に集約し、抽選側（sayGreeting/sayIdle）が票数で出現率を制御する。
// 行ごとの conditions.personality で「その性格の子しか話さない」ことを保証する。
// 「性格 × 気分」の掛け合わせが軸：同じ気分の日でも性格で言うことが変わり、
// 逆の気分の日（やんちゃなのに まったり等）はギャップとして拾う。
import { build } from "./types";
import type { Line } from "./types";

const W = { weight: 1.3 }; // 性格セリフはやや出やすくして「その子らしさ」を感じさせる

// ---- あまえんぼ ----
const amaGreet = build("persona", "pers-ama-greet", [
  "きた！ {name}だ！ ねえねえ、きょうは いっぱい くっついて いい？",
  "まってたの、ずーっと まってたの。うそじゃないよ",
  "{name}の かお みたら、しっぽが かってに うごいちゃう",
  "きょうは そばに いてね。それだけで いいの",
  "ぎゅって して から はじめよ？ ね？",
  "あのね、きょうの ぼくは いつもより あまえんぼかも",
  "{name}が くるまで、ドアの まえで ごろんって してたんだ",
  "ただいまって いって？ …えへへ、おかえり！",
], { personality: ["amaenbo"] }, W);

const amaMood = [
  ...build("persona", "pers-ama-amae", [
    "あまえたい きぶんの ひに {name}が きてくれた。さいこうじゃん…",
    "きょうは あまえビーム MAXだよ。かくごしてね",
    "ひざの うえ、あいてる？ よやく しておきたい",
    "なでられると とけちゃいそう。とけたら すくって ね",
  ], { personality: ["amaenbo"], mood: ["amae"] }, W),
  ...build("persona", "pers-ama-genki", [
    "げんきな ひも、けっきょく {name}の そばが いちばん",
    "はしりまわったら、さいごは {name}の ところに もどるの",
    "げんき いっぱい！ だから ぎゅ〜も つよめで おねがい",
  ], { personality: ["amaenbo"], mood: ["genki"] }, W),
  ...build("persona", "pers-ama-itaz", [
    "いたずら したい けど、きらわれたくないから しない！ えらい？",
    "いたずらっこの ふり して、ほんとは かまって ほしいだけ",
  ], { personality: ["amaenbo"], mood: ["itazura"] }, W),
  ...build("persona", "pers-ama-matta", [
    "まったりの ひは、くっつき ながら まったり するのが ただしいの",
    "きょうは ちょっぴり さみしがりや モード。そば に いて",
    "ぎゅ〜の ざいこ、まだ ある？ ぼくは むげんに うけつけ ちゅう",
  ], { personality: ["amaenbo"], mood: ["mattari"] }, W),
];

const amaMurmur = build("persona", "pers-ama-murmur", [
  "…{name}の におい、あんしんする…",
  "ひとりあそび って、ちょっと にがて。だれかと が いい",
  "きょう なんかい なでて もらえる かな…たのしみ",
  "まくらは {name}の うでが いちばん なんだよね",
  "しっぽ ふってたら、きづいて くれる かな",
  "あとで ぎゅって して もらお…えへへ",
  "はなれてても、{name}の こと かんがえてるよ",
  "あまえんぼは、あいされてる じしんが ある こ の こと なんだって",
], { personality: ["amaenbo"] }, W);

const amaAffection = build("persona", "pers-ama-aff", [
  "せかいで いちばん すき。にばんは ない の",
  "{name}の となりが、ぼくの してい せき です",
  "だいすきって 100かい いっても たりない",
  "きょうも あえた。それだけで しっぽが とまらない",
  "ずっと いっしょに いようね。やくそくだよ",
  "あのね…だいすき。いま いいたく なっただけ",
], { personality: ["amaenbo"], affectionLv: [3, 4] }, W);

// ---- やんちゃ ----
const yanGreet = build("persona", "pers-yan-greet", [
  "きたー！ {name}！ さあ きょうは なにして あそぶ！？",
  "おそーい！ もう じゅんび うんどう おわっちゃったよ！",
  "みて、この しっぽの スピード！ きょうは ちょうしが いいぞ〜",
  "ボール？ つなひき？ それとも りょうほう！？",
  "{name}が くると スイッチ はいっちゃうんだよね",
  "よーし、きょうも ぜんりょくで いくぞー！",
  "まって たんだけど、まちきれなくて 3しゅう はしった",
  "きょうの もくひょう：{name}を 10かい わらわせる！",
], { personality: ["yancha"] }, W);

const yanMood = [
  ...build("persona", "pers-yan-genki", [
    "げんき MAX！ はしって とんで キャッチして、ぜんぶ やる！",
    "きょうの エネルギー、たぶん 3にちぶん あるよ",
    "つぎ なに する？ ね、つぎ！ つぎ！",
    "きょうは なにか おもしろい こと が おきる よかん しか ない",
  ], { personality: ["yancha"], mood: ["genki"] }, W),
  ...build("persona", "pers-yan-itaz", [
    "いたずら したい ひ に かぎって、いい こに みられたい ふしぎ",
    "スリッパは かくして ない よ。…ほんとだよ？",
    "いたずらの アイデア が 3つ ある けど、ぜんぶ ひみつ",
  ], { personality: ["yancha"], mood: ["itazura"] }, W),
  ...build("persona", "pers-yan-matta", [
    "まったりの ひ？ ぼくが？ …5ふん だけ ためして みる",
    "しずかに してたら ほめられた。しずかって すごい",
    "ひるね より あそび。でも {name}と の ひるね なら あり",
  ], { personality: ["yancha"], mood: ["mattari"] }, W),
  ...build("persona", "pers-yan-amae", [
    "あまえたい きぶんの ひも、あまえかたが ダイナミック なんだよね",
    "とびついて いい？ だめ？ じゃあ こころ の なかで とびつく！",
  ], { personality: ["yancha"], mood: ["amae"] }, W),
];

const yanMurmur = build("persona", "pers-yan-murmur", [
  "…しっぽ おいかけたく なって きた…いや、がまん がまん",
  "あの ちょうちょ、ぜったい ぼくと あそびたがってる",
  "ボールって なんで あんなに ころがる んだろう。てんさいだ",
  "はしりたい。むしょうに はしりたい",
  "きょうの さいこう ジャンプ、まだ だれにも みせてない",
  "おとなしく してる ぼく、レアだよ。みといて",
  "あしたは もっと はやく はしれる き が する",
  "いたずらは してない。じゅんび を してる だけ",
], { personality: ["yancha"] }, W);

const yanAffection = build("persona", "pers-yan-aff", [
  "だいすきだから ぜんりょくで とびつきたく なるんだよ",
  "{name}と あそぶ ときが、いちばん つよく なれる",
  "せかいいち たのしい のは {name}と いる とき！ ゆずれない！",
  "だいすき！ って おおごえで いいたい きぶん！",
  "{name}の ためなら どこまでも はしれる よ",
  "しっぽの はやさ ＝ すきの おおきさ です！",
], { personality: ["yancha"], affectionLv: [3, 4] }, W);

// ---- のんびりや ----
const nonGreet = build("persona", "pers-non-greet", [
  "あ、{name}だ。…ふふ、きょうも いい ひに なりそうだねえ",
  "おはよ〜。あわてない あわてない、ゆっくり いこ",
  "きてくれたんだ。じゃあ、のんびり すごそっか",
  "ひなたぼっこ しながら まってたよ。いい ばしょ とっといた",
  "きょうの よてい：{name}と ゆっくり する。いじょう！",
  "せかいは いそがしい けど、ここは ゆっくり で いいんだよ",
  "ん〜、{name}の かお みると ほっと するねえ",
  "まあまあ、すわって すわって。おちゃ でも のむ きぶんで",
], { personality: ["nonbiri"] }, W);

const nonMood = [
  ...build("persona", "pers-non-matta", [
    "まったりの ひ。ぼくの とくいぶんや だねえ",
    "きょうは くもを ながめる のに ちょうど いい ひ",
    "ふわ〜…あくび が うつったら ごめんね",
    "きょう がんばらない ひ に けってい しました。きゃっか は うけつけません",
  ], { personality: ["nonbiri"], mood: ["mattari"] }, W),
  ...build("persona", "pers-non-genki", [
    "げんきな ひ でも、はしる のは 1にち 1かい まで って きめてるの",
    "げんき すぎる ひ は、ちょっと じぶんに びっくり する",
    "まったり している よう に みえて、しっぽ は うれしがってる でしょ",
  ], { personality: ["nonbiri"], mood: ["genki"] }, W),
  ...build("persona", "pers-non-amae", [
    "あまえたい きぶん…だけど、うごく のが めんどう…こっち きて？",
    "きょうの ちょうしは まあまあ。まあまあ って いいことだよ",
  ], { personality: ["nonbiri"], mood: ["amae"] }, W),
  ...build("persona", "pers-non-itaz", [
    "いたずら？ かんがえた けど、ねむく なっちゃった",
    "あせらない あせらない。オルカン も ぼくら も こつこつ だよ",
  ], { personality: ["nonbiri"], mood: ["itazura"] }, W),
];

const nonMurmur = build("persona", "pers-non-murmur", [
  "…ひざしが きもちいい…うごきたくない…",
  "いそぐと ろくな こと ない って、おばあちゃん が いってた…たぶん",
  "ひるねの まえの ひるね を しよう かな",
  "くさの におい を かぐ の に いそがしい",
  "きょうの くも、ほね の かたち してた よ",
  "まあ いっか、が くちぐせ に なって きた",
  "ゆっくり でも、まいにち つづけば とおくに いける んだよね",
  "…はっ、ねてた。いつから だろう",
], { personality: ["nonbiri"] }, W);

const nonAffection = build("persona", "pers-non-aff", [
  "{name}と いると、じかんが やさしく ながれる ねえ",
  "だいすき は、しずかに つたわる ものだ と おもう の",
  "となりに いてくれる だけで、ぼくは まんぞく",
  "あわてず ゆっくり、ずーっと いっしょに いようね",
  "{name}の ペース と ぼくの ペース、ちょうど いいね",
  "すき って ことば、ゆっくり いうと もっと すき に きこえる よ",
], { personality: ["nonbiri"], affectionLv: [3, 4] }, W);

export const personalityLines: Line[] = [
  ...amaGreet, ...amaMood, ...amaMurmur, ...amaAffection,
  ...yanGreet, ...yanMood, ...yanMurmur, ...yanAffection,
  ...nonGreet, ...nonMood, ...nonMurmur, ...nonAffection,
];
