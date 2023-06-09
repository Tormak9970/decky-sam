// Types for the global appDetailsStore

type AppDetailsStore = {
  GetAchievements(appid: number): Promise<SteamAchievement[]>
}