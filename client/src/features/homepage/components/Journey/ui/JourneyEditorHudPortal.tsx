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

  return createPortal(
    <div
      ref={hudRefCallback}
      className={`journey-editor-hud ${hudMinimized ? "journey-editor-hud--minimized" : ""}`}
    >
      <div
        className="journey-editor-hud__drag-grip"
        onPointerDown={onHudPointerDown}
        onPointerMove={onHudPointerMove}
        onPointerUp={onHudPointerUp}
        aria-label="Drag editor panel"
        role="presentation"
      />

      <div className="journey-editor-hud__title-row">
        <div className="journey-editor-hud__title">Journey Edit Mode</div>
        <div className="journey-editor-hud__title-actions">
          <button
            type="button"
            className="journey-editor-hud__mini-toggle"
            onClick={() => setHudMinimized((prev) => !prev)}
            aria-label={hudMinimized ? "Expand editor panel" : "Minimize editor panel"}
          >
            {hudMinimized ? "Expand" : "Minimize"}
          </button>
        </div>
      </div>

      <div className="journey-editor-hud__mode-row">
        <label className="journey-editor-hud__label" htmlFor="journey-editor-click-mode">
          Click
        </label>
        <select
          id="journey-editor-click-mode"
          className="journey-editor-hud__select"
          value={editorClickMode}
          onChange={(event) => onEditorClickModeChange(event.target.value as "modal" | "edit")}
        >
          <option value="modal">Modal</option>
          <option value="edit">Edit</option>
        </select>
      </div>

      {hudMinimized ? (
        <div className="journey-editor-hud__mini-meta" aria-label="Selection summary">
          <div className="journey-editor-hud__mini-meta-row">
            <span className="journey-editor-hud__mini-meta-key">Card</span>
            <span className="journey-editor-hud__mini-meta-value">
              {selectedEditorCard?.id ?? "none"}
            </span>
          </div>
          <div className="journey-editor-hud__mini-meta-row">
            <span className="journey-editor-hud__mini-meta-key">Size</span>
            <span className="journey-editor-hud__mini-meta-value">
              {selectedEditorCardSize
                ? `${selectedEditorCardSize.width}x${selectedEditorCardSize.height}`
                : "n/a"}
            </span>
          </div>
        </div>
      ) : null}

      {hudMinimized && selectedRenderEdge ? (
        <div className="journey-editor-hud__mini-actions">
          <button type="button" onClick={handleOrthogonalizeSelectedEdge}>
            Ortho
          </button>
        </div>
      ) : null}

      {!hudMinimized ? (
        <div className="journey-editor-hud__meta">
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
        <div className="journey-editor-hud__card-editor" aria-label="Mobile stacked gap settings">
          <div className="journey-editor-hud__field">
            <label className="journey-editor-hud__label" htmlFor="journey-editor-gap-parent-child">
              Pâ†’C gap
            </label>
            <input
              id="journey-editor-gap-parent-child"
              type="number"
              min={0}
              step={1}
              className="journey-editor-hud__input"
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

          <div className="journey-editor-hud__field">
            <label className="journey-editor-hud__label" htmlFor="journey-editor-gap-parent-parent">
              Pâ†’P gap
            </label>
            <input
              id="journey-editor-gap-parent-parent"
              type="number"
              min={0}
              step={1}
              className="journey-editor-hud__input"
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

          <div className="journey-editor-hud__card-actions">
            <button type="button" onClick={() => setGapOverrides({})}>
              Reset Gaps
            </button>
          </div>

          <div className="journey-editor-hud__hint">
            Pâ†’C controls spacing inside a parent group (parentâ†’child and childâ†’child). Pâ†’P is the last child â†’ next parent gap.
          </div>
        </div>
      ) : null}

      {!hudMinimized && editorClickMode === "edit" ? (
        <div className="journey-editor-hud__card-editor">
          <div className="journey-editor-hud__card-row">
            <label className="journey-editor-hud__label" htmlFor="journey-editor-selected-card">
              Card
            </label>
            <select
              id="journey-editor-selected-card"
              className="journey-editor-hud__select"
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
              <div className="journey-editor-hud__field">
                <label className="journey-editor-hud__label" htmlFor="journey-editor-card-title">
                  Title
                </label>
                <input
                  id="journey-editor-card-title"
                  className="journey-editor-hud__input"
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
                <div className="journey-editor-hud__field">
                  <label
                    className="journey-editor-hud__label"
                    htmlFor="journey-editor-card-modal-details"
                  >
                    Summary
                  </label>
                  <textarea
                    id="journey-editor-card-modal-details"
                    className="journey-editor-hud__textarea"
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
                <div className="journey-editor-hud__field">
                  <label className="journey-editor-hud__label" htmlFor="journey-editor-card-details">
                    Details
                  </label>
                  <textarea
                    id="journey-editor-card-details"
                    className="journey-editor-hud__textarea"
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

              <div className="journey-editor-hud__card-actions">
                <button type="button" onClick={() => clearCardTextOverride(selectedEditorCard.id)}>
                  Clear Text
                </button>
                <button type="button" onClick={resetAllCardTextOverrides}>
                  Reset Text (All)
                </button>
                <button type="button" onClick={() => handleDeleteCard(selectedEditorCard.id)}>
                  Delete Card
                </button>
              </div>
            </>
          ) : (
            <div className="journey-editor-hud__hint">Click a card (or pick one) to edit its text.</div>
          )}
        </div>
      ) : null}

      {!hudMinimized && editorClickMode === "edit" && deletedIds.length > 0 ? (
        <div className="journey-editor-hud__deleted">
          <div className="journey-editor-hud__card-row">
            <label className="journey-editor-hud__label" htmlFor="journey-editor-deleted-card">
              Deleted
            </label>
            <select
              id="journey-editor-deleted-card"
              className="journey-editor-hud__select"
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

          <div className="journey-editor-hud__card-actions">
            <button
              type="button"
              disabled={!selectedDeletedId}
              onClick={() => selectedDeletedId && handleRestoreDeleted(selectedDeletedId)}
            >
              Restore
            </button>
            <button type="button" onClick={handleRestoreAllDeleted}>
              Restore All
            </button>
          </div>
        </div>
      ) : null}

      {!hudMinimized && selectedRenderEdge ? (
        <div className="journey-editor-hud__edge">
          <button
            type="button"
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
          <button type="button" onClick={handleOrthogonalizeSelectedEdge}>
            Orthogonalize
          </button>
          <div className="journey-editor-hud__hint">
            Shift-click a line to add a point. Alt-click a point to remove. Orthogonalize snaps segments to true horizontal/vertical.
          </div>
        </div>
      ) : null}

      {!hudMinimized ? (
        <div className="journey-editor-hud__actions">
          <button type="button" onClick={handleCopyEdits}>
            Copy Layout JSON
          </button>
          <button type="button" onClick={handleMatchAllToTemplate}>
            Match All to node1-c1
          </button>
          <button type="button" onClick={handleResetEdits}>
            Reset
          </button>
          <button type="button" onClick={() => setHudPos({ x: 0, y: 0 })}>
            HUD Reset
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

