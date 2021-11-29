class Toast {
  static success(message) {
    let successToast = Toast.getInstance($('#successToast'))
    $('#successMessage').text(message)
    successToast.show()
  }
}

export default Toast
