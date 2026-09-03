// Machine transform rules.
//
// The rules themselves live in ../../shared/machines.json — the SHARED source of truth that the
// SwiftUI iOS app reads too, so a wiki correction is a one-line JSON edit that lands in both apps.
// This file is only the interpreter. Every formula/time/multiplier question is answered by that
// JSON (sourced from stardewvalleywiki.com); see CLAUDE.md for the per-machine sources.

import { Item, RouteResult, MINUTES_PER_DAY } from './types';
import rulesFile from '../../shared/machines.json';

// --- Rule schema (mirrors shared/machines.json; Swift has an equivalent decoder) -------------

/** A predicate over an Item. `true` always matches. */
type Predicate =
  | boolean
  | {
      category?: string;
      categoryIn?: string[];
      tag?: string;
      notTag?: string;
      id?: string;
      idPrefix?: string;
      allOf?: Predicate[];
      anyOf?: Predicate[];
    };

/** value = round(mult * basePrice + offset), or a flat `const`. `inedible` overrides both
 *  for items tagged 'inedible' (the wiki's reduced-value note). */
interface ValueSpec {
  const?: number;
  mult?: number;
  offset?: number;
  inedible?: { mult?: number; offset?: number };
}

/** Flags are either a literal boolean or a predicate evaluated against the item. */
type FlagSpec = boolean | Predicate;

interface RuleSpec {
  when: Predicate;
  outputId: string; // supports the {id} placeholder
  nameEn: string; // supports the {n} placeholder
  nameZh: string;
  value: ValueSpec;
  inputCount?: number;
  outputCount?: number;
  minutes?: number;
  agingDays?: number;
  extraInputs?: string[];
  note?: string;
  artisanGood?: FlagSpec;
  tillerEligible?: FlagSpec;
  rancherEligible?: FlagSpec;
  fishEligible?: FlagSpec;
  qualitySensitive?: FlagSpec;
}

interface MachineSpec {
  id: string;
  nameEn: string;
  nameZh: string;
  accepts?: Predicate; // machine-level gate, checked before any rule
  defaults?: Partial<RuleSpec>;
  rules: RuleSpec[];
}

interface RulesFile {
  minutesPerDay: number;
  extraInputCost: Record<string, number>;
  machines: MachineSpec[];
}

const FILE = rulesFile as unknown as RulesFile;

/** Consumable opportunity costs (e.g. the Fish Smoker's coal), shared with compute.ts. */
export const EXTRA_INPUT_COST: Record<string, number> = FILE.extraInputCost;

// --- Interpreter ------------------------------------------------------------------------------

function matches(p: Predicate | undefined, item: Item): boolean {
  if (p === undefined) return false;
  if (typeof p === 'boolean') return p;
  if (p.category !== undefined && item.category !== p.category) return false;
  if (p.categoryIn !== undefined && !p.categoryIn.includes(item.category)) return false;
  if (p.tag !== undefined && !item.tags.includes(p.tag)) return false;
  if (p.notTag !== undefined && item.tags.includes(p.notTag)) return false;
  if (p.id !== undefined && item.id !== p.id) return false;
  if (p.idPrefix !== undefined && !item.id.startsWith(p.idPrefix)) return false;
  if (p.allOf !== undefined && !p.allOf.every((q) => matches(q, item))) return false;
  if (p.anyOf !== undefined && !p.anyOf.some((q) => matches(q, item))) return false;
  return true;
}

const flag = (f: FlagSpec | undefined, item: Item): boolean =>
  typeof f === 'boolean' ? f : matches(f, item);

const fill = (tpl: string, item: Item, name: string) =>
  tpl.replace('{id}', item.id).replace('{n}', name);

function valueOf(v: ValueSpec, item: Item): number {
  if (v.const !== undefined) return v.const;
  const alt = item.tags.includes('inedible') ? v.inedible : undefined;
  const mult = alt?.mult ?? v.mult ?? 0;
  const offset = alt?.offset ?? (alt ? 0 : v.offset ?? 0);
  return Math.round(item.basePrice * mult + offset);
}

function applyRule(m: MachineSpec, rule: RuleSpec, item: Item): RouteResult {
  const d = m.defaults ?? {};
  const pick = <K extends keyof RuleSpec>(k: K): RuleSpec[K] | undefined => rule[k] ?? d[k];

  const minutes = (pick('minutes') as number | undefined) ?? 0;
  const agingDays = (pick('agingDays') as number | undefined) ?? 0;
  const extraInputs = pick('extraInputs') as string[] | undefined;
  const note = pick('note') as string | undefined;

  const out: RouteResult = {
    machineId: m.id,
    outputId: fill(rule.outputId, item, item.nameEn),
    outputNameEn: fill(rule.nameEn, item, item.nameEn),
    outputNameZh: fill(rule.nameZh, item, item.nameZh),
    inputCount: (pick('inputCount') as number | undefined) ?? 1,
    outputCount: (pick('outputCount') as number | undefined) ?? 1,
    baseValue: valueOf(rule.value, item),
    artisanGood: flag(pick('artisanGood'), item),
    tillerEligible: flag(pick('tillerEligible'), item),
    qualitySensitive: flag(pick('qualitySensitive'), item),
    days: minutes / MINUTES_PER_DAY + agingDays,
  };

  // Optional flags are only emitted when the machine declares them, so routes that can never
  // be Rancher/fishing-eligible stay absent rather than explicitly false.
  const rancher = pick('rancherEligible');
  if (rancher !== undefined) out.rancherEligible = flag(rancher, item);
  const fish = pick('fishEligible');
  if (fish !== undefined) out.fishEligible = flag(fish, item);
  if (extraInputs !== undefined) out.extraInputs = extraInputs;
  if (note !== undefined) out.note = note;

  return out;
}

export interface Machine {
  id: string;
  nameEn: string;
  nameZh: string;
  /** Returns the route this machine yields for the item, or null if it can't process it. */
  transform: (item: Item) => RouteResult | null;
}

const build = (m: MachineSpec): Machine => ({
  id: m.id,
  nameEn: m.nameEn,
  nameZh: m.nameZh,
  transform: (item) => {
    if (m.accepts !== undefined && !matches(m.accepts, item)) return null;
    const rule = m.rules.find((r) => matches(r.when, item));
    return rule ? applyRule(m, rule, item) : null;
  },
});

export const MACHINES: Machine[] = FILE.machines.map(build);
