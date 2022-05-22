const Constants = {
  allyType: {
    GOOGLE: 'google',
    GITHUB: 'github',
    FACEBOOK: 'facebook',
  },
  regex: {
    passwordRegex: /^(?=.{8,}$)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?\W).*$/,
  },
}

export default Constants
