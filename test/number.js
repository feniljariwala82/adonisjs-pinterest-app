const num = 0

const some = () => {
  if (num === 0) {
    try {
      throw new Error('Message here')
    } catch (error) {
      throw error
    }
  }
}

;(() => {
  try {
    const result = some()
    console.log(result)
  } catch (error) {
    console.error(error.message)
  }
})()
