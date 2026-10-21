import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TagChip } from '../components/TagChip';
import { useCreateCommunityQuestion } from '../hooks/useCommunity';
import { useMetadata } from '../hooks/useMetadata';
import { AlertCircle, Check, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

const AskQuestionForm: React.FC<{
  identityId: string;
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
}> = ({ identityId, lang, dir }) => {
  const navigate = useNavigate();
  const metadata = useMetadata();
  const create = useCreateCommunityQuestion(identityId, lang);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [code, setCode] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const didInitializeTags = useRef(false);
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (!didInitializeTags.current && !metadata.loading && metadata.skills.length) {
      didInitializeTags.current = true;
      setSelectedTags(metadata.skills.slice(0, 2));
    }
  }, [metadata.skills, metadata.loading]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((current) => current.filter((value) => value !== tag));
    } else if (selectedTags.length >= 5) {
      setError(lang === 'ar' ? 'يمكنك اختيار حتى 5 وسوم كحد أقصى' : 'You can select up to 5 tags maximum');
    } else {
      setSelectedTags((current) => [...current, tag]);
      setError('');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (title.trim().length < 15 || title.trim().length > 160) {
      setError(lang === 'ar' ? 'يجب أن يتراوح عنوان السؤال بين 15 و160 حرفًا' : 'Question title must be between 15 and 160 characters');
      return;
    }
    if (selectedTags.length < 1 || selectedTags.length > 5) {
      setError(lang === 'ar' ? 'يرجى اختيار من 1 إلى 5 وسوم' : 'Please select 1 to 5 tags');
      return;
    }
    if (!body.trim() || body.trim().length > 20000) {
      setError(lang === 'ar' ? 'يرجى كتابة تفاصيل السؤال (حتى 20,000 حرف)' : 'Enter question details (up to 20,000 characters)');
      return;
    }
    if (code.length > 20000) {
      setError(lang === 'ar' ? 'الشيفرة تتجاوز الحد المسموح وهو 20,000 حرف' : 'Code exceeds the 20,000 character limit');
      return;
    }

    try {
      const question = await create.submit({
        language: lang,
        title: title.trim(),
        body: body.trim(),
        tags: selectedTags,
        ...(code.trim() ? { codeSnippet: code.trim() } : {}),
      });
      if (question) navigate(`/community/${question.id}`);
    } catch {
      // The hook exposes the request error and the form keeps all entered text.
    }
  };

  const requestError = error || create.error;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <nav className="flex items-center gap-2 text-xs text-[#5B5B7B]">
        <Link to="/" className="hover:underline">{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <Link to="/community" className="hover:underline">{lang === 'ar' ? 'المجتمع' : 'Community'}</Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <span className="text-[#12122B] font-bold">{lang === 'ar' ? 'اطرح سؤالًا' : 'Ask a Question'}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 card-pixel p-6 sm:p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-[#12122B] mb-1">{lang === 'ar' ? 'اطرح سؤالًا جديدًا' : 'Ask a New Question'}</h1>
            <p className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'اطرح مشكلتك التقنية بوضوح ليتمكن زملاؤك والخبراء من مساعدتك.' : 'Describe your technical challenge clearly so community members can assist you.'}</p>
          </div>

          {requestError && <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs text-[#E5432A] font-bold flex items-center gap-2" role="alert"><AlertCircle className="w-4 h-4 shrink-0" /><span>{requestError}</span></div>}

          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="question-title" className="block text-xs font-bold text-[#12122B]">{lang === 'ar' ? 'عنوان السؤال *' : 'Question Title *'}</label>
                <span className={`text-[10px] font-semibold ${title.length < 15 ? 'text-[#E5432A]' : 'text-[#1E9E5A]'}`}>{title.length} / 15 {lang === 'ar' ? 'حرفًا على الأقل' : 'chars minimum'}</span>
              </div>
              <input
                id="question-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={lang === 'ar' ? 'مثال: كيف أتعامل مع التداخل الرقمي في قراءات DS18B20 على ESP32 داخل خط إنتاج؟' : 'e.g. How can I reduce digital interference in DS18B20 readings on ESP32 in an industrial environment?'}
                className="w-full input-pixel text-xs"
                required
                minLength={15}
                maxLength={160}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#12122B]">{lang === 'ar' ? 'الوسوم * (اختر من 1 إلى 5 وسوم)' : 'Tags * (Select 1 to 5 tags)'}</label>
                {metadata.error && <button type="button" onClick={() => void metadata.retry()} className="text-[10px] font-bold text-[#0B2A9E] underline">{lang === 'ar' ? 'إعادة تحميل الوسوم' : 'Retry tags'}</button>}
              </div>
              {metadata.loading ? <div className="p-3 bg-[#F8F1E1] border-2 border-[#12122B] rounded-md text-xs text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل الوسوم…' : 'Loading tags…'}</div>
                : metadata.error ? <p className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs text-[#E5432A]" role="alert">{metadata.error}</p>
                  : <div className="p-3 bg-[#F8F1E1] border-2 border-[#12122B] rounded-md flex flex-wrap gap-1.5">
                    {metadata.skills.map((skill) => {
                      const selected = selectedTags.includes(skill);
                      return <TagChip key={skill} tag={skill} size="sm" selected={selected} onClick={() => toggleTag(skill)} onRemove={selected ? () => toggleTag(skill) : undefined} />;
                    })}
                  </div>}
            </div>

            <div>
              <label htmlFor="question-body" className="block text-xs font-bold text-[#12122B] mb-1.5">{lang === 'ar' ? 'تفاصيل السؤال *' : 'Question Details *'}</label>
              <textarea id="question-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder={lang === 'ar' ? 'اشرح السياق، القطع والمتحكمات المستخدمة، وسلوك النظام غير المتوقع…' : 'Explain hardware setup, firmware libraries, and observed anomalous behavior…'} rows={6} className="w-full input-pixel text-xs leading-relaxed" required maxLength={20000} />
            </div>

            <div>
              <label htmlFor="question-code" className="block text-xs font-bold text-[#12122B] mb-1.5">{lang === 'ar' ? 'شيفرة برمجية / سجلات (اختياري)' : 'Code Snippet / Error Logs (Optional)'}</label>
              <textarea id="question-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder={lang === 'ar' ? '// ألصق الشيفرة أو مخرجات المراقب التسلسلي هنا' : '// Paste code or serial monitor output here'} rows={4} className="w-full input-pixel font-code text-xs leading-relaxed bg-[#12122B] text-[#FFFBF1]" maxLength={20000} />
            </div>

            <div className="pt-4 border-t border-[#EFE4CC] flex items-center justify-end gap-3">
              <Link to="/community" className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Link>
              <button type="submit" disabled={create.loading || metadata.loading || Boolean(metadata.error)} className="px-6 py-2.5 rounded-md font-bold text-xs btn-pixel-primary cursor-pointer disabled:opacity-60">
                {create.loading ? (lang === 'ar' ? 'جارٍ النشر…' : 'Publishing…') : (lang === 'ar' ? 'نشر السؤال' : 'Publish Question')}
              </button>
            </div>
          </form>
        </div>

        <aside className="lg:col-span-4 card-pixel p-5 bg-[#EEF1FF] flex flex-col gap-4 border-[#0B2A9E]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B2A9E]"><HelpCircle className="w-4 h-4" /><span>{lang === 'ar' ? 'إرشادات السؤال الجيد' : 'Good Question Guidelines'}</span></div>
          <ul className="flex flex-col gap-2.5 text-xs text-[#12122B]">
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" /><span>{lang === 'ar' ? 'اذكر أرقام الموديلات الدقيقة للقطع والمتحكمات.' : 'State exact hardware models, sensors, and IC numbers.'}</span></li>
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" /><span>{lang === 'ar' ? 'حدد المحاولات والحلول التي جربتها مسبقاً.' : 'Highlight solutions you have already attempted.'}</span></li>
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" /><span>{lang === 'ar' ? 'أرفق عينات من الشيفرة أو رسائل الخطأ بدقة.' : 'Include reproducible code blocks and terminal logs.'}</span></li>
          </ul>
        </aside>
      </div>
    </div>
  );
};

export const AskQuestionPage: React.FC = () => {
  const { lang, dir, currentUser } = useApp();
  return <AskQuestionForm key={currentUser.id} identityId={currentUser.id} lang={lang} dir={dir} />;
};
