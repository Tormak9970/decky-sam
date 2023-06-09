import { Fragment } from "react";

type ChangedAchievement = {
  achievement: SteamAchievement,
  isUnlocked: boolean
}

export function AchievementList({achievements, onAchievementToggle}: {achievements: ChangedAchievement[], onAchievementToggle: (id: string, isUnlocked: boolean) => void}) {
  return (
    <>
      {achievements.map((achievement => (
        <div>{achievement.achievement.strName}</div>
      )))}
    </>
  );
}