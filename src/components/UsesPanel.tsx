import { useState } from 'react';
import { Item, Named } from '../engine/types';
import { useI18n } from '../i18n';

/**
 * "Other uses" — what an item is good for besides selling or processing it.
 *
 * This exists because the ranked table alone gives bad advice for items with no profitable
 * route: a Daffodil's only route is "sell raw, 30g", which hides that it's a Spring Foraging
 * Bundle item and Sandy's loved gift. Data comes from the wiki via `npm run build:data`.
 */
const MAX_CHIPS = 6; // long recipe lists collapse behind "+n more"

export function UsesPanel({ item }: { item: Item }) {
  const { t, lang } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const uses = item.uses;

  const name = (n: Named) => (lang === 'en' ? n.en : n.zh);

  const hasAny =
    uses &&
    (uses.bundles.length > 0 ||
      uses.lovedBy.length > 0 ||
      uses.recipes.length > 0 ||
      uses.quest !== undefined);

  const recipes = uses?.recipes ?? [];
  const shownRecipes = expanded ? recipes : recipes.slice(0, MAX_CHIPS);
  const hiddenCount = recipes.length - shownRecipes.length;

  return (
    <div className="sv-frame mt-4">
      <div className="sv-panel p-3">
        <h3 className="mb-2 text-ink">{t.otherUses}</h3>

        {!hasAny ? (
          <p className="text-ink-soft text-sm">{t.usesNone}</p>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            {uses!.bundles.length > 0 && (
              <Row label={t.usesBundle}>
                {uses!.bundles.map((b, i) => (
                  <Chip key={i} tone="leaf">
                    {name(b.bundle)}
                    <span className="text-ink-soft"> · {name(b.room)}</span>
                  </Chip>
                ))}
              </Row>
            )}

            {uses!.lovedBy.length > 0 && (
              <Row label={t.usesLovedBy} hint={t.usesLovedHint}>
                {uses!.lovedBy.map((v, i) => (
                  <Chip key={i} tone="coin">
                    ♥ {name(v)}
                  </Chip>
                ))}
              </Row>
            )}

            {recipes.length > 0 && (
              <Row label={t.usesRecipes}>
                {shownRecipes.map((r, i) => (
                  <Chip key={i}>{name(r)}</Chip>
                ))}
                {hiddenCount > 0 && (
                  <button
                    className="text-ink-soft underline text-xs"
                    onClick={() => setExpanded(true)}
                  >
                    {t.usesMore(hiddenCount)}
                  </button>
                )}
              </Row>
            )}

            {uses!.quest && (
              <Row label={t.usesQuest}>
                <span className="text-ink-soft">{t.usesQuestText(uses!.quest.reward)}</span>
              </Row>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-ink-soft min-w-[86px] shrink-0">{label}</span>
      <span className="flex flex-wrap items-baseline gap-1">{children}</span>
      {hint && <span className="text-ink-soft/70 text-xs w-full">{hint}</span>}
    </div>
  );
}

function Chip({
  children,
  tone = 'plain',
}: {
  children: React.ReactNode;
  tone?: 'plain' | 'leaf' | 'coin';
}) {
  const bg =
    tone === 'leaf' ? 'bg-leaf-light' : tone === 'coin' ? 'bg-coin/60' : 'bg-parchment-dark';
  return <span className={`${bg} px-2 py-[2px] border-2 border-wood/50 text-ink`}>{children}</span>;
}
