import { createContext, FC, useContext, useEffect, useState } from "react";


interface PublicPluginState {
  currentGame: SteamAppOverview | null;
  currentGameId: number | null;
}

interface PublicPluginContext extends PublicPluginState {
  setCurrentGame(overview: SteamAppOverview | null): void;
}

export class PluginState {
  private currentGame: SteamAppOverview | null = null;
  private currentGameId: number | null = null;

  public eventBus = new EventTarget();

  getPublicState() {
    return {
      "currentGame": this.currentGame,
      "currentGameId": this.currentGameId
    }
  }

  setCurrentGame(overview: SteamAppOverview | null): void {
    this.currentGame = overview;

    this.currentGameId = overview ? overview.appid : null;

    this.forceUpdate();
  }

  private forceUpdate(): void {
    this.eventBus.dispatchEvent(new Event("stateUpdate"));
  }
}

const PluginContext = createContext<PublicPluginContext>(null as any);
export const usePluginState = () => useContext(PluginContext);

interface ProviderProps {
  pluginStateClass: PluginState
}

export const PluginContextProvider: FC<ProviderProps> = ({
  children,
  pluginStateClass
}) => {
  const [publicState, setPublicState] = useState<PublicPluginState>({
    ...pluginStateClass.getPublicState()
  });

  useEffect(() => {
    function onUpdate() {
      setPublicState({ ...pluginStateClass.getPublicState() });
    }

    pluginStateClass.eventBus
      .addEventListener("stateUpdate", onUpdate);

    return () => {
      pluginStateClass.eventBus
        .removeEventListener("stateUpdate", onUpdate);
    }
  }, []);

  const setCurrentGame = (overview: SteamAppOverview | null) => {
    pluginStateClass.setCurrentGame(overview);
  }

  return (
    <PluginContext.Provider
      value={{
        ...publicState,
        setCurrentGame,
      }}
    >
      {children}
    </PluginContext.Provider>
  )
}