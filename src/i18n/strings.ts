// UI chrome strings. Item & machine names already carry both languages in the data,
// so this only covers app labels. zh strings follow the wiki's terminology.
export type Lang = 'en' | 'zh';

const en = {
    appTitle: 'StardewMaxxing',
    tagline: 'What should I do with…',
    searchPlaceholder: 'Search an item (e.g. Starfruit / 星之果实)',
    noResults: 'No item found. Try another name.',
    pickPrompt: 'Pick an item to see the best way to sell it.',

    settings: 'Settings',
    professions: 'Professions',
    artisan: 'Artisan (+40%)',
    artisanHint: 'Boosts artisan goods: wine, juice, jelly, pickles, cheese…',
    tiller: 'Tiller (+10%)',
    tillerHint: 'Boosts raw crops & flowers',
    quality: 'Input quality',
    rankBy: 'Rank by',
    rankTotal: 'Total gold',
    rankPerDay: 'Gold / day',

    qualityNormal: 'Normal',
    qualitySilver: 'Silver',
    qualityGold: 'Gold',
    qualityIridium: 'Iridium',

    colRoute: 'What to make',
    colOutput: 'Result',
    colValue: 'Value',
    colPerDay: 'Gold/day',
    best: 'BEST',
    instant: 'instant',
    perInput: 'each',
    batch: (inN: number) => `${inN} in`,
    days: (d: number) => `${d}d`,
    rawValueNote: 'base sell price',
};

export type UIStrings = typeof en;

const zh: UIStrings = {
    appTitle: 'StardewMaxxing',
    tagline: '这个东西该怎么处理…',
    searchPlaceholder: '搜索物品（如 星之果实 / Starfruit）',
    noResults: '未找到物品，换个名字试试。',
    pickPrompt: '选择一个物品，查看最赚钱的处理方式。',

    settings: '设置',
    professions: '职业',
    artisan: '手工业者（+40%）',
    artisanHint: '提升手工制品：果酒、果汁、果酱、腌菜、奶酪…',
    tiller: '农耕家（+10%）',
    tillerHint: '提升未加工的作物与花卉',
    quality: '原料品质',
    rankBy: '排序方式',
    rankTotal: '总金额',
    rankPerDay: '每日金额',

    qualityNormal: '普通',
    qualitySilver: '银星',
    qualityGold: '金星',
    qualityIridium: '铱星',

    colRoute: '加工方式',
    colOutput: '成品',
    colValue: '售价',
    colPerDay: '每日金额',
    best: '最佳',
    instant: '即时',
    perInput: '每个',
    batch: (inN: number) => `${inN} 个`,
    days: (d: number) => `${d}天`,
    rawValueNote: '基础售价',
};

export const STRINGS: Record<Lang, UIStrings> = { en, zh };

export type StringKey = keyof UIStrings;
