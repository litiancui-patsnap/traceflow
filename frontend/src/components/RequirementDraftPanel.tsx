import type { RequirementDraftResponse } from "../types";
import { copy } from "../copy";

interface RequirementDraftPanelProps {
  draft: RequirementDraftResponse | null;
  draftForm: {
    raw_input: string;
    business_context: string;
    design_hints: string;
  };
  loading: boolean;
  onDraftFormChange: (field: "raw_input" | "business_context" | "design_hints", value: string) => void;
  onGenerate: () => void;
  onDraftChange: (draft: RequirementDraftResponse) => void;
  onApplyDraft: () => void;
}

export function RequirementDraftPanel(props: RequirementDraftPanelProps) {
  const { draft, draftForm, loading, onDraftFormChange, onGenerate, onDraftChange, onApplyDraft } =
    props;

  return (
    <div className="detail-card draft-card">
      <h3>{copy.workspace.draft.requirement.title}</h3>
      <div className="stack compact">
        <textarea
          aria-label={copy.workspace.draft.requirement.rawInputLabel}
          placeholder={copy.workspace.draft.requirement.rawInputPlaceholder}
          value={draftForm.raw_input}
          onChange={(event) => onDraftFormChange("raw_input", event.target.value)}
        />
        <textarea
          aria-label={copy.workspace.draft.requirement.businessContextLabel}
          placeholder={copy.workspace.draft.requirement.businessContextPlaceholder}
          value={draftForm.business_context}
          onChange={(event) => onDraftFormChange("business_context", event.target.value)}
        />
        <textarea
          aria-label={copy.workspace.draft.requirement.designHintsLabel}
          placeholder={copy.workspace.draft.requirement.designHintsPlaceholder}
          value={draftForm.design_hints}
          onChange={(event) => onDraftFormChange("design_hints", event.target.value)}
        />
        <button type="button" onClick={onGenerate} disabled={loading}>
          {loading ? copy.workspace.draft.loading : copy.workspace.draft.requirement.generateButton}
        </button>
      </div>

      {draft ? (
        <div className="stack compact">
          <h4>{copy.workspace.draft.requirement.previewTitle}</h4>
          <input
            aria-label={copy.workspace.draft.requirement.draftTitleLabel}
            value={draft.title}
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
          />
          <textarea
            aria-label={copy.workspace.draft.requirement.draftSummaryLabel}
            value={draft.summary}
            onChange={(event) => onDraftChange({ ...draft, summary: event.target.value })}
          />
          <textarea
            aria-label={copy.workspace.draft.requirement.draftBusinessValueLabel}
            value={draft.business_value}
            onChange={(event) => onDraftChange({ ...draft, business_value: event.target.value })}
          />
          <textarea
            aria-label={copy.workspace.draft.requirement.draftAcceptanceCriteriaLabel}
            value={draft.acceptance_criteria}
            onChange={(event) =>
              onDraftChange({ ...draft, acceptance_criteria: event.target.value })
            }
          />
          <div className="inline-actions">
            <button type="button" onClick={onApplyDraft}>
              {copy.workspace.draft.requirement.applyButton}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
