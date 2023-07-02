const { platform, arch } = process

/** @typedef {typeof import('./client.d')} Client */
/** @type {Client} */
let nativeBinding = undefined

if (platform === 'win32' && arch === 'x64') {
    nativeBinding = require('./lib/win64/steamworksjs.win32-x64-msvc.node')
} else if (platform === 'linux' && arch === 'x64') {
    nativeBinding = require('./lib/linux64/steamworksjs.linux-x64-gnu.node')
} else {
    throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`)
}

let runCallbacksInterval = undefined

/**
 * Initialize the steam client or throw an error if it fails
 * @param {number} [appId] - App ID of the game to load, if undefined, will search for a steam_appid.txt file
 * @returns {Omit<Client, 'init' | 'runCallbacks'>}
*/
module.exports.init = (appId) => {
    if (!appId) {
        throw new Error("appid required for steamworks.js")
    }

    const { init: internalInit, runCallbacks, restartAppIfNecessary, ...api } = nativeBinding

    internalInit(appId)

    clearInterval(runCallbacksInterval)
    runCallbacksInterval = setInterval(runCallbacks, 1000 / 30)

    return api
}

/**
 * @param {number} appId - App ID of the game to load
 * {@link https://partner.steamgames.com/doc/api/steam_api#SteamAPI_RestartAppIfNecessary}
 * @returns {boolean} 
 */
module.exports.restartAppIfNecessary = (appId) => nativeBinding.restartAppIfNecessary(appId);

/**
 * Enable the steam overlay on electron
 * @param {boolean} [disableEachFrameInvalidation] - Should attach a single pixel to be rendered each frame
*/

const SteamCallback = nativeBinding.callback.SteamCallback
module.exports.SteamCallback = SteamCallback