(function () {
  'use strict'

  if (!window.addEventListener) return // Check for IE9+

  var options = INSTALL_OPTIONS
  var pendingRegions = options.regions
  var prevRegions = []

  var styleCont = ''
  pendingRegions.forEach(function (region) {
    styleCont += region.location + ' { opacity: 0; }\n'
  })

  var style = document.createElement('style')
  style.innerHTML = styleCont
  document.head.appendChild(style)

  function trianglify (el, reg) {
    // We need default sizes because with MutationObserver we could easily be running
    // before this element attains it's full size. We could rerender as it's children are populated,
    // but that causes the rendering to change as the page loads.

    if (reg.size < 20) { reg.size = 20 }

    var tri = window.Trianglify({
      width: window.innerWidth || 1000,
      height: window.innerHeight || 1000,
      cell_size: reg.size,
      x_colors: reg.colors,
      variance: reg.variance / 100
    })

    var svg = tri.svg()

    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    prevRegions.push([el, el.style.background, el.style.backgroundSize])

    el.style.background = "url('data:image/svg+xml;utf8," + svg.outerHTML + "') no-repeat"
    el.style.backgroundSize = 'cover'
    el.style.backgroundAttachment = 'fixed'

    // It takes a non-trivial amount of time to generate the triangles,
    // so we hide the element to prevent a flash.
    el.style.opacity = '1'
  }

  function checkNode (node) {
    if (node.nodeType !== window.Node.ELEMENT_NODE) return false

    for (var i = 0; i < pendingRegions.length; i++) {
      if (node.matches(pendingRegions[i].location)) {
        trianglify(node, pendingRegions[i])

        pendingRegions.splice(i, 1)
        i--

        return true
      }
    }

    return false
  }

  function load () {
    for (var i = 0; i < pendingRegions.length; i++) {
      var reg = pendingRegions[i]

      var els = document.querySelectorAll(reg.location)
      if (!els) continue

      for (var j = 0; j < els.length; j++) {
        trianglify(els[i], reg)
      }
    }
  };

  var observer
  if (window.MutationObserver != null) {
    observer = new window.MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var addedNodes = mutations[i].addedNodes
        for (var j = 0; j < addedNodes.length; j++) {
          if (checkNode(addedNodes[j])) {
            break
          }
        }
      }

      if (pendingRegions.length === 0 || document.readyState === 'complete') {
        observer.disconnect()
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    })
  } else {
    if (document.readyState === 'complete') {
      load()
    } else {
      document.addEventListener('DOMContentLoaded', load)
    }
  }

  window.INSTALL_SCOPE = {
    setOptions: function setOptions (nextOptions) {
      options = nextOptions

      pendingRegions = options.regions

      if (observer) {
        observer.disconnect()
      }

      for (var i = 0; i < prevRegions.length; i++) {
        prevRegions[i][0].style.background = prevRegions[i][1]
        prevRegions[i][0].style.backgroundSize = prevRegions[i][2]
      }
      prevRegions = []

      load()
    }
  }
}())
