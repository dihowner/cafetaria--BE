import routeApp from "./startup/routes.js"
import logger from "./startup/logger.js"
import server from "./startup/db.js"

export default (app) => {
	logger()
	server(app)
	routeApp(app)
}
