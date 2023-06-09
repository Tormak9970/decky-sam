import { ButtonItem, Focusable, ModalRoot, PanelSectionRow } from "decky-frontend-lib";
import { useState, Fragment, useEffect } from "react";
import { ChangedAchievement, PluginController } from "../lib/controllers/PluginController";

export function AllThemesModalRoot({ gameAppId, closeModal }: { gameAppId: number, closeModal: any }) {
  return (
    <ModalRoot onCancel={closeModal} onEscKeypress={closeModal} bAllowFullSize >
      <AchievementManagerModal gameAppId={gameAppId} closeModal={closeModal} />
    </ModalRoot>
  );
}

export function AchievementManagerModal({
  gameAppId,
  closeModal,
}: {
  gameAppId: number,
  closeModal: any
}) {
  let currentGame: any = null; //TODO get this from appController

  const [achievements, setAchievements] = useState<SteamAppAchievements[]>([]); //TODO fetch themes

  const changedAchievements: ChangedAchievement[] = [];

  function commitChanges(): void {

  }

  useEffect(() => {
    PluginController.getAppOverview(gameAppId).then((appOverview) => {
      currentGame = appOverview;
    });

    PluginController.getAchievementsForApp(gameAppId).then((achievements) => {
      console.log(achievements)
    })
  });

  return (
    <>
      <h1 style={{ marginBlockEnd: "10px", marginBlockStart: "0px" }}>Achievements for {currentGame ? currentGame.display_name : "Placeholder"}</h1>
      <style>
        {`
          
        `}
      </style>
      <Focusable style={{ display: "flex", flexDirection: "column" }}>
        {/* TODO: list out achievement entries */}
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