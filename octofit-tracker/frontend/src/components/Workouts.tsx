import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason?: string };
const loadSuggestions = async () => (
  await getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona%40example.com')
).suggestions;

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions yet."
      load={loadSuggestions}
      renderItem={(suggestion) => <>{suggestion.title}{suggestion.reason ? `: ${suggestion.reason}` : ''}</>}
    />
  );
}
