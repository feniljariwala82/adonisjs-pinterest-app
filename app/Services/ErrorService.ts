class ErrorService {
  /**
   * @description this method collects form errors and returns them as an string array
   * @param error form errors to be filtered
   */
  public static filterMessages(error: any) {
    let labels: Array<string> = []
    let errorMessages: string = ''

    // if form validation error exists
    if (error.messages && error.messages.errors) {
      error.messages.errors.map((item) => {
        if (!labels.includes(item.field)) {
          labels.push(item.field)
          // if error text is empty
          if (!errorMessages) {
            errorMessages = item.message
          } else {
            errorMessages += ', ' + item.message
          }
        }
      })
      return errorMessages
    } else {
      // if there are no form errors
      return null
    }
  }
}

export default ErrorService
