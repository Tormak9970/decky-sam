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
import { PluginContextProvider, PluginState } from "./state/PluginState";
import { PluginController } from "./lib/controllers/PluginController";
import { getLibContextMenu, libContextMenuPatch } from "./patches/GameOptionsPatch";

declare global {
  var SteamClient: SteamClient;
  var appStore: AppStore;
  var appDetailsStore: AppDetailsStore;
  var appDetailsCache: AppDetailsCache;
  var loginStore: LoginStore;
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({ }) => {
  return (
    <PanelSection title="Usage">
      <PanelSectionRow>
        <div>Open a game's options menu to edit achievements!</div>
      </PanelSectionRow>
    </PanelSection>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  PyInterop.setServer(serverApi);

  const state = new PluginState();
  PluginController.setup(serverApi);

  const loginHook = PluginController.initOnLogin();

  let patchedMenu: Patch | undefined;
  getLibContextMenu().then((LibraryContextMenu) => {
    patchedMenu = libContextMenuPatch(LibraryContextMenu);
  });

  return {
    title: <div className={staticClasses.Title}>Decky SAM</div>,
    content: (
      <PluginContextProvider pluginStateClass={state}>
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
