const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const app = express()
app.use(express.json())
app.use(cors({ credentials: true }))
app.use(cookieParser())
module.exports = app