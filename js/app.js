/* globals sf $ MathJax */

/* Run app when MathJax has loaded. */
MathJax.Hub.Queue(function () {
  // Unhide everything
  $('#hidden').css('visibility', '')
  sf.runApp()
})
