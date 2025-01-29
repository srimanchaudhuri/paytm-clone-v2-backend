const express = require("express")
const cors = require("cors")
const { router } = require("./routes")
const PORT = 3000

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/v3", router)

app.listen(PORT, () => {
    console.log("listening on port 3000");
})