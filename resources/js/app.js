import '@fortawesome/fontawesome-free/css/all.css'
import '../scss/app.scss'
import 'bootstrap/dist/js/bootstrap.esm'
import 'masonry-layout/dist/masonry.pkgd.min.js'
import jquery from 'jquery'
import { Toast, Modal } from 'bootstrap'
import helper from './helper'
import staticToast from './StaticToast'

window.$ = jquery
window.Toast = Toast
window.helper = helper
window.Modal = Modal
window.toast = staticToast
