import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DifficultyMeter } from '../components/DifficultyMeter';
import { TagChip } from '../components/TagChip';
import {
  Coins,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronRight,
  ChevronLeft,
  Send,
  Check,
  FileText,
} from 'lucide-react';
import { getProblemContact, getProblemPrivate } from '../api/problems';
import { apiErrorMessage } from '../api/client';
import { fileUrl } from '../api/files';

const ProblemDetailContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    lang,
    dir,
    currentRole,
    currentUser,
    problems,
    addProblemComment,
    calculateEligibility,
    openAuthModal,
    loadProblem,
    submissions,
  } = useApp();
  const loadProblemRef = useRef(loadProblem);
  useEffect(() => { loadProblemRef.current = loadProblem; }, [loadProblem]);

  const [commentInput, setCommentInput] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [contact, setContact] = useState<{ contactEmail: string; contactUrl: string } | null>(null);
  const [privateDetails, setPrivateDetails] = useState<{ notes: string; notesEn?: string; files: { id: string; originalName: string }[] } | null>(null);
  const contactRequestSequence = useRef(0);
  const privateRequestSequence = useRef(0);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState('');
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const problem = problems.find((p) => p.id === id);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!id) { setDetailLoading(false); return; }
      setDetailLoading(true); setDetailError('');
      void loadProblemRef.current(id).catch((reason) => { if (active) setDetailError(apiErrorMessage(reason, lang)); })
        .finally(() => { if (active) setDetailLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [id, lang]);
  const eligibility = problem ? calculateEligibility(problem.id, problem.tags) : null;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem) return;
    if (!commentInput.trim()) return;
    if (currentRole === 'visitor') {
      openAuthModal();
      return;
    }
    setCommentBusy(true); setCommentError('');
    try { await addProblemComment(problem.id, commentInput.trim()); setCommentInput(''); }
    catch (reason) { setCommentError(apiErrorMessage(reason, lang)); }
    finally { setCommentBusy(false); }
  };

  const loadContact = async () => {
    const sequence = ++contactRequestSequence.current;
    setContact(null);
    try {
      const result = await getProblemContact(problem!.id);
      if (sequence === contactRequestSequence.current) setContact(result);
    } catch (reason) {
      if (sequence === contactRequestSequence.current) {
        setContact(null);
        setCommentError(apiErrorMessage(reason, lang));
      }
    }
  };
  const loadPrivate = async () => {
    const sequence = ++privateRequestSequence.current;
    setPrivateDetails(null);
    try {
      const details = await getProblemPrivate(problem!.id);
      if (sequence === privateRequestSequence.current) setPrivateDetails({ notes: details.notes || '', notesEn: details.notesEn || '', files: details.files || [] });
    }
    catch (reason) {
      if (sequence === privateRequestSequence.current) {
        setPrivateDetails(null);
        setCommentError(apiErrorMessage(reason, lang));
      }
    }
  };

  if (detailLoading && !problem) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل المشكلة…' : 'Loading problem…'}</div>;
  if (!problem || !eligibility) return <div className="max-w-7xl mx-auto px-4 py-16"><div className="card-pixel p-10 text-center"><h1 className="text-xl font-bold text-[#12122B]">{lang === 'ar' ? 'المشكلة غير موجودة' : 'Problem not found'}</h1><p className="text-xs text-[#5B5B7B] mt-2">{detailError || (lang === 'ar' ? 'لا يمكن عرض هذه المشكلة.' : 'This problem could not be loaded.')}</p><Link to="/problems" className="inline-block mt-4 text-xs font-bold text-[#0B2A9E] underline">{lang === 'ar' ? 'العودة إلى المشكلات' : 'Back to problems'}</Link></div></div>;
  const canViewPrivate = (currentRole === 'company' && problem.companyUserId === currentUser.id) || submissions.some((application) => application.problemId === problem.id && application.status === 'accepted');
  const myApplication = submissions.find((application) => application.problemId === problem.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <nav className="flex items-center gap-2 text-xs text-[#5B5B7B]">
        <Link to="/" className="hover:underline">
          {lang === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <Link to="/problems" className="hover:underline">
          {lang === 'ar' ? 'المشكلات' : 'Problems'}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <span className="text-[#12122B] font-bold truncate max-w-sm">
          {lang === 'ar' ? problem.title : problem.title_en}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="card-pixel p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between text-xs border-b border-[#EFE4CC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#12122B] text-[#FFFBF1] flex items-center justify-center font-bold text-sm shadow-pixel-s">
                  {lang === 'ar' ? problem.companyAvatar : problem.companyName_en?.trim().slice(0, 1) || problem.companyAvatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#12122B] text-sm">
                      {lang === 'ar' ? problem.companyName : problem.companyName_en}
                    </span>
                    <span className="font-tag text-[9px] px-1.5 py-0.2 bg-[#0B2A9E] text-[#FFFBF1] rounded-xs font-bold">
                      {lang === 'ar' ? 'شركة' : 'COMPANY'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#5B5B7B]">
                    {lang === 'ar' ? problem.postedAt : problem.postedAt_en}
                  </span>
                </div>
              </div>

              <DifficultyMeter difficulty={problem.difficulty} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#12122B] leading-tight">
              {lang === 'ar' ? problem.title : problem.title_en}
            </h1>

            <div className="flex flex-wrap gap-1.5">
              {problem.tags.map((tag) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  isMatched={eligibility.matchedSkills.includes(tag)}
                />
              ))}
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#12122B] mb-2 uppercase tracking-wide">
                {lang === 'ar' ? 'سياق ووصف المشكلة' : 'Context & Challenge Overview'}
              </h2>
              <p className="text-sm sm:text-base text-[#12122B] leading-relaxed whitespace-pre-line font-normal">
                {lang === 'ar' ? problem.description : problem.description_en}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#12122B] mb-3 uppercase tracking-wide">
                {lang === 'ar' ? 'المخرجات المطلوبة' : 'Expected Deliverables'}
              </h2>
              <div className="flex flex-col gap-2.5">
                {(lang === 'ar' ? problem.deliverables : problem.deliverables_en).map(
                  (item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 bg-[#F8F1E1] border border-[#12122B] rounded-md text-xs font-semibold text-[#12122B]"
                    >
                      <Check className="w-4 h-4 text-[#1E9E5A] shrink-0 mt-0.5 stroke-[3]" />
                      <span>{item}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s">
                <h3 className="text-xs font-bold text-[#12122B] mb-2.5">
                  {lang === 'ar' ? 'المحددات والقيود الفنية' : 'Technical Constraints'}
                </h3>
                <ul className="flex flex-col gap-2 text-xs text-[#5B5B7B]">
                  {(lang === 'ar' ? problem.constraints : problem.constraints_en).map(
                    (c, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#0B2A9E] font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="p-4 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s">
                <h3 className="text-xs font-bold text-[#12122B] mb-2.5">
                  {lang === 'ar' ? 'معايير تقييم المقترحات' : 'Evaluation Criteria'}
                </h3>
                <ul className="flex flex-col gap-2 text-xs text-[#5B5B7B]">
                  {(lang === 'ar' ? problem.criteria : problem.criteria_en).map(
                    (cr, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#1E9E5A] font-bold">✓</span>
                        <span>{cr}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>

          {problem.files?.length ? <div className="card-pixel p-5 flex flex-col gap-2"><h2 className="text-sm font-bold text-[#12122B]">{lang === 'ar' ? 'مرفقات عامة' : 'Public attachments'}</h2>{problem.files.map((file) => <a key={file.id} href={fileUrl(file.id)} className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B2A9E] underline"><FileText className="w-4 h-4" />{file.originalName}</a>)}</div> : null}

          <div className="card-pixel p-6 sm:p-8 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-[#12122B]">
              {lang === 'ar' ? 'النقاش والاستفسارات التقنية' : 'Technical Discussion & Queries'}
            </h2>

            <div className="flex flex-col gap-4">
              {problem.discussions.length === 0 ? (
                <p className="text-xs text-[#5B5B7B]">
                  {lang === 'ar'
                    ? 'لا توجد تعليقات بعد. اطرح أول استفسار للشركة.'
                    : 'No discussion comments yet. Be the first to ask the company.'}
                </p>
              ) : (
                problem.discussions.map((comment) => (
                  <div key={comment.id} className="flex flex-col gap-3">
                    <div
                      className={`p-4 rounded-md border-2 border-[#12122B] text-xs ${
                        comment.isCompany
                          ? 'bg-[#EEF1FF] border-[#0B2A9E] shadow-pixel-s'
                          : 'bg-[#FFFBF1]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#12122B]">
                            {lang === 'ar' ? comment.author : comment.author_en}
                          </span>
                          {comment.isCompany && (
                            <span className="font-tag text-[9px] px-1.5 py-0.2 bg-[#0B2A9E] text-[#FFFBF1] rounded-xs font-bold">
                              {lang === 'ar' ? 'شركة' : 'COMPANY'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#5B5B7B]">
                          {lang === 'ar' ? comment.createdAt : comment.createdAt_en}
                        </span>
                      </div>
                      <p className="text-[#12122B] leading-relaxed">
                        {lang === 'ar' ? comment.body : comment.body_en}
                      </p>
                    </div>

                    {comment.replies &&
                      comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`ms-6 p-4 rounded-md border-2 border-[#12122B] text-xs ${
                            reply.isCompany
                              ? 'bg-[#EEF1FF] border-[#0B2A9E] shadow-pixel-s'
                              : 'bg-[#FFFBF1]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#12122B]">
                                {lang === 'ar' ? reply.author : reply.author_en}
                              </span>
                              {reply.isCompany && (
                                <span className="font-tag text-[9px] px-1.5 py-0.2 bg-[#0B2A9E] text-[#FFFBF1] rounded-xs font-bold">
                                  {lang === 'ar' ? 'شركة' : 'COMPANY'}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#5B5B7B]">
                              {lang === 'ar' ? reply.createdAt : reply.createdAt_en}
                            </span>
                          </div>
                          <p className="text-[#12122B] leading-relaxed">
                            {lang === 'ar' ? reply.body : reply.body_en}
                          </p>
                        </div>
                      ))}
                  </div>
                ))
              )}
            </div>

            {commentError && <div className="p-3 bg-[#FFE3DC] border border-[#E5432A] rounded-md text-xs font-bold text-[#E5432A]">{commentError}</div>}
            <form onSubmit={handlePostComment} className="flex flex-col gap-3 pt-3 border-t border-[#EFE4CC]">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اكتب استفساراً تقنياً أو ملاحظة للشركة حول هذا التحدي…'
                    : 'Ask a technical question to the company about this problem…'
                }
                rows={3}
                  maxLength={5000}
                className="w-full input-pixel text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={commentBusy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-bold text-xs btn-pixel-primary cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{commentBusy ? (lang === 'ar' ? 'جارٍ الإرسال…' : 'Posting…') : (lang === 'ar' ? 'إرسال التعليق' : 'Post comment')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
          <div className="card-pixel p-6 flex flex-col gap-5">
            <div className="p-4 bg-[#FFF1CC] border-2 border-[#12122B] rounded-md shadow-pixel-s">
              <span className="text-[11px] font-bold text-[#5B5B7B] uppercase block mb-1">
                {lang === 'ar' ? 'ميزانية التحدي المنشورة' : 'Listed Challenge Budget'}
              </span>
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-[#12122B]" />
                <span className="font-tag text-2xl font-bold text-[#12122B]">
                  {lang === 'ar' ? problem.rewardFormatted : problem.rewardFormatted_en}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-[#12122B] py-1 border-b border-[#EFE4CC]">
              <div className="flex items-center justify-between">
                <span className="text-[#5B5B7B]">{lang === 'ar' ? 'آخر موعد للتقديم:' : 'Submission Deadline:'}</span>
                <span className="font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {lang === 'ar' ? problem.deadlineText : problem.deadlineText_en}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5B5B7B]">{lang === 'ar' ? 'عدد المقترحات المقدمة:' : 'Proposals received:'}</span>
                <span className="font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {problem.proposalsCount}
                </span>
              </div>
            </div>

            {currentRole !== 'visitor' && <div className="p-3 bg-[#EEF1FF] border border-[#0B2A9E] rounded-md flex flex-col gap-2"><button type="button" onClick={() => void loadContact()} className="text-xs font-bold text-[#0B2A9E] underline text-start">{lang === 'ar' ? 'عرض بيانات التواصل' : 'Show contact details'}</button>{contact && (contact.contactEmail || contact.contactUrl ? <div className="text-xs flex flex-col gap-1">{contact.contactEmail && <a href={'mailto:' + contact.contactEmail} className="text-[#12122B] underline">{contact.contactEmail}</a>}{contact.contactUrl && <a href={contact.contactUrl} target="_blank" rel="noreferrer" className="text-[#12122B] underline">{contact.contactUrl}</a>}</div> : <p className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'لم تشارك الشركة بيانات التواصل.' : 'The company has not shared contact details.'}</p>)}</div>}
            {canViewPrivate && <div className="p-3 bg-[#FFF1CC] border border-[#12122B] rounded-md flex flex-col gap-2"><button type="button" onClick={() => void loadPrivate()} className="text-xs font-bold text-[#12122B] underline text-start">{lang === 'ar' ? 'عرض الملاحظات والمرفقات الخاصة' : 'Show private notes and files'}</button>{privateDetails && <><p className="text-xs whitespace-pre-line">{lang === 'ar' ? privateDetails.notes : (privateDetails.notesEn || privateDetails.notes)}</p>{privateDetails.files.map((file) => <a key={file.id} href={fileUrl(file.id)} className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B2A9E] underline"><FileText className="w-4 h-4" />{file.originalName}</a>)}</>}</div>}

            <div>
              {problem.status === 'CLOSED' && <div className="p-4 bg-[#EFE4CC] border-2 border-[#12122B] rounded-md text-xs font-bold text-[#5B5B7B]">{lang === 'ar' ? 'أُغلق هذا التحدي الصناعي وتم اختيار المهندس المنفّذ.' : 'This challenge is closed and no longer accepts proposals.'}</div>}
              {eligibility.status === 'company' && (
                <div className="p-4 bg-[#EEF1FF] border-2 border-[#0B2A9E] rounded-md text-xs text-[#0B2A9E] flex flex-col gap-2">
                  {problem.companyUserId === currentUser.id ? (
                    <>
                      <p className="font-bold">
                        {lang === 'ar'
                          ? 'هذا التحدي منشور من طرف شركتك. يمكنك متابعة العروض الهندسية المقدمة واعتماد الحل المناسب من لوحة التحكم.'
                          : 'This challenge was posted by your company. You can review proposals and choose an engineer.'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Link
                          to={`/company/problems/${problem.id}/applications`}
                          className="px-3 py-1.5 rounded-md font-bold text-xs btn-pixel-accent text-center"
                        >
                          {lang === 'ar' ? 'مراجعة العروض الهندسية' : 'Review Proposals'}
                        </Link>
                        <Link
                          to={`/company/problems/${problem.id}/edit`}
                          className="px-3 py-1.5 rounded-md font-bold text-xs btn-pixel-secondary text-center"
                        >
                          {lang === 'ar' ? 'تعديل التحدي' : 'Edit Challenge'}
                        </Link>
                      </div>
                    </>
                  ) : (
                    <p>
                      {lang === 'ar'
                        ? 'أنت تتصفح بحساب شركة صناعية. تقديم العروض التقنية مخصص للمهندسين وخبراء الحلول.'
                        : 'You are signed in with a company account. Submitting proposals is reserved for engineers and solvers.'}
                    </p>
                  )}
                </div>
              )}
              {eligibility.status === 'submitted' && (
                <div className="p-4 bg-[#D9F5E5] border-2 border-[#1E9E5A] rounded-md flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1E9E5A]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{myApplication?.status === 'accepted' ? (lang === 'ar' ? 'تم اعتماد عرضك الهندسي بنجاح' : 'Proposal accepted') : myApplication?.status === 'rejected' ? (lang === 'ar' ? 'تم الاعتذار عن العرض' : 'Proposal not selected') : (lang === 'ar' ? 'تم تقديم عرضك الهندسي للشركة' : 'Proposal submitted')}</span>
                  </div>
                  <p className="text-xs text-[#12122B] leading-relaxed">
                    {lang === 'ar'
                      ? myApplication?.status === 'rejected' ? (myApplication.rejectionReason || 'اطلع على صفحة طلباتك لمتابعة تفاصيل القرار.') : myApplication?.status === 'accepted' ? 'اختارتك الشركة لتنفيذ الحل الهندسي لهذا التحدي.' : 'عرضك محفوظ لدى الشركة وهو قيد المراجعة الفنية.'
                      : myApplication?.status === 'rejected' ? (myApplication.rejectionReasonEn || myApplication.rejectionReason || 'Open My Applications to review the decision.') : myApplication?.status === 'accepted' ? 'The company selected you for this project.' : 'Your proposal is saved for company technical review.'}
                  </p>
                  <span className="font-tag text-[10px] font-bold text-[#1E9E5A] uppercase">
                    {lang === 'ar'
                      ? myApplication?.status === 'accepted' ? 'الحالة: معتمد ومقبول' : myApplication?.status === 'rejected' ? 'الحالة: معتذر عنه' : 'الحالة: قيد المراجعة الفنية'
                      : myApplication?.status === 'accepted' ? 'STATUS: ACCEPTED' : myApplication?.status === 'rejected' ? 'STATUS: REJECTED' : 'STATUS: UNDER REVIEW'}
                  </span>
                </div>
              )}

              {eligibility.status === 'eligible' && (
                <div className="p-4 bg-[#F0FFC4] border-2 border-[#12122B] rounded-md shadow-pixel-s flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#12122B]">
                    <CheckCircle2 className="w-4 h-4 text-[#1E9E5A]" />
                    <span>
                      {lang === 'ar'
                        ? `تطابق مهاراتك ${eligibility.matchCount} من ${eligibility.totalCount} مهارات مطلوبة.`
                        : `Your skills match ${eligibility.matchCount} of ${eligibility.totalCount} tags.`}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B5B7B] leading-relaxed">
                    {lang === 'ar'
                      ? 'يمكنك التقديم وطرح عرضك الفني وميزانيتك حتى لو لم تتطابق كل المهارات بدقة.'
                      : 'You can apply even when your skills do not match every listed requirement.'}
                  </p>
                  {problem.status !== 'CLOSED' && <Link
                    to={`/problems/${problem.id}/submit`}
                    className="w-full py-2.5 text-center rounded-md font-bold text-xs btn-pixel-accent"
                  >
                    {lang === 'ar' ? 'قدّم عرضك الهندسي الآن' : 'Submit proposal'}
                  </Link>}
                </div>
              )}

              {eligibility.status === 'mismatch' && (
                <div className="p-4 bg-[#F8F1E1] border-2 border-[#12122B] rounded-md flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#12122B]">
                    <AlertCircle className="w-4 h-4 text-[#FFC53D]" />
                    <span>{lang === 'ar' ? 'تفاوت في المهارات التقنية' : 'Skill Mismatch'}</span>
                  </div>
                  <p className="text-xs text-[#5B5B7B] leading-relaxed">
                    {lang === 'ar'
                      ? 'مهاراتك المسجلة حالياً تختلف جزئياً عن متطلبات التحدي. يمكنك المشاركة في الاستفسارات التقنية مع الشركة أو تحديث ملفك.'
                      : 'Your current skills profile does not match the tags required. You may still participate in discussions.'}
                  </p>
                  <Link
                    to="/profile/solver"
                    className="w-full py-2 text-center rounded-md font-bold text-xs btn-pixel-secondary"
                  >
                    {lang === 'ar' ? 'تعديل المهارات في ملفك الهندسي' : 'Update solver skills'}
                  </Link>
                </div>
              )}

              {eligibility.status === 'needs_profile' && (
                <div className="p-4 bg-[#FFFBF1] border-2 border-[#0B2A9E] rounded-md shadow-pixel-s flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B2A9E]">
                    <Lock className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'مطلوب إكمال ملف خبير الحلول' : 'Solver Profile Required'}</span>
                  </div>
                  <p className="text-xs text-[#5B5B7B] leading-relaxed">
                    {lang === 'ar'
                ? 'أنت مسجل كعضو. أكمل ملفك الهندسي لتقديم عروض وحلول للتحديات الصناعية.'
                      : 'You are signed in as a member. Complete your talent profile to submit proposals.'}
                  </p>
                  <Link
                    to="/profile/solver"
                    className="w-full py-2.5 text-center rounded-md font-bold text-xs btn-pixel-accent"
                  >
                    {lang === 'ar' ? 'أكمل ملف خبير الحلول' : 'Complete solver profile'}
                  </Link>
                </div>
              )}

              {eligibility.status === 'visitor' && (
                <div className="p-4 bg-[#F8F1E1] border-2 border-[#12122B] rounded-md flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#12122B]">
                    <Lock className="w-4 h-4 text-[#0B2A9E]" />
                    <span>{lang === 'ar' ? 'سجّل الدخول لتقديم حل' : 'Sign in to apply'}</span>
                  </div>
                  <p className="text-xs text-[#5B5B7B] leading-relaxed">
                    {lang === 'ar'
                      ? 'التصفح مجاني. للتقديم على المشكلات ومناقشتها، سجّل الدخول أو أنشئ حسابًا جديدًا.'
                      : 'Create a free account or sign in to submit proposals and discuss solutions.'}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      to="/signin"
                      className="flex-1 py-2 text-center rounded-md font-bold text-xs btn-pixel-secondary"
                    >
                      {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
                    </Link>
                    <Link
                      to="/signup"
                      className="flex-1 py-2 text-center rounded-md font-bold text-xs btn-pixel-accent"
                    >
                      {lang === 'ar' ? 'إنشاء حساب' : 'Sign up'}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#5B5B7B] text-center pt-2 border-t border-[#EFE4CC]">
              {lang === 'ar'
                ? 'اتفق مع الشركة على شروط السرية والملكية الفكرية قبل مشاركة بيانات حساسة أو بدء التنفيذ.'
                : 'Agree with the company on confidentiality and intellectual property terms before sharing sensitive work or starting delivery.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProblemDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { currentUser } = useApp();
  return <ProblemDetailContent key={`${id}:${currentUser.id}`} />;
};
