import { moodOptions } from "../utils/constants";
import { MoodKey } from "../types";

interface Props {
  value: MoodKey;
  onChange: (value: MoodKey) => void;
}

export default function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="mood-picker">
      {moodOptions.map((mood) => (
        <button
          key={mood.key}
          className={`mood-btn ${value === mood.key ? "active" : ""}`}
          onClick={() => onChange(mood.key)}
        >
          <span>{mood.emoji}</span>
          <small>{mood.label}</small>
        </button>
      ))}
    </div>
  );
}
