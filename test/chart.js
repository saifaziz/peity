var child_process = require('child_process')
  , queue = require('queue-async')
  , charts = require('./charts.json')
  , screenshot = __dirname + '/bin/screenshot'
  , port

var path = function(subdir) {
  return function(id) {
    return __dirname + '/' + subdir + '/' + id + '.png'
  }
}

var comparisonPath = path('comparisons')
  , fixturePath = path('fixtures')
  , imagePath = path('images')

var Chart = function(id) {
  this.id = id

  var obj = charts[id]

  this.height = obj.height
  this.opts = obj.opts
  this.text = obj.text
  this.type = obj.type
  this.width = obj.width

  this.fixturePath = fixturePath(id)
  this.imagePath = imagePath(id)
  this.comparisonPath = comparisonPath(id)
}

Chart.prototype.compare = function(callback) {
  var command = [
    'compare -metric AE',
    this.fixturePath,
    this.imagePath,
    this.comparisonPath
  ].join(' ')

  console.log(command)

  child_process.exec(command, function(err, stdout, stderr) {
    console.log(err, stdout, stderr)

    if (err) {
      if (err.code == 1) {
        // `compare` exits with 1 if the images are not identical.
        err = undefined
      } else {
        throw err
      }
    }

    var diff = parseInt(stderr)

    callback(err, diff)
  })
}

Chart.prototype.optionsString = function() {
  switch(typeof this.opts) {
    case 'object':
      return JSON.stringify(this.opts)
    case 'string':
      return this.opts
    default:
      return '{}'
  }
}

Chart.prototype.screenshot = function(savePath, callback) {
  queue(1)
    .defer(child_process.execFile, screenshot, [
      this.url(),
      savePath,
      this.width,
      this.height
    ])
    .await(callback)
}

Chart.prototype.url = function() {
  return 'http://localhost:' + port + '/charts/' + this.id
}

exports.find = function(id) {
  return charts[id] ? new Chart(id) : null
}

exports.forEach = function(callback) {
  return Object.keys(charts).forEach(function(id) {
    callback(new Chart(id))
  })
}

exports.port = function(number) {
  port = number
}
