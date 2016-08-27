
const config = require('config')
const moment = require('moment')
const router = require('express').Router()
const client = require('../services').GoogleClientFactory.getClient()

const CELL_MESSAGE = 0
const CELL_AUTHOR = 1
const CELL_AUTHOR_EMAIL = 2
const CELL_DATE_SUBMITTED = 3
const CELL_PUBLISHED = 4

const KEY_MESSAGE = 'message'
const KEY_AUTHOR = 'author'
const KEY_AUTHOR_EMAIL = 'author_email'
const KEY_DATE_SUBMITTED = 'date_submitted'
const KEY_PUBLISHED = 'published'

const DATE_FORMAT = 'YYYY-MM-DD'

const DEFAULT_PUBLISH = false

function toBoolean (value) {
  switch (typeof value) {
    case 'string':
      return value.toLowerCase() === 'true'
      break
    case 'boolean':
      return value
      break
    default:
      return false
  }
}

function hasMessage (cell) {
    const message = cell[CELL_MESSAGE]
    return typeof message === 'string' && message.trim() !== ''
}

function formatPost (cell) {
  const post = {}

  post[KEY_MESSAGE] = cell[CELL_MESSAGE]
  post[KEY_AUTHOR] = cell[CELL_AUTHOR]
  post[KEY_DATE_SUBMITTED] = cell[CELL_DATE_SUBMITTED]
  post[KEY_PUBLISHED] = toBoolean(cell[CELL_PUBLISHED])

  return post
}

function filterPublished (cell) {
  return toBoolean(cell[CELL_PUBLISHED]) && hasMessage(cell)
}

router.post('/:project', (req, res, next) => {
  const author = req.body[KEY_AUTHOR] || ""
  const authorEmail = req.body[KEY_AUTHOR_EMAIL] || ""
  const message = req.body[KEY_MESSAGE] || ""
  const submitted = moment().format(DATE_FORMAT)
  const published = req.project.default_publish || DEFAULT_PUBLISH
  const data = [
    message,
    author,
    authorEmail,
    submitted,
    published
  ]

  client.addValuesToSpreadsheet(req.project.spreadsheet_id, req.project.worksheet_name, [data]).then((result) => {
    res.status(200).send({
      'status': 'ok',
      'count': result.updates.updatedRows,
      'post': formatPost(data)
    })
  }).then(next).catch(next)
})

router.get('/:project', (req, res, next) => {
  const options = {
    filter: filterPublished,
    format: formatPost
  }

  client.getValuesFromSpreadsheet(req.project.spreadsheet_id,
    req.project.spreadsheet_start, req.project.spreadsheet_end, options
  ).then((result) => {
    res.status(200).send({
      'status': 'ok',
      'count': result.data.length,
      'posts': result.data.reverse()
    })
  }).then(next).catch(next)
})

router.param('project', (req, res, next, project) => {
  const projects = config.get('Projects')

  if (!projects[project]) {
    res.status(404)
    return next(new Error(`Invalid project: ${project}`))
  }

  req.project = projects[project]

  next()
})

module.exports = router
