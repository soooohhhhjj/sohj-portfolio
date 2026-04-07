import type { Dispatch, SetStateAction, PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

import type { Anchor, JourneyItemNode } from "../types/journey.types";
import type { EdgeOverride } from "../utils/journeyEditorStorage";

type GapOverrides = {
  parentToChildGap?: number;
  parentToParentGap?: number;
};

type Size = { width: number; height: number };

type RenderEdge = {
  fromAnchor?: Anchor;
  toAnchor?: Anchor;
};

export type JourneyEditorHudPortalProps = {
  editorEnabled: boolean;
  editorActive: boolean;
  editorToolsEnabled: boolean;

  hudMinimized: boolean;
  setHudMinimized: Dispatch<SetStateAction<boolean>>;
  hudRefCallback: (node: HTMLDivElement | null) => void;
  onHudPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onHudPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onHudPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;

  editorClickMode: "modal" | "edit";
  onEditorClickModeChange: (next: "modal" | "edit") => void;

  layoutId: string;
  containerWidth: number | null;
  scale: number;
  templateSize: Size | null;
  selectedEdgeKey: string | null;
  selectedRenderEdge: RenderEdge | null;

  isStackedMobileLayout: boolean;
  effectiveParentToChildGap: number | null;
  effectiveParentToParentGap: number | null;

  gapDefaults: GapOverrides | null;
  gapOverrides: GapOverrides;
  setGapOverrides: Dispatch<SetStateAction<GapOverrides>>;

  visibleItems: JourneyItemNode[];
  selectedEditorCardId: string | null;
  setSelectedEditorCardId: Dispatch<SetStateAction<string | null>>;
  selectedEditorCard: JourneyItemNode | null;
  selectedEditorCardSize: Size | null;
  upsertCardTextOverride: (id: string, patch: Partial<JourneyItemNode>) => void;
  clearCardTextOverride: (id: string) => void;
  resetAllCardTextOverrides: () => void;
  handleDeleteCard: (id: string) => void;

  deletedIds: string[];
  selectedDeletedId: string;
  setSelectedDeletedId: Dispatch<SetStateAction<string>>;
  handleRestoreDeleted: (id: string) => void;
  handleRestoreAllDeleted: () => void;

  setEdgeOverrides: Dispatch<SetStateAction<Record<string, EdgeOverride>>>;
  cycleAnchor: (value: Anchor) => Anchor;
  handleOrthogonalizeSelectedEdge: () => void;

  handleCopyEdits: () => void;
  handleMatchAllToTemplate: () => void;
  handleResetEdits: () => void;
  setHudPos: Dispatch<SetStateAction<{ x: number; y: number }>>;
};

export function JourneyEditorHudPortal({
  editorEnabled,
  editorActive,
  editorToolsEnabled,
  hudMinimized,
  setHudMinimized,
  hudRefCallback,
  onHudPointerDown,
  onHudPointerMove,
  onHudPointerUp,
  editorClickMode,
  onEditorClickModeChange,
  layoutId,
  containerWidth,
  scale,
  templateSize,
  selectedEdgeKey,
  selectedRenderEdge,
  isStackedMobileLayout,
  effectiveParentToChildGap,
  effectiveParentToParentGap,
  gapDefaults,
  gapOverrides,
  setGapOverrides,
  visibleItems,
  selectedEditorCardId,
  setSelectedEditorCardId,
  selectedEditorCard,
  selectedEditorCardSize,
  upsertCardTextOverride,
  clearCardTextOverride,
  resetAllCardTextOverrides,
  handleDeleteCard,
  deletedIds,
  selectedDeletedId,
  setSelectedDeletedId,
  handleRestoreDeleted,
  handleRestoreAllDeleted,
  setEdgeOverrides,
  cycleAnchor,
  handleOrthogonalizeSelectedEdge,
  handleCopyEdits,
  handleMatchAllToTemplate,
  handleResetEdits,
  setHudPos,
}: JourneyEditorHudPortalProps) {
  if (!editorEnabled || !editorActive) return null;
  if (typeof document === "undefined") return null;

  const hudLabelClassName = `journey-editor-hud__label font-jura
  pt-1
  text-[0.7rem] tracking-[0.06em] uppercase
  text-white/65`;

  const hudFieldGridClassName = `grid grid-cols-[3.25rem_1fr]
  items-start gap-2`;

  const hudRowGridClassName = `grid grid-cols-[3.25rem_1fr]
  items-center gap-2`;

  const hudControlBaseClassName = `w-full min-w-0
  rounded-md border border-white/15
  bg-black/20
  px-[0.55rem] py-[0.45rem]
  font-jura text-[0.75rem] text-white/80
  outline-none
  focus:border-emerald-400/50
  focus:ring-2 focus:ring-emerald-400/10`;

  const hudSelectClassName = `journey-editor-hud__select ${hudControlBaseClassName}
  truncate`;

  const hudInputClassName = `journey-editor-hud__input ${hudControlBaseClassName}
  truncate`;

  const hudTextareaClassName = `journey-editor-hud__textarea ${hudControlBaseClassName}
  min-h-[3.2rem] resize-y`;

  const hudButtonPrimaryClassName = `font-jura
  rounded-md border border-emerald-400/25
  bg-black/20
  px-[0.6rem] py-[0.45rem]
  text-[0.72rem] tracking-[0.06em] text-white/75
  transition-colors duration-150
  hover:bg-black/30 hover:text-white/90`;

  const hudButtonNeutralClassName = `font-jura
  rounded-md border border-white/15
  bg-white/5
  px-[0.55rem] py-[0.4rem]
  text-[0.72rem] tracking-[0.05em] text-white/75
  transition-colors duration-150
  hover:bg-white/10 hover:text-white/90`;

  return createPortal(
    <div
      ref={hudRefCallback}
      className={`journey-editor-hud fixed left-4 top-4 z-[80]
      box-border
      w-[min(92vw,44rem)] max-h-[min(82vh,46rem)]
      overflow-auto
      rounded-lg border border-white/10
      bg-black/60
      px-[0.85rem] pt-5 pb-3
      will-change-transform
      ${hudMinimized ? "w-fit max-w-[92vw] pb-[0.65rem]" : ""}`}
    >
      <div
        className="journey-editor-hud__drag-grip absolute
        left-1/2 top-2 -translate-x-1/2
        h-[5px] w-[56px]
        rounded-full border border-emerald-400/35
        bg-emerald-400/10
        cursor-grab active:cursor-grabbing
        touch-none select-none"
        onPointerDown={onHudPointerDown}
        onPointerMove={onHudPointerMove}
        onPointerUp={onHudPointerUp}
        aria-label="Drag editor panel"
        role="presentation"
      />

      <div className="journey-editor-hud__title-row flex items-center justify-between gap-3">
        <div className="journey-editor-hud__title font-jura
        text-[0.75rem] tracking-[0.08em] uppercase
        text-white/80">
          Journey Edit Mode
        </div>
        <div className="journey-editor-hud__title-actions flex items-center gap-2">
          <button
            type="button"
            className="journey-editor-hud__mini-toggle font-jura
            rounded-md border border-white/15
            bg-white/5
            px-2 py-1
            text-[0.7rem] tracking-[0.06em] text-white/70
            transition-colors duration-150
            hover:bg-white/10 hover:text-white/90"
            onClick={() => setHudMinimized((prev) => !prev)}
            aria-label={hudMinimized ? "Expand editor panel" : "Minimize editor panel"}
          >
            {hudMinimized ? "Expand" : "Minimize"}
          </button>
        </div>
      </div>

      <div className="journey-editor-hud__mode-row mt-2 grid grid-cols-[3.25rem_1fr] items-center gap-2">
        <label className={hudLabelClassName} htmlFor="journey-editor-click-mode">
          Click
        </label>
        <select
          id="journey-editor-click-mode"
          className={hudSelectClassName}
          value={editorClickMode}
          onChange={(event) => onEditorClickModeChange(event.target.value as "modal" | "edit")}
        >
          <option value="modal">Modal</option>
          <option value="edit">Edit</option>
        </select>
      </div>

      {hudMinimized ? (
        <div
          className="journey-editor-hud__mini-meta mt-2 grid gap-1 font-jura text-[0.72rem] text-white/70"
          aria-label="Selection summary"
        >
          <div className="journey-editor-hud__mini-meta-row grid grid-cols-[3.25rem_1fr] items-center gap-2">
            <span className="journey-editor-hud__mini-meta-key tracking-[0.06em] uppercase text-white/50">
              Card
            </span>
            <span className="journey-editor-hud__mini-meta-value max-w-[min(72vw,16rem)] truncate text-white/80">
              {selectedEditorCard?.id ?? "none"}
            </span>
          </div>
          <div className="journey-editor-hud__mini-meta-row grid grid-cols-[3.25rem_1fr] items-center gap-2">
            <span className="journey-editor-hud__mini-meta-key tracking-[0.06em] uppercase text-white/50">
              Size
            </span>
            <span className="journey-editor-hud__mini-meta-value max-w-[min(72vw,16rem)] truncate text-white/80">
              {selectedEditorCardSize
                ? `${selectedEditorCardSize.width}x${selectedEditorCardSize.height}`
                : "n/a"}
            </span>
          </div>
        </div>
      ) : null}

      {hudMinimized && selectedRenderEdge ? (
        <div className="journey-editor-hud__mini-actions mt-2 flex justify-end">
          <button type="button" className={hudButtonPrimaryClassName} onClick={handleOrthogonalizeSelectedEdge}>
            Ortho
          </button>
        </div>
      ) : null}

      {!hudMinimized ? (
        <div className="journey-editor-hud__meta mt-2 flex flex-wrap gap-3 font-jura text-[0.72rem] text-white/60">
          <span>layout: {layoutId}</span>
          <span>container: {Math.round(containerWidth ?? 0)}px</span>
          <span>scale: {scale.toFixed(3)}</span>
          <span>
            template:{" "}
            {templateSize ? `${templateSize.width}x${templateSize.height}` : "n/a"}
          </span>
          <span>edge: {selectedEdgeKey ?? "none"}</span>
          {isStackedMobileLayout ? (
            <>
              <span>Pâ†’C gap: {effectiveParentToChildGap ?? "n/a"}</span>
              <span>Pâ†’P gap: {effectiveParentToParentGap ?? "n/a"}</span>
            </>
          ) : null}
        </div>
      ) : null}

      {!hudMinimized && isStackedMobileLayout ? (
        <div className="journey-editor-hud__card-editor mt-3 flex flex-col gap-2" aria-label="Mobile stacked gap settings">
          <div className={`journey-editor-hud__field ${hudFieldGridClassName}`}>
            <label className={hudLabelClassName} htmlFor="journey-editor-gap-parent-child">
              Pâ†’C gap
            </label>
            <input
              id="journey-editor-gap-parent-child"
              type="number"
              min={0}
              step={1}
              className={hudInputClassName}
              value={gapOverrides.parentToChildGap ?? ""}
              placeholder={String(editorToolsEnabled ? 0 : (gapDefaults?.parentToChildGap ?? ""))}
              onChange={(event) => {
                const raw = event.target.value;
                setGapOverrides((prev) => {
                  const next = { ...prev };
                  if (!raw) {
                    delete next.parentToChildGap;
                    return next;
                  }
                  const value = Math.max(0, Math.round(Number(raw)));
                  if (!Number.isFinite(value)) {
                    delete next.parentToChildGap;
                    return next;
                  }
                  next.parentToChildGap = value;
                  return next;
                });
              }}
            />
          </div>

          <div className={`journey-editor-hud__field ${hudFieldGridClassName}`}>
            <label className={hudLabelClassName} htmlFor="journey-editor-gap-parent-parent">
              Pâ†’P gap
            </label>
            <input
              id="journey-editor-gap-parent-parent"
              type="number"
              min={0}
              step={1}
              className={hudInputClassName}
              value={gapOverrides.parentToParentGap ?? ""}
              placeholder={String(editorToolsEnabled ? 0 : (gapDefaults?.parentToParentGap ?? ""))}
              onChange={(event) => {
                const raw = event.target.value;
                setGapOverrides((prev) => {
                  const next = { ...prev };
                  if (!raw) {
                    delete next.parentToParentGap;
                    return next;
                  }
                  const value = Math.max(0, Math.round(Number(raw)));
                  if (!Number.isFinite(value)) {
                    delete next.parentToParentGap;
                    return next;
                  }
                  next.parentToParentGap = value;
                  return next;
                });
              }}
            />
          </div>

          <div className="journey-editor-hud__card-actions flex justify-end gap-2">
            <button type="button" className={hudButtonPrimaryClassName} onClick={() => setGapOverrides({})}>
              Reset Gaps
            </button>
          </div>

          <div className="journey-editor-hud__hint font-jura text-[0.7rem] text-white/50">
            Pâ†’C controls spacing inside a parent group (parentâ†’child and childâ†’child). Pâ†’P is the last child â†’ next parent gap.
          </div>
        </div>
      ) : null}

      {!hudMinimized && editorClickMode === "edit" ? (
        <div className="journey-editor-hud__card-editor mt-3 flex flex-col gap-2">
          <div className={`journey-editor-hud__card-row ${hudRowGridClassName}`}>
            <label className={hudLabelClassName} htmlFor="journey-editor-selected-card">
              Card
            </label>
            <select
              id="journey-editor-selected-card"
              className={hudSelectClassName}
              value={selectedEditorCardId ?? ""}
              onChange={(event) => setSelectedEditorCardId(event.target.value || null)}
            >
              <option value="">(click a card)</option>
              {visibleItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} â€¢ {item.title ?? (item.type === "parent" ? "Parent" : "Card")}
                </option>
              ))}
            </select>
          </div>

          {selectedEditorCard ? (
            <>
              <div className={`journey-editor-hud__field ${hudFieldGridClassName}`}>
                <label className={hudLabelClassName} htmlFor="journey-editor-card-title">
                  Title
                </label>
                <input
                  id="journey-editor-card-title"
                  className={hudInputClassName}
                  value={selectedEditorCard.title ?? ""}
                  onChange={(event) =>
                    upsertCardTextOverride(selectedEditorCard.id, {
                      title: event.target.value,
                    })
                  }
                  placeholder="Titleâ€¦"
                />
              </div>

              {selectedEditorCard.type === "parent" ? (
                <div className={`journey-editor-hud__field ${hudFieldGridClassName}`}>
                  <label className={hudLabelClassName} htmlFor="journey-editor-card-modal-details">
                    Summary
                  </label>
                  <textarea
                    id="journey-editor-card-modal-details"
                    className={hudTextareaClassName}
                    value={selectedEditorCard.modalDetails ?? ""}
                    onChange={(event) =>
                      upsertCardTextOverride(selectedEditorCard.id, {
                        modalDetails: event.target.value,
                      })
                    }
                    placeholder="Parent summaryâ€¦"
                    rows={3}
                  />
                </div>
              ) : (
                <div className={`journey-editor-hud__field ${hudFieldGridClassName}`}>
                  <label className={hudLabelClassName} htmlFor="journey-editor-card-details">
                    Details
                  </label>
                  <textarea
                    id="journey-editor-card-details"
                    className={hudTextareaClassName}
                    value={selectedEditorCard.details ?? ""}
                    onChange={(event) =>
                      upsertCardTextOverride(selectedEditorCard.id, {
                        details: event.target.value,
                      })
                    }
                    placeholder="Child detailsâ€¦"
                    rows={2}
                  />
                </div>
              )}

              <div className="journey-editor-hud__card-actions flex justify-end gap-2">
                <button
                  type="button"
                  className={hudButtonPrimaryClassName}
                  onClick={() => clearCardTextOverride(selectedEditorCard.id)}
                >
                  Clear Text
                </button>
                <button type="button" className={hudButtonPrimaryClassName} onClick={resetAllCardTextOverrides}>
                  Reset Text (All)
                </button>
                <button
                  type="button"
                  className={hudButtonPrimaryClassName}
                  onClick={() => handleDeleteCard(selectedEditorCard.id)}
                >
                  Delete Card
                </button>
              </div>
            </>
          ) : (
            <div className="journey-editor-hud__hint font-jura text-[0.7rem] text-white/50">
              Click a card (or pick one) to edit its text.
            </div>
          )}
        </div>
      ) : null}

      {!hudMinimized && editorClickMode === "edit" && deletedIds.length > 0 ? (
        <div className="journey-editor-hud__deleted mt-3 flex flex-col gap-2">
          <div className={`journey-editor-hud__card-row ${hudRowGridClassName}`}>
            <label className={hudLabelClassName} htmlFor="journey-editor-deleted-card">
              Deleted
            </label>
            <select
              id="journey-editor-deleted-card"
              className={hudSelectClassName}
              value={selectedDeletedId}
              onChange={(event) => setSelectedDeletedId(event.target.value)}
            >
              <option value="">(select)</option>
              {deletedIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          <div className="journey-editor-hud__card-actions flex justify-end gap-2">
            <button
              type="button"
              className={hudButtonPrimaryClassName}
              disabled={!selectedDeletedId}
              onClick={() => selectedDeletedId && handleRestoreDeleted(selectedDeletedId)}
            >
              Restore
            </button>
            <button type="button" className={hudButtonPrimaryClassName} onClick={handleRestoreAllDeleted}>
              Restore All
            </button>
          </div>
        </div>
      ) : null}

      {!hudMinimized && selectedRenderEdge ? (
        <div className="journey-editor-hud__edge mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={hudButtonNeutralClassName}
            onClick={() => {
              const key = selectedEdgeKey;
              if (!key) return;
              const current = (selectedRenderEdge.fromAnchor as Anchor) ?? "bottom";
              setEdgeOverrides((prev) => ({
                ...prev,
                [key]: { ...(prev[key] ?? {}), fromAnchor: cycleAnchor(current) },
              }));
            }}
          >
            From: {selectedRenderEdge.fromAnchor}
          </button>
          <button
            type="button"
            className={hudButtonNeutralClassName}
            onClick={() => {
              const key = selectedEdgeKey;
              if (!key) return;
              const current = (selectedRenderEdge.toAnchor as Anchor) ?? "top";
              setEdgeOverrides((prev) => ({
                ...prev,
                [key]: { ...(prev[key] ?? {}), toAnchor: cycleAnchor(current) },
              }));
            }}
          >
            To: {selectedRenderEdge.toAnchor}
          </button>
          <button type="button" className={hudButtonNeutralClassName} onClick={handleOrthogonalizeSelectedEdge}>
            Orthogonalize
          </button>
          <div className="journey-editor-hud__hint flex-[1_1_100%] font-jura text-[0.7rem] text-white/50">
            Shift-click a line to add a point. Alt-click a point to remove. Orthogonalize snaps segments to true horizontal/vertical.
          </div>
        </div>
      ) : null}

      {!hudMinimized ? (
        <div className="journey-editor-hud__actions mt-3 flex flex-wrap gap-2">
          <button type="button" className={hudButtonPrimaryClassName} onClick={handleCopyEdits}>
            Copy Layout JSON
          </button>
          <button type="button" className={hudButtonPrimaryClassName} onClick={handleMatchAllToTemplate}>
            Match All to node1-c1
          </button>
          <button type="button" className={hudButtonPrimaryClassName} onClick={handleResetEdits}>
            Reset
          </button>
          <button type="button" className={hudButtonPrimaryClassName} onClick={() => setHudPos({ x: 0, y: 0 })}>
            HUD Reset
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
