/**
 * @typedef {Object} TestResult
 * @property {Boolean} failed - whether or not test failed
 * @property {String} name - name of test
 * @property {Boolean} passed - whether or not test passed
 * @property {Number} runDuration - run duration in milliseconds
 * @property {Boolean} skipped - whether or not test was skipped
 */

/**
 * Get duration in human friendly format
 * @param {Number} value - duration in milliseconds
 * @returns {String} human friendly duration
 */
function getHumanReadableDuration (value) {
  if (value < 1000) {
    return value + ' ms'
  }

  // Convert from milliseconds to seconds
  value = value / 1000

  if (value < 60) {
    return value + ' s'
  }

  // Convert from seconds to minutes
  value = value / 60

  if (value < 60) {
    return value + ' min'
  }

  // Convert from minutes to hours
  value = value / 60

  return value + ' hr'
}

/**
 * Sort tests by duration
 * @param {TestResult} a - first test
 * @param {TestResult} b - second test
 * @returns {Number} number indicating sort order
 */
function testSorter (a, b) {
  return a.result.runDuration - b.result.runDuration
}

/**
 * Write out individual test result
 * @param {Object} test - the test params
 * @param {String} test.launcher - the launcher (browser) for the test
 * @param {TestResult} test.result - test to write out result of
 * @param {Boolean} verbose - whether or not to show additional error information
 */
function testWriter (test, verbose) {
  var launcher = test.launcher
  var result = test.result

  // Other properties that may be useful: logs, error, launcherId, items
  var humanFriendlyDuration = getHumanReadableDuration(result.runDuration)
  this.out.write('[' + humanFriendlyDuration + '] [' + launcher + '] ' + result.name + '\n')

  if (verbose) {
    if (result.logs && result.logs.length !== 0) {
      this.out.write('\tLogs:\n')

      result.logs.forEach((log) => {
        this.out.write('\t\t' + log + '\n')
      })
    }

    if (result.error) {
      var e = result.error
      this.out.write('\n\tError: ' + e.message + '\n')

      if (e.stack) {
        this.out.write('\n\t\t' + e.stack.toString().replace(/\n/g, '\n\t\t') + '\n')
      }
    }
  }
}

/**
 * Write passed tests
 */
function writePassedTests () {
  if (this.passedTests.length !== 0) {
    this.out.write('PASSED TESTS\n\n')

    this.passedTests
      .sort(testSorter)
      .forEach(testWriter.bind(this))

    this.out.write('\n')
  }
}

/**
 * Write out summary of test run
 * @param {String} humanReadableDuration - human readable test run duration
 */
function writeSummary (humanReadableDuration) {
  var passed = this.pass
  var pending = this.skipped
  var total = this.total
  var failed = total - pending - passed

  this.out.write(
    'ran ' + total + ' tests in ' + humanReadableDuration + ' [' + passed +
    ' passed / ' + failed + ' failed / ' + pending + ' pending]\n\n'
  )
}

function Reporter (silent, out) {
  // Set options
  this.out = out || process.stdout
  this.silent = silent

  // Set test arrays
  this.failedTests = []
  this.passedTests = []

  // Set counters
  this.pass = 0
  this.skipped = 0
  this.total = 0

  // Other stuff
  this.endTime = null
  this.id = 1
  this.stoppedOnError = null
  this.startTime = new Date()
}

Reporter.prototype = {
  finish: function () {
    if (this.silent) {
      return
    }

    this.endTime = new Date()

    var duration = Math.round(this.endTime - this.startTime)
    var humanReadableDuration = getHumanReadableDuration(duration)

    if (this.failedTests.length === 0) {
      writeSummary.call(this, humanReadableDuration)
      writePassedTests.call(this)
    } else {
      this.out.write('\n')
    }

    writeSummary.call(this, humanReadableDuration)
  },

  report: function (prefix, data) {
    var test = {
      launcher: prefix,
      result: data
    }

    if (data.pending) {
      this.skipped++
    } else if (data.passed) {
      this.pass++
      this.passedTests.push(test)
      this.out.write('.')
    } else {
      this.out.write('\n\n')
      this.failedTests.push(test)
      testWriter.call(this, test, true)
    }

    this.total++
  }
}

module.exports = Reporter
