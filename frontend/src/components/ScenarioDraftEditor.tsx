import type { ScenarioDraftResponse } from "../types";
import { copy } from "../copy";

interface ScenarioDraftEditorProps {
  draft: ScenarioDraftResponse | null;
  loading: boolean;
  onGenerate: () => void;
  onChange: (draft: ScenarioDraftResponse | null) => void;
  onSaveAll: () => void;
}

export function ScenarioDraftEditor(props: ScenarioDraftEditorProps) {
  const { draft, loading, onGenerate, onChange, onSaveAll } = props;

  function removeItem(index: number) {
    if (!draft) return;
    const scenarios = draft.scenarios.filter((_, itemIndex) => itemIndex !== index);
    onChange(scenarios.length ? { ...draft, scenarios } : null);
  }

  return (
    <>
      <button type="button" onClick={onGenerate} disabled={loading}>
        {loading ? copy.workspace.draft.loading : copy.workspace.draft.scenario.generateButton}
      </button>
      {draft ? (
        <div className="stack compact">
          <input
            aria-label={copy.workspace.draft.scenario.featureNameLabel}
            value={draft.feature_name}
            onChange={(event) => onChange({ ...draft, feature_name: event.target.value })}
          />
          {draft.scenarios.map((item, index) => (
            <div key={`${item.scenario_title}-${index}`} className="stack compact draft-item">
              <div className="inline-actions">
                <strong>{copy.workspace.draft.scenario.itemTitle(index + 1)}</strong>
                <button type="button" className="ghost-button" onClick={() => removeItem(index)}>
                  {copy.workspace.draft.scenario.removeButton}
                </button>
              </div>
              <input
                aria-label={copy.workspace.draft.scenario.titleLabel(index + 1)}
                value={item.scenario_title}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    scenarios: draft.scenarios.map((scenario, itemIndex) =>
                      itemIndex === index
                        ? { ...scenario, scenario_title: event.target.value }
                        : scenario,
                    ),
                  })
                }
              />
              <textarea
                aria-label={copy.workspace.draft.scenario.givenLabel(index + 1)}
                value={item.given_text || ""}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    scenarios: draft.scenarios.map((scenario, itemIndex) =>
                      itemIndex === index ? { ...scenario, given_text: event.target.value } : scenario,
                    ),
                  })
                }
              />
              <textarea
                aria-label={copy.workspace.draft.scenario.whenLabel(index + 1)}
                value={item.when_text || ""}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    scenarios: draft.scenarios.map((scenario, itemIndex) =>
                      itemIndex === index ? { ...scenario, when_text: event.target.value } : scenario,
                    ),
                  })
                }
              />
              <textarea
                aria-label={copy.workspace.draft.scenario.thenLabel(index + 1)}
                value={item.then_text || ""}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    scenarios: draft.scenarios.map((scenario, itemIndex) =>
                      itemIndex === index ? { ...scenario, then_text: event.target.value } : scenario,
                    ),
                  })
                }
              />
            </div>
          ))}
          {draft.scenarios.length ? (
            <button type="button" onClick={onSaveAll}>
              {copy.workspace.draft.scenario.saveAllButton}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
