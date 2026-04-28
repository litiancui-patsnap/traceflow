import type { ScenarioDraftResponse } from "../types";

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
        {loading ? "Generating..." : "Generate Scenario Draft"}
      </button>
      {draft ? (
        <div className="stack compact">
          <input
            aria-label="Draft feature name"
            value={draft.feature_name}
            onChange={(event) => onChange({ ...draft, feature_name: event.target.value })}
          />
          {draft.scenarios.map((item, index) => (
            <div key={`${item.scenario_title}-${index}`} className="stack compact draft-item">
              <div className="inline-actions">
                <strong>Draft Scenario {index + 1}</strong>
                <button type="button" className="ghost-button" onClick={() => removeItem(index)}>
                  Remove
                </button>
              </div>
              <input
                aria-label={`Draft scenario title ${index + 1}`}
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
                aria-label={`Draft scenario given ${index + 1}`}
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
                aria-label={`Draft scenario when ${index + 1}`}
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
                aria-label={`Draft scenario then ${index + 1}`}
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
              Save All Draft Scenarios
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
