import { ServerAPI } from "decky-frontend-lib";
import { PyInterop } from "./PyInterop";
import { SteamController } from "./SteamController";
import { History, debounce } from "../Utils";
import { PluginState } from "../../state/PluginState";

/**
 * Main controller class for the plugin.
 */
export class PluginController {
  // @ts-ignore
  private static server: ServerAPI;
  private static state: PluginState;

  private static steamController: SteamController;

  private static gameLifetimeRegister: Unregisterer;
  private static historyListener: () => void;

  /**
   * Sets the plugin's serverAPI.
   * @param server The serverAPI to use.
   * @param state The plugin state.
   */
  static setup(server: ServerAPI, state: PluginState): void {
    this.server = server;
    this.state = state;
    this.steamController = new SteamController();
  
    // ? any other init stuff here
  }

  /**
   * Sets the plugin to initialize once the user logs in.
   * @returns The unregister function for the login hook.
   */
  static initOnLogin(): Unregisterer {
    return this.steamController.registerForAuthStateChange(async (username) => {
      PyInterop.log(`User logged in. [DEBUG] username: ${username}.`);
      if (await this.steamController.waitForServicesToInitialize()) {
        PluginController.init();
      } else {
        PyInterop.toast("Error", "Failed to initialize, try restarting.");
      }
    }, null, true);
  }

  /**
   * Initializes the Plugin.
   */
  static async init(): Promise<void> {
    PyInterop.log("PluginController initialized.");
  }
  
  /**
   * Saves the changes made to the achievements of a game
   * @param achievementChanges An array of changes made to the achievements of a game.
   */
  static async commitAchievementChanges(achievementChanges: any[]): Promise<boolean> {
    return false;
  }

  /**
   * Function to run when the plugin dismounts.
   */
  static dismount(): void {
    this.gameLifetimeRegister.unregister();
    this.historyListener();
    
    PyInterop.log("PluginController dismounted.");
  }
}