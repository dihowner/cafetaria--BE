import mongoose from "mongoose"
import winston from "winston"
import {config} from "../utility/config.js"

export default async (app) => {
	const name = config.APP_NAME
	const host = config.HOST || "0.0.0.0"
	const port = config.PORT || 5000

	try {
		mongoose.set("strictQuery", false)
		mongoose.connect(config.DB_URL)
		winston.info(`${name} is connected to DB`)

		app.listen(port, host, () => {
			winston.info(`${name}'s Server started at http://${host}:${port}`)
		})
	} catch (error) {
		winston.error(error)
	}
}
