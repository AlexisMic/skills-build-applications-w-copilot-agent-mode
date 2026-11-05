import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };
const loadTeams = async () => (await getJson<{ teams: Team[] }>('/api/teams')).teams;

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      emptyMessage="No teams yet."
      load={loadTeams}
      renderItem={(team) => <>{team.name} ({team.members.length} members)</>}
    />
  );
}
