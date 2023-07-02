import { Button, ButtonItem } from "decky-frontend-lib";
import { Fragment } from "react";

type ChangedAchievement = {
  achievement: SteamAchievement,
  isUnlocked: boolean
}

export function AchievementList({achievements, onAchievementToggle}: {achievements: ChangedAchievement[], onAchievementToggle: (id: string, isUnlocked: boolean) => void}) {
  function onClick(achievement: ChangedAchievement): void {
    achievement.isUnlocked = !achievement.isUnlocked;
    achievement.achievement.bAchieved = achievement.isUnlocked;

    onAchievementToggle(achievement.achievement.strID, achievement.isUnlocked);
  }

  return (
    <>
      {achievements.map((achievement => (
        <ButtonItem onOKButton={() => { onClick(achievement); }}>{achievement.achievement.strName}</ButtonItem>
      )))}
    </>
  );
}