import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  Patch,
  ServerAPI,
  staticClasses,
} from "decky-frontend-lib";
import { VFC } from "react";
import { IoRibbonSharp } from "react-icons/io5";

import { PyInterop } from "./lib/controllers/PyInterop";
import { PluginContextProvider, PluginState, usePluginState } from "./state/PluginState";
import { PluginController } from "./lib/controllers/PluginController";
import { getLibContextMenu, libContextMenuPatch } from "./patches/GameOptionsPatch";

declare global {
  var SteamClient: SteamClient;
  var collectionStore: CollectionStore;
  var appStore: AppStore;
  var loginStore: LoginStore;
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({ }) => {
  // const { currentGame, currentGameId, setCurrentGame } = usePluginState();

  return (
    <PanelSection title="Panel Section">
      <PanelSectionRow>
        <div>Open a game's options menu to edit achievements!</div>
      </PanelSectionRow>
    </PanelSection>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  PyInterop.setServer(serverApi);

  const state = new PluginState();
  PluginController.setup(serverApi, state);

  const loginHook = PluginController.initOnLogin();

  let patchedMenu: Patch | undefined;
  getLibContextMenu().then((LibraryContextMenu) => {
    patchedMenu = libContextMenuPatch(LibraryContextMenu);
  });

  return {
    title: <div className={staticClasses.Title}>Decky SAM</div>,
    content: (
      <PluginContextProvider PluginStateClass={state}>
        <Content serverAPI={serverApi} />
      </PluginContextProvider>
    ),
    icon: <IoRibbonSharp />,
    onDismount() {
      loginHook.unregister();
      patchedMenu?.unpatch();
      // serverApi.routerHook.removeRoute("/decky-sam-editor");
      PluginController.dismount();
    },
    alwaysRender: true
  };
});
