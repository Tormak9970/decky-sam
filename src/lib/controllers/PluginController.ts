import { ServerAPI } from "decky-frontend-lib";
import { PyInterop } from "./PyInterop";
import { SteamController } from "./SteamController";

/**
 * Main controller class for the plugin.
 */
export class PluginController {
  // @ts-ignore
  private static server: ServerAPI;

  private static steamController: SteamController;

  private static gameLifetimeRegister: Unregisterer;
  private static historyListener: () => void;

  /**
   * Sets the plugin's serverAPI.
   * @param server The serverAPI to use.
   */
  static setup(server: ServerAPI): void {
    this.server = server;
    this.steamController = new SteamController();
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
   * Gets the details for the provided app.
   * @param appid The id of the app to get the details of.
   * @returns A promise resolving to the app's details, or null if failed.
   */
  static async getAppDetails(appid: number): Promise<SteamAppDetails | null> {
    return await PluginController.steamController.getAppDetails(appid);
  }

  /**
   * Gets the achievements for the provided app.
   * @param appid The id of the app to get achievements for.
   * @returns A promise resolving to the app's achievements.
   */
  static async getAchievementsForApp(appid: number): Promise<SteamAppAchievements> {
    return await PluginController.steamController.getAllAchievementsForApp(appid);
  }
  
  /**
   * Saves the changes made to the achievements of a game
   * @param appid The id of the app to update the achievements of.
   * @param achievementChanges The changed achievements.
   * @returns A promise resolving to a boolean indicating if the changes were saved successfully.
   */
  static async commitAchievementChanges(appid: number, changedAchievements: SteamAppAchievements): Promise<boolean> {
    return PluginController.steamController.setAchievements(appid, changedAchievements);
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