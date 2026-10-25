# Streaming brief and guided questions

Approved direction: user requested implementation of the proposed guided brief builder on 25 October 2026, without subagents. Work in existing feature branch; preserve theme, public-only application, generous output settings and manual posting. No push/deploy.

1. Add completed-field provisional extraction and a LangChain streaming adapter. Test arbitrary chunk boundaries, escaped strings/Arabic, invalid values, repair resets and cancellation. Final Zod validation remains the only route to an applicable draft.
2. Expose authenticated POST SSE alongside the existing JSON endpoint. Send real drafting/checking/repair events and provisional snapshots; abort on disconnect, retain safe errors and optional provider config. Test local streamed inference end-to-end.
3. Add a fetch-based SSE reader and hook state for provisional/final drafts, previous-result restoration and changed fields. Reuse the preview for progressive sections, skeletons and update highlights. Keep no raw JSON or reasoning in the UI.
4. Replace the question wall with a reusable guided question component: one at a time, Next/Skip/Back, answer review, no model call for local navigation, optional update at any time. Keep answers through refinements and locale/mode switches.
5. Use small CSS effects with reduced-motion support. Run focused/full tests, builds/lint, live streaming and Playwright functional/RTL/mobile/cancel/error/refinement/form review. Record actual results in AI-BRIEF.md and commit stages.

No native JSON mode, streaming infrastructure, websocket service or UI animation dependency required. Retain existing non-stream API. VPS proxy streaming must be checked when a future deployment is authorized; no live server operation in this task.
