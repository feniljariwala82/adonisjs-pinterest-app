class Helper {
  /**
   * Get cookie by name
   */
  static getCookie(name) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
  }

  /**
   * Get all the query parameters
   */
  static getQueryParams() {
    var vars = []
    var hash

    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&')
    for (var i = 0; i < hashes.length; i++) {
      hash = hashes[i].split('=')
      vars.push(hash[0])
      vars[hash[0]] = hash[1]
    }
    return vars
  }
}

export default Helper
