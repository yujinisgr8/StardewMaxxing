import { useI18n } from '../i18n';

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex gap-1">
      <button
        className={`sv-btn text-sm ${lang === 'en' ? 'sv-btn--on' : ''}`}
        onClick={() => setLang('en')}
      >
        EN
      </button>
      <button
        className={`sv-btn text-sm ${lang === 'zh' ? 'sv-btn--on' : ''}`}
        onClick={() => setLang('zh')}
      >
        中文
      </button>
    </div>
  );
}
