import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TagChip } from '../components/TagChip';
import { ALL_SKILLS_TAXONOMY } from '../data/mockData';
import { AlertCircle, Check, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

export const AskQuestionPage: React.FC = () => {
  const { lang, dir, addQuestion } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [code, setCode] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['IOT', 'EMBEDDED']);
  const [error, setError] = useState('');

  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 5) {
        setError(
          lang === 'ar'
            ? 'يمكنك اختيار حتى 5 وسوم كحد أقصى'
            : 'You can select up to 5 tags maximum'
        );
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 15) {
      setError(
        lang === 'ar'
          ? 'عنوان السؤال يجب أن يحتوي على 15 حرفًا على الأقل'
          : 'Question title must be at least 15 characters'
      );
      return;
    }

    if (selectedTags.length < 1 || selectedTags.length > 5) {
      setError(
        lang === 'ar'
          ? 'يرجى اختيار من 1 إلى 5 وسوم'
          : 'Please select 1 to 5 tags'
      );
      return;
    }

    if (!body.trim()) {
      setError(
        lang === 'ar'
          ? 'يرجى كتابة تفاصيل السؤال'
          : 'Please enter question details'
      );
      return;
    }

    const excerpt = body.slice(0, 150) + (body.length > 150 ? '…' : '');
    const newId = addQuestion(title.trim(), excerpt, body.trim(), selectedTags, code.trim() || undefined);
    navigate(`/community/${newId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <nav className="flex items-center gap-2 text-xs text-[#5B5B7B]">
        <Link to="/" className="hover:underline">
          {lang === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <Link to="/community" className="hover:underline">
          {lang === 'ar' ? 'المجتمع' : 'Community'}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <span className="text-[#12122B] font-bold">
          {lang === 'ar' ? 'اطرح سؤالًا' : 'Ask a Question'}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 card-pixel p-6 sm:p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-[#12122B] mb-1">
              {lang === 'ar' ? 'اطرح سؤالًا جديدًا' : 'Ask a New Question'}
            </h1>
            <p className="text-xs text-[#5B5B7B]">
              {lang === 'ar'
                ? 'اطرح مشكلتك التقنية بوضوح ليتمكن زملاؤك والخبراء من مساعدتك.'
                : 'Formulate your technical challenge clearly so community members can assist you.'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs text-[#E5432A] font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#12122B]">
                  {lang === 'ar' ? 'عنوان السؤال *' : 'Question Title *'}
                </label>
                <span
                  className={`text-[10px] font-semibold ${
                    title.length < 15 ? 'text-[#E5432A]' : 'text-[#1E9E5A]'
                  }`}
                >
                  {title.length} / 15 {lang === 'ar' ? 'حرفًا على الأقل' : 'chars minimum'}
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'مثال: كيف أقلّل ضجيج قراءات حساس الحرارة على ESP32 داخل خط إنتاج؟'
                    : 'e.g. How to reduce ADC noise on ESP32 in an industrial plant environment?'
                }
                className="w-full input-pixel text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#12122B] mb-1">
                {lang === 'ar'
                  ? 'الوسوم * (اختر من 1 إلى 5 وسوم)'
                  : 'Tags * (Select 1 to 5 tags)'}
              </label>
              <div className="p-3 bg-[#F8F1E1] border-2 border-[#12122B] rounded-md flex flex-wrap gap-1.5">
                {ALL_SKILLS_TAXONOMY.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TagChip
                      key={tag}
                      tag={tag}
                      size="sm"
                      selected={isSelected}
                      onClick={() => toggleTag(tag)}
                      onRemove={isSelected ? () => toggleTag(tag) : undefined}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                {lang === 'ar' ? 'تفاصيل السؤال *' : 'Question Details *'}
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اشرح السياق، القطع والمتحكمات المستخدمة، وسلوك النظام غير المتوقع…'
                    : 'Explain hardware setup, firmware libraries, and observed anomalous behavior…'
                }
                rows={6}
                className="w-full input-pixel text-xs leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                {lang === 'ar'
                  ? 'شيفرة برمجية / سجلات (اختياري)'
                  : 'Code Snippet / Error Logs (Optional)'}
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste code or serial monitor output here"
                rows={4}
                className="w-full input-pixel font-code text-xs leading-relaxed bg-[#12122B] text-[#FFFBF1]"
              />
            </div>

            <div className="pt-4 border-t border-[#EFE4CC] flex items-center justify-end gap-3">
              <Link
                to="/community"
                className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-md font-bold text-xs btn-pixel-primary cursor-pointer"
              >
                {lang === 'ar' ? 'نشر السؤال' : 'Publish Question'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-4 card-pixel p-5 bg-[#EEF1FF] flex flex-col gap-4 border-[#0B2A9E]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B2A9E]">
            <HelpCircle className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إرشادات السؤال الجيد' : 'Good Question Guidelines'}</span>
          </div>

          <ul className="flex flex-col gap-2.5 text-xs text-[#12122B]">
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" />
              <span>
                {lang === 'ar'
                  ? 'اذكر أرقام الموديلات الدقيقة للقطع والمتحكمات.'
                  : 'State exact hardware models, sensors, and IC numbers.'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" />
              <span>
                {lang === 'ar'
                  ? 'حدد المحاولات والحلول التي جربتها مسبقاً.'
                  : 'Highlight solutions you have already attempted.'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" />
              <span>
                {lang === 'ar'
                  ? 'أرفق عينات من الشيفرة أو رسائل الخطأ بدقة.'
                  : 'Include reproducible code blocks and terminal logs.'}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
