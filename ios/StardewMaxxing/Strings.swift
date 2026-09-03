import Foundation

// UI chrome strings, mirroring src/i18n/strings.ts. Item & machine names already carry both
// languages in the shared data, so this only covers app labels. zh follows the wiki's terminology.

enum Lang: String, CaseIterable, Identifiable {
    case en, zh
    var id: String { rawValue }
    var label: String { self == .en ? "En" : "中文" }
}

struct UIStrings {
    var appTitle = "StardewMaxxing"
    var lang: Lang
    var tagline: String
    var searchPlaceholder: String
    var noResults: String
    var pickPrompt: String

    var settings: String
    var professions: String
    var level5: String
    var level10: String
    var fishingProfessions: String
    var noProfForItem: String
    var quality: String
    var rankBy: String
    var rankTotal: String
    var rankPerDay: String

    var colRoute: String
    var colOutput: String
    var best: String
    var instant: String
    var stacks: String
    var perInput: String
    var coal: String
    var rawValueNote: String
    var otherUses: String
    var usesBundle: String
    var usesLovedBy: String
    var usesRecipes: String
    var usesQuest: String
    var usesLovedHint: String
    var usesNone: String
    var explainTotal: String
    var explainPerDay: String
    var done: String
    var informational: String

    var prof: [String: String]      // profession key -> display name
    var profHint: [String: String]  // profession key -> hint
    var qualityName: [Quality: String]
    var bonusName: [BonusKey: String]

    func batch(_ n: Int) -> String { lang == .en ? "\(n) in" : "\(n) 个" }
    func days(_ d: Int) -> String { lang == .en ? "\(d)d" : "\(d)天" }
    func actualTime(_ d: Int) -> String {
        lang == .en ? "~\(d) in-game days · collected next morning" : "约 \(d) 游戏日 · 次日清晨收取"
    }
    /// Item and machine names ship in both languages in the shared data.
    func name(_ en: String, _ zh: String) -> String { lang == .en ? en : zh }
    func name(_ n: Named) -> String { lang == .en ? n.en : n.zh }

    func usesQuestText(_ gold: Int?) -> String {
        switch (lang, gold) {
        case (.en, .some(let g)): "Can be randomly requested at the “Help Wanted” board (\(g)g + friendship)."
        case (.en, .none):        "Can be randomly requested at the “Help Wanted” board."
        case (.zh, .some(let g)): "可能出现在布告栏的随机求助任务中（\(g)金 + 友谊点）。"
        case (.zh, .none):        "可能出现在布告栏的随机求助任务中。"
        }
    }
}

let STRINGS: [Lang: UIStrings] = [
    .en: UIStrings(
        lang: .en,
        tagline: "What should I do with…",
        searchPlaceholder: "Search an item (e.g. Starfruit / 星之果实)",
        noResults: "No item found. Try another name.",
        pickPrompt: "Pick an item to see the best way to sell it.",
        settings: "Settings",
        professions: "Farming professions",
        level5: "Level 5 profession",
        level10: "Level 10 profession",
        fishingProfessions: "Fishing professions",
        noProfForItem: "No profession affects this item.",
        quality: "Input quality",
        rankBy: "Rank by",
        rankTotal: "Total gold",
        rankPerDay: "Gold/day",
        colRoute: "What to make",
        colOutput: "Result",
        best: "BEST",
        instant: "instant",
        stacks: "stacked",
        perInput: "each",
        coal: "coal",
        rawValueNote: "base sell price",
        otherUses: "Other uses",
        usesBundle: "Bundle",
        usesLovedBy: "Loved gift",
        usesRecipes: "Ingredient in",
        usesQuest: "Help Wanted",
        usesLovedHint: "Loved gifts give 8× friendship.",
        usesNone: "The wiki lists no bundles, loved gifts, recipes or quests for this one.",
        explainTotal: "Total gold — net gold from one raw input after processing (consumable costs like the Fish Smoker’s coal are deducted), so batches (e.g. Dehydrator ×5) compare fairly.",
        explainPerDay: "Gold/day — gold per in-game day the machine is busy, rounded up to whole “collect next morning” days. Higher = more profit when machines or time are your limit.",
        done: "Done",
        informational: "no effect on sell value",
        prof: [
            "none": "— none —",
            "tiller": "Tiller (+10% crops)",
            "rancher": "Rancher (+20% animal products)",
            "artisan": "Artisan (+40% artisan goods)",
            "agriculturist": "Agriculturist",
            "coopmaster": "Coopmaster",
            "shepherd": "Shepherd",
            "fisher": "Fisher (+25% fish)",
            "trapper": "Trapper",
            "angler": "Angler (+50% fish)",
            "pirate": "Pirate",
            "mariner": "Mariner",
            "luremaster": "Luremaster",
        ],
        profHint: [
            "tiller": "Raw crops & flowers sell for +10%.",
            "rancher": "Raw milk, eggs, wool & truffle sell for +20%.",
            "artisan": "Artisan goods (wine, juice, jelly, cheese…) sell for +40%, and Tiller still gives raw crops & flowers +10%.",
            "agriculturist": "Crops grow 10% faster — no effect on sell value.",
            "coopmaster": "Coop animals & incubation — no effect on sell value.",
            "shepherd": "Barn animals & faster wool — no effect on sell value.",
            "fisher": "Raw & smoked fish sell for +25%.",
            "trapper": "Cheaper crab pots — no effect on sell value.",
            "angler": "Raw & smoked fish sell for +50% (replaces Fisher’s +25%).",
            "pirate": "Double treasure chance — no effect on sell value.",
            "mariner": "Crab pots skip junk — no effect on sell value.",
            "luremaster": "Crab pots need no bait — no effect on sell value.",
        ],
        qualityName: [.normal: "Normal", .silver: "Silver", .gold: "Gold", .iridium: "Iridium"],
        bonusName: [.tiller: "Tiller", .rancher: "Rancher", .artisan: "Artisan", .fisher: "Fisher", .angler: "Angler"]
    ),
    .zh: UIStrings(
        lang: .zh,
        tagline: "这个东西该怎么处理…",
        searchPlaceholder: "搜索物品（如 星之果实 / Starfruit）",
        noResults: "未找到物品，换个名字试试。",
        pickPrompt: "选择一个物品，查看最赚钱的处理方式。",
        settings: "设置",
        professions: "农业职业",
        level5: "等级5 职业",
        level10: "等级10 职业",
        fishingProfessions: "钓鱼职业",
        noProfForItem: "这个物品不受任何职业影响。",
        quality: "原料品质",
        rankBy: "排序方式",
        rankTotal: "总金额",
        rankPerDay: "每日金额",
        colRoute: "加工方式",
        colOutput: "成品",
        best: "最佳",
        instant: "即时",
        stacks: "叠加",
        perInput: "每个",
        coal: "煤炭",
        rawValueNote: "基础售价",
        otherUses: "其他用途",
        usesBundle: "收集包",
        usesLovedBy: "喜爱的礼物",
        usesRecipes: "用于料理",
        usesQuest: "求助任务",
        usesLovedHint: "喜爱的礼物可获得 8 倍友谊值。",
        usesNone: "wiki 未记录该物品的收集包、喜爱礼物、料理或任务。",
        explainTotal: "总金额 — 单个原料加工后的净收益（已扣除耗材成本，如熏鱼机的煤炭），不同批量（如烘干机 ×5）可公平比较。",
        explainPerDay: "每日金额 — 机器占用每个游戏日的收益，向上取整到整数“次日清晨收取”天数。数值越高，在机器或时间有限时越赚钱。",
        done: "完成",
        informational: "不影响售价",
        prof: [
            "none": "— 无 —",
            "tiller": "农耕人（作物 +10%）",
            "rancher": "畜牧人（动物产品 +20%）",
            "artisan": "工匠（手工制品 +40%）",
            "agriculturist": "农业学家",
            "coopmaster": "鸡舍大师",
            "shepherd": "牧羊人",
            "fisher": "渔夫（鱼 +25%）",
            "trapper": "捕猎者",
            "angler": "垂钓者（鱼 +50%）",
            "pirate": "海盗",
            "mariner": "水手",
            "luremaster": "诱饵大师",
        ],
        profHint: [
            "tiller": "未加工的作物与花卉售价 +10%。",
            "rancher": "未加工的牛奶、蛋、羊毛与松露售价 +20%。",
            "artisan": "手工制品（果酒、果汁、果酱、奶酪…）售价 +40%，同时农耕人仍使未加工的作物与花卉 +10%。",
            "agriculturist": "作物生长速度 +10% — 不影响售价。",
            "coopmaster": "笼养动物与孵化 — 不影响售价。",
            "shepherd": "畜棚动物与产毛 — 不影响售价。",
            "fisher": "未加工与熏制的鱼售价 +25%。",
            "trapper": "蟹笼更省材料 — 不影响售价。",
            "angler": "未加工与熏制的鱼售价 +50%（取代渔夫的 +25%）。",
            "pirate": "宝藏几率翻倍 — 不影响售价。",
            "mariner": "蟹笼不再产生垃圾 — 不影响售价。",
            "luremaster": "蟹笼不再需要诱饵 — 不影响售价。",
        ],
        qualityName: [.normal: "普通", .silver: "银星", .gold: "金星", .iridium: "铱星"],
        bonusName: [.tiller: "农耕人", .rancher: "畜牧人", .artisan: "工匠", .fisher: "渔夫", .angler: "垂钓者"]
    ),
]
