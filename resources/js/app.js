import '@fortawesome/fontawesome-free/css/all.css'
import { Modal, Toast } from 'bootstrap'
import 'bootstrap/dist/js/bootstrap.esm'
import 'masonry-layout/dist/masonry.pkgd.min.js'
import '../scss/app.scss'
import helper from './helper'
import StaticToast from './StaticToast'
import SpinnerClass from './spinner'

window.Toast = Toast
window.helper = helper
window.Modal = Modal
window.toast = StaticToast
window.spinner = SpinnerClass
