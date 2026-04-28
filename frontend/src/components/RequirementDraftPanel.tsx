import type { RequirementDraftResponse } from "../types";

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
      <h3>AI Requirement Draft</h3>
      <div className="stack compact">
        <textarea
          aria-label="Raw business input"
          placeholder="Raw business input"
          value={draftForm.raw_input}
          onChange={(event) => onDraftFormChange("raw_input", event.target.value)}
        />
        <textarea
          aria-label="Business context"
          placeholder="Business context"
          value={draftForm.business_context}
          onChange={(event) => onDraftFormChange("business_context", event.target.value)}
        />
        <textarea
          aria-label="Design hints"
          placeholder="Design hints"
          value={draftForm.design_hints}
          onChange={(event) => onDraftFormChange("design_hints", event.target.value)}
        />
        <button type="button" onClick={onGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Requirement Draft"}
        </button>
      </div>

      {draft ? (
        <div className="stack compact">
          <h4>Draft Preview</h4>
          <input
            aria-label="Draft requirement title"
            value={draft.title}
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
          />
          <textarea
            aria-label="Draft requirement summary"
            value={draft.summary}
            onChange={(event) => onDraftChange({ ...draft, summary: event.target.value })}
          />
          <textarea
            aria-label="Draft requirement business value"
            value={draft.business_value}
            onChange={(event) => onDraftChange({ ...draft, business_value: event.target.value })}
          />
          <textarea
            aria-label="Draft requirement acceptance criteria"
            value={draft.acceptance_criteria}
            onChange={(event) =>
              onDraftChange({ ...draft, acceptance_criteria: event.target.value })
            }
          />
          <div className="inline-actions">
            <button type="button" onClick={onApplyDraft}>
              Use Draft in Form
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
