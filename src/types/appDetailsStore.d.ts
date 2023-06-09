// Types for the global appDetailsStore

type AppDetailsStore = {
  GetAppData(appid: number): SteamAppData,
  GetAchievements(appid: number): Promise<SteamAppAchievements>
}