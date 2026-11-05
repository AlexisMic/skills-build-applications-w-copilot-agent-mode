import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Activity requires valid userId, teamId, type, and positive minutes'), { status: 400 });
  if (!input || typeof input !== 'object') throw invalidInput();

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const objectIdPattern = /^[a-f\d]{24}$/i;
  if (
    typeof userId !== 'string' ||
    !objectIdPattern.test(userId) ||
    typeof teamId !== 'string' ||
    !objectIdPattern.test(teamId) ||
    typeof type !== 'string' ||
    type.trim().length === 0 ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw invalidInput();
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Team requires a name, mascot, and valid member IDs'), { status: 400 });
  if (!input || typeof input !== 'object') throw invalidInput();

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  const objectIdPattern = /^[a-f\d]{24}$/i;
  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof mascot !== 'string' ||
    mascot.trim().length === 0 ||
    !Array.isArray(members) ||
    !members.every((member) => typeof member === 'string' && objectIdPattern.test(member))
  ) {
    throw invalidInput();
  }

  const existingMembers = await User.find({ _id: { $in: members } }).select('_id').lean();
  if (existingMembers.length !== members.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    { $lookup: { from: Activity.collection.name, localField: '_id', foreignField: 'team', as: 'activities' } },
    { $project: { _id: 0, teamName: '$name', totalPoints: { $sum: '$activities.points' } } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('fitnessGoal').lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const goalWorkouts = await Workout.find({ focus: user.fitnessGoal }).lean();
  if (goalWorkouts.length > 0) {
    return goalWorkouts.map((workout) => ({
      ...workout,
      reason: `Matches your ${user.fitnessGoal} fitness goal`,
    }));
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean();
  if (!recentActivity) return [];

  const workouts = await Workout.find({ focus: recentActivity.type }).lean();
  return workouts.map((workout) => ({
    ...workout,
    reason: `Matches your recent ${recentActivity.type} activity`,
  }));
}

export { User };
