class Helper {
  static getDiscoveredGems = ({ previousGems, latestGems }) => {
    let set = new Set(previousGems.map((p) => p.token))
    const newArray = latestGems.filter((x) => !set.has(x.token))
    return newArray
  }
}

module.exports = { Helper }
