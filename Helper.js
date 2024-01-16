class Helper {
  static getDiscoveredGems = ({ previousGems, latestGems }) => {
    let discoveredGems = []
    let set = new Set(previousGems.map((p) => p.token))
    if (latestGems) {
      discoveredGems = latestGems.filter((x) => !set.has(x.token))
    }
    return discoveredGems
  }
}

module.exports = { Helper }
