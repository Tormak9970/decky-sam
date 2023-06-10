import { ButtonItem, Focusable, ModalRoot, PanelSectionRow } from "decky-frontend-lib";
import { useState, Fragment, useEffect } from "react";
import { PluginController } from "../lib/controllers/PluginController";
import { AchievementList } from "./AchievementList";
import { PyInterop } from "../lib/controllers/PyInterop";

type ChangedAchievement = {
  achievement: SteamAchievement,
  isUnlocked: boolean
}

export function AllThemesModalRoot({ gameAppId, closeModal }: { gameAppId: number, closeModal: any }) {
  return (
    <ModalRoot onCancel={closeModal} onEscKeypress={closeModal} bAllowFullSize >
      <AchievementManagerModal gameAppId={gameAppId} closeModal={closeModal} />
    </ModalRoot>
  );
}

export function AchievementManagerModal({ gameAppId, closeModal }: { gameAppId: number, closeModal: any }) {
  let currentGame: any = null;

  const [achievements, setAchievements] = useState<ChangedAchievement[]>([]);

  function toggleAchievement(achievementID: string, isUnlocked: boolean): void {
    const updatedAchievements = [...achievements];
    updatedAchievements.find(achievement => achievement.achievement.strID == achievementID)!.isUnlocked = isUnlocked;
    setAchievements(updatedAchievements);
  }

  async function commitChanges(): Promise<void> {
    const vecHighlight: SteamAchievement[] = [];
    const vecUnachieved: SteamAchievement[] = [];

    for (const entry of achievements) {
      if (entry.isUnlocked) {
        vecHighlight.push(entry.achievement);
      } else {
        vecUnachieved.push(entry.achievement);
      }
    }
    
    const nAchieved = vecHighlight.length;
    const nTotal = achievements.length;

    const appAchievements: SteamAppAchievements = {
      nAchieved: nAchieved,
      nTotal: nTotal,
      vecAchievedHidden: [],
      vecHighlight: vecHighlight,
      vecUnachieved: vecUnachieved
    };

    const success = await PluginController.commitAchievementChanges(gameAppId, appAchievements);

    if (success) {
      PyInterop.log("Saved changes to achievements.");
      PyInterop.toast("Decky SAM", "Saved achievement changes.");
    } else {
      PyInterop.log("Failed to save changes to achievements.");
      PyInterop.toast("Decky SAM", "Failed to save achievement changes.");
    }
  }

  useEffect(() => {
    PluginController.getAppDetails(gameAppId).then((appDetails) => {
      currentGame = appDetails;
    });

    PluginController.getAchievementsForApp(gameAppId).then((achievements) => {
      console.log("Achievements recieved:", achievements);
      
      const entries: ChangedAchievement[] = [];

      for (const unlocked of [...achievements.vecHighlight, ...achievements.vecAchievedHidden]) {
        entries.push({
          achievement: unlocked,
          isUnlocked: true
        });
      }

      for (const unlocked of achievements.vecUnachieved) {
        entries.push({
          achievement: unlocked,
          isUnlocked: false
        });
      }

      setAchievements(entries.sort((a, b) => a.achievement.strName.localeCompare(b.achievement.strName)));
    });
  }, []);

  return (
    <>
      <h1 style={{ marginBlockEnd: "10px", marginBlockStart: "0px" }}>Achievements for {currentGame ? currentGame.display_name : "Placeholder"}</h1>
      <style>
        {`
          
        `}
      </style>
      <Focusable style={{ display: "flex", flexDirection: "column" }}>
        <AchievementList achievements={achievements} onAchievementToggle={toggleAchievement} />
      </Focusable>
      <PanelSectionRow>
        <ButtonItem layout="below" bottomSeparator="standard" onClick={commitChanges} >
          Commit Changes
        </ButtonItem>
        <ButtonItem layout="below" onClick={closeModal} >
          Cancel
        </ButtonItem>
      </PanelSectionRow>
    </>
  );
}