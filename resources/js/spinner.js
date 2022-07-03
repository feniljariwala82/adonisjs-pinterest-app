class SpinnerClass {
  static startLoading = () => {
    const $spinner = $('#spinner')
    $spinner.addClass('show')
  }

  static stopLoading = () => {
    const $spinner = $('#spinner')
    $spinner.removeClass('show')
  }
}

export default SpinnerClass
