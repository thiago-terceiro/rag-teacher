import { useSteps } from '../hooks/useSteps';
import ProgressRing from './ProgressRing';

const StatsBar = () => {
  const { stats, loading } = useSteps();

  if (loading) {
    return <div className="h-16 border-b border-border flex items-center px-6">Loading stats...</div>;
  }

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6">
      <div className="text-lg font-semibold">Your Progress</div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <ProgressRing value={stats.completionPercentage} />
          <span className="text-lg">{stats.completionPercentage}% Complete</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {stats.completedSteps} / {stats.totalSteps} steps
        </div>
      </div>
    </header>
  );
};

export default StatsBar;
